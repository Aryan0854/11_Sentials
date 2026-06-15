from flask import Flask, render_template, jsonify, request
import psutil
import socket
import time
import os
import random
import sqlite3

app = Flask(__name__)

servers = []
blocked_ips = set()
auto_defend = True
connected_db = None

# Attacker details
ATTACKER_IPS = ["192.168.1.101", "10.0.0.5", "203.0.113.45"]
MALICIOUS_LOGS = [
    "Brute force attack detected from IP: {}",
    "Failed login attempt from IP: {}",
    "SQL Injection detected from IP: {}",
    "Unauthorized admin access attempt from IP: {}",
    "Port scan detected from IP: {}"
]

# Manual CORS handler to avoid requiring flask-cors pip dependency
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/system_info')
def system_info():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory_info = psutil.virtual_memory()
    disk_usage = psutil.disk_usage('/')
    network_info = psutil.net_io_counters()

    # Heavy processes list
    processes = []
    for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent']):
        try:
            proc_info = proc.info
            if proc_info['cpu_percent'] > 10:
                processes.append(f"{proc_info['name']} (PID: {proc_info['pid']})")
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

    system_data = {
        'cpu_percent': cpu_percent,
        'memory_percent': memory_info.percent,
        'disk_percent': disk_usage.percent,
        'bytes_sent': network_info.bytes_sent,
        'bytes_recv': network_info.bytes_recv,
        'heavy_processes': processes
    }

    return jsonify(system_data)

@app.route('/db_status', methods=['GET'])
def get_db_status():
    global connected_db
    if connected_db:
        # Re-query metrics in real-time
        db_type = connected_db['type']
        database = connected_db['database']
        tables_count = 0
        db_size = 0.0
        active_conns = 1
        latency = connected_db.get('latency_ms', 5.0)

        if db_type == 'sqlite' or database.endswith('.db'):
            db_path = database if os.path.exists(database) else os.path.join(os.getcwd(), database)
            if os.path.exists(db_path):
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                    tables = cursor.fetchall()
                    tables_count = len(tables)
                    
                    # Also count rows in security_incidents if it exists
                    try:
                        cursor.execute("SELECT COUNT(*) FROM security_incidents;")
                        incidents_count = cursor.fetchone()[0]
                        # Mock connections based on threat count slightly
                        active_conns = min(15, 1 + (incidents_count // 3))
                    except:
                        pass
                        
                    conn.close()
                    db_size = round(os.path.getsize(db_path) / (1024 * 1024), 3)  # size in MB
                except:
                    tables_count = 0
                    db_size = 0.0
        else:
            # Fallback deterministic stats for other simulated DB types
            seed = sum(ord(c) for c in database) if database else 42
            active_conns = (seed % 15) + 3
            tables_count = (seed % 28) + 6
            db_size = round(((seed % 800) / 10.0) + 0.8, 1)

        connected_db['tables_count'] = tables_count
        connected_db['db_size_mb'] = db_size
        connected_db['active_connections'] = active_conns

        return jsonify({
            'connected': True,
            'db': connected_db
        })
    else:
        return jsonify({
            'connected': False
        })

@app.route('/connect_db', methods=['POST', 'OPTIONS'])
def connect_db():
    global connected_db
    if request.method == 'OPTIONS':
        return jsonify({'message': 'ok'})
        
    data = request.json or {}
    db_type = data.get('type', 'mysql')
    host = data.get('host', '127.0.0.1')
    port = data.get('port')
    database = data.get('database', '')
    username = data.get('username', '')
    
    # Bypass port scans and TCP pings for SQLite
    if db_type == 'sqlite':
        if not database:
            database = 'sqlite_default.db'
        
        db_path = database if os.path.exists(database) else os.path.join(os.getcwd(), database)
        start_time = time.time()
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT 1;")
            cursor.close()
            conn.close()
            latency = (time.time() - start_time) * 1000  # in ms
        except Exception as e:
            return jsonify({
                'error': f'Failed to connect/initialize SQLite database file. Reason: {str(e)}'
            }), 400
    else:
        if not port:
            if db_type == 'mysql': port = 3306
            elif db_type == 'postgresql': port = 5432
            elif db_type == 'mongodb': port = 27017
            else: port = 80
            
        try:
            port = int(port)
        except ValueError:
            return jsonify({'error': 'Invalid port number'}), 400

        # Try TCP socket connection to test host/port reachability
        start_time = time.time()
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(3.0)
            sock.connect((host, port))
            sock.close()
            latency = (time.time() - start_time) * 1000  # in ms
        except Exception as e:
            return jsonify({
                'error': f'Failed to connect to {host} on port {port}. Reason: {str(e)}'
            }), 400

    # Initialize connected DB metadata
    connected_db = {
        'type': db_type,
        'host': host,
        'port': port or (3000 if db_type == 'sqlite' else 0),
        'database': database or 'sqlite_default.db',
        'latency_ms': round(latency, 2)
    }

    # Ensure table exists in target SQLite
    if db_type == 'sqlite' or (database and database.endswith('.db')):
        db_path = database if os.path.exists(database) else os.path.join(os.getcwd(), database)
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS security_incidents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    type TEXT,
                    ip TEXT,
                    details TEXT,
                    status TEXT
                );
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error initializing SQLite incidents table: {e}")

    # Calculate initial stats to return
    tables_count = 0
    db_size = 0.0
    active_conns = 1

    if db_type == 'sqlite' or (database and database.endswith('.db')):
        db_path = database if os.path.exists(database) else os.path.join(os.getcwd(), database)
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                tables_count = len(tables)
                conn.close()
                db_size = round(os.path.getsize(db_path) / (1024 * 1024), 3)  # size in MB
            except:
                tables_count = 1
                db_size = 0.01
    else:
        seed = sum(ord(c) for c in database) if database else 42
        active_conns = (seed % 15) + 3
        tables_count = (seed % 28) + 6
        db_size = round(((seed % 800) / 10.0) + 0.8, 1)

    connected_db['tables_count'] = tables_count
    connected_db['db_size_mb'] = db_size
    connected_db['active_connections'] = active_conns

    return jsonify({
        'status': 'connected',
        'type': db_type,
        'host': host,
        'port': connected_db['port'],
        'database': connected_db['database'],
        'latency_ms': round(latency, 2),
        'active_connections': active_conns,
        'db_size_mb': db_size,
        'tables_count': tables_count
    })

# SIMULATOR ENDPOINTS
@app.route('/launch_attack', methods=['POST', 'OPTIONS'])
def launch_attack():
    global connected_db, auto_defend
    if request.method == 'OPTIONS':
        return jsonify({'message': 'ok'})
    
    # Write to absolute path relative to this source file to avoid os.getcwd() differences
    log_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "11_Sentials-main", "attacker_logs.log"))
    
    # Ensure directory structure exists
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    
    # Generate a random dynamic IP to simulate continuous new attackers
    base_ip = random.choice(["192.168.1", "10.0.0", "203.0.113"])
    ip = f"{base_ip}.{random.randint(10, 250)}"
    
    # Choose random attack type
    log_entry_pattern = random.choice(MALICIOUS_LOGS)
    log_entry = log_entry_pattern.format(ip)
    
    # Parse severity and attack name from the log
    attack_type = "Suspicious Activity"
    severity = "medium"
    
    if "Brute force" in log_entry:
        attack_type = "Brute Force"
        severity = "high"
    elif "Failed login" in log_entry:
        attack_type = "Failed Login"
        severity = "low"
    elif "SQL Injection" in log_entry:
        attack_type = "SQL Injection"
        severity = "critical"
    elif "Unauthorized admin" in log_entry:
        attack_type = "Unauthorized Access"
        severity = "high"
    elif "Port scan" in log_entry:
        attack_type = "Port Scan"
        severity = "medium"

    timestamp_str = time.strftime('%Y-%m-%d %H:%M:%S')

    # If SQLite database is connected, insert the threat event into the real database table
    db_type = connected_db.get('type')
    database = connected_db.get('database')
    
    if db_type == 'sqlite' and database:
        db_path = database if os.path.exists(database) else os.path.join(os.getcwd(), database)
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                # Determine defense status (if auto_defend is enabled, it gets defended)
                status_val = "DEFENDED" if (auto_defend or ip in blocked_ips) else "ACTIVE"
                cursor.execute("""
                    INSERT INTO security_incidents (timestamp, type, ip, details, status)
                    VALUES (?, ?, ?, ?, ?);
                """, (timestamp_str, attack_type, ip, f"Live alert logged via simulation. Severity: {severity}", status_val))
                conn.commit()
                conn.close()
            except Exception as db_err:
                print(f"Error persisting attack simulation event to SQLite: {db_err}")

    try:
        with open(log_path, "a") as log_file:
            log_file.write(f"{timestamp_str} - {log_entry}\n")
        return jsonify({'status': 'launched', 'ip': ip, 'log': log_entry})
    except Exception as e:
        return jsonify({'error': f'Failed to write log: {str(e)}'}), 500

