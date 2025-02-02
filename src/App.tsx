import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shield, Activity, Database } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DatabaseConnect from './components/DatabaseConnect';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && (
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-indigo-600" />
                  <span className="ml-2 text-xl font-semibold">Sentinal</span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowDatabaseModal(true)}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Connect Database
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <Routes>
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? 
              <Login onLogin={() => setIsAuthenticated(true)} /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard /> : 
              <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>

        {showDatabaseModal && (
          <DatabaseConnect onClose={() => setShowDatabaseModal(false)} />
        )}
      </div>
    </Router>
  );
}

export default App;