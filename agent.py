import re
import time
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, Optional
import yaml
import os
from anomaly_detection import AnomalyDetection
from alerts import send_email_alert, send_slack_alert

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def load_config(config_path: str) -> Dict:
    """Load and validate configuration from a YAML file."""
    with open(config_path, "r") as config_file:
        config = yaml.safe_load(config_file)
    
    required_fields = config.get("required_fields", [])
    for field in required_fields:
        if not config.get(field) and not os.getenv(field.upper()):
            raise ValueError(f"Missing required configuration field: {field}")

    # Load sensitive information from environment variables
    config["smtp_user"] = os.getenv("SMTP_USER", config["smtp_user"])
    config["smtp_password"] = os.getenv("SMTP_PASSWORD", config["smtp_password"])
    config["slack_webhook_url"] = os.getenv("SLACK_WEBHOOK_URL", config["slack_webhook_url"])
    config["groq_api_key"] = os.getenv("GROQ_API_KEY")
    config["virustotal_api_key"] = os.getenv("VIRUSTOTAL_API_KEY")
    config["incident_response_url"] = os.getenv("INCIDENT_RESPONSE_URL")

    return config

# Load configuration
config = load_config("config.yaml")

# Suspicious patterns to monitor
SUSPICIOUS_PATTERNS = config["suspicious_patterns"]

