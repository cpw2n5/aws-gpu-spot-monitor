# Variables for the Lambda module

variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "aws-gpu-spot-monitor"
}

variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
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

variable "lambda_role_arn" {
  description = "The ARN of the IAM role for Lambda functions"
  type        = string
}

variable "api_gateway_execution_arn" {
  description = "The execution ARN of the API Gateway"
  type        = string
}

variable "user_pool_id" {
  description = "The ID of the Cognito User Pool"
  type        = string
}

variable "user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client"
  type        = string
}

variable "dynamodb_table_prefix" {
  description = "The prefix for DynamoDB table names"
  type        = string
}

variable "enable_xray" {
  description = "Whether to enable X-Ray tracing"
  type        = bool
  default     = false
}