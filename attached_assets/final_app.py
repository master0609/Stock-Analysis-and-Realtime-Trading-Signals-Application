import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import datetime
from simple_stock_analysis import analyze_stock
import socketio
import threading
import time
import json
from login import login_page, logout

# Initialize Socket.IO client with client transport
sio = socketio.Client(logger=True, engineio_logger=True, reconnection=True, reconnection_attempts=10, reconnection_delay=1)

# Global variables for stock notifications
top_stocks = []
notification_count = 0

# Set page configuration
st.set_page_config(
    page_title="Stock Analysis & Prediction",
    page_icon="📈",
    layout="wide"
)

# Define Socket.IO event handlers
@sio.event
def connect():
    print("Connected to Socket.IO server")

@sio.event
def disconnect():
    print("Disconnected from Socket.IO server")

@sio.on('stock_update')
def on_stock_update(data):
    print(f"Received stock update: {data}")
    # Add the stock update to our list if it's not already there
    if isinstance(data, dict) and 'ticker' in data:
        for i, stock in enumerate(top_stocks):
            if stock['ticker'] == data['ticker']:
                top_stocks[i] = data
                break
        else:
            if len(top_stocks) >= 4:
                top_stocks.pop(0)  # Remove oldest if we already have 4
            top_stocks.append(data)

        # Increment notification counter to trigger UI update
        global notification_count
        notification_count += 1

@sio.on('top_stocks_update')
def on_top_stocks_update(data):
    print(f"Received top stocks update: {data}")
    global top_stocks, notification_count

    # Update our list of top stocks without affecting analysis
    if isinstance(data, list) and len(data) > 0:
        # Only update price and signal info
        for new_stock in data:
            for i, existing_stock in enumerate(top_stocks):
                if existing_stock['ticker'] == new_stock['ticker']:
                    top_stocks[i].update({
                        'price': new_stock['price'],
                        'signal': new_stock['signal'],
                        'change_percent': new_stock['change_percent'],
                        'timestamp': new_stock['timestamp']
                    })
                    break
            else:
                if len(top_stocks) >= 4:
                    top_stocks.pop(0)
                top_stocks.append(new_stock)
        notification_count += 1

# Socket.IO connection thread
def socketio_thread():
    while True:
        try:
            if not sio.connected:
                print("Trying to connect to Socket.IO server...")
                # Try to connect to the socket server with more stable settings
                sio.connect('http://0.0.0.0:8001', 
                    wait_timeout=60,
                    transports=['websocket'],
                    reconnection=True,
                    reconnection_attempts=10,
                    reconnection_delay=1,
                    reconnection_delay_max=5)
            time.sleep(10)
        except Exception as e:
            print(f"Socket.IO connection error: {str(e)}")
            time.sleep(5)

# Start the WebSocket thread when the app loads
if not sio.connected:
    threading.Thread(target=socketio_thread, daemon=True).start()

# Cache the analysis function to improve performance
@st.cache_data(ttl=3600)  # Cache for 1 hour
def get_stock_analysis(ticker, start_date, end_date, lookback_period):
    return analyze_stock(ticker, start_date, end_date, lookback_period)

# First, check if user is authenticated
if not login_page():
    # Exit here if not logged in
    st.stop()

# User is authenticated, show logout button in the sidebar
with st.sidebar:
    st.write(f"👤 Logged in as: **{st.session_state['username']}**")
    if st.button("Logout"):
        logout()
        st.rerun()

# Apply custom styling
st.markdown("""
# 📈 Stock Analysis & Prediction
### Using ML, Technical Indicators & Trading Signals
""")

