import random
import time
import logging
import os
import pickle  # Import pickle

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

LOG_FILE = "attacker_logs.log"

if not os.path.exists(LOG_FILE):
    with open(LOG_FILE, "w") as log_file:
        log_file.write("")
    logging.info("Created attacker_logs.log")

ATTACKER_IPS = ["192.168.1.101", "10.0.0.5", "203.0.113.45"]
MALICIOUS_LOGS = [
    "Brute force attack detected from IP: {}",
    "Failed login attempt from IP: {}",
    "SQL Injection detected from IP: {}",
    "Unauthorized admin access attempt from IP: {}",
    "Port scan detected from IP: {}"
]

class AttackerAgent:
    def __init__(self, attack_interval=5):
        self.attack_interval = attack_interval

    def generate_attack(self):
        """Generate a random attack log entry."""
        ip = random.choice(ATTACKER_IPS)
        log_entry = random.choice(MALICIOUS_LOGS).format(ip)

        with open(LOG_FILE, "a") as log_file:
            log_file.write(log_entry + "\n")

        logging.info("Attacker generated log: %s", log_entry)

    def start_attack(self, duration=30):
        logging.info("Starting Attacker Agent...")
        start_time = time.time()
        while time.time() - start_time < duration:
            self.generate_attack()
            time.sleep(self.attack_interval)

    def save_logs(self, filename: str) -> None:
        """Save the attack logs to a file."""
        with open(LOG_FILE, "r") as log_file:
            logs = log_file.readlines()
        with open(filename, "wb") as file:
            pickle.dump(logs, file)
        logging.info("Attack logs saved to %s", filename)

    def load_logs(self, filename: str) -> None:
        """Load the attack logs from a file."""
        with open(filename, "rb") as file:
            logs = pickle.load(file)
        with open(LOG_FILE, "w") as log_file:
            log_file.writelines(logs)
        logging.info("Attack logs loaded from %s", filename)

if __name__ == "__main__":
    attacker = AttackerAgent(attack_interval=2)
    attacker.start_attack(duration=30)
    attacker.save_logs("saved_logs.pkl")
    attacker.load_logs("saved_logs.pkl")