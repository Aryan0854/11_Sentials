import asyncio
import random
from datetime import datetime

class AttackSimulator:
    def __init__(self):
        self.active_attacks = []
        self.attack_patterns = [
            {
                "type": "DDoS",
                "patterns": ["TCP SYN flood", "UDP flood", "HTTP flood"],
                "duration": range(5, 30)
            },
            {
                "type": "Brute Force",
                "patterns": ["Password spray", "Dictionary attack", "Rainbow table"],
                "duration": range(10, 60)
            },
            {
                "type": "SQL Injection",
                "patterns": ["Union-based", "Error-based", "Blind"],
                "duration": range(1, 10)
            }
        ]

    async def simulate_attacks(self):
        while True:
            if random.random() < 0.15:  # 15% chance of new attack
                await self.launch_attack()
            await self.update_active_attacks()
            await asyncio.sleep(3)

    async def launch_attack(self):
        attack_type = random.choice(self.attack_patterns)
        attack = {
            "type": attack_type["type"],
            "pattern": random.choice(attack_type["patterns"]),
            "start_time": datetime.now().strftime("%H:%M:%S"),
            "duration": random.choice(attack_type["duration"]),
            "success_rate": random.random(),
            "target": f"service_{random.randint(1, 5)}"
        }
        
        self.active_attacks.append(attack)
        await self.generate_attack_metrics(attack)

    async def generate_attack_metrics(self, attack):
        metrics = {
            "requests_per_second": random.randint(100, 10000),
            "bandwidth_usage": random.randint(10, 1000),  # MB/s
            "connection_count": random.randint(50, 5000),
            "success_rate": attack["success_rate"]
        }
        return metrics

    async def update_active_attacks(self):
        current_time = datetime.now()
        self.active_attacks = [
            attack for attack in self.active_attacks
            if (current_time - datetime.strptime(attack["start_time"], "%H:%M:%S")).seconds < attack["duration"]
        ]

    def get_status(self):
        return {
            "active_attacks": len(self.active_attacks),
            "attack_details": self.active_attacks,
            "total_bandwidth": sum(random.randint(10, 1000) for _ in self.active_attacks) if self.active_attacks else 0
        }