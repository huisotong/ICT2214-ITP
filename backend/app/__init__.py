from flask import Flask, jsonify
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
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "http://localhost:5173"}})

    # --- Database config ---
    # Use env if provided; otherwise fall back to a local SQLite file for dev/test.
    app.config.setdefault("SQLALCHEMY_DATABASE_URI",
                          os.getenv("SQLALCHEMY_DATABASE_URI", "sqlite:///dev.db"))
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)

    # If SQLite, disable schemas by translating 'dbo' -> None (SQLite has no schemas)
    if app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite:"):
        engine_opts = app.config.setdefault("SQLALCHEMY_ENGINE_OPTIONS", {})
        exec_opts = engine_opts.setdefault("execution_options", {})
        exec_opts["schema_translate_map"] = {"dbo": None}
    db.init_app(app)

    # JWT secret
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    # Store token in a cookie
    app.config["JWT_TOKEN_LOCATION"] = ["cookies"]

    # Cookie path and persistence
    app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
    app.config["JWT_SESSION_COOKIE"] = False  # ✅ Makes cookie persistent

    # Cookie expiration
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)  # ✅ Must be set

    # Cross-site and dev mode support
    app.config["JWT_COOKIE_SAMESITE"] = "None"    # ✅ For cross-origin requests (5173 <-> 5000)
    app.config["JWT_COOKIE_SECURE"] = True       # ✅ Set True only in production (HTTPS)
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False # ✅ For dev; use True with CSRF tokens in prod


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
