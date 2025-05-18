# Outputs for the CloudWatch module

output "dashboard_name" {
  description = "The name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "The ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "log_group_name" {
  description = "The name of the CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.lambda.name
}

output "log_group_arn" {
  description = "The ARN of the CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.lambda.arn
}

output "api_gateway_log_group_name" {
  description = "The name of the CloudWatch log group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

output "api_gateway_log_group_arn" {
  description = "The ARN of the CloudWatch log group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.arn
}

output "lambda_errors_alarm_name" {
  description = "The name of the CloudWatch alarm for Lambda errors"
  value       = aws_cloudwatch_metric_alarm.lambda_errors.alarm_name
}

output "lambda_errors_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for Lambda errors"
  value       = aws_cloudwatch_metric_alarm.lambda_errors.arn
}

output "lambda_duration_alarm_name" {
  description = "The name of the CloudWatch alarm for Lambda duration"
  value       = aws_cloudwatch_metric_alarm.lambda_duration.alarm_name
}

output "lambda_duration_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for Lambda duration"
  value       = aws_cloudwatch_metric_alarm.lambda_duration.arn
}

output "api_gateway_5xx_errors_alarm_name" {
  description = "The name of the CloudWatch alarm for API Gateway 5XX errors"
  value       = aws_cloudwatch_metric_alarm.api_gateway_5xx_errors.alarm_name
}

output "api_gateway_5xx_errors_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for API Gateway 5XX errors"
  value       = aws_cloudwatch_metric_alarm.api_gateway_5xx_errors.arn
}

output "dynamodb_throttled_requests_alarm_name" {
  description = "The name of the CloudWatch alarm for DynamoDB throttled requests"
  value       = aws_cloudwatch_metric_alarm.dynamodb_throttled_requests.alarm_name
}

output "dynamodb_throttled_requests_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for DynamoDB throttled requests"
  value       = aws_cloudwatch_metric_alarm.dynamodb_throttled_requests.arn
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alerts (if enabled)"
  value       = var.enable_sns_alerts ? aws_sns_topic.alerts[0].arn : null
}

output "lambda_errors_metric_filter_name" {
  description = "The name of the CloudWatch log metric filter for Lambda errors"
  value       = aws_cloudwatch_log_metric_filter.lambda_errors.name
}

output "api_gateway_4xx_errors_metric_filter_name" {
  description = "The name of the CloudWatch log metric filter for API Gateway 4XX errors"
  value       = aws_cloudwatch_log_metric_filter.api_gateway_4xx_errors.name
}

output "api_gateway_5xx_errors_metric_filter_name" {
  description = "The name of the CloudWatch log metric filter for API Gateway 5XX errors"
  value       = aws_cloudwatch_log_metric_filter.api_gateway_5xx_errors.name
}