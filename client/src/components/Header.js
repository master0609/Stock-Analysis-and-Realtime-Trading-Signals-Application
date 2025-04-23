import React from 'react';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            <span className="text-blue-600">📈</span> Stock Analysis & Prediction
          </h1>
          <p className="ml-4 text-sm text-gray-600 hidden md:block">
            ML, Technical Indicators & Trading Signals
          </p>
        </div>
        
        <div>
          {isAuthenticated ? (
            <div className="flex items-center">
              <span className="mr-3 text-gray-700">{user.email}</span>
              <button 
                onClick={logout}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
