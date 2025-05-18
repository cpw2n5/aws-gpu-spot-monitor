# Variables for the CloudWatch module

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

variable "lambda_function_name" {
  description = "The name of the Lambda function"
  type        = string
}

variable "api_gateway_name" {
  description = "The name of the API Gateway"
  type        = string
}

variable "dynamodb_table_prefix" {
  description = "The prefix for DynamoDB table names"
  type        = string
}

variable "enable_sns_alerts" {
  description = "Whether to enable SNS alerts"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "The email address to send alerts to"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "The number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "alarm_evaluation_periods" {
  description = "The number of periods over which data is compared to the specified threshold"
  type        = number
  default     = 1
}

variable "alarm_period" {
  description = "The period in seconds over which the specified statistic is applied"
  type        = number
  default     = 60
}

variable "api_gateway_5xx_error_threshold" {
  description = "The threshold for API Gateway 5XX errors"
  type        = number
  default     = 5
}

variable "lambda_error_threshold" {
  description = "The threshold for Lambda errors"
  type        = number
  default     = 3
}

variable "lambda_duration_threshold" {
  description = "The threshold for Lambda duration in milliseconds"
  type        = number
  default     = 5000
}

variable "dynamodb_throttled_requests_threshold" {
  description = "The threshold for DynamoDB throttled requests"
  type        = number
  default     = 1
}

variable "api_gateway_4xx_error_threshold" {
  description = "The threshold for API Gateway 4XX errors"
  type        = number
  default     = 10
}

variable "api_gateway_latency_threshold" {
  description = "The threshold for API Gateway latency in milliseconds"
  type        = number
  default     = 3000
}

variable "spot_instance_health_threshold" {
  description = "The threshold for spot instance health (percentage)"
  type        = number
  default     = 70
}

variable "folding_progress_threshold" {
  description = "The threshold for Folding@Home progress (percentage)"
  type        = number
  default     = 10
}

variable "spot_price_anomaly_threshold" {
  description = "The threshold for spot price anomaly detection score"
  type        = number
  default     = 0.8
}