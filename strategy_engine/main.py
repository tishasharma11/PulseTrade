import json
import redis
import logging
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StrategyEngine")

app = FastAPI(title="PulseTrade Strategy Engine")
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Mock State for Market Data
current_prices = {"AAPL": 150.0, "TSLA": 200.0}

def risk_management_check(asset: str, signal_type: str) -> bool:
    """Final checkpoint before execution[cite: 40]."""
    # Example Rule: Restricted tickers [cite: 44]
    blacklisted = ["MEME_COIN"]
    if asset in blacklisted:
        logger.warning(f"Risk Check Failed: {asset} is blacklisted.")
        return False
    return True

def evaluate_signal(asset: str, sentiment: str, score: float):
    """Core Algorithm: Sentiment-Price Arbitrage[cite: 32]."""
    # Scenario A: High positive sentiment [cite: 32]
    if sentiment == "positive" and score > 0.8:
        if risk_management_check(asset, "BUY"):
            execute_trade(asset, "BUY", current_prices.get(asset, 0))
            
    # Scenario B: High negative sentiment [cite: 33]
    elif sentiment == "negative" and score > 0.8:
        if risk_management_check(asset, "SELL"):
            execute_trade(asset, "SELL", current_prices.get(asset, 0))

def execute_trade(asset: str, action: str, price: float):
    """Mock execution routing[cite: 35]."""
    trade_record = {"asset": asset, "action": action, "price": price, "status": "EXECUTED"}
    logger.info(f"TRADE EXECUTED: {trade_record}")
    redis_client.publish('trade_executions', json.dumps(trade_record))

def listen_to_sentiment():
    pubsub = redis_client.pubsub()
    pubsub.subscribe('sentiment_stream')
    for message in pubsub.listen():
        if message['type'] == 'message':
            data = json.loads(message['data'])
            evaluate_signal(data['asset'], data['sentiment_label'], data['sentiment_score'])

@app.on_event("startup")
async def startup_event():
    import threading
    threading.Thread(target=listen_to_sentiment, daemon=True).start()

@app.get("/health")
def health_check():
    return {"status": "Strategy Engine Operational"}

# Add this global dictionary to hold the latest live prices
live_prices = {}

def listen_to_market_data():
    """Continuously updates the internal price book from the live stream."""
    pubsub = redis_client.pubsub()
    pubsub.subscribe('live_market_data')
    for message in pubsub.listen():
        if message['type'] == 'message':
            data = json.loads(message['data'])
            live_prices[data['asset']] = data['price']

# Update your execute_trade function to use live_prices:
def execute_trade(asset: str, action: str):
    # Fetch the most recent live price
    execution_price = live_prices.get(asset, 0.0) 
    
    if execution_price > 0:
        trade_record = {"asset": asset, "action": action, "price": execution_price, "status": "EXECUTED"}
        logger.info(f"LIVE TRADE EXECUTED: {trade_record}")
        redis_client.publish('trade_executions', json.dumps(trade_record))

# Add the new listener thread in your startup_event:
@app.on_event("startup")
async def startup_event():
    import threading
    threading.Thread(target=listen_to_sentiment, daemon=True).start()
    threading.Thread(target=listen_to_market_data, daemon=True).start() # New thread