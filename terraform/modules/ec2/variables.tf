# Variables for the EC2 module

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

variable "vpc_id" {
  description = "The ID of the VPC to deploy resources to"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "The IDs of the subnets to deploy resources to"
  type        = list(string)
  default     = []
}

variable "ami_id" {
  description = "The ID of the AMI to use for EC2 instances"
  type        = string
}

variable "instance_types" {
  description = "List of EC2 instance types to use for spot instances"
  type        = list(string)
  default     = ["g4dn.xlarge", "p3.2xlarge", "g3s.xlarge"]
}

variable "key_name" {
  description = "The name of the key pair to use for EC2 instances"
  type        = string
  default     = ""
}

variable "instance_profile_name" {
  description = "The name of the IAM instance profile to use for EC2 instances"
  type        = string
}

variable "associate_public_ip" {
  description = "Whether to associate a public IP address with EC2 instances"
  type        = bool
  default     = true
}

variable "root_volume_size" {
  description = "The size of the root volume in GB"
  type        = number
  default     = 30
}

variable "user_data_script" {
  description = "The user data script to run on EC2 instances"
  type        = string
}

variable "enable_ssh" {
  description = "Whether to enable SSH access to EC2 instances"
  type        = bool
  default     = false
}

variable "ssh_cidr_blocks" {
  description = "The CIDR blocks to allow SSH access from"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "folding_web_control_cidr_blocks" {
  description = "The CIDR blocks to allow Folding@Home Web Control access from"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "spot_interruption_lambda_arn" {
  description = "The ARN of the Lambda function to handle spot instance interruption notices"
  type        = string
  default     = ""
}

variable "spot_interruption_lambda_name" {
  description = "The name of the Lambda function to handle spot instance interruption notices"
  type        = string
  default     = ""
}

variable "ec2_state_change_lambda_arn" {
  description = "The ARN of the Lambda function to handle EC2 instance state changes"
  type        = string
  default     = ""
}

variable "ec2_state_change_lambda_name" {
  description = "The name of the Lambda function to handle EC2 instance state changes"
  type        = string
  default     = ""
}

variable "folding_team_id" {
  description = "The Folding@Home team ID"
  type        = string
  default     = ""
}

variable "folding_passkey" {
  description = "The Folding@Home passkey"
  type        = string
  default     = ""
  sensitive   = true
}

variable "folding_power" {
  description = "The Folding@Home power level (light, medium, full)"
  type        = string
  default     = "full"
  validation {
    condition     = contains(["light", "medium", "full"], var.folding_power)
    error_message = "Folding@Home power level must be one of: light, medium, full."
  }
}

variable "folding_gpu" {
  description = "Whether to use GPU for Folding@Home"
  type        = bool
  default     = true
}

variable "folding_cpu" {
  description = "Whether to use CPU for Folding@Home"
  type        = bool
  default     = false
}

variable "spot_max_price" {
  description = "The maximum price to pay for spot instances"
  type        = string
  default     = ""  # Empty string means on-demand price
}