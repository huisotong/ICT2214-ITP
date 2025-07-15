from flask import Blueprint, jsonify, request, current_app
from app.models.credit_requests import CreditRequest
from app.models.module_assignment import ModuleAssignment
from app.models.users import User
from app.models.module import Module
from app.db import db
import sys
from datetime import datetime, timedelta, timedelta

credit_requests_bp = Blueprint('credit_requests', __name__)

@credit_requests_bp.route('/credit-requests', methods=['GET'])
def get_credit_requests():
    print("Fetching credit requests...", file=sys.stderr)
    requests_data = db.session.query(
        CreditRequest,
        User.studentID,
        User.name
    ).outerjoin(ModuleAssignment, CreditRequest.assignmentID == ModuleAssignment.assignmentID)\
    .outerjoin(User, ModuleAssignment.userID == User.userID)\
    .all()
    print(f"Raw requests_data count: {len(requests_data)}", file=sys.stderr)

    results = []
    for index, (req_object, student_id_val, student_name_val) in enumerate(requests_data):
        print(f"Processing item {index}:", file=sys.stderr)
        print(f"  Raw query - requestID: {req_object.requestID}, student_id_val: {student_id_val}, student_name_val: {student_name_val}", file=sys.stderr)
        r_dict_from_model = req_object.to_dict()
        print(f"From req_object.to_dict(): {r_dict_from_model}", file=sys.stderr)
        
        # Explicitly set/overwrite studentID and studentName from the query results
        # This is the intended final state for these fields in the dictionary
        final_r_dict = r_dict_from_model.copy() # Start with what to_dict() provided
        final_r_dict['studentID'] = student_id_val
        final_r_dict['studentName'] = student_name_val
        
        print(f"  Final r_dict for response: {final_r_dict}", file=sys.stderr)
        results.append(final_r_dict)
    
    print(f"Finished processing all items.", file=sys.stderr)
    return jsonify(results), 200

