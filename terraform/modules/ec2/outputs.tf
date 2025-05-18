# Outputs for the EC2 module

output "security_group_id" {
  description = "The ID of the security group for EC2 instances"
  value       = aws_security_group.ec2_instances.id
}

output "security_group_name" {
  description = "The name of the security group for EC2 instances"
  value       = aws_security_group.ec2_instances.name
}

output "security_group_arn" {
  description = "The ARN of the security group for EC2 instances"
  value       = aws_security_group.ec2_instances.arn
}

output "launch_template_id" {
  description = "The ID of the launch template for EC2 instances"
  value       = aws_launch_template.folding_at_home.id
}

output "launch_template_arn" {
  description = "The ARN of the launch template for EC2 instances"
  value       = aws_launch_template.folding_at_home.arn
}

output "launch_template_name" {
  description = "The name of the launch template for EC2 instances"
  value       = aws_launch_template.folding_at_home.name
}

output "launch_template_latest_version" {
  description = "The latest version of the launch template for EC2 instances"
  value       = aws_launch_template.folding_at_home.latest_version
}

output "spot_interruption_event_rule_arn" {
  description = "The ARN of the CloudWatch event rule for spot instance interruption notices"
  value       = aws_cloudwatch_event_rule.spot_interruption.arn
}

output "spot_interruption_event_rule_name" {
  description = "The name of the CloudWatch event rule for spot instance interruption notices"
  value       = aws_cloudwatch_event_rule.spot_interruption.name
}

output "ec2_state_change_event_rule_arn" {
  description = "The ARN of the CloudWatch event rule for EC2 instance state changes"
  value       = aws_cloudwatch_event_rule.ec2_state_change.arn
}

output "ec2_state_change_event_rule_name" {
  description = "The name of the CloudWatch event rule for EC2 instance state changes"
  value       = aws_cloudwatch_event_rule.ec2_state_change.name
}

output "folding_team_id_parameter_name" {
  description = "The name of the SSM parameter for Folding@Home team ID"
  value       = aws_ssm_parameter.folding_team_id.name
}

output "folding_team_id_parameter_arn" {
  description = "The ARN of the SSM parameter for Folding@Home team ID"
  value       = aws_ssm_parameter.folding_team_id.arn
}

output "folding_passkey_parameter_name" {
  description = "The name of the SSM parameter for Folding@Home passkey"
  value       = aws_ssm_parameter.folding_passkey.name
}

output "folding_passkey_parameter_arn" {
  description = "The ARN of the SSM parameter for Folding@Home passkey"
  value       = aws_ssm_parameter.folding_passkey.arn
}

output "folding_power_parameter_name" {
  description = "The name of the SSM parameter for Folding@Home power level"
  value       = aws_ssm_parameter.folding_power.name
}

output "folding_power_parameter_arn" {
  description = "The ARN of the SSM parameter for Folding@Home power level"
  value       = aws_ssm_parameter.folding_power.arn
}

output "folding_gpu_parameter_name" {
  description = "The name of the SSM parameter for Folding@Home GPU usage"
  value       = aws_ssm_parameter.folding_gpu.name
}

output "folding_gpu_parameter_arn" {
  description = "The ARN of the SSM parameter for Folding@Home GPU usage"
  value       = aws_ssm_parameter.folding_gpu.arn
}

output "folding_cpu_parameter_name" {
  description = "The name of the SSM parameter for Folding@Home CPU usage"
  value       = aws_ssm_parameter.folding_cpu.name
}

output "folding_cpu_parameter_arn" {
  description = "The ARN of the SSM parameter for Folding@Home CPU usage"
  value       = aws_ssm_parameter.folding_cpu.arn
}