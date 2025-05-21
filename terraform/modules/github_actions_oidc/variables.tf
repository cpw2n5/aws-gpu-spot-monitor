# Variables for GitHub Actions OIDC Module

variable "github_repository" {
  description = "The GitHub repository in the format 'owner/repo'"
  type        = string
  default     = "yourusername/aws-gpu-spot-monitor"
}

variable "aws_account_id" {
  description = "The AWS account ID"
  type        = string
}

variable "aws_region" {
  description = "The AWS region"
  type        = string
  default     = "us-east-1"
}

variable "terraform_state_bucket_prefix" {
  description = "Prefix for the S3 bucket used for Terraform state"
  type        = string
  default     = "aws-gpu-spot-monitor-terraform-state"
}

variable "terraform_state_lock_table_prefix" {
  description = "Prefix for the DynamoDB table used for Terraform state locking"
  type        = string
  default     = "aws-gpu-spot-monitor-terraform-state-lock"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {
    Project     = "aws-gpu-spot-monitor"
    ManagedBy   = "Terraform"
  }
}