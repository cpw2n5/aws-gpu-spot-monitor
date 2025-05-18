# AWS GPU Spot Instance Monitor with Folding@Home Integration

This project provides a comprehensive solution for monitoring and managing AWS GPU Spot Instances with Folding@Home integration. It includes infrastructure as code, CI/CD pipelines, monitoring, and security configurations.

## Architecture Overview

The system consists of the following components:

1. **Backend Services**: Lambda functions that handle API requests, spot price monitoring, and instance management.
2. **API Gateway**: REST API for frontend communication.
3. **DynamoDB**: NoSQL database for storing user data, instance information, folding configurations, and spot price history.
4. **Cognito**: User authentication and authorization.
5. **S3 & CloudFront**: Frontend hosting and content delivery.
6. **CloudWatch**: Monitoring, logging, and alerting.
7. **EC2 Spot Instances**: GPU instances running Folding@Home.

## Infrastructure as Code

The infrastructure is defined using Terraform and organized into modules for better maintainability:

- **Lambda**: API handlers and background processing functions
- **API Gateway**: REST API configuration with Cognito authorizers
- **DynamoDB**: Database tables with appropriate indexes
- **Cognito**: User pools and identity pools
- **S3**: Frontend hosting with CloudFront distribution
- **CloudWatch**: Dashboards, alarms, and log groups
- **IAM**: Roles and policies with least privilege
- **EC2**: Spot instance configuration and launch templates

### Directory Structure

```
terraform/
├── modules/
│   ├── lambda/
│   ├── api_gateway/
│   ├── dynamodb/
│   ├── cognito/
│   ├── s3/
│   ├── cloudwatch/
│   ├── iam/
│   └── ec2/
└── environments/
    ├── dev/
    ├── staging/
    └── prod/
```

## Deployment Pipeline

The project uses GitHub Actions for CI/CD with three main workflows:

1. **Backend Deployment**: Deploys the Lambda functions and API Gateway configuration.
2. **Frontend Deployment**: Builds and deploys the React frontend to S3/CloudFront.
3. **Infrastructure Deployment**: Applies Terraform changes to provision or update AWS resources.

Each workflow includes:
- Testing and linting
- Security scanning
- Environment-specific deployments (dev, staging, prod)

### Deployment Process

1. Changes pushed to the `develop` branch trigger deployments to the dev environment.
2. Changes pushed to the `main` branch trigger deployments to the staging environment.
3. Production deployments require manual approval through workflow dispatch.

## Monitoring and Logging

The system includes comprehensive monitoring and logging:

- **CloudWatch Dashboards**: Visualize API Gateway, Lambda, DynamoDB, and EC2 metrics.
- **CloudWatch Alarms**: Alert on critical metrics like errors, throttling, and high latency.
- **Structured Logging**: JSON-formatted logs for better searchability.
- **Log Aggregation**: All logs are centralized in CloudWatch Log Groups.

## Security Configuration

Security is implemented at multiple levels:

- **API Gateway**: WAF rules, CORS configuration, and Cognito authorizers.
- **IAM**: Least privilege roles and policies for all components.
- **S3**: Secure bucket policies with encryption at rest.
- **DynamoDB**: Encryption at rest and in transit.
- **CloudFront**: HTTPS-only communication with modern TLS.
- **EC2**: Security groups with minimal required access.

## Instance Deployment Template

EC2 instances are configured using a cloud-init script that:

1. Installs and configures Folding@Home with GPU support.
2. Sets up CloudWatch monitoring for GPU metrics.
3. Implements graceful shutdown handling for spot interruptions.
4. Reports status back to the management system.

## Getting Started

### Prerequisites

- AWS Account with appropriate permissions
- Terraform 1.0.0 or later
- Node.js 18.x or later
- AWS CLI configured with appropriate credentials

### Initial Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/aws-gpu-spot-monitor.git
   cd aws-gpu-spot-monitor
   ```

2. Create S3 buckets for Terraform state:
   ```
   aws s3 mb s3://aws-gpu-spot-monitor-terraform-state-dev
   aws s3 mb s3://aws-gpu-spot-monitor-terraform-state-staging
   aws s3 mb s3://aws-gpu-spot-monitor-terraform-state-prod
   ```

3. Create DynamoDB tables for state locking:
   ```
   aws dynamodb create-table \
     --table-name aws-gpu-spot-monitor-terraform-state-lock-dev \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST

   aws dynamodb create-table \
     --table-name aws-gpu-spot-monitor-terraform-state-lock-staging \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST

   aws dynamodb create-table \
     --table-name aws-gpu-spot-monitor-terraform-state-lock-prod \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```

### Deployment

#### Infrastructure Deployment

1. Navigate to the environment directory:
   ```
   cd terraform/environments/dev
   ```

2. Initialize Terraform:
   ```
   terraform init
   ```

3. Apply the configuration:
   ```
   terraform apply
   ```

#### Backend Deployment

1. Install dependencies:
   ```
   npm install
   ```

2. Deploy with Serverless Framework:
   ```
   npx serverless deploy --stage dev
   ```

#### Frontend Deployment

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the frontend:
   ```
   npm run build
   ```

4. Deploy to S3:
   ```
   aws s3 sync build/ s3://aws-gpu-spot-monitor-dev-frontend
   ```

## Environment Variables

The following environment variables are required for deployment:

- `AWS_ACCESS_KEY_ID`: AWS access key with appropriate permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `FOLDING_AT_HOME_TEAM_ID`: Folding@Home team ID
- `FOLDING_AT_HOME_PASSKEY`: Folding@Home passkey

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.