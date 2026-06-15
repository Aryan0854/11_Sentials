# agent.py
import re
import time
import logging
import requests
import json
import os
import websocket

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

LOG_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "attacker_logs.log"))
WEBSOCKET_URL = "ws://localhost:8765"
FLASK_BLOCK_URL = "http://localhost:5000/block_ip"

# Patterns to detect
SUSPICIOUS_PATTERNS = [
    (r"Brute force attack detected from IP:\s+(\d+\.\d+\.\d+\.\d+)", "Brute Force", "high"),
    (r"Failed login attempt from IP:\s+(\d+\.\d+\.\d+\.\d+)", "Failed Login", "low"),
    (r"SQL Injection detected from IP:\s+(\d+\.\d+\.\d+\.\d+)", "SQL Injection", "critical"),
    (r"Unauthorized admin access attempt from IP:\s+(\d+\.\d+\.\d+\.\d+)", "Unauthorized Access", "high"),
    (r"Port scan detected from IP:\s+(\d+\.\d+\.\d+\.\d+)", "Port Scan", "medium")
]

class CybersecurityAgent:
    def __init__(self):
        self.processed_lines = 0
        self.blocked_ips = set()
        
    def start(self):
        logging.info("Cybersecurity Agent started. Monitoring log: %s", LOG_FILE)
        
        # Ensure file exists
        if not os.path.exists(LOG_FILE):
            os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
            with open(LOG_FILE, "w") as f:
                f.write("")

        # Read from end of file
        with open(LOG_FILE, "r") as file:
            file.seek(0, 2)  # Go to end
            while True:
                line = file.readline()
                if not line:
                    file.seek(file.tell())  # Clear EOF flag on Windows
                    time.sleep(0.5)
                    continue
                
                self.analyze_line(line.strip())

    def analyze_line(self, line):
        logging.info("Analyzing: %s", line)
        for pattern, attack_type, severity in SUSPICIOUS_PATTERNS:
            match = re.search(pattern, line)
            if match:
                ip = match.group(1)
                logging.warning("DETECTED threat: %s from IP: %s (Severity: %s)", attack_type, ip, severity)
                
                # Apply firewall rules via Flask Block Endpoint
                self.block_ip(ip)
                
                # Broadcast real event data to WebSocket clients
                self.broadcast_threat(attack_type, ip, severity)
                break

    def block_ip(self, ip):
        if ip in self.blocked_ips:
            return
        
        try:
            response = requests.post(FLASK_BLOCK_URL, json={"ip": ip}, timeout=2.0)
            if response.status_code == 200:
                logging.info("Agent firewall rule: IP %s blocked successfully", ip)
                self.blocked_ips.add(ip)
            else:
                logging.error("Failed to block IP %s on firewall: %s", ip, response.text)
        except Exception as e:
            logging.error("Failed to connect to Firewall API: %s", e)

    def broadcast_threat(self, attack_type, ip, severity):
        payload = {
            "type": attack_type,
            "ip": ip,
            "severity": severity,
            "details": f"Intrusion attempt blocked by firewall block rules.",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        try:
            ws = websocket.create_connection(WEBSOCKET_URL, timeout=2.0)
            ws.send(json.dumps(payload))
            ws.close()
            logging.info("Threat broadcast completed over WebSockets.")
        except Exception as e:
            logging.error("Agent failed to transmit packet to WebSocket server: %s", e)

if __name__ == "__main__":
    # Wait for servers to wake up
    time.sleep(2)
    agent = CybersecurityAgent()
    agent.start()