import os
import pytest
import pandas as pd

# Ensure no Gemini API key is required for these tests
os.environ.pop("GEMINI_API_KEY", None)

from app.services.insight_service import StockInsightAgent
from app.schemas.insight import TechnicalScales, RiskMetrics, FundamentalComparisonItem

def test_compute_technical_scales_empty():
    agent = StockInsightAgent()
    result = agent._compute_technical_scales([], {"sma20": None, "latest_close": None, "rsi14": None})
    assert isinstance(result, TechnicalScales)
    assert result.rsi14 == 0.0
    assert result.sma20 == 0.0
    assert result.sma50 == 0.0
    assert result.macd_histogram == 0.0
    assert result.trend_score == 0.0
    assert result.momentum_score == 0.0

def test_compute_technical_scales_with_data():
    agent = StockInsightAgent()
    prices = [{"date": f"2024-01-{day:02d}", "close": float(day)} for day in range(1, 11)]
    indicators = {"sma20": 5.5, "latest_close": 10.0, "rsi14": 55.0}
    result = agent._compute_technical_scales(prices, indicators)
    assert isinstance(result, TechnicalScales)
    assert result.rsi14 == round(55.0, 2)
    assert result.sma20 == round(5.5, 2)
    assert result.sma50 == 0.0  # less than 50 days of data
    assert result.trend_score == 70.0
    assert result.momentum_score == round(55.0, 2)

def test_risk_metrics_schema():
    rm = RiskMetrics(annual_volatility=0.12, sharpe_ratio=1.5, max_drawdown=0.2, avg_daily_return=0.001)
    assert isinstance(rm, RiskMetrics)

def test_fundamental_comparisons_stub():
    agent = StockInsightAgent()
    metrics = {
        "trailing_pe": 25.0,
        "forward_pe": 22.0,
        "peg_ratio": 1.2,
        "price_to_book": 3.5,
        "profit_margin": 0.12,
        "revenue_growth": 0.15,
        "earnings_growth": 0.10,
        "free_cash_flow": 0.07,
        "beta": 1.8,
    }
    comps = agent._compute_fundamental_comparisons(metrics)
    assert isinstance(comps, list)
    assert all(isinstance(c, FundamentalComparisonItem) for c in comps)
    assert any(c.metric == "Trailing P/E" for c in comps)
