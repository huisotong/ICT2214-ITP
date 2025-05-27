from flask import Blueprint, jsonify, request
from app.models.module_assignment import ModuleAssignment
from app.models.module import Module
from app.db import db

modules_bp = Blueprint('modules', __name__)

@modules_bp.route('/get-assigned-modules', methods=['GET'])
def get_assigned_modules():
    try:
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        # Query to get all module assignments for the user with student credits
        results = db.session.query(Module, ModuleAssignment.studentCredits)\
            .join(ModuleAssignment, Module.moduleID == ModuleAssignment.moduleID)\
            .filter(ModuleAssignment.userID == user_id)\
            .all()

        # Convert modules to dictionary format
        modules_list = [{
            "moduleID": module.moduleID,
            "moduleName": module.moduleName,
            "moduleDesc": module.moduleDesc,
            "studentCredits": student_credits
        } for module, student_credits in results]

        return jsonify(modules_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500