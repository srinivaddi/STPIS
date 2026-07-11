import logging
import time
from fastapi import FastAPI, HTTPException, Response
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
def get_stock_insight(ticker: str, response: Response):
    """
    Generates technical, fundamental, and sentiment investment insights for a given ticker using the AI agent.
    Results are cached in memory for 5 minutes.
    """
    ticker_upper = ticker.strip().upper()
    if not ticker_upper:
        raise HTTPException(status_code=400, detail="Ticker symbol cannot be empty.")

    cache_key = f"{ticker_upper}:insight"

    # Bypass cache for insights to ensure fresh real-time calculations
    # cached_insight = stock_cache.get(cache_key)
    # if cached_insight:
    #     logger.info(f"Cache HIT for insight: {ticker_upper}")
    #     response.headers["X-Cache"] = "HIT"
    #     return cached_insight

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
