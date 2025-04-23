# Save this as run_app.py

import subprocess
import time
import threading
import os
import signal
import sys

def run_socket_server():
    """Run the Socket.IO server"""
    print("Starting Socket.IO server...")
    socket_process = subprocess.Popen(["python", "socket_server.py"])
    return socket_process

def run_streamlit_app():
    """Run the Streamlit app"""
    print("Starting Streamlit app...")
    streamlit_process = subprocess.Popen(["streamlit", "run", "final_app.py"])
    return streamlit_process

def main():
    try:
        # Start the Socket.IO server
        socket_process = run_socket_server()
        
        # Wait for the Socket.IO server to start
        time.sleep(2)
        
        # Start the Streamlit app
        streamlit_process = run_streamlit_app()
        
        # Keep the script running
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down...")
        
        # Terminate processes
        if 'socket_process' in locals():
            socket_process.terminate()
        if 'streamlit_process' in locals():
            streamlit_process.terminate()
            
        print("Shutdown complete")
        sys.exit(0)

if __name__ == "__main__":
    main()