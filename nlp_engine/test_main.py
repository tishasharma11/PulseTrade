import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "NLP Engine Operational"}

def test_model_loaded():
    # Verify the FinBERT pipeline is accessible in the app context
    from main import sentiment_pipeline
    assert sentiment_pipeline is not None
    
    # Test a quick inference
    result = sentiment_pipeline("The stock is plummeting rapidly.")
    assert result['label'] in ['positive', 'negative', 'neutral']