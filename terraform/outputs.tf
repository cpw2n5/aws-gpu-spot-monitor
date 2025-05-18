# Output values from the AWS GPU Spot Monitor Terraform configuration

# API Gateway outputs
output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = module.api_gateway.api_url
}

output "api_gateway_stage" {
  description = "The stage of the API Gateway"
  value       = module.api_gateway.stage_name
}

# Cognito outputs
output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = module.cognito.user_pool_client_id
}

output "cognito_identity_pool_id" {
  description = "The ID of the Cognito Identity Pool"
  value       = module.cognito.identity_pool_id
}

# S3 outputs
output "frontend_bucket_name" {
  description = "The name of the S3 bucket hosting the frontend"
  value       = module.s3.bucket_name
}

output "frontend_bucket_website_endpoint" {
  description = "The website endpoint of the S3 bucket hosting the frontend"
  value       = module.s3.website_endpoint
}

output "frontend_cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution for the frontend"
  value       = module.s3.cloudfront_distribution_id
}

output "frontend_cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution for the frontend"
  value       = module.s3.cloudfront_domain_name
}

# DynamoDB outputs
output "dynamodb_table_names" {
  description = "The names of the DynamoDB tables"
  value       = module.dynamodb.table_names
}

# Lambda outputs
output "lambda_function_name" {
  description = "The name of the Lambda function"
  value       = module.lambda.function_name
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function"
  value       = module.lambda.function_arn
}

# CloudWatch outputs
output "cloudwatch_log_group_name" {
  description = "The name of the CloudWatch log group"
  value       = module.cloudwatch.log_group_name
}

output "cloudwatch_dashboard_name" {
  description = "The name of the CloudWatch dashboard"
  value       = module.cloudwatch.dashboard_name
}

# EC2 outputs
output "ec2_instance_profile_name" {
  description = "The name of the EC2 instance profile"
  value       = module.ec2.instance_profile_name
}

output "ec2_security_group_id" {
  description = "The ID of the EC2 security group"
  value       = module.ec2.security_group_id
}

# IAM outputs
output "lambda_role_arn" {
  description = "The ARN of the Lambda execution role"
  value       = module.iam.lambda_role_arn
}