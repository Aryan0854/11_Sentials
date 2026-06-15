import { showDatabaseStats } from './dashboard.js';

export function initDatabase() {
    const connectDbBtn = document.getElementById('connectDbBtn');
    const dbModal = document.getElementById('dbModal');

    connectDbBtn.addEventListener('click', showDatabaseModal);
    
    // Check initial db status on load
    checkInitialDbStatus();

    function showDatabaseModal() {
        dbModal.classList.remove('hidden');
        dbModal.innerHTML = `
            <div class="bg-[#0d0e15]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full relative shadow-2xl text-white">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold tracking-tight">Connect Database</h2>
                    <button onclick="document.getElementById('dbModal').classList.add('hidden')" class="text-gray-400 hover:text-white transition-colors">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <form id="dbForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Database Type</label>
                        <select id="dbType" class="mt-1 block w-full px-3 py-2 bg-gray-900/60 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all">
                            <option value="mysql">MySQL</option>
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mongodb">MongoDB</option>
                            <option value="sqlite">SQLite (Local File)</option>
                            <option value="firebase">Firebase</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-300">Host</label>
                        <input type="text" id="dbHost" class="mt-1 block w-full px-3 py-2 bg-gray-900/60 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all" placeholder="e.g., 127.0.0.1 or db.example.com">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-300">Port</label>
                        <input type="number" id="dbPort" class="mt-1 block w-full px-3 py-2 bg-gray-900/60 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all" placeholder="e.g., 3306 or 5432">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-300">Database Name / Path</label>
                        <input type="text" id="dbName" required class="mt-1 block w-full px-3 py-2 bg-gray-900/60 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all" placeholder="e.g., main_db or sentinel.db">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-300">Username</label>
                        <input type="text" id="dbUsername" class="mt-1 block w-full px-3 py-2 bg-gray-900/60 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-300">Password</label>
                        <input type="password" id="dbPassword" class="mt-1 block w-full px-3 py-2 bg-gray-900/60 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all">
                    </div>

                    <button type="submit" class="w-full flex justify-center py-3 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-purple-500/20 transform transition duration-200 hover:-translate-y-0.5">
                        Connect Database
                    </button>
                </form>

                <!-- Loading Overlay -->
                <div id="loadingOverlay" class="absolute inset-0 bg-[#06070a]/70 backdrop-blur-sm flex justify-center items-center hidden rounded-2xl">
                    <div class="bg-[#0d0e15] border border-white/10 p-5 rounded-xl flex items-center space-x-3 text-white shadow-2xl">
                        <svg class="animate-spin h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0h-2a6 6 0 00-12 0H4z"></path>
                        </svg>
                        <span class="text-sm font-semibold">Testing Connection...</span>
                    </div>
                </div>
            </div>
        `;

        const dbForm = document.getElementById('dbForm');
        dbForm.addEventListener('submit', handleDatabaseConnection);
    }

    async function handleDatabaseConnection(e) {
        e.preventDefault();
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.remove('hidden');

        const formData = {
            type: document.getElementById('dbType').value,
            host: document.getElementById('dbHost').value,
            port: document.getElementById('dbPort').value,
            database: document.getElementById('dbName').value,
            username: document.getElementById('dbUsername').value,
            password: document.getElementById('dbPassword').value
        };

        try {
            const response = await fetch('http://localhost:5000/connect_db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Connection failed');
            }

            // Connection succeeded! Show dashboard stats and alert user
            showDatabaseStats(result);
            alert('Database connected successfully!');
            dbModal.classList.add('hidden');
        } catch (error) {
            alert(`Database Connection Failed:\n${error.message}`);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }
}

async function checkInitialDbStatus() {
    try {
        const response = await fetch('http://localhost:5000/db_status');
        const data = await response.json();
        if (data.connected) {
            showDatabaseStats(data.db);
        }
    } catch (error) {
        console.warn('Failed to fetch initial database status:', error);
    }
}
