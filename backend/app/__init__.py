from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from .db import db
import os
from .routes.credits_bp import credits_bp
from .routes.users_bp import users_bp
from .routes.modules_bp import modules_bp
from .routes.credit_requests_bp import credit_requests_bp
from .routes.add_students_bp import add_students_bp
from .routes.chatbot_bp import chatbot_bp
from sqlalchemy import text

# Initialise app
def create_app():
    app = Flask(__name__)
    # CORS for frontend
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": {os.getenv("FRONTEND_ROUTE")}}})

    # Connect to db
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv('SQLALCHEMY_DATABASE_URI')
    db.init_app(app)

    # JWT Configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")  # Use env var in production!
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
    app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
    app.config["JWT_COOKIE_SECURE"] = False  # True in production with HTTPS
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Set True if using CSRF protection
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)

    jwt = JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(credits_bp, url_prefix='/api')
    app.register_blueprint(users_bp, url_prefix='/api')
    app.register_blueprint(modules_bp, url_prefix='/api')
    app.register_blueprint(credit_requests_bp, url_prefix='/api')
    app.register_blueprint(add_students_bp, url_prefix='/api')
    app.register_blueprint(chatbot_bp, url_prefix='/api')


    # Test database connection
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
            print("✅ Successfully connected to the database.")
        except Exception as e:
            print("❌ Failed to connect to the database:", e)

    return app
