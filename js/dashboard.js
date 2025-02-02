// Dashboard module
import { getMetrics, getAlerts, getSystemHealth } from './agents.js';

export function initDashboard() {
    const metricsGrid = document.getElementById('metricsGrid');
    const alertsList = document.getElementById('alertsList');
    const resourceMetrics = document.getElementById('resourceMetrics');

    let activeAlertsCounter = 0;  // Start the counter from 0

    // Update the counter to 5 after 30 seconds
    setTimeout(() => {
        activeAlertsCounter = 5;
        updateDashboard(); // Update the dashboard when counter changes
    }, 30000);

    function updateDashboard() {
        updateMetricsCards();
        updateAlerts();
        updateResourceUtilization();
    }

    async function updateMetricsCards() {
        const metrics = await getMetrics();
        const health = await getSystemHealth();
        
        // Determine System Health based on resource usage
        let systemHealthStatus = '';
        let securityScore = 0;

        if (metrics.cpuUsage >= 0 && metrics.cpuUsage <= 30) {
            systemHealthStatus = 'Very Good';
            securityScore = 100;
        } else if (metrics.cpuUsage > 30 && metrics.cpuUsage <= 50) {
            systemHealthStatus = 'Good';
            securityScore = 80;
        } else if (metrics.cpuUsage > 50 && metrics.cpuUsage <= 70) {
            systemHealthStatus = 'Average';
            securityScore = 60;
        } else if (metrics.cpuUsage > 70 && metrics.cpuUsage <= 80) {
            systemHealthStatus = 'Bad';
            securityScore = 40;
        } else if (metrics.cpuUsage > 80 && metrics.cpuUsage <= 100) {
            systemHealthStatus = 'Very Bad';
            securityScore = 20;
        }

        metricsGrid.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center">
                    <svg class="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <h3 class="ml-2 text-lg font-medium">Active Alerts</h3>
                </div>
                <p class="mt-2 text-3xl font-bold">${activeAlertsCounter}</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center">
                    <svg class="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    <h3 class="ml-2 text-lg font-medium">Resource Usage</h3>
                </div>
                <p class="mt-2 text-3xl font-bold">${metrics.cpuUsage}%</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center">
                    <svg class="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <h3 class="ml-2 text-lg font-medium">System Health</h3>
                </div>
                <p class="mt-2 text-3xl font-bold">${systemHealthStatus}</p>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="flex items-center">
                    <svg class="h-8 w-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <h3 class="ml-2 text-lg font-medium">Security Score</h3>
                </div>
                <p class="mt-2 text-3xl font-bold">${securityScore}</p>
            </div>
        `;
    }


    async function updateAlerts() {
        const alerts = await getAlerts();
        
        if (alerts.length === 0) {
            alertsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    No active security alerts
                </div>
            `;
            return;
        }

        alertsList.innerHTML = alerts.map(alert => `
            <div class="border-l-4 border-red-500 bg-red-50 p-4">
                <div class="flex justify-between">
                    <p class="text-sm font-medium text-red-800">${alert.message}</p>
                    <span class="text-sm text-red-700">${alert.timestamp}</span>
                </div>
                <p class="mt-1 text-sm text-red-700">${alert.source}</p>
            </div>
        `).join('');
    }

    async function updateResourceUtilization() {
        const metrics = await getMetrics();
        
        // Delay CPU usage display by 5 seconds
        setTimeout(() => {
            // Generate a random CPU usage between 68% and 87%
            metrics.cpuUsage = Math.floor(Math.random() * (87 - 68 + 1)) + 68;
    
            resourceMetrics.innerHTML = `
                <div>
                    <div class="flex justify-between mb-1">
                        <span>CPU Usage</span>
                        <span>${metrics.cpuUsage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                             style="width: ${metrics.cpuUsage}%"></div>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between mb-1">
                        <span>Memory Usage</span>
                        <span>${metrics.memoryUsage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full transition-all duration-500"
                             style="width: ${metrics.memoryUsage}%"></div>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between mb-1">
                        <span>Network Usage</span>
                        <span>${metrics.networkUsage}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-purple-600 h-2 rounded-full transition-all duration-500"
                             style="width: ${metrics.networkUsage}%"></div>
                    </div>
                </div>
                <div class="mt-4">
                    <p class="text-sm text-gray-600">
                        Cost Estimate: $${metrics.costEstimate.toFixed(2)}/month
                    </p>
                </div>
            `;
        }, 30000);  // Delay for 5 seconds
    }
    
    // Start incrementing the active alerts counter after 30 seconds
    setTimeout(() => {
        setInterval(() => {
            if (activeAlertsCounter < 50) {
                activeAlertsCounter++;
                updateMetricsCards();  // To update the counter display
            }
        }, 5000);  // Increment every 1 second
    }, 30000);  // Start the counter after 30 seconds

    // Initial dashboard update
    updateDashboard();
    setInterval(updateDashboard, 30000); // Update the dashboard every 30 seconds
}
