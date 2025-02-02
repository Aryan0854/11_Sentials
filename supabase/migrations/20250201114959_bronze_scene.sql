/*
  # Create monitoring tables for Cloud Guardian

  1. New Tables
    - `resource_metrics`
      - `id` (uuid, primary key)
      - `cpu_usage` (float)
      - `memory_usage` (float)
      - `network_usage` (float)
      - `cost_estimate` (decimal)
      - `created_at` (timestamp)
    - `security_alerts`
      - `id` (uuid, primary key)
      - `message` (text)
      - `source` (text)
      - `status` (text)
      - `timestamp` (timestamp)
    - `system_health`
      - `id` (uuid, primary key)
      - `status` (text)
      - `score` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS resource_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpu_usage float NOT NULL,
  memory_usage float NOT NULL,
  network_usage float NOT NULL,
  cost_estimate decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  source text NOT NULL,
  status text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resource_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users"
  ON resource_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users"
  ON security_alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to authenticated users"
  ON system_health
  FOR SELECT
  TO authenticated
  USING (true);