import asyncio
import json
from datetime import datetime
import random

class ActivityAgent:
    def __init__(self):
        self.activities = []
        self.activity_types = [
            "User login",
            "Database query",
            "File access",
            "API request",
            "Configuration change"
        ]

    async def monitor_activity(self):
        while True:
            if random.random() < 0.4:  # 40% chance of new activity
                self.log_activity()
            await asyncio.sleep(3)

    def log_activity(self):
        activity = {
            "type": random.choice(self.activity_types),
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "status": "success" if random.random() > 0.1 else "failed",
            "details": self.generate_details()
        }
        
        self.activities.append(activity)
        if len(self.activities) > 100:  # Keep last 100 activities
            self.activities.pop(0)

    def generate_details(self):
        details = {
            "User login": "User authentication from IP {}.{}.{}.{}",
            "Database query": "Query execution time: {}ms",
            "File access": "Accessed file: /path/to/file{}",
            "API request": "GET /api/v1/resource/{}",
            "Configuration change": "Updated setting: config{}"
        }
        
        activity_type = random.choice(self.activity_types)
        if activity_type == "User login":
            return details[activity_type].format(
                random.randint(1, 255), random.randint(1, 255),
                random.randint(1, 255), random.randint(1, 255)
            )
        elif activity_type == "Database query":
            return details[activity_type].format(random.randint(10, 1000))
        else:
            return details[activity_type].format(random.randint(1, 100))

    def get_activities(self):
        return self.activities