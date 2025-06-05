from flask import Blueprint, jsonify, request
from app.models.module_assignment import ModuleAssignment
from app.models.module import Module
from app.models.users import User
from app.models.chat_history import ChatHistory
from app.models.chat_message import ChatMessage
from app.models.chatbot_settings import ChatbotSettings
from app.db import db
from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, PointIdsList
import os
import uuid
from dotenv import load_dotenv
from docx import Document 
from io import BytesIO
import traceback
from datetime import datetime
from langchain.schema import HumanMessage
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import Qdrant

chatbot_bp = Blueprint('chatbot', __name__)
UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

load_dotenv()

def get_qdrant_client():
    return QdrantClient(
        url=os.getenv("QDRANT_HOST"),
        api_key=os.getenv("QDRANT_API_KEY"),
        prefer_grpc=False,
        https=True,
        timeout=10.0,
        check_compatibility=False
    )

# Function to tag document from qdrant
def tag_document_to_qdrant(module_id: str, file_content: str, filename: str):
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vector = embeddings.embed_query(file_content)
    vector_size = len(vector)
    
    client = get_qdrant_client()
    collection_name = f"module_{module_id}"

    # Create collection if missing
    if collection_name not in [c.name for c in client.get_collections().collections]:
        client.recreate_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )

    point_id = str(uuid.uuid4())

    point = PointStruct(
        id=point_id,
        vector=vector,
        payload={"filename": filename, "text": file_content}
    )

    print("📌 Point created, sending to Qdrant...")
    result = client.upsert(collection_name=collection_name, points=[point])
    print("Qdrant upsert result:", result)

    return point_id

# Function to untag document from qdrant
def untag_document_from_qdrant(module_id: str, point_id: str):
    client = get_qdrant_client()
    collection_name = f"module_{module_id}"

    print(f"🧹 Removing point {point_id} from collection {collection_name}...")
    result = client.delete(collection_name=collection_name,points_selector=PointIdsList(points=[point_id]))
    print("🗑️ Qdrant delete result:", result)

