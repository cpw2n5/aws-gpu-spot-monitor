# Outputs for the IAM module

output "lambda_role_name" {
  description = "The name of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.name
}

output "lambda_role_arn" {
  description = "The ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_role_id" {
  description = "The ID of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.id
}

output "ec2_instance_profile_name" {
  description = "The name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_instance_profile.name
}

output "ec2_instance_profile_arn" {
  description = "The ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_instance_profile.arn
}

output "ec2_instance_profile_id" {
  description = "The ID of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_instance_profile.id
}

output "ec2_role_name" {
  description = "The name of the EC2 instance profile role"
  value       = aws_iam_role.ec2_instance_profile.name
}

output "ec2_role_arn" {
  description = "The ARN of the EC2 instance profile role"
  value       = aws_iam_role.ec2_instance_profile.arn
}

output "ec2_role_id" {
  description = "The ID of the EC2 instance profile role"
  value       = aws_iam_role.ec2_instance_profile.id
}

output "api_gateway_cloudwatch_role_name" {
  description = "The name of the API Gateway CloudWatch role"
  value       = aws_iam_role.api_gateway_cloudwatch.name
}

output "api_gateway_cloudwatch_role_arn" {
  description = "The ARN of the API Gateway CloudWatch role"
  value       = aws_iam_role.api_gateway_cloudwatch.arn
}

output "api_gateway_cloudwatch_role_id" {
  description = "The ID of the API Gateway CloudWatch role"
  value       = aws_iam_role.api_gateway_cloudwatch.id
}

output "lambda_dynamodb_policy_arn" {
  description = "The ARN of the Lambda DynamoDB policy"
  value       = aws_iam_policy.lambda_dynamodb.arn
}

output "lambda_cognito_policy_arn" {
  description = "The ARN of the Lambda Cognito policy"
  value       = aws_iam_policy.lambda_cognito.arn
}

output "lambda_ec2_spot_policy_arn" {
  description = "The ARN of the Lambda EC2 Spot policy"
  value       = aws_iam_policy.lambda_ec2_spot.arn
}

output "ec2_cloudwatch_policy_arn" {
  description = "The ARN of the EC2 CloudWatch policy"
  value       = aws_iam_policy.ec2_cloudwatch.arn
}

output "ec2_dynamodb_policy_arn" {
  description = "The ARN of the EC2 DynamoDB policy"
  value       = aws_iam_policy.ec2_dynamodb.arn
}

output "ec2_s3_policy_arn" {
  description = "The ARN of the EC2 S3 policy"
  value       = aws_iam_policy.ec2_s3.arn
}

output "aws_account_id" {
  description = "The AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}