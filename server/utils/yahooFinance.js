const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

/**
 * Get stock quote from Yahoo Finance API
 * @param {string} symbol - Stock ticker symbol
 * @returns {Promise<Object|null>} - Stock quote data
 */
const getQuote = async (symbol) => {
  try {
    const result = await yahooFinance.quote(symbol);
    
    return {
      ticker: symbol,
      price: result.regularMarketPrice,
      previousClose: result.regularMarketPreviousClose,
      open: result.regularMarketOpen,
      dayHigh: result.regularMarketDayHigh,
      dayLow: result.regularMarketDayLow,
      volume: result.regularMarketVolume,
      changePercent: result.regularMarketChangePercent,
      marketCap: result.marketCap,
      name: result.shortName || result.longName,
      exchange: result.exchange
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

/**
 * Get historical data for a stock
 * @param {string} symbol - Stock ticker symbol
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} interval - Data interval (1d, 1wk, 1mo)
 * @returns {Promise<Object|null>} - Historical data
 */
const getHistoricalData = async (symbol, startDate, endDate, interval = '1d') => {
  try {
    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval
    });
    
    // Format the data
    return result.map(item => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return null;
  }
};

/**
 * Search for stocks by keyword
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array|null>} - Search results
 */
const search = async (query, limit = 10) => {
  try {
    const result = await yahooFinance.search(query, { quotesCount: limit });
    
    return result.quotes.map(item => ({
      ticker: item.symbol,
      name: item.shortname || item.longname,
      exchange: item.exchange,
      type: item.quoteType
    }));
  } catch (error) {
    console.error(`Error searching for ${query}:`, error);
    return null;
  }
};

module.exports = {
  getQuote,
  getHistoricalData,
  search
};
