# websocket_server.py
import asyncio
import websockets
import logging

logging.basicConfig(level=logging.INFO)

clients = set()

async def handle_connection(websocket, path):
    clients.add(websocket)
    logging.info("New client connected")
    try:
        async for message in websocket:
            # Broadcast the message to all connected clients
            for client in clients:
                await client.send(message)
    except websockets.ConnectionClosed:
        logging.info("Client disconnected")
    finally:
        clients.remove(websocket)

async def start_server():
    async with websockets.serve(handle_connection, "localhost", 8765):
        logging.info("WebSocket server started on ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(start_server())