from flask import Blueprint, jsonify, request
from app.models.module_assignment import ModuleAssignment
from app.models.module import Module
from app.models.users import User
from app.models.chatbot_settings import ChatbotSettings
from app.db import db
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os
from pathlib import Path

chatbot_bp = Blueprint('chatbot', __name__)

UPLOAD_FOLDER = Path("uploads")
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333

@chatbot_bp.route('/get-model-settings/<module_id>', methods=['GET'])
def get_model_settings(module_id):
    try:
        # Get LLM settings from sql
        settings = ChatbotSettings.query.filter_by(moduleID=module_id).first()
        if not settings:
            return jsonify({'error': 'Settings not found'}), 404

        # Initialize Qdrant client (need change depending on setup)
        # client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        # collection_name = f"module_{module_id}"

        # try:
        #     # Get all documents from the module's collection
        #     documents = client.scroll(
        #         collection_name=collection_name,
        #     )[0]

        #     # Format documents for frontend
        #     formatted_docs = [{
        #         'id': str(doc.id),
        #         'name': doc.payload.get('filename'),
        #     } for doc in documents]

        # except Exception as e:
        #     print(f"Error fetching from Qdrant: {str(e)}")
        #     formatted_docs = []

        return jsonify({
            'settings': {
                'model': settings.model,
                'temperature': settings.temperature,
                'systemPrompt': settings.system_prompt,
                'maxTokens': settings.max_tokens,
            },
            'documents': []
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
    
@chatbot_bp.route('/tag-document', methods=['POST'])
def tag_document():
    return


@chatbot_bp.route('/untag-document', methods=['POST'])
def untag_document():
    return



