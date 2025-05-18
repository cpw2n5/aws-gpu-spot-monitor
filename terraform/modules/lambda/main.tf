# Lambda module for AWS GPU Spot Monitor

locals {
  lambda_source_dir = "${path.module}/../../../src"
  lambda_zip_path   = "${path.module}/lambda_function.zip"
}

# Create a zip file of the Lambda function source code
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = local.lambda_source_dir
  output_path = local.lambda_zip_path
  excludes    = ["node_modules", "package-lock.json", "README.md"]
}

# Lambda function
resource "aws_lambda_function" "api" {
  function_name    = "${var.project_name}-${var.environment}-api"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  handler          = "lambda.handler"
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size
  role             = var.lambda_role_arn

  environment {
    variables = {
      NODE_ENV              = var.environment
      USER_POOL_ID          = var.user_pool_id
      USER_POOL_CLIENT_ID   = var.user_pool_client_id
      DYNAMODB_TABLE_PREFIX = var.dynamodb_table_prefix
    }
  }

  tracing_config {
    mode = var.enable_xray ? "Active" : "PassThrough"
  }

  tags = var.common_tags
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = 30
  tags              = var.common_tags
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}

# Lambda permission for CloudWatch Events
resource "aws_lambda_permission" "cloudwatch_events" {
  statement_id  = "AllowExecutionFromCloudWatchEvents"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "events.amazonaws.com"
}

# Lambda function for spot price monitoring
resource "aws_lambda_function" "spot_price_monitor" {
  function_name    = "${var.project_name}-${var.environment}-spot-price-monitor"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  handler          = "lambda.spotPriceHandler"
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size
  role             = var.lambda_role_arn

  environment {
    variables = {
      NODE_ENV              = var.environment
      DYNAMODB_TABLE_PREFIX = var.dynamodb_table_prefix
    }
  }

  tracing_config {
    mode = var.enable_xray ? "Active" : "PassThrough"
  }

  tags = var.common_tags
}

# CloudWatch Log Group for Spot Price Monitor Lambda
resource "aws_cloudwatch_log_group" "spot_price_monitor_logs" {
  name              = "/aws/lambda/${aws_lambda_function.spot_price_monitor.function_name}"
  retention_in_days = 30
  tags              = var.common_tags
}

# CloudWatch Event Rule for Spot Price Monitor (runs every 5 minutes)
resource "aws_cloudwatch_event_rule" "spot_price_monitor_schedule" {
  name                = "${var.project_name}-${var.environment}-spot-price-monitor-schedule"
  description         = "Schedule for Spot Price Monitor Lambda function"
  schedule_expression = "rate(5 minutes)"
  tags                = var.common_tags
}

# CloudWatch Event Target for Spot Price Monitor
resource "aws_cloudwatch_event_target" "spot_price_monitor_target" {
  rule      = aws_cloudwatch_event_rule.spot_price_monitor_schedule.name
  target_id = "SpotPriceMonitorLambda"
  arn       = aws_lambda_function.spot_price_monitor.arn
}

# Lambda permission for CloudWatch Events (Spot Price Monitor)
resource "aws_lambda_permission" "spot_price_monitor_cloudwatch_events" {
  statement_id  = "AllowExecutionFromCloudWatchEvents"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.spot_price_monitor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.spot_price_monitor_schedule.arn
}