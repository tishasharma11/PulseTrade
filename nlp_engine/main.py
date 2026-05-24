import json
import redis
from fastapi import FastAPI, BackgroundTasks
from transformers import pipeline

app = FastAPI(title="PulseTrade NLP Engine")
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Load FinBERT [cite: 23, 53]
# Note: Using a lightweight pipeline for immediate execution. In true production, load specific FinBERT weights.
print("Loading NLP Model...")
sentiment_pipeline = pipeline("sentiment-analysis", model="ProsusAI/finbert")

def process_text_stream():
    """Continuously processes incoming text from Redis and outputs sentiment."""
    pubsub = redis_client.pubsub()
    pubsub.subscribe('raw_text_stream')
    
    for message in pubsub.listen():
        if message['type'] == 'message':
            data = json.loads(message['data'])
            text = data.get("text", "")
            asset = data.get("asset", "UNKNOWN")
            
            # Inference [cite: 26]
            result = sentiment_pipeline(text) 
            
            processed_signal = {
                "asset": asset,
                "sentiment_label": result['label'],
                "sentiment_score": result['score']
            }
            # Publish to Strategy Engine
            redis_client.publish('sentiment_stream', json.dumps(processed_signal))

@app.on_event("startup")
async def startup_event():
    import threading
    threading.Thread(target=process_text_stream, daemon=True).start()

@app.get("/health")
def health_check():
    return {"status": "NLP Engine Operational"}