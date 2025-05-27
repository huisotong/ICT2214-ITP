from flask import Blueprint, jsonify
from app.models.credit_requests import CreditRequest

credit_requests_bp = Blueprint('credit_requests', __name__)

@credit_requests_bp.route('/credit-requests', methods=['GET'])
def get_credit_requests():
    requests = CreditRequest.query.all()
    return jsonify([r.to_dict() for r in requests]), 200
