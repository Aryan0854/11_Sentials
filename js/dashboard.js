// Dashboard module
import { getMetrics, getAlerts, getSystemHealth } from './agents.js';

export function initDashboard() {
    const metricsGrid = document.getElementById('metricsGrid');
    const alertsList = document.getElementById('alertsList');
    const resourceMetrics = document.getElementById('resourceMetrics');

    async function updateDashboard() {
        updateMetricsCards();
        updateAlerts();
        updateResourceUtilization();

        try {
            const response = await fetch('http://localhost:5000/db_status');
            const data = await response.json();
            if (data.connected) {
                showDatabaseStats(data.db);
            }
        } catch (error) {
            // Silence console error on server offline
        }
    }

    async function updateMetricsCards() {
        if (!metricsGrid) return;
        
        const metrics = await getMetrics();
        const health = await getSystemHealth();
        
        // Use real values updated by the agents loop
        const cpuUsage = metrics.cpuUsage || 0;
        const activeAlerts = metrics.activeAlerts || 0;
        const systemHealthStatus = health.status || 'Very Good';
        const securityScore = health.score || 100;

        metricsGrid.innerHTML = `
            <div class="bg-[#0d0e15]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-red-500/20 flex flex-col justify-between">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-gray-400">Active Alerts</h3>
                    <span class="p-2 bg-red-500/10 rounded-lg text-red-500">
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </span>
                </div>
                <p class="mt-4 text-3xl font-extrabold text-white tracking-tight">${activeAlerts}</p>
            </div>

            <div class="bg-[#0d0e15]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/20 flex flex-col justify-between">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-gray-400">Resource Usage</h3>
                    <span class="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                    </span>
                </div>
                <p class="mt-4 text-3xl font-extrabold text-white tracking-tight">${cpuUsage}%</p>
            </div>

            <div class="bg-[#0d0e15]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-green-500/20 flex flex-col justify-between">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-gray-400">System Health</h3>
                    <span class="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </span>
                </div>
                <p class="mt-4 text-3xl font-extrabold text-white tracking-tight">${systemHealthStatus}</p>
            </div>

            <div class="bg-[#0d0e15]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/20 flex flex-col justify-between">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-gray-400">Security Score</h3>
                    <span class="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </span>
                </div>
                <p class="mt-4 text-3xl font-extrabold text-white tracking-tight">${securityScore}</p>
            </div>
        `;
    }

    async function updateAlerts() {
        if (!alertsList) return;
        const alerts = await getAlerts();
        
        if (alerts.length === 0) {
            alertsList.innerHTML = `
                <div class="text-center py-8 text-gray-500 font-medium">
                    No active security alerts
                </div>
            `;
            return;
        }

        alertsList.innerHTML = alerts.map(alert => `
            <div class="border-l-4 border-red-500 bg-[#181216] border border-white/5 p-4 rounded-r-xl">
                <div class="flex justify-between">
                    <p class="text-sm font-semibold text-red-400">${alert.message}</p>
                    <span class="text-xs text-red-500/80 font-mono">${alert.timestamp}</span>
                </div>
                <p class="mt-1 text-xs text-gray-400 font-mono">${alert.source}</p>
            </div>
        `).join('');
    }

    async function updateResourceUtilization() {
        if (!resourceMetrics) return;
        const metrics = await getMetrics();
        
        resourceMetrics.innerHTML = `
            <div class="space-y-4">
                <div>
                    <div class="flex justify-between mb-1 text-sm font-semibold">
                        <span>CPU Usage</span>
                        <span class="text-blue-400 font-mono">${metrics.cpuUsage}%</span>
                    </div>
                    <div class="w-full bg-white/5 rounded-full h-2">
                        <div class="bg-blue-500 h-2 rounded-full transition-all duration-500"
                             style="width: ${metrics.cpuUsage}%"></div>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between mb-1 text-sm font-semibold">
                        <span>Memory Usage</span>
                        <span class="text-emerald-400 font-mono">${metrics.memoryUsage}%</span>
                    </div>
                    <div class="w-full bg-white/5 rounded-full h-2">
                        <div class="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                             style="width: ${metrics.memoryUsage}%"></div>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between mb-1 text-sm font-semibold">
                        <span>Network Usage</span>
                        <span class="text-purple-400 font-mono">${metrics.networkUsage}%</span>
                    </div>
                    <div class="w-full bg-white/5 rounded-full h-2">
                        <div class="bg-purple-500 h-2 rounded-full transition-all duration-500"
                             style="width: ${metrics.networkUsage}%"></div>
                    </div>
                </div>
                <div class="mt-4 pt-2 border-t border-white/5">
                    <p class="text-xs text-gray-400 font-mono">
                        Cost Estimate: <span class="text-white font-semibold">$${metrics.costEstimate.toFixed(2)}/month</span>
                    </p>
                </div>
            </div>
        `;
    }

    // Initial dashboard update
    updateDashboard();
    setInterval(updateDashboard, 2000); // Update metrics dynamically every 2 seconds
}

