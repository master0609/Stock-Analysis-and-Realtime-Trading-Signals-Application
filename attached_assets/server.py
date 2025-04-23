from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import yfinance as yf
import asyncio
import json
from typing import List

app = FastAPI()
clients: List[WebSocket] = []

@app.get("/")
async def get():
    with open("index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    symbol = "AAPL"  # Default stock symbol
    query_params = websocket.scope.get('query_string')
    
    if query_params:
        # Extract symbol from URL query string
        symbol = query_params.decode().split('=')[1]
    
    clients.append(websocket)
    
    try:
        while True:
            await asyncio.sleep(1)
            stock_data = await get_stock_data(symbol)
            await websocket.send_text(json.dumps(stock_data))
    except WebSocketDisconnect:
        clients.remove(websocket)

async def get_stock_data(symbol: str):
    try:
        stock = yf.Ticker(symbol)
        data = stock.history(period="1d", interval="1m").tail(1)
        return {
            "symbol": symbol,
            "price": round(data["Close"].values[0], 2),
            "open": round(data["Open"].values[0], 2),
            "volume": int(data["Volume"].values[0])
        }
    except Exception as e:
        return {
            "error": f"Error fetching data for {symbol}: {e}"
        }

@app.on_event("startup")
async def start_tasks():
    asyncio.create_task(stock_broadcaster())

async def stock_broadcaster():
    while True:
        try:
            # Broadcast data to all connected clients every 10 seconds
            for client in clients:
                # Send a general update to all
                stock_data = await get_stock_data("AAPL")  # Can send default symbol data
                await client.send_text(json.dumps(stock_data))
        except Exception as e:
            print("Error:", e)
        await asyncio.sleep(10)
