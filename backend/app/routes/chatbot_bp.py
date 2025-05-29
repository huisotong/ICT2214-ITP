from flask import Blueprint, jsonify, request
from app.models.module_assignment import ModuleAssignment
from app.models.module import Module
from app.models.users import User
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
    dummy_vector = [0.0] * 10
    client = get_qdrant_client()
    collection_name = f"module_{module_id}"

    # Create collection if missing
    if collection_name not in [c.name for c in client.get_collections().collections]:
        client.recreate_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=len(dummy_vector), distance=Distance.COSINE)
        )

    point_id = str(uuid.uuid4())

    point = PointStruct(
        id=point_id,
        vector=dummy_vector,
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



