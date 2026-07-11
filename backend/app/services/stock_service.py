import time
import logging
from typing import Optional, Dict, Any, List
import pandas as pd
import yfinance as yf

from app.schemas.stock import StockDataResponse, FinancialMetricsTTM, StockPriceItem, NewsArticleItem

logger = logging.getLogger(__name__)

def safe_float(val: Any) -> Optional[float]:
    """Safely converts a value to float, handling None and pandas NaNs."""
    if val is None:
        return None
    if pd.isna(val):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def safe_int(val: Any) -> Optional[int]:
    """Safely converts a value to int, handling None and pandas NaNs."""
    if val is None:
        return None
    if pd.isna(val):
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None

def get_ttm_metric_from_quarters(quarterly_df: pd.DataFrame, row_keywords: List[str]) -> Optional[float]:
    """
    Tries to calculate Trailing 12-Month (TTM) metric by summing the last 4 quarters of data.
    """
    if quarterly_df is None or quarterly_df.empty:
        return None
    
    # Locate the target row using case-insensitive matching
    target_row = None
    for keyword in row_keywords:
        for idx in quarterly_df.index:
            if keyword.lower() == str(idx).strip().lower():
                target_row = quarterly_df.loc[idx]
                break
        if target_row is not None:
            break
            
    if target_row is None or len(target_row) == 0:
        return None
        
    try:
        # Drop missing values
        series = target_row.dropna()
        if series.empty:
            return None
        
        # Ensure the index is parsed as datetime and sort descending (most recent first)
        series.index = pd.to_datetime(series.index)
        sorted_series = series.sort_index(ascending=False)
        
        # Sum up to the latest 4 quarters
        latest_4 = sorted_series.head(4)
        if len(latest_4) > 0:
            return float(latest_4.sum())
    except Exception as e:
        logger.warning(f"Error calculating TTM for keywords {row_keywords}: {e}")
        # Fallback to simple head sum
        try:
            return float(target_row.head(4).sum())
        except Exception:
            pass
            
    return None

