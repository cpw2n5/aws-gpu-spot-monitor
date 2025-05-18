# Variables for the DynamoDB module

variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "table_prefix" {
  description = "The prefix for DynamoDB table names"
  type        = string
}

variable "billing_mode" {
  description = "The billing mode for DynamoDB tables"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PROVISIONED", "PAY_PER_REQUEST"], var.billing_mode)
    error_message = "DynamoDB billing mode must be either PROVISIONED or PAY_PER_REQUEST."
  }
}

variable "read_capacity" {
  description = "The read capacity for DynamoDB tables (only used if billing_mode is PROVISIONED)"
  type        = number
  default     = 5
}

variable "write_capacity" {
  description = "The write capacity for DynamoDB tables (only used if billing_mode is PROVISIONED)"
  type        = number
  default     = 5
}

variable "enable_point_in_time_recovery" {
  description = "Whether to enable point-in-time recovery for DynamoDB tables"
  type        = bool
  default     = true
}