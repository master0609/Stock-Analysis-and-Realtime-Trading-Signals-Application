import eventlet
eventlet.monkey_patch()

from flask import Flask, request
from flask_socketio import SocketIO, emit
import yfinance as yf
import time
import threading
import random
import logging
import os
import json
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create Flask app and SocketIO server
app = Flask(__name__)
app.config['SECRET_KEY'] = 'stockanalysis'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Store connected clients
connected_clients = {}
# Tracked stocks
top_stocks = ['AAPL', 'MSFT', 'AMZN', 'GOOGL']
# Store the latest stock data
latest_stock_data = {}

@app.route('/')
def index():
    return "Stock Analysis WebSocket Server"

@socketio.on('connect')
def handle_connect():
    client_id = request.sid
    logger.info(f"Client connected: {client_id}")
    connected_clients[client_id] = {
        'connected_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Send initial stock data if available
    if latest_stock_data:
        emit('top_stocks_update', list(latest_stock_data.values()), to=client_id)

@socketio.on('disconnect')
def handle_disconnect():
    client_id = request.sid
    logger.info(f"Client disconnected: {client_id}")
    if client_id in connected_clients:
        del connected_clients[client_id]

@socketio.on('stock_update')
def handle_stock_update(data):
    logger.info(f"Received stock update: {data}")
    try:
        ticker = data.get('ticker')
        price = data.get('price')
        signal = data.get('signal', 'NEUTRAL')
        change_percent = data.get('change_percent', 0)
        
        if ticker and price:
            # Update the stock data
            latest_stock_data[ticker] = {
                'ticker': ticker,
                'price': float(price),
                'signal': signal,
                'change_percent': float(change_percent),
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            # Broadcast to all clients
            socketio.emit('stock_update', latest_stock_data[ticker])
            logger.info(f"Broadcasted {ticker} update to all clients")
    except Exception as e:
        logger.error(f"Error handling stock update: {str(e)}")

def fetch_stock_data():
    """Fetch real-time stock data from Yahoo Finance API"""
    while True:
        try:
            logger.info("Fetching stock updates...")
            updated_stocks = []
            
            for ticker in top_stocks:
                try:
                    # Get real data from Yahoo Finance
                    stock = yf.Ticker(ticker)
                    data = stock.history(period="1d")
                    
                    if not data.empty:
                        current_price = float(data['Close'].iloc[-1])
                        open_price = float(data['Open'].iloc[-1])
                        change_percent = ((current_price - open_price) / open_price) * 100
                        
                        # Determine signal based on price movement
                        signal = 'NEUTRAL'
                        if change_percent > 1.5:
                            signal = 'BUY'
                        elif change_percent < -1.5:
                            signal = 'SELL'
                        
                        # Store the stock data
                        stock_data = {
                            'ticker': ticker,
                            'price': current_price,
                            'signal': signal,
                            'change_percent': round(change_percent, 2),
                            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        }
                        
                        latest_stock_data[ticker] = stock_data
                        updated_stocks.append(stock_data)
                        logger.info(f"Updated {ticker}: ${current_price:.2f} ({change_percent:.2f}%)")
                    
                except Exception as e:
                    logger.error(f"Error fetching data for {ticker}: {str(e)}")
            
            # Broadcast updates to all clients
            if updated_stocks:
                socketio.emit('top_stocks_update', updated_stocks)
                logger.info(f"Broadcasted updates for {len(updated_stocks)} stocks to all clients")
            
            # Sleep for 10 seconds before the next update
            time.sleep(10)
            
        except Exception as e:
            logger.error(f"Error in stock update thread: {str(e)}")
            time.sleep(10)  # On error, wait and try again

if __name__ == "__main__":
    # Start the stock data thread
    threading.Thread(target=fetch_stock_data, daemon=True).start()
    logger.info("Starting WebSocket server on port 8001...")
    socketio.run(app, host='0.0.0.0', port=8001)