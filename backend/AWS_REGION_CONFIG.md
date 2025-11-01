# AWS Region Configuration Guide

## 🌏 Region Overview

Your infrastructure spans **two AWS regions** with specific purposes:

### **ap-southeast-2 (Sydney)** - PRIMARY REGION
- ✅ **SageMaker Studio Domains** (child accounts)
- ✅ **SageMaker User Profiles** (child accounts)
- ✅ **VPC and Networking** (child accounts)
- ✅ **IAM Roles** (child accounts)
- ✅ **Lambda Function** (`SandboxProvisioningFunction`)
- ✅ **EventBridge Rules**
- ✅ **All Flask SageMaker API calls**

### **us-east-1 (N. Virginia)** - BUDGETS ONLY
- ✅ **AWS Budgets API** (global service, must use us-east-1)
- ⚠️ **ONLY** used inside Lambda for `budgets_client`

---

## 🔧 Flask Backend Configuration

Important Note: All AWS accounts take one to two days to set up. Use 2301010 as a test account.

### **Current Implementation** (`sandbox_bp.py`)

All Flask endpoints now use **hardcoded `ap-southeast-2`**:

#### **1. SageMaker Login Endpoint** (`/api/sagemaker-login-url`)
```python
# STS Client (for assuming role)
sts_client = boto3.client('sts', region_name='ap-southeast-2')

# SageMaker Client (for accessing Studio)
sagemaker_client = boto3.client('sagemaker', region_name='ap-southeast-2')
```

#### **2. Setup Sandbox Endpoint** (`/api/setup-sandbox`)
```python
# Lambda Client (to invoke provisioning function)
lambda_client = boto3.client('lambda', region_name='ap-southeast-2')
```

#### **3. Provision Sandbox Endpoint** (`/api/provision-sandbox`)
```python
# Organizations Client (global service, uses default region)
# Can use any region, but using us-east-1 for consistency with global APIs
org_client = boto3.client('organizations', region_name='us-east-1')
```

---

## 🔒 Environment Variables (.env)

### **Recommended Configuration:**

```env
# AWS Credentials (Management Account)
AWS_ACCESS_KEY_ID=AKIA******************
AWS_SECRET_ACCESS_KEY=****************************************

# Primary region for all SageMaker resources
AWS_REGION=ap-southeast-2
```

**Note**: Even though `AWS_REGION` is set, Flask code now uses **hardcoded regions** to prevent configuration errors.

---

## 🎯 Lambda Function Configuration

Your `SandboxProvisioningFunction` Lambda must be configured correctly:

### **Lambda Location:**
- ✅ **Region**: `ap-southeast-2` (Sydney)
- ✅ **Runtime**: Python 3.x
- ✅ **Timeout**: 15 minutes (900 seconds)

### **Lambda Code - Region Configuration:**

```python
import boto3

def lambda_handler(event, context):
    # Get account ID and email from event
    account_id = event['detail']['responseElements']['createAccountStatus']['accountId']
    email = event['detail']['requestParameters']['email']
    
    # ALL resources in ap-southeast-2 (Sydney)
    sagemaker_client = boto3.client('sagemaker', region_name='ap-southeast-2')
    ec2_client = boto3.client('ec2', region_name='ap-southeast-2')
    iam_client = boto3.client('iam', region_name='ap-southeast-2')
    sts_client = boto3.client('sts', region_name='ap-southeast-2')
    
    # EXCEPTION: Budgets client MUST use us-east-1 (global service)
    budgets_client = boto3.client('budgets', region_name='us-east-1')
    
    # Create SageMaker domain, VPC, roles, etc. in ap-southeast-2
    # ...
```

---

## 🐛 Troubleshooting Region Issues

### **Problem 1: "ResourceNotFoundException" for SageMaker Domain**

**Symptoms**:
- Domain exists in AWS Console
- Flask returns 404 "domain not found"

**Cause**: Flask looking in wrong region

**Solution**:
1. Verify domain exists in `ap-southeast-2`:
   ```bash
   aws sagemaker list-domains --region ap-southeast-2 --profile child-account
   ```
2. Verify Flask is using `ap-southeast-2` (check debug info)
3. Ensure Lambda created domain in `ap-southeast-2`

---

### **Problem 2: "Lambda Function Not Found"**

**Symptoms**:
- Flask returns "ResourceNotFoundException" when clicking "Setup SageMaker"

**Cause**: Lambda doesn't exist in `ap-southeast-2`

**Solution**:
1. Check Lambda exists in correct region:
   ```bash
   aws lambda get-function --function-name SandboxProvisioningFunction --region ap-southeast-2
   ```
2. If Lambda is in different region, either:
   - Move Lambda to `ap-southeast-2`, OR
   - Update Flask `setup-sandbox` endpoint region

---

### **Problem 3: Lambda Creates Resources in Wrong Region**

**Symptoms**:
- Lambda executes successfully
- SageMaker domain not found
- Resources appear in different region

**Cause**: Lambda clients not configured with correct region

**Solution**:
Update Lambda code to use `region_name='ap-southeast-2'` for all clients (except budgets)

---

## 📋 Verification Checklist

### **Flask Backend:**
- [ ] `sagemaker-login-url` endpoint uses `region_name='ap-southeast-2'`
- [ ] `setup-sandbox` endpoint uses `region_name='ap-southeast-2'`
- [ ] Debug info shows `region: 'ap-southeast-2'`

### **Lambda Function:**
- [ ] Lambda deployed in `ap-southeast-2` (Sydney)
- [ ] Lambda timeout set to 10 minutes (600 seconds)
- [ ] `sagemaker_client` uses `region_name='ap-southeast-2'`
- [ ] `ec2_client` uses `region_name='ap-southeast-2'`
- [ ] `iam_client` uses `region_name='ap-southeast-2'`
- [ ] `budgets_client` uses `region_name='us-east-1'` (only exception!)

### **Child Account Resources:**
- [ ] SageMaker domain exists in `ap-southeast-2`
- [ ] User profiles exist in `ap-southeast-2`
- [ ] VPC exists in `ap-southeast-2`

---

## 🎯 Quick Reference

| Service | Region | Used By |
|---------|--------|---------|
| **SageMaker Domain** | ap-southeast-2 | Lambda creates, Flask accesses |
| **SageMaker User Profile** | ap-southeast-2 | Lambda creates, Flask accesses |
| **VPC/Networking** | ap-southeast-2 | Lambda creates |
| **IAM Roles** | Global (created via ap-southeast-2) | Lambda creates |
| **Lambda Function** | ap-southeast-2 | Flask invokes |
| **AWS Budgets** | us-east-1 | Lambda creates |
| **AWS Organizations** | Global (us-east-1) | Flask creates accounts |

---

## 🚀 Region Best Practices

1. **Always Hardcode Regions**: Don't rely on environment variables for region
2. **Document Exceptions**: Only AWS Budgets uses us-east-1
3. **Verify Region in Debug**: Always include region in debug output
4. **Test with AWS CLI**: Use `--region` flag to verify resources exist in correct region
5. **Consistent Naming**: Use `ap-southeast-2` (not `apsoutheast2` or variations)

---

## 📝 Summary

✅ **Flask** → All SageMaker operations in `ap-southeast-2`  
✅ **Lambda** → All resource creation in `ap-southeast-2` (except Budgets)  
✅ **Child Accounts** → All resources in `ap-southeast-2`  
⚠️ **Budgets API** → Must use `us-east-1` (global service)  

**Last Updated**: November 1, 2025
