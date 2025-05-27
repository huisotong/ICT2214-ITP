import csv
import io
from flask import Blueprint, jsonify, request
from app.models.module_assignment import ModuleAssignment
from app.models.module import Module
from app.models.users import User
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
    
@modules_bp.route('/add-module', methods=['POST'])
def add_module():
    try:
        # Get form data
        user_id = request.form.get('userID')
        module_id = request.form.get('moduleID')
        module_name = request.form.get('moduleName')
        module_description = request.form.get('moduleDescription')
        initial_credit = int(request.form.get('initialCredit'))
        
        # Create new module
        new_module = Module(
            moduleID=module_id,
            moduleName=module_name,
            moduleDesc=module_description
        )
        db.session.add(new_module)
        
        # Create module assignment for the module owner
        owner_assignment = ModuleAssignment(
            userID=user_id,
            moduleID=module_id,
            studentCredits=initial_credit
        )
        db.session.add(owner_assignment)

        # Handle CSV file if present
        if 'csvFile' in request.files:
            csv_file = request.files['csvFile']
            if csv_file:
                # Read CSV file
                stream = io.StringIO(csv_file.stream.read().decode("UTF8"))
                csv_reader = csv.DictReader(stream)
                
                # Process each row in the CSV
                for row in csv_reader:
                    student_id = row['student_id']
                    
                    # Find user by student_id
                    user = User.query.filter_by(studentID=student_id).first()
                    if user:
                        # Create module assignment for this student
                        student_assignment = ModuleAssignment(
                            userID=user.userID,
                            moduleID=module_id,
                            studentCredits=initial_credit
                        )
                        db.session.add(student_assignment)

        # Commit all changes
        db.session.commit()
        return jsonify({"message": "Module created successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500