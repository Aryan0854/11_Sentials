import React, { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Shield, MessageSquare } from 'lucide-react';
import { SecurityAlert, ResourceMetrics } from '../types';
import { supabase } from '../lib/supabase';

function Dashboard() {
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<ResourceMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    networkUsage: 0,
    costEstimate: 0
  });
  const [systemHealth, setSystemHealth] = useState({ status: 'Good', score: 100 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      // Fetch latest resource metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('resource_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (metricsError) throw metricsError;
      
      if (metricsData && metricsData.length > 0) {
        setMetrics({
          cpuUsage: metricsData[0].cpu_usage,
          memoryUsage: metricsData[0].memory_usage,
          networkUsage: metricsData[0].network_usage,
          costEstimate: metricsData[0].cost_estimate
        });
      }

      // Fetch active alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .order('timestamp', { ascending: false });

      if (alertsError) throw alertsError;

      if (alertsData) {
        setAlerts(alertsData.map(alert => ({
          message: alert.message,
          source: alert.source,
          status: alert.status,
          timestamp: new Date(alert.timestamp).toLocaleTimeString()
        })));
      }

      // Fetch system health
      const { data: healthData, error: healthError } = await supabase
        .from('system_health')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (healthError) throw healthError;

      if (healthData && healthData.length > 0) {
        setSystemHealth({
          status: healthData[0].status,
          score: healthData[0].score
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, newMessage]);
      setNewMessage('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <h3 className="ml-2 text-lg font-medium">Active Alerts</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">{alerts.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-blue-500" />
            <h3 className="ml-2 text-lg font-medium">Resource Usage</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">{metrics.cpuUsage}%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-500" />
            <h3 className="ml-2 text-lg font-medium">System Health</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">{systemHealth.status}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-500" />
            <h3 className="ml-2 text-lg font-medium">Security Score</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">{systemHealth.score}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
          <h3 className="text-lg font-medium mb-4">Security Alerts</h3>
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-red-800">{alert.message}</p>
                    <span className="text-sm text-red-700">{alert.timestamp}</span>
                  </div>
                  <p className="mt-1 text-sm text-red-700">{alert.source}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No active security alerts
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
          <h3 className="text-lg font-medium mb-4">Resource Utilization</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span>CPU Usage</span>
                <span>{metrics.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.cpuUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Memory Usage</span>
                <span>{metrics.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Network Usage</span>
                <span>{metrics.networkUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.networkUsage}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Cost Estimate: ${metrics.costEstimate.toFixed(2)}/month
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {showChat && (
        <div className="fixed bottom-24 right-8 w-96 bg-white rounded-lg shadow-xl">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium">Sentinal Assistant</h3>
          </div>
          <div className="h-96 overflow-y-auto p-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className="mb-4">
                <p className="bg-gray-100 p-3 rounded-lg inline-block">{msg}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type your message..."
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transform transition-all hover:-translate-y-0.5"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Dashboard;