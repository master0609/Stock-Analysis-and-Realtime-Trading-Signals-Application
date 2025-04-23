const { getTopMovingStocks, updateTopStocks } = require('./stockAnalysis');

/**
 * Setup Socket.IO server with event handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
const setupSocketIO = (io) => {
  // Store connected clients
  const connectedClients = new Map();
  
  // Handle new connection
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Store client connection time
    connectedClients.set(socket.id, {
      connectedAt: new Date(),
      userId: socket.handshake.auth.userId || null
    });
    
    // Send initial top stocks data
    sendTopStocksToClient(socket);
    
    // Handle stock update from client
    socket.on('stock_update', (data) => {
      handleStockUpdate(data, socket);
    });
    
    // Handle request for top stocks
    socket.on('get_top_stocks', () => {
      sendTopStocksToClient(socket);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });
  });
  
  // Start periodic updates
  startPeriodicUpdates(io);
};

/**
 * Send top moving stocks to a specific client
 * @param {SocketIO.Socket} socket - Socket client
 */
const sendTopStocksToClient = async (socket) => {
  try {
    const topStocks = await getTopMovingStocks(4);
    socket.emit('top_stocks_update', topStocks);
  } catch (error) {
    console.error('Error sending top stocks to client:', error);
  }
};

/**
 * Handle stock update from client
 * @param {Object} data - Stock update data
 * @param {SocketIO.Socket} socket - Socket client
 */
const handleStockUpdate = async (data, socket) => {
  try {
    // Validate data
    if (!data.ticker || typeof data.price !== 'number') {
      return;
    }
    
    // Broadcast to all clients
    socket.broadcast.emit('stock_update', {
      ticker: data.ticker,
      price: data.price,
      signal: data.signal || 'NEUTRAL',
      change_percent: data.change_percent || 0
    });
    
    console.log(`Broadcasted ${data.ticker} update: $${data.price} (${data.signal})`);
  } catch (error) {
    console.error('Error handling stock update:', error);
  }
};

/**
 * Start periodic updates for all clients
 * @param {SocketIO.Server} io - Socket.IO server
 */
const startPeriodicUpdates = (io) => {
  // Default tickers to track
  const defaultTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
  
  // Update every 10 seconds
  setInterval(async () => {
    try {
      // Get fresh data for top movers
      const topStocks = await updateTopStocks(defaultTickers);
      
      if (topStocks.length > 0) {
        // Broadcast to all clients
        io.emit('top_stocks_update', topStocks);
        console.log(`Sent update for ${topStocks.length} stocks to all clients`);
      }
    } catch (error) {
      console.error('Error in periodic update:', error);
    }
  }, 10000); // 10 seconds
};

module.exports = {
  setupSocketIO
};
