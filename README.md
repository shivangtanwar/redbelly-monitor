
# 🌟Redbelly Node Monitoring

One stop solution to monitor your Redbelly Node at a single place using Grafan Dashboard. 




## 📷 Screenshots

![App Screenshot](https://raw.githubusercontent.com/shivangtanwar/redbelly-monitor/refs/heads/main/screenshots/Dashboard-ss.png)


## 🪶 Features

- **Resource Usage Tracking** 💻
  - CPU 
  - RAM
  - System Load (5m & 15m avg)
  - Storage (Root FS)
- **System Resource Visibility** 💽
- **Network Block Height (Routescan)** 📤
- **Node Block Height** 📥
- **Sync Percentage (%)** 🔃
- **Signing Wallet Balance** 🌟
- **Script Health Status** ✅


## 💪 Redbelly Server Recommendation

![ParentHost](https://media.licdn.com/dms/image/v2/D5622AQHlqR1iNUQYuw/feedshare-shrink_2048_1536/B56ZQyoqhLGoAo-/0/1736016309450?e=1738800000&v=beta&t=wqGsNRHZTDAV82S6O0dU4g58hrAzE4bx8redfc0LkkE)

- **5.7 Ghz CPU, DDR5 RAM, NVMe Storage & 10Gbps Port**
- **Checkout VPS-R Now : [ParentHost VPS Hosting](https://parenthost.com/vps-hosting)**



## 🧵 Prequisites

Make sure the following tech stack are available on your system:
- **NodeJs (v14.x)+**
- **Prometheus**
- **Grafana**
- **systemd**
## 🅰️ Automatic Installation
**<---Under Development-->**
## Ⓜ️ Manual Installation (Recommended)


#### 💉 1. Prequisites Installation (optional)

Install prequisites using the following steps, skip if already satisfied.

- Install NodeJs
```
sudo apt install nodejs npm
```

- Install Prometheus
```
sudo apt install prometheus
```

- Install systemd
```
sudo apt install systemd
```

- Install Grafana Package
```
  wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
  echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
  sudo apt update && sudo apt install grafana
```

- Start Grafana Service
```
sudo systemctl enable --now grafana-server.service
```

## ©️ 2. Clone The Repository

```
git clone https://github.com/shivangtanwar/redbelly-monitor.git
cd redbelly-monitor
```
## ℹ️ 3. Install Dependencies

```
npm install
```
## 🛠️ 4. Setup & Run the Health Check Service

**1. Add your Wallet address**
```
nano src/health-check.js
```
![App Screenshot](https://raw.githubusercontent.com/shivangtanwar/redbelly-monitor/refs/heads/main/screenshots/wallet-addr.png)
- Place your Wallet address in the above field and you can leave the apiKey unchanged.

**1. Create a systemd service file**

```
sudo nano /etc/systemd/system/node-health.service
```

**2. Paste following Configuration**

```
[Unit]
Description=Redbelly Node Health Check Service
After=network.target

[Service]
ExecStart=/usr/bin/node /path/to/redbelly-monitor/src/health-check.js
Restart=always
User=root
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=/path/to/redbelly-monitor

[Install]
WantedBy=multi-user.target
```

Make sure to replace (/path/to/) with your path to the specified folder.

**3. Reload systemd and enable the service**

```
sudo systemctl daemon-reload
sudo systemctl enable node-health.service
sudo systemctl start node-health.service
sudo systemctl status node-health.service
```

**4. Check status of service**
```
sudo systemctl status node-health.service
```
## 🦾5. Configure Prometheus

**1. Open configuration file**
```
sudo nano /etc/prometheus/prometheus.yml
```

**2. Add the following code at the end**
```
- job_name: 'redbelly-health'
    static_configs:
      - targets: ['localhost:9092']
```

**3. Restart Prometheus**

```
sudo systemctl restart prometheus
```
## 📝 6. Firewall Setup

```
sudo ufw allow 9090
sudo ufw allow 9092
sudo ufw allow 3000
sudo ufw reload
```
## 🎉 7. Setup Monitoring Dashboard

- Default login details for Grafana will be **admin** for both username and password.
- Firstly, add prometheus as data source at ```http://<your-server-ip>/connections/datasources/new```. Use prometheus server URL as ```http://<your-server-ip>:9090```.
- Go to ```https://<your-server-ip>:3000/dashboards```

- On right side, click "New" & then click "Import"
![App Screenshot](https://raw.githubusercontent.com/shivangtanwar/redbelly-monitor/refs/heads/main/screenshots/setup.png)

- Upload/Paste the Grafana_Dashboard.json there which is available in this repository.
![App Screenshot](https://raw.githubusercontent.com/shivangtanwar/redbelly-monitor/refs/heads/main/screenshots/setup2.png)

- Click Load & Then click Import.

- **At this point if you see errors on the dashboard then click all the panels one by one, and choose edit, wait for it to load then just go back. Do this with all panels and save your dashboard to resolve this error.**

- All set! Now, You can also set it as default homepage dashboard from Profile.
![App Screenshot](https://raw.githubusercontent.com/shivangtanwar/redbelly-monitor/refs/heads/main/screenshots/Dashboard-ss.png)
## 🧩 Troubleshooting

- Check the Service Logs:
```
sudo journalctl -u node-health.service -f
sudo journalctl -u prometheus -f
sudo journalctl -u grafana-server -f
```

- Check the Node.js Logs:
```
cat /path/to/redbelly-monitor/logs/health-check.log
```

- Check the Prometheus Logs:
```
cat /var/log/prometheus/prometheus.log
```
- Check the Grafana Logs:
```
cat /var/log/grafana/grafana.log
```

- Verify Node Service is Active:
```
sudo systemctl status node-health.service
```

## 🤝 Contributing

Contributions are always welcome!

Feel free to open an issue or submit a pull request to improve this project.


## 🔗 Follow on Twitter
- Shivang (Author)[![twitter](https://img.shields.io/badge/twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/ShivangTanwar)

- ParentHost (Hosting & Automation Services Provider)[![twitter](https://img.shields.io/badge/twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/ParentHost)

## ©️ Credits

This project is based on the original concept by Aggelos. For more information, visit the Redbelly Tracking Dashboard at [Aggelos's GitHub](https://github.com/adacapo21/redbelly-monitor).


## 📜 License

This project is licensed under the MIT License. See the LICENSE file for details.
