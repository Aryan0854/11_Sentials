# websocket_server.py
import asyncio
import websockets
import logging
import json

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

clients = set()

async def handle_connection(websocket, path=None):
    clients.add(websocket)
    logging.info("New socket client connected. Registry count: %d", len(clients))
    try:
        async for message in websocket:
            # Broadcast the incoming threat message to all OTHER connected clients (frontend displays)
            targets = [client for client in clients if client != websocket]
            if targets:
                # Send concurrently
                await asyncio.gather(*[client.send(message) for client in targets])
    except websockets.exceptions.ConnectionClosed:
        logging.info("Socket client connection closed.")
    finally:
        clients.remove(websocket)
        logging.info("Client removed from registry. Count remaining: %d", len(clients))

async def start_server():
    async with websockets.serve(handle_connection, "localhost", 8765):
        logging.info("Broadcaster active on ws://localhost:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        logging.info("Broadcaster stopped.")