const { analyzeStock, getTopMovingStocks } = require('../services/stockAnalysis');
const User = require('../models/User');
const Stock = require('../models/Stock');

/**
 * Analyze a stock
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.analyzeStock = async (req, res) => {
  try {
    const { ticker, start_date, end_date, lookback_period } = req.body;
    
    // Validate inputs
    if (!ticker || !start_date || !end_date) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Convert lookback period to number with default
    const lookbackPeriod = parseInt(lookback_period) || 30;
    
    // Call the stock analysis service
    const results = await analyzeStock(ticker, start_date, end_date, lookbackPeriod);
    
    // Add to user's recently viewed if authenticated
    if (req.user) {
      try {
        // We don't need to await this, it's just a background update
        User.findByIdAndUpdate(req.user.id, {
          $addToSet: { recentlyViewed: { ticker } }
        }).exec();
      } catch (err) {
        console.error('Error updating recently viewed:', err);
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Stock analysis error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get top moving stocks
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getTopMovingStocks = async (req, res) => {
  try {
    const topStocks = await getTopMovingStocks(4);
    res.json(topStocks);
  } catch (error) {
    console.error('Get top moving stocks error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user's watchlist
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getWatchlist = async (req, res) => {
  try {
    // Get user with watchlist
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get current data for watchlist stocks
    const watchlistData = [];
    
    for (const item of user.watchlist) {
      const stock = await Stock.findOne({ ticker: item.ticker });
      
      watchlistData.push({
        ticker: item.ticker,
        addedAt: item.addedAt,
        price: stock ? stock.lastPrice : null,
        changePercent: stock ? stock.changePercent : null,
        signal: stock ? stock.signal : 'NEUTRAL'
      });
    }
    
    res.json(watchlistData);
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Add stock to watchlist
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.addToWatchlist = async (req, res) => {
  try {
    const { ticker } = req.body;
    
    if (!ticker) {
      return res.status(400).json({ message: 'Ticker is required' });
    }
    
    // Find user and update watchlist
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { watchlist: { ticker } } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: `${ticker} added to watchlist`,
      watchlist: user.watchlist
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove stock from watchlist
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.removeFromWatchlist = async (req, res) => {
  try {
    const { ticker } = req.params;
    
    // Find user and update watchlist
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { watchlist: { ticker } } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: `${ticker} removed from watchlist`,
      watchlist: user.watchlist
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get stock history
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
exports.getStockHistory = async (req, res) => {
  try {
    const { ticker } = req.params;
    
    // Find stock
    const stock = await Stock.findOne({ ticker });
    
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    
    // Return prediction history and stock data
    res.json({
      ticker: stock.ticker,
      lastPrice: stock.lastPrice,
      changePercent: stock.changePercent,
      signal: stock.signal,
      updatedAt: stock.updatedAt,
      predictionHistory: stock.predictionHistory
    });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({ message: error.message });
  }
};
