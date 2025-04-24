# Stock Analysis Application
A real-time stock analysis application that utilizes WebSocket technology to fetch and display stock market data. Built with Python for the backend and React for the frontend.


## Table of Contents
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)


## Technologies Used
- **Backend:**
  - Python
  - Flask
  - Flask-SocketIO
  - Eventlet
  - yFinance
  - pandas
  - NumPy
  - Matplotlib

- **Frontend:**
  - React.js
  - Socket.IO


## Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name

2. **Install the required packages:**
   ```bash
   pip install streamlit python-socketio eventlet flask-socketio yfinance pandas numpy scikit-learn matplotlib


## Running the Application
1. **Start the Socket server:**
   Navigate to the socket_server.py file and run:
   ```bash
   python socket_server.py

2. **Start the React application:**
   Navigate to the client folder and run:
   ```bash
   npm install
   npm start

3. **Access the application:**
   Open your browser and navigate to http://0.0.0.0:5000.


## Usage
Once the application is running, you can enter the stock symbols in the provided input fields to fetch real-time stock data.


## Contributing
If you'd like to contribute, please fork the repository and submit a pull request. Any contributions are welcome!


## License
MIT License
