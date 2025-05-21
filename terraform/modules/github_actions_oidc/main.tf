# GitHub Actions OIDC Provider for AWS

# OIDC Provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"] # GitHub Actions OIDC Provider thumbprint
}

# IAM Role for GitHub Actions - Dev Environment
resource "aws_iam_role" "github_actions_dev" {
  name = "github-actions-dev-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Environment = "dev"
  })
}

# IAM Role for GitHub Actions - Staging Environment
resource "aws_iam_role" "github_actions_staging" {
  name = "github-actions-staging-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Environment = "staging"
  })
}

# IAM Role for GitHub Actions - Production Environment
resource "aws_iam_role" "github_actions_prod" {
  name = "github-actions-prod-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Environment = "prod"
  })
}

# Terraform State Management Policy - Dev
resource "aws_iam_policy" "terraform_state_dev" {
  name        = "terraform-state-management-dev"
  description = "Policy for managing Terraform state in S3 and DynamoDB for dev environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.terraform_state_bucket_prefix}-dev",
          "arn:aws:s3:::${var.terraform_state_bucket_prefix}-dev/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.terraform_state_lock_table_prefix}-dev"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Environment = "dev"
  })
}

# Terraform State Management Policy - Staging
resource "aws_iam_policy" "terraform_state_staging" {
  name        = "terraform-state-management-staging"
  description = "Policy for managing Terraform state in S3 and DynamoDB for staging environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.terraform_state_bucket_prefix}-staging",
          "arn:aws:s3:::${var.terraform_state_bucket_prefix}-staging/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.terraform_state_lock_table_prefix}-staging"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Environment = "staging"
  })
}

# Terraform State Management Policy - Prod
resource "aws_iam_policy" "terraform_state_prod" {
  name        = "terraform-state-management-prod"
  description = "Policy for managing Terraform state in S3 and DynamoDB for prod environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.terraform_state_bucket_prefix}-prod",
          "arn:aws:s3:::${var.terraform_state_bucket_prefix}-prod/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.terraform_state_lock_table_prefix}-prod"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Environment = "prod"
  })
}

# Attach Terraform State Management Policy to Dev Role
resource "aws_iam_role_policy_attachment" "terraform_state_dev_attachment" {
  role       = aws_iam_role.github_actions_dev.name
  policy_arn = aws_iam_policy.terraform_state_dev.arn
}

# Attach Terraform State Management Policy to Staging Role
resource "aws_iam_role_policy_attachment" "terraform_state_staging_attachment" {
  role       = aws_iam_role.github_actions_staging.name
  policy_arn = aws_iam_policy.terraform_state_staging.arn
}

# Attach Terraform State Management Policy to Prod Role
resource "aws_iam_role_policy_attachment" "terraform_state_prod_attachment" {
  role       = aws_iam_role.github_actions_prod.name
  policy_arn = aws_iam_policy.terraform_state_prod.arn
}

# Resource Deployment Policy - Dev
resource "aws_iam_policy" "resource_deployment_dev" {
  name        = "resource-deployment-dev"
  description = "Policy for deploying AWS resources in dev environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:*",
          "apigateway:*",
          "dynamodb:*",
          "cognito-idp:*",
          "s3:*",
          "cloudfront:*",
          "cloudwatch:*",
          "logs:*",
          "ec2:*",
          "iam:PassRole",
          "kms:*",
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Environment": "dev"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Environment = "dev"
  })
}

# Resource Deployment Policy - Staging
resource "aws_iam_policy" "resource_deployment_staging" {
  name        = "resource-deployment-staging"
  description = "Policy for deploying AWS resources in staging environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:*",
          "apigateway:*",
          "dynamodb:*",
          "cognito-idp:*",
          "s3:*",
          "cloudfront:*",
          "cloudwatch:*",
          "logs:*",
          "ec2:*",
          "iam:PassRole",
          "kms:*",
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Environment": "staging"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Environment = "staging"
  })
}

# Resource Deployment Policy - Prod
resource "aws_iam_policy" "resource_deployment_prod" {
  name        = "resource-deployment-prod"
  description = "Policy for deploying AWS resources in prod environment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:*",
          "apigateway:*",
          "dynamodb:*",
          "cognito-idp:*",
          "s3:*",
          "cloudfront:*",
          "cloudwatch:*",
          "logs:*",
          "ec2:*",
          "iam:PassRole",
          "kms:*",
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Environment": "prod"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Environment = "prod"
  })
}

# Attach Resource Deployment Policy to Dev Role
resource "aws_iam_role_policy_attachment" "resource_deployment_dev_attachment" {
  role       = aws_iam_role.github_actions_dev.name
  policy_arn = aws_iam_policy.resource_deployment_dev.arn
}

# Attach Resource Deployment Policy to Staging Role
resource "aws_iam_role_policy_attachment" "resource_deployment_staging_attachment" {
  role       = aws_iam_role.github_actions_staging.name
  policy_arn = aws_iam_policy.resource_deployment_staging.arn
}

# Attach Resource Deployment Policy to Prod Role
resource "aws_iam_role_policy_attachment" "resource_deployment_prod_attachment" {
  role       = aws_iam_role.github_actions_prod.name
  policy_arn = aws_iam_policy.resource_deployment_prod.arn
}