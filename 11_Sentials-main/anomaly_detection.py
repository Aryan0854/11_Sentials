import logging
import numpy as np
import re
from typing import List, Optional
from sklearn.ensemble import IsolationForest
import pickle  # Import pickle

class AnomalyDetection:
    def __init__(self):
        self.model = IsolationForest(n_estimators=100, contamination=0.1)
        self.data: List[List[int]] = []

    def train_model(self, data: List[List[int]]) -> None:
        self.model.fit(data)
        logging.info("Anomaly detection model trained with %d data points.", len(data))

    def detect_anomaly(self, features: List[int]) -> bool:
        is_anomaly = self.model.predict([features])[0] == -1
        logging.info("Anomaly detection result for features %s: %s", features, is_anomaly)
        return is_anomaly

    def extract_features(self, log_entry: str) -> Optional[List[int]]:
        ip_match = re.search(r"(\d+\.\d+\.\d+\.\d+)", log_entry)
        if ip_match:
            ip = ip_match.group(1)
            try:
                hour_of_day = int(log_entry.split()[1].split(":")[0])
                ip_last_octet = int(ip.split(".")[-1])
                features = [ip_last_octet, hour_of_day]
                logging.info("Extracted features from log entry: %s", features)
                return features
            except (IndexError, ValueError):
                logging.error("Error extracting features from log entry: %s", log_entry)
        return None

    def update_features(self, features: List[int]) -> None:
        if features:
            self.data.append(features)
            logging.info("Updated features list with: %s", features)

    def save_model(self, filename: str) -> None:
        """Save the anomaly detection model to a file."""
        with open(filename, "wb") as file:
            pickle.dump(self.model, file)
        logging.info("Anomaly detection model saved to %s", filename)

    def load_model(self, filename: str) -> None:
        """Load the anomaly detection model from a file."""
        with open(filename, "rb") as file:
            self.model = pickle.load(file)
        logging.info("Anomaly detection model loaded from %s", filename)