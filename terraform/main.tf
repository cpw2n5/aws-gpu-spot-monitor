# Main Terraform configuration for AWS GPU Spot Monitor

terraform {
  required_version = ">= 1.0.0"
  
  backend "s3" {
    # This will be configured per environment
    # Example:
    # bucket         = "aws-gpu-spot-monitor-terraform-state"
    # key            = "terraform.tfstate"
    # region         = "us-east-1"
    # dynamodb_table = "terraform-state-lock"
    # encrypt        = true
  }
}

# Import environment-specific variables
locals {
  environment = terraform.workspace
  common_tags = {
    Project     = "aws-gpu-spot-monitor"
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
}

# Lambda Module
module "lambda" {
  source      = "./modules/lambda"
  environment = local.environment
  common_tags = local.common_tags
  
  # Pass other required variables
  api_gateway_execution_arn = module.api_gateway.execution_arn
  dynamodb_table_prefix     = "aws-gpu-spot-monitor-${local.environment}"
  user_pool_id              = module.cognito.user_pool_id
  user_pool_client_id       = module.cognito.user_pool_client_id
}

# API Gateway Module
module "api_gateway" {
  source      = "./modules/api_gateway"
  environment = local.environment
  common_tags = local.common_tags
  
  # Pass other required variables
  lambda_invoke_arn = module.lambda.invoke_arn
  lambda_function_name = module.lambda.function_name
  cognito_user_pool_arn = module.cognito.user_pool_arn
}

# DynamoDB Module
module "dynamodb" {
  source      = "./modules/dynamodb"
  environment = local.environment
  common_tags = local.common_tags
  
  # Pass other required variables
  table_prefix = "aws-gpu-spot-monitor-${local.environment}"
}

# Cognito Module
module "cognito" {
  source      = "./modules/cognito"
  environment = local.environment
  common_tags = local.common_tags
  
  # Pass other required variables
  user_pool_name = "aws-gpu-spot-monitor-${local.environment}-user-pool"
}

# S3 Module for Frontend Hosting
module "s3" {
  source      = "./modules/s3"
  environment = local.environment
  common_tags = local.common_tags
  
  # Pass other required variables
  bucket_name = "aws-gpu-spot-monitor-${local.environment}-frontend"
}

# CloudWatch Module
module "cloudwatch" {
  source      = "./modules/cloudwatch"
  environment = local.environment
  common_tags = local.common_tags
  
  # Pass other required variables
  lambda_function_name = module.lambda.function_name
  api_gateway_name     = module.api_gateway.name
}

# IAM Module
module "iam" {
  source      = "./modules/iam"
  environment = local.environment
  common_tags = local.common_tags
  
  # Pass other required variables
  dynamodb_table_prefix = "aws-gpu-spot-monitor-${local.environment}"
}

# EC2 Module (for spot instance configuration)
module "ec2" {
  source      = "./modules/ec2"
  environment = local.environment
  common_tags = local.common_tags
  
  # Pass other required variables
  user_data_script = file("${path.module}/../instance-templates/folding-at-home-init.sh")
}