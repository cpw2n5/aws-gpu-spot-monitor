#!/bin/bash
# Folding@Home initialization script for AWS GPU Spot Instances

# Set up logging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting Folding@Home initialization script"

# Update system packages
echo "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
apt-get install -y \
    awscli \
    jq \
    curl \
    wget \
    unzip \
    htop \
    python3 \
    python3-pip \
    nvidia-driver-525 \
    nvidia-cuda-toolkit \
    build-essential \
    ocl-icd-opencl-dev

# Install AWS CloudWatch agent
echo "Installing CloudWatch agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "folding-at-home-logs",
            "log_stream_name": "{instance_id}-user-data"
          },
          {
            "file_path": "/var/lib/fahclient/log.txt",
            "log_group_name": "folding-at-home-logs",
            "log_stream_name": "{instance_id}-fahclient"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "FoldingAtHome",
    "metrics_collected": {
      "cpu": {
        "resources": [
          "*"
        ],
        "measurement": [
          "usage_active",
          "usage_system",
          "usage_user"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "resources": [
          "/"
        ],
        "measurement": [
          "used_percent",
          "inodes_free"
        ],
        "metrics_collection_interval": 60
      },
      "diskio": {
        "resources": [
          "*"
        ],
        "measurement": [
          "io_time",
          "write_bytes",
          "read_bytes",
          "writes",
          "reads"
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          "used_percent",
          "used",
          "total"
        ],
        "metrics_collection_interval": 60
      },
      "net": {
        "resources": [
          "eth0"
        ],
        "measurement": [
          "bytes_sent",
          "bytes_recv",
          "packets_sent",
          "packets_recv"
        ],
        "metrics_collection_interval": 60
      },
      "nvidia_gpu": {
        "measurement": [
          "utilization_gpu",
          "temperature_gpu",
          "power_draw",
          "utilization_memory"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
echo "Starting CloudWatch agent..."
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# Get instance metadata
echo "Getting instance metadata..."
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)

# Get Folding@Home configuration from SSM Parameter Store
echo "Getting Folding@Home configuration from SSM Parameter Store..."
TEAM_ID=$(aws ssm get-parameter --name "/aws-gpu-spot-monitor/prod/folding/team_id" --region $REGION --query "Parameter.Value" --output text)
PASSKEY=$(aws ssm get-parameter --name "/aws-gpu-spot-monitor/prod/folding/passkey" --with-decryption --region $REGION --query "Parameter.Value" --output text)
POWER=$(aws ssm get-parameter --name "/aws-gpu-spot-monitor/prod/folding/power" --region $REGION --query "Parameter.Value" --output text)
GPU_ENABLED=$(aws ssm get-parameter --name "/aws-gpu-spot-monitor/prod/folding/gpu" --region $REGION --query "Parameter.Value" --output text)
CPU_ENABLED=$(aws ssm get-parameter --name "/aws-gpu-spot-monitor/prod/folding/cpu" --region $REGION --query "Parameter.Value" --output text)

# Set default values if parameters are not found
TEAM_ID=${TEAM_ID:-0}
PASSKEY=${PASSKEY:-}
POWER=${POWER:-full}
GPU_ENABLED=${GPU_ENABLED:-true}
CPU_ENABLED=${CPU_ENABLED:-false}

# Install Folding@Home
echo "Installing Folding@Home..."
wget https://download.foldingathome.org/releases/public/release/fahclient/debian-stable-64bit/v7.6/fahclient_7.6.21_amd64.deb
dpkg -i --force-depends fahclient_7.6.21_amd64.deb
rm fahclient_7.6.21_amd64.deb

# Configure Folding@Home
echo "Configuring Folding@Home..."
# Stop the service first
/etc/init.d/FAHClient stop

# Create configuration file
cat > /etc/fahclient/config.xml << EOF
<config>
  <user value="Anonymous"/>
  <team value="$TEAM_ID"/>
  <passkey value="$PASSKEY"/>
  <power value="$POWER"/>
  <gpu value="$GPU_ENABLED"/>
  <cpu value="$CPU_ENABLED"/>
  <fold-anon value="true"/>
  <web-allow value="0/0"/>
  <allow value="0/0"/>
  <cause value="COVID-19"/>
</config>
EOF

# Start Folding@Home
echo "Starting Folding@Home..."
/etc/init.d/FAHClient start

# Install Folding@Home Web Control
echo "Installing Folding@Home Web Control..."
wget https://download.foldingathome.org/releases/public/release/fahcontrol/debian-stable-64bit/v7.6/fahcontrol_7.6.21-1_all.deb
apt-get install -y ./fahcontrol_7.6.21-1_all.deb
rm fahcontrol_7.6.21-1_all.deb

# Install Folding@Home Web Viewer
echo "Installing Folding@Home Web Viewer..."
wget https://download.foldingathome.org/releases/public/release/fahviewer/debian-stable-64bit/v7.6/fahviewer_7.6.21_amd64.deb
apt-get install -y ./fahviewer_7.6.21_amd64.deb
rm fahviewer_7.6.21_amd64.deb

# Install spot instance termination handler
echo "Installing spot instance termination handler..."
mkdir -p /opt/aws-spot-termination-handler
cat > /opt/aws-spot-termination-handler/spot-termination-handler.sh << 'EOF'
#!/bin/bash

# Function to handle termination
handle_termination() {
    echo "Spot instance termination notice received. Shutting down Folding@Home gracefully..."
    
    # Stop Folding@Home client
    /etc/init.d/FAHClient stop
    
    # Wait for client to stop
    sleep 5
    
    # Send termination status to DynamoDB
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
    
    aws dynamodb update-item \
        --table-name aws-gpu-spot-monitor-prod-instances \
        --key '{"id":{"S":"'$INSTANCE_ID'"}}' \
        --update-expression "SET #status = :status, terminatedAt = :terminatedAt" \
        --expression-attribute-names '{"#status":"status"}' \
        --expression-attribute-values '{":status":{"S":"TERMINATED"},":terminatedAt":{"N":"'$(date +%s)'"}}' \
        --region $REGION
    
    # Shutdown the instance
    shutdown -h now
}

# Check for spot termination notice every 5 seconds
while true; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://169.254.169.254/latest/meta-data/spot/termination-time)
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        handle_termination
        break
    fi
    
    sleep 5
done
EOF

chmod +x /opt/aws-spot-termination-handler/spot-termination-handler.sh

# Create systemd service for spot termination handler
cat > /etc/systemd/system/spot-termination-handler.service << 'EOF'
[Unit]
Description=Spot Instance Termination Handler
After=network.target

[Service]
Type=simple
ExecStart=/opt/aws-spot-termination-handler/spot-termination-handler.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start spot termination handler
systemctl enable spot-termination-handler
systemctl start spot-termination-handler

# Install Folding@Home monitoring script
echo "Installing Folding@Home monitoring script..."
mkdir -p /opt/folding-monitor
cat > /opt/folding-monitor/monitor.py << 'EOF'
#!/usr/bin/env python3

import json
import subprocess
import time
import boto3
import requests
import socket
import os
from datetime import datetime

# Configuration
INSTANCE_ID = requests.get('http://169.254.169.254/latest/meta-data/instance-id').text
REGION = requests.get('http://169.254.169.254/latest/meta-data/placement/region').text
TABLE_NAME = 'aws-gpu-spot-monitor-prod-folding-stats'

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb', region_name=REGION)

def get_folding_stats():
    """Get stats from Folding@Home client via telnet"""
    try:
        # Connect to FAHClient
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect(('localhost', 36330))
        s.recv(4096)  # Welcome message
        
        # Send commands
        s.sendall(b'auth ""\\n')
        s.recv(4096)
        
        s.sendall(b'slot-info\\n')
        slot_info = s.recv(4096).decode('utf-8')
        
        s.sendall(b'queue-info\\n')
        queue_info = s.recv(4096).decode('utf-8')
        
        s.close()
        
        # Parse stats
        stats = {
            'slots': [],
            'queue': []
        }
        
        # Parse slot info
        for line in slot_info.split('\n'):
            if 'id' in line and 'status' in line:
                slot = {}
                parts = line.split(':')
                for part in parts:
                    if '=' in part:
                        key, value = part.split('=')
                        slot[key.strip()] = value.strip()
                if slot:
                    stats['slots'].append(slot)
        
        # Parse queue info
        for line in queue_info.split('\n'):
            if 'id' in line and 'state' in line:
                queue_item = {}
                parts = line.split(':')
                for part in parts:
                    if '=' in part:
                        key, value = part.split('=')
                        queue_item[key.strip()] = value.strip()
                if queue_item:
                    stats['queue'].append(queue_item)
        
        return stats
    except Exception as e:
        print(f"Error getting folding stats: {e}")
        return None

def get_gpu_stats():
    """Get GPU stats using nvidia-smi"""
    try:
        result = subprocess.run(['nvidia-smi', '--query-gpu=utilization.gpu,utilization.memory,temperature.gpu,power.draw', '--format=csv,noheader,nounits'], 
                               stdout=subprocess.PIPE, text=True)
        
        if result.returncode == 0:
            values = result.stdout.strip().split(',')
            if len(values) >= 4:
                return {
                    'gpu_utilization': float(values[0].strip()),
                    'memory_utilization': float(values[1].strip()),
                    'temperature': float(values[2].strip()),
                    'power_draw': float(values[3].strip())
                }
        return {}
    except Exception as e:
        print(f"Error getting GPU stats: {e}")
        return {}

def save_stats_to_dynamodb(stats):
    """Save stats to DynamoDB"""
    try:
        timestamp = int(time.time())
        
        # Combine stats
        item = {
            'id': {'S': f"{INSTANCE_ID}:{timestamp}"},
            'instanceId': {'S': INSTANCE_ID},
            'timestamp': {'N': str(timestamp)},
            'stats': {'S': json.dumps(stats)},
            'expiresAt': {'N': str(timestamp + 7776000)}  # TTL: 90 days
        }
        
        # Add GPU stats if available
        gpu_stats = get_gpu_stats()
        if gpu_stats:
            for key, value in gpu_stats.items():
                item[key] = {'N': str(value)}
        
        # Save to DynamoDB
        dynamodb.put_item(
            TableName=TABLE_NAME,
            Item=item
        )
        
        print(f"Stats saved to DynamoDB at {datetime.now().isoformat()}")
    except Exception as e:
        print(f"Error saving stats to DynamoDB: {e}")

def main():
    """Main function"""
    while True:
        try:
            stats = get_folding_stats()
            if stats:
                save_stats_to_dynamodb(stats)
        except Exception as e:
            print(f"Error in main loop: {e}")
        
        # Wait for 5 minutes
        time.sleep(300)

if __name__ == "__main__":
    main()
EOF

chmod +x /opt/folding-monitor/monitor.py

# Create systemd service for Folding@Home monitoring
cat > /etc/systemd/system/folding-monitor.service << 'EOF'
[Unit]
Description=Folding@Home Monitoring Service
After=network.target FAHClient.service

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/folding-monitor/monitor.py
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

# Install required Python packages
pip3 install boto3 requests

# Enable and start Folding@Home monitoring service
systemctl enable folding-monitor
systemctl start folding-monitor

# Update instance status in DynamoDB
echo "Updating instance status in DynamoDB..."
aws dynamodb update-item \
    --table-name aws-gpu-spot-monitor-prod-instances \
    --key '{"id":{"S":"'$INSTANCE_ID'"}}' \
    --update-expression "SET #status = :status, startedAt = :startedAt" \
    --expression-attribute-names '{"#status":"status"}' \
    --expression-attribute-values '{":status":{"S":"RUNNING"},":startedAt":{"N":"'$(date +%s)'"}}' \
    --region $REGION

echo "Folding@Home initialization script completed"