import asyncio
import random
from datetime import datetime

class DefenseAgent:
    def __init__(self):
        self.threats = []
        self.active_defenses = set()
        self.defense_status = "active"

    async def monitor_threats(self):
        while True:
            await self.scan_for_threats()
            await self.update_defenses()
            await asyncio.sleep(2)

    async def scan_for_threats(self):
        threat_types = [
            "DDoS attempt",
            "Brute force attack",
            "Port scanning",
            "Malware activity",
            "Data exfiltration attempt"
        ]

        if random.random() < 0.2:  # 20% chance of detecting a threat
            threat = {
                "type": random.choice(threat_types),
                "severity": random.choice(["low", "medium", "high", "critical"]),
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "status": "detected"
            }
            self.threats.append(threat)
            await self.deploy_countermeasure(threat)

    async def deploy_countermeasure(self, threat):
        countermeasures = {
            "DDoS attempt": "Rate limiting and traffic filtering",
            "Brute force attack": "Account lockout and IP blocking",
            "Port scanning": "Port hardening and IPS activation",
            "Malware activity": "Process isolation and signature blocking",
            "Data exfiltration attempt": "Traffic inspection and data encryption"
        }

        defense = {
            "type": countermeasures[threat["type"]],
            "deployed_at": datetime.now().strftime("%H:%M:%S"),
            "target_threat": threat["type"]
        }

        self.active_defenses.add(defense["type"])
        await self.update_defense_status()

    async def update_defenses(self):
        # Remove old threats and update defense status
        current_time = datetime.now()
        self.threats = [
            threat for threat in self.threats 
            if (current_time - datetime.strptime(threat["timestamp"], "%H:%M:%S")).seconds < 300
        ]
        await self.update_defense_status()

    async def update_defense_status(self):
        if len(self.threats) == 0:
            self.defense_status = "active"
        elif any(threat["severity"] == "critical" for threat in self.threats):
            self.defense_status = "critical"
        elif any(threat["severity"] == "high" for threat in self.threats):
            self.defense_status = "elevated"
        else:
            self.defense_status = "active"

    def get_status(self):
        return {
            "status": self.defense_status,
            "active_threats": len(self.threats),
            "active_defenses": len(self.active_defenses),
            "recent_threats": self.threats[-5:] if self.threats else []
        }