def fetch_stock_data(ticker_symbol: str) -> StockDataResponse:
    """
    Fetches stock data from yfinance and aggregates it into a structured response.
    Raises ValueError if the ticker is invalid or no data is found.
    """
    ticker = yf.Ticker(ticker_symbol)
    
    # Fetch 6 months of daily history to verify validity of ticker and calculate SMA 50
    try:
        history = ticker.history(period="6mo")
    except Exception as e:
        logger.error(f"yfinance history fetch failed for {ticker_symbol}: {e}")
        raise ValueError(f"Failed to retrieve price history for ticker '{ticker_symbol}': {e}")
        
    if history.empty:
        raise ValueError(f"Ticker '{ticker_symbol}' not found or has no trading history.")
        
    # Get ticker info
    try:
        info = ticker.info or {}
    except Exception as e:
        logger.warning(f"yfinance info fetch failed for {ticker_symbol}: {e}")
        info = {}

    # Parse daily prices
    # Calculate technical indicators over the history DataFrame
    df = history.copy()
    df['sma20'] = df['Close'].rolling(window=20).mean()
    df['sma50'] = df['Close'].rolling(window=50).mean()
    
    # RSI 14
    delta = df['Close'].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss.replace(0.0, 1e-10)
    df['rsi14'] = 100 - (100 / (1 + rs))
    
    # MACD (EMA 12, EMA 26, Signal 9)
    ema12 = df['Close'].ewm(span=12, adjust=False).mean()
    ema26 = df['Close'].ewm(span=26, adjust=False).mean()
    df['macd_line'] = ema12 - ema26
    df['macd_signal'] = df['macd_line'].ewm(span=9, adjust=False).mean()
    df['macd_histogram'] = df['macd_line'] - df['macd_signal']

    # Parse daily prices
    prices: List[StockPriceItem] = []
    for index, row in df.iterrows():
        # format date as YYYY-MM-DD
        date_str = index.strftime("%Y-%m-%d")
        prices.append(StockPriceItem(
            date=date_str,
            open=safe_float(row.get("Open")),
            high=safe_float(row.get("High")),
            low=safe_float(row.get("Low")),
            close=safe_float(row.get("Close")),
            volume=safe_int(row.get("Volume")),
            sma20=safe_float(row.get("sma20")),
            sma50=safe_float(row.get("sma50")),
            rsi14=safe_float(row.get("rsi14")),
            macd_histogram=safe_float(row.get("macd_histogram")),
            macd_line=safe_float(row.get("macd_line")),
            macd_signal=safe_float(row.get("macd_signal"))
        ))

    # Parse TTM financial metrics
    # Try computing TTM revenue and TTM net income from quarterly statements first
    try:
        quarterly_financials = ticker.quarterly_financials
    except Exception as e:
        logger.warning(f"yfinance quarterly financials fetch failed for {ticker_symbol}: {e}")
        quarterly_financials = pd.DataFrame()

    ttm_revenue = get_ttm_metric_from_quarters(
        quarterly_financials, 
        ["Total Revenue", "Revenue", "TotalRevenue", "Operating Revenue"]
    )
    # Fallback to info total revenue if calculation fails
    if ttm_revenue is None:
        ttm_revenue = safe_float(info.get("totalRevenue"))

    ttm_net_income = get_ttm_metric_from_quarters(
        quarterly_financials, 
        ["Net Income", "NetIncome", "Net Income Common Stockholders", "Net Income From Continuing Ops"]
    )
    # Fallback to info net income if calculation fails
    if ttm_net_income is None:
        ttm_net_income = safe_float(info.get("netIncomeToCommon") or info.get("netIncome"))

    metrics = FinancialMetricsTTM(
        trailing_pe=safe_float(info.get("trailingPE")),
        forward_pe=safe_float(info.get("forwardPE")),
        trailing_eps=safe_float(info.get("trailingEps")),
        forward_eps=safe_float(info.get("forwardEps")),
        profit_margin=safe_float(info.get("profitMargins")),
        operating_margin=safe_float(info.get("operatingMargins")),
        gross_margin=safe_float(info.get("grossMargins")),
        return_on_equity=safe_float(info.get("returnOnEquity")),
        return_on_assets=safe_float(info.get("returnOnAssets")),
        ebitda=safe_float(info.get("ebitda")),
        trailing_revenue=ttm_revenue,
        trailing_net_income=ttm_net_income,
        dividend_yield=safe_float(info.get("dividendYield")),
        price_to_book=safe_float(info.get("priceToBook")),
        enterprise_to_revenue=safe_float(info.get("enterpriseToRevenue")),
        enterprise_to_ebitda=safe_float(info.get("enterpriseToEbitda")),
        market_cap=safe_float(info.get("marketCap"))
    )

    # Parse news articles
    news: List[NewsArticleItem] = []
    try:
        raw_news = ticker.news or []
    except Exception as e:
        logger.warning(f"yfinance news fetch failed for {ticker_symbol}: {e}")
        raw_news = []

    for item in raw_news:
        content = item.get("content", {}) if isinstance(item.get("content"), dict) else item
        
        # Extract title
        title = content.get("title")
        
        # Extract publisher
        publisher = None
        provider = content.get("provider", {})
        if isinstance(provider, dict):
            publisher = provider.get("displayName")
        if not publisher:
            publisher = content.get("publisher")
            
        # Extract link
        link = None
        click_through = content.get("clickThroughUrl", {})
        if isinstance(click_through, dict):
            link = click_through.get("url")
        if not link:
            canonical = content.get("canonicalUrl", {})
            if isinstance(canonical, dict):
                link = canonical.get("url")
        if not link:
            link = content.get("link")
            
        # Extract publish time as epoch timestamp
        publish_time = None
        pub_date = content.get("pubDate")
        if pub_date:
            try:
                # Handle Z at the end for python standard isoformat parsing
                if pub_date.endswith("Z"):
                    pub_date = pub_date[:-1] + "+00:00"
                from datetime import datetime
                dt = datetime.fromisoformat(pub_date)
                publish_time = int(dt.timestamp())
            except Exception:
                pass
        
        # Fallback to old providerPublishTime field
        if publish_time is None:
            publish_time = safe_int(content.get("providerPublishTime"))
            
        # Extract type
        article_type = content.get("contentType") or content.get("type")
        
        news.append(NewsArticleItem(
            title=title,
            publisher=publisher,
            link=link,
            publish_time=publish_time,
            type=article_type
        ))

    company_name = info.get("longName") or info.get("shortName") or ticker_symbol

    return StockDataResponse(
        ticker=ticker_symbol.upper(),
        company_name=company_name,
        metrics=metrics,
        prices=prices,
        news=news,
        cached_at=time.time()
    )
