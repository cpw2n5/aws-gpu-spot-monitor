# CloudWatch module for AWS GPU Spot Monitor

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      # API Gateway Metrics
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", var.api_gateway_name, { "stat" = "Sum" }],
            ["AWS/ApiGateway", "4XXError", "ApiName", var.api_gateway_name, { "stat" = "Sum" }],
            ["AWS/ApiGateway", "5XXError", "ApiName", var.api_gateway_name, { "stat" = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Requests"
          period  = 300
          annotations = {
            horizontal = [
              {
                color = "#ff0000",
                label = "Error Threshold",
                value = var.api_gateway_5xx_error_threshold
              }
            ]
          }
        }
      },
      # API Gateway Latency
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_gateway_name, { "stat" = "Average" }],
            ["AWS/ApiGateway", "IntegrationLatency", "ApiName", var.api_gateway_name, { "stat" = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Latency"
          period  = 300
          annotations = {
            horizontal = [
              {
                color = "#ff9900",
                label = "Latency Warning",
                value = var.api_gateway_latency_threshold
              }
            ]
          }
        }
      },
      # Lambda Invocations and Errors
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_function_name, { "stat" = "Sum" }],
            ["AWS/Lambda", "Errors", "FunctionName", var.lambda_function_name, { "stat" = "Sum" }],
            ["AWS/Lambda", "Throttles", "FunctionName", var.lambda_function_name, { "stat" = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Invocations and Errors"
          period  = 300
          annotations = {
            horizontal = [
              {
                color = "#ff0000",
                label = "Error Threshold",
                value = var.lambda_error_threshold
              }
            ]
          }
        }
      },
      # Lambda Duration
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_function_name, { "stat" = "Average" }],
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_function_name, { "stat" = "Maximum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Duration"
          period  = 300
          annotations = {
            horizontal = [
              {
                color = "#ff9900",
                label = "Duration Threshold",
                value = var.lambda_duration_threshold
              }
            ]
          }
        }
      },
      # DynamoDB Read/Write Capacity
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${var.dynamodb_table_prefix}-users", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "${var.dynamodb_table_prefix}-users", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${var.dynamodb_table_prefix}-instances", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "${var.dynamodb_table_prefix}-instances", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${var.dynamodb_table_prefix}-folding-config", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "${var.dynamodb_table_prefix}-folding-config", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", "${var.dynamodb_table_prefix}-spot-price-history", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", "${var.dynamodb_table_prefix}-spot-price-history", { "stat" = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Consumed Capacity"
          period  = 300
        }
      },
      # DynamoDB Throttled Requests
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ReadThrottleEvents", "TableName", "${var.dynamodb_table_prefix}-users", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "WriteThrottleEvents", "TableName", "${var.dynamodb_table_prefix}-users", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ReadThrottleEvents", "TableName", "${var.dynamodb_table_prefix}-instances", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "WriteThrottleEvents", "TableName", "${var.dynamodb_table_prefix}-instances", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ReadThrottleEvents", "TableName", "${var.dynamodb_table_prefix}-folding-config", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "WriteThrottleEvents", "TableName", "${var.dynamodb_table_prefix}-folding-config", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "ReadThrottleEvents", "TableName", "${var.dynamodb_table_prefix}-spot-price-history", { "stat" = "Sum" }],
            ["AWS/DynamoDB", "WriteThrottleEvents", "TableName", "${var.dynamodb_table_prefix}-spot-price-history", { "stat" = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Throttled Requests"
          period  = 300
          annotations = {
            horizontal = [
              {
                color = "#ff0000",
                label = "Throttle Threshold",
                value = var.dynamodb_throttled_requests_threshold
              }
            ]
          }
        }
      },
      # Spot Instance Metrics
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2Spot", "AvailableInstancePoolCount", { "stat" = "Average" }],
            ["AWS/EC2Spot", "BidsSubmittedForCapacity", { "stat" = "Sum" }],
            ["AWS/EC2Spot", "EligibleInstancePoolCount", { "stat" = "Average" }],
            ["AWS/EC2Spot", "FulfilledCapacity", { "stat" = "Average" }],
            ["AWS/EC2Spot", "MaxPercentCapacityAllocation", { "stat" = "Maximum" }],
            ["AWS/EC2Spot", "PendingCapacity", { "stat" = "Average" }],
            ["AWS/EC2Spot", "PercentCapacityAllocation", { "stat" = "Average" }],
            ["AWS/EC2Spot", "TargetCapacity", { "stat" = "Average" }],
            ["AWS/EC2Spot", "TerminatingCapacity", { "stat" = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "EC2 Spot Instance Metrics"
          period  = 300
        }
      },
      # EC2 Instance Metrics
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { "stat" = "Average" }],
            ["AWS/EC2", "NetworkIn", { "stat" = "Average" }],
            ["AWS/EC2", "NetworkOut", { "stat" = "Average" }],
            ["AWS/EC2", "DiskReadBytes", { "stat" = "Average" }],
            ["AWS/EC2", "DiskWriteBytes", { "stat" = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "EC2 Instance Metrics"
          period  = 300
        }
      },
      # Folding@Home Progress Metrics
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["${var.project_name}/${var.environment}", "FoldingProgress", { "stat" = "Average" }],
            ["${var.project_name}/${var.environment}", "FoldingWUs", { "stat" = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Folding@Home Progress"
          period  = 300
        }
      },
      # Spot Price Anomaly Detection
      {
        type   = "metric"
        x      = 12
        y      = 24
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["${var.project_name}/${var.environment}", "SpotPriceP2xlarge", { "stat" = "Average" }],
            ["${var.project_name}/${var.environment}", "SpotPriceP3_2xlarge", { "stat" = "Average" }],
            ["${var.project_name}/${var.environment}", "SpotPriceG4dn_xlarge", { "stat" = "Average" }],
            ["${var.project_name}/${var.environment}", "SpotPriceG5_xlarge", { "stat" = "Average" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Spot Price Trends"
          period  = 300
        }
      },
      # Spot Instance Health Status
      {
        type   = "metric"
        x      = 0
        y      = 30
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["${var.project_name}/${var.environment}", "SpotInstanceHealth", { "stat" = "Average" }],
            ["${var.project_name}/${var.environment}", "SpotInterruptionWarnings", { "stat" = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Spot Instance Health"
          period  = 300
          annotations = {
            horizontal = [
              {
                color = "#ff0000",
                label = "Health Threshold",
                value = var.spot_instance_health_threshold
              }
            ]
          }
        }
      },
      # API Error Rates
      {
        type   = "metric"
        x      = 12
        y      = 30
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["${var.project_name}/${var.environment}", "ApiGateway4xxErrorCount", { "stat" = "Sum" }],
            ["${var.project_name}/${var.environment}", "ApiGateway5xxErrorCount", { "stat" = "Sum" }],
            ["${var.project_name}/${var.environment}", "LambdaErrorCount", { "stat" = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Error Rates"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch Alarms

# API Gateway 5XX Error Alarm
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-api-gateway-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = var.alarm_period
  statistic           = "Sum"
  threshold           = var.api_gateway_5xx_error_threshold
  alarm_description   = "This alarm monitors API Gateway 5XX errors"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  dimensions = {
    ApiName = var.api_gateway_name
  }

  tags = var.common_tags
}

# API Gateway 4XX Error Alarm
resource "aws_cloudwatch_metric_alarm" "api_gateway_4xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-api-gateway-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = var.alarm_period
  statistic           = "Sum"
  threshold           = var.api_gateway_4xx_error_threshold
  alarm_description   = "This alarm monitors API Gateway 4XX errors"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  dimensions = {
    ApiName = var.api_gateway_name
  }

  tags = var.common_tags
}

# API Gateway Latency Alarm
resource "aws_cloudwatch_metric_alarm" "api_gateway_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-api-gateway-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = var.alarm_period
  statistic           = "p95"
  threshold           = var.api_gateway_latency_threshold
  alarm_description   = "This alarm monitors API Gateway latency (p95)"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  dimensions = {
    ApiName = var.api_gateway_name
  }

  tags = var.common_tags
}

# Lambda Error Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "This alarm monitors Lambda function errors"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  dimensions = {
    FunctionName = var.lambda_function_name
  }

  tags = var.common_tags
}

