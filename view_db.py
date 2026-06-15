import sqlite3
import os

# Path to the database created by the Flask server
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "Hackathon_M", "sentinel.db"))

print("=" * 80)
print(f"Reading real-time incidents from SQLite: {db_path}")
print("=" * 80)

if not os.path.exists(db_path):
    print("\n[Warning] Database file not found yet. Please connect the database first via the Command Center UI.")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get table list
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("\n--- SCHEMA TABLES FOUND ---")
    for idx, t in enumerate(tables, 1):
        print(f"{idx}. {t[0]}")
    
    # Query incidents
    cursor.execute("SELECT * FROM security_incidents ORDER BY id DESC LIMIT 10;")
    rows = cursor.fetchall()
    
    print("\n--- LATEST 10 INCIDENTS PERSISTED IN THE DATABASE ---")
    print(f"{'ID':<5} | {'Timestamp':<20} | {'Type':<18} | {'IP Address':<15} | {'Status':<10}")
    print("-" * 80)
    for r in rows:
        # Columns: 0=id, 1=timestamp, 2=type, 3=ip, 4=details, 5=status
        print(f"{r[0]:<5} | {r[1]:<20} | {r[2]:<18} | {r[3]:<15} | {r[5]:<10}")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"\nError querying SQLite database: {e}")
print("=" * 80)
