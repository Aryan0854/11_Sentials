import unittest
from unittest.mock import patch, mock_open, MagicMock
from agent import CybersecurityAgent, AnomalyDetection
from datetime import datetime
import os

class TestAnomalyDetection(unittest.TestCase):
    def setUp(self):
        self.anomaly_detection = AnomalyDetection()

    def test_extract_features_valid_log_entry(self):
        log_entry = "2025-01-21 04:40:07 - Normal operation from 214.72.27.242"
        features = self.anomaly_detection.extract_features(log_entry)
        self.assertEqual(features, [242, 4])

    def test_extract_features_invalid_log_entry(self):
        log_entry = "Invalid log entry"
        features = self.anomaly_detection.extract_features(log_entry)
        self.assertIsNone(features)

    def test_extract_features_missing_ip(self):
        log_entry = "2025-01-21 04:40:07 - Normal operation"
        features = self.anomaly_detection.extract_features(log_entry)
        self.assertIsNone(features)

    def test_detect_anomaly_with_insufficient_data(self):
        with self.assertRaises(ValueError):
            self.anomaly_detection.detect_anomaly([1, 2])

class TestCybersecurityAgent(unittest.TestCase):
    def setUp(self):
        self.agent = CybersecurityAgent()

    @patch("builtins.open", new_callable=mock_open, read_data="2025-01-21 04:40:07 - Normal operation from 214.72.27.242\n")
    def test_monitor_logs(self, mock_file):
        with patch.object(self.agent, 'analyze_log_entry') as mock_analyze:
            self.agent.monitor_logs("mock_logs.txt", duration=1)
            mock_analyze.assert_called()

    @patch("requests.post")
    def test_block_ip(self, mock_post):
        mock_post.return_value.status_code = 200
        self.agent.block_ip("214.72.27.242")
        mock_post.assert_called_with("http://example.com/api/block_ip", json={"ip": "214.72.27.242"})

    @patch("requests.post")
    def test_block_ip_failure(self, mock_post):
        mock_post.return_value.status_code = 500
        with self.assertLogs(level="ERROR"):
            self.agent.block_ip("214.72.27.242")
        mock_post.assert_called_with("http://example.com/api/block_ip", json={"ip": "214.72.27.242"})

    @patch("builtins.open", new_callable=mock_open)
    def test_log_action(self, mock_file):
        self.agent.log_action("214.72.27.242")
        mock_file().write.assert_called_with(f"{datetime.now()} - Blocked IP: 214.72.27.242\n")

    @patch("requests.post")
    def test_analyze_with_llm(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"analysis": "Suspicious activity detected"}
        self.agent.analyze_with_llm("2025-01-21 04:40:07 - Failed login from 214.72.27.242")
        mock_post.assert_called_once_with(
            self.agent.groq_api_url,
            headers={
                "Authorization": f"Bearer {self.agent.groq_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "log_entry": "2025-01-21 04:40:07 - Failed login from 214.72.27.242",
                "prompt": "Analyze the following log entry for suspicious activity:"
            }
        )

    @patch("smtplib.SMTP")
    def test_send_email_alert(self, mock_smtp):
        mock_server = MagicMock()
        mock_smtp.return_value = mock_server
        self.agent.send_email_alert("Test alert message")
        mock_server.sendmail.assert_called()

    @patch("requests.post")
    def test_send_slack_alert(self, mock_post):
        mock_post.return_value.status_code = 200
        self.agent.send_slack_alert("Test Slack alert message")
        mock_post.assert_called_with(os.getenv("SLACK_WEBHOOK_URL"), json={"text": "Test Slack alert message"})

    @patch("builtins.open", new_callable=mock_open, read_data="2025-01-21 04:40:07 - Failed login from 214.72.27.242\n")
    @patch("requests.post")
    @patch("smtplib.SMTP")
    def test_end_to_end_workflow(self, mock_smtp, mock_post, mock_file):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"analysis": "Suspicious activity detected"}
        mock_server = MagicMock()
        mock_smtp.return_value = mock_server

        self.agent.monitor_logs("mock_logs.txt", duration=1)

        mock_post.assert_called_with("http://example.com/api/block_ip", json={"ip": "214.72.27.242"})
        mock_server.sendmail.assert_called()

if __name__ == "__main__":
    unittest.main()