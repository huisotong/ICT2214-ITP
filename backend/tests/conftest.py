
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
from app import create_app
from app.db import db

def import_all_models():
    # Import every model so SQLAlchemy sees them before create_all()
    # Adjust these imports to match your actual module names/paths
    from app.models.module import Module
    from app.models.users import Users
    from app.models.module_assignment import ModuleAssignment
    from app.models.chatbot_settings import ChatbotSettings
    from app.models.chat_history import ChatHistory
    from app.models.students import Student
    from app.models.chat_message import ChatMessage
    from app.models.credit_requests import CreditRequest


@pytest.fixture(scope="session")
def test_client():
    app = create_app()
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    with app.app_context():
        import_all_models()
        db.create_all()
        yield app.test_client()
        db.drop_all()
