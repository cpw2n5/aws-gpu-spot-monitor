# Outputs for the Lambda module

output "function_name" {
  description = "The name of the Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.api.arn
}

output "invoke_arn" {
  description = "The invoke ARN of the Lambda function"
  value       = aws_lambda_function.api.invoke_arn
}

output "qualified_arn" {
  description = "The qualified ARN of the Lambda function"
  value       = aws_lambda_function.api.qualified_arn
}

output "version" {
  description = "The version of the Lambda function"
  value       = aws_lambda_function.api.version
}

output "log_group_name" {
  description = "The name of the CloudWatch log group for the Lambda function"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "spot_price_monitor_function_name" {
  description = "The name of the Spot Price Monitor Lambda function"
  value       = aws_lambda_function.spot_price_monitor.function_name
}

output "spot_price_monitor_function_arn" {
  description = "The ARN of the Spot Price Monitor Lambda function"
  value       = aws_lambda_function.spot_price_monitor.arn
}

output "spot_price_monitor_log_group_name" {
  description = "The name of the CloudWatch log group for the Spot Price Monitor Lambda function"
  value       = aws_cloudwatch_log_group.spot_price_monitor_logs.name
}

output "spot_price_monitor_schedule_rule_name" {
  description = "The name of the CloudWatch Events rule for the Spot Price Monitor Lambda function"
  value       = aws_cloudwatch_event_rule.spot_price_monitor_schedule.name
}

output "spot_price_monitor_schedule_rule_arn" {
  description = "The ARN of the CloudWatch Events rule for the Spot Price Monitor Lambda function"
  value       = aws_cloudwatch_event_rule.spot_price_monitor_schedule.arn
}