# Staging environment configuration for AWS GPU Spot Monitor

terraform {
  required_version = ">= 1.0.0"
  
  backend "s3" {
    bucket         = "aws-gpu-spot-monitor-terraform-state-staging"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "aws-gpu-spot-monitor-terraform-state-lock-staging"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "staging"
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "staging"
      ManagedBy   = "Terraform"
    }
  }
}

module "aws_gpu_spot_monitor" {
  source = "../../"
  
  environment             = "staging"
  aws_region              = var.aws_region
  project_name            = var.project_name
  dynamodb_billing_mode   = var.dynamodb_billing_mode
  lambda_runtime          = var.lambda_runtime
  lambda_timeout          = var.lambda_timeout
  lambda_memory_size      = var.lambda_memory_size
  api_gateway_stage_name  = var.api_gateway_stage_name
  cognito_password_policy = var.cognito_password_policy
  frontend_domain         = var.frontend_domain
  enable_waf              = var.enable_waf
  enable_cloudwatch_logs  = var.enable_cloudwatch_logs
  enable_cloudwatch_metrics = var.enable_cloudwatch_metrics
  enable_xray             = var.enable_xray
  spot_instance_types     = var.spot_instance_types
  spot_max_price          = var.spot_max_price
  folding_at_home_team_id = var.folding_at_home_team_id
  folding_at_home_passkey = var.folding_at_home_passkey
}