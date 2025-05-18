# Outputs for the dev environment

output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = module.aws_gpu_spot_monitor.api_gateway_url
}

output "api_gateway_stage" {
  description = "The stage of the API Gateway"
  value       = module.aws_gpu_spot_monitor.api_gateway_stage
}

output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = module.aws_gpu_spot_monitor.cognito_user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = module.aws_gpu_spot_monitor.cognito_user_pool_client_id
}

output "cognito_identity_pool_id" {
  description = "The ID of the Cognito Identity Pool"
  value       = module.aws_gpu_spot_monitor.cognito_identity_pool_id
}

output "frontend_bucket_name" {
  description = "The name of the S3 bucket hosting the frontend"
  value       = module.aws_gpu_spot_monitor.frontend_bucket_name
}

output "frontend_cloudfront_domain_name" {
  description = "The domain name of the CloudFront distribution for the frontend"
  value       = module.aws_gpu_spot_monitor.frontend_cloudfront_domain_name
}

output "dynamodb_table_names" {
  description = "The names of the DynamoDB tables"
  value       = module.aws_gpu_spot_monitor.dynamodb_table_names
}

output "lambda_function_name" {
  description = "The name of the Lambda function"
  value       = module.aws_gpu_spot_monitor.lambda_function_name
}

output "cloudwatch_dashboard_name" {
  description = "The name of the CloudWatch dashboard"
  value       = module.aws_gpu_spot_monitor.cloudwatch_dashboard_name
}

output "ec2_instance_profile_name" {
  description = "The name of the EC2 instance profile"
  value       = module.aws_gpu_spot_monitor.ec2_instance_profile_name
}

output "ec2_security_group_id" {
  description = "The ID of the EC2 security group"
  value       = module.aws_gpu_spot_monitor.ec2_security_group_id
}

output "ec2_launch_template_name" {
  description = "The name of the EC2 launch template"
  value       = module.aws_gpu_spot_monitor.ec2_launch_template_name
}

output "folding_team_id_parameter_name" {
  description = "The name of the SSM parameter for Folding@Home team ID"
  value       = module.aws_gpu_spot_monitor.folding_team_id_parameter_name
}