@credit_requests_bp.route('/credit-requests/<int:request_id>/status', methods=['PATCH'])
def update_credit_request_status(request_id):
    data = request.get_json()
    new_status = data.get('status')
    if new_status not in ["Approved", "Rejected"]: #statuses are: 'Pending', 'Approved', 'Rejected', 'Cancelled' (This is a constraint for status column in the database)
        return jsonify({"error": "Invalid status"}), 400
    
    req = CreditRequest.query.get(request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404
    
    # If approving the request, add credits to the student's account
    if new_status == "Approved" and req.status != "Approved":
        # Find the module assignment to update student credits
        module_assignment = ModuleAssignment.query.get(req.assignmentID)
        if module_assignment:
            # Add the requested credits to the student's current credits
            current_credits = module_assignment.studentCredits or 0
            module_assignment.studentCredits = current_credits + req.creditsRequested
    
    req.status = new_status
    db.session.commit()
    
    updated_req_data = req.to_dict()
    # Attempt to add/update studentID and studentName by re-querying based on assignmentID
    # This ensures the latest user data is fetched if relationships weren't loaded or are stale.
    if req.assignmentID:
        user_info_tuple = db.session.query(User.studentID, User.name)\
            .join(ModuleAssignment, ModuleAssignment.userID == User.userID)\
            .filter(ModuleAssignment.assignmentID == req.assignmentID).first()
        if user_info_tuple:
            updated_req_data['studentID'] = user_info_tuple[0]  # Access by index
            updated_req_data['studentName'] = user_info_tuple[1] # Access by index        else:
            updated_req_data['studentID'] = None
            updated_req_data['studentName'] = None
        
    return jsonify(updated_req_data), 200

@credit_requests_bp.route('/credit-requests/user/<int:user_id>/approved', methods=['GET'])
def get_user_approved_requests(user_id):
    """Get approved credit requests for a specific user for notifications"""
    try:
        approved_requests = db.session.query(
            CreditRequest,
            Module.moduleID,
            Module.moduleName
        ).join(ModuleAssignment, CreditRequest.assignmentID == ModuleAssignment.assignmentID)\
        .join(User, ModuleAssignment.userID == User.userID)\
        .join(Module, ModuleAssignment.moduleID == Module.moduleID)\
        .filter(
            User.userID == user_id,
            CreditRequest.status == 'Approved'
        ).all()
        
        result = []
        for credit_req, module_id, module_name in approved_requests:
            result.append({
                'requestID': credit_req.requestID,
                'creditsRequested': credit_req.creditsRequested,
                'moduleID': module_id,
                'moduleName': module_name,
                'message': f'Your request for {credit_req.creditsRequested} USD credits for {module_name} has been approved!'
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@credit_requests_bp.route('/credit-requests', methods=['POST'])
def submit_credit_request():
    """Allow students to submit credit requests"""
    data = request.get_json()
    assignment_id = data.get('assignmentID')
    credits_requested = data.get('creditsRequested')
    
    if not assignment_id or not credits_requested:
        return jsonify({'error': 'Assignment ID and credits requested are required'}), 400
    
    try:
        credits_requested = int(credits_requested)
        if credits_requested <= 0:
            return jsonify({'error': 'Credits requested must be a positive number'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid credits requested format'}), 400
    
    try:
        # Verify assignment exists
        assignment = ModuleAssignment.query.get(assignment_id)
        if not assignment:
            return jsonify({'error': 'Module not found'}), 404
        
        # Check if there's already a pending request for this Module
        existing_request = CreditRequest.query.filter_by(
            assignmentID=assignment_id,
            status='Pending'
        ).first()
        
        if existing_request:
            return jsonify({'error': 'A pending request already exists for this Module'}), 400
        
        # Create new credit request
        new_request = CreditRequest(
            assignmentID=assignment_id,
            creditsRequested=credits_requested,
            status='Pending',
            requestDate=datetime.utcnow()
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Credit request submitted successfully',
            'requestID': new_request.requestID
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@credit_requests_bp.route('/credit-requests/<int:request_id>', methods=['DELETE'])
def delete_credit_request(request_id):
    """Allow students to delete their own pending credit requests"""
    try:
        # Get the credit request
        credit_request = CreditRequest.query.get(request_id)
        if not credit_request:
            return jsonify({'error': 'Credit request not found'}), 404
        
        # Only allow deletion of pending requests
        if credit_request.status != 'Pending':
            return jsonify({'error': 'Can only delete pending requests'}), 400
        
        # Delete the request
        db.session.delete(credit_request)
        db.session.commit()
        
        return jsonify({'message': 'Credit request deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@credit_requests_bp.route('/credit-requests/notifications/<int:user_id>', methods=['GET'])
def get_user_notifications(user_id):
    """Get recently approved credit requests for notifications"""
    try:
        # Get requests approved in the last 24 hours for this user
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        notifications = db.session.query(
            CreditRequest,
            User.studentID,
            User.name,
            Module.moduleID,
            Module.moduleName
        ).join(ModuleAssignment, CreditRequest.assignmentID == ModuleAssignment.assignmentID)\
        .join(User, ModuleAssignment.userID == User.userID)\
        .join(Module, ModuleAssignment.moduleID == Module.moduleID)\
        .filter(
            User.userID == user_id,
            CreditRequest.status == 'Approved',
            # Check if status was recently updated (since we don't have a separate approval timestamp)
            # We'll use a different approach - check session storage or add a 'seen' field
        ).all()
        
        result = []
        for credit_req, student_id, student_name, module_id, module_name in notifications:
            result.append({
                'requestID': credit_req.requestID,
                'creditsRequested': credit_req.creditsRequested,
                'moduleID': module_id,
                'moduleName': module_name,
                'approvalMessage': f'Your request for {credit_req.creditsRequested} USD credits for {module_name} has been approved!'
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
