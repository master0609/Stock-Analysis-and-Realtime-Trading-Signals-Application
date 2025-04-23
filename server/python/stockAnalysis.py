import numpy as np
import pandas as pd
import yfinance as yfn
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.ensemble import RandomForestRegressor
from scipy.signal import argrelextrema
from datetime import datetime, timedelta
import sys
import json

def calculate_ema(prices, period):
    """Calculate Exponential Moving Average"""
    # Make sure prices is a 1D array
    prices = np.array(prices).flatten()
    return pd.Series(prices).ewm(span=period, adjust=False).mean().values

def calculate_rsi(prices, period=14):
    """Calculate Relative Strength Index"""
    # Make sure prices is a 1D array
    prices = np.array(prices).flatten()
    
    # Calculate price changes
    deltas = np.diff(prices)
    seed = deltas[:period+1]
    
    # Handle potential zero values in the denominator
    up = seed[seed >= 0].sum()/period
    down = -seed[seed < 0].sum()/period
    
    # Avoid division by zero
    if down == 0:
        rs = 100.0
    else:
        rs = up/down
    
    rsi = np.zeros_like(prices)
    rsi[:period] = 100. - 100./(1. + rs)
    
    # Calculate RSI based on smoothed averages
    for i in range(period, len(prices)):
        delta = deltas[i-1]
        if delta > 0:
            upval = delta
            downval = 0.
        else:
            upval = 0.
            downval = -delta
            
        up = (up * (period - 1) + upval) / period
        down = (down * (period - 1) + downval) / period
        
        # Avoid division by zero
        if down == 0:
            rs = 100.0
        else:
            rs = up/down
            
        rsi[i] = 100. - 100./(1. + rs)
        
    return rsi

