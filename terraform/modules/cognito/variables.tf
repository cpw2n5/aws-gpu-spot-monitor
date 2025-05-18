# Variables for the Cognito module

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

variable "user_pool_name" {
  description = "The name of the Cognito User Pool"
  type        = string
}

variable "password_policy" {
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

variable "enable_mfa" {
  description = "Whether to enable MFA for Cognito user pool"
  type        = bool
  default     = false
}

variable "callback_urls" {
  description = "List of allowed callback URLs for the identity providers"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "logout_urls" {
  description = "List of allowed logout URLs for the identity providers"
  type        = list(string)
  default     = ["http://localhost:3000/"]
}

variable "api_gateway_execution_arn" {
  description = "The execution ARN of the API Gateway"
  type        = string
  default     = ""
}