# Lambda Duration Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${var.project_name}-${var.environment}-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = var.alarm_period
  statistic           = "Maximum"
  threshold           = var.lambda_duration_threshold
  alarm_description   = "This alarm monitors Lambda function duration"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  dimensions = {
    FunctionName = var.lambda_function_name
  }

  tags = var.common_tags
}

# DynamoDB Throttled Requests Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttled_requests" {
  alarm_name          = "${var.project_name}-${var.environment}-dynamodb-throttled-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = var.alarm_period
  statistic           = "Sum"
  threshold           = var.dynamodb_throttled_requests_threshold
  alarm_description   = "This alarm monitors DynamoDB throttled requests"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  dimensions = {
    TableName = "${var.dynamodb_table_prefix}-users"
  }

  tags = var.common_tags
}

# Spot Instance Health Alarm
resource "aws_cloudwatch_metric_alarm" "spot_instance_health" {
  alarm_name          = "${var.project_name}-${var.environment}-spot-instance-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "SpotInstanceHealth"
  namespace           = "${var.project_name}/${var.environment}"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = var.spot_instance_health_threshold
  alarm_description   = "This alarm monitors spot instance health"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  tags = var.common_tags
}

# Spot Interruption Warning Alarm
resource "aws_cloudwatch_metric_alarm" "spot_interruption_warnings" {
  alarm_name          = "${var.project_name}-${var.environment}-spot-interruption-warnings"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SpotInterruptionWarnings"
  namespace           = "${var.project_name}/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "This alarm triggers when spot interruption warnings are detected"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  tags = var.common_tags
}

