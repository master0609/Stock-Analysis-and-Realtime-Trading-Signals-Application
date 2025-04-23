/**
 * Calculate Exponential Moving Average
 * @param {Array<number>} prices - Array of price values
 * @param {number} period - EMA period
 * @returns {Array<number>} - EMA values
 */
const calculateEMA = (prices, period) => {
  const k = 2 / (period + 1);
  const emaArray = [prices[0]];
  
  for (let i = 1; i < prices.length; i++) {
    emaArray.push(prices[i] * k + emaArray[i - 1] * (1 - k));
  }
  
  return emaArray;
};

/**
 * Calculate Relative Strength Index
 * @param {Array<number>} prices - Array of price values
 * @param {number} period - RSI period
 * @returns {Array<number>} - RSI values
 */
const calculateRSI = (prices, period = 14) => {
  const rsi = [];
  const deltas = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    deltas.push(prices[i] - prices[i - 1]);
  }
  
  // Initial values
  const seed = deltas.slice(0, period + 1);
  let up = seed.filter(x => x >= 0).reduce((a, b) => a + b, 0) / period;
  let down = -seed.filter(x => x < 0).reduce((a, b) => a + b, 0) / period;
  
  // Avoid division by zero
  let rs = down === 0 ? 100 : up / down;
  
  // Calculate initial RSI
  for (let i = 0; i < period; i++) {
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  // Calculate RSI for the rest of the data
  for (let i = period; i < prices.length; i++) {
    const delta = deltas[i - 1];
    const upVal = delta > 0 ? delta : 0;
    const downVal = delta < 0 ? -delta : 0;
    
    up = (up * (period - 1) + upVal) / period;
    down = (down * (period - 1) + downVal) / period;
    
    rs = down === 0 ? 100 : up / down;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
};

/**
 * Generate trading signals based on technical indicators
 * @param {Array<number>} prices - Array of price values
 * @param {Array<number>} ema20 - 20-period EMA values
 * @param {Array<number>} rsi - RSI values
 * @returns {Array<number>} - Array of signals (1 = buy, -1 = sell, 0 = neutral)
 */
const generateSignals = (prices, ema20, rsi) => {
  const signals = new Array(prices.length).fill(0);
  
  for (let i = 1; i < prices.length; i++) {
    // Buy signal: RSI below 40 OR price crosses above 20 EMA
    if (rsi[i] < 40 || (prices[i] > ema20[i] && prices[i - 1] <= ema20[i - 1])) {
      signals[i] = 1;
    }
    // Sell signal: RSI above 60 OR price crosses below 20 EMA
    else if (rsi[i] > 60 || (prices[i] < ema20[i] && prices[i - 1] >= ema20[i - 1])) {
      signals[i] = -1;
    }
  }
  
  return signals;
};

/**
 * Predict next day's price based on simple linear regression
 * @param {Array<number>} prices - Array of price values
 * @returns {number} - Predicted price
 */
const predictNextPrice = (prices) => {
  // Simple last 5 day weighted average
  const lastPrices = prices.slice(-5);
  const weights = [0.1, 0.15, 0.2, 0.25, 0.3]; // More weight to recent prices
  
  let weightedSum = 0;
  for (let i = 0; i < lastPrices.length; i++) {
    weightedSum += lastPrices[i] * weights[i];
  }
  
  return weightedSum;
};

/**
 * Calculate percentage error between actual and predicted prices
 * @param {Array<number>} actual - Actual prices
 * @param {Array<number>} predicted - Predicted prices
 * @returns {number} - Mean absolute percentage error
 */
const calculatePercentageError = (actual, predicted) => {
  let sum = 0;
  let count = 0;
  
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] && predicted[i]) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }
  
  return (sum / count) * 100;
};

module.exports = {
  calculateEMA,
  calculateRSI,
  generateSignals,
  predictNextPrice,
  calculatePercentageError
};
