import unittest
from unittest.mock import patch, mock_open, MagicMock
from agent import CybersecurityAgent, AnomalyDetection
from datetime import datetime
import os

class TestAnomalyDetection(unittest.TestCase):
    def setUp(self):
        self.anomaly_detection = AnomalyDetection()

    def test_extract_features(self):
        log_entry = "2025-01-21 04:40:07 - Normal operation from 214.72.27.242"
        features = self.anomaly_detection.extract_features(log_entry)
        self.assertEqual(features, [242, 4])

    def test_detect_anomaly(self):
        self.anomaly_detection.train_model([[1, 2], [2, 3], [3, 4], [4, 5], [5, 6]])
        is_anomaly = self.anomaly_detection.detect_anomaly([100, 100])
        self.assertTrue(is_anomaly)

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

    @patch("builtins.open", new_callable=mock_open)
    def test_log_action(self, mock_file):
        self.agent.log_action("214.72.27.242")
        mock_file().write.assert_called_with(f"{datetime.now()} - Blocked IP: 214.72.27.242\n")

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

if __name__ == "__main__":
    unittest.main()