# Cognito module for AWS GPU Spot Monitor

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  # Username attributes
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length    = var.password_policy.minimum_length
    require_lowercase = var.password_policy.require_lowercase
    require_numbers   = var.password_policy.require_numbers
    require_symbols   = var.password_policy.require_symbols
    require_uppercase = var.password_policy.require_uppercase
  }

  # MFA configuration
  mfa_configuration = var.enable_mfa ? "OPTIONAL" : "OFF"

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Account recovery setting
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Schema attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    mutable             = true
    required            = false
  }

  # Admin create user config
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  # Device configuration
  device_configuration {
    challenge_required_on_new_device      = false
    device_only_remembered_on_user_prompt = true
  }

  # Lambda triggers (can be configured later)
  lambda_config {
    # Uncomment and configure as needed
    # post_confirmation = aws_lambda_function.post_confirmation.arn
    # pre_sign_up       = aws_lambda_function.pre_sign_up.arn
  }

  tags = var.common_tags
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name                = "${var.user_pool_name}-client"
  user_pool_id        = aws_cognito_user_pool.main.id
  generate_secret     = false
  refresh_token_validity = 30
  access_token_validity = 1
  id_token_validity = 1

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  supported_identity_providers = ["COGNITO"]

  # Callback and logout URLs
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["phone", "email", "openid", "profile", "aws.cognito.signin.user.admin"]

  prevent_user_existence_errors = "ENABLED"
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognito Identity Pool
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.project_name}-${var.environment}-identity-pool"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.main.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }

  tags = var.common_tags
}

# Cognito Identity Pool Roles Attachment
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated"   = aws_iam_role.authenticated.arn
    "unauthenticated" = aws_iam_role.unauthenticated.arn
  }
}

# IAM Role for authenticated users
resource "aws_iam_role" "authenticated" {
  name = "${var.project_name}-${var.environment}-cognito-authenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

# IAM Role for unauthenticated users
resource "aws_iam_role" "unauthenticated" {
  name = "${var.project_name}-${var.environment}-cognito-unauthenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "unauthenticated"
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

# IAM Policy for authenticated users
resource "aws_iam_policy" "authenticated" {
  name        = "${var.project_name}-${var.environment}-cognito-authenticated-policy"
  description = "IAM policy for authenticated Cognito users"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "mobileanalytics:PutEvents",
          "cognito-sync:*",
          "cognito-identity:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "execute-api:Invoke"
        ]
        Resource = "${var.api_gateway_execution_arn}/*"
      }
    ]
  })
}

# IAM Policy for unauthenticated users
resource "aws_iam_policy" "unauthenticated" {
  name        = "${var.project_name}-${var.environment}-cognito-unauthenticated-policy"
  description = "IAM policy for unauthenticated Cognito users"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "mobileanalytics:PutEvents",
          "cognito-sync:*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach IAM Policy to authenticated role
resource "aws_iam_role_policy_attachment" "authenticated" {
  role       = aws_iam_role.authenticated.name
  policy_arn = aws_iam_policy.authenticated.arn
}

# Attach IAM Policy to unauthenticated role
resource "aws_iam_role_policy_attachment" "unauthenticated" {
  role       = aws_iam_role.unauthenticated.name
  policy_arn = aws_iam_policy.unauthenticated.arn
}