# Add custom CSS for notification bar
st.markdown("""
<style>
.notification-bar {
    background-color: #1E1E1E;
    color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
    overflow-x: auto;
    white-space: nowrap;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    animation: fadeIn 0.5s;
    display: flex;
    justify-content: flex-start;
    align-items: center;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.stock-ticker {
    display: inline-block;
    margin-right: 20px;
    padding: 10px 18px;
    border-radius: 6px;
    background-color: #2D2D2D;
    min-width: 150px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s;
}

.stock-ticker:hover {
    transform: translateY(-3px);
}

.stock-ticker.buy {
    border-left: 6px solid #4CAF50;
    background-color: rgba(76, 175, 80, 0.1);
}

.stock-ticker.sell {
    border-left: 6px solid #F44336;
    background-color: rgba(244, 67, 54, 0.1);
}

.stock-ticker.neutral {
    border-left: 6px solid #9E9E9E;
}

.positive {
    color: #4CAF50;
    font-weight: bold;
}

.negative {
    color: #F44336;
    font-weight: bold;
}

.ticker-name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 5px;
}

.ticker-price {
    font-size: 14px;
    margin-bottom: 3px;
}

.ticker-signal {
    font-size: 12px;
    opacity: 0.8;
}
</style>
""", unsafe_allow_html=True)

# Do not auto-refresh the entire page
# We'll use socket.io to update just the notification bar

# Create hardcoded stocks for demonstration (in case WebSocket doesn't connect in time)
demo_stocks = [
    {"ticker": "AAPL", "price": 204.60, "signal": "NEUTRAL", "change_percent": -0.68},
    {"ticker": "MSFT", "price": 374.39, "signal": "NEUTRAL", "change_percent": -0.51},
    {"ticker": "AMZN", "price": 180.60, "signal": "SELL", "change_percent": -1.55},
    {"ticker": "GOOGL", "price": 155.35, "signal": "NEUTRAL", "change_percent": -0.17}
]

# Initialize session state variables if they don't exist
if 'top_stocks' not in st.session_state:
    st.session_state.top_stocks = demo_stocks

if 'notification_count' not in st.session_state:
    st.session_state.notification_count = 0

if 'last_update_time' not in st.session_state:
    st.session_state.last_update_time = datetime.datetime.now()

# Update session state if we have data from WebSocket
if top_stocks and len(top_stocks) > 0:
    # Always update when new data arrives - we're going to force a rerun
    st.session_state.top_stocks = top_stocks
    st.session_state.notification_count += 1
    st.session_state.last_update_time = datetime.datetime.now()

    # ALWAYS rerun when new data is received
    st.rerun()

# Real-time stock notification bar (use session state for rendering)
st.subheader("🔔 Real-time Market Movers")

# Extract timestamp from the most recent stock data
# Get the latest update time from the socket data
if st.session_state.top_stocks and isinstance(st.session_state.top_stocks[0], dict):
    latest_stock = st.session_state.top_stocks[0]
    update_time = latest_stock.get('server_time', datetime.datetime.now().strftime("%H:%M:%S"))
else:
    update_time = datetime.datetime.now().strftime("%H:%M:%S")

# Display update timestamp prominently at the top with animation when it changes
if 'previous_update_time' not in st.session_state:
    st.session_state.previous_update_time = update_time

if st.session_state.previous_update_time != update_time:
    # Animation effect for new updates
    st.markdown(f"""
    <div style='text-align:right; margin-bottom:10px;'>
        <div style='display:inline-block; padding:5px 10px; background-color:#2a9d8f; color:white; 
                  border-radius:4px; font-weight:bold; animation:pulse 2s infinite;'>
            ⟳ Last updated: {update_time}
        </div>
    </div>
    <style>
    @keyframes pulse {{
        0% {{ opacity: 1; transform: scale(1); }}
        50% {{ opacity: 0.8; transform: scale(1.05); }}
        100% {{ opacity: 1; transform: scale(1); }}
    }}
    </style>
    """, unsafe_allow_html=True)

    # Update previous time for next comparison
    st.session_state.previous_update_time = update_time
else:
    st.markdown(f"""
    <div style='text-align:right; margin-bottom:10px;'>
        <div style='display:inline-block; padding:5px 10px; background-color:#444; color:white; 
                  border-radius:4px;'>
            ⟳ Last updated: {update_time}
        </div>
    </div>
    """, unsafe_allow_html=True)

# Use Streamlit's built-in UI components for reliable rendering
col1, col2, col3, col4 = st.columns(4)

