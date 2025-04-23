import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function StockOverview({ data }) {
  const priceChartRef = useRef(null);
  const volumeChartRef = useRef(null);
  
  useEffect(() => {
    if (!data) return;
    
    // Format dates for Chart.js
    const formattedDates = data.dates.map(date => new Date(date).toLocaleDateString());
    
    // Price Chart
    const priceChartInstance = new Chart(priceChartRef.current, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [{
          label: 'Price',
          data: data.prices,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${data.ticker} Price History`
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 10
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Price ($)'
            }
          }
        }
      }
    });
    
    // Volume Chart
    const volumeChartInstance = new Chart(volumeChartRef.current, {
      type: 'bar',
      data: {
        labels: formattedDates,
        datasets: [{
          label: 'Volume',
          data: data.stock_data.Volume,
          backgroundColor: 'rgba(46, 134, 193, 0.7)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${data.ticker} Trading Volume`
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: 10
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Volume'
            }
          }
        }
      }
    });
    
    // Cleanup
    return () => {
      priceChartInstance.destroy();
      volumeChartInstance.destroy();
    };
  }, [data]);
  
  if (!data) return null;
  
  // Extract basic stats
  const startPrice = data.prices[0];
  const endPrice = data.prices[data.prices.length - 1];
  const percentChange = ((endPrice - startPrice) / startPrice) * 100;
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">{data.ticker} Stock Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Ticker</p>
              <p className="font-semibold">{data.ticker}</p>
            </div>
            <div>
              <p className="text-gray-600">Analysis Period</p>
              <p className="font-semibold">
                {new Date(data.dates[0]).toLocaleDateString()} to {new Date(data.dates[data.dates.length - 1]).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Price Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Starting Price</p>
              <p className="font-semibold">${startPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Current Price</p>
              <p className="font-semibold">${endPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Change</p>
              <p className={`font-semibold ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
                {percentChange >= 0 ? ' 📈' : ' 📉'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Price History</h3>
        <div className="bg-gray-50 p-2 rounded-lg" style={{ height: '300px' }}>
          <canvas ref={priceChartRef}></canvas>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Trading Volume</h3>
        <div className="bg-gray-50 p-2 rounded-lg" style={{ height: '200px' }}>
          <canvas ref={volumeChartRef}></canvas>
        </div>
      </div>
    </div>
  );
}

export default StockOverview;
