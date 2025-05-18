# Outputs for the Cognito module

output "user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "The ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "The endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.endpoint
}

output "user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.main.id
}

output "identity_pool_id" {
  description = "The ID of the Cognito Identity Pool"
  value       = aws_cognito_identity_pool.main.id
}

output "identity_pool_arn" {
  description = "The ARN of the Cognito Identity Pool"
  value       = aws_cognito_identity_pool.main.arn
}

output "user_pool_domain" {
  description = "The domain of the Cognito User Pool"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "user_pool_domain_cloudfront_distribution" {
  description = "The CloudFront distribution ARN of the Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.main.cloudfront_distribution_arn
}

output "authenticated_role_arn" {
  description = "The ARN of the IAM role for authenticated Cognito users"
  value       = aws_iam_role.authenticated.arn
}

output "unauthenticated_role_arn" {
  description = "The ARN of the IAM role for unauthenticated Cognito users"
  value       = aws_iam_role.unauthenticated.arn
}

output "authenticated_policy_arn" {
  description = "The ARN of the IAM policy for authenticated Cognito users"
  value       = aws_iam_policy.authenticated.arn
}

output "unauthenticated_policy_arn" {
  description = "The ARN of the IAM policy for unauthenticated Cognito users"
  value       = aws_iam_policy.unauthenticated.arn
}

output "hosted_ui_url" {
  description = "The URL of the Cognito Hosted UI"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

# Get current AWS region
data "aws_region" "current" {}