from flask import Blueprint, jsonify, request, current_app
from app.models.credit_requests import CreditRequest
from app.models.module_assignment import ModuleAssignment
from app.models.users import User
from app.db import db
import sys

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
            updated_req_data['studentName'] = user_info_tuple[1] # Access by index
        else:
            updated_req_data['studentID'] = None
            updated_req_data['studentName'] = None
        
    return jsonify(updated_req_data), 200
