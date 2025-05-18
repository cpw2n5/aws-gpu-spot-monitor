# Outputs for the DynamoDB module

output "table_names" {
  description = "The names of the DynamoDB tables"
  value = {
    users                = aws_dynamodb_table.users.name
    instances            = aws_dynamodb_table.instances.name
    folding_config       = aws_dynamodb_table.folding_config.name
    spot_price_history   = aws_dynamodb_table.spot_price_history.name
    spot_instance_requests = aws_dynamodb_table.spot_instance_requests.name
    folding_stats        = aws_dynamodb_table.folding_stats.name
  }
}

output "table_arns" {
  description = "The ARNs of the DynamoDB tables"
  value = {
    users                = aws_dynamodb_table.users.arn
    instances            = aws_dynamodb_table.instances.arn
    folding_config       = aws_dynamodb_table.folding_config.arn
    spot_price_history   = aws_dynamodb_table.spot_price_history.arn
    spot_instance_requests = aws_dynamodb_table.spot_instance_requests.arn
    folding_stats        = aws_dynamodb_table.folding_stats.arn
  }
}

output "users_table_name" {
  description = "The name of the Users DynamoDB table"
  value       = aws_dynamodb_table.users.name
}

output "instances_table_name" {
  description = "The name of the Instances DynamoDB table"
  value       = aws_dynamodb_table.instances.name
}

output "folding_config_table_name" {
  description = "The name of the Folding Config DynamoDB table"
  value       = aws_dynamodb_table.folding_config.name
}

output "spot_price_history_table_name" {
  description = "The name of the Spot Price History DynamoDB table"
  value       = aws_dynamodb_table.spot_price_history.name
}

output "spot_instance_requests_table_name" {
  description = "The name of the Spot Instance Requests DynamoDB table"
  value       = aws_dynamodb_table.spot_instance_requests.name
}

output "folding_stats_table_name" {
  description = "The name of the Folding Stats DynamoDB table"
  value       = aws_dynamodb_table.folding_stats.name
}

output "users_table_arn" {
  description = "The ARN of the Users DynamoDB table"
  value       = aws_dynamodb_table.users.arn
}

output "instances_table_arn" {
  description = "The ARN of the Instances DynamoDB table"
  value       = aws_dynamodb_table.instances.arn
}

output "folding_config_table_arn" {
  description = "The ARN of the Folding Config DynamoDB table"
  value       = aws_dynamodb_table.folding_config.arn
}

output "spot_price_history_table_arn" {
  description = "The ARN of the Spot Price History DynamoDB table"
  value       = aws_dynamodb_table.spot_price_history.arn
}

output "spot_instance_requests_table_arn" {
  description = "The ARN of the Spot Instance Requests DynamoDB table"
  value       = aws_dynamodb_table.spot_instance_requests.arn
}

output "folding_stats_table_arn" {
  description = "The ARN of the Folding Stats DynamoDB table"
  value       = aws_dynamodb_table.folding_stats.arn
}