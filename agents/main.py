import asyncio
import websockets
import json
from security_agent import SecurityAgent
from resource_agent import ResourceAgent

security_agent = SecurityAgent()
resource_agent = ResourceAgent()

async def send_updates(websocket):
    try:
        while True:
            security_status = security_agent.get_status()
            resource_metrics = resource_agent.get_metrics()

            data = {
                "metrics": {
                    **resource_metrics,
                    "activeAlerts": len(security_status["alerts"])
                },
                "alerts": security_status["alerts"],
                "health": {
                    "status": "Good" if security_status["score"] >= 80 else "Warning",
                    "score": security_status["score"]
                }
            }

            await websocket.send(json.dumps(data))
            await asyncio.sleep(1)
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected.")
    except Exception as e:
        print(f"Error in send_updates: {e}")

async def main():
    try:
        # Start agent monitoring tasks
        asyncio.create_task(security_agent.monitor_security())
        asyncio.create_task(resource_agent.monitor_resources())

        # Start WebSocket server
        async with websockets.serve(send_updates, "localhost", 8765):
            await asyncio.Future()  # Run forever
    except Exception as e:
        print(f"Error in main: {e}")

if __name__ == "__main__":
    asyncio.run(main())
