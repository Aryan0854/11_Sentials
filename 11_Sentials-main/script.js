// Dynamic Threat Simulation Frontend Client
let attacks = [];
let blockedIps = [];
let autoDefend = true;

const attackIcons = {
    'Port Scan': '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"/>',
    'Failed Login': '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    'SQL Injection': '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6" y2="6"></line><line x1="10" y1="6" x2="10" y2="6"></line>',
    'Unauthorized Access': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'Brute Force': '<path d="M2 12.5V2.5"/><path d="M7 2.5v10"/><path d="M12 2.5v10"/><path d="M17 2.5v10"/><path d="M22 2.5v10"/>',
    'Suspicious Activity': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
};

function getSeverityColor(severity) {
    const colors = {
        critical: '#f87171',
        high: '#fb923c',
        medium: '#facc15',
        low: '#60a5fa'
    };
    return colors[severity.toLowerCase()] || '#9ca3af';
}

function updateStats() {
    const stats = attacks.reduce((acc, attack) => {
        acc.total++;
        const sev = attack.severity.toLowerCase();
        if (acc[sev] !== undefined) {
            acc[sev]++;
        }
        return acc;
    }, { total: 0, critical: 0, high: 0, medium: 0, low: 0 });

    document.getElementById('total-incidents').textContent = stats.total;
    document.getElementById('critical-incidents').textContent = stats.critical;
    document.getElementById('high-incidents').textContent = stats.high;
    document.getElementById('medium-incidents').textContent = stats.medium;
    document.getElementById('low-incidents').textContent = stats.low;
}

function createIncidentCard(attack) {
    const card = document.createElement('div');
    card.className = 'incident-card';
    
    // Check if threat IP is in our blocked IPs list
    const isDefended = blockedIps.includes(attack.ip) && autoDefend;
    const shieldStatus = isDefended 
        ? `<span class="severity-badge" style="background-color: #10b981; color: white;">DEFENDED</span>`
        : `<span class="severity-badge" style="background-color: #ef4444; color: white;">ACTIVE</span>`;

    const iconPath = attackIcons[attack.type] || attackIcons['Suspicious Activity'];

    card.innerHTML = `
        <div class="incident-icon" style="color: ${getSeverityColor(attack.severity)}; background-color: rgba(255,255,255,0.02)">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${iconPath}
            </svg>
        </div>
        <div class="incident-content">
            <div class="incident-header">
                <h3 class="text-white">${attack.type}</h3>
                <span class="severity-badge" style="border: 1px solid ${getSeverityColor(attack.severity)}; color: ${getSeverityColor(attack.severity)}">${attack.severity.toUpperCase()}</span>
                ${shieldStatus}
            </div>
            <div class="incident-details">Source IP: <span class="font-mono text-white">${attack.ip}</span></div>
            <div class="incident-details">${attack.details}</div>
        </div>
        <div class="incident-time">${attack.timestamp}</div>
    `;
    
    return card;
}

function updateIncidentsFeed() {
    const feed = document.getElementById('incidents-feed');
    feed.innerHTML = '';
    
    if (attacks.length === 0) {
        feed.innerHTML = `<div class="text-center py-8 text-gray-500 font-medium">No live attack incidents detected</div>`;
        return;
    }

    attacks.forEach(attack => {
        feed.appendChild(createIncidentCard(attack));
    });
}

function updateBlockedIpsFeed() {
    const feed = document.getElementById('blocked-ips-feed');
    feed.innerHTML = '';

    if (blockedIps.length === 0) {
        feed.innerHTML = `<div class="text-center py-8 text-gray-500 font-medium">Firewall clean: No IPs blocked</div>`;
        return;
    }

    blockedIps.forEach(ip => {
        const div = document.createElement('div');
        div.className = 'incident-card border-l-4 border-emerald-500 bg-[#0e1614]';
        div.innerHTML = `
            <div class="incident-icon text-emerald-400">
                <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
            </div>
            <div class="incident-content">
                <h3 class="text-emerald-400 font-mono text-sm">${ip}</h3>
                <p class="text-xs text-gray-400 mt-1">Rule: Traffic filtered and dropped</p>
            </div>
            <span class="text-xs text-emerald-500 font-semibold font-mono">BLOCKED</span>
        `;
        feed.appendChild(div);
    });
}

// REST Client requests
let dbConnected = false;
let attackIntervalId = null;

async function checkDbStatus() {
    try {
        const response = await fetch('http://localhost:5000/db_status');
        const data = await response.json();
        dbConnected = data.connected;
        
        const btn = document.getElementById('launchAttackBtn');
        const banner = document.getElementById('db-warning-banner');
        
        // Always keep the button enabled and clickable
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        
        if (!dbConnected) {
            if (banner) {
                banner.classList.remove('hidden');
                banner.querySelector('span').innerHTML = `Note: Attack simulation is running in mock mode. Connect a database in the <a href="../index.html" style="color: #c084fc; text-decoration: underline; font-weight: 600;">Command Center</a> to record events to SQL.`;
                banner.style.background = "rgba(168, 85, 247, 0.08)";
                banner.style.borderColor = "rgba(168, 85, 247, 0.2)";
                banner.querySelector('.banner-icon').style.color = "#c084fc";
            }
        } else {
            if (banner) banner.classList.add('hidden');
        }
    } catch (e) {
        console.error("Error checking database connection status:", e);
    }
}