# Folding@Home Progress Alarm
resource "aws_cloudwatch_metric_alarm" "folding_progress" {
  alarm_name          = "${var.project_name}-${var.environment}-folding-progress"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = var.alarm_evaluation_periods
  metric_name         = "FoldingProgress"
  namespace           = "${var.project_name}/${var.environment}"
  period              = var.alarm_period
  statistic           = "Average"
  threshold           = var.folding_progress_threshold
  alarm_description   = "This alarm monitors Folding@Home progress"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  tags = var.common_tags
}

# Spot Price Anomaly Detection Alarm
resource "aws_cloudwatch_metric_alarm" "spot_price_anomaly" {
  alarm_name          = "${var.project_name}-${var.environment}-spot-price-anomaly"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SpotPriceAnomalyScore"
  namespace           = "${var.project_name}/${var.environment}"
  period              = 300
  statistic           = "Maximum"
  threshold           = var.spot_price_anomaly_threshold
  alarm_description   = "This alarm detects anomalies in spot instance pricing"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  ok_actions          = var.enable_sns_alerts ? [aws_sns_topic.alerts[0].arn] : []
  
  tags = var.common_tags
}

# SNS Topic for Alerts (if enabled)
resource "aws_sns_topic" "alerts" {
  count = var.enable_sns_alerts ? 1 : 0
  
  name = "${var.project_name}-${var.environment}-alerts"
  
  tags = var.common_tags
}

# SNS Topic Subscription (if enabled and email provided)
resource "aws_sns_topic_subscription" "alerts_email" {
  count = var.enable_sns_alerts && var.alert_email != "" ? 1 : 0
  
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.log_retention_days
  
  tags = var.common_tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.api_gateway_name}"
  retention_in_days = var.log_retention_days
  
  tags = var.common_tags
}