export function showDatabaseStats(dbStats) {
    const container = document.getElementById('dbAnalyticsContainer');
    const noDbPlaceholder = document.getElementById('noDbPlaceholder');
    const dashboardContent = document.getElementById('dashboardContent');

    if (noDbPlaceholder) {
        noDbPlaceholder.classList.add('hidden');
    }
    if (dashboardContent) {
        dashboardContent.classList.remove('hidden');
        setTimeout(() => {
            dashboardContent.classList.remove('opacity-0');
        }, 50);
    }
    if (!container) return;

    // Reveal container
    container.classList.remove('hidden');

    container.innerHTML = `
        <div class="bg-[#0d0e15]/60 backdrop-blur-md border border-purple-500/20 rounded-2xl p-6 shadow-2xl hover:border-purple-500/35 transition-all duration-300">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-white/5">
                <div>
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <span class="flex h-2 w-2 relative">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        Database Analytics Dashboard
                    </h3>
                    <p class="text-xs text-gray-400 mt-1">Real-time statistics for connected resource: <span class="text-purple-400 font-semibold font-mono">${dbStats.database}</span></p>
                </div>
                <div class="mt-2 md:mt-0 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400 font-bold uppercase tracking-wider">
                    ${dbStats.type}
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col">
                    <span class="text-xs text-gray-400 font-semibold mb-1">Host & Port</span>
                    <span class="text-sm font-bold text-white font-mono truncate">${dbStats.host}:${dbStats.port}</span>
                </div>
                <div class="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col">
                    <span class="text-xs text-gray-400 font-semibold mb-1">Latency</span>
                    <span class="text-sm font-bold text-emerald-400 font-mono">${dbStats.latency_ms} ms</span>
                </div>
                <div class="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col">
                    <span class="text-xs text-gray-400 font-semibold mb-1">Active Connections</span>
                    <span class="text-sm font-bold text-blue-400 font-mono">${dbStats.active_connections}</span>
                </div>
                <div class="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col">
                    <span class="text-xs text-gray-400 font-semibold mb-1">Tables Count</span>
                    <span class="text-sm font-bold text-purple-400 font-mono">${dbStats.tables_count}</span>
                </div>
                <div class="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col">
                    <span class="text-xs text-gray-400 font-semibold mb-1">Data Size</span>
                    <span class="text-sm font-bold text-yellow-400 font-mono">${dbStats.db_size_mb} MB</span>
                </div>
            </div>
        </div>
    `;

    // Also update the Connect Database button in the nav bar to show Connected badge!
    const connectDbBtn = document.getElementById('connectDbBtn');
    if (connectDbBtn) {
        connectDbBtn.innerHTML = `
            <span class="flex h-2 w-2 relative mr-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            DB: Connected
        `;
        connectDbBtn.className = "flex items-center px-4 py-2 text-sm font-semibold text-white bg-emerald-500/10 border border-emerald-500/30 rounded-lg shadow-lg shadow-emerald-500/5";
    }
}
