# EC2 module for AWS GPU Spot Monitor

# Security Group for EC2 instances
resource "aws_security_group" "ec2_instances" {
  name        = "${var.project_name}-${var.environment}-ec2-instances"
  description = "Security group for EC2 instances running Folding@Home"
  vpc_id      = var.vpc_id

  # SSH access (if enabled)
  dynamic "ingress" {
    for_each = var.enable_ssh ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.ssh_cidr_blocks
      description = "SSH access"
    }
  }

  # Folding@Home Web Control access
  ingress {
    from_port   = 7396
    to_port     = 7396
    protocol    = "tcp"
    cidr_blocks = var.folding_web_control_cidr_blocks
    description = "Folding@Home Web Control"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-ec2-instances"
    }
  )
}

# Launch Template for EC2 Spot Instances
resource "aws_launch_template" "folding_at_home" {
  name = "${var.project_name}-${var.environment}-folding-at-home"
  
  image_id      = var.ami_id
  instance_type = var.instance_types[0]  # Default instance type
  key_name      = var.key_name

  iam_instance_profile {
    name = var.instance_profile_name
  }

  network_interfaces {
    associate_public_ip_address = var.associate_public_ip
    security_groups             = [aws_security_group.ec2_instances.id]
  }

  block_device_mappings {
    device_name = "/dev/sda1"

    ebs {
      volume_size           = var.root_volume_size
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  user_data = base64encode(var.user_data_script)

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(
      var.common_tags,
      {
        Name = "${var.project_name}-${var.environment}-folding-at-home"
      }
    )
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(
      var.common_tags,
      {
        Name = "${var.project_name}-${var.environment}-folding-at-home"
      }
    )
  }

  tags = var.common_tags
}

# CloudWatch Event Rule for Spot Instance Interruption Notices
resource "aws_cloudwatch_event_rule" "spot_interruption" {
  name        = "${var.project_name}-${var.environment}-spot-interruption"
  description = "Capture Spot Instance Interruption Notices"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Spot Instance Interruption Warning"]
  })

  tags = var.common_tags
}

# CloudWatch Event Target for Spot Instance Interruption Notices
resource "aws_cloudwatch_event_target" "spot_interruption" {
  rule      = aws_cloudwatch_event_rule.spot_interruption.name
  target_id = "SpotInterruptionLambda"
  arn       = var.spot_interruption_lambda_arn
}

# Lambda Permission for CloudWatch Events
resource "aws_lambda_permission" "spot_interruption" {
  statement_id  = "AllowExecutionFromCloudWatchEvents"
  action        = "lambda:InvokeFunction"
  function_name = var.spot_interruption_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.spot_interruption.arn
}

# CloudWatch Event Rule for EC2 State Changes
resource "aws_cloudwatch_event_rule" "ec2_state_change" {
  name        = "${var.project_name}-${var.environment}-ec2-state-change"
  description = "Capture EC2 Instance State Changes"

  event_pattern = jsonencode({
    source      = ["aws.ec2"]
    detail-type = ["EC2 Instance State-change Notification"]
  })

  tags = var.common_tags
}

# CloudWatch Event Target for EC2 State Changes
resource "aws_cloudwatch_event_target" "ec2_state_change" {
  rule      = aws_cloudwatch_event_rule.ec2_state_change.name
  target_id = "EC2StateChangeLambda"
  arn       = var.ec2_state_change_lambda_arn
}

# Lambda Permission for CloudWatch Events
resource "aws_lambda_permission" "ec2_state_change" {
  statement_id  = "AllowExecutionFromCloudWatchEvents"
  action        = "lambda:InvokeFunction"
  function_name = var.ec2_state_change_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ec2_state_change.arn
}

# SSM Parameter for Folding@Home Team ID
resource "aws_ssm_parameter" "folding_team_id" {
  name        = "/${var.project_name}/${var.environment}/folding/team_id"
  description = "Folding@Home Team ID"
  type        = "String"
  value       = var.folding_team_id
  
  tags = var.common_tags
}

# SSM Parameter for Folding@Home Passkey
resource "aws_ssm_parameter" "folding_passkey" {
  name        = "/${var.project_name}/${var.environment}/folding/passkey"
  description = "Folding@Home Passkey"
  type        = "SecureString"
  value       = var.folding_passkey
  
  tags = var.common_tags
}

# SSM Parameter for Folding@Home Power Level
resource "aws_ssm_parameter" "folding_power" {
  name        = "/${var.project_name}/${var.environment}/folding/power"
  description = "Folding@Home Power Level (light, medium, full)"
  type        = "String"
  value       = var.folding_power
  
  tags = var.common_tags
}

# SSM Parameter for Folding@Home GPU Usage
resource "aws_ssm_parameter" "folding_gpu" {
  name        = "/${var.project_name}/${var.environment}/folding/gpu"
  description = "Folding@Home GPU Usage (true/false)"
  type        = "String"
  value       = var.folding_gpu ? "true" : "false"
  
  tags = var.common_tags
}

# SSM Parameter for Folding@Home CPU Usage
resource "aws_ssm_parameter" "folding_cpu" {
  name        = "/${var.project_name}/${var.environment}/folding/cpu"
  description = "Folding@Home CPU Usage (true/false)"
  type        = "String"
  value       = var.folding_cpu ? "true" : "false"
  
  tags = var.common_tags
}