@app.route('/toggle_defense', methods=['POST', 'OPTIONS'])
def toggle_defense():
    global auto_defend
    if request.method == 'OPTIONS':
        return jsonify({'message': 'ok'})
    
    data = request.json or {}
    auto_defend = data.get('enabled', True)
    return jsonify({'status': 'updated', 'auto_defend': auto_defend})

@app.route('/block_ip', methods=['POST', 'OPTIONS'])
def block_ip_endpoint():
    global connected_db
    if request.method == 'OPTIONS':
        return jsonify({'message': 'ok'})
    
    data = request.json or {}
    ip = data.get('ip')
    if ip:
        if auto_defend:
            blocked_ips.add(ip)
            
            # If SQLite is connected, execute database update query for real persistence
            if connected_db:
                db_type = connected_db.get('type')
                database = connected_db.get('database')
                if db_type == 'sqlite' and database:
                    db_path = database if os.path.exists(database) else os.path.join(os.getcwd(), database)
                    if os.path.exists(db_path):
                        try:
                            conn = sqlite3.connect(db_path)
                            cursor = conn.cursor()
                            cursor.execute("UPDATE security_incidents SET status = 'DEFENDED' WHERE ip = ?;", (ip,))
                            conn.commit()
                            conn.close()
                        except Exception as db_err:
                            print(f"Error updating incident status to DEFENDED in SQLite: {db_err}")

            return jsonify({'message': f'Blocked IP {ip}', 'blocked_ips': list(blocked_ips), 'blocked': True})
        else:
            return jsonify({'message': f'IP {ip} not blocked (defense shield disabled)', 'blocked_ips': list(blocked_ips), 'blocked': False})
    return jsonify({'error': 'No IP provided'}), 400

@app.route('/blocked_ips', methods=['GET'])
def get_blocked_ips():
    return jsonify({
        'blocked_ips': list(blocked_ips),
        'auto_defend': auto_defend
    })

@app.route('/server_info')
def server_info():
    return jsonify({'servers': servers})

if __name__ == '__main__':
    app.run(debug=True)
