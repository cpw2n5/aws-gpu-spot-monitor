# Terraform variables for the staging environment

aws_region              = "us-east-1"
project_name            = "aws-gpu-spot-monitor"
dynamodb_billing_mode   = "PAY_PER_REQUEST"
lambda_runtime          = "nodejs18.x"
lambda_timeout          = 30
lambda_memory_size      = 512  # Higher memory for staging
api_gateway_stage_name  = "api"

cognito_password_policy = {
  minimum_length    = 8
  require_lowercase = true
  require_numbers   = true
  require_symbols   = true  # More strict for staging
  require_uppercase = true
}

frontend_domain         = "staging-gpu-monitor.example.com"  # Example domain
enable_waf              = true
enable_cloudwatch_logs  = true
enable_cloudwatch_metrics = true
enable_xray             = true  # Enable X-Ray for staging

spot_instance_types     = ["g4dn.xlarge", "p3.2xlarge", "g3s.xlarge"]
spot_max_price          = ""  # Empty string means on-demand price

# These values should be set in a secure way, e.g., using AWS Secrets Manager or environment variables
folding_at_home_team_id = "0"
folding_at_home_passkey = ""