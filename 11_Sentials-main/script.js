// Sample attack data
const sampleAttacks = [
    {
        id: 1,
        type: 'Port Scan',
        ip: '185.220.101.45',
        details: 'Scanning ports 22, 80, 443',
        timestamp: new Date().toISOString(),
        severity: 'medium'
    },
    {
        id: 2,
        type: 'Failed Login',
        ip: '45.155.205.233',
        details: 'Failed login attempt',
        timestamp: new Date().toISOString(),
        severity: 'low'
    },
    {
        id: 3,
        type: 'Unauthorized Access',
        ip: '10.0.0.5',
        details: 'user=root',
        timestamp: new Date().toISOString(),
        severity: 'high'
    },
    {
        id: 4,
        type: 'SQL Injection',
        ip: '192.168.1.101',
        details: "Payload: ' OR 1=1 --",
        timestamp: new Date().toISOString(),
        severity: 'critical'
    },
    {
        id: 5,
        type: 'Brute Force',
        ip: '185.220.101.45',
        details: 'Multiple failed login attempts',
        timestamp: new Date().toISOString(),
        severity: 'high'
    }
];

// Attack type icons (SVG paths)
const attackIcons = {
    'Port Scan': '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"/>',
    'Failed Login': '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    'Unauthorized Access': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'SQL Injection': '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6" y2="6"></line><line x1="10" y1="6" x2="10" y2="6"></line>',
    'Brute Force': '<path d="M2 12.5V2.5"/>><path d="M7 2.5v10"/><path d="M12 2.5v10"/><path d="M17 2.5v10"/><path d="M22 2.5v10"/>'
};

let attacks = [...sampleAttacks];
let stats = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
};

// Helper functions
function getSeverityColor(severity) {
    const colors = {
        critical: '#EF4444',
        high: '#F97316',
        medium: '#EAB308',
        low: '#3B82F6'
    };
    return colors[severity] || '#6B7280';
}

function generateAttack() {
    const types = Object.keys(attackIcons);
    const severities = ['low', 'medium', 'high', 'critical'];
    const ips = ['185.220.101.45', '45.155.205.233', '10.0.0.5', '192.168.1.101', '203.0.113.45'];
    
    return {
        id: Date.now(),
        type: types[Math.floor(Math.random() * types.length)],
        ip: ips[Math.floor(Math.random() * ips.length)],
        details: 'New attack detected',
        timestamp: new Date().toISOString(),
        severity: severities[Math.floor(Math.random() * severities.length)]
    };
}

function updateStats() {
    stats = attacks.reduce((acc, attack) => {
        acc.total++;
        acc[attack.severity]++;
        return acc;
    }, { total: 0, critical: 0, high: 0, medium: 0, low: 0 });

    // Update stats in DOM
    document.getElementById('total-incidents').textContent = stats.total;
    document.getElementById('critical-incidents').textContent = stats.critical;
    document.getElementById('high-incidents').textContent = stats.high;
    document.getElementById('medium-incidents').textContent = stats.medium;
    document.getElementById('low-incidents').textContent = stats.low;
}

function createIncidentCard(attack) {
    const card = document.createElement('div');
    card.className = 'incident-card';
    
    card.innerHTML = `
        <div class="incident-icon" style="color: ${getSeverityColor(attack.severity)}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${attackIcons[attack.type]}
            </svg>
        </div>
        <div class="incident-content">
            <div class="incident-header">
                <span class="incident-type">${attack.type}</span>
                <span class="severity-badge" style="background-color: ${getSeverityColor(attack.severity)}">${attack.severity.toUpperCase()}</span>
            </div>
            <div class="incident-details">IP: ${attack.ip}</div>
            <div class="incident-details">${attack.details}</div>
        </div>
        <div class="incident-time">${new Date(attack.timestamp).toLocaleTimeString()}</div>
    `;
    
    return card;
}

function updateIncidentsFeed() {
    const feed = document.getElementById('incidents-feed');
    feed.innerHTML = '';
    attacks.forEach(attack => {
        feed.appendChild(createIncidentCard(attack));
    });
}

// WebSocket connection
const socket = new WebSocket('ws://localhost:8765');

socket.addEventListener('open', function (event) {
    console.log('Connected to WebSocket server');
});

socket.addEventListener('message', function (event) {
    const newAttack = JSON.parse(event.data);
    attacks = [newAttack, ...attacks].slice(0, 50); // Keep last 50 attacks
    updateStats();
    updateIncidentsFeed();
});

socket.addEventListener('close', function (event) {
    console.log('Disconnected from WebSocket server');
});

// Initialize the dashboard
function init() {
    updateStats();
    updateIncidentsFeed();

    // Start generating new attacks
    setInterval(() => {
        const newAttack = generateAttack();
        attacks = [newAttack, ...attacks].slice(0, 50); // Keep last 50 attacks
        updateStats();
        updateIncidentsFeed();
    }, 5000);
}

// Start the dashboard when the page loads
document.addEventListener('DOMContentLoaded', init);