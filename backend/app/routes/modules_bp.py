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
    

 # TODO: auto add a default llm setting   
@modules_bp.route('/add-module', methods=['POST'])
def add_module():
    try:
        # Get form data
        user_id = request.form.get('userID')
        module_id = request.form.get('moduleID')
        module_name = request.form.get('moduleName')
        module_description = request.form.get('moduleDescription')
        initial_credit = int(request.form.get('initialCredit'))
        
        # Check if module already exists
        existing_module = Module.query.filter_by(moduleID=module_id).first()
        if existing_module:
            return jsonify({
                "error": f"Module with ID {module_id} already exists"
            }), 400
        
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
        invalid_students = []  # Track students not found in database
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
                    else:
                        invalid_students.append(student_id)

        # Commit all changes
        db.session.commit()
        
        # Return success message with warnings if any invalid students
        response = {"message": "Module created successfully"}
        if invalid_students:
            response["warnings"] = f"However, the following student IDs were not found and were skipped: {', '.join(invalid_students)}"
        
        return jsonify(response), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

@modules_bp.route('/delete-module', methods=['DELETE'])
def delete_module():
    try:
        data = request.get_json()
        module_id = data.get('moduleID')

        if not module_id:
            return jsonify({"error": "Module ID is required"}), 400

        # Find the module
        module = Module.query.get(module_id)
        if not module:
            return jsonify({"error": f"Module {module_id} not found"}), 404

        # Delete all module assignments first (to handle foreign key constraints)
        ModuleAssignment.query.filter_by(moduleID=module_id).delete()

        # Delete the module
        db.session.delete(module)
        
        # Commit the changes
        db.session.commit()

        return jsonify({
            "message": f"Module {module_id} and all its assignments deleted successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

@modules_bp.route('/edit-module', methods=['PUT'])
def edit_module():
    try:
        data = request.get_json()
        old_module_id = data.get('oldModuleID')
        new_module_id = data.get('moduleID')
        module_name = data.get('moduleName')
        module_desc = data.get('moduleDesc')

        if not all([old_module_id, new_module_id, module_name]):
            return jsonify({"error": "Missing required fields"}), 400

        # Find the module to update
        module = Module.query.get(old_module_id)
        if not module:
            return jsonify({"error": f"Module {old_module_id} not found"}), 404

        # Check if new module ID already exists (if changing ID)
        if old_module_id != new_module_id:
            existing_module = Module.query.filter_by(moduleID=new_module_id).first()
            if existing_module:
                return jsonify({"error": f"Module ID {new_module_id} already exists"}), 400
            
            # Create new module with new ID
            new_module = Module(
                moduleID=new_module_id,
                moduleName=module_name,
                moduleDesc=module_desc
            )
            db.session.add(new_module)
            db.session.flush()  # Flush to ensure new module is in DB

            # Update module assignments to point to new module
            ModuleAssignment.query.filter_by(moduleID=old_module_id).update({
                "moduleID": new_module_id
            })

            # Delete old module
            db.session.delete(module)
        else:
            # Just update the existing module's details
            module.moduleName = module_name
            module.moduleDesc = module_desc

        db.session.commit()

        return jsonify({
            "message": "Module updated successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500