def analyze_stock(ticker, start_date, end_date, lookback_period=60):
    """Analyze stock with a simple predictive model"""
    try:
        # Fetch stock data
        stock_data = yfn.download(ticker, start=start_date, end=end_date)
        
        if stock_data.empty:
            return {"error": f"No data available for {ticker}"}
            
        # Extract prices and dates
        prices = stock_data['Close'].values.flatten()  # Ensure 1D array
        dates = stock_data.index
        
        if len(prices) < lookback_period:
            return {"error": f"Insufficient data points. Need at least {lookback_period}."}
            
        # Calculate indicators
        ema_20 = calculate_ema(prices, 20)
        ema_50 = calculate_ema(prices, 50)
        rsi = calculate_rsi(prices)
        
        # Prepare data for prediction model
        X = []
        y = []
        
        for i in range(lookback_period, len(prices)):
            X.append(prices[i-lookback_period:i])
            y.append(prices[i])
            
        X = np.array(X)
        y = np.array(y)
        
        # Split into training and testing
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        # Train a model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Make predictions
        predictions = np.zeros_like(prices)
        
        # For the first lookback_period days, prediction is just the price
        predictions[:lookback_period] = prices[:lookback_period]
        
        # For the rest, use the model
        test_predictions = model.predict(X_test)
        predictions[lookback_period+train_size:] = test_predictions
        
        # For the training part, we'll just use the training data but offset
        predictions[lookback_period:lookback_period+train_size] = y_train
        
        # Calculate accuracy metrics
        mse = mean_squared_error(y_test, test_predictions)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, test_predictions)
        r2 = r2_score(y_test, test_predictions)
        
        # Calculate percentage error
        percentage_error = np.mean(np.abs((y_test - test_predictions) / y_test)) * 100
        
        # Predict next day's price
        next_day_X = prices[-lookback_period:].reshape(1, -1)
        next_day_price = float(model.predict(next_day_X)[0])
        
        # Calculate next date (assuming next business day)
        last_date = dates[-1]
        next_date = last_date + pd.Timedelta(days=1)
        
        # If the next day is a weekend, move to Monday
        if next_date.weekday() >= 5:  # 5 is Saturday, 6 is Sunday
            days_to_add = 7 - next_date.weekday() + 0  # Days until Monday
            next_date = last_date + pd.Timedelta(days=days_to_add)
            
        # Format next date as string
        next_date_str = next_date.strftime('%Y-%m-%d')
        
        # Calculate percentage change from last price
        last_price = prices[-1]
        price_change = ((next_day_price - last_price) / last_price) * 100
        
        # Identify buy/sell signals based on RSI and EMA crossover
        signals = np.zeros_like(prices)
        
        for i in range(1, len(prices)):
            # Buy signal: RSI is below 40 OR price crosses above 20 EMA
            if (rsi[i] < 40) or (prices[i] > ema_20[i] and prices[i-1] <= ema_20[i-1]):
                signals[i] = 1
                
            # Sell signal: RSI is above 60 OR price crosses below 20 EMA
            elif (rsi[i] > 60) or (prices[i] < ema_20[i] and prices[i-1] >= ema_20[i-1]):
                signals[i] = -1
                
        # Find recent signals
        recent_signals = []
        for i in range(max(0, len(signals)-20), len(signals)):  # Ensure we don't go out of bounds
            if signals[i] == 1:
                recent_signals.append({
                    'date': dates[i].strftime('%Y-%m-%d'),
                    'type': 'BUY',
                    'price': round(prices[i], 2)
                })
            elif signals[i] == -1:
                recent_signals.append({
                    'date': dates[i].strftime('%Y-%m-%d'),
                    'type': 'SELL',
                    'price': round(prices[i], 2)
                })
        
        # Predict signal for next day based on predicted price
        next_day_signal = "NEUTRAL"
        if len(prices) > 1 and len(ema_20) > 1:
            if (next_day_price > ema_20[-1] and prices[-1] <= ema_20[-1]):
                next_day_signal = "BUY"
            elif (next_day_price < ema_20[-1] and prices[-1] >= ema_20[-1]):
                next_day_signal = "SELL"
        
        # Add debug info
        signal_count = np.sum(signals != 0)
        buy_count = np.sum(signals == 1)
        sell_count = np.sum(signals == -1)
        
        # Prepare data for JSON
        dates_str = [d.strftime('%Y-%m-%d') for d in dates]
        
        # Convert stock_data to a serializable format
        stock_data_json = {}
        for col in stock_data.columns:
            stock_data_json[col] = stock_data[col].tolist()
        
        # Return the results
        result = {
            'ticker': ticker,
            'stock_data': stock_data_json,
            'prices': prices.tolist(),
            'dates': dates_str,
            'predictions': predictions.tolist(),
            'ema_20': ema_20.tolist(),
            'ema_50': ema_50.tolist(),
            'rsi': rsi.tolist(),
            'signals': signals.tolist(),
            'recent_signals': recent_signals,
            'accuracy_metrics': {
                'Mean Squared Error (MSE)': mse,
                'Root Mean Squared Error (RMSE)': rmse,
                'Mean Absolute Error (MAE)': mae,
                'R-squared (R2) Score': r2,
                'Mean Absolute Percentage Error (MAPE)': percentage_error
            },
            # Add signal stats to help with debugging
            'signal_stats': {
                'total_signals': int(signal_count),
                'buy_signals': int(buy_count),
                'sell_signals': int(sell_count),
                'min_rsi': float(np.min(rsi)),
                'max_rsi': float(np.max(rsi))
            },
            # Next day prediction data
            'next_day_prediction': {
                'date': next_date_str,
                'price': round(next_day_price, 2),
                'change_percent': round(price_change, 2),
                'signal': next_day_signal
            }
        }
        
        return result
        
    except Exception as e:
        return {"error": f"Error analyzing stock: {str(e)}"}

if __name__ == "__main__":
    # Get arguments from command line
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Not enough arguments"}))
        sys.exit(1)
        
    ticker = sys.argv[1]
    start_date = sys.argv[2]
    end_date = sys.argv[3] if len(sys.argv) > 3 else datetime.now().strftime('%Y-%m-%d')
    lookback_period = int(sys.argv[4]) if len(sys.argv) > 4 else 30
    
    # Run analysis
    result = analyze_stock(ticker, start_date, end_date, lookback_period)
    
    # Output as JSON
    print(json.dumps(result))
