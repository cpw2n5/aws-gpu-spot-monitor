# Outputs for the API Gateway module

output "id" {
  description = "The ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.api.id
}

output "name" {
  description = "The name of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.api.name
}

output "execution_arn" {
  description = "The execution ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.api.execution_arn
}

output "root_resource_id" {
  description = "The ID of the root resource of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.api.root_resource_id
}

output "api_url" {
  description = "The URL of the API Gateway"
  value       = "${aws_api_gateway_stage.api.invoke_url}/"
}

output "stage_name" {
  description = "The name of the API Gateway stage"
  value       = aws_api_gateway_stage.api.stage_name
}

output "stage_arn" {
  description = "The ARN of the API Gateway stage"
  value       = aws_api_gateway_stage.api.arn
}

output "log_group_name" {
  description = "The name of the CloudWatch log group for the API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

output "log_group_arn" {
  description = "The ARN of the CloudWatch log group for the API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.arn
}

output "waf_web_acl_id" {
  description = "The ID of the WAF Web ACL (if enabled)"
  value       = var.enable_waf ? aws_wafv2_web_acl.api_gateway[0].id : null
}

output "waf_web_acl_arn" {
  description = "The ARN of the WAF Web ACL (if enabled)"
  value       = var.enable_waf ? aws_wafv2_web_acl.api_gateway[0].arn : null
}