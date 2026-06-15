import asyncio
import random
from datetime import datetime

class ResourceAgent:
    def __init__(self):
        self.metrics = {
            "cpu_usage": 0,
            "memory_usage": 0,
            "network_usage": 0,
            "cost_estimate": 0
        }

    async def monitor_resources(self):
        while True:
            # Simulate resource monitoring
            self.update_metrics()
            await asyncio.sleep(2)  # Update every 2 seconds

    def update_metrics(self):
        # Simulate realistic resource usage patterns
        self.metrics["cpu_usage"] = min(100, max(0, 
            self.metrics["cpu_usage"] + random.uniform(-5, 5)))
        
        self.metrics["memory_usage"] = min(100, max(0,
            self.metrics["memory_usage"] + random.uniform(-3, 3)))
        
        self.metrics["network_usage"] = min(100, max(0,
            self.metrics["network_usage"] + random.uniform(-8, 8)))
        
        # Calculate cost based on resource usage
        self.metrics["cost_estimate"] = (
            self.metrics["cpu_usage"] * 0.5 +
            self.metrics["memory_usage"] * 0.3 +
            self.metrics["network_usage"] * 0.2
        ) * 2  # $2 per resource unit

    def get_metrics(self):
        return self.metrics