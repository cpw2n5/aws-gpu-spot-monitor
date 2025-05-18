# Variables for the API Gateway module

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

variable "stage_name" {
  description = "The name of the API Gateway stage"
  type        = string
  default     = "api"
}

variable "lambda_invoke_arn" {
  description = "The invoke ARN of the Lambda function"
  type        = string
}

variable "lambda_function_name" {
  description = "The name of the Lambda function"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "The ARN of the Cognito User Pool"
  type        = string
}

variable "cors_origin" {
  description = "The allowed origin for CORS"
  type        = string
  default     = "'*'"
}

variable "enable_waf" {
  description = "Whether to enable WAF for API Gateway"
  type        = bool
  default     = true
}

variable "enable_xray" {
  description = "Whether to enable X-Ray tracing"
  type        = bool
  default     = false
}