import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StockSearch from './components/StockSearch';
import StockOverview from './components/StockOverview';
import PricePrediction from './components/PricePrediction';
import TechnicalAnalysis from './components/TechnicalAnalysis';
import TradingSignals from './components/TradingSignals';
import NotificationBar from './components/NotificationBar';
import { useSocket } from './context/SocketContext';
import { getStockAnalysis } from './services/stockService';

function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useSocket();
  
  // Function to analyze a stock
  const analyzeStock = async (ticker, startDate, endDate, lookbackPeriod) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getStockAnalysis(ticker, startDate, endDate, lookbackPeriod);
      setStockData(data);
      
      // Emit the next day prediction to all users through socket
      if (data.next_day_prediction && socket) {
        socket.emit('stock_update', {
          ticker: ticker,
          price: data.next_day_prediction.price,
          signal: data.next_day_prediction.signal,
          change_percent: data.next_day_prediction.change_percent
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze stock');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for socket connection status
  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('Connected to socket server');
      });
      
      socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
      
      return () => {
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [socket]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <NotificationBar />
      
      <main className="container mx-auto px-4 py-8">
        <StockSearch onAnalyze={analyzeStock} isLoading={isLoading} />
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        {stockData && !error && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {stockData.next_day_prediction && (
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <h2 className="text-xl font-bold mb-2">
                  🔮 Next Trading Day Prediction ({stockData.next_day_prediction.date})
                </h2>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-lg">Predicted Price: </span>
                    <span className="text-xl font-bold">${stockData.next_day_prediction.price.toFixed(2)} </span>
                    <span className={`${stockData.next_day_prediction.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stockData.next_day_prediction.change_percent >= 0 ? '+' : ''}
                      {stockData.next_day_prediction.change_percent.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-lg">Signal: </span>
                    <span className={`text-xl font-bold ${
                      stockData.next_day_prediction.signal === 'BUY' ? 'text-green-600' : 
                      stockData.next_day_prediction.signal === 'SELL' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stockData.next_day_prediction.signal}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <nav className="flex border-b">
                <button 
                  onClick={() => setCurrentTab('overview')}
                  className={`py-2 px-4 font-medium ${currentTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                >
                  Stock Overview
                </button>
                <button 
                  onClick={() => setCurrentTab('prediction')}
                  className={`py-2 px-4 font-medium ${currentTab === 'prediction' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                >
                  Price Prediction
                </button>
                <button 
                  onClick={() => setCurrentTab('technical')}
                  className={`py-2 px-4 font-medium ${currentTab === 'technical' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                >
                  Technical Analysis
                </button>
                <button 
                  onClick={() => setCurrentTab('signals')}
                  className={`py-2 px-4 font-medium ${currentTab === 'signals' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                >
                  Trading Signals
                </button>
              </nav>
            </div>
            
            {currentTab === 'overview' && <StockOverview data={stockData} />}
            {currentTab === 'prediction' && <PricePrediction data={stockData} />}
            {currentTab === 'technical' && <TechnicalAnalysis data={stockData} />}
            {currentTab === 'signals' && <TradingSignals data={stockData} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
