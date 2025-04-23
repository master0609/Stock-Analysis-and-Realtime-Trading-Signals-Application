
import socketio
import eventlet
from flask import Flask
import datetime
import time
import threading
from threading import Lock
import yfinance as yf

app = Flask(__name__)
sio = socketio.Server(cors_allowed_origins='*', async_mode='eventlet')
app = socketio.WSGIApp(sio, app)

connected_clients = {}
data_lock = Lock()
latest_stock_data = {}

@sio.event
def connect(sid, environ):
    print(f"Client connected: {sid}")
    with data_lock:
        connected_clients[sid] = {'connected_at': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    if latest_stock_data:
        sio.emit('stock_update', latest_stock_data, to=sid)

@sio.event
def disconnect(sid):
    print(f"Client disconnected: {sid}")
    with data_lock:
        if sid in connected_clients:
            del connected_clients[sid]

def fetch_stock_data():
    top_stocks = ['AAPL', 'MSFT', 'AMZN', 'GOOGL']
    while True:
        try:
            updated_stocks = []
            current_time = datetime.datetime.now().strftime("%H:%M:%S")
            for ticker in top_stocks:
                try:
                    stock = yf.Ticker(ticker)
                    data = stock.history(period="1d", interval="1m")
                    if not data.empty:
                        current_price = float(data['Close'].iloc[-1])
                        open_price = float(data['Open'].iloc[0])
                        change_percent = ((current_price - open_price) / open_price) * 100
                        
                        signal = 'NEUTRAL'
                        if change_percent > 1.5:
                            signal = 'BUY'
                        elif change_percent < -1.5:
                            signal = 'SELL'
                        
                        stock_data = {
                            'ticker': ticker,
                            'price': round(current_price, 2),
                            'signal': signal,
                            'change_percent': round(change_percent, 2),
                            'timestamp': current_time,
                            'server_time': current_time
                        }
                        
                        with data_lock:
                            latest_stock_data[ticker] = stock_data
                        updated_stocks.append(stock_data)
                except Exception as e:
                    print(f"Error fetching data for {ticker}: {str(e)}")
            
            if updated_stocks:
                sio.emit('top_stocks_update', updated_stocks)
        except Exception as e:
            print(f"Error in stock update thread: {str(e)}")
        time.sleep(10)

if __name__ == "__main__":
    # Start the stock data thread
    threading.Thread(target=fetch_stock_data, daemon=True).start()
    # Run the server on 0.0.0.0 to make it accessible
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 8001)), app)
