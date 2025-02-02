from flask import Flask, render_template, jsonify, request
import psutil
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('resource_management.html')

@app.route('/system_info')
def system_info():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory_info = psutil.virtual_memory()
    disk_usage = psutil.disk_usage('/')
    network_info = psutil.net_io_counters()

    # Identify heavy processes (CPU usage > 10%)
    processes = []
    for proc in psutil.process_iter(attrs=['pid', 'name', 'cpu_percent']):
        proc_info = proc.info
        if proc_info['cpu_percent'] > 10:
            processes.append(f"{proc_info['name']} (PID: {proc_info['pid']})")

    system_data = {
        'cpu_percent': cpu_percent,
        'memory_percent': memory_info.percent,
        'disk_percent': disk_usage.percent,
        'bytes_sent': network_info.bytes_sent,
        'bytes_recv': network_info.bytes_recv,
        'heavy_processes': processes
    }

    return jsonify(system_data)

@app.route('/kill_processes', methods=['POST'])
def kill_processes():
    for proc in psutil.process_iter(attrs=['pid', 'cpu_percent']):
        if proc.info['cpu_percent'] > 10:
            try:
                os.kill(proc.info['pid'], 9)  # Force kill the process
            except Exception as e:
                return jsonify({'message': f"Error killing process: {e}"}), 500

    return jsonify({'message': "Heavy processes killed successfully!"})

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=8080, debug=True)
