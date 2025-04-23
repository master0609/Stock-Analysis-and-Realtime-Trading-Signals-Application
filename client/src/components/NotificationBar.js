import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

function NotificationBar() {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  
  useEffect(() => {
    if (!socket) return;
    
    // Listen for stock updates
    socket.on('top_stocks_update', (data) => {
      setNotifications(data);
    });
    
    // Get initial data
    socket.emit('get_top_stocks');
    
    return () => {
      socket.off('top_stocks_update');
    };
  }, [socket]);
  
  if (!isOpen || notifications.length === 0) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50"
      >
        <i className="fas fa-bell"></i>
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-white py-2 px-4 shadow-lg z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-1 overflow-x-auto" style={{ maxWidth: 'calc(100% - 100px)' }}>
          <span className="whitespace-nowrap font-semibold mr-2">Top Movers:</span>
          
          {notifications.map((stock) => (
            <div 
              key={stock.ticker}
              className="flex items-center bg-gray-700 rounded-full px-3 py-1 text-sm mr-2 whitespace-nowrap"
            >
              <span className="font-bold mr-1">{stock.ticker}</span>
              <span className={stock.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}>
                ${stock.price.toFixed(2)} 
                ({stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%)
              </span>
              <span 
                className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold ${
                  stock.signal === 'BUY' ? 'bg-green-700 text-green-100' : 
                  stock.signal === 'SELL' ? 'bg-red-700 text-red-100' : 'bg-gray-600'
                }`}
              >
                {stock.signal}
              </span>
            </div>
          ))}
          
          <span className="text-gray-400 text-xs whitespace-nowrap">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
        
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}

export default NotificationBar;
