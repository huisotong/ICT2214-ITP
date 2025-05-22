from flask import Flask
from flask_cors import CORS
from .db import db
import os
from .routes.credits import credits_bp

# Initialise app
def create_app():
    app = Flask(__name__)
    #CORS to communicate with frontend
    CORS(app, resources={r"/api/*": {"origins": {os.getenv("FRONTEND_ROUTE")}}})
    
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv('SQLALCHEMY_DATABASE_URI')
    db.init_app(app)

    app.register_blueprint(credits_bp, url_prefix='/api')

    return app
