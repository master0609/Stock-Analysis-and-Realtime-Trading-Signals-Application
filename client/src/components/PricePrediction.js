import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function PricePrediction({ data }) {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!data) return;
    
    // Format dates for Chart.js
    const formattedDates = data.dates.map(date => new Date(date).toLocaleDateString());
    
    let chartInstance = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [
          {
            label: 'Actual Price',
            data: data.prices,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5
          },
          {
            label: 'Predicted Price',
            data: data.predictions,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${data.ticker} - Actual vs Predicted Prices`
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
    
    // Add next day prediction point if available
    if (data.next_day_prediction) {
      const nextDate = new Date(data.next_day_prediction.date);
      chartInstance.data.labels.push(nextDate.toLocaleDateString());
      chartInstance.data.datasets[0].data.push(null);  // No actual price for next day
      chartInstance.data.datasets[1].data.push(data.next_day_prediction.price);
      
      // Add a special point for the next day prediction
      chartInstance.data.datasets.push({
        label: 'Next Day',
        data: Array(data.prices.length).fill(null).concat(data.next_day_prediction.price),
        backgroundColor: 'rgba(75, 192, 192, 1)',
        borderColor: 'rgba(75, 192, 192, 1)',
        pointRadius: 8,
        pointHoverRadius: 10,
        showLine: false
      });
      
      chartInstance.update();
    }
    
    // Cleanup
    return () => {
      chartInstance.destroy();
    };
  }, [data]);

  if (!data) return null;
  
  const accuracy = 100 - data.accuracy_metrics['Mean Absolute Percentage Error (MAPE)'];
  const accuracyCapped = Math.max(0, Math.min(accuracy, 100));
  
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">ML Price Prediction</h3>
        <div className="bg-gray-50 p-2 rounded-lg" style={{ height: '400px' }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
      
      {data.next_day_prediction && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <h3 className="text-lg font-semibold mb-3">Next Trading Day Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600">Date</p>
              <p className="font-semibold">{data.next_day_prediction.date}</p>
            </div>
            <div>
              <p className="text-gray-600">Predicted Price</p>
              <p className="font-semibold">${data.next_day_prediction.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Change from Last Price</p>
              <p className={`font-semibold ${data.next_day_prediction.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.next_day_prediction.change_percent >= 0 ? '+' : ''}
                {data.next_day_prediction.change_percent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PricePrediction;
