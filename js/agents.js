// AI Agents interface
let systemData = {
    metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        networkUsage: 0,
        costEstimate: 0,
        activeAlerts: 0
    },
    alerts: [],
    health: {
        status: 'Very Good',
        score: 100
    }
};

export function startAgents() {
    // Fetch system data periodically from the Flask server on port 5000
    const fetchData = async () => {
        try {
            const response = await fetch('http://localhost:5000/system_info');
            const data = await response.json();
            updateData(data);
        } catch (error) {
            console.warn('Flask backend offline, using simulated fallback data.', error);
            simulateData();
        }
    };

    fetchData(); // Initial load
    setInterval(fetchData, 3000); // Poll every 3 seconds
}

function updateData(data) {
    const cpuUsage = Math.round(data.cpu_percent);
    const memoryUsage = Math.round(data.memory_percent);
    const diskUsage = Math.round(data.disk_percent);
    
    // Network usage calculation
    const totalBytes = (data.bytes_sent || 0) + (data.bytes_recv || 0);
    // Convert bytes to percentage assuming a 100Mbps (12.5MB/s) threshold
    const networkUsage = Math.min(100, Math.round((totalBytes / (12.5 * 1024 * 1024)) * 100)) || 12;
    
    // Dynamic monthly cost estimate based on usage
    const costEstimate = 19.99 + (cpuUsage * 0.25) + (memoryUsage * 0.35);

    // Update global state metrics
    systemData.metrics = {
        cpuUsage,
        memoryUsage,
        networkUsage,
        costEstimate,
        activeAlerts: systemData.alerts.length
    };

    // Calculate system health score
    let score = 100;
    if (cpuUsage > 75) score -= (cpuUsage - 75) * 1.5;
    if (memoryUsage > 80) score -= (memoryUsage - 80) * 1.5;
    score = Math.max(10, Math.round(score));
    
    let status = 'Very Good';
    if (score < 40) status = 'Very Bad';
    else if (score < 60) status = 'Bad';
    else if (score < 80) status = 'Average';
    else if (score < 95) status = 'Good';

    systemData.health = {
        status,
        score
    };

    // Generate real-time alerts based on resource thresholds
    const newAlerts = [];
    if (cpuUsage > 80) {
        newAlerts.push({
            message: `High CPU usage detected: ${cpuUsage}%`,
            source: 'CPU Core Monitor Agent',
            timestamp: new Date().toLocaleTimeString(),
            status: 'critical'
        });
    }
    if (memoryUsage > 85) {
        newAlerts.push({
            message: `RAM exhaustion threshold crossed: ${memoryUsage}%`,
            source: 'Memory Allocator Monitor',
            timestamp: new Date().toLocaleTimeString(),
            status: 'critical'
        });
    }

    if (newAlerts.length > 0) {
        // Prepend new alerts and limit feed to latest 5 items
        systemData.alerts = [...newAlerts, ...systemData.alerts].slice(0, 5);
        systemData.metrics.activeAlerts = systemData.alerts.length;
    }
}

function simulateData() {
    // Generate realistic fluctuating mock data as a robust fallback
    const cpu = Math.floor(Math.random() * 20) + 15; // 15% - 35%
    const ram = Math.floor(Math.random() * 10) + 45; // 45% - 55%
    const disk = 58;
    const net = Math.floor(Math.random() * 15) + 2; // MBs
    
    updateData({
        cpu_percent: cpu,
        memory_percent: ram,
        disk_percent: disk,
        bytes_sent: net * 1024 * 1024 * 0.45,
        bytes_recv: net * 1024 * 1024 * 0.55
    });
}

export async function getMetrics() {
    return systemData.metrics;
}

export async function getAlerts() {
    return systemData.alerts;
}

export async function getSystemHealth() {
    return systemData.health;
}
