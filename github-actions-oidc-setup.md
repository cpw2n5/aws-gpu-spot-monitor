# GitHub Actions OIDC Authentication with AWS

This document explains how to set up and use OpenID Connect (OIDC) authentication between GitHub Actions and AWS for the aws-gpu-spot-monitor project.

## Overview

Instead of storing long-lived AWS credentials as GitHub secrets, we use OpenID Connect (OIDC) to establish a trust relationship between GitHub Actions and AWS. This approach has several advantages:

- **Enhanced Security**: No long-lived credentials stored in GitHub
- **Simplified Management**: No need to rotate credentials
- **Fine-grained Permissions**: Different roles for different environments
- **Reduced Risk**: Temporary credentials with limited scope

## Architecture

The setup consists of:

1. **AWS OIDC Provider**: Establishes trust with GitHub's OIDC provider
2. **IAM Roles**: Environment-specific roles (dev, staging, prod) that GitHub Actions can assume
3. **IAM Policies**: Least-privilege permissions for each role
4. **GitHub Actions Workflows**: Updated to use OIDC authentication

## Prerequisites

- AWS account with permissions to create IAM resources
- GitHub repository for the aws-gpu-spot-monitor project
- Terraform installed locally

## Setup Instructions

### 1. Deploy the OIDC Provider and IAM Roles

The Terraform module `github_actions_oidc` creates all necessary resources:

```bash
# Navigate to the terraform directory
cd terraform

# Initialize Terraform
terraform init

# Apply the configuration
terraform apply
```

This will create:
- OIDC provider for GitHub Actions
- IAM roles for dev, staging, and prod environments
- IAM policies with appropriate permissions

### 2. Configure GitHub Repository Secrets

Add the following secrets to your GitHub repository:

- `AWS_ACCOUNT_ID`: Your AWS account ID
- `AWS_REGION`: The AWS region (e.g., us-east-1)

These are the only AWS-related secrets needed, as authentication will happen via OIDC.

### 3. Use the Updated GitHub Actions Workflows

Three workflows have been created with OIDC authentication:

- `infrastructure-deploy-oidc.yml`: Deploys Terraform infrastructure
- `backend-deploy-oidc.yml`: Deploys the backend Lambda functions
- `frontend-deploy-oidc.yml`: Deploys the frontend to S3/CloudFront

To use these workflows:

1. Enable the workflows in your GitHub repository
2. Trigger them manually or via push to the appropriate branches

## How It Works

1. When a GitHub Actions workflow runs, it requests a token from GitHub's OIDC provider
2. The token contains claims about the workflow, repository, and branch
3. AWS validates the token against the configured OIDC provider
4. If valid, AWS issues temporary credentials for the appropriate IAM role
5. GitHub Actions uses these credentials to perform AWS operations

## Workflow Details

### Infrastructure Deployment

The `infrastructure-deploy-oidc.yml` workflow:

- Runs on pushes to `main` or `develop` branches that modify Terraform files
- Can be triggered manually for any environment
- Performs Terraform validation and security scanning
- Deploys infrastructure to the appropriate environment
- Requires manual approval for production deployments

### Backend Deployment

The `backend-deploy-oidc.yml` workflow:

- Runs on pushes to `main` or `develop` branches that modify backend files
- Can be triggered manually for any environment
- Performs testing and security scanning
- Deploys the backend to the appropriate environment using Serverless Framework

### Frontend Deployment

The `frontend-deploy-oidc.yml` workflow:

- Runs on pushes to `main` or `develop` branches that modify frontend files
- Can be triggered manually for any environment
- Builds and tests the frontend
- Deploys to the appropriate S3 bucket
- Invalidates the CloudFront cache

## Troubleshooting

### Common Issues

1. **Role Assumption Fails**: Verify that the GitHub repository name matches what's configured in the IAM role trust policy
2. **Permission Denied**: Check that the IAM role has the necessary permissions for the operations being performed
3. **Missing Environment Variables**: Ensure all required environment variables are set in the workflow

### Logs and Debugging

- Check the GitHub Actions workflow logs for detailed error messages
- Use the AWS CloudTrail service to audit API calls and identify permission issues
- Verify the OIDC provider configuration in the AWS IAM console

## Security Considerations

- The IAM roles are configured with least-privilege permissions
- Each environment has its own dedicated role
- The trust relationship is scoped to your specific GitHub repository
- Production deployments require manual approval

## Cost Optimization

- OIDC authentication itself has no additional cost
- The workflows are designed to minimize GitHub Actions minutes:
  - Caching dependencies
  - Skipping unnecessary steps with path filters
  - Running jobs only when relevant files change