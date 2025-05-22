from flask import Blueprint, request, jsonify
from app.models.users import User
from datetime import datetime
from app.db import db

credits_bp = Blueprint('credits', __name__)

# Sign up route JUST EXAMPLE FROM SSD
@credits_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    confirm_password = data.get('confirmPassword')




    new_user = User(
        email=email,
        username=username,
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
        "message": "Sign up was successful! Logging in...",
        "access_token": "test",
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Something went wrong. Please try again."}), 500