from flask import Blueprint, jsonify, request
from app.models.users import User

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
        "role": user.role
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

    return jsonify({
        "message": "Login successful",
        "user": {
            "userID": user.userID,
            "name": user.name,
            "email": user.email,
            "mobileNumber": user.mobileNumber,
            "role": user.role,
            "studentID": user.studentID
        }
    }), 200