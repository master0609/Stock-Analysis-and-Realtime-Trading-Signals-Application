/**
 * Stock service for handling API calls related to stock analysis
 */

// Base API URL
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Get stock analysis data from the API
 * @param {string} ticker - Stock ticker symbol
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {number} lookbackPeriod - Number of days to look back for prediction
 * @returns {Promise<Object>} - Stock analysis data
 */
export const getStockAnalysis = async (ticker, startDate, endDate, lookbackPeriod) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker,
        start_date: startDate,
        end_date: endDate,
        lookback_period: lookbackPeriod,
      }),
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze stock');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing stock:', error);
    throw error;
  }
};

/**
 * Get top moving stocks data
 * @returns {Promise<Array>} - List of top moving stocks
 */
export const getTopMovingStocks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/top-movers`, {
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get top moving stocks');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting top moving stocks:', error);
    throw error;
  }
};

/**
 * Get user's watchlist stocks
 * @returns {Promise<Array>} - List of watchlist stocks
 */
export const getWatchlist = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/watchlist`, {
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get watchlist');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting watchlist:', error);
    throw error;
  }
};

/**
 * Add stock to watchlist
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Result
 */
export const addToWatchlist = async (ticker) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ticker }),
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add to watchlist');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
};

/**
 * Remove stock from watchlist
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} - Result
 */
export const removeFromWatchlist = async (ticker) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/watchlist/${ticker}`, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove from watchlist');
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
};
