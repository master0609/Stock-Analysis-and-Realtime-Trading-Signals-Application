import React, { useState } from 'react';

function StockSearch({ onAnalyze, isLoading }) {
  const [ticker, setTicker] = useState('AAPL');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [lookbackPeriod, setLookbackPeriod] = useState(30);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze(ticker.toUpperCase(), startDate, endDate, lookbackPeriod);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Stock Analysis Parameters</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-1">
              Stock Ticker
            </label>
            <input
              type="text"
              id="ticker"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label htmlFor="lookbackPeriod" className="block text-sm font-medium text-gray-700 mb-1">
              Lookback Period (Days)
            </label>
            <input
              type="range"
              id="lookbackPeriod"
              className="w-full"
              min="10"
              max="120"
              step="5"
              value={lookbackPeriod}
              onChange={(e) => setLookbackPeriod(parseInt(e.target.value))}
            />
            <div className="text-center">{lookbackPeriod} days</div>
          </div>
        </div>
        
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            'Run Analysis'
          )}
        </button>
      </form>
    </div>
  );
}

export default StockSearch;
