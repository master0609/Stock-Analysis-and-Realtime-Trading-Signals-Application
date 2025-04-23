import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function TradingSignals({ data }) {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!data) return;
    
    // Format dates for Chart.js
    const formattedDates = data.dates.map(date => new Date(date).toLocaleDateString());
    
    // Prepare buy and sell signals for visualization
    const buySignalPoints = [];
    const sellSignalPoints = [];
    
    data.signals.forEach((signal, i) => {
      if (signal === 1) {
        buySignalPoints.push({
          x: formattedDates[i],
          y: data.prices[i]
        });
      } else if (signal === -1) {
        sellSignalPoints.push({
          x: formattedDates[i],
          y: data.prices[i]
        });
      }
    });
    
    const chartInstance = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [
          {
            label: 'Price',
            data: data.prices,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 5
          },
          {
            label: 'Buy Signal',
            data: buySignalPoints,
            backgroundColor: 'rgba(75, 192, 92, 1)',
            borderColor: 'rgba(75, 192, 92, 1)',
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: false
          },
          {
            label: 'Sell Signal',
            data: sellSignalPoints,
            backgroundColor: 'rgba(255, 99, 132, 1)',
            borderColor: 'rgba(255, 99, 132, 1)',
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${data.ticker} - Trading Signals`
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.dataset.label === 'Buy Signal') {
                  return `BUY at $${context.parsed.y.toFixed(2)}`;
                } else if (context.dataset.label === 'Sell Signal') {
                  return `SELL at $${context.parsed.y.toFixed(2)}`;
                }
                return `Price: $${context.parsed.y.toFixed(2)}`;
              }
            }
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
    
    // Cleanup
    return () => {
      chartInstance.destroy();
    };
  }, [data]);
  
  if (!data) return null;
  
  return (
    <div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Trading Signals Visualization</h3>
        <div className="bg-gray-50 p-2 rounded-lg" style={{ height: '350px' }}>
          <canvas ref={chartRef}></canvas>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>• Green dots represent BUY signals (when RSI is below 40 or price crosses above 20-day EMA)</p>
          <p>• Red dots represent SELL signals (when RSI is above 60 or price crosses below 20-day EMA)</p>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Recent Trading Signals</h3>
        {data.recent_signals && data.recent_signals.length > 0 ? (
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recent_signals.map((signal, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signal.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        signal.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {signal.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${signal.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No recent signals found in the selected time period.</p>
        )}
      </div>
      
      {data.next_day_prediction && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Next Trading Day Signal</h3>
          <div className="flex items-center">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full mr-3 ${
              data.next_day_prediction.signal === 'BUY' ? 'bg-green-100 text-green-800' : 
              data.next_day_prediction.signal === 'SELL' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {data.next_day_prediction.signal}
            </span>
            <span className="text-gray-700">
              Predicted for {data.next_day_prediction.date} at ${data.next_day_prediction.price.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradingSignals;
