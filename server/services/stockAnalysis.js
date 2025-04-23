const { spawn } = require('child_process');
const path = require('path');
const yahooFinance = require('../utils/yahooFinance');
const Stock = require('../models/Stock');

/**
 * Analyze a stock using the Python analysis script
 * @param {string} ticker - Stock ticker symbol
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {number} lookbackPeriod - Number of days to look back for prediction
 * @returns {Promise<Object>} - Analysis results
 */
const analyzeStock = (ticker, startDate, endDate, lookbackPeriod) => {
  return new Promise((resolve, reject) => {
    // Use the Python script for analysis
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../python/stockAnalysis.py'),
      ticker,
      startDate,
      endDate,
      lookbackPeriod.toString()
    ]);
    
    let dataString = '';
    
    // Collect data from script
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });
    
    // Handle errors
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });
    
    // When the script is done
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}`));
      }
      
      try {
        const results = JSON.parse(dataString);
        
        // Check for errors in the results
        if (results.error) {
          return reject(new Error(results.error));
        }
        
        // Update stock in the database
        if (results.next_day_prediction) {
          updateStockInDatabase(
            ticker,
            results.next_day_prediction.price,
            results.next_day_prediction.signal,
            results.next_day_prediction.change_percent
          );
        }
        
        resolve(results);
      } catch (error) {
        reject(new Error(`Failed to parse analysis results: ${error.message}`));
      }
    });
  });
};

/**
 * Update or create stock in the database
 * @param {string} ticker - Stock ticker symbol
 * @param {number} price - Current price
 * @param {string} signal - Trading signal
 * @param {number} changePercent - Price change percentage
 */
const updateStockInDatabase = async (ticker, price, signal, changePercent) => {
  try {
    const stockData = {
      price,
      signal,
      change_percent: changePercent
    };
    
    // Find the stock or create it
    let stock = await Stock.findOne({ ticker });
    
    if (!stock) {
      stock = new Stock({
        ticker,
        lastPrice: price,
        changePercent,
        signal
      });
    } else {
      stock.lastPrice = price;
      stock.changePercent = changePercent;
      stock.signal = signal;
      stock.updatedAt = new Date();
    }
    
    // Add prediction to history
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    stock.addPrediction(tomorrow, price, signal);
    
    // Check if this is a top mover
    if (Math.abs(changePercent) > 2) {
      stock.isTopMover = true;
    }
    
    await stock.save();
  } catch (error) {
    console.error(`Error updating stock in database: ${error.message}`);
  }
};

/**
 * Get top moving stocks from the database
 * @param {number} limit - Maximum number of stocks to return
 * @returns {Promise<Array>} - List of top moving stocks
 */
const getTopMovingStocks = async (limit = 4) => {
  try {
    // Get stocks marked as top movers, sorted by absolute change percent
    const stocks = await Stock.find({ isTopMover: true })
      .sort({ updatedAt: -1 })
      .limit(8);
    
    // If we don't have enough, also query for recently updated stocks
    if (stocks.length < limit) {
      const recentStocks = await Stock.find({
        isTopMover: false,
        updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
        .sort({ updatedAt: -1 })
        .limit(limit - stocks.length);
      
      stocks.push(...recentStocks);
    }
    
    // Format for client
    return stocks.slice(0, limit).map(stock => ({
      ticker: stock.ticker,
      price: stock.lastPrice,
      signal: stock.signal,
      change_percent: stock.changePercent
    }));
  } catch (error) {
    console.error(`Error getting top moving stocks: ${error.message}`);
    return [];
  }
};

/**
 * Update all top stocks from Yahoo Finance API
 * @param {Array<string>} tickers - List of ticker symbols to update
 * @returns {Promise<Array>} - Updated stock data
 */
const updateTopStocks = async (tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN']) => {
  try {
    const stockData = [];
    
    for (const ticker of tickers) {
      // Get current data from Yahoo Finance
      const data = await yahooFinance.getQuote(ticker);
      
      if (data) {
        // Update in database
        let stock = await Stock.findOne({ ticker });
        
        if (!stock) {
          stock = new Stock({
            ticker,
            lastPrice: data.price,
            changePercent: data.changePercent,
            signal: determineSignal(data.price, data.previousClose, data.volume),
            volume: data.volume
          });
        } else {
          // Update existing stock
          stock.lastPrice = data.price;
          stock.changePercent = data.changePercent;
          stock.signal = determineSignal(data.price, data.previousClose, data.volume);
          stock.volume = data.volume;
          stock.updatedAt = new Date();
        }
        
        // Check if it's a top mover
        if (Math.abs(data.changePercent) > 2) {
          stock.isTopMover = true;
        }
        
        await stock.save();
        
        // Add to result list
        stockData.push({
          ticker,
          price: data.price,
          signal: stock.signal,
          change_percent: data.changePercent
        });
      }
    }
    
    return stockData;
  } catch (error) {
    console.error(`Error updating top stocks: ${error.message}`);
    return [];
  }
};

/**
 * Simple signal determination based on price movement
 * This is a simplified version compared to the full analysis
 * @param {number} currentPrice - Current stock price
 * @param {number} previousClose - Previous close price
 * @param {number} volume - Trading volume
 * @returns {string} - Trading signal (BUY, SELL, NEUTRAL)
 */
const determineSignal = (currentPrice, previousClose, volume) => {
  const percentChange = ((currentPrice - previousClose) / previousClose) * 100;
  
  // Simple heuristic: large positive move with high volume is a buy signal
  if (percentChange > 2 && volume > 1000000) {
    return 'BUY';
  }
  
  // Large negative move is a sell signal
  if (percentChange < -2) {
    return 'SELL';
  }
  
  return 'NEUTRAL';
};

module.exports = {
  analyzeStock,
  getTopMovingStocks,
  updateTopStocks
};
