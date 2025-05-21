# Input variables for the AWS GPU Spot Monitor Terraform configuration

variable "aws_region" {
  description = "The AWS region to deploy resources to"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "aws-gpu-spot-monitor"
}

variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "dynamodb_billing_mode" {
  description = "The billing mode for DynamoDB tables"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PROVISIONED", "PAY_PER_REQUEST"], var.dynamodb_billing_mode)
    error_message = "DynamoDB billing mode must be either PROVISIONED or PAY_PER_REQUEST."
  }
}

variable "lambda_runtime" {
  description = "The runtime for Lambda functions"
  type        = string
  default     = "nodejs18.x"
}

variable "lambda_timeout" {
  description = "The timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "The memory size for Lambda functions in MB"
  type        = number
  default     = 256
}

variable "api_gateway_stage_name" {
  description = "The name of the API Gateway stage"
  type        = string
  default     = "api"
}

variable "cognito_password_policy" {
  description = "The password policy for Cognito user pool"
  type = object({
    minimum_length    = number
    require_lowercase = bool
    require_numbers   = bool
    require_symbols   = bool
    require_uppercase = bool
  })
  default = {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }
}

variable "frontend_domain" {
  description = "The domain name for the frontend application"
  type        = string
  default     = ""
}

variable "enable_waf" {
  description = "Whether to enable WAF for API Gateway"
  type        = bool
  default     = true
}

variable "enable_cloudwatch_logs" {
  description = "Whether to enable CloudWatch logs"
  type        = bool
  default     = true
}

variable "enable_cloudwatch_metrics" {
  description = "Whether to enable CloudWatch metrics"
  type        = bool
  default     = true
}

variable "enable_xray" {
  description = "Whether to enable X-Ray tracing"
  type        = bool
  default     = false
}

variable "spot_instance_types" {
  description = "List of EC2 instance types to use for spot instances"
  type        = list(string)
  default     = ["g4dn.xlarge", "p3.2xlarge", "g3s.xlarge"]
}

variable "spot_max_price" {
  description = "The maximum price to pay for spot instances"
  type        = string
  default     = ""  # Empty string means on-demand price
}

variable "folding_at_home_team_id" {
  description = "The Folding@Home team ID"
  type        = string
  default     = ""
}

variable "folding_at_home_passkey" {
  description = "The Folding@Home passkey"
  type        = string
  default     = ""
  sensitive   = true
}

variable "github_repository" {
  description = "The GitHub repository in the format 'owner/repo'"
  type        = string
  default     = "yourusername/aws-gpu-spot-monitor"
}