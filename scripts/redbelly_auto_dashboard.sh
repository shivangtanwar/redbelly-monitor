#!/bin/bash

# Update and upgrade the system
echo "Updating and upgrading the system..."
sudo apt update && sudo apt upgrade -y

# Install necessary packages
echo "Installing Node.js, npm, Prometheus, and systemd..."
sudo apt install -y nodejs npm prometheus systemd

# Add Grafana repository and install Grafana
echo "Adding Grafana repository and installing Grafana..."
sudo mkdir -p /etc/apt/keyrings
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
sudo apt update && sudo apt install -y grafana
sudo systemctl enable --now grafana-server.service

# Clone the Redbelly Monitor repository and install dependencies
echo "Cloning the Redbelly Monitor repository..."
git clone https://github.com/shivangtanwar/redbelly-monitor.git
cd redbelly-monitor || exit
npm install

# Prompt user for wallet address
read -p "Enter your wallet address: " wallet_address
sed -i "13s|const signingWalletAddress = .*|const signingWalletAddress = '$wallet_address';|" src/health-check.js

# Create and configure the systemd service file
echo "Setting up the Redbelly Node Health Check Service..."
current_path=$(pwd)
service_file="/etc/systemd/system/node-health.service"

sudo bash -c "cat > $service_file" <<EOL
[Unit]
Description=Redbelly Node Health Check Service
After=network.target

[Service]
ExecStart=/usr/bin/node $current_path/src/health-check.js
Restart=always
User=root
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=$current_path

[Install]
WantedBy=multi-user.target
EOL

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable node-health.service
sudo systemctl start node-health.service

# Update Prometheus configuration with proper alignment
echo "Updating Prometheus configuration with proper alignment..."
sudo bash -c "cat >> /etc/prometheus/prometheus.yml" <<EOL

  - job_name: 'redbelly-health'
    static_configs:
      - targets: ['localhost:9092']
EOL

sudo systemctl restart prometheus

# Configure UFW firewall
echo "Configuring UFW firewall..."
sudo ufw allow 9090
sudo ufw allow 9092
sudo ufw allow 3000
sudo ufw reload

echo "Setup completed successfully!"
