const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/stocks/top-movers', stockController.getTopMovingStocks);

// Protected routes (require authentication)
router.post('/stocks/analyze', authMiddleware.optional, stockController.analyzeStock);
router.get('/stocks/watchlist', authMiddleware.required, stockController.getWatchlist);
router.post('/stocks/watchlist', authMiddleware.required, stockController.addToWatchlist);
router.delete('/stocks/watchlist/:ticker', authMiddleware.required, stockController.removeFromWatchlist);
router.get('/stocks/history/:ticker', authMiddleware.optional, stockController.getStockHistory);

module.exports = router;
