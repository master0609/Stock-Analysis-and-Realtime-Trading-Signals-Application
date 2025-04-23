import socketio
import eventlet
from flask import Flask
import datetime
import time
import threading
from threading import Lock

app = Flask(__name__)
sio = socketio.Server(cors_allowed_origins='*', async_mode='eventlet')
app = socketio.WSGIApp(sio, app)

connected_clients = {}
data_lock = Lock()
latest_stock_data = {
    'ticker': '',
    'price': 0.0,
    'signal': 'NEUTRAL',
    'change_percent': 0.0,
    'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    'sequence': 0
}

@sio.event
def connect(sid, environ):
    print(f"Client connected: {sid}")
    with data_lock:
        connected_clients[sid] = {'connected_at': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    if latest_stock_data['ticker']:
        sio.emit('stock_update', latest_stock_data, to=sid)

@sio.event
def disconnect(sid):
    print(f"Client disconnected: {sid}")
    with data_lock:
        if sid in connected_clients:
            del connected_clients[sid]

def update_stock_data(ticker, price, signal, change_percent):
    global latest_stock_data
    with data_lock:
        latest_stock_data = {
            'ticker': ticker,
            'price': price,
            'signal': signal,
            'change_percent': change_percent,
            'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'sequence': time.time()
        }
    sio.emit('stock_update', latest_stock_data)

@sio.on('stock_update')
def handle_stock_update(sid, data):
    try:
        update_stock_data(
            data['ticker'],
            data['price'],
            data['signal'],
            data['change_percent']
        )
    except Exception as e:
        print(f"Error handling stock update: {str(e)}")

def broadcast_thread():
    while True:
        try:
            with data_lock:
                if latest_stock_data['ticker']:
                    sio.emit('stock_update', latest_stock_data)
            time.sleep(10)
        except Exception as e:
            print(f"Broadcast error: {str(e)}")
            time.sleep(10)

if __name__ == '__main__':
    threading.Thread(target=broadcast_thread, daemon=True).start()
    print("Starting Socket.IO server...")
    eventlet.wsgi.server(eventlet.listen(('', 8001)), app)