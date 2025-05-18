# Variables for the IAM module

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

variable "aws_region" {
  description = "The AWS region to deploy resources to"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "The AWS account ID"
  type        = string
  default     = ""
}

variable "dynamodb_table_prefix" {
  description = "The prefix for DynamoDB table names"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "The ARN of the Cognito User Pool"
  type        = string
  default     = ""
}

variable "lambda_in_vpc" {
  description = "Whether the Lambda function is deployed in a VPC"
  type        = bool
  default     = false
}

variable "enable_xray" {
  description = "Whether to enable X-Ray tracing"
  type        = bool
  default     = false
}

variable "folding_config_bucket" {
  description = "The name of the S3 bucket for Folding@Home configuration"
  type        = string
  default     = ""
}