async function fetchBlockedIps() {
    try {
        const response = await fetch('http://localhost:5000/blocked_ips');
        const data = await response.json();
        blockedIps = data.blocked_ips || [];
        autoDefend = data.auto_defend;
        updateBlockedIpsFeed();
        updateIncidentsFeed(); // Refresh statuses
        updateDefenseButtonUI();
    } catch (e) {
        console.error("Error fetching blocked IPs from Flask:", e);
    }
}

async function toggleAttackSimulation() {
    const btn = document.getElementById('launchAttackBtn');
    if (!btn) return;

    // Run status check, but don't block simulation
    await checkDbStatus();

    if (attackIntervalId === null) {
        // Start continuous attacks
        triggerAttack(); // Launch first one immediately
        attackIntervalId = setInterval(triggerAttack, 2500); // Spawn every 2.5 seconds
        
        btn.innerHTML = `
            <span class="flex h-2 w-2 relative mr-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Stop Attack Simulation
        `;
        btn.style.background = "linear-gradient(to right, #dc2626, #991b1b)";
    } else {
        // Stop continuous attacks
        clearInterval(attackIntervalId);
        attackIntervalId = null;
        
        btn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Launch Live Threat Attack
        `;
        btn.style.background = "linear-gradient(to right, #ef4444, #b91c1c)";
    }
}

async function triggerAttack() {

    try {
        const response = await fetch('http://localhost:5000/launch_attack', {
            method: 'POST'
        });
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || "Server error");
        }
        console.log("Attack launched successfully:", result);
    } catch (e) {
        console.error("Failed to trigger attack:", e);
        // Clear interval on server offline to avoid infinite alerts
        if (attackIntervalId !== null) {
            clearInterval(attackIntervalId);
            attackIntervalId = null;
            const btn = document.getElementById('launchAttackBtn');
            if (btn) {
                btn.innerHTML = `
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    Launch Live Threat Attack
                `;
                btn.style.background = "linear-gradient(to right, #ef4444, #b91c1c)";
            }
        }
        alert(`Failed to connect to attack server: ${e.message}`);
    }
}

async function toggleDefense() {
    try {
        const response = await fetch('http://localhost:5000/toggle_defense', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ enabled: !autoDefend })
        });
        const result = await response.json();
        autoDefend = result.auto_defend;
        updateDefenseButtonUI();
        updateIncidentsFeed(); // Update shield indicators
    } catch (e) {
        console.error("Error toggling defense rules:", e);
    }
}

function updateDefenseButtonUI() {
    const btn = document.getElementById('toggleDefenseBtn');
    if (!btn) return;
    
    if (autoDefend) {
        btn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Defense Shield: ENABLED
        `;
        btn.className = "sim-btn defense-btn-active";
    } else {
        btn.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Defense Shield: DISABLED
        `;
        btn.className = "sim-btn defense-btn-disabled";
    }
}

// WebSocket connection to broadcast agent
function initWebsocket() {
    const ws = new WebSocket('ws://localhost:8765');
    const monitoringText = document.getElementById('monitoring-text');

    ws.addEventListener('open', () => {
        console.log('Incident Console connected to Agent WebSocket');
        if (monitoringText) {
            monitoringText.textContent = "Live Stream Connected";
            monitoringText.parentElement.style.borderColor = "rgba(16, 185, 129, 0.4)";
        }
    });

    ws.addEventListener('message', (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Format incoming payload
            const newAttack = {
                id: Date.now(),
                type: data.type || "Suspicious Activity",
                ip: data.ip || "127.0.0.1",
                details: data.details || "No details provided",
                severity: data.severity || "medium",
                timestamp: new Date(data.timestamp || Date.now()).toLocaleTimeString()
            };

            // Prepend to list
            attacks = [newAttack, ...attacks].slice(0, 30);
            updateStats();
            updateIncidentsFeed();
            
            // Automatically refresh blocks list
            fetchBlockedIps();
        } catch (e) {
            console.error("Error parsing WebSocket packet:", e);
        }
    });

    ws.addEventListener('close', () => {
        console.warn('WebSocket connection lost. Retrying in 4 seconds...');
        if (monitoringText) {
            monitoringText.textContent = "Stream Offline (Retrying)";
            monitoringText.parentElement.style.borderColor = "rgba(239, 68, 68, 0.4)";
            monitoringText.parentElement.style.color = "#f87171";
        }
        setTimeout(initWebsocket, 4000);
    });
}

// Initialize components
function init() {
    updateIncidentsFeed();
    checkDbStatus(); // Initial db status verification
    fetchBlockedIps();
    initWebsocket();

    // Bind controls
    document.getElementById('launchAttackBtn').addEventListener('click', toggleAttackSimulation);
    document.getElementById('toggleDefenseBtn').addEventListener('click', toggleDefense);

    // Poll blocked list and database connection status occasionally
    setInterval(fetchBlockedIps, 5000);
    setInterval(checkDbStatus, 3000);
}

document.addEventListener('DOMContentLoaded', init);