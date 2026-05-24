import json
import redis
import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PulseTrade API Gateway")
redis_client = redis.Redis(host='localhost', port=6379, db=0)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    pubsub = redis_client.pubsub()
    pubsub.subscribe('trade_executions', 'sentiment_stream')
    
    try:
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                data = json.loads(message['data'])
                channel = message['channel'].decode('utf-8')
                await websocket.send_json({"channel": channel, "data": data})
            await asyncio.sleep(0.1)
    except Exception as e:
        print(f"WebSocket closed: {e}")

@app.post("/mock/ingest_news")
async def ingest_mock_news(asset: str, text: str):
    """Endpoint to mock real-time data ingestion[cite: 8]."""
    payload = {"asset": asset, "text": text}
    redis_client.publish('raw_text_stream', json.dumps(payload))
    return {"status": "Ingested", "payload": payload}