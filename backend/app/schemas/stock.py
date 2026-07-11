from pydantic import BaseModel, Field
from typing import List, Optional

class FinancialMetricsTTM(BaseModel):
    # Trailing 12-month & key valuation metrics
    trailing_pe: Optional[float] = Field(None, description="Trailing Price-to-Earnings Ratio")
    forward_pe: Optional[float] = Field(None, description="Forward Price-to-Earnings Ratio")
    trailing_eps: Optional[float] = Field(None, description="Trailing Earnings Per Share")
    forward_eps: Optional[float] = Field(None, description="Forward Earnings Per Share")
    profit_margin: Optional[float] = Field(None, description="Profit Margin")
    operating_margin: Optional[float] = Field(None, description="Operating Margin")
    gross_margin: Optional[float] = Field(None, description="Gross Margin")
    return_on_equity: Optional[float] = Field(None, description="Return on Equity (ROE)")
    return_on_assets: Optional[float] = Field(None, description="Return on Assets (ROA)")
    ebitda: Optional[float] = Field(None, description="EBITDA")
    trailing_revenue: Optional[float] = Field(None, description="Trailing 12-Month Revenue")
    trailing_net_income: Optional[float] = Field(None, description="Trailing 12-Month Net Income")
    dividend_yield: Optional[float] = Field(None, description="Dividend Yield")
    price_to_book: Optional[float] = Field(None, description="Price to Book Ratio")
    enterprise_to_revenue: Optional[float] = Field(None, description="Enterprise Value to Revenue")
    enterprise_to_ebitda: Optional[float] = Field(None, description="Enterprise Value to EBITDA")
    market_cap: Optional[float] = Field(None, description="Total Market Capitalization")

class StockPriceItem(BaseModel):
    # Daily stock price representation
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    open: Optional[float] = Field(None, description="Opening price")
    high: Optional[float] = Field(None, description="Highest price of the day")
    low: Optional[float] = Field(None, description="Lowest price of the day")
    close: Optional[float] = Field(None, description="Closing price")
    volume: Optional[int] = Field(None, description="Trading volume")
    # Technical indicator series for charting
    sma20: Optional[float] = Field(None, description="20-day SMA value")
    sma50: Optional[float] = Field(None, description="50-day SMA value")
    rsi14: Optional[float] = Field(None, description="14-day RSI value")
    macd_histogram: Optional[float] = Field(None, description="MACD histogram value")
    macd_line: Optional[float] = Field(None, description="MACD line value")
    macd_signal: Optional[float] = Field(None, description="MACD signal line value")

class NewsArticleItem(BaseModel):
    # News article metadata
    title: Optional[str] = Field(None, description="Article title")
    publisher: Optional[str] = Field(None, description="Publisher name")
    link: Optional[str] = Field(None, description="Direct URL link to article")
    publish_time: Optional[int] = Field(None, description="Publish time in epoch seconds")
    type: Optional[str] = Field(None, description="Article type (e.g. STORY, VIDEO)")

class StockDataResponse(BaseModel):
    # Overall response structure
    ticker: str = Field(..., description="Stock ticker symbol")
    company_name: Optional[str] = Field(None, description="Full name of the company")
    metrics: FinancialMetricsTTM = Field(..., description="Trailing 12-month and key valuation metrics")
    prices: List[StockPriceItem] = Field(..., description="Daily stock prices for the last 30 days")
    news: List[NewsArticleItem] = Field(..., description="Recent news articles mentioning the stock")
    cached_at: float = Field(..., description="Timestamp in seconds when the data was fetched and cached")
