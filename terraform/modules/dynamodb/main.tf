# DynamoDB module for AWS GPU Spot Monitor

# Users Table
resource "aws_dynamodb_table" "users" {
  name         = "${var.table_prefix}-users"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.common_tags
}

# Instances Table
resource "aws_dynamodb_table" "instances" {
  name         = "${var.table_prefix}-instances"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "userId"
    projection_type    = "ALL"
    write_capacity     = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
    read_capacity      = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.common_tags
}

# Folding Config Table
resource "aws_dynamodb_table" "folding_config" {
  name         = "${var.table_prefix}-folding-config"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "userId"
    projection_type    = "ALL"
    write_capacity     = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
    read_capacity      = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.common_tags
}

# Spot Price History Table
resource "aws_dynamodb_table" "spot_price_history" {
  name         = "${var.table_prefix}-spot-price-history"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "instanceType"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name               = "InstanceTypeTimestampIndex"
    hash_key           = "instanceType"
    range_key          = "timestamp"
    projection_type    = "ALL"
    write_capacity     = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
    read_capacity      = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  # TTL for spot price history data (30 days)
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = var.common_tags
}

# Spot Instance Requests Table
resource "aws_dynamodb_table" "spot_instance_requests" {
  name         = "${var.table_prefix}-spot-instance-requests"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name               = "UserIdIndex"
    hash_key           = "userId"
    projection_type    = "ALL"
    write_capacity     = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
    read_capacity      = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  }

  global_secondary_index {
    name               = "StatusIndex"
    hash_key           = "status"
    projection_type    = "ALL"
    write_capacity     = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
    read_capacity      = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.common_tags
}

# Folding Stats Table
resource "aws_dynamodb_table" "folding_stats" {
  name         = "${var.table_prefix}-folding-stats"
  billing_mode = var.billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name               = "UserIdTimestampIndex"
    hash_key           = "userId"
    range_key          = "timestamp"
    projection_type    = "ALL"
    write_capacity     = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
    read_capacity      = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  # TTL for folding stats data (90 days)
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = var.common_tags
}