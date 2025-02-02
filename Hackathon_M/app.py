from flask import Flask, render_template, jsonify, request
import psutil
import time

app = Flask(__name__)

servers = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/system_info')
def system_info():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory_info = psutil.virtual_memory()
    disk_usage = psutil.disk_usage('/')
    network_info = psutil.net_io_counters()

    system_data = {
        'cpu_percent': cpu_percent,
        'memory_percent': memory_info.percent,
        'disk_percent': disk_usage.percent,
        'bytes_sent': network_info.bytes_sent,
        'bytes_recv': network_info.bytes_recv
    }

    return jsonify(system_data)

@app.route('/add_server', methods=['POST'])
def add_server():
    data = request.json
    if 'server_name' in data:
        servers.append(data['server_name'])
        return jsonify({'message': 'Server added successfully', 'servers': servers})
    return jsonify({'error': 'Invalid data'}), 400

@app.route('/server_info')
def server_info():
    return jsonify({'servers': servers})

if __name__ == '__main__':
    app.run(debug=True)
