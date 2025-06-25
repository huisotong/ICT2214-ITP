from flask import Blueprint, request, jsonify
from app.models.users import User
from app.models.module_assignment import ModuleAssignment
from app.models.students import Student
from app.models.module import Module
from app.db import db
import csv
from io import TextIOWrapper

add_students_bp = Blueprint('add_students', __name__)

# 🔹 Enroll a single student into a module
@add_students_bp.route('/enroll-student', methods=['POST'])
def enroll_single_student():
    data = request.get_json()
    student_id = data.get('studentID', '').strip()
    module_id = data.get('moduleID')

    if not all([student_id, module_id]):
        return jsonify({'error': 'Missing studentID or moduleID'}), 400

    try:
        # Check if student exists in Students table
        student = Student.query.filter_by(studentID=student_id).first()
        if not student:
            return jsonify({'error': f'Student ID {student_id} not found'}), 404

        # Check if user exists in User table
        user = User.query.filter_by(studentID=student_id).first()
        if not user:
            user = User(
                name=student.fullName,
                studentID=student_id,
                email=student.email,
                password="teststudent",
                role="Student"
            )
            db.session.add(user)
            db.session.flush()  # Get userID

        # Check if already enrolled
        existing = ModuleAssignment.query.filter_by(userID=user.userID, moduleID=module_id).first()
        if existing:
            return jsonify({'error': 'Student already enrolled in this module'}), 400

        module = Module.query.filter_by(moduleID=module_id).first()
        if not module:
            return jsonify({'error': f'Module {module_id} not found'}), 404

        assignment = ModuleAssignment(
            userID=user.userID,
            moduleID=module_id,
            studentCredits=module.initialCredit
        )

        db.session.add(assignment)
        db.session.commit()

        return jsonify({'message': f'Student {user.name} enrolled successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
        module = Module.query.filter_by(moduleID=module_id).first()
        if not module:
            return jsonify({'error': f'Module {module_id} not found'}), 404

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
                skipped.append(f"Invalid ID format: {student_id}")
                continue

            student = Student.query.filter_by(studentID=student_id).first()
            if not student:
                skipped.append(f"Student ID not found: {student_id}")
                continue

            user = User.query.filter_by(studentID=student_id).first()
            if not user:
                user = User(
                    name=student.fullName,
                    studentID=student_id,
                    email=student.email,
                    password="teststudent",
                    role="Student"
                )
                db.session.add(user)
                db.session.flush()

            existing = ModuleAssignment.query.filter_by(userID=user.userID, moduleID=module_id).first()
            if existing:
                skipped.append(f"Already enrolled: {student_id}")
                continue

            db.session.add(ModuleAssignment(
                userID=user.userID,
                moduleID=module_id,
                studentCredits=module.initialCredit
            ))
            count += 1

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

# 🔹 Delete an assignment
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

# 🔹 Search students
@add_students_bp.route('/search-students', methods=['GET'])
def search_students():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])

    try:
        results = Student.query.filter(Student.studentID.ilike(f"{query}%")).limit(10).all()
        return jsonify([
            {"studentID": student.studentID, "fullName": student.fullName}
            for student in results
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
