import os
from dotenv import load_dotenv
# Explicitly load backend/.env relative to main.py path
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

import sqlite3
import logging
import time
from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware

from app.cache import stock_cache
from app.services.stock_service import fetch_stock_data
from app.schemas.stock import StockDataResponse

from app.schemas.insight import StockInsightResponse
from app.services.insight_service import StockInsightAgent
from app.schemas.dcf import SimulationRequest, SimulationResponse
from app.tools import run_monte_carlo_dcf

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

from typing import Tuple, Optional

def check_ip_rate_limit_sqlite(ip_address: str, limit: int = 4, period_seconds: int = 86400) -> Tuple[bool, Optional[float]]:
    """
    Checks if the IP address exceeds the limit within the period using a local SQLite database.
    Returns (is_allowed, reset_timestamp)
    """
    db_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(db_dir, "rate_limits.db")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rate_limits (
                ip TEXT,
                timestamp REAL
            )
        """)
        conn.commit()

        now = time.time()
        cutoff = now - period_seconds
        cursor.execute("DELETE FROM rate_limits WHERE timestamp < ?", (cutoff,))
        conn.commit()

        cursor.execute("SELECT COUNT(*) FROM rate_limits WHERE ip = ?", (ip_address,))
        count = cursor.fetchone()[0]

        if count >= limit:
            cursor.execute("SELECT MIN(timestamp) FROM rate_limits WHERE ip = ?", (ip_address,))
            oldest = cursor.fetchone()[0]
            reset_time = (oldest or now) + period_seconds
            conn.close()
            return False, reset_time

        cursor.execute("INSERT INTO rate_limits (ip, timestamp) VALUES (?, ?)", (ip_address, now))
        conn.commit()
        conn.close()
        return True, None
    except Exception as e:
        logger.error(f"Error checking SQLite rate limits: {e}", exc_info=True)
        return True, None

def check_ip_rate_limit_vercel_kv(ip_address: str, limit: int = 4, period_seconds: int = 86400) -> Tuple[bool, Optional[float]]:
    """
    Increments request count for IP address in Vercel KV (REST Redis API).
    Returns (is_allowed, reset_timestamp).
    """
    import urllib.request
    import json

    kv_url = os.environ.get("KV_REST_API_URL")
    kv_token = os.environ.get("KV_REST_API_TOKEN")
    key = f"ratelimit:{ip_address}"

    try:
        # 1. Increment count atomically
        incr_url = f"{kv_url}/incr/{key}"
        req = urllib.request.Request(incr_url, headers={"Authorization": f"Bearer {kv_token}"})
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
            count = int(data.get("result", 0))

        # 2. If it's the first hit, set expiration duration (TTL)
        if count == 1:
            expire_url = f"{kv_url}/expire/{key}/{period_seconds}"
            req_exp = urllib.request.Request(expire_url, headers={"Authorization": f"Bearer {kv_token}"})
            with urllib.request.urlopen(req_exp) as res_exp:
                pass

        # 3. Check threshold
        if count > limit:
            # Get TTL remaining to return reset timestamp
            ttl_url = f"{kv_url}/ttl/{key}"
            req_ttl = urllib.request.Request(ttl_url, headers={"Authorization": f"Bearer {kv_token}"})
            with urllib.request.urlopen(req_ttl) as res_ttl:
                ttl_data = json.loads(res_ttl.read().decode())
                ttl = int(ttl_data.get("result", 0))
            reset_time = time.time() + (ttl if ttl > 0 else period_seconds)
            return False, reset_time
        return True, None
    except Exception as e:
        logger.error(f"Vercel KV Rate Limiter error: {e}", exc_info=True)
        return True, None

def check_ip_rate_limit(ip_address: str, limit: int = 4, period_seconds: int = 86400) -> Tuple[bool, Optional[float]]:
    """
    Selects rate limiter storage backend dynamically:
    - If KV_REST_API_URL and KV_REST_API_TOKEN exist -> Use Vercel KV REST API.
    - Else -> Fallback to local SQLite database.
    Returns (is_allowed, reset_timestamp).
    """
    kv_url = os.environ.get("KV_REST_API_URL")
    kv_token = os.environ.get("KV_REST_API_TOKEN")
    if kv_url and kv_token:
        logger.info(f"Using Vercel KV rate limiter for IP: {ip_address}")
        return check_ip_rate_limit_vercel_kv(ip_address, limit, period_seconds)
    else:
        logger.info(f"Using local SQLite rate limiter for IP: {ip_address}")
        return check_ip_rate_limit_sqlite(ip_address, limit, period_seconds)


app = FastAPI(
    title="Financial Data Engine API",
    description="Backend API that aggregates stock financials (TTM), prices, and news using yfinance.",
    version="1.0.0"
)

# Instantiate the AI Insight Agent
insight_agent = StockInsightAgent()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Financial Data Engine API is running.",
        "endpoints": {
            "stock_data": "/api/stock/{ticker}",
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/api/stock/{ticker}", response_model=StockDataResponse)
def get_stock_data(ticker: str, response: Response):
    """
    Fetches trailing 12-month metrics, 30-day daily price history, and news articles for a given ticker.
    Results are cached in memory for 5 minutes.
    """
    ticker_upper = ticker.strip().upper()
    if not ticker_upper:
        raise HTTPException(status_code=400, detail="Ticker symbol cannot be empty.")

    # Check cache first
    cached_data = stock_cache.get(ticker_upper)
    if cached_data:
        logger.info(f"Cache HIT for ticker: {ticker_upper}")
        response.headers["X-Cache"] = "HIT"
        return cached_data

    # Cache MISS - Fetch fresh data
    logger.info(f"Cache MISS for ticker: {ticker_upper}. Fetching fresh data from yfinance...")
    try:
        data = fetch_stock_data(ticker_upper)
        # Store in cache
        stock_cache.set(ticker_upper, data)
        response.headers["X-Cache"] = "MISS"
        return data
    except ValueError as ve:
        logger.warning(f"Validation error fetching data for {ticker_upper}: {ve}")
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Internal error fetching data for {ticker_upper}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"An internal error occurred while fetching data for ticker '{ticker_upper}'."
        )

@app.get("/api/stock/{ticker}/insight", response_model=StockInsightResponse)
def get_stock_insight(ticker: str, request: Request, response: Response):
    """
    Generates technical, fundamental, and sentiment investment insights for a given ticker using the AI agent.
    Results are cached in memory for 5 minutes.
    """
    ticker_upper = ticker.strip().upper()
    if not ticker_upper:
        raise HTTPException(status_code=400, detail="Ticker symbol cannot be empty.")

    cache_key = f"{ticker_upper}:insight"

    # Check cache first
    cached_insight = stock_cache.get(cache_key)
    if cached_insight:
        logger.info(f"Cache HIT for insight: {ticker_upper}")
        response.headers["X-Cache"] = "HIT"
        return cached_insight

    logger.info(f"Cache MISS for insight: {ticker_upper}. Preparing analysis context...")

    
    # 1. Fetch base stock data (hitting cache if possible)
    try:
        stock_data = stock_cache.get(ticker_upper)
        if not stock_data:
            stock_data = fetch_stock_data(ticker_upper)
            stock_cache.set(ticker_upper, stock_data)
    except ValueError as ve:
        logger.warning(f"Validation error fetching base stock data for {ticker_upper}: {ve}")
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error fetching base stock data for {ticker_upper}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch underlying stock data for '{ticker_upper}'."
        )

    # Check local user rate limit manually (persistent SQLite rate limiter)
    load_dotenv(env_path, override=True)
    provider_env = os.environ.get("LLM_PROVIDER", "GOOGLE").upper().strip()
    rate_limit_enabled_live = os.environ.get("RATE_LIMIT_ENABLED", "true").lower() == "true"
    if rate_limit_enabled_live and provider_env == "GOOGLE":
        ip_key = request.client.host if request.client else "127.0.0.1"
        is_allowed, reset_time = check_ip_rate_limit(ip_key, limit=4, period_seconds=86400)
        logger.info(f"Rate limit check for IP: {ip_key}. Enabled: {rate_limit_enabled_live}. Provider: {provider_env}. Allowed: {is_allowed}")
        if not is_allowed:
            # Convert epoch reset_time to EST (UTC-5)
            import datetime
            reset_dt = datetime.datetime.utcfromtimestamp(reset_time or time.time())
            est_dt = reset_dt - datetime.timedelta(hours=5)
            est_str = est_dt.strftime("%b %d, %Y at %I:%M %p EST")


            logger.warning(f"Local rate limit exceeded for IP {ip_key}. Reset at {est_str}. Returning mock data.")

            prices_list = [p.model_dump() for p in stock_data.prices]
            indicators = insight_agent.calculate_indicators(prices_list)
            mock_data = insight_agent._get_mock_insight(ticker_upper, stock_data, indicators)
            mock_data["is_mock"] = True
            mock_data["fallback_reason"] = f"You have exceeded your limit of 4 searches per day. Available again on {est_str}."

            return StockInsightResponse(**mock_data)

    # 2. Generate insights using AI agent
    try:
        insight = insight_agent.generate_insight(stock_data)
        # Store in cache
        stock_cache.set(cache_key, insight)
        response.headers["X-Cache"] = "MISS"
        return insight
    except Exception as e:
        logger.error(f"Error generating insight for {ticker_upper}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An internal error occurred while generating insight for '{ticker_upper}'."
        )

@app.post("/api/stock/{ticker}/dcf_simulation", response_model=SimulationResponse)
def get_dcf_simulation(ticker: str, request: SimulationRequest):
    """
    Runs a Monte Carlo DCF simulation for the given ticker with optional override values.
    """
    ticker_upper = ticker.strip().upper()
    if not ticker_upper:
        raise HTTPException(status_code=400, detail="Ticker symbol cannot be empty.")
        
    try:
        result = run_monte_carlo_dcf(
            ticker=ticker_upper,
            wacc_override=request.wacc,
            growth_override=request.growth_rate,
            perpetuity_override=request.perpetuity_growth,
            num_simulations=request.simulations
        )
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error running DCF simulation for {ticker_upper}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to run DCF simulation for '{ticker_upper}': {str(e)}"
        )
