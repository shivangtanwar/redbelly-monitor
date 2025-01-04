const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const client = require('prom-client');
const fetch = require('node-fetch');

const execAsync = promisify(exec);
const app = express();
const port = 9092;


//Define Signing Wallet & API Key
const signingWalletAddress = 'YOUR_WALLET_ADDRESS';
const apiKey = 'YourApiKeyToken'; //Not Required until or unless you go for paid plans


// Add CORS and JSON handling middleware
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Prometheus Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

//Actual Block Height
const networkBlockCountGauge = new client.Gauge({
    name: 'network_blocksCount',
    help: 'Total blocks count from the network'
});
register.registerMetric(networkBlockCountGauge);

app.get('/network/count', async (req, res) => {
    try {
        // Fetch block count from the API
        const response = await fetch('https://cdn.testnet.routescan.io/api/evm/153_2/sync');
        const data = await response.json();

        if (data && data.blocksCount !== undefined) {
            const blockCount = data.blocksCount;

            // Update Prometheus metric
            networkBlockCountGauge.set(blockCount);

            // Respond with the block count
            res.json({ blocksCount: blockCount });
        } else {
            throw new Error('Invalid response from API');
        }
    } catch (error) {
        // Respond with an error
        res.status(500).json({ error: error.message });
    }
});

//Balance Fetch Custom Metrics
const walletBalanceGauge = new client.Gauge({
    name: 'wallet_balance_wei',
    help: 'Balance of the wallet in Wei'
});
register.registerMetric(walletBalanceGauge);

// Function to fetch and update wallet balance
async function updateWalletBalance() {
    try {
        const response = await fetch(`https://api.routescan.io/v2/network/testnet/evm/153_2/etherscan/api?module=account&action=balance&address=${signingWalletAddress}&tag=latest&apikey=${apiKey}`);
        const data = await response.json();

        if (data && data.result) {
            const balanceWei = parseFloat(data.result); // Convert to a number
            const balanceEther = balanceWei / 1e18; // Convert Wei to Ether
            walletBalanceGauge.set(balanceEther); // Update Prometheus metric

            console.log(`Wallet balance updated: ${balance}`);
        } else {
            throw new Error('Invalid response from API');
        }
    } catch (error) {
        console.error(`Failed to update wallet balance: ${error.message}`);
    }
}

// Schedule to run every 5 minutes (300000 ms)
setInterval(updateWalletBalance, 300000);

// Initial update at server startup
updateWalletBalance();

// Endpoint to expose balance (optional, as it's now periodic)
app.get('/balance', (req, res) => {
    res.json({ message: 'Wallet balance is updated every 5 minutes and available in /metrics' });
});

// Custom Metrics
const latestBlockGauge = new client.Gauge({
    name: 'redbelly_latest_block',
    help: 'Latest block number of Redbelly node'
});
register.registerMetric(latestBlockGauge);

app.get('/metrics', async (req, res) => {
    try {
        const { stdout } = await execAsync('tail -n 2000 /var/log/redbelly/rbn_logs/rbbc_logs.log');

        // Look for 'Done processing block'
        const blockMatch = stdout.match(/Done processing block (\d+)/g);
        const latestBlock = blockMatch ?
            parseInt(blockMatch[blockMatch.length - 1].replace('Done processing block ', '')) :
            0;

        latestBlockGauge.set(latestBlock);

        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        res.status(500).end(error.message);
    }
});


// Get detailed node status
app.get('/health/detailed', async (req, res) => {
    try {
        // Run all checks in parallel
        const [
            serviceStatus,
            processId,
            lastLogs,
            systemctlStatus
        ] = await Promise.all([
            execAsync('systemctl is-active redbelly.service'),
            execAsync('pgrep rbbc'),
            execAsync('tail -n 1000 /var/log/redbelly/rbn_logs/rbbc_logs.log'),
            execAsync('systemctl status redbelly.service')
        ]);

        // Extract latest block number from logs
        const blockMatch = lastLogs.stdout.match(/Done processing block (\d+)/g);
        const latestBlock = blockMatch ?
            parseInt(blockMatch[blockMatch.length - 1].replace('Done processing block ', '')) :
            'Not found';

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            node: {
                service: {
                    name: 'redbelly.service',
                    status: serviceStatus.stdout.trim(),
                    pid: processId.stdout.trim()
                },
                metrics: {
                    latestBlock: latestBlock,
                    lastLogTimestamp: lastLogs.stdout.split('\n').slice(-2)[0].split('T')[0]
                },
                systemStatus: systemctlStatus.stdout.trim()
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Get just the latest block
app.get('/health/block', async (req, res) => {
    try {
        const { stdout } = await execAsync('tail -n 2000 /var/log/redbelly/rbn_logs/rbbc_logs.log');

        // Look for 'Done processing block'
        const blockMatch = stdout.match(/Done processing block (\d+)/g);
        const latestBlock = blockMatch ?
            parseInt(blockMatch[blockMatch.length - 1].replace('Done processing block ', '')) :
            'Not found';

        res.json({ latestBlock });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get service status
// Get service status
app.get('/health/service', async (req, res) => {
    try {
        const [serviceStatus, processId, latestLogs] = await Promise.all([
            execAsync('systemctl is-active redbelly.service'),
            execAsync('pgrep rbbc'),
            execAsync('tail -n 2000 /var/log/redbelly/rbn_logs/rbbc_logs.log')
        ]);

        // Extract latest superblock number from logs
        const blockMatch = latestLogs.stdout.match(/Done processing block (\d+)/g);
        const latestBlock = blockMatch ?
            parseInt(blockMatch[blockMatch.length - 1].replace('Done processing block ', '')) :
            'Not found';

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: {
                name: 'redbelly.service',
                status: serviceStatus.stdout.trim(),
                pid: processId.stdout.trim()
            },
            metrics: {
                latestBlock: latestBlock
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get logs
app.get('/health/logs', async (req, res) => {
    try {
        const lines = req.query.lines || 1000;
        const { stdout } = await execAsync(`tail -n ${lines} /var/log/redbelly/rbn_logs/rbbc_logs.log`);
        res.json({
            timestamp: new Date().toISOString(),
            logs: stdout.split('\n')
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({
        message: 'Redbelly Node Health Check API',
        endpoints: {
            detailed: '/health/detailed',
            service: '/health/service',
            block: '/health/block',
            logs: '/health/logs?lines=2000'
        }
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Health check service running on http://0.0.0.0:${port}`);
});
