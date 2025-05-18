# IAM module for AWS GPU Spot Monitor

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-${var.environment}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# Lambda Basic Execution Policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda VPC Execution Policy (if needed)
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  count      = var.lambda_in_vpc ? 1 : 0
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Lambda X-Ray Policy (if enabled)
resource "aws_iam_role_policy_attachment" "lambda_xray" {
  count      = var.enable_xray ? 1 : 0
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess"
}

# Lambda DynamoDB Policy
resource "aws_iam_policy" "lambda_dynamodb" {
  name        = "${var.project_name}-${var.environment}-lambda-dynamodb-policy"
  description = "IAM policy for Lambda to access DynamoDB tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-users",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-folding-config",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-folding-stats",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-instances",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-spot-prices",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-users/index/*",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-folding-config/index/*",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-folding-stats/index/*",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-instances/index/*",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-spot-prices/index/*"
        ]
      }
    ]
  })

  tags = var.common_tags
}

# Lambda DynamoDB Policy Attachment
resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_dynamodb.arn
}

# Lambda Cognito Policy
resource "aws_iam_policy" "lambda_cognito" {
  name        = "${var.project_name}-${var.environment}-lambda-cognito-policy"
  description = "IAM policy for Lambda to access Cognito"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminRespondToAuthChallenge",
          "cognito-idp:AdminConfirmSignUp",
          "cognito-idp:ListUsers"
        ]
        Effect   = "Allow"
        Resource = var.cognito_user_pool_arn != "" ? var.cognito_user_pool_arn : "arn:aws:cognito-idp:${var.aws_region}:${var.aws_account_id}:userpool/*"
      }
    ]
  })

  tags = var.common_tags
}

# Lambda Cognito Policy Attachment
resource "aws_iam_role_policy_attachment" "lambda_cognito" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_cognito.arn
}

# Lambda Secrets Manager Policy
resource "aws_iam_policy" "lambda_secrets_manager" {
  name        = "${var.project_name}-${var.environment}-lambda-secrets-manager-policy"
  description = "IAM policy for Lambda to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:CreateSecret",
          "secretsmanager:UpdateSecret",
          "secretsmanager:PutSecretValue"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:${var.project_name}/*"
      }
    ]
  })

  tags = var.common_tags
}

# Lambda Secrets Manager Policy Attachment
resource "aws_iam_role_policy_attachment" "lambda_secrets_manager" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_secrets_manager.arn
}

# Lambda KMS Policy
resource "aws_iam_policy" "lambda_kms" {
  name        = "${var.project_name}-${var.environment}-lambda-kms-policy"
  description = "IAM policy for Lambda to use KMS for encryption/decryption"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Effect   = "Allow"
        Resource = var.kms_key_arn != "" ? var.kms_key_arn : "arn:aws:kms:${var.aws_region}:${var.aws_account_id}:key/*"
      }
    ]
  })

  tags = var.common_tags
}

# Lambda KMS Policy Attachment
resource "aws_iam_role_policy_attachment" "lambda_kms" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_kms.arn
}

# Lambda EC2 Spot Policy
resource "aws_iam_policy" "lambda_ec2_spot" {
  name        = "${var.project_name}-${var.environment}-lambda-ec2-spot-policy"
  description = "IAM policy for Lambda to manage EC2 Spot Instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ec2:DescribeSpotPriceHistory",
          "ec2:DescribeSpotInstanceRequests",
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
          "ec2:DescribeInstanceTypes",
          "ec2:DescribeAvailabilityZones"
        ]
        Effect   = "Allow"
        Resource = "*"  # These describe actions require * resource
      },
      {
        Action = [
          "ec2:RequestSpotInstances",
          "ec2:CancelSpotInstanceRequests",
          "ec2:TerminateInstances",
          "ec2:CreateTags",
          "ec2:RunInstances"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:ec2:${var.aws_region}:${var.aws_account_id}:instance/*",
          "arn:aws:ec2:${var.aws_region}:${var.aws_account_id}:spot-instances-request/*",
          "arn:aws:ec2:${var.aws_region}:${var.aws_account_id}:volume/*",
          "arn:aws:ec2:${var.aws_region}:${var.aws_account_id}:network-interface/*",
          "arn:aws:ec2:${var.aws_region}:${var.aws_account_id}:security-group/*",
          "arn:aws:ec2:${var.aws_region}:${var.aws_account_id}:subnet/*",
          "arn:aws:ec2:${var.aws_region}::image/ami-*"
        ]
        Condition = {
          StringEquals = {
            "aws:RequestTag/Project" = var.project_name
          }
        }
      }
    ]
  })

  tags = var.common_tags
}

# Lambda EC2 Spot Policy Attachment
resource "aws_iam_role_policy_attachment" "lambda_ec2_spot" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_ec2_spot.arn
}

# EC2 Instance Profile Role
resource "aws_iam_role" "ec2_instance_profile" {
  name = "${var.project_name}-${var.environment}-ec2-instance-profile-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# EC2 Instance Profile
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "${var.project_name}-${var.environment}-ec2-instance-profile"
  role = aws_iam_role.ec2_instance_profile.name
}

# EC2 SSM Policy Attachment
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_instance_profile.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# EC2 CloudWatch Policy
resource "aws_iam_policy" "ec2_cloudwatch" {
  name        = "${var.project_name}-${var.environment}-ec2-cloudwatch-policy"
  description = "IAM policy for EC2 instances to send logs and metrics to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/ec2/${var.project_name}-${var.environment}*:*",
          "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/ec2/${var.project_name}-${var.environment}*:log-stream:*"
        ]
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "*"  # PutMetricData doesn't support resource-level permissions
      }
    ]
  })

  tags = var.common_tags
}

# EC2 CloudWatch Policy Attachment
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2_instance_profile.name
  policy_arn = aws_iam_policy.ec2_cloudwatch.arn
}

# EC2 DynamoDB Policy
resource "aws_iam_policy" "ec2_dynamodb" {
  name        = "${var.project_name}-${var.environment}-ec2-dynamodb-policy"
  description = "IAM policy for EC2 instances to access DynamoDB tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-folding-config",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-folding-stats",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-instances",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-folding-config/index/*",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-folding-stats/index/*",
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.dynamodb_table_prefix}-instances/index/*"
        ]
      }
    ]
  })

  tags = var.common_tags
}

# EC2 DynamoDB Policy Attachment
resource "aws_iam_role_policy_attachment" "ec2_dynamodb" {
  role       = aws_iam_role.ec2_instance_profile.name
  policy_arn = aws_iam_policy.ec2_dynamodb.arn
}

# EC2 S3 Policy for Folding@Home configuration
resource "aws_iam_policy" "ec2_s3" {
  name        = "${var.project_name}-${var.environment}-ec2-s3-policy"
  description = "IAM policy for EC2 instances to access S3 for Folding@Home configuration"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:s3:::${var.folding_config_bucket}",
          "arn:aws:s3:::${var.folding_config_bucket}/*"
        ]
      }
    ]
  })

  tags = var.common_tags
}

# EC2 S3 Policy Attachment
resource "aws_iam_role_policy_attachment" "ec2_s3" {
  count      = var.folding_config_bucket != "" ? 1 : 0
  role       = aws_iam_role.ec2_instance_profile.name
  policy_arn = aws_iam_policy.ec2_s3.arn
}

# EC2 Secrets Manager Policy
resource "aws_iam_policy" "ec2_secrets_manager" {
  name        = "${var.project_name}-${var.environment}-ec2-secrets-manager-policy"
  description = "IAM policy for EC2 instances to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:${var.project_name}/folding-*",
          "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:${var.project_name}/api-*"
        ]
      }
    ]
  })

  tags = var.common_tags
}

# EC2 Secrets Manager Policy Attachment
resource "aws_iam_role_policy_attachment" "ec2_secrets_manager" {
  role       = aws_iam_role.ec2_instance_profile.name
  policy_arn = aws_iam_policy.ec2_secrets_manager.arn
}

# EC2 KMS Policy
resource "aws_iam_policy" "ec2_kms" {
  name        = "${var.project_name}-${var.environment}-ec2-kms-policy"
  description = "IAM policy for EC2 instances to use KMS for encryption/decryption"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:Decrypt"
        ]
        Effect   = "Allow"
        Resource = var.kms_key_arn != "" ? var.kms_key_arn : "arn:aws:kms:${var.aws_region}:${var.aws_account_id}:key/*"
      }
    ]
  })

  tags = var.common_tags
}

# EC2 KMS Policy Attachment
resource "aws_iam_role_policy_attachment" "ec2_kms" {
  role       = aws_iam_role.ec2_instance_profile.name
  policy_arn = aws_iam_policy.ec2_kms.arn
}

# API Gateway CloudWatch Role
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-${var.environment}-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}

# API Gateway CloudWatch Policy
resource "aws_iam_role_policy" "api_gateway_cloudwatch" {
  name = "${var.project_name}-${var.environment}-api-gateway-cloudwatch-policy"
  role = aws_iam_role.api_gateway_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/apigateway/${var.project_name}-${var.environment}*:*",
          "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/apigateway/${var.project_name}-${var.environment}*:log-stream:*"
        ]
      }
    ]
  })
}

# Account ID data source
data "aws_caller_identity" "current" {}

# Add KMS key variable
variable "kms_key_arn" {
  description = "ARN of the KMS key used for encryption/decryption"
  type        = string
  default     = ""
}