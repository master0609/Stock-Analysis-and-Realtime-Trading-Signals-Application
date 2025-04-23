import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function TechnicalAnalysis({ data }) {
  const chartRef = useRef(null);
  const rsiChartRef = useRef(null);
  
  useEffect(() => {
    if (!data) return;
    
    // Format dates for Chart.js
    const formattedDates = data.dates.map(date => new Date(date).toLocaleDateString());
    
    // Price and EMAs chart
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
            pointHoverRadius: 5,
            yAxisID: 'y'
          },
          {
            label: 'EMA 20',
            data: data.ema_20,
            backgroundColor: 'rgba(255, 99, 132, 0)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 0,
            yAxisID: 'y'
          },
          {
            label: 'EMA 50',
            data: data.ema_50,
            backgroundColor: 'rgba(75, 192, 192, 0)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 0,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: `${data.ticker} - Price and Moving Averages`
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Price ($)'
            }
          },
          x: {
            ticks: {
              maxTicksLimit: 10
            }
          }
        }
      }
    });
    
    // RSI chart
    const rsiChartInstance = new Chart(rsiChartRef.current, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [{
          label: 'RSI (14)',
          data: data.rsi,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Relative Strength Index (RSI)'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: {
              color: function(context) {
                if (context.tick.value === 30 || context.tick.value === 70) {
                  return 'rgba(255, 0, 0, 0.3)';
                }
                return 'rgba(0, 0, 0, 0.1)';
              },
              lineWidth: function(context) {
                if (context.tick.value === 30 || context.tick.value === 70) {
                  return 2;
                }
                return 1;
              }
            }
          },
          x: {
            ticks: {
              maxTicksLimit: 10
            }
          }
        }
      }
    });
    
    // Cleanup
    return () => {
      chartInstance.destroy();
      rsiChartInstance.destroy();
    };
  }, [data]);
  
  if (!data) return null;
  
  return (
    <div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Price and Moving Averages</h3>
        <div className="bg-gray-50 p-2 rounded-lg" style={{ height: '300px' }}>
          <canvas ref={chartRef}></canvas>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>• EMA crossovers can indicate trend changes</p>
          <p>• Price above EMA 20 often signals bullish momentum</p>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Relative Strength Index (RSI)</h3>
        <div className="bg-gray-50 p-2 rounded-lg" style={{ height: '250px' }}>
          <canvas ref={rsiChartRef}></canvas>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>• RSI above 70 may indicate overbought conditions (potential sell signal)</p>
          <p>• RSI below 30 may indicate oversold conditions (potential buy signal)</p>
          <p>• RSI range for this period: Min {data.signal_stats.min_rsi.toFixed(2)}, Max {data.signal_stats.max_rsi.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Technical Analysis Summary</h3>
        <p>
          This analysis combines EMA crossovers and RSI indicators to identify potential trading opportunities.
          The model has identified {data.signal_stats.total_signals} signals during this period
          ({data.signal_stats.buy_signals} buy, {data.signal_stats.sell_signals} sell).
        </p>
      </div>
    </div>
  );
}

export default TechnicalAnalysis;
