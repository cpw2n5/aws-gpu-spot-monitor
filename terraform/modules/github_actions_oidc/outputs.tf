# Outputs for GitHub Actions OIDC Module

output "github_actions_oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC provider"
  value       = aws_iam_openid_connect_provider.github_actions.arn
}

output "github_actions_dev_role_arn" {
  description = "ARN of the GitHub Actions role for dev environment"
  value       = aws_iam_role.github_actions_dev.arn
}

output "github_actions_staging_role_arn" {
  description = "ARN of the GitHub Actions role for staging environment"
  value       = aws_iam_role.github_actions_staging.arn
}

output "github_actions_prod_role_arn" {
  description = "ARN of the GitHub Actions role for prod environment"
  value       = aws_iam_role.github_actions_prod.arn
}

output "github_actions_dev_role_name" {
  description = "Name of the GitHub Actions role for dev environment"
  value       = aws_iam_role.github_actions_dev.name
}

output "github_actions_staging_role_name" {
  description = "Name of the GitHub Actions role for staging environment"
  value       = aws_iam_role.github_actions_staging.name
}

output "github_actions_prod_role_name" {
  description = "Name of the GitHub Actions role for prod environment"
  value       = aws_iam_role.github_actions_prod.name
}