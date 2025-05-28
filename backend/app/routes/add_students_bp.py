from flask import Blueprint, request, jsonify
from app.models.users import User
from app.models.module_assignment import ModuleAssignment
from app.db import db
import csv
from io import TextIOWrapper

add_students_bp = Blueprint('add_students', __name__)

# 🔹 Enroll a single student into a module
@add_students_bp.route('/enroll-student', methods=['POST'])
def enroll_single_student():
    data = request.get_json()
    print("Received enroll student data:", data)
    name = data.get('name')
    student_id = data.get('studentID')
    module_id = data.get('moduleID')

    if not all([name, student_id, module_id]):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Check if student exists
        user = User.query.filter_by(studentID=student_id).first()
        if not user:
            user = User(
                name=name,
                studentID=student_id,
                email=f"{student_id}@example.com",
                password="defaultpassword",
                role="student"
            )
            db.session.add(user)
            db.session.flush()  # To get user.userID

        # Check if already assigned
        # Check if already assigned
        existing = ModuleAssignment.query.filter_by(userID=user.userID, moduleID=module_id).first()
        if existing:
            return jsonify({'error': 'User already in module'}), 400


        # Assign student
        assignment = ModuleAssignment(
            userID=user.userID,
            moduleID=module_id,
            studentCredits=1000
        )
        db.session.add(assignment)
        db.session.commit()

        return jsonify({'message': f'Student {student_id} enrolled successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# 🔹 View all module assignments
@add_students_bp.route('/view-module-assignments', methods=['GET'])
def view_module_assignments():
    assignments = ModuleAssignment.query.all()
    result = [
        {
            'assignmentID': a.assignmentID,
            'userID': a.userID,
            'moduleID': a.moduleID,
            'studentCredits': a.studentCredits
        }
        for a in assignments
    ]
    return jsonify(result), 200


# 🔹 Enroll multiple students from CSV
@add_students_bp.route('/enroll-students-csv', methods=['POST'])
def enroll_students_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No CSV file uploaded'}), 400

    file = request.files['file']
    module_id = request.form.get('moduleID')

    if not module_id:
        return jsonify({'error': 'Missing module ID'}), 400

    try:
        reader = csv.reader(TextIOWrapper(file, encoding='utf-8'))
        header_skipped = False
        count = 0
        skipped = []

        for row in reader:
            if not header_skipped:
                header_skipped = True
                continue

            if len(row) < 2:
                continue

            name, student_id = row[0].strip(), row[1].strip()
            if not student_id.isdigit():
                skipped.append(f"Invalid ID: {student_id}")
                continue

            # Check if user exists
            user = User.query.filter_by(studentID=student_id).first()
            if not user:
                user = User(
                    name=name,
                    studentID=student_id,
                    email=f"{student_id}@example.com",
                    password="defaultpassword",
                    role="student"
                )
                db.session.add(user)
                db.session.flush()

            # Check if already enrolled
            existing = ModuleAssignment.query.filter_by(userID=user.userID, moduleID=module_id).first()
            if not existing:
                db.session.add(ModuleAssignment(userID=user.userID, moduleID=module_id, studentCredits=1000))
                count += 1
            else:
                skipped.append(f"Already enrolled: {student_id}")

        db.session.commit()
        return jsonify({
            'message': f'{count} students enrolled successfully.',
            'skipped': skipped
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# 🔹 Get all students in a module
@add_students_bp.route('/students-in-module/<module_id>', methods=['GET'])
def get_students_in_module(module_id):
    try:
        assignments = ModuleAssignment.query.filter_by(moduleID=module_id).all()

        students = []
        for a in assignments:
            user = User.query.get(a.userID)
            if user:
                students.append({
                    'assignmentID': a.assignmentID,
                    'userID': a.userID,
                    'studentID': user.studentID,
                    'name': user.name,
                    'email': user.email,
                    'studentCredits': a.studentCredits
                })

        return jsonify(students), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 🔹 Delete an assignment (remove student from module)
@add_students_bp.route('/delete-assignment/<int:assignment_id>', methods=['DELETE'])
def delete_assignment(assignment_id):
    assignment = ModuleAssignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404

    try:
        db.session.delete(assignment)
        db.session.commit()
        return jsonify({'message': 'Assignment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
