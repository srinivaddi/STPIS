import os
import time
import json
import logging
from typing import Dict, Any, List, Optional
import pandas as pd
from huggingface_hub import InferenceClient

try:
    import google.generativeai as genai
except ModuleNotFoundError:
    # Fallback mock for testing without actual Google Gemini library
    class _MockGenAI:
        @staticmethod
        def configure(api_key: str):
            pass

        @staticmethod
        def list_models():
            # Return a list with a dummy model object having 'name' attribute
            class _DummyModel:
                name = "gemini-1.5-flash"
            return [_DummyModel()]

        @staticmethod
        def GenerativeModel(model_name):
            # Return a mock model with generate_content method
            class _MockModel:
                def generate_content(self, *args, **kwargs):
                    class _Response:
                        def __init__(self):
                            self.text = "{}"
                    return _Response()
            return _MockModel()
    genai = _MockGenAI()

from enum import Enum

class Provider(str, Enum):
    LOCAL = "LOCAL"
    GOOGLE = "GOOGLE"
    HUGGINGFACE = "HUGGINGFACE"

from app.schemas.stock import StockDataResponse
from app.schemas.insight import StockInsightResponse, TechnicalScales, FundamentalComparisonItem, RiskMetrics, BacktestPerformance, ScreenerAnalysis, ScreenerStockItem
from app.services.backtester import StrategyBacktester

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are a highly analytical Financial Research AI. Your job is to perform a deep-dive technical, fundamental, and sentiment analysis on a stock ticker based on the raw financial metrics, price history, technical indicators, and news articles provided.

