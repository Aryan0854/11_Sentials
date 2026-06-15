export interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface User {
  email: string;
  password: string;
}

export interface ResourceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  costEstimate: number;
}

export interface SecurityAlert {
  message: string;
  source: string;
  status: 'active' | 'investigating';
  timestamp: string;
}