class CybersecurityAgent:
    def __init__(self):
        """Initialize the Cybersecurity Agent."""
        self.detected_ips = set()
        self.anomaly_detector = AnomalyDetection()
        self.last_action_time: Dict[str, datetime] = {}
        self.log_entries_processed = 0
        self.suspicious_activities_detected = 0
        self.groq_api_key = config["groq_api_key"]
        self.groq_api_url = "https://api.groq.com/v1/analyze"  # Replace with the actual Groq API endpoint
        self.virustotal_api_key = config["virustotal_api_key"]
        self.virustotal_api_url = "https://www.virustotal.com/api/v3/ip_addresses/"
        self.incident_response_url = config["incident_response_url"]
        self.user_roles = {}  # Example: {"user1": "admin", "user2": "guest"}
        self.privilege_escalation_patterns = [
            r"User (\w+) escalated privileges to (\w+)",
            r"Unauthorized privilege escalation by (\w+)"
        ]

    def monitor_logs(self, log_source: str, duration: int = 30, is_remote: bool = False) -> None:
        """Monitor logs for suspicious activities."""
        logging.info("Starting log monitoring for %d seconds...", duration)
        start_time = time.time()
        try:
            if is_remote:
                logs = self.fetch_logs_from_remote(log_source)
                if logs:
                    for line in logs.splitlines():
                        self.analyze_log_entry(line.strip())
                        self.log_entries_processed += 1
                        self.display_status()
            else:
                with open(log_source, "r") as file:
                    file.seek(0, 2)
                    while time.time() - start_time < duration:
                        line = file.readline()
                        if line:
                            self.analyze_log_entry(line.strip())
                            self.log_entries_processed += 1
                            self.display_status()
                        else:
                            time.sleep(1)
                            self.handle_log_rotation(file)
        except FileNotFoundError:
            logging.error("Log file not found: %s", log_source)
        except Exception as e:
            logging.error("Error monitoring logs: %s", e)
        logging.info("Time limit reached. Exiting log monitoring...")
        self.print_summary_report()

    def fetch_logs_from_remote(self, url: str) -> Optional[str]:
        """Fetch logs from a remote server."""
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logging.error("Error fetching logs from remote server: %s", e)
            return None

    def handle_log_rotation(self, file) -> None:
        """Handle log rotation."""
        file.seek(0, 2)
        logging.info("Handled log rotation.")

    def analyze_log_entry(self, log_entry: str) -> None:
        """Analyze a single log entry."""
        logging.info("Analyzing log entry: %s", log_entry)
        self.detect_privilege_escalation(log_entry)  # Check for privilege escalation

        for pattern in SUSPICIOUS_PATTERNS:
            match = re.search(pattern, log_entry)
            if match:
                ip = match.group(1)
                if ip not in self.detected_ips:
                    self.detected_ips.add(ip)
                    self.suspicious_activities_detected += 1
                    logging.warning("Suspicious activity detected from IP: %s", ip)
                    if self.check_ip_with_virustotal(ip):  # Check IP with VirusTotal
                        logging.warning("IP %s is flagged as malicious by VirusTotal!", ip)
                    self.take_action(ip)
        
        features = self.anomaly_detector.extract_features(log_entry)
        if features:
            self.anomaly_detector.update_features(features)
            if len(self.anomaly_detector.data) > 5:
                self.anomaly_detector.train_model(self.anomaly_detector.data)
                if self.anomaly_detector.detect_anomaly(features):
                    self.suspicious_activities_detected += 1
                    logging.warning("Anomaly detected from IP: %s at hour %d", features[0], features[1])
                    self.take_action(features[0])

        # Use Groq API to analyze log entry
        self.analyze_with_llm(log_entry)

    def analyze_with_llm(self, log_entry: str) -> None:
        """Analyze a log entry using the Groq API."""
        try:
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "log_entry": log_entry,
                "prompt": "Analyze the following log entry for suspicious activity:"
            }
            response = requests.post(self.groq_api_url, headers=headers, json=payload)
            response.raise_for_status()  # Raise an error for bad responses
            analysis = response.json().get("analysis", "No analysis available")
            logging.info("Groq API Analysis: %s", analysis)
        except requests.RequestException as e:
            logging.error("Error analyzing log entry with Groq API: %s", e)

    def check_ip_with_virustotal(self, ip: str) -> bool:
        """Check if an IP is malicious using VirusTotal."""
        try:
            headers = {
                "x-apikey": self.virustotal_api_key
            }
            response = requests.get(f"{self.virustotal_api_url}{ip}", headers=headers)
            response.raise_for_status()
            result = response.json()
            if result.get("data", {}).get("attributes", {}).get("last_analysis_stats", {}).get("malicious", 0) > 0:
                return True
        except requests.RequestException as e:
            logging.error("Error checking IP with VirusTotal: %s", e)
        return False

    def detect_privilege_escalation(self, log_entry: str) -> None:
        """Detect privilege escalation attempts."""
        for pattern in self.privilege_escalation_patterns:
            match = re.search(pattern, log_entry)
            if match:
                user = match.group(1)
                new_role = match.group(2) if len(match.groups()) > 1 else "unknown"
                logging.warning("Privilege escalation detected: User %s escalated to %s", user, new_role)
                self.take_action(user)  # Block or alert on the user

    def take_action(self, ip: str) -> None:
        """Take action on a suspicious IP."""
        current_time = datetime.now()
        if ip in self.last_action_time and current_time - self.last_action_time[ip] < timedelta(minutes=1):
            logging.info("Action already taken for IP: %s recently. Skipping...", ip)
            return

        logging.info("Blocking IP: %s", ip)
        self.log_action(ip)
        self.block_ip(ip)
        self.send_alert(ip)
        self.last_action_time[ip] = current_time

    def log_action(self, ip: str) -> None:
        """Log the action taken on a suspicious IP."""
        try:
            with open("security_actions.log", "a") as log_file:
                log_file.write(f"{datetime.now()} - Blocked IP: {ip}\n")
            logging.info("Action logged for IP: %s", ip)
        except Exception as e:
            logging.error("Error logging action for IP: %s - %s", ip, e)

    def block_ip(self, ip: str) -> None:
        """Block a suspicious IP."""
        logging.info("Attempting to block IP: %s", ip)
        try:
            firewall_api_url = config["firewall_api_url"]
            response = requests.post(firewall_api_url, json={"ip": ip})
            if response.status_code == 200:
                logging.info("Successfully blocked IP: %s", ip)
            else:
                logging.error("Failed to block IP: %s", ip)
        except requests.RequestException as e:
            logging.error("Request error blocking IP: %s - %s", ip, e)
        except Exception as e:
            logging.error("Error blocking IP: %s - %s", ip, e)

    def send_alert(self, ip: str) -> None:
        """Send an alert for a suspicious IP."""
        try:
            alert_message = f"Suspicious activity detected and blocked from IP: {ip}"
            send_email_alert(alert_message)
            send_slack_alert(alert_message)
            self.send_incident_response_alert(alert_message)
            logging.info("Alert sent for IP: %s", ip)
        except Exception as e:
            logging.error("Error sending alert for IP: %s - %s", ip, e)

    def send_incident_response_alert(self, message: str) -> None:
        """Send an alert to an incident response platform."""
        try:
            payload = {"message": message}
            response = requests.post(self.incident_response_url, json=payload)
            if response.status_code == 200:
                logging.info("Incident response alert sent successfully.")
            else:
                logging.error("Failed to send incident response alert.")
        except Exception as e:
            logging.error("Error sending incident response alert: %s", e)

    def display_status(self) -> None:
        """Display the current status of log monitoring."""
        logging.info("Log entries processed: %d", self.log_entries_processed)
        logging.info("Suspicious activities detected: %d", self.suspicious_activities_detected)

    def print_summary_report(self) -> None:
        """Print a summary report of the monitoring session."""
        logging.info("Summary Report:")
        logging.info("Total log entries processed: %d", self.log_entries_processed)
        logging.info("Total suspicious activities detected: %d", self.suspicious_activities_detected)
        logging.info("Blocked IPs: %s", ", ".join(self.detected_ips))

def main():
    """Main function to start the Cybersecurity Agent."""
    agent = CybersecurityAgent()
    try:
        # Example usage: monitor logs from a local file
        agent.monitor_logs(config["log_file"], duration=config["monitor_duration"])

        # Example usage: monitor logs from a remote server
        # agent.monitor_logs("http://example.com/logs", duration=config["monitor_duration"], is_remote=True)
    except KeyboardInterrupt:
        logging.info("Stopping log monitoring...")

if __name__ == "__main__":
    main()