import asyncio
import websockets
import json
import random
from datetime import datetime

class SecurityAgent:
    def __init__(self):
        self.alerts = []
        self.security_score = 100

    async def monitor_security(self):
        while True:
            # Simulate security monitoring
            if random.random() < 0.3:  # 30% chance of detecting an issue
                self.generate_alert()
            
            # Update security score based on alerts
            self.update_security_score()
            
            await asyncio.sleep(2)  # Check every 5 seconds

    def generate_alert(self):
        alert_types = [
            "Unusual network activity detected",
            "Multiple failed login attempts",
            "Potential SQL injection attempt",
            "Suspicious file system activity",
            "Unauthorized access attempt"
        ]

        alert = {
            "message": random.choice(alert_types),
            "source": "Security Monitor",
            "status": "active",
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }
        
        self.alerts.append(alert)
        if len(self.alerts) > 5:  # Keep only recent alerts
            self.alerts.pop(0)

    def update_security_score(self):
        # Reduce score based on active alerts
        self.security_score = max(60, 100 - (len(self.alerts) * 8))

    def get_status(self):
        return {
            "alerts": self.alerts,
            "score": self.security_score
        }