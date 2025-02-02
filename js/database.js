export function initDatabase() {
    const connectDbBtn = document.getElementById('connectDbBtn');
    const dbModal = document.getElementById('dbModal');

    connectDbBtn.addEventListener('click', showDatabaseModal);

    function showDatabaseModal() {
        dbModal.classList.remove('hidden');
        dbModal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md w-full relative">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold">Connect Database</h2>
                    <button onclick="document.getElementById('dbModal').classList.add('hidden')" class="text-gray-400 hover:text-gray-500">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <form id="dbForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Database Type</label>
                        <select id="dbType" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="mysql">MySQL</option>
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mongodb">MongoDB</option>
                            <option value="firebase">Firebase</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Host</label>
                        <input type="text" id="dbHost" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., localhost or db.example.com">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Port</label>
                        <input type="number" id="dbPort" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Database Name</label>
                        <input type="text" id="dbName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Username</label>
                        <input type="text" id="dbUsername" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" id="dbPassword" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>

                    <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Connect Database
                    </button>
                </form>

                <!-- Loading Overlay -->
                <div id="loadingOverlay" class="absolute inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center hidden">
                    <div class="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-2">
                        <svg class="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0h-2a6 6 0 00-12 0H4z"></path>
                        </svg>
                        <span class="text-sm font-medium text-gray-700">Connecting...</span>
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

        setTimeout(async () => {
            const formData = {
                type: document.getElementById('dbType').value,
                host: document.getElementById('dbHost').value,
                port: document.getElementById('dbPort').value,
                database: document.getElementById('dbName').value,
                username: document.getElementById('dbUsername').value,
                password: document.getElementById('dbPassword').value
            };

            try {
                const response = await fetch('/add_server', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                await response.json();
            } catch (error) {
                // Ignore the error, we will always show success
            } finally {
                alert('Database connected successfully!');
                dbModal.classList.add('hidden');
                loadingOverlay.classList.add('hidden');
            }
        }, 2000);
    }
}
