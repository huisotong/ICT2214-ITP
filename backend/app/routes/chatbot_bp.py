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
from docx import Document as DocxDocument
from io import BytesIO
import traceback
from datetime import datetime
import requests
from langchain.schema import HumanMessage
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.callbacks import get_openai_callback

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

"""
TODO: redo cost estimation function. 
(call https://openrouter.ai/api/v1/models, get model pricing, estimate toks, calculate cost)
"""


# Function to tag document from qdrant
def tag_document_to_qdrant(module_id: str, file_content: str, filename: str):
    # Step 1: Initialize embedding model and text splitter
    embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-base-en-v1.5")
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)

    # Step 2: Split file content into manageable chunks
    chunks = splitter.split_text(file_content)

    # Step 3: Wrap each chunk into a LangChain Document, attach filename as metadata
    documents = [
        Document(page_content=chunk, metadata={"filename": filename})
        for chunk in chunks
    ]

    # Step 4: Connect to Qdrant vector database
    client = get_qdrant_client()
    collection_name = f"module_{module_id}"

    # Step 5: Create collection if it doesn't exist yet
    if collection_name not in [c.name for c in client.get_collections().collections]:
        dummy_vector = embeddings.embed_documents(["test"])[0]
        client.recreate_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=len(dummy_vector), distance=Distance.COSINE)
        )

    # Step 6: Add documents to the vector store
    print(f"📤 Uploading {len(documents)} documents to Qdrant...")
    vectorstore = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings
    )
    vectorstore.add_documents(documents)
    print("✅ Tagging completed successfully.")

    # Step 7: Return list of filenames tagged (same repeated filename for each chunk)
    return [str(doc.metadata["filename"]) for doc in documents]


