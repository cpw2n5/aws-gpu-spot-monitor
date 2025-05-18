# Terraform variables for the production environment

aws_region              = "us-east-1"
project_name            = "aws-gpu-spot-monitor"
dynamodb_billing_mode   = "PROVISIONED"  # Use provisioned capacity for production
lambda_runtime          = "nodejs18.x"
lambda_timeout          = 60  # Longer timeout for production
lambda_memory_size      = 1024  # Higher memory for production
api_gateway_stage_name  = "api"

cognito_password_policy = {
  minimum_length    = 12  # Stronger password policy for production
  require_lowercase = true
  require_numbers   = true
  require_symbols   = true
  require_uppercase = true
}

frontend_domain         = "gpu-monitor.example.com"  # Example production domain
enable_waf              = true
enable_cloudwatch_logs  = true
enable_cloudwatch_metrics = true
enable_xray             = true  # Enable X-Ray for production

spot_instance_types     = ["g4dn.xlarge", "p3.2xlarge", "g3s.xlarge", "p2.xlarge"]  # More instance types for production
spot_max_price          = "1.50"  # Set a maximum price for production

# These values should be set in a secure way, e.g., using AWS Secrets Manager or environment variables
folding_at_home_team_id = "0"
folding_at_home_passkey = ""