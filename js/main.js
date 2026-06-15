// Main application logic
import { initAuth } from './auth.js';
import { initDashboard } from './dashboard.js';
import { initChat } from './chat.js';
import { initDatabase } from './database.js';
import { startAgents } from './agents.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initDashboard();
    initChat();
    initDatabase();
    startAgents();
});