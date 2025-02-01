import os
import smtplib
from email.mime.text import MIMEText
import requests
import logging

def send_email_alert(message: str) -> None:
    try:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.example.com")
        smtp_port = os.getenv("SMTP_PORT", 587)
        smtp_user = os.getenv("SMTP_USER", "user@example.com")
        smtp_password = os.getenv("SMTP_PASSWORD", "password")
        recipient = os.getenv("ALERT_RECIPIENT", "admin@example.com")

        msg = MIMEText(message)
        msg["Subject"] = "Cybersecurity Alert"
        msg["From"] = smtp_user
        msg["To"] = recipient

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [recipient], msg.as_string())
        logging.info("Email alert sent successfully.")
    except Exception as e:
        logging.error("Error sending email alert: %s", e)

def send_slack_alert(message: str) -> None:
    try:
        slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        payload = {"text": message}
        response = requests.post(slack_webhook_url, json=payload)
        if response.status_code == 200:
            logging.info("Slack alert sent successfully.")
        else:
            logging.error("Failed to send Slack alert.")
    except Exception as e:
        logging.error("Error sending Slack alert: %s", e)