@chatbot_bp.route('/get-model-settings/<module_id>', methods=['GET'])
def get_model_settings(module_id):
    try:
        # Get LLM settings from sql
        settings = ChatbotSettings.query.filter_by(moduleID=module_id).first()
        if not settings:
            return jsonify({'error': 'Settings not found'}), 404

        # Initialize Qdrant client (need change depending on setup)
        client = get_qdrant_client()
        collection_name = f"module_{module_id}"

        try:
            # Get all documents from the module's collection
            documents = client.scroll(
                collection_name=collection_name,
            )[0]

            # Format documents for frontend
            formatted_docs = [{
                'id': str(doc.id),
                'name': doc.payload.get('filename'),
            } for doc in documents]

        except Exception as e:
            print(f"Error fetching from Qdrant: {str(e)}")
            formatted_docs = []

        return jsonify({
            'settings': {
                'model': settings.model,
                'temperature': settings.temperature,
                'systemPrompt': settings.system_prompt,
                'maxTokens': settings.max_tokens,
            },
            'documents': formatted_docs
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@chatbot_bp.route('/save-model-settings', methods=['PUT'])
def save_model_settings():
    try:
        data = request.json
        module_id = data.get('moduleID')
        
        # Save chatbot settings to MySQL
        settings = ChatbotSettings.query.filter_by(moduleID=module_id).first()
        if not settings:
            settings = ChatbotSettings(moduleID=module_id)
        
        settings.model = data.get('model')
        settings.temperature = data.get('temperature')
        settings.system_prompt = data.get('systemPrompt')
        settings.max_tokens = data.get('maxTokens')
        
        db.session.add(settings)
        db.session.commit()
    

        return jsonify({
            "status": "success",
            "message": "Settings saved successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    
# Tag Document Route
@chatbot_bp.route('/tag-document', methods=['POST'])
def tag_document():
    try:
        print("📥 Received request to /tag-document")
        module_id = request.form.get("moduleID")
        file = request.files.get("file")

        if not module_id or not file:
            return jsonify({"error": "Missing moduleID or file"}), 400

        # Can handle .txt / .docx currently, need add more
        if file.filename.lower().endswith(".docx"):
            docx_io = BytesIO(file.read())
            doc = Document(docx_io)
            content = "\n".join([para.text for para in doc.paragraphs])
        else:
            content = file.read().decode("utf-8")

        point_id = tag_document_to_qdrant(module_id, content, file.filename)

        return jsonify({
            "status": "success",
            "point_id": point_id,
            "filename": file.filename,
        }), 200

    except Exception as e:
        print("❌ EXCEPTION in /tag-document route:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

# Untag Document Route
@chatbot_bp.route('/untag-document', methods=['POST'])
def untag_document():
    try:
        print("📥 Received request to /untag-document")
        data = request.get_json()
        module_id = data.get("moduleID")
        doc_id = data.get("docID")

        if not module_id or not doc_id:
            return jsonify({"error": "Missing moduleID or docID"}), 400

        untag_document_from_qdrant(module_id, doc_id)

        return jsonify({"status": "success"}), 200

    except Exception as e:
        print("❌ EXCEPTION in /untag-document route:", str(e))
        return jsonify({"error": str(e)}), 500




@chatbot_bp.route('/send-message', methods=['POST'])
def send_message():
    try:
        data = request.get_json()

        chat_id = data.get("chat_id")  
        user_message = data.get("message")
        module_id = data.get("module_id")
        model_override = data.get("model")
        user_id = data.get("user_id")  

        if not module_id or not user_message:
            return jsonify({"error": "module_id and message are required"}), 400

        # For the first message, create a new chat session.
        if not chat_id:
            if not user_id:
                return jsonify({"error": "user_id is required for first message"}), 400
            assignment = ModuleAssignment.query.filter_by(userID=user_id, moduleID=str(module_id)).first()
            if not assignment:
                return jsonify({"error": "No assignment found for the given user and module"}), 404
            new_chat = ChatHistory(
                assignmentID=assignment.assignmentID,
                chatlog="",  # Will be replaced.
                dateStarted=datetime.utcnow()
            )
            db.session.add(new_chat)
            db.session.commit()
            chat_id = new_chat.historyID
            chat_session = new_chat
        else:
            chat_session = ChatHistory.query.filter_by(historyID=chat_id).first()
            if not chat_session:
                return jsonify({"error": "Chat session not found"}), 404

        # Get model settings.
        settings = ChatbotSettings.query.filter_by(moduleID=str(module_id)).first()
        if not settings:
            return jsonify({"error": "Model settings not found for this module"}), 404

        if model_override:
            settings.model = model_override

        if settings.system_prompt:
            system_context = f"System Context: {settings.system_prompt}\n\n"

        # Build conversation history from previous messages.
        previous_messages = (
            db.session.query(ChatMessage)
            .filter_by(chatID=chat_id)
            .order_by(ChatMessage.timestamp.asc())
            .all()
        )
        conversation_history = []
        current_pair = {"user": None, "ai": None}
        for msg in previous_messages:
            if msg.sender == 'user':
                if current_pair["user"] or current_pair["ai"]:
                    conversation_history.append((current_pair["user"] or "", current_pair["ai"] or ""))
                    current_pair = {"user": None, "ai": None}
                current_pair["user"] = msg.content
            elif msg.sender == 'ai':
                current_pair["ai"] = msg.content
                conversation_history.append((current_pair["user"] or "", current_pair["ai"] or ""))
                current_pair = {"user": None, "ai": None}

        # For the first message, generate a chat title from the user's input.
        if not previous_messages:
            print("THrs no exisitn message")
            title_prompt = (
                f"Provide one short, descriptive chat title for the following conversation. "
                f"Return only the title, without numbering or additional commentary: {user_message}"
            )

            llm_for_title = ChatOpenAI(
                model_name=settings.model,
                temperature=0.7,
                max_tokens=20,
                openai_api_key=os.getenv("OPENROUTER_API_KEY"),
                openai_api_base=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
            )
            title_response = llm_for_title.invoke([HumanMessage(content=title_prompt)])
            chat_title = title_response.content.strip()
            # Save the generated title only once.
            chat_session.chatlog = chat_title
            db.session.commit()

        # Retrieve documents from Qdrant.
        collection_name = f"module_{module_id}"
        print("collection_name",collection_name)
        client = get_qdrant_client()
        try:
            documents = client.scroll(collection_name=collection_name)[0]
        except Exception as q_err:
            print(f"Error fetching documents from Qdrant: {str(q_err)}")
            documents = []
        texts = []
        metadatas = []
        for doc in documents:
            text_content = doc.payload.get("text", "")
            texts.append(text_content)
            print("text_content",text_content)
            metadatas.append({
                "id": str(doc.id),
                "filename": doc.payload.get("filename")
            })

        # Generate the bot response.
        if texts:  # When documents exist, use the ConversationalRetrievalChain.
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            vectorstore = Qdrant(
                client=client,
                collection_name=collection_name,
                embeddings=embeddings
            )
            retriever = vectorstore.as_retriever()
            chain = ConversationalRetrievalChain.from_llm(
                llm=ChatOpenAI(
                    model_name=settings.model,
                    temperature=settings.temperature,
                    max_tokens=settings.max_tokens,
                    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
                    openai_api_base=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
                ),
                retriever=retriever,
                return_source_documents=False
            )
            chain_input = {"question": system_context + user_message, "chat_history": conversation_history}
            chain_result = chain(chain_input)
            bot_response = chain_result.get("answer", "I'm sorry, I couldn't generate a response.")
        else:  # No documents: build prompt from conversation_history.
            prompt_text = ""
            prompt_text += system_context
            if conversation_history:
                for pair in conversation_history:
                    prompt_text += f"User: {pair[0]}\nAI: {pair[1]}\n"
            prompt_text += f"User: {user_message}\nAI:"
            llm = ChatOpenAI(
                model_name=settings.model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
                openai_api_key=os.getenv("OPENROUTER_API_KEY"),
                openai_api_base=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
            )
            bot_response = llm([HumanMessage(content=prompt_text)]).content

        # Save the user's message.
        user_msg = ChatMessage(
            chatID=chat_id,
            sender="user",
            content=user_message,
            timestamp=datetime.utcnow()
        )
        db.session.add(user_msg)
        db.session.commit()

        # Save the bot's response.
        bot_msg = ChatMessage(
            chatID=chat_id,
            sender="ai",
            content=bot_response,
            timestamp=datetime.utcnow()
        )
        db.session.add(bot_msg)
        db.session.commit()

        # IMPORTANT: Do not update the chatlog once the title is generated.
        return jsonify({
            "chat_id": chat_id,
            "user_message": user_message,
            "bot_response": bot_response,
            "chat_title": chat_session.chatlog
        }), 200

    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/get-chat-history/<int:chat_id>', methods=['GET'])
def get_chat_history(chat_id):
    try:
        messages = (
            db.session.query(ChatMessage)
            .filter_by(chatID=chat_id)
            .order_by(ChatMessage.timestamp.asc())
            .all()
        )
        history = [{
            "sender": msg.sender,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat()
        } for msg in messages]

        return jsonify({"chat_history": history}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/get-chat-history/<user_id>/<module_id>', methods=['GET'])
def get_chat_history_for_user_module(user_id, module_id):
    """
    Returns all chat sessions (with all columns) belonging to the assignment for a given user and module.
    """
    try:
        assignment = ModuleAssignment.query.filter_by(userID=user_id, moduleID=str(module_id)).first()
        if not assignment:
            return jsonify({"error": "No assignment found for the given user and module"}), 404

        chats = ChatHistory.query.filter_by(assignmentID=assignment.assignmentID) \
            .order_by(ChatHistory.dateStarted.desc()).all()
        chat_list = []
        for chat in chats:
            chat_list.append({
                "historyID": chat.historyID,
                "assignmentID": chat.assignmentID,
                "chatlog": chat.chatlog,
                "dateStarted": chat.dateStarted.isoformat()
            })
        return jsonify(chat_list), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route('/get-chat-message/<int:chat_id>', methods=['GET'])
def get_chat_message(chat_id):
    """
    Returns all messages (with all columns) for the given chat session.
    """
    try:
        messages = db.session.query(ChatMessage) \
            .filter_by(chatID=chat_id) \
            .order_by(ChatMessage.timestamp.asc()).all()
        msg_list = []
        for msg in messages:
            msg_list.append({
                "chatID": msg.chatID,
                "sender": msg.sender,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            })
        return jsonify(msg_list), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500