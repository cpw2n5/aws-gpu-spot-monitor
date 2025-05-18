# Variables for the S3 module

variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "bucket_name" {
  description = "The name of the S3 bucket for frontend hosting"
  type        = string
}

variable "domain_name" {
  description = "The custom domain name for the frontend"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "The ID of the Route53 hosted zone for the custom domain"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "The ARN of the ACM certificate for the custom domain"
  type        = string
  default     = ""
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allowed_methods" {
  description = "List of allowed methods for CORS"
  type        = list(string)
  default     = ["GET", "HEAD"]
}

variable "cors_allowed_headers" {
  description = "List of allowed headers for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "cors_expose_headers" {
  description = "List of exposed headers for CORS"
  type        = list(string)
  default     = []
}

variable "cors_max_age_seconds" {
  description = "The time in seconds that browsers can cache the response for a preflight request"
  type        = number
  default     = 3600
}