You must evaluate and return your analysis in strict JSON matching the required schema. Do not include any markdown formatting (like ```json), backticks, or prefix/suffix text. Output ONLY the raw JSON string.

Analyze:
1. Technical Momentum: Check the 14-day RSI (overbought >70, oversold <30, neutral otherwise) and price relative to 20-day SMA.
2. Fundamental Health: Review valuation multiples (P/E ratio) and margins (profit, gross, operating margins) and Return on Equity (ROE).
3. Sentiment Analysis: Synthesize current news articles and headlines into Bullish, Bearish, or Neutral aggregate sentiment.
4. Key Risks: List 3 to 5 realistic, high-impact risks for the company based on the financials and recent news.
5. Rating: Provide Buy, Hold, or Sell recommendation based on technicals, fundamentals, and risks.
"""

class StockInsightAgent:
    def __init__(self):
        # Try to load .env manually
        try:
            for env_path in [".env", "backend/.env", "../.env"]:
                if os.path.exists(env_path):
                    with open(env_path, "r") as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("#") and "=" in line:
                                key, val = line.split("=", 1)
                                os.environ[key.strip()] = val.strip()
                    logger.info(f"Loaded variables from .env file: {env_path}")
                    break
        except Exception as e:
            logger.warning(f"Failed to manually load .env file: {e}")

        provider_env = os.environ.get("LLM_PROVIDER", "GOOGLE").upper().strip()
        try:
            self.llm_provider = Provider(provider_env)
        except ValueError:
            logger.warning(f"Invalid LLM_PROVIDER value '{provider_env}'. Defaulting to GOOGLE.")
            self.llm_provider = Provider.GOOGLE

        self.use_local_llm = (self.llm_provider == Provider.LOCAL)
        self.use_google_api = (self.llm_provider == Provider.GOOGLE)
        self.use_batch = os.environ.get("BATCH", "false").lower() == "true"
        self.ollama_model = os.environ.get("OLLAMA_MODEL", "llama3")
        self.hf_token = os.environ.get("HF_TOKEN", "")
        self.hf_model = os.environ.get("HF_MODEL", "meta-llama/Llama-3.2-3B-Instruct")

        # Configure Gemini API key from environment
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client_ready = False
        # Allow model name override via env var; fallback to first supported model
        self.model_name = os.getenv("INSIGHT_MODEL_NAME")
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.client_ready = True
                logger.info("Gemini API key configured successfully.")
                # Determine appropriate model name if not set
                if not self.model_name:
                    self.model_name = self._select_supported_model()
                    logger.info(f"Selected default model: {self.model_name}")
                else:
                    logger.info(f"Using model from INSIGHT_MODEL_NAME: {self.model_name}")
            except Exception as e:
                logger.error(f"Error configuring Gemini client: {e}")
        else:
            logger.warning("GEMINI_API_KEY environment variable not set. Running StockInsightAgent in MOCK mode.")

    def _select_supported_model(self) -> str:
        """Select a Gemini model that supports generateContent.
        Falls back to "gemini-1.5-flash" if discovery fails.
        """
        try:
            models = genai.list_models()
            for m in models:
                if hasattr(m, "supported_generation_methods") and "generateContent" in m.supported_generation_methods:
                    return m.name
        except Exception as e:
            logger.warning(f"Failed to list models dynamically: {e}")
        # Fallback
        return "gemini-1.5-flash"

    def _compute_technical_scales(self, prices: List[Dict[str, Any]], indicators: Dict[str, Any]) -> TechnicalScales:
        """Compute additional technical scale values.
        Returns a TechnicalScales pydantic instance.
        """
        df = pd.DataFrame(prices)
        if df.empty:
            return TechnicalScales(rsi14=0.0, sma20=0.0, sma50=0.0, macd_histogram=0.0, trend_score=0.0, momentum_score=0.0)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        # SMA50
        df['sma50'] = df['close'].rolling(window=50).mean()
        latest = df.iloc[-1]
        # MACD histogram (EMA12 - EMA26) and signal EMA9
        ema12 = df['close'].ewm(span=12, adjust=False).mean()
        ema26 = df['close'].ewm(span=26, adjust=False).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        macd_hist = macd_line - signal_line
        macd_hist_latest = macd_hist.iloc[-1]
        # Trend score: simple heuristic based on price vs SMA20
        sma20 = indicators.get('sma20') or 0.0
        latest_close = indicators.get('latest_close') or 0.0
        trend_score = 70.0 if latest_close > sma20 else 30.0
        # Momentum score from RSI (scaled 0Ã¢â‚¬â€˜100)
        rsi = indicators.get('rsi14') or 0.0
        momentum_score = rsi
        return TechnicalScales(
            rsi14=round(rsi, 2),
            sma20=round(sma20, 2),
            sma50=round(latest.get('sma50') if not pd.isna(latest.get('sma50')) else 0.0, 2),
            macd_histogram=round(macd_hist_latest, 2),
            trend_score=round(trend_score, 2),
            momentum_score=round(momentum_score, 2)
        )

    def _compute_fundamental_comparisons(self, metrics: Dict[str, Any]) -> List[FundamentalComparisonItem]:
        """Generate comparison items for selected fundamental metrics against hardÃ¢â‚¬â€˜coded benchmarks.
        Returns a list of FundamentalComparisonItem instances.
        """
        # HardÃ¢â‚¬â€˜coded benchmark values (example values; in a real system these would be fetched dynamically)
        benchmark_map = {
            "trailing_pe": 20.0,
            "forward_pe": 18.0,
            "peg_ratio": 1.5,
            "price_to_book": 3.0,
            "profit_margin": 0.10,
            "revenue_growth": 0.12,
            "earnings_growth": 0.15,
            "free_cash_flow": 0.08,
            "beta": 1.80
        }
        items: List[FundamentalComparisonItem] = []
        metric_names = {
            "trailing_pe": "Trailing P/E",
            "forward_pe": "Forward P/E",
            "peg_ratio": "PEG Ratio",
            "price_to_book": "Price/Book",
            "profit_margin": "Profit Margin",
            "revenue_growth": "Revenue Growth (YoY)",
            "earnings_growth": "Earnings Growth (YoY)",
            "free_cash_flow": "Free Cash Flow",
            "beta": "Beta"
        }
        for key, bench_val in benchmark_map.items():
            if key in metrics and metrics[key] is not None:
                company_val = metrics[key]
                # Simple explanation based on comparison
                if isinstance(company_val, (int, float)):
                    diff = company_val - bench_val
                    if diff > 0:
                        expl = f"Above benchmark ({bench_val}) indicating stronger performance."
                    elif diff < 0:
                        expl = f"Below benchmark ({bench_val}) indicating weaker performance."
                    else:
                        expl = f"Equal to benchmark ({bench_val})."
                else:
                    expl = "No numeric comparison available."
                items.append(FundamentalComparisonItem(
                    metric=metric_names.get(key, key),
                    value=round(float(company_val), 2) if isinstance(company_val, (int, float)) else 0.0,
                    benchmark=bench_val,
                    explanation=expl
                ))
        return items

    def calculate_indicators(self, prices: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates 14-day RSI and 20-day SMA from daily prices.
        """
        if len(prices) < 14:
            logger.warning(f"Insufficient price history ({len(prices)} entries) to calculate technical indicators.")
            return {
                "latest_close": prices[-1].get("close") if prices else None,
                "sma20": None,
                "rsi14": None
            }

        try:
            df = pd.DataFrame(prices)
            # Ensure sorted chronologically
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date').reset_index(drop=True)
            
            # Simple Moving Average
            df['sma20'] = df['close'].rolling(window=20).mean()
            
            # Relative Strength Index (RSI)
            delta = df['close'].diff()
            gain = delta.where(delta > 0, 0.0)
            loss = -delta.where(delta < 0, 0.0)
            
            # Use standard Wilder's smoothing or simple rolling mean
            avg_gain = gain.rolling(window=14).mean()
            avg_loss = loss.rolling(window=14).mean()
            
            # Avoid division by zero
            rs = avg_gain / avg_loss.replace(0.0, 1e-10)
            df['rsi14'] = 100 - (100 / (1 + rs))
            
            latest = df.iloc[-1]
            
            # Convert NaN to None
            sma20_val = latest['sma20']
            rsi14_val = latest['rsi14']
            
            return {
                "latest_close": float(latest['close']) if not pd.isna(latest['close']) else None,
                "sma20": float(sma20_val) if not pd.isna(sma20_val) else None,
                "rsi14": float(rsi14_val) if not pd.isna(rsi14_val) else None
            }
        except Exception as e:
            logger.error(f"Error calculating technical indicators: {e}")
            return {
                "latest_close": prices[-1].get("close") if prices else None,
                "sma20": None,
                "rsi14": None
            }

    def _compute_risk_metrics(self, prices: List[Dict[str, Any]]) -> 'RiskMetrics':
        """Compute risk metrics from price history.
        Returns a RiskMetrics pydantic instance with values formatted to two decimals.
        """
        # Convert to DataFrame
        df = pd.DataFrame(prices)
        if df.empty or 'close' not in df.columns:
            # Return zeros if insufficient data
            return RiskMetrics(annual_volatility=0.0, sharpe_ratio=0.0, max_drawdown=0.0, avg_daily_return=0.0)
        # Ensure chronological order
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        # Daily returns
        df['return'] = df['close'].pct_change()
        daily_returns = df['return'].dropna()
        if daily_returns.empty:
            return RiskMetrics(annual_volatility=0.0, sharpe_ratio=0.0, max_drawdown=0.0, avg_daily_return=0.0)
        # Annualized volatility (percentage)
        vol = daily_returns.std() * (252 ** 0.5) * 100
        # Average daily return (percentage)
        avg_ret = daily_returns.mean() * 100
        # Sharpe ratio (riskÃ¢â‚¬â€˜free assumed 0)
        sharpe = (daily_returns.mean() * 252) / (daily_returns.std() * (252 ** 0.5)) if daily_returns.std() != 0 else 0.0
        # Max drawdown (percentage)
        cumulative_max = df['close'].cummax()
        drawdown = (df['close'] - cumulative_max) / cumulative_max
        max_dd = drawdown.min() * 100  # negative value, take absolute
        max_dd = abs(max_dd)
        # Round to two decimal places
        return RiskMetrics(
            annual_volatility=round(vol, 2),
            sharpe_ratio=round(sharpe, 2),
            max_drawdown=round(max_dd, 2),
            avg_daily_return=round(avg_ret, 2)
        )

    def _build_analysis_prompt(self, stock_data: Dict[str, Any], indicators: Dict[str, Any]) -> str:
        """
        Formats stock data and indicators into a structured payload for the LLM.
        """
        # Format recent prices (latest 10 entries for brevity in prompt)
        recent_prices = stock_data.get('prices', [])
        price_history_str = "\n".join([
            f"  Date: {p.get('date')}, Close: {p.get('close')}, Volume: {p.get('volume')}" 
            for p in recent_prices[-10:]
        ])
        
        # Format recent news headlines
        news_items = stock_data.get('news', [])
        news_str = ""
        for idx, item in enumerate(news_items[:5]):
            pub_time = item.get('publish_time')
            date_str = "Unknown Date"
            if pub_time:
                try:
                    date_str = time.strftime('%Y-%m-%d', time.gmtime(pub_time))
                except Exception:
                    pass
            news_str += f"\n  Article {idx+1} ({date_str}):\n    Title: {item.get('title')}\n    Publisher: {item.get('publisher')}\n"

        metrics = stock_data.get('metrics', {})

        prompt = f"""
Analyze the following financial data for stock ticker: {stock_data.get('ticker')} ({stock_data.get('company_name')})

1. Trailing 12-Month (TTM) Financial Metrics:
- Trailing P/E Ratio: {metrics.get('trailing_pe')}
- Forward P/E Ratio: {metrics.get('forward_pe')}
- Trailing EPS: {metrics.get('trailing_eps')}
- Forward EPS: {metrics.get('forward_eps')}
- Profit Margin: {metrics.get('profit_margin')}
- Operating Margin: {metrics.get('operating_margin')}
- Gross Margin: {metrics.get('gross_margin')}
- Return on Equity (ROE): {metrics.get('return_on_equity')}
- Return on Assets (ROA): {metrics.get('return_on_assets')}
- EBITDA: {metrics.get('ebitda')}
- Trailing Revenue (TTM): {metrics.get('trailing_revenue')}
- Trailing Net Income (TTM): {metrics.get('trailing_net_income')}
- Price-to-Book Ratio: {metrics.get('price_to_book')}
- Enterprise Value to Revenue: {metrics.get('enterprise_to_revenue')}
- Enterprise Value to EBITDA: {metrics.get('enterprise_to_ebitda')}
- Market Capitalization: {metrics.get('market_cap')}

2. Calculated Technical Indicators (Last 30 Days):
- Latest Close Price: {indicators.get('latest_close')}
- 20-day Simple Moving Average (SMA): {indicators.get('sma20')}
- 14-day Relative Strength Index (RSI): {indicators.get('rsi14')}

3. Daily Trading Price Trend (Last 10 Trading Days):
{price_history_str}

4. Recent News Articles:
{news_str if news_str else "  No recent news articles found."}
"""
        return prompt

    def _calculate_score_rating_confidence(self, indicators: Dict[str, Any], metrics: Dict[str, Any], insider_txs: List[Dict[str, Any]], sec_etf: Dict[str, Any], capital_alloc: Dict[str, Any]) -> tuple:
        score = 50
        
        # 1. Technical Factor (+15 / -15)
        close_price = indicators.get("latest_close") or 0.0
        sma20 = indicators.get("sma20") or 0.0
        rsi = indicators.get("rsi14") or 50.0
        
        if close_price > sma20:
            score += 10
        else:
            score -= 10
        if 40 <= rsi <= 65:
            score += 5
        elif rsi > 70:
            score -= 5
        elif rsi < 30:
            score += 5
            
        # 2. Fundamental Factor (+20 / -30)
        margin = metrics.get("profit_margin")
        pe = metrics.get("trailing_pe")
        roe = metrics.get("return_on_equity")
        
        if margin is not None:
            if margin > 0.15:
                score += 10
            elif margin < 0.05:
                score -= 15
        else:
            score -= 5
            
        if pe is not None:
            if 0 < pe <= 22:
                score += 10
            elif pe > 35 or pe <= 0:
                score -= 15
        else:
            score -= 5
            
        if roe is not None:
            if roe > 0.15:
                score += 10
            elif roe < 0.05:
                score -= 15
        else:
            score -= 5
            
        # 3. Insider Activity Factor (+5 / -5)
        insider_buys = any("buy" in str(tx.get("transaction_type", "")).lower() for tx in insider_txs)
        if insider_buys:
            score += 5
        else:
            score -= 5
            
        # 4. Macro & Sector Factor (+10 / -10)
        etf_ret_1m = sec_etf.get("one_month_return", 0.0)
        etf_ret_6m = sec_etf.get("six_month_return", 0.0)
        if etf_ret_1m > 0:
            score += 5
        else:
            score -= 5
        if etf_ret_6m > 0:
            score += 5
        else:
            score -= 5
            
        # 5. Capital Allocation Factor (+15 / -20)
        roe_val = capital_alloc.get("return_on_equity", 0.0)
        payout_val = capital_alloc.get("payout_ratio", 0.0)
        if roe_val > 15.0:
            score += 10
        elif roe_val < 5.0:
            score -= 15
        if 10.0 <= payout_val <= 60.0:
            score += 5
        else:
            score -= 5
            
        # Ensure score stays within 0-100 bounds
        score = min(100, max(0, score))
        
        # More granular rating thresholds
        if score >= 80:
            rating = "Buy"
        elif score <= 20:
            rating = "Sell"
        else:
            rating = "Hold"
        
        # Confidence directly reflects the normalized score (0-100)
        # Confidence is scaled to reflect moderate certainty based on score
        # Base confidence starts at 60% when score is 50, scaling 0.4 per point deviation
        confidence = round(60 + (score - 50) * 0.4, 1)
        # Ensure confidence stays within 0-100 bounds
        confidence = max(0, min(100, confidence))
        return score, rating, confidence

    def _get_mock_insight(self, ticker: str, stock_data: StockDataResponse, indicators: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns a mock investment analysis response for development when API Key is missing.
        Completely dynamic based on actual metrics from yfinance.
        """
        logger.info(f"Generating dynamic mock analysis for {ticker}")
        
        # Generate ticker-specific misinformation claims
        t_upper = ticker.upper()
        if t_upper == "TSLA":
            reports = [
                {
                    "claim": "Tesla has secured autonomous Robotaxi operations clearance in all major EU cities.",
                    "verdict": "False",
                    "credibility_score": 5.0,
                    "source_count": 14,
                    "evidence": "European regulatory authorities confirmed no such approvals have been granted. Self-driving regulations remain in trial stages."
                },
                {
                    "claim": "Tesla delivered a record number of vehicles in China last month, beating local competitors.",
                    "verdict": "Verified",
                    "credibility_score": 94.0,
                    "source_count": 9,
                    "evidence": "Confirmed by official CPCA registry filings and confirmed shipping records from Gigafactory Shanghai."
                },
                {
                    "claim": "Elon Musk is preparing to sell another $5B of TSLA shares to fund new AI datacenter projects.",
                    "verdict": "Unverified",
                    "credibility_score": 28.0,
                    "source_count": 4,
                    "evidence": "No Form 4 filings have been submitted. Claim traces back to retail rumor boards with no corporate verification."
                },
                {
                    "claim": "Tesla battery cell production cost has dropped below $60/kWh ahead of schedule.",
                    "verdict": "Misleading",
                    "credibility_score": 45.0,
                    "source_count": 6,
                    "evidence": "Exploratory lab yields show lower baseline targets, but high-volume commercial runs still track near $90-$100/kWh."
                },
                {
                    "claim": "Tesla is pausing Gigafactory Berlin expansion due to local environmental lawsuits.",
                    "verdict": "Verified",
                    "credibility_score": 88.0,
                    "source_count": 7,
                    "evidence": "Berlin local court records show temporary injunction pending site assessment filings from regional environmental groups."
                }
            ]
        elif t_upper == "NVDA":
            reports = [
                {
                    "claim": "NVIDIA is facing a secret SEC probe for overstating chip demand indicators.",
                    "verdict": "False",
                    "credibility_score": 12.0,
                    "source_count": 10,
                    "evidence": "No SEC filings or regulatory alerts confirm any ongoing probe. Claim originates from a known short-seller blog."
                },
                {
                    "claim": "NVIDIA Blackwell chips are sold out for the next 12 months per datacenter contracts.",
                    "verdict": "Verified",
                    "credibility_score": 96.0,
                    "source_count": 11,
                    "evidence": "Confirmed by management comments in recent earnings call and verified supply chain order pipelines at TSMC."
                },
                {
                    "claim": "Major tech client is planning to cut NVIDIA GPU orders by 50% next year.",
                    "verdict": "Unverified",
                    "credibility_score": 35.0,
                    "source_count": 5,
                    "evidence": "No official statements from cloud hyperscalers. Claim is based on analyst channel checks speculating custom chip switch timings."
                },
                {
                    "claim": "NVIDIA is introducing a cheap AI processor specifically designed for consumer gaming consoles.",
                    "verdict": "Misleading",
                    "credibility_score": 52.0,
                    "source_count": 8,
                    "evidence": "Next-gen console hardware details show typical silicon revisions, but it is not a dedicated standalone AI chip."
                },
                {
                    "claim": "US government is planning further export limits on NVIDIA AI processors to Middle Eastern datacenters.",
                    "verdict": "Verified",
                    "credibility_score": 85.0,
                    "source_count": 6,
                    "evidence": "Commerce Department licensing updates confirm rigorous security reviews and export limits on advanced GPU shipments."
                }
            ]
        elif t_upper == "AAPL":
            reports = [
                {
                    "claim": "Apple is canceling all iPhone 16 production runs due to component shortage.",
                    "verdict": "False",
                    "credibility_score": 3.0,
                    "source_count": 15,
                    "evidence": "Foxconn and supply chain channels confirm normal seasonal assembly schedules. Canceling production runs is completely unsubstantiated."
                },
                {
                    "claim": "Apple has officially restarted its autonomous EV Project Titan under a new leadership team.",
                    "verdict": "False",
                    "credibility_score": 7.0,
                    "source_count": 9,
                    "evidence": "Regulatory and hiring records confirm EV project remains dismantled. Talents have been fully reallocated to generative AI teams."
                },
                {
                    "claim": "Apple plans to release a cheaper version of Vision Pro headset next fall priced below $1500.",
                    "verdict": "Unverified",
                    "credibility_score": 40.0,
                    "source_count": 6,
                    "evidence": "No supplier orders verified yet. Rumor traces back to patent designs and supply analyst speculative forecasts."
                },
                {
                    "claim": "Apple is acquiring a major Hollywood studio to boost Apple TV+ catalog.",
                    "verdict": "Misleading",
                    "credibility_score": 30.0,
                    "source_count": 4,
                    "evidence": "Apple is negotiating licensing rights and co-productions but has shown no intention of acquiring a full media studio."
                },
                {
                    "claim": "EU court has ruled that Apple must pay $14B in back taxes to Ireland.",
                    "verdict": "Verified",
                    "credibility_score": 99.0,
                    "source_count": 18,
                    "evidence": "Official judgment handed down by the European Court of Justice confirming final tax payment enforcement."
                }
            ]
        elif t_upper == "MSFT":
            reports = [
                {
                    "claim": "Microsoft is preparing an all-cash buyout bid for OpenAI.",
                    "verdict": "False",
                    "credibility_score": 8.0,
                    "source_count": 13,
                    "evidence": "Antitrust regulations and partnership terms prevent acquisition. Claim is from a clickbait blog."
                },
                {
                    "claim": "Microsoft Azure experienced a global outage exposing private customer database keys.",
                    "verdict": "False",
                    "credibility_score": 11.0,
                    "source_count": 8,
                    "evidence": "Azure status page and security logs show zero breaches. Attackers amplified minor service configuration bugs."
                },
                {
                    "claim": "Microsoft is raising the Copilot Pro pricing to $49/month due to server costs.",
                    "verdict": "Unverified",
                    "credibility_score": 30.0,
                    "source_count": 5,
                    "evidence": "No official price changes announced by Microsoft. Rumors trace to tech discussion forums."
                },
                {
                    "claim": "Microsoft is planning to phase out traditional Windows OS for an all-cloud browser OS.",
                    "verdict": "Misleading",
                    "credibility_score": 42.0,
                    "source_count": 7,
                    "evidence": "Windows 365 Cloud PC is expanding for corporate users, but standard local desktop Windows remains the core consumer strategy."
                },
                {
                    "claim": "Microsoft is investing $10B in constructing a new nuclear-powered AI datacenter.",
                    "verdict": "Verified",
                    "credibility_score": 87.0,
                    "source_count": 9,
                    "evidence": "Microsoft signed power purchase agreements with Constellation Energy to restart Three Mile Island reactor for datacenter power."
                }
            ]
        elif t_upper == "AMZN":
            reports = [
                {
                    "claim": "Amazon is closing its Prime Video division due to regulatory investigations.",
                    "verdict": "False",
                    "credibility_score": 5.0,
                    "source_count": 11,
                    "evidence": "Prime Video content investments remain at historic highs. Claims are completely false."
                },
                {
                    "claim": "US FAA has banned all Amazon Prime Air drone operations due to safety issues.",
                    "verdict": "False",
                    "credibility_score": 9.0,
                    "source_count": 6,
                    "evidence": "FAA actually expanded Amazon's drone flight approvals for beyond-visual-line-of-sight operations."
                },
                {
                    "claim": "Amazon plans to open 500 cashierless physical grocery stores next year.",
                    "verdict": "Unverified",
                    "credibility_score": 38.0,
                    "source_count": 4,
                    "evidence": "No real estate acquisition data supports this level of expansion. Rumor stems from internal target drafts."
                },
                {
                    "claim": "Amazon is launching a prescription drug delivery service that guarantees delivery in under 30 minutes.",
                    "verdict": "Misleading",
                    "credibility_score": 50.0,
                    "source_count": 6,
                    "evidence": "Amazon Pharmacy is testing drone deliveries in select cities, but standard delivery remains same-day or next-day."
                },
                {
                    "claim": "FTC antitrust lawsuit against Amazon is going to trial next year.",
                    "verdict": "Verified",
                    "credibility_score": 92.0,
                    "source_count": 12,
                    "evidence": "Confirmed by federal court dockets and official scheduling order issued by the presiding judge."
                }
            ]
        else:
            # Deterministic hash to generate varying claim details dynamically for ANY ticker (e.g. META, GOOG, NFLX)
            h = sum(ord(c) for c in t_upper)
            reports = [
                {
                    "claim": f"Insider transaction filings reveal that {t_upper} executives sold a significant block of shares ahead of an unannounced product delay.",
                    "verdict": "False" if h % 2 == 0 else "Verified",
                    "credibility_score": 15.0 if h % 2 == 0 else 88.0,
                    "source_count": (h % 7) + 3,
                    "evidence": f"Form 4 filings indicate all sales were pre-planned under SEC Rule 10b5-1 plans. No product delays have been suggested." if h % 2 == 0 else f"Form 4 records confirm non-routine sales by multiple executive officers occurred over consecutive trading days."
                },
                {
                    "claim": f"A major patent infringement lawsuit has been filed against {t_upper} by a competitor, seeking to block key software distribution.",
                    "verdict": "Unverified" if h % 3 == 0 else "False",
                    "credibility_score": 34.0 if h % 3 == 0 else 8.0,
                    "source_count": (h % 5) + 2,
                    "evidence": f"A complaint has been registered in federal dockets, but legal analysts suggest it lacks merit and won't restrict operations." if h % 3 == 0 else f"No court docket matches the alleged filing. Rumor originated on an anonymous stock forum."
                },
                {
                    "claim": f"{t_upper} plans to announce a strategic partnership in the APAC region to expand logistics infrastructure.",
                    "verdict": "Verified" if h % 4 == 0 else "Misleading",
                    "credibility_score": 91.0 if h % 4 == 0 else 42.0,
                    "source_count": (h % 9) + 4,
                    "evidence": f"Confirmed by a joint press release on the corporate portal and validated by regional regulatory filings." if h % 4 == 0 else f"The companies signed a non-binding memorandum of understanding for future exploratory discussions, not a finalized deal."
                },
                {
                    "claim": f"An anonymous source claims {t_upper} is planning a 2-for-1 stock split next month.",
                    "verdict": "Unverified",
                    "credibility_score": 25.0,
                    "source_count": (h % 4) + 1,
                    "evidence": f"No board resolution or proxy statements have been filed. The rumor lacks backing from official channels."
                },
                {
                    "claim": f"Rumors indicate {t_upper} is experiencing temporary supply chain constraints due to custom component bottlenecks.",
                    "verdict": "Misleading" if h % 5 == 0 else "Verified",
                    "credibility_score": 48.0 if h % 5 == 0 else 82.0,
                    "source_count": (h % 6) + 3,
                    "evidence": f"Supply chain channels confirm normal lead times. A minor shipment delay was amplified as a systemic issue." if h % 5 == 0 else f"CFO confirmed component constraints will impact output volumes by approximately 3-5% next quarter."
                }
            ]

        prices_list = [p.model_dump() for p in stock_data.prices]
        metrics = stock_data.metrics.model_dump() if hasattr(stock_data.metrics, "model_dump") else stock_data.metrics
        
        risk_metrics = self._compute_risk_metrics(prices_list)
        technical_scales = self._compute_technical_scales(prices_list, indicators)
        fundamental_comparisons = self._compute_fundamental_comparisons(metrics)

        # Run strategy backtest on prices_list
        try:
            prices_df = pd.DataFrame(prices_list)
            backtest_data = StrategyBacktester.run_backtest(prices_df)
        except Exception as be:
            logger.error(f"Error computing backtester: {be}")
            backtest_data = StrategyBacktester.get_fallback_results(ticker)

        # Retrieve actual insider/institutional transactions if available, otherwise fallback
        from app.tools import get_insider_transactions, get_institutional_holdings, get_macro_indicators, get_competitor_comparison, get_options_chain_data, get_earnings_intelligence, get_early_warning_signals, get_valuation_opportunities, get_capital_allocation_data, run_monte_carlo_dcf    
        insider_data = get_insider_transactions(ticker)
        inst_data = get_institutional_holdings(ticker)
        insider_txs = insider_data.get("transactions", [])
        inst_holders = inst_data.get("holders", [])

        # Retrieve actual macro indicators
        import yfinance as yf
        try:
            ticker_obj = yf.Ticker(ticker)
            sector_name = ticker_obj.info.get("sector", "Technology")
        except:
            sector_name = "Technology"
        macro_data = get_macro_indicators(sector_name)
        macro_list = macro_data.get("macro_indicators", [])
        sec_etf = macro_data.get("sector_etf", {
            "ticker": "XLK",
            "name": "Technology Select Sector SPDR Fund",
            "current_price": 210.50,
            "one_month_return": 3.45,
            "six_month_return": 12.80
        })

        # Retrieve competitor benchmark metrics
        comp_data = get_competitor_comparison(ticker)
        comp_list = comp_data.get("comparisons", [])

        # Retrieve options data
        opt_data = get_options_chain_data(ticker)
        unusual_opts = opt_data.get("unusual_options", [])
        oi_ratio = opt_data.get("put_call_oi_ratio", 1.0)
        vol_ratio = opt_data.get("put_call_volume_ratio", 1.0)

        # Retrieve earnings intelligence
        earnings_intel = get_earnings_intelligence(ticker)
        earnings_history_list = earnings_intel.get("history", [])
        next_date = earnings_intel.get("next_earnings_date")
        next_est = earnings_intel.get("next_eps_estimate")

        # Retrieve early warning details
        warning_data = get_early_warning_signals(ticker)
        warning_alerts_list = warning_data.get("alerts", [])

        # Retrieve valuation opportunities
        val_opp = get_valuation_opportunities(ticker)
        dcf_sim = run_monte_carlo_dcf(ticker, num_simulations=100)

        # Retrieve capital allocation data
        capital_alloc = get_capital_allocation_data(ticker)

        # Generate simple dynamic summaries based on actual metrics
        rsi = technical_scales.rsi14
        rsi_eval = "Bullish" if rsi > 60 else "Bearish" if rsi < 40 else "Neutral"
        rsi_desc = f"The 14-day RSI for {ticker} is currently {rsi:.1f}, indicating a {rsi_eval.lower()} zone with stable volume."

        close_price = indicators.get("latest_close") or 0.0
        sma20 = indicators.get("sma20") or 0.0
        trend_eval = "Bullish" if close_price > sma20 else "Bearish"
        trend_desc = f"The price of {ticker} is trading at ${close_price:.2f}, which is {'above' if close_price > sma20 else 'below'} its 20-day SMA of ${sma20:.2f}, indicating a short-term {trend_eval.lower()} momentum bias."

        pe = metrics.get("trailing_pe")
        pe_str = f"{pe:.1f}" if pe else "N/A"
        val_eval = "Premium" if (pe or 0) > 25 else "Value" if (pe or 0) > 0 else "Neutral"
        val_desc = f"The stock {ticker} is trading at a trailing P/E of {pe_str}, representing a {val_eval.lower()} relative to market averages."

        margin = metrics.get("profit_margin")
        margin_str = f"{margin*100:.1f}%" if margin else "N/A"
        prof_desc = f"Profit margins are positioned at {margin_str}, indicating stable earnings efficiency and operational control."

        # Calculate a multi-factor composite investment score (0 to 100)
        score, rating, confidence_score = self._calculate_score_rating_confidence(
            indicators, metrics, insider_txs, sec_etf, capital_alloc
        )
        insider_buys = any("buy" in str(tx.get("transaction_type", "")).lower() for tx in insider_txs)
        etf_ret_1m = sec_etf.get("one_month_return", 0.0)

        summary_desc = (
            f"Recommend {rating} for {ticker} based on a composite factor score of {score}/100. "
            f"This recommendation is driven by a {rsi_eval.lower()} RSI momentum of {rsi:.1f}, "
            f"financial health indicated by a {margin_str} profit margin, "
            f"insider activity displaying {'buying interest' if insider_buys else 'neutral trade flows'}, "
            f"a sector ETF ({sec_etf['ticker']}) 1-month return profile of {etf_ret_1m:.2f}%, "
            f"and an efficient capital allocation strategy highlighting a return on equity (ROE) of {capital_alloc.get('return_on_equity')}%."
        )

        # Insider analysis Mock
        insider_eval = "Bullish" if insider_buys else "Neutral"
        insider_sum = f"Recent Form 4 filings reveal corporate insider trades are mostly {'bullish with strategic acquisitions' if insider_buys else 'stable with standard liquidation options'}. No emergency sales flagged."
        inst_sum = f"Institutional ownership shows a concentrated presence of index providers and mutual funds, with {len(inst_holders)} major firms representing core stability."

        # Macro analysis Mock
        macro_eval = "Favorable" if sec_etf.get("one_month_return", 0.0) >= 0 else "Neutral"
        macro_sum_text = f"US 10-Year Treasury Yields are trading at {macro_list[0]['value'] if macro_list else 4.25}%, representing a stable yield framework, while the CBOE VIX sits at {macro_list[1]['value'] if len(macro_list) > 1 else 14.50}."
        sector_sum_text = f"The mapped benchmark sector ETF ({sec_etf['ticker']}) is trading at ${sec_etf['current_price']} with a 1-month return of {sec_etf['one_month_return']}% and a 6-month return of {sec_etf['six_month_return']}%."

        # Competitor analysis Mock
        competitor_eval = "Outperforming" if score >= 60 else "In-Line" if score >= 45 else "Underperforming"
        competitor_sum_text = f"Compared against key industry peers, {ticker} exhibits a composite factor score of {score}/100. Growth vectors and operating efficiencies indicate a stable relative market position."

        # Options Flow Mock
        options_eval = "Bullish" if oi_ratio < 0.8 else "Bearish" if oi_ratio > 1.2 else "Neutral"
        options_sum_text = f"Options open interest exhibits a Put/Call ratio of {oi_ratio}, while trading volumes show a Put/Call ratio of {vol_ratio}. This suggests {'bullish speculation leverage' if oi_ratio < 0.8 else 'protective put hedging/bearish sentiment' if oi_ratio > 1.2 else 'a balanced derivatives hedging structure'}."

        # Build raw technical breakout candidates watchlist
        candidates = [
            {
                "ticker": "NVDA" if ticker.upper() != "NVDA" else "MSFT",
                "score": 88.0,
                "pattern": "Descending Triangle Breach",
                "rationale": "Sustained sector-wide ETF inflows and institutional block buys verify resistance breach parameters."
            },
            {
                "ticker": "AAPL" if ticker.upper() != "AAPL" else "GOOGL",
                "score": 84.5,
                "pattern": "Cup & Handle Breakout",
                "rationale": "Stochastic RSI oversold crossover matches baseline support consolidation channels."
            },
            {
                "ticker": "TSLA" if ticker.upper() != "TSLA" else "AMZN",
                "score": 82.0,
                "pattern": "Bullish Pennant Breakout",
                "rationale": "High relative volume surge on moving average support lines supports upside bias."
            },
            {
                "ticker": "META" if ticker.upper() != "META" else "NFLX",
                "score": 79.5,
                "pattern": "Double Bottom Crossover",
                "rationale": "MACD signal line crossover on daily chart indicates strong buying pressure."
            },
            {
                "ticker": "AMD" if ticker.upper() != "AMD" else "INTC",
                "score": 76.0,
                "pattern": "Bull Flag Consolidation",
                "rationale": "Sustained volume build on support retests suggests near-term upward expansion."
            }
        ]

        # Query ticker only joins the watchlist if it actually has a high breakout score (RSI > 60)
        if rsi > 60:
            queried_item = {
                "ticker": ticker.upper(),
                "score": 92.5,
                "pattern": "Bull Flag Consolidation",
                "rationale": f"Volume spike of 2.1x average daily volume confirmed alongside key resistance retest with RSI at {rsi:.1f}."
            }
            # Add and sort by score descending, keeping only top 5 to prevent duplicate searched ticker entries
            candidates = [c for c in candidates if c["ticker"] != ticker.upper()]
            candidates.append(queried_item)
            candidates = sorted(candidates, key=lambda x: x["score"], reverse=True)[:5]


        # Define missing variables for unified mock dictionary return block
        sma_20 = indicators.get("sma20") or 0.0
        sma_50 = indicators.get("sma50") or 0.0
        trend_status = trend_eval
        pe_ratio = pe or 0.0
        gross_margin = (metrics.get("gross_margins") or 0.45) * 100.0 if (metrics.get("gross_margins") or 0.45) < 1.0 else (metrics.get("gross_margins") or 0.45)
        operating_margin = (metrics.get("operating_margins") or 0.25) * 100.0 if (metrics.get("operating_margins") or 0.25) < 1.0 else (metrics.get("operating_margins") or 0.25)
        sentiment_score = round(max(5.0, min(95.0, rsi * 1.1)), 1)
        news_score = round(max(5.0, min(95.0, rsi * 0.9)), 1)
        dynamic_rating = rating
        dynamic_confidence = confidence_score

        # Build dynamic screener watchlist including the searched ticker
        default_screener_watchlist = [
            {"rank": 1, "ticker": "NVDA", "company_name": "NVIDIA Corporation", "composite_score": 89.5, "consensus_rating": "BUY", "technical_signal": "BULLISH", "fundamental_signal": "STRONG", "sentiment_signal": "BULLISH", "options_signal": "BULLISH"},
            {"rank": 2, "ticker": "TSLA", "company_name": "Tesla, Inc.", "composite_score": 82.0, "consensus_rating": "BUY", "technical_signal": "BULLISH", "fundamental_signal": "STRONG", "sentiment_signal": "BULLISH", "options_signal": "BULLISH"},
            {"rank": 3, "ticker": "MSFT", "company_name": "Microsoft Corporation", "composite_score": 74.2, "consensus_rating": "BUY", "technical_signal": "NEUTRAL", "fundamental_signal": "STRONG", "sentiment_signal": "NEUTRAL", "options_signal": "NEUTRAL"},
            {"rank": 4, "ticker": "AAPL", "company_name": "Apple Inc.", "composite_score": 68.5, "consensus_rating": "HOLD", "technical_signal": "NEUTRAL", "fundamental_signal": "STRONG", "sentiment_signal": "NEUTRAL", "options_signal": "NEUTRAL"},
            {"rank": 5, "ticker": "AMZN", "company_name": "Amazon.com, Inc.", "composite_score": 62.0, "consensus_rating": "HOLD", "technical_signal": "NEUTRAL", "fundamental_signal": "STRONG", "sentiment_signal": "NEUTRAL", "options_signal": "NEUTRAL"}
        ]

        t_upper = ticker.upper()
        if t_upper not in [item["ticker"] for item in default_screener_watchlist]:
            queried_item = {
                "rank": 5, "ticker": t_upper, "company_name": f"{t_upper} Corporation" if len(t_upper) <= 4 else t_upper,
                "composite_score": float(score), "consensus_rating": rating.upper(), "technical_signal": rsi_eval.upper(),
                "fundamental_signal": "STRONG" if val_eval == "Value" else "STABLE", "sentiment_signal": "BULLISH" if rsi > 50 else "NEUTRAL", "options_signal": options_eval.upper()
            }
            watchlist_candidates = default_screener_watchlist + [queried_item]
        else:
            watchlist_candidates = []
            for item in default_screener_watchlist:
                if item["ticker"] == t_upper:
                    watchlist_candidates.append({
                        "rank": item["rank"], "ticker": t_upper, "company_name": item["company_name"],
                        "composite_score": float(score), "consensus_rating": rating.upper(), "technical_signal": rsi_eval.upper(),
                        "fundamental_signal": "STRONG" if val_eval == "Value" else "STABLE", "sentiment_signal": "BULLISH" if rsi > 50 else "NEUTRAL", "options_signal": options_eval.upper()
                    })
                else:
                    watchlist_candidates.append(item)

        sorted_watchlist = sorted(watchlist_candidates, key=lambda x: x["composite_score"], reverse=True)[:5]
        for idx, item in enumerate(sorted_watchlist):
            item["rank"] = idx + 1

        # Derive risk_metrics and technical_scales from computed indicators
        ann_vol = float(indicators.get("annual_volatility", 0.25))
        sharpe = float(indicators.get("sharpe_ratio", 0.8))
        max_dd = float(indicators.get("max_drawdown", -0.15))
        avg_ret = float(indicators.get("avg_daily_return", 0.0005))
        macd_hist = float(indicators.get("macd_histogram", 0.0))
        trend_score_val = round(max(0.0, min(100.0, rsi)), 1)
        momentum_score_val = round(max(0.0, min(100.0, rsi * 1.1)), 1)

        # Build fundamental comparisons list
        fundamental_comparisons_list = [
            {"metric": "P/E Ratio", "value": pe_ratio, "benchmark": 25.0, "explanation": f"Current P/E of {pe_ratio:.1f}x vs sector benchmark of 25x."},
            {"metric": "Gross Margin %", "value": gross_margin, "benchmark": 40.0, "explanation": f"Gross margin at {gross_margin:.1f}% vs sector average of 40%."},
            {"metric": "Operating Margin %", "value": operating_margin, "benchmark": 20.0, "explanation": f"Operating margin at {operating_margin:.1f}% vs sector average of 20%."},
        ]

        # Build insider transactions from fetched data
        insider_tx_list = []
        for tx in insider_txs[:5]:
            try:
                insider_tx_list.append({
                    "date": str(tx.get("date", "2026-01-01")),
                    "transaction_type": str(tx.get("transaction_type", "Buy")),
                    "shares": float(tx.get("shares", 0)),
                    "value": float(tx.get("value", 0)),
                    "insider_name": str(tx.get("insider_name", "Executive")),
                    "position": str(tx.get("position", "Officer")),
                })
            except Exception:
                pass

        # Build institutional holders list
        inst_holders_list = []
        for h in inst_holders[:5]:
            try:
                inst_holders_list.append({
                    "holder": str(h.get("holder", "Institutional Fund")),
                    "shares": float(h.get("shares", 0)),
                    "value": float(h.get("value", 0)),
                    "pct_held": float(h.get("pct_held", 0)),
                })
            except Exception:
                pass

        # Build macro indicators list
        macro_indicators_list = []
        for m in macro_list[:4]:
            try:
                macro_indicators_list.append({
                    "name": str(m.get("name", "Indicator")),
                    "value": float(m.get("value", 0)),
                    "change": float(m.get("change", 0)),
                    "status": str(m.get("status", "Neutral")),
                })
            except Exception:
                pass
        if not macro_indicators_list:
            macro_indicators_list = [
                {"name": "US 10Y Treasury Yield", "value": 4.25, "change": 0.02, "status": "Neutral"},
                {"name": "CBOE VIX", "value": 14.5, "change": -0.3, "status": "Low"},
            ]

        # Build competitor comparisons list
        competitor_comparisons_list = []
        for c in comp_list[:4]:
            try:
                competitor_comparisons_list.append({
                    "ticker": str(c.get("ticker", "PEER")),
                    "company_name": str(c.get("company_name", "Peer Company")),
                    "pe_ratio": float(c["pe_ratio"]) if c.get("pe_ratio") is not None else None,
                    "roe": float(c["roe"]) if c.get("roe") is not None else None,
                    "revenue_growth": float(c["revenue_growth"]) if c.get("revenue_growth") is not None else None,
                    "gross_margin": float(c["gross_margin"]) if c.get("gross_margin") is not None else None,
                })
            except Exception:
                pass

        # Build unusual options list
        unusual_opts_list = []
        for o in unusual_opts[:5]:
            try:
                unusual_opts_list.append({
                    "strike": float(o.get("strike", 0)),
                    "type": str(o.get("type", "Call")),
                    "open_interest": float(o.get("open_interest", 0)),
                    "volume": float(o.get("volume", 0)),
                    "implied_volatility": float(o.get("implied_volatility", 0)),
                })
            except Exception:
                pass

        # Build earnings history list
        earnings_history_list_cleaned = []
        for e in earnings_history_list[:4]:
            try:
                earnings_history_list_cleaned.append({
                    "quarter": str(e.get("quarter", "Q1")),
                    "eps_estimate": float(e["eps_estimate"]) if e.get("eps_estimate") is not None else None,
                    "eps_actual": float(e["eps_actual"]) if e.get("eps_actual") is not None else None,
                    "surprise_pct": float(e["surprise_pct"]) if e.get("surprise_pct") is not None else None,
                })
            except Exception:
                pass

        mock_data = {
            "ticker": ticker.upper(),
            "technical_momentum": {
                "evaluation": rsi_eval,
                "rsi_analysis": rsi_desc,
                "trend_analysis": trend_desc,
            },
            "fundamental_health": {
                "evaluation": "Strong" if val_eval == "Value" else "Stable",
                "valuation_analysis": val_desc,
                "profitability_analysis": prof_desc,
            },
            "sentiment": {
                "evaluation": "Bullish" if rsi > 50 else "Neutral",
                "news_summary": f"Recent headlines show steady market outlook for {ticker} with high liquidity and active retail interest.",
            },
            "key_risks": [
                "Regulatory and policy exposure matching advanced tech sectors.",
                "Global currency exposure and multi-region supply chain dependency.",
                "Valuation multiple compressed under rising macroeconomic rate structures.",
            ],
            "overall_recommendation": {
                "rating": dynamic_rating,
                "summary": summary_desc,
                "confidence_score": dynamic_confidence,
            },
            "risk_metrics": {
                "annual_volatility": ann_vol,
                "sharpe_ratio": sharpe,
                "max_drawdown": max_dd,
                "avg_daily_return": avg_ret,
            },
            "technical_scales": {
                "rsi14": rsi,
                "sma20": sma_20,
                "sma50": sma_50,
                "macd_histogram": macd_hist,
                "trend_score": trend_score_val,
                "momentum_score": momentum_score_val,
            },
            "fundamental_comparisons": fundamental_comparisons_list,
            "insider_flow": {
                "evaluation": insider_eval,
                "insider_summary": insider_sum,
                "institutional_summary": inst_sum,
            },
            "insider_transactions": insider_tx_list,
            "institutional_holders": inst_holders_list,
            "macro_flow": {
                "evaluation": macro_eval,
                "macro_summary": macro_sum_text,
                "sector_summary": sector_sum_text,
            },
            "macro_indicators": macro_indicators_list,
            "sector_etf": {
                "ticker": sec_etf.get("ticker", "XLK"),
                "name": sec_etf.get("name", "Technology Select Sector SPDR"),
                "current_price": float(sec_etf.get("current_price", 200.0)),
                "one_month_return": float(sec_etf.get("one_month_return", 2.5)),
                "six_month_return": float(sec_etf.get("six_month_return", 12.0)),
            },
            "competitor_analysis": {
                "evaluation": competitor_eval,
                "competitor_summary": competitor_sum_text,
            },
            "competitor_comparisons": competitor_comparisons_list,
            "options_flow": {
                "evaluation": options_eval,
                "put_call_oi_ratio": float(oi_ratio),
                "put_call_volume_ratio": float(vol_ratio),
                "flow_summary": options_sum_text,
            },
            "unusual_options": unusual_opts_list,
            "earnings_intelligence": {
                "evaluation": "Favorable" if rsi > 40 else "Neutral",
                "next_earnings_date": next_date or "2026-07-28",
                "next_eps_estimate": float(next_est) if next_est is not None else (1.45 if rsi > 50 else 0.85),
                "intelligence_summary": "Historical revisions point to consistent execution with positive earning surprises matching core targets.",
            },
            "earnings_history": earnings_history_list_cleaned,
            "early_warning": {
                "evaluation": "Safe" if rsi > 45 else "Warning",
                "deteriorating_signals_count": len(warning_alerts_list) if warning_alerts_list else (0 if rsi > 45 else 2),
                "warning_summary": f"Liquidity metrics show a current ratio of {warning_data.get('current_ratio', 1.5):.1f}. {'No major deteriorating signals flagged.' if rsi > 45 else '2 signals require monitoring.'}",
                "gross_margin": gross_margin,
                "operating_margin": operating_margin,
                "current_ratio": float(warning_data.get("current_ratio", 1.5)),
                "debt_to_equity": float(warning_data.get("debt_to_equity", 0.5)),
            },
            "warning_alerts": [str(a) for a in warning_alerts_list] if warning_alerts_list else [],
            "valuation_opportunity": {
                "evaluation": "Undervalued" if rsi < 50 else "Fairly Valued",
                "intrinsic_value": float(val_opp.get("intrinsic_value", 185.0)) if val_opp else 185.0,
                "analyst_target_median": float(val_opp.get("analyst_target_median", 210.0)) if val_opp else 210.0,
                "implied_upside_pct": float(val_opp.get("implied_upside_pct", 22.4)) if val_opp else 22.4,
                "valuation_summary": f"Target price models return a consensus median of ${val_opp.get('analyst_target_median', 210.0) if val_opp else 210.0:.0f}. DCF models suggest the stock is {'undervalued' if rsi < 50 else 'fairly valued'} relative to intrinsic estimates.",
                "dcf_bear_value": float(dcf_sim.get("bear_case", 150.0)) if isinstance(dcf_sim, dict) else None,
                "dcf_base_value": float(dcf_sim.get("base_case", 185.0)) if isinstance(dcf_sim, dict) else None,
                "dcf_bull_value": float(dcf_sim.get("bull_case", 220.0)) if isinstance(dcf_sim, dict) else None,
                "dcf_upside_probability": float(dcf_sim.get("upside_probability", 0.6)) if isinstance(dcf_sim, dict) else None,
            },
            "capital_allocation": {
                "evaluation": "Efficient" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Balanced",
                "dividend_yield": float(capital_alloc.get("dividend_yield", 0.015)),
                "payout_ratio": float(capital_alloc.get("payout_ratio", 0.28)),
                "return_on_equity": float(capital_alloc.get("return_on_equity", 24.5)),
                "return_on_assets": float(capital_alloc.get("return_on_assets", 11.2)),
                "allocation_summary": f"Management demonstrates capital stewardship with an ROE of {capital_alloc.get('return_on_equity', 24.5):.1f}% and disciplined reinvestment cycles.",
            },
            "corporate_moat": {
                "evaluation": "Wide Moat" if capital_alloc.get("return_on_equity", 0.0) > 20.0 else "Narrow Moat",
                "moat_score": min(100.0, max(0.0, float(capital_alloc.get("return_on_equity", 20.0)) * 3.5)),
                "pricing_power": "Strong" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Moderate",
                "moat_summary": f"Computed competitive analysis shows pricing power driven by returns on equity of {capital_alloc.get('return_on_equity', 24.5):.1f}%.",
            },
            "investment_committee": {
                "consensus_recommendation": dynamic_rating,
                "consensus_confidence": dynamic_confidence,
                "debate_summary": f"The committee reached a {dynamic_rating} consensus with {dynamic_confidence:.0f}% confidence after weighing technical, fundamental, and macro factors.",
                "members": [
                    {"persona": "Technical Analyst", "stance": "Bullish" if rsi > 50 else "Neutral", "confidence_score": 85.0, "argument": f"RSI at {rsi:.1f} with positive momentum trend supports upside continuation."},
                    {"persona": "Fundamental Analyst", "stance": "Bullish" if val_eval != "Premium" else "Neutral", "confidence_score": 90.0, "argument": f"Profit margins at {margin_str} with stable balance sheet metrics."},
                    {"persona": "Sentiment Analyst", "stance": "Bullish" if rsi > 55 else "Neutral", "confidence_score": 75.0, "argument": "Retail and institutional sentiment shows steady accumulation patterns."},
                    {"persona": "Options Strategist", "stance": "Bullish" if oi_ratio < 0.8 else "Neutral", "confidence_score": 80.0, "argument": f"Put/Call ratio of {oi_ratio:.2f} signals {'bullish' if oi_ratio < 0.8 else 'balanced'} options positioning."},
                    {"persona": "Macro Economist", "stance": "Bullish" if macro_eval == "Favorable" else "Neutral", "confidence_score": 82.0, "argument": f"Sector ETF showing {sec_etf.get('one_month_return', 2.5):.1f}% 1-month return supports macro tailwind."},
                ],
            },
            "bull_bear_debate": {
                "participants": [
                    {
                        "role": "Bull",
                        "stance": "Bullish",
                        "arguments": [
                            "Structural dominance within core secular growth sectors.",
                            f"Robust profit margins at {margin_str} provide defensibility against inflation pressures.",
                            "Strong free cash flow allows consistent R&D reinvestment.",
                        ],
                    },
                    {
                        "role": "Bear",
                        "stance": "Bearish",
                        "arguments": [
                            "Premium valuation multiples leave minor margin for operational errors.",
                            "Macro headwinds could constrain enterprise capital expenditures.",
                            "Regulatory antitrust reviews may restrict inorganic expansion plans.",
                        ],
                    },
                ],
                "moderator_summary": {
                    "bull_case": ["Strong cash flows", "Sector leadership", "Margin resilience"],
                    "bear_case": ["High valuation multiples", "Regulatory risk", "Rate sensitivity"],
                    "key_uncertainties": ["Fed rate trajectory", "AI capex cycle duration", "Competitive pricing pressure"],
                    "retail_takeaway": f"The debate reveals that {ticker} has strong core growth support but demands a valuation premium that requires consistent execution.",
                    "actionable_checklist": [
                        "Monitor next earnings EPS vs estimate.",
                        "Watch for insider selling clusters.",
                        "Track sector ETF relative performance weekly.",
                    ],
                },
            },
            "market_psychology": {
                "panic_level": round(max(5.0, min(95.0, ann_vol * 120.0 + (100.0 - rsi) * 0.4)), 2),
                "euphoria_level": round(max(5.0, min(95.0, rsi * 1.05 - ann_vol * 15.0)), 2),
                "contrarian_opportunities": [
                    "High volatility indicates potential capitulation zone for staging buy entries.",
                    "Absence of market FOMO presents contrarian accumulation opportunities.",
                    "Neutral media bias indicates long-term investors are accumulating.",
                ],
                "fear_agent_summary": "Downside pressures are steady. Support holds firm with fear sentiment pricing in conservative trading levels.",
                "greed_agent_summary": "Bullish speculation is moderate. Lack of excessive upward momentum FOMO suggests entry pricing zones are stable.",
                "media_sentiment_summary": "News headlines display a balanced outlook, focusing on core earnings fundamentals over speculative noise.",
                "retail_sentiment_summary": "Social buzz shows stable retail volume patterns, with minor herd-following or panic exits.",
                "institutional_sentiment_summary": "Institutional positioning tracks neutral options open interest configurations and steady hedging trends.",
            },
            "options_analyzer": {
                "recommendation": "Bull Call Spread" if rsi > 55 else "Bear Put Spread" if rsi < 45 else "Iron Condor",
                "confidence_score": 82.0 if rsi > 50 else 72.0,
                "rationale": "High concentration of near-term open interest supports structured range-bound plays to optimize premiums.",
                "agents": [
                    {"persona": "Greeks Agent", "stance": "Bullish" if rsi > 50 else "Neutral", "summary": "Delta exposure matches constructive momentum trends while Theta decay rate remains low."},
                    {"persona": "Volatility Agent", "stance": "Neutral", "summary": "Implied Volatility (IV) percentile ranks at 32%, supporting debit spread configurations."},
                    {"persona": "Earnings Agent", "stance": "Bullish" if rsi > 50 else "Neutral", "summary": "Next catalyst event pricing matches historical standard deviation movement distributions."},
                    {"persona": "Probability Agent", "stance": "Bullish" if rsi > 50 else "Neutral", "summary": "Estimated probability of profit is calculated at 68% based on historical pricing drifts."},
                    {"persona": "Risk Agent", "stance": "Neutral", "summary": "Max downside limit remains capped at total premium debit paid."},
                ],
            },
            "breakout_hunter": {
                "recommendation": "Strong Breakout" if rsi > 60 else "No Breakout",
                "confidence_score": 85.0 if rsi > 60 else 60.0,
                "watchlist": candidates,
                "volume_spike_summary": "RVOL indicator tracks at 2.4x confirming high institutional block accumulation.",
                "price_action_summary": "Resistance Breakthrough verified at key structural consolidation levels.",
                "market_trend_summary": "Broad market index trends support sector strength beta levels.",
                "sector_summary": "Technology sector ETF inflows show positive relative strength metrics.",
                "confirmation_summary": "Short-term momentum oscillators confirm breakout lacks divergence warnings.",
            },
            "alpha_discovery": {
                "recommendation": "Stealth Accumulation" if rsi > 50 else "Neutral",
                "confidence_score": 84.5 if rsi > 50 else 64.0,
                "watchlist": [
                    {"ticker": c["ticker"], "alpha_score": c["score"], "pattern": c["pattern"], "rationale": c["rationale"]}
                    for c in candidates
                ],
                "sec_filing_summary": "Institutional Form 4 purchase filings show positive cluster buy flows.",
                "insider_trading_summary": "Insider transaction activity shows zero executive selling campaigns.",
                "patent_summary": "Recent AI IP and patent filings show continuous technological research growth.",
                "earnings_summary": "Segment margins track positive year-over-year revenue generation.",
                "news_summary": "Media coverage sentiment has returned to stable optimistic bounds.",
                "ranking_summary": "Relative strength calculations place current stock ahead of direct peers.",
            },
            "misinformation": {
                "overall_verdict": "Mixed Signals" if rsi > 40 else "Misinformation Alert",
                "network_confidence": 74.0 if rsi > 50 else 55.0,
                "reports": reports,
                "fact_agent_summary": "Cross-referencing claims against SEC filings reveals 2 of 5 narratives are well-supported by official documentation.",
                "source_agent_summary": "Source credibility audit flags 2 claims originating from single low-authority social media sources with no editorial accountability.",
                "citation_agent_summary": "Citation verification confirms all statistics in verified claims trace back to official regulatory filings or tier-1 financial press.",
                "contradiction_agent_summary": "Contradiction detection identified one case of media amplification overstating exploratory M&A discussions as confirmed transactions.",
                "confidence_agent_summary": "Overall network credibility score is moderate. Investors should treat unverified social media narratives with high skepticism.",
            },
            "backtest": backtest_data,
            "screener": {
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "watchlist": sorted_watchlist,
            },
            "model_name": "Rule-Based Mock Engine",
            "is_mock": True,
            "generated_at": time.time(),
        }

        return mock_data

    def _sync_recommendation(self, result_dict: dict, dynamic_rating: str, dynamic_confidence: float):
        """
        Ensures the overall recommendation rating and the qualitative summary text are in sync.
        If the programmatic override changes the rating (e.g., from Buy to Sell), it appends
        a clarification suffix to the summary text explaining the override.
        """
        if "overall_recommendation" not in result_dict:
            result_dict["overall_recommendation"] = {
                "rating": dynamic_rating,
                "summary": f"Financial engine recommends a {dynamic_rating} position based on composite quantitative indicators.",
                "confidence_score": dynamic_confidence
            }
        else:
            rec = result_dict["overall_recommendation"]
            old_rating = rec.get("rating")
            rec["rating"] = dynamic_rating
            rec["confidence_score"] = dynamic_confidence
            
            # If the ratings differ, append context so they are in sync
            if old_rating and old_rating != dynamic_rating:
                orig_summary = rec.get("summary", "")
                suffix = f" (Adjusted to {dynamic_rating} by the system's quantitative engine due to strict valuation constraints.)"
                if suffix not in orig_summary and f"Adjusted to {dynamic_rating}" not in orig_summary:
                    rec["summary"] = orig_summary.rstrip() + suffix

    def _recalculate_committee_consensus(self, committee: dict):
        """Recalculates the consensus recommendation and confidence based on member stances."""
        if not committee or "members" not in committee or not committee["members"]:
            return
        
        stances = [m.get("stance", "Neutral") for m in committee["members"]]
        bullish = stances.count("Bullish")
        bearish = stances.count("Bearish")
        neutral = stances.count("Neutral")
        
        if bullish > bearish and bullish > neutral:
            rec = "Buy"
        elif bearish > bullish and bearish > neutral:
            rec = "Sell"
        else:
            rec = "Hold"
            
        committee["consensus_recommendation"] = rec
        committee["consensus_stance"] = rec
        
        # Calculate consensus confidence as average of member confidences
        confidences = [m.get("confidence_score", 50.0) for m in committee["members"]]
        if confidences:
            committee["consensus_confidence"] = round(sum(confidences) / len(confidences), 1)

    def _deep_fill_missing(self, target, source):
        """Recursively fills missing keys or list dict attributes in target from source."""
        if isinstance(source, dict):
            for k, v in source.items():
                if k not in target or target[k] is None:
                    target[k] = v
                elif isinstance(v, dict) and isinstance(target[k], dict):
                    self._deep_fill_missing(target[k], v)
                elif isinstance(v, list) and isinstance(target[k], list):
                    for i in range(min(len(target[k]), len(v))):
                        if isinstance(v[i], dict) and isinstance(target[k][i], dict):
                            self._deep_fill_missing(target[k][i], v[i])
                    if len(target[k]) < len(v):
                        target[k].extend(v[len(target[k]):])

    def _ensure_ollama_running(self) -> bool:
        """Checks if Ollama is running, and if not, attempts to start it in the background."""
        import requests
        import subprocess
        import time
        import os

        try:
            res = requests.get("http://localhost:11434", timeout=1.0)
            if res.status_code == 200:
                logger.info("Ollama is already running.")
                return True
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            logger.info("Ollama is not running. Attempting to start Ollama in the background...")

        try:
            user_profile = os.environ.get("USERPROFILE", "")
            possible_paths = [
                "ollama",
                os.path.join(user_profile, "AppData", "Local", "Programs", "Ollama", "ollama.exe"),
            ]

            ollama_bin = "ollama"
            for path in possible_paths:
                if os.path.exists(path) or path == "ollama":
                    ollama_bin = path
                    break

            logger.info(f"Launching Ollama via: {ollama_bin}")
            subprocess.Popen(
                [ollama_bin, "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=0x08000000 if os.name == 'nt' else 0
            )

            # Wait up to 10 seconds for Ollama server to boot
            for _ in range(10):
                time.sleep(1.0)
                try:
                    res = requests.get("http://localhost:11434", timeout=1.0)
                    if res.status_code == 200:
                        logger.info("Ollama server successfully started.")
                        break
                except:
                    pass

            # Pre-load/run the specific model so it is in context
            logger.info(f"Ensuring model '{self.ollama_model}' is running/loaded...")
            subprocess.Popen(
                [ollama_bin, "run", self.ollama_model],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=0x08000000 if os.name == 'nt' else 0
            )
            time.sleep(2.0)
            return True
        except Exception as e:
            logger.error(f"Failed to start Ollama: {e}")
            return False

    def _generate_insight_local_llm(self, stock_data: StockDataResponse) -> StockInsightResponse:
        """
        Runs analytical tools locally and compiles overall analysis by sending a prompt
        to the local Ollama service.
        """
        ticker_symbol = stock_data.ticker.upper()
        prices_list = [p.model_dump() for p in stock_data.prices]
        indicators = self.calculate_indicators(prices_list)
        data_dict = stock_data.model_dump()
        
        # 1. Gather all analytical tools data
        from app.tools import (
            get_technical_metrics,
            get_fundamental_metrics,
            get_risk_metrics,
            get_news_sentiment,
            get_insider_transactions,
            get_institutional_holdings,
            get_macro_indicators,
            get_competitor_comparison,
            get_options_chain_data,
            get_earnings_intelligence,
            get_early_warning_signals,
            get_valuation_opportunities,
            get_capital_allocation_data
        )
        
        technical_metrics = get_technical_metrics(ticker_symbol)
        fundamental_metrics = get_fundamental_metrics(ticker_symbol)
        risk_data = get_risk_metrics(ticker_symbol)
        sentiment_data = get_news_sentiment(ticker_symbol)
        insider_data = get_insider_transactions(ticker_symbol)
        inst_data = get_institutional_holdings(ticker_symbol)
        competitor_comparison = get_competitor_comparison(ticker_symbol)
        options_chain = get_options_chain_data(ticker_symbol)
        earnings_intel = get_earnings_intelligence(ticker_symbol)
        warning_data = get_early_warning_signals(ticker_symbol)
        val_opp = get_valuation_opportunities(ticker_symbol)
        capital_alloc = get_capital_allocation_data(ticker_symbol)
        
        # Resolve sector name and fetch macro details
        import yfinance as yf
        try:
            ticker_obj = yf.Ticker(ticker_symbol)
            sector_name = ticker_obj.info.get("sector", "Technology")
        except:
            sector_name = "Technology"
        macro_data = get_macro_indicators(sector_name)
        
        # Compute numeric scales for response matching (needed to populate the fields fully)
        risk_metrics = self._compute_risk_metrics(prices_list)
        technical_scales = self._compute_technical_scales(prices_list, indicators)
        fundamental_comparisons = self._compute_fundamental_comparisons(data_dict.get('metrics', {}))
        
        # Build prompt for local Ollama
        prompt = f"""
        You are a highly analytical Chief Investment Officer.
        Your task is to compile a structured Stock Research Report for {ticker_symbol} using the following raw inputs from our analytical specialists:

        - Technical Momentum indicators: {technical_metrics}
        - Fundamental multiples & earnings efficiency: {fundamental_metrics}
        - News Sentiment: {sentiment_data}
        - Risk Metrics: {risk_data}
        - Insider trades & Form 13F holders: {insider_data} and {inst_data}
        - Macro conditions & sector momentum: {macro_data}
        - Competitor peer side-by-side benchmarking: {competitor_comparison}
        - Options flow and derivatives volume: {options_chain}
        - Earnings surprises and forward EPS forecasts: {earnings_intel}
        - Early warning deterioration indicators: {warning_data}
        - Valuation opportunities & expected returns: {val_opp}
        - Capital allocation & efficiency: {capital_alloc}
        
        Compile a final investment recommendation report. Return all textual values, summaries, rationales, and analyses EXCLUSIVELY in English. Do not use any foreign languages, translations, or non-English characters. You MUST output your response strictly as a JSON object matching the schema below.
        DO NOT wrap the output in markdown block tick marks like ```json or add any explanations outside the JSON. Return only the raw JSON.
        
        Required JSON structure:
        {{
            "ticker": "{ticker_symbol}",
            "technical_momentum": {{
                "evaluation": "Bullish, Bearish, or Neutral",
                "rsi_analysis": "RSI analysis summary...",
                "trend_analysis": "Trend relative to moving averages..."
            }},
            "fundamental_health": {{
                "evaluation": "Strong, Stable, Weak, or Distressed",
                "valuation_analysis": "PE/Valuation multiples summary...",
                "profitability_analysis": "Margins and profitability analysis..."
            }},
            "sentiment": {{
                "evaluation": "Bullish, Neutral, or Bearish",
                "news_summary": "Summary of news coverage and market sentiment..."
            }},
            "key_risks": [
                "Specific risk point 1...",
                "Specific risk point 2...",
                "Specific risk point 3..."
            ],
            "overall_recommendation": {{
                "rating": "Buy, Hold, or Sell",
                "summary": "Full executive thesis justifying your rating...",
                "confidence_score": 85.0
            }},
            "insider_flow": {{
                "evaluation": "Bullish, Bearish, or Neutral",
                "insider_summary": "Analysis of corporate insider buying/selling trends...",
                "institutional_summary": "Analysis of top institutional holdings..."
            }},
            "macro_flow": {{
                "evaluation": "Favorable, Neutral, or Challenging",
                "macro_summary": "Analysis of interest rates, VIX index levels, and macro conditions...",
                "sector_summary": "Sector momentum and sector ETF price/performance trend..."
            }},
            "competitor_analysis": {{
                "evaluation": "Outperforming, In-Line, or Underperforming",
                "competitor_summary": "Analysis comparing the stock to MSFT, GOOGL, AMD, etc. side-by-side..."
            }},
            "options_flow": {{
                "evaluation": "Bullish, Bearish, or Neutral",
                "put_call_oi_ratio": 0.85,
                "put_call_volume_ratio": 1.15,
                "flow_summary": "Analysis of Put/Call ratios, open interest, and hedging bets..."
            }},
            "earnings_intelligence": {{
                "evaluation": "Favorable, Neutral, or Unfavorable",
                "next_earnings_date": "2026-07-15",
                "next_eps_estimate": 1.45,
                "intelligence_summary": "Analysis of earnings trends, historical surprises, and guidance updates..."
            }},
            "early_warning": {{
                "evaluation": "Safe, Warning, or High Risk",
                "deteriorating_signals_count": 0,
                "warning_summary": "Analysis of operating margin trends, leverage ratios, and liquidity cushions...",
                "gross_margin": 45.2,
                "operating_margin": 15.6,
                "current_ratio": 1.45,
                "debt_to_equity": 85.0
            }},
            "valuation_opportunity": {{
                "evaluation": "Undervalued, Fairly Valued, or Overvalued",
                "intrinsic_value": 150.25,
                "analyst_target_median": 180.00,
                "implied_upside_pct": 12.50,
                "valuation_summary": "Analysis of valuation pricing gaps, regime shifts, and expected returns..."
            }},
            "capital_allocation": {{
                "evaluation": "Efficient, Balanced, or Inefficient",
                "dividend_yield": 2.50,
                "payout_ratio": 35.00,
                "return_on_equity": 18.50,
                "return_on_assets": 12.00,
                "allocation_summary": "Analysis of capital efficiency rates, returns, buybacks vs dividends, and management allocations..."
            }},
            "investment_committee": {{
                "consensus_recommendation": "Buy, Hold, or Sell",
                "consensus_confidence": 75.0,
                "debate_summary": "Synthesize the debate between the personas...",
                "members": [
                    {{
                        "persona": "Value Investor Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "confidence_score": 75.0,
                        "argument": "Focus on valuation gap and margins..."
                    }},
                    {{
                        "persona": "Growth Investor Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "confidence_score": 80.0,
                        "argument": "Focus on sales growth vectors..."
                    }},
                    {{
                        "persona": "Quant Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "confidence_score": 65.0,
                        "argument": "Focus on momentum signals..."
                    }},
                    {{
                        "persona": "Macro Strategist Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "confidence_score": 70.0,
                        "argument": "Focus on ETF performance and yield frameworks..."
                    }},
                    {{
                        "persona": "Risk Officer Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "confidence_score": 85.0,
                        "argument": "Focus on leverage and cash flows..."
                    }},
                    {{
                        "persona": "Warren Buffett Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "confidence_score": 80.0,
                        "argument": "Focus on compounding moats, returns on equity, and asset management efficiency..."
                    }},
                    {{
                        "persona": "Peter Lynch Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "confidence_score": 75.0,
                        "argument": "Focus on revenue growth bounds relative to trailing PE multiples..."
                    }},
                    {{
                        "persona": "Momentum Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "confidence_score": 85.0,
                        "argument": "Focus on technical breakout volumes and moving average crossover trends..."
                    }}
                ]
            }},
            "options_analyzer": {{
                "recommendation": "Buy Calls, Buy Puts, or Spread Calls",
                "confidence_score": 75.0,
                "rationale": "Overall coordinator rationale synthesizing options strategy factors...",
                "agents": [
                    {{
                        "persona": "Greeks Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "summary": "Delta/Gamma profiles and Theta decay considerations..."
                    }},
                    {{
                        "persona": "Volatility Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "summary": "IV percentile rankings and volatility smile analysis..."
                    }},
                    {{
                        "persona": "Earnings Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "summary": "Earnings expected pricing move impact evaluation..."
                    }},
                    {{
                        "persona": "Probability Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "summary": "Calculated strike boundary probabilities..."
                    }},
                    {{
                        "persona": "Risk Agent",
                        "stance": "Bullish, Bearish, or Neutral",
                        "summary": "Capital limits, maximum losses, and margin requirements..."
                    }}
                ]
            }},
            "breakout_hunter": {{
                "recommendation": "High Conviction Breakout, Accumulation Zone, or Avoid Bull Trap",
                "confidence_score": 80.0,
                "watchlist": [
                    {{
                        "ticker": "AAPL",
                        "score": 92.5,
                        "pattern": "Bull Flag Breakout",
                        "rationale": "Resistance breach verified with significant volume spike..."
                    }}
                ],
                "volume_spike_summary": "Volume Spike Agent analysis of relative volume shifts...",
                "price_action_summary": "Price Action Agent analysis of support/resistance bounds...",
                "market_trend_summary": "Market Trend Agent analysis of overall breadth indicators...",
                "sector_summary": "Sector Agent analysis of ETF relative flow strength...",
                "confirmation_summary": "Confirmation Agent analysis of indicators to verify breakouts..."
            }},
            "alpha_discovery": {{
                "recommendation": "High Conviction Alpha, Growth Catalyst, or Wait for Confirmation",
                "confidence_score": 85.0,
                "watchlist": [
                    {{
                        "ticker": "CLBT",
                        "alpha_score": 91.0,
                        "pattern": "Stealth Accumulation",
                        "rationale": "Hidden institutional block purchases verified..."
                    }}
                ],
                "sec_filing_summary": "SEC Filing Agent analysis of regulatory patterns...",
                "insider_trading_summary": "Insider Trading Agent analysis of cluster buys...",
                "patent_summary": "Patent Agent analysis of IP holdings...",
                "earnings_summary": "Earnings Agent analysis of catalyst segments...",
                "news_summary": "News Agent analysis of chatter volumes...",
                "ranking_summary": "Ranking Agent synthesis of Alpha Scores..."
            }},
            "misinformation": {{
                "overall_verdict": "High Credibility, Mixed Signals, or Misinformation Alert",
                "network_confidence": 74.0,
                "reports": [
                    {{
                        "claim": "Specific claim or narrative being investigated...",
                        "verdict": "Verified, Misleading, False, or Unverified",
                        "credibility_score": 85.0,
                        "source_count": 7,
                        "evidence": "Brief evidence summary supporting the verdict..."
                    }}
                ],
                "fact_agent_summary": "Fact Agent cross-reference analysis...",
                "source_agent_summary": "Source Agent credibility audit findings...",
                "citation_agent_summary": "Citation Agent verification outcomes...",
                "contradiction_agent_summary": "Contradiction Agent detection findings...",
                "confidence_agent_summary": "Confidence Agent network-wide credibility synthesis..."
            }}
        }}
        """
        
        # Call local Ollama HTTP endpoint
        self._ensure_ollama_running()
        import requests
        logger.info(f"Invoking Local Ollama ({self.ollama_model}) at http://localhost:11434...")
        
        url = "http://localhost:11434/api/generate"
        payload = {
            "model": self.ollama_model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            # "keep_alive": -1
        }
        
        try:
            response = requests.post(url, json=payload, timeout=None)
            response.raise_for_status()
            res_json = response.json()
            # Clean up response text in case local model wraps it in markdown blocks or has formatting anomalies
            clean_text = res_json.get("response", "").strip()
            if clean_text.startswith("```"):
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                else:
                    clean_text = clean_text[3:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                clean_text = clean_text.strip()

            try:
                result_dict = json.loads(clean_text)
            except json.JSONDecodeError as jde:
                logger.warning(f"Ollama raw output failed normal JSON loads: {jde}. Attempting trailing comma cleanup.")
                import re
                # Strip trailing commas inside arrays and objects
                clean_text = re.sub(r',\s*([\]}])', r'\1', clean_text)
                result_dict = json.loads(clean_text)
            if "misinformation_analysis" in result_dict:
                result_dict["misinformation"] = result_dict.pop("misinformation_analysis")
            
            # Inject required computed numeric lists/classes from python side
            result_dict["risk_metrics"] = risk_metrics.dict() if hasattr(risk_metrics, "dict") else risk_metrics
            result_dict["technical_scales"] = technical_scales.dict() if hasattr(technical_scales, "dict") else technical_scales
            result_dict["fundamental_comparisons"] = [item.dict() if hasattr(item, "dict") else item for item in fundamental_comparisons]
            result_dict["insider_transactions"] = insider_data.get("transactions", [])
            result_dict["institutional_holders"] = inst_data.get("holders", [])
            result_dict["macro_indicators"] = macro_data.get("macro_indicators", [])
            result_dict["sector_etf"] = macro_data.get("sector_etf", {
                "ticker": "SPY",
                "name": "SPDR S&P 500 ETF Trust",
                "current_price": 0.0,
                "one_month_return": 0.0,
                "six_month_return": 0.0
            })
            result_dict["competitor_comparisons"] = competitor_comparison.get("comparisons", [])
            
            # Recommendation confidence score fallback
            if "overall_recommendation" not in result_dict:
                result_dict["overall_recommendation"] = {
                    "rating": "Hold",
                    "summary": "Analyses show conflicting signals across indicators.",
                    "confidence_score": 70.0
                }
            else:
                rec_obj = result_dict["overall_recommendation"]
                if "confidence_score" not in rec_obj or rec_obj["confidence_score"] is None:
                    rec_obj["confidence_score"] = 75.0

            # Options data injection (Force override)
            oi_ratio = options_chain.get("put_call_oi_ratio", 1.0)
            vol_ratio = options_chain.get("put_call_volume_ratio", 1.0)
            if "options_flow" not in result_dict:
                result_dict["options_flow"] = {
                    "evaluation": "Bullish" if oi_ratio < 0.8 else "Bearish" if oi_ratio > 1.2 else "Neutral",
                    "put_call_oi_ratio": oi_ratio,
                    "put_call_volume_ratio": vol_ratio,
                    "flow_summary": "Derivative hedging signals remain balanced under current contract volume trends."
                }
            else:
                result_dict["options_flow"]["put_call_oi_ratio"] = oi_ratio
                result_dict["options_flow"]["put_call_volume_ratio"] = vol_ratio
            result_dict["unusual_options"] = options_chain.get("unusual_options", [])
            
            # Earnings data injection (Force override)
            history_list = earnings_intel.get("history", [])
            next_date = earnings_intel.get("next_earnings_date")
            next_est = earnings_intel.get("next_eps_estimate")
            if "earnings_intelligence" not in result_dict:
                result_dict["earnings_intelligence"] = {
                    "evaluation": "Favorable" if len(history_list) > 0 and (history_list[0].get("surprise_pct") or 0.0) >= 0.0 else "Neutral",
                    "next_earnings_date": next_date,
                    "next_eps_estimate": next_est,
                    "intelligence_summary": "Guidance projections indicate stable outlook expectations aligned with recent EPS reports."
                }
            else:
                result_dict["earnings_intelligence"]["next_earnings_date"] = next_date
                result_dict["earnings_intelligence"]["next_eps_estimate"] = next_est
            result_dict["earnings_history"] = history_list
            
            # Early Warning data injection (Force override)
            alerts_list = warning_data.get("alerts", [])
            if "early_warning" not in result_dict:
                result_dict["early_warning"] = {
                    "evaluation": "High Risk" if len(alerts_list) >= 3 else "Warning" if len(alerts_list) >= 1 else "Safe",
                    "deteriorating_signals_count": len(alerts_list),
                    "warning_summary": f"Liquidity cushions show a current ratio of {warning_data.get('current_ratio', 1.0)}, while operating gross margin tracks at {warning_data.get('gross_margin', 0.0)}%.",
                    "gross_margin": warning_data.get("gross_margin", 0.0),
                    "operating_margin": warning_data.get("operating_margin", 0.0),
                    "current_ratio": warning_data.get("current_ratio", 1.0),
                    "debt_to_equity": warning_data.get("debt_to_equity", 0.0)
                }
            else:
                result_dict["early_warning"]["gross_margin"] = warning_data.get("gross_margin", 0.0)
                result_dict["early_warning"]["operating_margin"] = warning_data.get("operating_margin", 0.0)
                result_dict["early_warning"]["current_ratio"] = warning_data.get("current_ratio", 1.0)
                result_dict["early_warning"]["debt_to_equity"] = warning_data.get("debt_to_equity", 0.0)
            result_dict["warning_alerts"] = alerts_list
            
            # Valuation Opportunities (Force override)
            if "valuation_opportunity" not in result_dict:
                result_dict["valuation_opportunity"] = {
                    "evaluation": "Undervalued" if val_opp.get("implied_upside_pct", 0.0) > 15.0 else "Overvalued" if val_opp.get("implied_upside_pct", 0.0) < -5.0 else "Fairly Valued",
                    "intrinsic_value": val_opp.get("intrinsic_value"),
                    "analyst_target_median": val_opp.get("analyst_target_median"),
                    "implied_upside_pct": val_opp.get("implied_upside_pct", 0.0),
                    "valuation_summary": f"Historical multiple analyses indicate a current price offset. Analyst median stands at ${val_opp.get('analyst_target_median')} with expected return levels near {val_opp.get('implied_upside_pct')}%."
                }
            else:
                result_dict["valuation_opportunity"]["intrinsic_value"] = val_opp.get("intrinsic_value")
                result_dict["valuation_opportunity"]["analyst_target_median"] = val_opp.get("analyst_target_median")
                result_dict["valuation_opportunity"]["implied_upside_pct"] = val_opp.get("implied_upside_pct", 0.0)
            # Capital Allocation (Force override)
            if "capital_allocation" not in result_dict:
                result_dict["capital_allocation"] = {
                    "evaluation": "Efficient" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Balanced" if capital_alloc.get("return_on_equity", 0.0) > 5.0 else "Inefficient",
                    "dividend_yield": capital_alloc.get("dividend_yield", 0.0),
                    "payout_ratio": capital_alloc.get("payout_ratio", 0.0),
                    "return_on_equity": capital_alloc.get("return_on_equity", 0.0),
                    "return_on_assets": capital_alloc.get("return_on_assets", 0.0),
                    "allocation_summary": f"Capital allocation metrics show ROE of {capital_alloc.get('return_on_equity')}% and ROA of {capital_alloc.get('return_on_assets')}%."
                }
            else:
                ca = result_dict["capital_allocation"]
                ca["dividend_yield"] = capital_alloc.get("dividend_yield", 0.0)
                ca["payout_ratio"] = capital_alloc.get("payout_ratio", 0.0)
                ca["return_on_equity"] = capital_alloc.get("return_on_equity", 0.0)
                ca["return_on_assets"] = capital_alloc.get("return_on_assets", 0.0)

            # Corporate Moat (Force override)
            if "corporate_moat" not in result_dict:
                result_dict["corporate_moat"] = {
                    "evaluation": "Wide Moat" if capital_alloc.get("return_on_equity", 0.0) > 20.0 else "Narrow Moat" if capital_alloc.get("return_on_equity", 0.0) > 10.0 else "No Moat",
                    "moat_score": min(100.0, max(0.0, float(capital_alloc.get("return_on_equity", 0.0) * 3.5))),
                    "pricing_power": "Strong" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Moderate" if capital_alloc.get("return_on_equity", 0.0) > 7.0 else "Weak",
                    "moat_summary": f"Pricing power analysis shows ROE tracks at {capital_alloc.get('return_on_equity')}% indicating structural moat efficiency relative to direct peers."
                }
            else:
                cm = result_dict["corporate_moat"]
                if "evaluation" not in cm or not cm["evaluation"]:
                    cm["evaluation"] = "Wide Moat" if capital_alloc.get("return_on_equity", 0.0) > 20.0 else "Narrow Moat" if capital_alloc.get("return_on_equity", 0.0) > 10.0 else "No Moat"
                if "moat_score" not in cm or not cm["moat_score"]:
                    cm["moat_score"] = min(100.0, max(0.0, float(capital_alloc.get("return_on_equity", 0.0) * 3.5)))
                if "pricing_power" not in cm or not cm["pricing_power"]:
                    cm["pricing_power"] = "Strong" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Moderate" if capital_alloc.get("return_on_equity", 0.0) > 7.0 else "Weak"
                if "moat_summary" not in cm or not cm["moat_summary"]:
                    cm["moat_summary"] = f"Pricing power analysis shows ROE tracks at {capital_alloc.get('return_on_equity')}% indicating structural moat efficiency relative to direct peers."
                
            # Calculate dynamic recommendation rating and confidence score from real yfinance data
            ins_txs = insider_data.get("transactions", [])
            sec_etf_info = macro_data.get("sector_etf", {})
            _, dynamic_rating, dynamic_confidence = self._calculate_score_rating_confidence(
                indicators, data_dict.get("metrics", {}), ins_txs, sec_etf_info, capital_alloc
            )
            self._sync_recommendation(result_dict, dynamic_rating, dynamic_confidence)
                
            # Fall back to dynamic mock values for any missing schema fields
            mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)

            # Ensure Investment Committee consensus matches member votes
            if "investment_committee" not in result_dict:
                result_dict["investment_committee"] = mock_data["investment_committee"]
            self._recalculate_committee_consensus(result_dict["investment_committee"])
            required_keys = [
            "technical_momentum",
            "fundamental_health",
            "sentiment",
            "key_risks",
            "overall_recommendation",
            "insider_flow",
            "macro_flow",
            "competitor_analysis",
            "options_flow",
            "earnings_intelligence",
            "early_warning",
            "valuation_opportunity",
            "capital_allocation",
            "corporate_moat",
            "investment_committee",
            "bull_bear_debate",
            "market_psychology",
            "options_analyzer",
            "breakout_hunter",
            "alpha_discovery",
            "backtest",
            "screener",
            "misinformation"
        ]
            for key in required_keys:
                if key not in result_dict or not result_dict[key]:
                    result_dict[key] = mock_data[key]
                else:
                    self._deep_fill_missing(result_dict[key], mock_data[key])

            result_dict["ticker"] = ticker_symbol
            result_dict["model_name"] = f"Local Ollama ({self.ollama_model})"
            result_dict["is_mock"] = False
            result_dict["generated_at"] = time.time()
            
            return StockInsightResponse(**result_dict)
        except Exception as e:
            logger.error(f"Error calling local Ollama service: {e}", exc_info=True)
            logger.info("Falling back to composite rule-based mock analysis...")
            mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)
            return StockInsightResponse(**mock_data)

    def _generate_insight_huggingface_hub(self, stock_data: StockDataResponse) -> StockInsightResponse:
        """
        Invokes the Hugging Face Hosted Inference API to compile the research report.
        """
        ticker_symbol = stock_data.ticker.upper()
        prices_list = [p.model_dump() for p in stock_data.prices]
        indicators = self.calculate_indicators(prices_list)
        data_dict = stock_data.model_dump()

        # Compute numeric scales and dependencies
        risk_metrics = self._compute_risk_metrics(prices_list)
        technical_scales = self._compute_technical_scales(prices_list, indicators)
        fundamental_comparisons = self._compute_fundamental_comparisons(data_dict.get('metrics', {}))

        from app.tools import get_insider_transactions, get_institutional_holdings, get_macro_indicators, get_competitor_comparison, get_options_chain_data, get_earnings_intelligence, get_early_warning_signals, get_valuation_opportunities, get_capital_allocation_data
        insider_data = get_insider_transactions(ticker_symbol)
        inst_data = get_institutional_holdings(ticker_symbol)
        insider_txs = insider_data.get("transactions", [])
        inst_holders = inst_data.get("holders", [])
        comp_data = get_competitor_comparison(ticker_symbol)
        comp_list = comp_data.get("comparisons", [])
        opt_data = get_options_chain_data(ticker_symbol)
        earnings_intel = get_earnings_intelligence(ticker_symbol)
        warning_data = get_early_warning_signals(ticker_symbol)
        val_opp = get_valuation_opportunities(ticker_symbol)
        capital_alloc = get_capital_allocation_data(ticker_symbol)

        import yfinance as yf
        try:
            ticker_obj = yf.Ticker(ticker_symbol)
            sector_name = ticker_obj.info.get("sector", "Technology")
        except:
            sector_name = "Technology"
        macro_data = get_macro_indicators(sector_name)
        macro_list = macro_data.get("macro_indicators", [])
        sec_etf = macro_data.get("sector_etf", {
            "ticker": "XLK",
            "name": "Technology Select Sector SPDR Fund",
            "current_price": 210.50,
            "one_month_return": 3.45,
            "six_month_return": 12.80
        })

        prompt = self._build_analysis_prompt(data_dict, indicators)
        headers = {}
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"
            headers["Content-Type"] = "application/json"

        url = f"https://router.huggingface.co/hf-inference/models/{self.hf_model}"
        logger.info(f"Invoking Hugging Face Hosted Inference API ({self.hf_model}) at {url}...")

        # # Call Hugging Face Hosted Inference API
        import os
        from openai import OpenAI

        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=self.hf_token,
        )

        logger.info(f"Invoking Hugging Face Hosted Inference API ({self.hf_model}) via InferenceClient...")

        result_dict = {}
        try:
            response = client.chat.completions.create(
                model=self.hf_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a financial analyst. Return only JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0,
                response_format={"type": "json_object"}
            )
            logger.info("RESPONSE FROM HF API: ", response.choices[0].message.content)
            
            generated_text = response.choices[0].message.content.strip()
            if generated_text:
                clean_text = generated_text
                if clean_text.startswith("```"):
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    else:
                        clean_text = clean_text[3:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    clean_text = clean_text.strip()

                try:
                    result_dict = json.loads(clean_text)
                except Exception as je:
                    logger.warning(f"Failed to parse JSON from Hugging Face output: {je}. Extracting raw text.")
                    import re
                    match = re.search(r"\{.*\}", clean_text, re.DOTALL)
                    if match:
                        result_dict = json.loads(match.group(0))
                    else:
                        raise je
            if "misinformation_analysis" in result_dict:
                result_dict["misinformation"] = result_dict.pop("misinformation_analysis")


        except Exception as e:
            logger.error(f"Error calling Hugging Face Hub: {e}", exc_info=True)
            logger.info("Falling back to rule-based mock analysis...")
            mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)
            return StockInsightResponse(**mock_data)

        # Fallback to mock values for any missing schema fields
        mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)
        required_keys = [
            "technical_momentum",
            "fundamental_health",
            "sentiment",
            "key_risks",
            "overall_recommendation",
            "insider_flow",
            "macro_flow",
            "competitor_analysis",
            "options_flow",
            "earnings_intelligence",
            "early_warning",
            "valuation_opportunity",
            "capital_allocation",
            "corporate_moat",
            "investment_committee",
            "bull_bear_debate",
            "market_psychology",
            "options_analyzer",
            "breakout_hunter",
            "alpha_discovery",
            "backtest",
            "screener",
            "misinformation"
        ]
        for key in required_keys:
            if key not in result_dict or not result_dict[key]:
                result_dict[key] = mock_data[key]
            else:
                self._deep_fill_missing(result_dict[key], mock_data[key])

        # Inject computed numeric fields
        result_dict["risk_metrics"] = risk_metrics.dict() if hasattr(risk_metrics, "dict") else risk_metrics
        result_dict["technical_scales"] = technical_scales.dict() if hasattr(technical_scales, "dict") else technical_scales
        result_dict["fundamental_comparisons"] = [item.dict() if hasattr(item, "dict") else item for item in fundamental_comparisons]
        result_dict["insider_transactions"] = insider_txs
        result_dict["institutional_holders"] = inst_holders
        result_dict["macro_indicators"] = macro_list
        result_dict["sector_etf"] = sec_etf
        result_dict["competitor_comparisons"] = comp_list

        oi_ratio = opt_data.get("put_call_oi_ratio", 1.0)
        vol_ratio = opt_data.get("put_call_volume_ratio", 1.0)
        if "options_flow" not in result_dict:
            result_dict["options_flow"] = {
                "evaluation": "Bullish" if oi_ratio < 0.8 else "Bearish" if oi_ratio > 1.2 else "Neutral",
                "put_call_oi_ratio": oi_ratio,
                "put_call_volume_ratio": vol_ratio,
                "flow_summary": "Derivative hedging signals remain balanced under current contract volume trends."
            }
        else:
            result_dict["options_flow"]["put_call_oi_ratio"] = oi_ratio
            result_dict["options_flow"]["put_call_volume_ratio"] = vol_ratio
        result_dict["unusual_options"] = opt_data.get("unusual_options", [])

        # Earnings
        history_list = earnings_intel.get("history", [])
        next_date = earnings_intel.get("next_earnings_date")
        next_est = earnings_intel.get("next_eps_estimate")
        if "earnings_intelligence" not in result_dict:
            result_dict["earnings_intelligence"] = {
                "evaluation": "Favorable" if len(history_list) > 0 and (history_list[0].get("surprise_pct") or 0.0) >= 0.0 else "Neutral",
                "next_earnings_date": next_date,
                "next_eps_estimate": next_est,
                "intelligence_summary": "Guidance projections indicate stable outlook expectations aligned with recent EPS reports."
            }
        else:
            result_dict["earnings_intelligence"]["next_earnings_date"] = next_date
            result_dict["earnings_intelligence"]["next_eps_estimate"] = next_est
        result_dict["earnings_history"] = history_list

        # Early Warning
        alerts_list = warning_data.get("alerts", [])
        if "early_warning" not in result_dict:
            result_dict["early_warning"] = {
                "evaluation": "High Risk" if len(alerts_list) >= 3 else "Warning" if len(alerts_list) >= 1 else "Safe",
                "deteriorating_signals_count": len(alerts_list),
                "warning_summary": f"Liquidity cushions show a current ratio of {warning_data.get('current_ratio', 1.0)}, while operating gross margin tracks at {warning_data.get('gross_margin', 0.0)}%.",
                "gross_margin": warning_data.get("gross_margin", 0.0),
                "operating_margin": warning_data.get("operating_margin", 0.0),
                "current_ratio": warning_data.get("current_ratio", 1.0),
                "debt_to_equity": warning_data.get("debt_to_equity", 0.0)
            }
        else:
            result_dict["early_warning"]["gross_margin"] = warning_data.get("gross_margin", 0.0)
            result_dict["early_warning"]["operating_margin"] = warning_data.get("operating_margin", 0.0)
            result_dict["early_warning"]["current_ratio"] = warning_data.get("current_ratio", 1.0)
            result_dict["early_warning"]["debt_to_equity"] = warning_data.get("debt_to_equity", 0.0)
        result_dict["warning_alerts"] = alerts_list

        # Valuation Opportunities
        if "valuation_opportunity" not in result_dict:
            result_dict["valuation_opportunity"] = {
                "evaluation": "Undervalued" if val_opp.get("implied_upside_pct", 0.0) > 15.0 else "Overvalued" if val_opp.get("implied_upside_pct", 0.0) < -5.0 else "Fairly Valued",
                "intrinsic_value": val_opp.get("intrinsic_value"),
                "analyst_target_median": val_opp.get("analyst_target_median"),
                "implied_upside_pct": val_opp.get("implied_upside_pct", 0.0),
                "valuation_summary": f"Historical multiple analyses indicate a current price offset. Analyst median stands at ${val_opp.get('analyst_target_median')} with expected return levels near {val_opp.get('implied_upside_pct')}%."
            }
        else:
            result_dict["valuation_opportunity"]["intrinsic_value"] = val_opp.get("intrinsic_value")
            result_dict["valuation_opportunity"]["analyst_target_median"] = val_opp.get("analyst_target_median")
            result_dict["valuation_opportunity"]["implied_upside_pct"] = val_opp.get("implied_upside_pct", 0.0)

        # Capital Allocation
        if "capital_allocation" not in result_dict:
            result_dict["capital_allocation"] = {
                "evaluation": "Efficient" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Balanced" if capital_alloc.get("return_on_equity", 0.0) > 5.0 else "Inefficient",
                "dividend_yield": capital_alloc.get("dividend_yield", 0.0),
                "payout_ratio": capital_alloc.get("payout_ratio", 0.0),
                "return_on_equity": capital_alloc.get("return_on_equity", 0.0),
                "return_on_assets": capital_alloc.get("return_on_assets", 0.0),
                "allocation_summary": f"Capital allocation metrics show ROE of {capital_alloc.get('return_on_equity')}% and ROA of {capital_alloc.get('return_on_assets')}%."
            }
        else:
            ca = result_dict["capital_allocation"]
            ca["dividend_yield"] = capital_alloc.get("dividend_yield", 0.0)
            ca["payout_ratio"] = capital_alloc.get("payout_ratio", 0.0)
            ca["return_on_equity"] = capital_alloc.get("return_on_equity", 0.0)
            ca["return_on_assets"] = capital_alloc.get("return_on_assets", 0.0)

        # Corporate Moat
        if "corporate_moat" not in result_dict:
            result_dict["corporate_moat"] = {
                "evaluation": "Wide Moat" if capital_alloc.get("return_on_equity", 0.0) > 20.0 else "Narrow Moat" if capital_alloc.get("return_on_equity", 0.0) > 10.0 else "No Moat",
                "moat_score": min(100.0, max(0.0, float(capital_alloc.get("return_on_equity", 0.0) * 3.5))),
                "pricing_power": "Strong" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Moderate" if capital_alloc.get("return_on_equity", 0.0) > 7.0 else "Weak",
                "moat_summary": f"Pricing power analysis shows ROE tracks at {capital_alloc.get('return_on_equity')}% indicating structural moat efficiency relative to direct peers."
            }
        else:
            cm = result_dict["corporate_moat"]
            if "evaluation" not in cm:
                cm["evaluation"] = "Wide Moat" if capital_alloc.get("return_on_equity", 0.0) > 20.0 else "Narrow Moat" if capital_alloc.get("return_on_equity", 0.0) > 10.0 else "No Moat"
            if "moat_score" not in cm:
                cm["moat_score"] = min(100.0, max(0.0, float(capital_alloc.get("return_on_equity", 0.0) * 3.5)))
            if "pricing_power" not in cm:
                cm["pricing_power"] = "Strong" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Moderate" if capital_alloc.get("return_on_equity", 0.0) > 7.0 else "Weak"
            if "moat_summary" not in cm:
                cm["moat_summary"] = f"Pricing power analysis shows ROE tracks at {capital_alloc.get('return_on_equity')}% indicating structural moat efficiency relative to direct peers."

        # Fall back to dynamic mock values for any missing schema fields (must be before first mock_data usage)
        mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)

        # Dynamic recommendation override
        _, dynamic_rating, dynamic_confidence = self._calculate_score_rating_confidence(
            indicators, data_dict.get("metrics", {}), insider_txs, sec_etf, capital_alloc
        )
        self._sync_recommendation(result_dict, dynamic_rating, dynamic_confidence)

        if "investment_committee" not in result_dict:
            result_dict["investment_committee"] = mock_data["investment_committee"]
        self._recalculate_committee_consensus(result_dict["investment_committee"])

        result_dict["ticker"] = ticker_symbol
        result_dict["model_name"] = f"Hugging Face ({self.hf_model})"
        result_dict["is_mock"] = False
        result_dict["generated_at"] = time.time()

        return StockInsightResponse(**result_dict)

    def _generate_insight_gemini_batch(self, stock_data: StockDataResponse) -> StockInsightResponse:
        """
        Gathers all metrics and calls the Google Gemini API directly in a single request (batch mode).
        """
        ticker_symbol = stock_data.ticker.upper()
        prices_list = [p.model_dump() for p in stock_data.prices]
        indicators = self.calculate_indicators(prices_list)
        data_dict = stock_data.model_dump()

        # Compute numeric scales and dependencies
        risk_metrics = self._compute_risk_metrics(prices_list)
        technical_scales = self._compute_technical_scales(prices_list, indicators)
        fundamental_comparisons = self._compute_fundamental_comparisons(data_dict.get('metrics', {}))

        from app.tools import get_insider_transactions, get_institutional_holdings, get_macro_indicators, get_competitor_comparison, get_options_chain_data, get_earnings_intelligence, get_early_warning_signals, get_valuation_opportunities, get_capital_allocation_data, run_monte_carlo_dcf
        insider_data = get_insider_transactions(ticker_symbol)
        inst_data = get_institutional_holdings(ticker_symbol)
        insider_txs = insider_data.get("transactions", [])
        inst_holders = inst_data.get("holders", [])
        comp_data = get_competitor_comparison(ticker_symbol)
        comp_list = comp_data.get("comparisons", [])
        opt_data = get_options_chain_data(ticker_symbol)
        earnings_intel = get_earnings_intelligence(ticker_symbol)
        warning_data = get_early_warning_signals(ticker_symbol)
        val_opp = get_valuation_opportunities(ticker_symbol)
        dcf_sim = run_monte_carlo_dcf(ticker_symbol, num_simulations=100)
        capital_alloc = get_capital_allocation_data(ticker_symbol)

        import yfinance as yf
        try:
            ticker_obj = yf.Ticker(ticker_symbol)
            sector_name = ticker_obj.info.get("sector", "Technology")
        except:
            sector_name = "Technology"
        macro_data = get_macro_indicators(sector_name)
        macro_list = macro_data.get("macro_indicators", [])
        sec_etf = macro_data.get("sector_etf", {
            "ticker": "XLK",
            "name": "Technology Select Sector SPDR Fund",
            "current_price": 210.50,
            "one_month_return": 3.45,
            "six_month_return": 12.80
        })

        prompt = self._build_analysis_prompt(data_dict, indicators)

        result_dict = {}
        try:
            from google.genai import Client
            from google.genai import types

            client = Client(api_key=self.api_key)
            model_id = self.model_name or "gemini-2.5-flash"
            # Strip "models/" prefix if present to comply with the new SDK expectations
            if model_id.startswith("models/"):
                model_id = model_id[7:]
                
            logger.info(f"Invoking Google Gemini API ({model_id}) in BATCH mode using new SDK...")

            response = client.models.generate_content(
                model=model_id,
                contents=SYSTEM_PROMPT + "\n\n" + prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            generated_text = response.text.strip()
            if generated_text:
                clean_text = generated_text
                if clean_text.startswith("```"):
                    if clean_text.startswith("```json"):
                        clean_text = clean_text[7:]
                    else:
                        clean_text = clean_text[3:]
                    if clean_text.endswith("```"):
                        clean_text = clean_text[:-3]
                    clean_text = clean_text.strip()

                try:
                    result_dict = json.loads(clean_text)
                except Exception as je:
                    logger.warning(f"Failed to parse JSON from Gemini output: {je}. Extracting raw text.")
                    import re
                    match = re.search(r"\{.*\}", clean_text, re.DOTALL)
                    if match:
                        result_dict = json.loads(match.group(0))
                    else:
                        raise je
            if "misinformation_analysis" in result_dict:
                result_dict["misinformation"] = result_dict.pop("misinformation_analysis")
        except Exception as e:
            logger.error(f"Error calling Google Gemini API in batch: {e}", exc_info=True)
            logger.info("Falling back to rule-based mock analysis...")
            mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)
            return StockInsightResponse(**mock_data)

        # Fallback to mock values for any missing schema fields
        mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)
        required_keys = [
            "technical_momentum",
            "fundamental_health",
            "sentiment",
            "key_risks",
            "overall_recommendation",
            "insider_flow",
            "macro_flow",
            "competitor_analysis",
            "options_flow",
            "earnings_intelligence",
            "early_warning",
            "valuation_opportunity",
            "capital_allocation",
            "investment_committee",
            "bull_bear_debate",
            "market_psychology",
            "options_analyzer",
            "breakout_hunter",
            "alpha_discovery",
            "backtest",
            "screener",
            "misinformation"
        ]
        for key in required_keys:
            if key not in result_dict or not result_dict[key]:
                result_dict[key] = mock_data[key]
            else:
                self._deep_fill_missing(result_dict[key], mock_data[key])

        # Inject computed numeric fields
        result_dict["risk_metrics"] = risk_metrics.dict() if hasattr(risk_metrics, "dict") else risk_metrics
        result_dict["technical_scales"] = technical_scales.dict() if hasattr(technical_scales, "dict") else technical_scales
        result_dict["fundamental_comparisons"] = [item.dict() if hasattr(item, "dict") else item for item in fundamental_comparisons]
        result_dict["insider_transactions"] = insider_txs
        result_dict["institutional_holders"] = inst_holders
        result_dict["macro_indicators"] = macro_list
        result_dict["sector_etf"] = sec_etf
        result_dict["competitor_comparisons"] = comp_list

        oi_ratio = opt_data.get("put_call_oi_ratio", 1.0)
        vol_ratio = opt_data.get("put_call_volume_ratio", 1.0)
        if "options_flow" not in result_dict:
            result_dict["options_flow"] = {
                "evaluation": "Bullish" if oi_ratio < 0.8 else "Bearish" if oi_ratio > 1.2 else "Neutral",
                "put_call_oi_ratio": oi_ratio,
                "put_call_volume_ratio": vol_ratio,
                "flow_summary": "Derivative hedging signals remain balanced under current contract volume trends."
            }
        else:
            result_dict["options_flow"]["put_call_oi_ratio"] = oi_ratio
            result_dict["options_flow"]["put_call_volume_ratio"] = vol_ratio
        result_dict["unusual_options"] = opt_data.get("unusual_options", [])

        # Earnings
        history_list = earnings_intel.get("history", [])
        next_date = earnings_intel.get("next_earnings_date")
        next_est = earnings_intel.get("next_eps_estimate")
        if "earnings_intelligence" not in result_dict:
            result_dict["earnings_intelligence"] = {
                "evaluation": "Favorable" if len(history_list) > 0 and (history_list[0].get("surprise_pct") or 0.0) >= 0.0 else "Neutral",
                "next_earnings_date": next_date,
                "next_eps_estimate": next_est,
                "intelligence_summary": "Guidance projections indicate stable outlook expectations aligned with recent EPS reports."
            }
        else:
            result_dict["earnings_intelligence"]["next_earnings_date"] = next_date
            result_dict["earnings_intelligence"]["next_eps_estimate"] = next_est
        result_dict["earnings_history"] = history_list

        # Early Warning
        alerts_list = warning_data.get("alerts", [])
        if "early_warning" not in result_dict:
            result_dict["early_warning"] = {
                "evaluation": "High Risk" if len(alerts_list) >= 3 else "Warning" if len(alerts_list) >= 1 else "Safe",
                "deteriorating_signals_count": len(alerts_list),
                "warning_summary": f"Liquidity cushions show a current ratio of {warning_data.get('current_ratio', 1.0)}, while operating gross margin tracks at {warning_data.get('gross_margin', 0.0)}%.",
                "gross_margin": warning_data.get("gross_margin", 0.0),
                "operating_margin": warning_data.get("operating_margin", 0.0),
                "current_ratio": warning_data.get("current_ratio", 1.0),
                "debt_to_equity": warning_data.get("debt_to_equity", 0.0)
            }
        else:
            result_dict["early_warning"]["gross_margin"] = warning_data.get("gross_margin", 0.0)
            result_dict["early_warning"]["operating_margin"] = warning_data.get("operating_margin", 0.0)
            result_dict["early_warning"]["current_ratio"] = warning_data.get("current_ratio", 1.0)
            result_dict["early_warning"]["debt_to_equity"] = warning_data.get("debt_to_equity", 0.0)
        result_dict["warning_alerts"] = alerts_list

        # Valuation Opportunities
        if "valuation_opportunity" not in result_dict:
            result_dict["valuation_opportunity"] = {
                "evaluation": "Undervalued" if val_opp.get("implied_upside_pct", 0.0) > 15.0 else "Overvalued" if val_opp.get("implied_upside_pct", 0.0) < -5.0 else "Fairly Valued",
                "intrinsic_value": val_opp.get("intrinsic_value"),
                "analyst_target_median": val_opp.get("analyst_target_median"),
                "implied_upside_pct": val_opp.get("implied_upside_pct", 0.0),
                "valuation_summary": f"Historical multiple analyses indicate a current price offset. Analyst median stands at ${val_opp.get('analyst_target_median')} with expected return levels near {val_opp.get('implied_upside_pct')}%. Monte Carlo simulations yield a base price of ${dcf_sim.get('base_value_50p')} with an upside probability of {dcf_sim.get('upside_probability')}%.",
                "dcf_bear_value": dcf_sim.get("bear_value_10p"),
                "dcf_base_value": dcf_sim.get("base_value_50p"),
                "dcf_bull_value": dcf_sim.get("bull_value_90p"),
                "dcf_upside_probability": dcf_sim.get("upside_probability")
            }
        else:
            result_dict["valuation_opportunity"]["intrinsic_value"] = val_opp.get("intrinsic_value")
            result_dict["valuation_opportunity"]["analyst_target_median"] = val_opp.get("analyst_target_median")
            result_dict["valuation_opportunity"]["implied_upside_pct"] = val_opp.get("implied_upside_pct", 0.0)
            result_dict["valuation_opportunity"]["dcf_bear_value"] = dcf_sim.get("bear_value_10p")
            result_dict["valuation_opportunity"]["dcf_base_value"] = dcf_sim.get("base_value_50p")
            result_dict["valuation_opportunity"]["dcf_bull_value"] = dcf_sim.get("bull_value_90p")
            result_dict["valuation_opportunity"]["dcf_upside_probability"] = dcf_sim.get("upside_probability")

        # Capital Allocation
        if "capital_allocation" not in result_dict:
            result_dict["capital_allocation"] = {
                "evaluation": "Efficient" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Balanced" if capital_alloc.get("return_on_equity", 0.0) > 5.0 else "Inefficient",
                "dividend_yield": capital_alloc.get("dividend_yield", 0.0),
                "payout_ratio": capital_alloc.get("payout_ratio", 0.0),
                "return_on_equity": capital_alloc.get("return_on_equity", 0.0),
                "return_on_assets": capital_alloc.get("return_on_assets", 0.0),
                "allocation_summary": f"Capital allocation metrics show ROE of {capital_alloc.get('return_on_equity')}% and ROA of {capital_alloc.get('return_on_assets')}%."
            }
        else:
            ca = result_dict["capital_allocation"]
            ca["dividend_yield"] = capital_alloc.get("dividend_yield", 0.0)
            ca["payout_ratio"] = capital_alloc.get("payout_ratio", 0.0)
            ca["return_on_equity"] = capital_alloc.get("return_on_equity", 0.0)
            ca["return_on_assets"] = capital_alloc.get("return_on_assets", 0.0)

        # Corporate Moat
        if "corporate_moat" not in result_dict:
            result_dict["corporate_moat"] = {
                "evaluation": "Wide Moat" if capital_alloc.get("return_on_equity", 0.0) > 20.0 else "Narrow Moat" if capital_alloc.get("return_on_equity", 0.0) > 10.0 else "No Moat",
                "moat_score": min(100.0, max(0.0, float(capital_alloc.get("return_on_equity", 0.0) * 3.5))),
                "pricing_power": "Strong" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Moderate" if capital_alloc.get("return_on_equity", 0.0) > 7.0 else "Weak",
                "moat_summary": f"Pricing power analysis shows ROE tracks at {capital_alloc.get('return_on_equity')}% indicating structural moat efficiency relative to direct peers."
            }
        else:
            cm = result_dict["corporate_moat"]
            if "evaluation" not in cm:
                cm["evaluation"] = "Wide Moat" if capital_alloc.get("return_on_equity", 0.0) > 20.0 else "Narrow Moat" if capital_alloc.get("return_on_equity", 0.0) > 10.0 else "No Moat"
            if "moat_score" not in cm:
                cm["moat_score"] = min(100.0, max(0.0, float(capital_alloc.get("return_on_equity", 0.0) * 3.5)))
            if "pricing_power" not in cm:
                cm["pricing_power"] = "Strong" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Moderate" if capital_alloc.get("return_on_equity", 0.0) > 7.0 else "Weak"
            if "moat_summary" not in cm:
                cm["moat_summary"] = f"Pricing power analysis shows ROE tracks at {capital_alloc.get('return_on_equity')}% indicating structural moat efficiency relative to direct peers."

        # Fall back to dynamic mock values for any missing schema fields (must be before first mock_data usage)
        mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)

        # Dynamic recommendation override
        _, dynamic_rating, dynamic_confidence = self._calculate_score_rating_confidence(
            indicators, data_dict.get("metrics", {}), insider_txs, sec_etf, capital_alloc
        )
        self._sync_recommendation(result_dict, dynamic_rating, dynamic_confidence)

        if "investment_committee" not in result_dict:
            result_dict["investment_committee"] = mock_data["investment_committee"]
        self._recalculate_committee_consensus(result_dict["investment_committee"])

        result_dict["ticker"] = ticker_symbol
        result_dict["model_name"] = f"Gemini (Batch - {model_id})"
        result_dict["is_mock"] = False
        result_dict["generated_at"] = time.time()

        return StockInsightResponse(**result_dict)

    def generate_insight(self, stock_data: StockDataResponse) -> StockInsightResponse:
        """
        Generates structured AI analysis using Gemini, Hugging Face Hub, or local Ollama.
        """
        if self.use_local_llm:
            return self._generate_insight_local_llm(stock_data)
        elif not self.use_google_api:
            return self._generate_insight_huggingface_hub(stock_data)
        elif self.use_batch:
            return self._generate_insight_gemini_batch(stock_data)
        ticker_symbol = stock_data.ticker.upper()
        
        # 1. Calculate technical indicators from prices
        # prices inside StockDataResponse are Pydantic models. Convert them to dicts first.
        prices_list = [p.model_dump() for p in stock_data.prices]
        indicators = self.calculate_indicators(prices_list)

        # If not configured, return mock data with extended fields
        if not self.client_ready:
            mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)
            return StockInsightResponse(**mock_data)

        # 2. Build the payload
        # stock_data is a StockDataResponse model, convert to dict
        data_dict = stock_data.model_dump()
        # Compute extended metrics
        risk_metrics = self._compute_risk_metrics(prices_list)
        technical_scales = self._compute_technical_scales(prices_list, indicators)
        fundamental_comparisons = self._compute_fundamental_comparisons(data_dict.get('metrics', {}))
        
        from app.tools import (
            get_insider_transactions,
            get_institutional_holdings,
            get_macro_indicators,
            get_competitor_comparison,
            get_options_chain_data,
            get_earnings_intelligence,
            get_early_warning_signals,
            get_valuation_opportunities,
            get_capital_allocation_data,
            run_monte_carlo_dcf,
        )
        insider_data = get_insider_transactions(ticker_symbol)
        inst_data = get_institutional_holdings(ticker_symbol)
        insider_txs = insider_data.get("transactions", [])
        inst_holders = inst_data.get("holders", [])
        comp_data = get_competitor_comparison(ticker_symbol)
        comp_list = comp_data.get("comparisons", [])
        opt_data = get_options_chain_data(ticker_symbol)
        earnings_intel = get_earnings_intelligence(ticker_symbol)
        warning_data = get_early_warning_signals(ticker_symbol)
        val_opp = get_valuation_opportunities(ticker_symbol)
        dcf_sim = run_monte_carlo_dcf(ticker_symbol, num_simulations=100)
        capital_alloc = get_capital_allocation_data(ticker_symbol)
        
        # Resolve sector name and fetch macro details
        import yfinance as yf
        try:
            ticker_obj = yf.Ticker(ticker_symbol)
            sector_name = ticker_obj.info.get("sector", "Technology")
        except:
            sector_name = "Technology"
        macro_data = get_macro_indicators(sector_name)
        macro_list = macro_data.get("macro_indicators", [])
        sec_etf = macro_data.get("sector_etf", {
            "ticker": "XLK",
            "name": "Technology Select Sector SPDR Fund",
            "current_price": 210.50,
            "one_month_return": 3.45,
            "six_month_return": 12.80
        })
        
        prompt = self._build_analysis_prompt(data_dict, indicators)
        
        # 3. Call Google ADK Orchestrator Agent (or mock fallback)
        try:
            import asyncio
            from app.agent import root_pipeline
            from google.adk.runners import Runner
            from google.adk.sessions import InMemorySessionService
            from google.genai import types

            def run_adk_agent():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    async def _run():
                        session_service = InMemorySessionService()
                        await session_service.create_session(app_name="STPIS", user_id="user", session_id="s1")
                        runner = Runner(agent=root_pipeline, app_name="STPIS", session_service=session_service)
                        
                        response_text = ""
                        async for event in runner.run_async(
                            user_id="user",
                            session_id="s1",
                            new_message=types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
                        ):
                            if event.is_final_response():
                                response_text = event.content.parts[0].text
                        return response_text
                    
                    return loop.run_until_complete(_run())
                finally:
                    loop.close()

            logger.info(f"Invoking Google ADK Orchestrator Agent for {ticker_symbol}...")
            response_text = run_adk_agent()
            result_dict = json.loads(response_text)
            if "misinformation_analysis" in result_dict:
                result_dict["misinformation"] = result_dict.pop("misinformation_analysis")
            
            # Insert computed numeric fields (client side can also compute, but we include for completeness)
            result_dict["risk_metrics"] = risk_metrics.dict()
            result_dict["technical_scales"] = technical_scales.dict()
            result_dict["fundamental_comparisons"] = [item.dict() for item in fundamental_comparisons]
            result_dict["insider_transactions"] = insider_txs
            result_dict["institutional_holders"] = inst_holders
            result_dict["macro_indicators"] = macro_list
            result_dict["sector_etf"] = sec_etf
            result_dict["competitor_comparisons"] = comp_list
            # Options data injection (Force override)
            oi_ratio = opt_data.get("put_call_oi_ratio", 1.0)
            vol_ratio = opt_data.get("put_call_volume_ratio", 1.0)
            if "options_flow" not in result_dict:
                result_dict["options_flow"] = {
                    "evaluation": "Bullish" if oi_ratio < 0.8 else "Bearish" if oi_ratio > 1.2 else "Neutral",
                    "put_call_oi_ratio": oi_ratio,
                    "put_call_volume_ratio": vol_ratio,
                    "flow_summary": "Hedging bets match baseline volume distributions."
                }
            else:
                result_dict["options_flow"]["put_call_oi_ratio"] = oi_ratio
                result_dict["options_flow"]["put_call_volume_ratio"] = vol_ratio
            result_dict["unusual_options"] = opt_data.get("unusual_options", [])
            
            # Earnings data injection (Force override)
            history_list = earnings_intel.get("history", [])
            next_date = earnings_intel.get("next_earnings_date")
            next_est = earnings_intel.get("next_eps_estimate")
            if "earnings_intelligence" not in result_dict:
                result_dict["earnings_intelligence"] = {
                    "evaluation": "Favorable" if len(history_list) > 0 and (history_list[0].get("surprise_pct") or 0.0) >= 0.0 else "Neutral",
                    "next_earnings_date": next_date,
                    "next_eps_estimate": next_est,
                    "intelligence_summary": "Guidance projections indicate stable outlook expectations aligned with recent EPS reports."
                }
            else:
                result_dict["earnings_intelligence"]["next_earnings_date"] = next_date
                result_dict["earnings_intelligence"]["next_eps_estimate"] = next_est
            result_dict["earnings_history"] = history_list
            
            # Early Warning data injection (Force override)
            alerts_list = warning_data.get("alerts", [])
            if "early_warning" not in result_dict:
                result_dict["early_warning"] = {
                    "evaluation": "High Risk" if len(alerts_list) >= 3 else "Warning" if len(alerts_list) >= 1 else "Safe",
                    "deteriorating_signals_count": len(alerts_list),
                    "warning_summary": f"Liquidity cushions show a current ratio of {warning_data.get('current_ratio', 1.0)}, while operating gross margin tracks at {warning_data.get('gross_margin', 0.0)}%.",
                    "gross_margin": warning_data.get("gross_margin", 0.0),
                    "operating_margin": warning_data.get("operating_margin", 0.0),
                    "current_ratio": warning_data.get("current_ratio", 1.0),
                    "debt_to_equity": warning_data.get("debt_to_equity", 0.0)
                }
            else:
                result_dict["early_warning"]["gross_margin"] = warning_data.get("gross_margin", 0.0)
                result_dict["early_warning"]["operating_margin"] = warning_data.get("operating_margin", 0.0)
                result_dict["early_warning"]["current_ratio"] = warning_data.get("current_ratio", 1.0)
                result_dict["early_warning"]["debt_to_equity"] = warning_data.get("debt_to_equity", 0.0)
            
            # Valuation Opportunities (Force override)
            if "valuation_opportunity" not in result_dict:
                result_dict["valuation_opportunity"] = {
                    "evaluation": "Undervalued" if val_opp.get("implied_upside_pct", 0.0) > 15.0 else "Overvalued" if val_opp.get("implied_upside_pct", 0.0) < -5.0 else "Fairly Valued",
                    "intrinsic_value": val_opp.get("intrinsic_value"),
                    "analyst_target_median": val_opp.get("analyst_target_median"),
                    "implied_upside_pct": val_opp.get("implied_upside_pct", 0.0),
                    "valuation_summary": f"Historical multiple analyses indicate a current price offset. Analyst median stands at ${val_opp.get('analyst_target_median')} with expected return levels near {val_opp.get('implied_upside_pct')}%. Monte Carlo simulations yield a base price of ${dcf_sim.get('base_value_50p')} with an upside probability of {dcf_sim.get('upside_probability')}%.",
                    "dcf_bear_value": dcf_sim.get("bear_value_10p"),
                    "dcf_base_value": dcf_sim.get("base_value_50p"),
                    "dcf_bull_value": dcf_sim.get("bull_value_90p"),
                    "dcf_upside_probability": dcf_sim.get("upside_probability")
                }
            else:
                result_dict["valuation_opportunity"]["intrinsic_value"] = val_opp.get("intrinsic_value")
                result_dict["valuation_opportunity"]["analyst_target_median"] = val_opp.get("analyst_target_median")
                result_dict["valuation_opportunity"]["implied_upside_pct"] = val_opp.get("implied_upside_pct", 0.0)
                result_dict["valuation_opportunity"]["dcf_bear_value"] = dcf_sim.get("bear_value_10p")
                result_dict["valuation_opportunity"]["dcf_base_value"] = dcf_sim.get("base_value_50p")
                result_dict["valuation_opportunity"]["dcf_bull_value"] = dcf_sim.get("bull_value_90p")
                result_dict["valuation_opportunity"]["dcf_upside_probability"] = dcf_sim.get("upside_probability")
                
            # Capital Allocation (Force override)
            if "capital_allocation" not in result_dict:
                result_dict["capital_allocation"] = {
                    "evaluation": "Efficient" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Balanced" if capital_alloc.get("return_on_equity", 0.0) > 5.0 else "Inefficient",
                    "dividend_yield": capital_alloc.get("dividend_yield", 0.0),
                    "payout_ratio": capital_alloc.get("payout_ratio", 0.0),
                    "return_on_equity": capital_alloc.get("return_on_equity", 0.0),
                    "return_on_assets": capital_alloc.get("return_on_assets", 0.0),
                    "allocation_summary": f"Capital allocation metrics show ROE of {capital_alloc.get('return_on_equity')}% and ROA of {capital_alloc.get('return_on_assets')}%."
                }
            else:
                ca = result_dict["capital_allocation"]
                ca["dividend_yield"] = capital_alloc.get("dividend_yield", 0.0)
                ca["payout_ratio"] = capital_alloc.get("payout_ratio", 0.0)
                ca["return_on_equity"] = capital_alloc.get("return_on_equity", 0.0)
                ca["return_on_assets"] = capital_alloc.get("return_on_assets", 0.0)

            # Corporate Moat (Force override)
            if "corporate_moat" not in result_dict:
                result_dict["corporate_moat"] = {
                    "evaluation": "Wide Moat" if capital_alloc.get("return_on_equity", 0.0) > 20.0 else "Narrow Moat" if capital_alloc.get("return_on_equity", 0.0) > 10.0 else "No Moat",
                    "moat_score": min(100.0, max(0.0, float(capital_alloc.get("return_on_equity", 0.0) * 3.5))),
                    "pricing_power": "Strong" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Moderate" if capital_alloc.get("return_on_equity", 0.0) > 7.0 else "Weak",
                    "moat_summary": f"Pricing power analysis shows ROE tracks at {capital_alloc.get('return_on_equity')}% indicating structural moat efficiency relative to direct peers."
                }
            else:
                cm = result_dict["corporate_moat"]
                if "evaluation" not in cm or not cm["evaluation"]:
                    cm["evaluation"] = "Wide Moat" if capital_alloc.get("return_on_equity", 0.0) > 20.0 else "Narrow Moat" if capital_alloc.get("return_on_equity", 0.0) > 10.0 else "No Moat"
                if "moat_score" not in cm or not cm["moat_score"]:
                    cm["moat_score"] = min(100.0, max(0.0, float(capital_alloc.get("return_on_equity", 0.0) * 3.5)))
                if "pricing_power" not in cm or not cm["pricing_power"]:
                    cm["pricing_power"] = "Strong" if capital_alloc.get("return_on_equity", 0.0) > 15.0 else "Moderate" if capital_alloc.get("return_on_equity", 0.0) > 7.0 else "Weak"
                if "moat_summary" not in cm or not cm["moat_summary"]:
                    cm["moat_summary"] = f"Pricing power analysis shows ROE tracks at {capital_alloc.get('return_on_equity')}% indicating structural moat efficiency relative to direct peers."

            # Fall back to dynamic mock values for any missing schema fields (must be before first mock_data usage)
            mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)

            # Calculate dynamic recommendation rating and confidence score from real yfinance data
            _, dynamic_rating, dynamic_confidence = self._calculate_score_rating_confidence(
                indicators, data_dict.get("metrics", {}), insider_txs, sec_etf, capital_alloc
            )
            self._sync_recommendation(result_dict, dynamic_rating, dynamic_confidence)
            result_dict["warning_alerts"] = alerts_list
            # Force override consensus recommendation in committee debate
            if "investment_committee" not in result_dict:
                result_dict["investment_committee"] = mock_data["investment_committee"]
            self._recalculate_committee_consensus(result_dict["investment_committee"])
            required_keys = [
            "technical_momentum",
            "fundamental_health",
            "sentiment",
            "key_risks",
            "overall_recommendation",
            "insider_flow",
            "macro_flow",
            "competitor_analysis",
            "options_flow",
            "earnings_intelligence",
            "early_warning",
            "valuation_opportunity",
            "capital_allocation",
            "investment_committee",
            "bull_bear_debate",
            "market_psychology",
            "options_analyzer",
            "breakout_hunter",
            "alpha_discovery",
            "backtest",
            "screener",
            "misinformation"
        ]
            for key in required_keys:
                if key not in result_dict or not result_dict[key]:
                    result_dict[key] = mock_data[key]
                else:
                    self._deep_fill_missing(result_dict[key], mock_data[key])

            result_dict["ticker"] = ticker_symbol
            result_dict["model_name"] = "Gemini 2.5 Flash"
            result_dict["is_mock"] = False
            result_dict["generated_at"] = time.time()
            
            return StockInsightResponse(**result_dict)
        except Exception as e:
            logger.error(f"Error generating insight from Google ADK for {ticker_symbol}: {e}", exc_info=True)
            logger.info("Falling back to mock insight...")
            mock_data = self._get_mock_insight(ticker_symbol, stock_data, indicators)
            return StockInsightResponse(**mock_data)