with col1:
    stock = st.session_state.top_stocks[0]
    signal_color = "gray"
    if stock['signal'] == 'BUY':
        signal_color = "green"
    elif stock['signal'] == 'SELL':
        signal_color = "red"

    change_color = "green" if stock.get('change_percent', 0) >= 0 else "red"
    change_symbol = "+" if stock.get('change_percent', 0) >= 0 else ""

    st.markdown(f"<div style='padding:10px; border-radius:5px; background-color:#2D2D2D; border-left:4px solid {signal_color};'>", unsafe_allow_html=True)
    st.markdown(f"<h3 style='text-align:center; margin:0;'>{stock['ticker']}</h3>", unsafe_allow_html=True)
    st.markdown(f"<div style='text-align:center; font-size:16px;'>${stock.get('price', 0):.2f} <span style='color:{change_color};'>{change_symbol}{stock.get('change_percent', 0):.2f}%</span></div>", unsafe_allow_html=True)
    st.markdown(f"<div style='text-align:center; font-size:14px;'>Signal: {stock['signal']}</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

with col2:
    stock = st.session_state.top_stocks[1]
    signal_color = "gray"
    if stock['signal'] == 'BUY':
        signal_color = "green"
    elif stock['signal'] == 'SELL':
        signal_color = "red"

    change_color = "green" if stock.get('change_percent', 0) >= 0 else "red"
    change_symbol = "+" if stock.get('change_percent', 0) >= 0 else ""

    st.markdown(f"<div style='padding:10px; border-radius:5px; background-color:#2D2D2D; border-left:4px solid {signal_color};'>", unsafe_allow_html=True)
    st.markdown(f"<h3 style='text-align:center; margin:0;'>{stock['ticker']}</h3>", unsafe_allow_html=True)
    st.markdown(f"<div style='text-align:center; font-size:16px;'>${stock.get('price', 0):.2f} <span style='color:{change_color};'>{change_symbol}{stock.get('change_percent', 0):.2f}%</span></div>", unsafe_allow_html=True)
    st.markdown(f"<div style='text-align:center; font-size:14px;'>Signal: {stock['signal']}</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

with col3:
    stock = st.session_state.top_stocks[2]
    signal_color = "gray"
    if stock['signal'] == 'BUY':
        signal_color = "green"
    elif stock['signal'] == 'SELL':
        signal_color = "red"

    change_color = "green" if stock.get('change_percent', 0) >= 0 else "red"
    change_symbol = "+" if stock.get('change_percent', 0) >= 0 else ""

    st.markdown(f"<div style='padding:10px; border-radius:5px; background-color:#2D2D2D; border-left:4px solid {signal_color};'>", unsafe_allow_html=True)
    st.markdown(f"<h3 style='text-align:center; margin:0;'>{stock['ticker']}</h3>", unsafe_allow_html=True)
    st.markdown(f"<div style='text-align:center; font-size:16px;'>${stock.get('price', 0):.2f} <span style='color:{change_color};'>{change_symbol}{stock.get('change_percent', 0):.2f}%</span></div>", unsafe_allow_html=True)
    st.markdown(f"<div style='text-align:center; font-size:14px;'>Signal: {stock['signal']}</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

with col4:
    stock = st.session_state.top_stocks[3]
    signal_color = "gray"
    if stock['signal'] == 'BUY':
        signal_color = "green"
    elif stock['signal'] == 'SELL':
        signal_color = "red"

    change_color = "green" if stock.get('change_percent', 0) >= 0 else "red"
    change_symbol = "+" if stock.get('change_percent', 0) >= 0 else ""

    st.markdown(f"<div style='padding:10px; border-radius:5px; background-color:#2D2D2D; border-left:4px solid {signal_color};'>", unsafe_allow_html=True)
    st.markdown(f"<h3 style='text-align:center; margin:0;'>{stock['ticker']}</h3>", unsafe_allow_html=True)
    st.markdown(f"<div style='text-align:center; font-size:16px;'>${stock.get('price', 0):.2f} <span style='color:{change_color};'>{change_symbol}{stock.get('change_percent', 0):.2f}%</span></div>", unsafe_allow_html=True)
    st.markdown(f"<div style='text-align:center; font-size:14px;'>Signal: {stock['signal']}</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

# Add a refresh button for manual refresh
if st.button("Refresh Stocks", key="manual_refresh"):
    st.rerun()

# Sidebar for user inputs
with st.sidebar:
    st.header("Input Parameters")

    # Stock ticker input
    ticker = st.text_input("Stock Ticker Symbol", value="AAPL").upper()

    # Date range selection
    today = datetime.date.today()
    one_year_ago = today - datetime.timedelta(days=365)

    start_date = st.date_input("Start Date", value=one_year_ago)
    end_date = st.date_input("End Date", value=today)

    # Convert dates to string format
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")

    # Advanced parameters
    st.subheader("Model Parameters")
    lookback_period = st.slider("Lookback Period (Days)", 
                               min_value=10, max_value=120, 
                               value=30, step=5)

    # Run analysis button
    analyze_button = st.button("Run Analysis", type="primary")

# Main content
if analyze_button:
    if start_date >= end_date:
        st.error("Error: Start date must be before end date.")
    else:
        with st.spinner(f"Analyzing {ticker} stock data..."):
            # Run the analysis
            results = get_stock_analysis(
                ticker, start_date_str, end_date_str, lookback_period
            )

            if "error" in results:
                st.error(results["error"])
            else:
                # Send data via WebSocket if available
                if 'next_day_prediction' in results and sio.connected:
                    try:
                        next_pred = results['next_day_prediction']
                        sio.emit('stock_update', {
                            'ticker': ticker,
                            'price': next_pred['price'],
                            'signal': next_pred['signal'],
                            'change_percent': next_pred['change_percent']
                        })
                    except Exception as e:
                        print(f"Error sending WebSocket update: {str(e)}")

                # Display next day prediction prominently
                if 'next_day_prediction' in results:
                    next_pred = results['next_day_prediction']

                    # Create a highlighted box for the prediction
                    st.markdown("""
                    <style>
                    .prediction-box {
                        padding: 20px;
                        border-radius: 5px;
                        background-color: #f0f8ff;
                        border-left: 5px solid #1e90ff;
                        margin-bottom: 20px;
                    }
                    </style>
                    """, unsafe_allow_html=True)

                    col1, col2 = st.columns([3, 1])

                    with col1:
                        st.markdown('<div class="prediction-box">', unsafe_allow_html=True)
                        st.subheader(f"🔮 Next Trading Day Prediction ({next_pred['date']})")

                        price_color = "green" if next_pred['change_percent'] >= 0 else "red"
                        change_symbol = "+" if next_pred['change_percent'] >= 0 else ""

                        st.markdown(f"""
                        ### Predicted Price: ${next_pred['price']:.2f} 
                        <span style='color:{price_color}'>{change_symbol}{next_pred['change_percent']}%</span>
                        """, unsafe_allow_html=True)

                        # Add predicted trading signal
                        signal_color = {
                            "BUY": "green",
                            "SELL": "red",
                            "NEUTRAL": "gray"
                        }.get(next_pred['signal'], "gray")

                        st.markdown(f"""
                        ### Predicted Signal: <span style='color:{signal_color}'>{next_pred['signal']}</span>
                        """, unsafe_allow_html=True)

                        st.markdown('</div>', unsafe_allow_html=True)

                    with col2:
                        # Show model confidence
                        accuracy = 100 - results['accuracy_metrics']['Mean Absolute Percentage Error (MAPE)']
                        accuracy = max(0, min(accuracy, 100))  # Ensure it's between 0-100

                        st.markdown('<div style="text-align:center; padding-top:20px">', unsafe_allow_html=True)
                        st.markdown("### Model Confidence")

                        # Simple confidence indicator
                        confidence_color = "red"
                        if accuracy >= 90:
                            confidence_color = "green"
                        elif accuracy >= 70:
                            confidence_color = "orange"

                        st.markdown(f"""
                        <div style="font-size:24px; color:{confidence_color}; font-weight:bold;">
                        {accuracy:.1f}%
                        </div>
                        """, unsafe_allow_html=True)
                        st.markdown('</div>', unsafe_allow_html=True)

                # Display results in tabs
                tab1, tab2, tab3, tab4 = st.tabs(["Stock Overview", "Price Prediction", "Technical Analysis", "Trading Signals"])

                with tab1:
                    # Basic stock info and performance
                    st.subheader(f"{ticker} Stock Overview")

                    # Display stock info in two columns
                    col1, col2 = st.columns(2)

                    with col1:
                        st.markdown(f"**Ticker:** {ticker}")
                        st.markdown(f"**Analysis Period:** {start_date} to {end_date}")

                    with col2:
                        # Calculate basic stats
                        stock_data = results['stock_data']
                        # Convert to float to avoid Series formatting issues - using proper method
                        start_price = float(stock_data['Close'].iloc[0])
                        end_price = float(stock_data['Close'].iloc[-1])
                        percent_change = ((end_price - start_price) / start_price) * 100

                        st.markdown(f"**Starting Price:** ${start_price:.2f}")
                        st.markdown(f"**Current Price:** ${end_price:.2f}")

                        if percent_change > 0:
                            st.markdown(f"**Change:** +{percent_change:.2f}% 📈")
                        else:
                            st.markdown(f"**Change:** {percent_change:.2f}% 📉")

                    # Price history chart
                    st.subheader("Price History")

                    fig, ax = plt.subplots(figsize=(10, 6))
                    ax.plot(results['dates'], results['prices'], label='Price')

                    # Format the chart
                    ax.set_title(f"{ticker} Price History", fontsize=16)
                    ax.set_xlabel('Date', fontsize=12)
                    ax.set_ylabel('Price ($)', fontsize=12)
                    ax.grid(True, alpha=0.3)
                    ax.legend()

                    st.pyplot(fig)

                    # Volume chart
                    st.subheader("Trading Volume")

                    fig, ax = plt.subplots(figsize=(10, 4))
                    # Convert volume to numpy array properly
                    volume = results['stock_data']['Volume'].values.flatten()
                    ax.bar(results['dates'], volume, alpha=0.7, color='#2E86C1')

                    # Format the chart
                    ax.set_title(f"{ticker} Trading Volume", fontsize=16)
                    ax.set_xlabel('Date', fontsize=12)
                    ax.set_ylabel('Volume', fontsize=12)
                    ax.grid(True, alpha=0.3)

                    st.pyplot(fig)

                with tab2:
                    st.subheader("ML Price Prediction")

                    # Prediction vs Actual Price chart
                    fig, ax = plt.subplots(figsize=(10, 6))
                    ax.plot(results['dates'], results['prices'], label='Actual Price', color='blue')
                    ax.plot(results['dates'], results['predictions'], label='Predicted Price', color='red', linestyle='--')

                    # Add the next day prediction point
                    if 'next_day_prediction' in results:
                        next_date = pd.to_datetime(results['next_day_prediction']['date'])
                        next_price = results['next_day_prediction']['price']

                        ax.scatter([next_date], [next_price], color='green', s=100, zorder=5, 
                                  label='Next Day Prediction')

                        # Add annotation for next day prediction
                        ax.annotate(f"${next_price:.2f}", 
                                   (next_date, next_price),
                                   xytext=(10, 10),
                                   textcoords='offset points',
                                   arrowprops=dict(arrowstyle='->', color='green'),
                                   color='green',
                                   fontweight='bold')

                    # Format the chart
                    ax.set_title(f"{ticker} - Actual vs Predicted Prices", fontsize=16)
                    ax.set_xlabel('Date', fontsize=12)
                    ax.set_ylabel('Price ($)', fontsize=12)
                    ax.grid(True, alpha=0.3)
                    ax.legend()

                    st.pyplot(fig)

                    # Next day prediction details
                    if 'next_day_prediction' in results:
                        st.subheader("Next Trading Day Forecast Details")

                        col1, col2, col3 = st.columns(3)

                        with col1:
                            st.metric(label="Date", value=results['next_day_prediction']['date'])

                        with col2:
                            st.metric(label="Predicted Price", 
                                     value=f"${results['next_day_prediction']['price']:.2f}")

                        with col3:
                            # Format with plus sign for positive changes
                            change = results['next_day_prediction']['change_percent']
                            if change >= 0:
                                change_display = f"+{change:.2f}%"
                            else:
                                change_display = f"{change:.2f}%"

                            st.metric(label="Change from Last Price", 
                                     value=change_display,
                                     delta=change_display)

                    # Model Accuracy Metrics
                    st.subheader("Model Performance Metrics")

                    metrics = results['accuracy_metrics']
                    metrics_df = pd.DataFrame({
                        'Metric': list(metrics.keys()),
                        'Value': list(metrics.values())
                    })

                    st.table(metrics_df.set_index('Metric'))



                with tab3:
                    st.subheader("Technical Indicators")

                    # EMA Chart
                    st.write("### Exponential Moving Averages (EMA)")

                    fig, ax = plt.subplots(figsize=(10, 6))
                    ax.plot(results['dates'], results['prices'], label='Price', alpha=0.7)
                    ax.plot(results['dates'], results['ema_20'], label='EMA 20', color='orange')
                    ax.plot(results['dates'], results['ema_50'], label='EMA 50', color='green')

                    # Format the chart
                    ax.set_title(f"{ticker} - Price and EMA", fontsize=16)
                    ax.set_xlabel('Date', fontsize=12)
                    ax.set_ylabel('Price ($)', fontsize=12)
                    ax.grid(True, alpha=0.3)
                    ax.legend()

                    st.pyplot(fig)

                    # RSI Chart
                    st.write("### Relative Strength Index (RSI)")

                    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8), gridspec_kw={'height_ratios': [3, 1]})

                    # Price chart
                    ax1.plot(results['dates'], results['prices'], label='Price')
                    ax1.set_title(f"{ticker} - Price", fontsize=16)
                    ax1.grid(True, alpha=0.3)
                    ax1.legend()

                    # RSI chart
                    ax2.plot(results['dates'], results['rsi'], label='RSI', color='purple')
                    ax2.axhline(y=70, color='r', linestyle='--', alpha=0.5)
                    ax2.axhline(y=30, color='g', linestyle='--', alpha=0.5)
                    ax2.fill_between(results['dates'], results['rsi'], 70, 
                                    where=(results['rsi'] >= 70), 
                                    color='red', alpha=0.3)
                    ax2.fill_between(results['dates'], results['rsi'], 30, 
                                    where=(results['rsi'] <= 30), 
                                    color='green', alpha=0.3)
                    ax2.set_title('RSI (14)', fontsize=16)
                    ax2.set_ylim(0, 100)
                    ax2.grid(True, alpha=0.3)

                    plt.tight_layout()
                    st.pyplot(fig)

                with tab4:
                    st.subheader("Trading Signals")

                    # Plot price with buy/sell signals
                    fig, ax = plt.subplots(figsize=(10, 6))
                    ax.plot(results['dates'], results['prices'], label='Price', alpha=0.7)

                    # Find buy and sell signal indices
                    buy_signals = [i for i in range(len(results['signals'])) if results['signals'][i] == 1]
                    sell_signals = [i for i in range(len(results['signals'])) if results['signals'][i] == -1]

                    # Plot buy and sell signals
                    if buy_signals:
                        ax.scatter([results['dates'][i] for i in buy_signals],
                                  [results['prices'][i] for i in buy_signals],
                                  marker='^', color='green', s=100, label='Buy')

                    if sell_signals:
                        ax.scatter([results['dates'][i] for i in sell_signals],
                                  [results['prices'][i] for i in sell_signals],
                                  marker='v', color='red', s=100, label='Sell')

                    # Plot next day prediction if available
                    if 'next_day_prediction' in results:
                        next_date = pd.to_datetime(results['next_day_prediction']['date'])
                        next_price = results['next_day_prediction']['price']
                        signal = results['next_day_prediction']['signal']

                        marker = 'o'
                        color = 'blue'
                        if signal == 'BUY':
                            marker = '^'
                            color = 'green'
                        elif signal == 'SELL':
                            marker = 'v'
                            color = 'red'

                        ax.scatter([next_date], [next_price], marker=marker, color=color, 
                                  s=150, label=f'Next Day ({signal})', edgecolors='black')

                    # Format the chart
                    ax.set_title(f"{ticker} - Trading Signals", fontsize=16)
                    ax.set_xlabel('Date', fontsize=12)
                    ax.set_ylabel('Price ($)', fontsize=12)
                    ax.grid(True, alpha=0.3)
                    ax.legend()

                    st.pyplot(fig)

                    # Display recent signals - UPDATED
                    st.subheader("Recent Trading Signals")

                    # Add next day prediction to the signals if available
                    if 'next_day_prediction' in results:
                        next_pred = results['next_day_prediction']
                        if next_pred['signal'] != 'NEUTRAL':
                            predicted_signal = {
                                'date': next_pred['date'] + ' (Predicted)',
                                'type': next_pred['signal'],
                                'price': next_pred['price']
                            }

                            # Create a copy to avoid modifying the cached results
                            display_signals = results['recent_signals'].copy()
                            display_signals.append(predicted_signal)
                        else:
                            display_signals = results['recent_signals']
                    else:
                        display_signals = results['recent_signals']

                    if display_signals:
                        # Create a DataFrame for recent signals
                        signal_df = pd.DataFrame(display_signals)
                        st.dataframe(signal_df, use_container_width=True)
                    else:
                        # Provide more insight when no signals are found
                        st.warning("No trading signals generated in the last 20 days. This could be due to:")
                        st.markdown("""
                        - The stock is trading in a stable range (RSI between 40-60)
                        - No significant crossovers between price and 20-day EMA
                        - Low volatility in the recent price action
                        """)

                        # Add a debug section to help identify why no signals are generated
                        with st.expander("Debug Information"):
                            if 'signal_stats' in results:
                                st.write(f"Total signals generated: {results['signal_stats']['total_signals']}")
                                st.write(f"Buy signals: {results['signal_stats']['buy_signals']}")
                                st.write(f"Sell signals: {results['signal_stats']['sell_signals']}")
                                st.write(f"RSI range: Min {results['signal_stats']['min_rsi']:.2f}, Max {results['signal_stats']['max_rsi']:.2f}")

                            if len(results['rsi']) > 20:
                                recent_rsi = results['rsi'][-20:]
                                st.write(f"Recent RSI range: Min {min(recent_rsi):.2f}, Max {max(recent_rsi):.2f}")

                                # Check if any values are near thresholds
                                near_overbought = any(r > 60 for r in recent_rsi)
                                near_oversold = any(r < 40 for r in recent_rsi)

                                st.write(f"Any RSI values above 60 (sell threshold): {near_overbought}")
                                st.write(f"Any RSI values below 40 (buy threshold): {near_oversold}")

                    # Display signal explanation with updated thresholds
                    st.subheader("Signal Generation Rules")
                    st.markdown("""
                    - **Buy Signal**: RSI is below 40 OR price crosses above 20-day EMA
                    - **Sell Signal**: RSI is above 60 OR price crosses below 20-day EMA
                    """)

                    # Display total signals generated
                    if 'signal_stats' in results:
                        st.info(f"Total signals generated in analysis period: {results['signal_stats']['total_signals']} (Buy: {results['signal_stats']['buy_signals']}, Sell: {results['signal_stats']['sell_signals']})")
else:
    # Default display when app first loads
    st.write("👈 Please configure analysis parameters and click 'Run Analysis'")

    # Add some helpful instructions
    st.subheader("How to use this app:")

    st.markdown("""
    1. Enter a valid stock ticker symbol in the sidebar (e.g., AAPL, MSFT, AMZN)
    2. Select your desired date range for analysis
    3. Adjust the lookback period if needed
    4. Click 'Run Analysis' to generate predictions and insights

    The app will analyze the stock using:
    - Machine Learning predictions with Random Forest including next trading day forecast
    - Technical indicators (EMAs and RSI)
    - Trading signals based on RSI and EMA
    """)

    st.info("This analysis is for educational purposes only and should not be considered financial advice.")