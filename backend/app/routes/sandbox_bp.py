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
            max_attempts = 300  # 300 attempts * 2 seconds = 600 seconds timeout
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


@sandbox_bp.route('/sagemaker-login-url', methods=['GET'])
@jwt_required()
def get_sagemaker_login_url():
    """
    Generate SageMaker Studio presigned URL for authenticated student
    Returns:
        - 200: Presigned URL successfully generated
        - 400: User is not a student or no AWS account provisioned
        - 404: SageMaker domain not found (still being provisioned)
        - 500: AWS API error
    """
    try:
        # Get current user from JWT
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is a student
        if not user.studentID:
            return jsonify({'error': 'Only students can access SageMaker sandbox'}), 400
        
        # Get student record
        student = Student.query.get(user.studentID)
        
        if not student:
            return jsonify({'error': 'Student record not found'}), 404
        
        # Check if student has an AWS account provisioned
        if not student.awsAccountId:
            return jsonify({'error': 'No AWS sandbox account found. Please provision an account first.'}), 400
        
        # Extract userProfileName from account name pattern
        # Account name format: SIT-Sandbox-{studentID}
        user_profile_name = f"SIT-Sandbox-{student.studentID}"
        
        # Initialize STS client with management account credentials
        # STS is a global service but we use ap-southeast-2 for consistency
        sts_client = boto3.client(
            'sts',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name='ap-southeast-2'
        )
        
        # Assume role in student's child account
        role_arn = f"arn:aws:iam::{student.awsAccountId}:role/OrganizationAccountAccessRole"
        
        assumed_role = sts_client.assume_role(
            RoleArn=role_arn,
            RoleSessionName=f"sagemaker-session-{student.studentID}"
        )
        
        # Extract temporary credentials
        credentials = assumed_role['Credentials']
        
        # Create SageMaker client with temporary credentials
        # IMPORTANT: All SageMaker resources are in ap-southeast-2 (Sydney)
        sagemaker_client = boto3.client(
            'sagemaker',
            aws_access_key_id=credentials['AccessKeyId'],
            aws_secret_access_key=credentials['SecretAccessKey'],
            aws_session_token=credentials['SessionToken'],
            region_name='ap-southeast-2'
        )
        
        # List domains to find the SageMaker Studio domain
        domains_response = sagemaker_client.list_domains()
        domains = domains_response.get('Domains', [])
        
        # DEBUG: Prepare debug info
        debug_info = {
            'awsAccountId': student.awsAccountId,
            'studentID': student.studentID,
            'userProfileName': user_profile_name,
            'region': 'ap-southeast-2',  # Fixed region for SageMaker resources
            'roleArn': role_arn,
            'domainsFound': len(domains),
            'domainsList': [{'DomainId': d.get('DomainId'), 'DomainName': d.get('DomainName')} for d in domains]
        }
        
        if not domains:
            return jsonify({
                'error': 'Your sandbox is still being provisioned. Please try again in a few minutes.',
                'debug': debug_info  # Include debug info
            }), 404
        
        # Use the first domain (assuming one domain per account)
        domain_id = domains[0]['DomainId']
        debug_info['selectedDomainId'] = domain_id
        
        # List user profiles to verify the user profile exists
        try:
            user_profiles_response = sagemaker_client.list_user_profiles(DomainIdEquals=domain_id)
            user_profiles = user_profiles_response.get('UserProfiles', [])
            debug_info['userProfilesFound'] = len(user_profiles)
            debug_info['userProfilesList'] = [{'UserProfileName': up.get('UserProfileName'), 'Status': up.get('Status')} for up in user_profiles]
        except Exception as profile_error:
            debug_info['userProfilesError'] = str(profile_error)
        
        # Create presigned URL for SageMaker Studio
        presigned_url_response = sagemaker_client.create_presigned_domain_url(
            DomainId=domain_id,
            UserProfileName=user_profile_name
        )
        
        authorized_url = presigned_url_response.get('AuthorizedUrl')
        
        if not authorized_url:
            return jsonify({
                'error': 'Failed to generate SageMaker login URL',
                'debug': debug_info
            }), 500
        
        return jsonify({
            'loginUrl': authorized_url,
            'debug': debug_info  # Temporarily include debug info
        }), 200
    
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        # Handle specific AWS errors
        if error_code == 'ResourceNotFoundException':
            return jsonify({
                'error': 'Your sandbox is still being provisioned. Please try again in a few minutes.'
            }), 404
        
        return jsonify({
            'error': f'AWS Error: {error_message}',
            'errorCode': error_code
        }), 500
    
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500


@sandbox_bp.route('/setup-sandbox', methods=['POST'])
@jwt_required()
def setup_sandbox():
    """
    Trigger Lambda function to setup SageMaker environment for authenticated student
    Returns:
        - 202: Lambda invocation started successfully
        - 400: User is not a student or no AWS account provisioned
        - 500: Lambda invocation error
    """
    try:
        # Get current user from JWT
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is a student
        if not user.studentID:
            return jsonify({'error': 'Only students can setup SageMaker sandbox'}), 400
        
        # Get student record
        student = Student.query.get(user.studentID)
        
        if not student:
            return jsonify({'error': 'Student record not found'}), 404
        
        # Check if student has an AWS account provisioned
        if not student.awsAccountId:
            return jsonify({'error': 'No AWS sandbox account found. Please provision an account first.'}), 400
        
        # Get student's transformed email (plus-addressed format)
        student_email_prefix = student.email.split('@')[0] if '@' in student.email else student.email
        transformed_email = f"2301823+{student_email_prefix}@sit.singaporetech.edu.sg"
        
        # Construct the Lambda event payload matching the EventBridge format
        lambda_payload = {
            "detail": {
                "responseElements": {
                    "createAccountStatus": {
                        "accountId": student.awsAccountId
                    }
                },
                "requestParameters": {
                    "email": transformed_email
                }
            }
        }
        
        # Initialize Lambda client for ap-southeast-2 region
        lambda_client = boto3.client(
            'lambda',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name='ap-southeast-2'
        )
        
        # Invoke Lambda function asynchronously
        import json
        response = lambda_client.invoke(
            FunctionName='SandboxProvisioningFunction',
            InvocationType='Event',  # Asynchronous invocation
            Payload=json.dumps(lambda_payload)
        )
        
        # Check if invocation was accepted
        status_code = response.get('StatusCode')
        if status_code == 202:
            return jsonify({
                'message': 'Sandbox setup has been started. It may take up to 10 minutes.'
            }), 202
        else:
            return jsonify({
                'error': f'Lambda invocation returned unexpected status: {status_code}'
            }), 500
    
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        
        return jsonify({
            'error': f'AWS Error: {error_message}',
            'errorCode': error_code
        }), 500
    
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500
