from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import create_access_token, set_access_cookies, jwt_required, get_jwt_identity, unset_jwt_cookies
from datetime import datetime, timedelta
from datetime import timedelta
from app.models.users import User
from app.db import db

users_bp = Blueprint('users', __name__)

# 1. Get all users
@users_bp.route('/users', methods=['GET'])
def get_all_users():
    users = User.query.all()

    if not users:
        return jsonify({'message': 'No users found'}), 404

    return jsonify([
        {
            "userID": user.userID,
            "email": user.email,
            "mobileNumber": user.mobileNumber,
            "role": user.role
        } for user in users
    ]), 200

# 2. Get user by ID
@users_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({
        "userID": user.userID,
        "email": user.email,
        "mobileNumber": user.mobileNumber,
        "role": user.role,
        "name": user.name
    }), 200

# 3. Login
@users_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400

    user = User.query.filter_by(email=email, password=password).first()

    if not user:
        return jsonify({'error': 'Invalid email or password'}), 401

    # ✅ Generate JWT token valid for 1 day
    access_token = create_access_token(identity=str(user.userID), expires_delta=timedelta(days=1))

    # ✅ Create response with secure cookie
    response = make_response(jsonify({
        "message": "Login successful",
        "user": {
            "userID": user.userID,
            "name": user.name,
            "email": user.email,
            "mobileNumber": user.mobileNumber,
            "role": user.role,
            "studentID": user.studentID
        }
    }))
    print("✅ Login cookie set")
    set_access_cookies(response, access_token, max_age=60*60*24)
    return response, 200

# Route to securely log users out and unset their tokens (cant just brute force through URL)
@users_bp.route('/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)
    return response, 200

# Route to fetch user details rather than use local storage
@users_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        "userID": user.userID,
        "name": user.name,
        "email": user.email,
        "mobileNumber": user.mobileNumber,
        "role": user.role,
        "studentID": user.studentID
    }), 200

# 4. Update user details
@users_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    print("Received update:", data)

    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.mobileNumber = data.get('mobileNumber', user.mobileNumber)

    try:
        db.session.commit()
        return jsonify({'message': 'User updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update user details'}), 500