# Function to untag document from qdrant
def untag_document_from_qdrant(module_id: str, filename: str):
    client = get_qdrant_client()
    collection_name = f"module_{module_id}"

    print(f"🧹 Removing all points for file '{filename}' from collection '{collection_name}'...")

    try:
        # Step 1: Retrieve all vectors and their payloads from the specified collection
        scroll_result = client.scroll(
            collection_name=collection_name,
            with_payload=True,
            limit=1000  # May increase if you expect very large files
        )
    except Exception as e:
        print(f"❌ Failed to scroll Qdrant collection: {e}")
        return

    all_docs = scroll_result[0]
    matching_ids = []

    # Step 2: Check for filename in both flat and nested payload structures
    for doc in all_docs:
        filename_flat = doc.payload.get("filename")
        filename_nested = doc.payload.get("metadata", {}).get("filename")

        if filename_flat == filename:
            print(f"✅ Matched flat filename: {filename_flat}")
            matching_ids.append(str(doc.id))
        elif filename_nested == filename:
            print(f"✅ Matched nested filename: {filename_nested}")
            matching_ids.append(str(doc.id))

    if not matching_ids:
        print("⚠️ No points found with that filename.")
        return

    # Step 3: Delete all points that matched the filename
    result = client.delete(
        collection_name=collection_name,
        points_selector=PointIdsList(points=matching_ids)
    )

    print(f"🗑️ Deleted {len(matching_ids)} points. Qdrant response:", result)


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
        filenames = []
        try:
            # Get all documents from the module's collection
            documents = client.scroll(collection_name=collection_name, with_payload=True, limit=1000)[0]
             # Extract filenames from flat or nested metadata
            for doc in documents:
                flat_name = doc.payload.get("filename")
                nested_name = doc.payload.get("metadata", {}).get("filename")
                name = flat_name or nested_name

                if name:
                    name = name.strip()
                    if name not in filenames:
                        filenames.append(name)
                    print(f"✅ Found filename: {name}")
                else:
                    print(f"⚠️ Skipped point without filename. Point ID: {doc.id}")


        except Exception as e:
            print(f"Error fetching from Qdrant: {str(e)}")
            filenames = []

        return jsonify({
            'settings': {
                'model': settings.model,
                'temperature': settings.temperature,
                'systemPrompt': settings.system_prompt,
                'maxTokens': settings.max_tokens,
            },
            "documents": [{"id": name, "name": name} for name in filenames]
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

        # Step 1: Read uploaded DOCX or plain text content
        if file.filename.lower().endswith(".docx"):
            docx_io = BytesIO(file.read())
            doc = DocxDocument(docx_io)
            content = "\n".join([para.text for para in doc.paragraphs])
        else:
            content = file.read().decode("utf-8")

        if not content.strip():
            return jsonify({"error": "No content extracted from file"}), 400

         # Step 2: Tag content into Qdrant via embedding and splitting
        part_filenames = tag_document_to_qdrant(module_id, content, file.filename)

        return jsonify({
            "status": "success",
            "filename": file.filename,
            "num_chunks": len(part_filenames),
            "chunks": part_filenames
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
        filename = data.get("docID")  # Must match the filename stored in metadata

        if not module_id or not filename:
            return jsonify({"error": "Missing moduleID or filename"}), 400

        # Step 1: Call helper to remove all matching Qdrant chunks
        untag_document_from_qdrant(module_id, filename)

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

        # Added user_id to the check, for credit deduction
        if not module_id or not user_message or not user_id:
            return jsonify({"error": "module_id, message, and user_id are required"}), 400
          # Fetch user assignment and settings early for access to credits and model name
        assignment = ModuleAssignment.query.filter_by(userID=user_id, moduleID=str(module_id)).first()
        if not assignment:
            return jsonify({"error": "No assignment found for the given user and module"}), 404
        
        # Check if user has negative credits - prevent submission if so
        if assignment.studentCredits < 0:
            return jsonify({
                "error": "Insufficient credits", 
                "message": "You have negative credits and cannot submit new prompts. Please request additional credits from your instructor.",
                "current_credits": assignment.studentCredits
            }), 403
        
        chat_session = None
        # For the first message, create a new chat session.
        if not chat_id:
            new_chat = ChatHistory(
                assignmentID=assignment.assignmentID,
                chatlog="",  # Will be replaced.
                dateStarted=datetime.utcnow()
            )
            db.session.add(new_chat)
            db.session.commit()
            chat_id = new_chat.historyID
            chat_session = new_chat

        # If there's existing chat
        else:
            chat_session = ChatHistory.query.filter_by(historyID=chat_id).first()
            if not chat_session:
                return jsonify({"error": "Chat session not found"}), 404
        
        settings = ChatbotSettings.query.filter_by(moduleID=str(module_id)).first()
        if not settings:
            return jsonify({"error": "Model settings not found for this module"}), 404

        if model_override:
            settings.model = model_override

        try:
            models_response = requests.get("https://openrouter.ai/api/v1/models")
            models_response.raise_for_status()
            models_data = models_response.json().get("data", [])
        except requests.exceptions.RequestException as e:
            print(f"Could not fetch model pricing from OpenRouter: {e}")
            return jsonify({"error": "Could not fetch model pricing. Please try again."}), 500

        model_info = next((m for m in models_data if m.get("id") == settings.model), None)

        if not model_info:
            return jsonify({"error": f"Could not find pricing information for model: {settings.model}"}), 500

        pricing = model_info.get("pricing", {})
        prompt_price = float(pricing.get("prompt", 0))
        completion_price = float(pricing.get("completion", 0))

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
            print("There is no existing messages!")
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
            if chat_title.startswith('"') and chat_title.endswith('"'):
                chat_title = chat_title[1:-1].strip()
            elif chat_title.startswith("'") and chat_title.endswith("'"):
                chat_title = chat_title[1:-1].strip()
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

        # Generate the bot response.
        if documents:  # When documents exist, use the ConversationalRetrievalChain.
            embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-base-en-v1.5")
            vectorstore = QdrantVectorStore(
                client=client,
                collection_name=collection_name,
                embedding=embeddings
            )
            retriever = vectorstore.as_retriever(
                search_kwargs={
                    "k": 3,  # Increase how many to return
                    "score_threshold": 0.5  # Accept even loosely matched chunks
                }
            )
            prompt_template = PromptTemplate(
                input_variables=["context", "question"],
                template="""
                You are a helpful assistant. Use the following context to answer the question.

                Context:
                {context}

                Question: {question}
                """
                            )
            # Run similarity search
            docs_and_scores = vectorstore.similarity_search_with_score(user_message, k=3)

            # Print similarity score and filename from metadata
            for doc, score in docs_and_scores:
                filename = doc.metadata.get("filename", "Unknown")
                print(f"📄 SCORE: {score:.4f} — ({filename}) {doc.page_content[:100]}")

            prompt_tokens = 0
            completion_tokens = 0
            
            with get_openai_callback() as cb:
                chain = ConversationalRetrievalChain.from_llm(
                    llm=ChatOpenAI(
                        model_name=settings.model,
                        temperature=settings.temperature,
                        max_tokens=settings.max_tokens,
                        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
                        openai_api_base=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
                    ),
                    retriever=retriever,
                    return_source_documents=True,
                    combine_docs_chain_kwargs={"prompt": prompt_template}
                )
                chain_input = {"question": system_context + user_message, "chat_history": conversation_history}
                chain_result = chain.invoke(chain_input)
                bot_response = chain_result.get("answer", "I'm sorry, I couldn't generate a response.")
                prompt_tokens = cb.prompt_tokens
                completion_tokens = cb.completion_tokens

        # No documents: build prompt from conversation_history.
        else:  
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
            
            llm_result = llm.invoke([HumanMessage(content=prompt_text)])
            bot_response = llm_result.content
            token_usage = llm_result.response_metadata.get("token_usage", {})
            prompt_tokens = token_usage.get("prompt_tokens", 0)
            completion_tokens = token_usage.get("completion_tokens", 0)


        # Calculate cost and deduct from the student's credit balance
        cost = (prompt_tokens * prompt_price) + (completion_tokens * completion_price)
        print("Cost of this request:", cost)
        print("Student credit before deduction:", assignment.studentCredits)
        assignment.studentCredits -= cost
        print("Student credit after deduction:", assignment.studentCredits)

        # Save the user's message.
        user_msg = ChatMessage(
            chatID=chat_id,
            sender="user",
            content=user_message,
            timestamp=datetime.utcnow()
        )
        # Save the bot's response.
        bot_msg = ChatMessage(
            chatID=chat_id,
            sender="ai",
            content=bot_response,
            timestamp=datetime.utcnow()
        )

        # Add all changes to the session and commit once.
        db.session.add(assignment)
        db.session.add(user_msg)
        db.session.add(bot_msg)
        db.session.commit()

        # IMPORTANT: Do not update the chatlog once the title is generated.
        return jsonify({
            "chat_id": chat_id,
            "user_message": user_message,
            "bot_response": bot_response,
            "chat_title": chat_session.chatlog,
            "cost": cost
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

@chatbot_bp.route("/get-module-model/<string:module_id>", methods=["GET"])
def get_module_model(module_id):
    chatbot_settings = ChatbotSettings.query.filter_by(moduleID=str(module_id)).first()
    if not chatbot_settings:
        return jsonify({"error": "Chatbot settings not found for this module"}), 404

    return jsonify(
        {
            "model_name": chatbot_settings.model,
        }
    )