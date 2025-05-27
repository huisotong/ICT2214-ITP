from flask import Flask
from flask_cors import CORS
from .db import db
import os
from .routes.credits_bp import credits_bp
from .routes.users_bp import users_bp
from .routes.modules_bp import modules_bp
from .routes.credit_requests_bp import credit_requests_bp
from sqlalchemy import text

# Initialise app
def create_app():
    app = Flask(__name__)
    # CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": {os.getenv("FRONTEND_ROUTE")}}})

    # Connect to db
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv('SQLALCHEMY_DATABASE_URI')
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(credits_bp, url_prefix='/api')
    app.register_blueprint(users_bp, url_prefix='/api')
    app.register_blueprint(modules_bp, url_prefix='/api')
    app.register_blueprint(credit_requests_bp, url_prefix='/api')

    # Test database connection
    with app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
            print("✅ Successfully connected to the database.")
        except Exception as e:
            print("❌ Failed to connect to the database:", e)

    return app
