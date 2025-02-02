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
        status: 'Good',
        score: 100
    }
};

export function startAgents() {
    // Fetch system data periodically from the Flask server
    setInterval(async () => {
        try {
            const response = await fetch('http://localhost:3000/system_info');  // Ensure correct URL and port
            const data = await response.json();
            updateData(data);
        } catch (error) {
            console.error('Error fetching system data:', error);
            // Handle the case where Flask backend is not available
            simulateData();  // Simulated data for fallback
        }
    }, 5000);
}

function updateData(data) {
    // Analyze the CPU usage and determine system health
    const cpuUsage = data.cpu_percent;
    let cpuHealth = 'Healthy';
    if (cpuUsage > 85) {
        cpuHealth = 'Critical';
    } else if (cpuUsage > 60) {
        cpuHealth = 'Warning';
    }

    // Analyze memory usage
    const memoryUsage = data.memory_percent;
    let memoryHealth = 'Healthy';
    if (memoryUsage > 85) {
        memoryHealth = 'Critical';
    } else if (memoryUsage > 70) {
        memoryHealth = 'Warning';
    }

    // Analyze disk usage
    const diskUsage = data.disk_percent;
    let diskHealth = 'Healthy';
    if (diskUsage > 85) {
        diskHealth = 'Critical';
    } else if (diskUsage > 70) {
        diskHealth = 'Warning';
    }

    // Network usage
    const networkUsage = (data.bytes_sent + data.bytes_recv) / 1024 / 1024;  // Convert bytes to MB
    let networkHealth = 'Healthy';
    if (networkUsage > 500) {  // Assuming 500MB as a threshold for high network activity
        networkHealth = 'Warning';
    }

    // Identify any heavy processes consuming too much CPU
    const heavyProcesses = data.heavy_processes;
    let processHealth = 'Good';
    if (heavyProcesses.length > 0) {
        processHealth = 'Warning';
    }

    // Display the analysis results
    console.log(`CPU Usage: ${cpuUsage}% (${cpuHealth})`);
    console.log(`Memory Usage: ${memoryUsage}% (${memoryHealth})`);
    console.log(`Disk Usage: ${diskUsage}% (${diskHealth})`);
    console.log(`Network Usage: ${networkUsage.toFixed(2)} MB (${networkHealth})`);
    if (heavyProcesses.length > 0) {
        console.log('Heavy Processes Detected:');
        heavyProcesses.forEach(process => {
            console.log(process);
        });
    } else {
        console.log('No heavy processes detected.');
    }

    // You can further integrate this analysis into a UI, e.g., update graphs or send alerts if necessary
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