# CloudWatch Log Metric Filter for Lambda Errors
resource "aws_cloudwatch_log_metric_filter" "lambda_errors" {
  name           = "${var.project_name}-${var.environment}-lambda-errors"
  pattern        = "ERROR"
  log_group_name = aws_cloudwatch_log_group.lambda.name

  metric_transformation {
    name      = "LambdaErrorCount"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }
}

# CloudWatch Log Metric Filter for API Gateway 4XX Errors
resource "aws_cloudwatch_log_metric_filter" "api_gateway_4xx_errors" {
  name           = "${var.project_name}-${var.environment}-api-gateway-4xx-errors"
  pattern        = "{ $.status = 4* }"
  log_group_name = aws_cloudwatch_log_group.api_gateway.name

  metric_transformation {
    name      = "ApiGateway4xxErrorCount"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }
}

# CloudWatch Log Metric Filter for Folding@Home Progress
resource "aws_cloudwatch_log_metric_filter" "folding_progress" {
  name           = "${var.project_name}-${var.environment}-folding-progress"
  pattern        = "{ $.progress != null }"
  log_group_name = aws_cloudwatch_log_group.lambda.name

  metric_transformation {
    name      = "FoldingProgress"
    namespace = "${var.project_name}/${var.environment}"
    value     = "$.progress"
  }
}

# CloudWatch Log Metric Filter for Folding@Home Work Units
resource "aws_cloudwatch_log_metric_filter" "folding_wus" {
  name           = "${var.project_name}-${var.environment}-folding-wus"
  pattern        = "{ $.work_units != null }"
  log_group_name = aws_cloudwatch_log_group.lambda.name

  metric_transformation {
    name      = "FoldingWUs"
    namespace = "${var.project_name}/${var.environment}"
    value     = "$.work_units"
  }
}

# CloudWatch Log Metric Filter for Spot Instance Health
resource "aws_cloudwatch_log_metric_filter" "spot_instance_health" {
  name           = "${var.project_name}-${var.environment}-spot-instance-health"
  pattern        = "{ $.health_score != null }"
  log_group_name = aws_cloudwatch_log_group.lambda.name

  metric_transformation {
    name      = "SpotInstanceHealth"
    namespace = "${var.project_name}/${var.environment}"
    value     = "$.health_score"
  }
}

# CloudWatch Log Metric Filter for Spot Interruption Warnings
resource "aws_cloudwatch_log_metric_filter" "spot_interruption_warnings" {
  name           = "${var.project_name}-${var.environment}-spot-interruption-warnings"
  pattern        = "spot interruption warning"
  log_group_name = aws_cloudwatch_log_group.lambda.name

  metric_transformation {
    name      = "SpotInterruptionWarnings"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }
}

# CloudWatch Log Metric Filter for Spot Price Anomaly Detection
resource "aws_cloudwatch_log_metric_filter" "spot_price_anomaly" {
  name           = "${var.project_name}-${var.environment}-spot-price-anomaly"
  pattern        = "{ $.anomaly_score != null }"
  log_group_name = aws_cloudwatch_log_group.lambda.name

  metric_transformation {
    name      = "SpotPriceAnomalyScore"
    namespace = "${var.project_name}/${var.environment}"
    value     = "$.anomaly_score"
  }
}

# CloudWatch Log Metric Filter for API Gateway 5XX Errors
resource "aws_cloudwatch_log_metric_filter" "api_gateway_5xx_errors" {
  name           = "${var.project_name}-${var.environment}-api-gateway-5xx-errors"
  pattern        = "{ $.status = 5* }"
  log_group_name = aws_cloudwatch_log_group.api_gateway.name

  metric_transformation {
    name      = "ApiGateway5xxErrorCount"
    namespace = "${var.project_name}/${var.environment}"
    value     = "1"
  }
}