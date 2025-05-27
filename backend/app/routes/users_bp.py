from flask import Blueprint, jsonify
from app.models.users import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
def get_all_users():
    try:
        users = User.query.all()
        return jsonify([user.to_dict() for user in users]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
