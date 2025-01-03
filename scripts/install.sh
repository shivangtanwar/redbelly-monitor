#!/bin/bash

# Installation directory
INSTALL_DIR="/opt/node-health"

# Create directories
sudo mkdir -p $INSTALL_DIR
sudo mkdir -p /var/log/redbelly-monitor

# Copy files
sudo cp -r src/* $INSTALL_DIR/
sudo cp package*.json $INSTALL_DIR/

# Install dependencies
cd $INSTALL_DIR
sudo npm install

# Create service file
sudo tee /etc/systemd/system/node-health.service << 'SERVICE'
[Unit]
Description=Redbelly Node Health Check Service
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/redbelly-monitor/src/health-check.js
Restart=always
User=root
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE

# Set permissions
sudo chown -R root:root $INSTALL_DIR

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable node-health.service
sudo systemctl start node-health.service

echo "Installation complete. Service is running on port 9092"
