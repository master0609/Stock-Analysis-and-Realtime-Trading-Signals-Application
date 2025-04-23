# This file should be saved as socketio_bridge.py

import requests
import json
import threading
import time
import os

# Default server URL
SOCKET_SERVER_URL = os.environ.get('SOCKET_SERVER_URL', 'http://localhost:8001')

def update_stock_data(ticker, price, signal, change_percent):
    """
    Send stock data updates to the Socket.IO server
    
    Args:
        ticker (str): Stock ticker symbol
        price (float): Latest stock price
        signal (str): Trading signal (BUY, SELL, NEUTRAL)
        change_percent (float): Price change percentage
    """
    try:
        data = {
            'ticker': ticker,
            'price': float(price),
            'signal': signal,
            'change_percent': float(change_percent)
        }
        
        # Make a simple HTTP request to a custom endpoint
        # In a production app, you would use python-socketio client
        response = requests.post(
            f"{SOCKET_SERVER_URL}/update_stock",
            json=data
        )
        
        if response.status_code == 200:
            print(f"Successfully sent update for {ticker}")
        else:
            print(f"Failed to send update: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Error sending stock update: {str(e)}")