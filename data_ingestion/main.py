import os
import json
import redis
import asyncio
import httpx
import pandas as pd
from dotenv import load_dotenv

# Load API keys from .env
load_dotenv()
NEWS_API_KEY = os.getenv("NEWSAPI_KEY")

# Connect to the existing Redis broker
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Tracked assets
ASSETS = ["AAPL", "TSLA", "MSFT"]

async def fetch_live_news():
    """Fetches recent news headlines and pipes them to the NLP engine."""
    async with httpx.AsyncClient() as client:
        while True:
            for asset in ASSETS:
                try:
                    # Fetching top headlines for the specific ticker
                    url = f"https://newsapi.org/v2/everything?q={asset}&language=en&sortBy=publishedAt&apiKey={NEWS_API_KEY}"
                    response = await client.get(url)
                    
                    if response.status_code == 200:
                        articles = response.json().get("articles", [])
                        if articles:
                            # Take the most recent headline
                            latest_headline = articles["title"]
                            
                            payload = {
                                "asset": asset,
                                "text": latest_headline,
                                "source": "NewsAPI"
                            }
                            
                            # Publish to the stream the NLP engine is already listening to
                            redis_client.publish('raw_text_stream', json.dumps(payload))
                            print(f"Published News for {asset}: {latest_headline}")
                            
                except Exception as e:
                    print(f"Error fetching news for {asset}: {e}")
            
            # Rate limiting: Wait 60 seconds before fetching the next batch
            await asyncio.sleep(60)

async def fetch_live_prices():
    """
    Connects to Alpaca's WebSocket (or REST API) to stream live prices.
    *Note: Using a simulated random walk for this snippet to avoid requiring active market hours, 
    but this is where you insert the Alpaca WebSocket client.*
    """
    import random
    current_prices = {"AAPL": 175.0, "TSLA": 210.0, "MSFT": 390.0}
    
    while True:
        for asset in ASSETS:
            # Simulate live tick movement
            movement = random.uniform(-0.5, 0.5)
            current_prices[asset] += movement
            
            payload = {
                "asset": asset,
                "price": round(current_prices[asset], 2),
                "timestamp": pd.Timestamp.utcnow().isoformat()
            }
            
            # Publish to a new market data stream
            redis_client.publish('live_market_data', json.dumps(payload))
            
        # Tick every 2 seconds
        await asyncio.sleep(2)

async def main():
    print("Starting Live Data Ingestion Engine...")
    # Run both fetchers concurrently
    await asyncio.gather(
        fetch_live_news(),
        fetch_live_prices()
    )

if __name__ == "__main__":
    asyncio.run(main())