import pytest
from main import evaluate_signal, risk_management_check

def test_risk_management_blacklist():
    # MEME_COIN is blacklisted in the main.py logic
    assert risk_management_check("MEME_COIN", "BUY") == False
    assert risk_management_check("AAPL", "BUY") == True

def test_evaluate_signal_buy_condition(mocker):
    # Mock the execute_trade function to prevent actual Redis publishing during tests
    mock_execute = mocker.patch('main.execute_trade')
    
    # High positive sentiment should trigger a BUY
    evaluate_signal("MSFT", "positive", 0.95)
    mock_execute.assert_called_once_with("MSFT", "BUY", 0)

def test_evaluate_signal_low_confidence(mocker):
    mock_execute = mocker.patch('main.execute_trade')
    
    # Score below 0.8 threshold should NOT trigger a trade
    evaluate_signal("TSLA", "negative", 0.50)
    mock_execute.assert_not_called()