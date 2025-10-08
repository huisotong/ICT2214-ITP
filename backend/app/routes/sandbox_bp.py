from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.users import User
from app.models.students import Student
from app.db import db
import boto3
import os
from botocore.exceptions import ClientError

sandbox_bp = Blueprint('sandbox', __name__)

# AWS Organizations client initialization
def get_organizations_client():
    """Initialize AWS Organizations client with credentials from environment"""
    return boto3.client(
        'organizations',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )

@sandbox_bp.route('/provision-sandbox', methods=['POST'])
@jwt_required()
def provision_sandbox():
    """
    Provision AWS sandbox account for authenticated student
    Returns:
        - 200: Account already exists
        - 201: New account created successfully
        - 400: User is not a student
        - 500: AWS API error or database error
    """
    try:
        # Get current user from JWT
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is a student (has studentID)
        if not user.studentID:
            return jsonify({'error': 'Only students can provision sandbox accounts'}), 400
        
        # Get student record
        student = Student.query.get(user.studentID)
        
        if not student:
            return jsonify({'error': 'Student record not found'}), 404
        
        # Check if student already has an AWS account
        if student.awsAccountId:
            return jsonify({
                'status': 'existing',
                'message': 'AWS sandbox account already exists',
                'awsAccountId': student.awsAccountId
            }), 200
        
        # Transform email using plus addressing
        # Format: 2301823+{studentEmail}@sit.singaporetech.edu.sg
        student_email_prefix = student.email.split('@')[0] if '@' in student.email else student.email
        transformed_email = f"2301823+{student_email_prefix}@sit.singaporetech.edu.sg"
        
        # Account name format: SIT-Sandbox-{studentID}
        account_name = f"SIT-Sandbox-{student.studentID}"
        
        # Initialize AWS Organizations client
        org_client = get_organizations_client()
        
        # Create AWS account
        response = org_client.create_account(
            Email=transformed_email,
            AccountName=account_name,
            RoleName='OrganizationAccountAccessRole',  # Standard role for management access
            IamUserAccessToBilling='DENY'  # Restrict billing access for students
        )
        
        # Get the CreateAccountStatus
        create_account_status = response.get('CreateAccountStatus', {})
        request_id = create_account_status.get('Id')
        state = create_account_status.get('State')
        
        # Check if account creation was initiated successfully
        if state == 'IN_PROGRESS':
            # Poll for account creation completion (with timeout)
            max_attempts = 30  # 30 attempts * 2 seconds = 60 seconds timeout
            attempt = 0
            
            while attempt < max_attempts:
                status_response = org_client.describe_create_account_status(
                    CreateAccountRequestId=request_id
                )
                
                status = status_response.get('CreateAccountStatus', {})
                current_state = status.get('State')
                
                if current_state == 'SUCCEEDED':
                    account_id = status.get('AccountId')
                    
                    # Store AWS Account ID in database
                    student.awsAccountId = account_id
                    db.session.commit()
                    
                    return jsonify({
                        'status': 'success',
                        'message': 'AWS sandbox account created successfully',
                        'awsAccountId': account_id,
                        'accountName': account_name,
                        'email': transformed_email
                    }), 201
                
                elif current_state == 'FAILED':
                    failure_reason = status.get('FailureReason', 'Unknown error')
                    return jsonify({
                        'status': 'error',
                        'message': f'Account creation failed: {failure_reason}'
                    }), 500
                
                # Wait before next poll
                import time
                time.sleep(2)
                attempt += 1
            
            # Timeout reached
            return jsonify({
                'status': 'error',
                'message': 'Account creation timed out. Please check AWS console for status.',
                'requestId': request_id
            }), 500
        
        else:
            # Unexpected state
            return jsonify({
                'status': 'error',
                'message': f'Unexpected account creation state: {state}'
            }), 500
    
    except ClientError as e:
        # AWS API error
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        return jsonify({
            'status': 'error',
            'message': f'AWS Error: {error_message}',
            'errorCode': error_code
        }), 500
    
    except Exception as e:
        # General error
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), 500
