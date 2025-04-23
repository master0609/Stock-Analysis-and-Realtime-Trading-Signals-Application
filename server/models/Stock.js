const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  company: {
    type: String,
    trim: true
  },
  lastPrice: {
    type: Number
  },
  changePercent: {
    type: Number
  },
  signal: {
    type: String,
    enum: ['BUY', 'SELL', 'NEUTRAL'],
    default: 'NEUTRAL'
  },
  volume: {
    type: Number
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isTopMover: {
    type: Boolean,
    default: false
  },
  predictionHistory: [{
    date: {
      type: Date,
      required: true
    },
    predictedPrice: {
      type: Number,
      required: true
    },
    actualPrice: {
      type: Number
    },
    signal: {
      type: String,
      enum: ['BUY', 'SELL', 'NEUTRAL']
    },
    accuracy: {
      type: Number
    }
  }]
});

// Add index for performance
StockSchema.index({ ticker: 1 });
StockSchema.index({ isTopMover: 1 });

// Method to update stock data
StockSchema.methods.updateStockData = function(data) {
  this.lastPrice = data.price || this.lastPrice;
  this.changePercent = data.change_percent || this.changePercent;
  this.signal = data.signal || this.signal;
  this.volume = data.volume || this.volume;
  this.updatedAt = new Date();
  
  if (data.company) {
    this.company = data.company;
  }
  
  return this.save();
};

// Method to add prediction
StockSchema.methods.addPrediction = function(date, predictedPrice, signal) {
  this.predictionHistory.push({
    date,
    predictedPrice,
    signal
  });
  
  // Limit history to most recent 30 entries
  if (this.predictionHistory.length > 30) {
    this.predictionHistory = this.predictionHistory.slice(-30);
  }
  
  return this.save();
};

// Method to update prediction with actual price
StockSchema.methods.updatePredictionActual = function(date, actualPrice) {
  const prediction = this.predictionHistory.find(p => 
    p.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
  );
  
  if (prediction) {
    prediction.actualPrice = actualPrice;
    prediction.accuracy = 100 - Math.abs((prediction.predictedPrice - actualPrice) / actualPrice * 100);
    return this.save();
  }
  
  return Promise.resolve(this);
};

const Stock = mongoose.model('Stock', StockSchema);

module.exports = Stock;
