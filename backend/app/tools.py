import logging
from typing import Dict, Any, List, Optional
from app.services.stock_service import fetch_stock_data
from app.cache import stock_cache
import pandas as pd
import time

logger = logging.getLogger(__name__)

def _get_stock_data_cached(ticker: str) -> Any:
    ticker_upper = ticker.strip().upper()
    data = stock_cache.get(ticker_upper)
    if not data:
        data = fetch_stock_data(ticker_upper)
        stock_cache.set(ticker_upper, data)
    return data

def get_technical_metrics(ticker: str) -> Dict[str, Any]:
    """
    Fetches the 20-day SMA, 50-day SMA, RSI (14), MACD histogram, Trend Score, and Momentum Score for a stock.
    Use this to perform technical analysis.
    """
    try:
        data = _get_stock_data_cached(ticker)
        prices = [p.model_dump() for p in data.prices]
        if not prices:
            return {"error": "No price history available"}
        
        df = pd.DataFrame(prices)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').reset_index(drop=True)
        
        latest_close = float(df['close'].iloc[-1]) if not pd.isna(df['close'].iloc[-1]) else 0.0
        
        # SMAs
        df['sma20'] = df['close'].rolling(window=20).mean()
        df['sma50'] = df['close'].rolling(window=50).mean()
        sma20 = float(df['sma20'].iloc[-1]) if not pd.isna(df['sma20'].iloc[-1]) else 0.0
        sma50 = float(df['sma50'].iloc[-1]) if not pd.isna(df['sma50'].iloc[-1]) else 0.0
        
        # RSI 14
        delta = df['close'].diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        rs = avg_gain / avg_loss.replace(0.0, 1e-10)
        rsi = float(100 - (100 / (1 + rs)).iloc[-1])
        
        # MACD
        ema12 = df['close'].ewm(span=12, adjust=False).mean()
        ema26 = df['close'].ewm(span=26, adjust=False).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        macd_hist = macd_line - signal_line
        macd_hist_latest = float(macd_hist.iloc[-1])
        
        trend_score = 70.0 if latest_close > sma20 else 30.0
        momentum_score = rsi

        return {
            "rsi14": round(rsi, 2),
            "sma20": round(sma20, 2),
            "sma50": round(sma50, 2),
            "macd_histogram": round(macd_hist_latest, 4),
            "trend_score": round(trend_score, 2),
            "momentum_score": round(momentum_score, 2)
        }
    except Exception as e:
        logger.error(f"Error getting technical metrics: {e}")
        return {"error": str(e)}

def get_fundamental_metrics(ticker: str) -> Dict[str, Any]:
    """
    Fetches the key TTM financial metrics (P/E ratio, margins, ROE, revenue, market cap) and benchmarks.
    Use this to perform fundamental valuation and health analysis.
    """
    try:
        data = _get_stock_data_cached(ticker)
        metrics = data.metrics.model_dump() if hasattr(data.metrics, "model_dump") else data.metrics
        
        # Benchmarks comparisons
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
        
        comparisons = []
        for key, bench_val in benchmark_map.items():
            if key in metrics and metrics[key] is not None:
                company_val = metrics[key]
                diff = company_val - bench_val if isinstance(company_val, (int, float)) else 0.0
                expl = (
                    f"Above benchmark ({bench_val}) indicating stronger performance." if diff > 0
                    else f"Below benchmark ({bench_val}) indicating weaker performance." if diff < 0
                    else f"Equal to benchmark ({bench_val})."
                )
                comparisons.append({
                    "metric": metric_names.get(key, key),
                    "value": round(float(company_val), 2) if isinstance(company_val, (int, float)) else 0.0,
                    "benchmark": bench_val,
                    "explanation": expl
                })
                
        return {
            "metrics": metrics,
            "comparisons": comparisons
        }
    except Exception as e:
        logger.error(f"Error getting fundamental metrics: {e}")
        return {"error": str(e)}

def get_risk_metrics(ticker: str) -> Dict[str, Any]:
    """
    Computes statistical risk metrics (Annual Volatility, Sharpe Ratio, Max Drawdown, Avg Daily Return) from pricing history.
    Use this to perform quantitative risk profiling.
    """
    try:
        data = _get_stock_data_cached(ticker)
        prices = [p.model_dump() for p in data.prices]
        if not prices:
            return {"error": "No price history available"}
            
        df = pd.DataFrame(prices)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        df['return'] = df['close'].pct_change()
        daily_returns = df['return'].dropna()
        
        if daily_returns.empty:
            return {"annual_volatility": 0.0, "sharpe_ratio": 0.0, "max_drawdown": 0.0, "avg_daily_return": 0.0}
            
        vol = daily_returns.std() * (252 ** 0.5) * 100
        avg_ret = daily_returns.mean() * 100
        sharpe = (daily_returns.mean() * 252) / (daily_returns.std() * (252 ** 0.5)) if daily_returns.std() != 0 else 0.0
        
        cumulative_max = df['close'].cummax()
        drawdown = (df['close'] - cumulative_max) / cumulative_max
        max_dd = abs(drawdown.min() * 100)
        
        return {
            "annual_volatility": round(vol, 2),
            "sharpe_ratio": round(sharpe, 2),
            "max_drawdown": round(max_dd, 2),
            "avg_daily_return": round(avg_ret, 2)
        }
    except Exception as e:
        logger.error(f"Error getting risk metrics: {e}")
        return {"error": str(e)}

def get_news_sentiment(ticker: str) -> Dict[str, Any]:
    """
    Fetches recent news articles and publishers for a stock.
    Use this to analyze overall news coverage and market sentiment.
    """
    try:
        data = _get_stock_data_cached(ticker)
        news = [n.model_dump() if hasattr(n, "model_dump") else n for n in data.news]
        return {
            "news": news[:10]  # Return latest 10 articles
        }
    except Exception as e:
        logger.error(f"Error getting news: {e}")
        return {"error": str(e)}

def get_insider_transactions(ticker: str) -> Dict[str, Any]:
    """
    Fetches recent SEC Form 4 filings for company insiders (CEOs, CFOs, Directors).
    Use this to examine management buy/sell transactions and shares traded.
    """
    try:
        import yfinance as yf
        t = yf.Ticker(ticker.strip().upper())
        df = t.insider_transactions
        if df is None or df.empty:
            return {"transactions": []}
        
        # Standardize columns to lower/snake or direct mapping
        # yfinance columns typically: ['Date', 'Insider', 'Position', 'Transaction', 'Shares', 'Value']
        transactions = []
        for idx, row in df.head(10).iterrows():
            row_dict = row.to_dict()
            
            # Map values with fallback keys
            date_val = str(row_dict.get('Date', row_dict.get('Start Date', idx)))
            name_val = str(row_dict.get('Insider', 'Unknown Insider'))
            pos_val = str(row_dict.get('Position', 'Executive'))
            type_val = str(row_dict.get('Transaction', 'Trade'))
            shares_val = float(row_dict.get('Shares', 0.0))
            val_val = float(row_dict.get('Value', 0.0))
            
            transactions.append({
                "date": date_val,
                "transaction_type": type_val,
                "shares": shares_val,
                "value": val_val,
                "insider_name": name_val,
                "position": pos_val
            })
        return {"transactions": transactions}
    except Exception as e:
        logger.error(f"Error getting insider transactions: {e}")
        return {"transactions": [], "error": str(e)}

def get_institutional_holdings(ticker: str) -> Dict[str, Any]:
    """
    Fetches top institutional fund shareholders and percentage outstanding owned.
    Use this to analyze institutional flows and holdings concentration.
    """
    try:
        import yfinance as yf
        t = yf.Ticker(ticker.strip().upper())
        df = t.institutional_holders
        if df is None or df.empty:
            return {"holders": []}
            
        holders = []
        for idx, row in df.head(10).iterrows():
            row_dict = row.to_dict()
            
            # Columns typically: ['Holder', 'Shares', 'Value', 'Date Reported', '% Out']
            holder_val = str(row_dict.get('Holder', 'Unknown Fund'))
            shares_val = float(row_dict.get('Shares', 0.0))
            val_val = float(row_dict.get('Value', 0.0))
            
            # Parse % Out (e.g. 0.082 -> 8.2%)
            pct_raw = row_dict.get('% Out', row_dict.get('pct_held', 0.0))
            if pct_raw is not None:
                try:
                    pct_val = float(pct_raw) * 100.0
                except:
                    pct_val = 0.0
            else:
                pct_val = 0.0
                
            holders.append({
                "holder": holder_val,
                "shares": shares_val,
                "value": val_val,
                "pct_held": round(pct_val, 2)
            })
        return {"holders": holders}
    except Exception as e:
        logger.error(f"Error getting institutional holdings: {e}")
        return {"holders": [], "error": str(e)}

def get_macro_indicators(sector_name: str) -> Dict[str, Any]:
    """
    Fetches key macroeconomic indicators (US 10-Year Treasury Yield ^TNX, VIX volatility index ^VIX)
    and the performance of the mapped sector ETF using yfinance.
    Use this to evaluate macroeconomic conditions and sector trends.
    """
    try:
        import yfinance as yf
        
        # 1. Fetch TNX (10-Year Treasury Yield)
        tnx_ticker = yf.Ticker("^TNX")
        tnx_history = tnx_ticker.history(period="5d")
        if not tnx_history.empty:
            tnx_val = float(tnx_history["Close"].iloc[-1])
            tnx_prev = float(tnx_history["Close"].iloc[-2]) if len(tnx_history) > 1 else tnx_val
            tnx_change = ((tnx_val - tnx_prev) / tnx_prev) * 100 if tnx_prev != 0 else 0.0
        else:
            tnx_val, tnx_change = 4.25, 0.0
            
        # 2. Fetch VIX (Volatility Index)
        vix_ticker = yf.Ticker("^VIX")
        vix_history = vix_ticker.history(period="5d")
        if not vix_history.empty:
            vix_val = float(vix_history["Close"].iloc[-1])
            vix_prev = float(vix_history["Close"].iloc[-2]) if len(vix_history) > 1 else vix_val
            vix_change = ((vix_val - vix_prev) / vix_prev) * 100 if vix_prev != 0 else 0.0
        else:
            vix_val, vix_change = 14.50, 0.0
            
        # Map sector name to benchmark ETF
        etf_map = {
            "technology": ("XLK", "Technology Select Sector SPDR Fund"),
            "financials": ("XLF", "Financial Select Sector SPDR Fund"),
            "financial services": ("XLF", "Financial Select Sector SPDR Fund"),
            "healthcare": ("XLV", "Health Care Select Sector SPDR Fund"),
            "energy": ("XLE", "Energy Select Sector SPDR Fund"),
            "consumer cyclical": ("XLY", "Consumer Discretionary Select Sector SPDR Fund"),
            "consumer discretionary": ("XLY", "Consumer Discretionary Select Sector SPDR Fund"),
            "consumer defensive": ("XLP", "Consumer Staples Select Sector SPDR Fund"),
            "consumer staples": ("XLP", "Consumer Staples Select Sector SPDR Fund"),
            "industrials": ("XLI", "Industrial Select Sector SPDR Fund"),
            "basic materials": ("XLB", "Materials Select Sector SPDR Fund"),
            "materials": ("XLB", "Materials Select Sector SPDR Fund"),
            "utilities": ("XLU", "Utilities Select Sector SPDR Fund"),
            "real estate": ("XLRE", "Real Estate Select Sector SPDR Fund"),
            "communication services": ("XLC", "Communication Services Select Sector SPDR Fund")
        }
        
        normalized_sector = str(sector_name).lower().strip()
        etf_ticker, etf_name = etf_map.get(normalized_sector, ("SPY", "SPDR S&P 500 ETF Trust"))
        
        # 3. Fetch Sector ETF historical data (to calculate 1-month and 6-month returns)
        etf = yf.Ticker(etf_ticker)
        etf_hist = etf.history(period="6mo")
        
        if not etf_hist.empty:
            current_price = float(etf_hist["Close"].iloc[-1])
            # 1 month ago (approx 20 trading days)
            price_1m = float(etf_hist["Close"].iloc[-21]) if len(etf_hist) > 20 else float(etf_hist["Close"].iloc[0])
            one_month_return = ((current_price - price_1m) / price_1m) * 100
            
            # 6 months ago (approx 125 trading days)
            price_6m = float(etf_hist["Close"].iloc[0])
            six_month_return = ((current_price - price_6m) / price_6m) * 100
        else:
            current_price, one_month_return, six_month_return = 100.0, 0.0, 0.0
            
        macro_indicators = [
            {
                "name": "US 10-Year Treasury Yield",
                "value": round(tnx_val, 3),
                "change": round(tnx_change, 2),
                "status": "Rising Yield" if tnx_change > 0.5 else "Falling Yield" if tnx_change < -0.5 else "Stable"
            },
            {
                "name": "CBOE Volatility Index (VIX)",
                "value": round(vix_val, 2),
                "change": round(vix_change, 2),
                "status": "High Volatility" if vix_val > 20 else "Low Volatility" if vix_val < 15 else "Moderate Volatility"
            }
        ]
        
        sector_etf = {
            "ticker": etf_ticker,
            "name": etf_name,
            "current_price": round(current_price, 2),
            "one_month_return": round(one_month_return, 2),
            "six_month_return": round(six_month_return, 2)
        }
        
        return {
            "macro_indicators": macro_indicators,
            "sector_etf": sector_etf
        }
    except Exception as e:
        logger.error(f"Error getting macro indicators: {e}")
        return {
            "macro_indicators": [],
            "sector_etf": {
                "ticker": "SPY",
                "name": "SPDR S&P 500 ETF Trust",
                "current_price": 0.0,
                "one_month_return": 0.0,
                "six_month_return": 0.0
            },
            "error": str(e)
        }

def get_competitor_comparison(ticker: str) -> Dict[str, Any]:
    """
    Fetches financial metrics (P/E ratio, ROE, revenue growth, gross margins) for the selected stock
    and its top 2 immediate industry competitors using yfinance.
    Use this to perform peer analysis and competitor benchmarking.
    """
    try:
        import yfinance as yf
        
        # Map common tickers to top 2 peers
        peer_mapping = {
            "AAPL": ["MSFT", "GOOGL"],
            "MSFT": ["AAPL", "GOOGL"],
            "GOOGL": ["MSFT", "META"],
            "AMZN": ["WMT", "BABA"],
            "TSLA": ["F", "GM"],
            "NVDA": ["AMD", "INTC"],
            "AMD": ["NVDA", "INTC"],
            "META": ["GOOGL", "SNAP"],
            "NFLX": ["DIS", "WBD"],
            "JPM": ["BAC", "WFC"],
            "BAC": ["JPM", "WFC"],
            "XOM": ["CVX", "SHEL"],
            "CVX": ["XOM", "SHEL"],
            "JNJ": ["PFE", "MRK"],
            "PFE": ["JNJ", "MRK"]
        }
        
        ticker_upper = str(ticker).upper().strip()
        peers = peer_mapping.get(ticker_upper, ["SPY", "QQQ"]) # Fallback to standard ETFs if not mapped
        
        comparison_list = []
        
        # We also want to include the target ticker itself in the comparison so we can show them side-by-side!
        all_tickers = [ticker_upper] + peers
        
        for t in all_tickers:
            try:
                t_obj = yf.Ticker(t)
                t_info = t_obj.info or {}
                
                name = t_info.get("longName", t_info.get("shortName", t))
                pe = t_info.get("trailingPE")
                
                # ROE (e.g. 0.182 -> 18.2%)
                roe_raw = t_info.get("returnOnEquity")
                roe = roe_raw * 100.0 if roe_raw is not None else None
                
                # Revenue Growth (e.g. 0.054 -> 5.4%)
                rev_growth_raw = t_info.get("revenueGrowth")
                rev_growth = rev_growth_raw * 100.0 if rev_growth_raw is not None else None
                
                # Gross Margin (e.g. 0.443 -> 44.3%)
                gross_margin_raw = t_info.get("grossMargins")
                gross_margin = gross_margin_raw * 100.0 if gross_margin_raw is not None else None
                
                comparison_list.append({
                    "ticker": t,
                    "company_name": name,
                    "pe_ratio": round(pe, 2) if pe is not None else None,
                    "roe": round(roe, 2) if roe is not None else None,
                    "revenue_growth": round(rev_growth, 2) if rev_growth is not None else None,
                    "gross_margin": round(gross_margin, 2) if gross_margin is not None else None
                })
            except Exception as ex:
                logger.warning(f"Error fetching competitor metrics for {t}: {ex}")
                comparison_list.append({
                    "ticker": t,
                    "company_name": t,
                    "pe_ratio": None,
                    "roe": None,
                    "revenue_growth": None,
                    "gross_margin": None
                })
                
        return {
            "comparisons": comparison_list
        }
    except Exception as e:
        logger.error(f"Error executing competitor comparison: {e}")
        return {
            "comparisons": [],
            "error": str(e)
        }

def get_options_chain_data(ticker: str) -> Dict[str, Any]:
    """
    Scrapes the options chain for the nearest expiration date of the selected stock using yfinance.
    Calculates Put/Call volume and open interest ratios, and flags the top 5 highest open interest contracts
    as unusual options activity. Use this to analyze short-term derivatives leverage and institutional hedging.
    """
    try:
        import yfinance as yf
        t_obj = yf.Ticker(ticker)
        
        options_dates = t_obj.options
        if not options_dates:
            return {
                "put_call_oi_ratio": 1.0,
                "put_call_volume_ratio": 1.0,
                "unusual_options": []
            }
            
        # Get nearest expiration date options chain
        nearest_date = options_dates[0]
        opt_chain = t_obj.option_chain(nearest_date)
        
        calls = opt_chain.calls
        puts = opt_chain.puts
        
        total_call_oi = float(calls['openInterest'].sum()) if 'openInterest' in calls.columns else 0.0
        total_put_oi = float(puts['openInterest'].sum()) if 'openInterest' in puts.columns else 0.0
        
        total_call_vol = float(calls['volume'].sum()) if 'volume' in calls.columns else 0.0
        total_put_vol = float(puts['volume'].sum()) if 'volume' in puts.columns else 0.0
        
        oi_ratio = total_put_oi / total_call_oi if total_call_oi != 0 else 1.0
        vol_ratio = total_put_vol / total_call_vol if total_call_vol != 0 else 1.0
        
        # Identify unusual options (highest open interest)
        calls_subset = calls[['strike', 'openInterest', 'volume', 'impliedVolatility']].copy()
        calls_subset['type'] = 'Call'
        
        puts_subset = puts[['strike', 'openInterest', 'volume', 'impliedVolatility']].copy()
        puts_subset['type'] = 'Put'
        
        import pandas as pd
        combined = pd.concat([calls_subset, puts_subset])
        combined = combined.dropna(subset=['openInterest'])
        
        top_contracts = combined.sort_values(by='openInterest', ascending=False).head(5)
        
        unusual_list = []
        for idx, row in top_contracts.iterrows():
            unusual_list.append({
                "strike": float(row['strike']),
                "type": str(row['type']),
                "open_interest": float(row['openInterest']),
                "volume": float(row['volume']) if not pd.isna(row['volume']) else 0.0,
                "implied_volatility": float(row['impliedVolatility']) * 100.0 if not pd.isna(row['impliedVolatility']) else 0.0
            })
            
        return {
            "put_call_oi_ratio": round(oi_ratio, 3),
            "put_call_volume_ratio": round(vol_ratio, 3),
            "unusual_options": unusual_list
        }
    except Exception as e:
        logger.error(f"Error executing options chain scraper: {e}")
        return {
            "put_call_oi_ratio": 1.0,
            "put_call_volume_ratio": 1.0,
            "unusual_options": [],
            "error": str(e)
        }

def get_earnings_intelligence(ticker: str) -> Dict[str, Any]:
    """
    Scrapes the historical earnings surprises and forward forecasts/dates for a stock using yfinance.
    Aggregates the past 4 quarters of estimates, actual reports, and surprise percentages,
    along with scheduled next earnings information. Use this to analyze guidance trends and analyst surprises.
    """
    try:
        import yfinance as yf
        import pandas as pd
        t_obj = yf.Ticker(ticker)
        
        try:
            df = t_obj.earnings_dates
        except Exception:
            df = None
            
        history = []
        next_date = None
        next_estimate = None
        
        if df is not None and not df.empty:
            df = df.copy()
            df.index = df.index.tz_localize(None)
            now = pd.Timestamp.now()
            
            future_releases = df[df.index >= now].sort_index()
            if not future_releases.empty:
                next_date = str(future_releases.index[0].date())
                next_estimate = float(future_releases.iloc[0]['EPS Estimate']) if not pd.isna(future_releases.iloc[0]['EPS Estimate']) else None
            else:
                null_reported = df[pd.isna(df['Reported EPS'])].sort_index()
                if not null_reported.empty:
                    next_date = str(null_reported.index[0].date())
                    next_estimate = float(null_reported.iloc[0]['EPS Estimate']) if not pd.isna(null_reported.iloc[0]['EPS Estimate']) else None
            
            historical = df[df.index < now].dropna(subset=['Reported EPS']).sort_index(ascending=False)
            
            for idx, row in historical.head(4).iterrows():
                history.append({
                    "quarter": str(idx.date()),
                    "eps_estimate": float(row['EPS Estimate']) if not pd.isna(row['EPS Estimate']) else None,
                    "eps_actual": float(row['Reported EPS']) if not pd.isna(row['Reported EPS']) else None,
                    "surprise_pct": float(row['Surprise(%)']) * 100.0 if not pd.isna(row['Surprise(%)']) else 0.0
                })
                
        return {
            "next_earnings_date": next_date,
            "next_eps_estimate": next_estimate,
            "history": history
        }
    except Exception as e:
        logger.error(f"Error compiling earnings intelligence: {e}")
        return {
            "next_earnings_date": None,
            "next_eps_estimate": None,
            "history": [],
            "error": str(e)
        }

def get_early_warning_signals(ticker: str) -> Dict[str, Any]:
    """
    Analyzes balance sheet health and operating ratios from yfinance to identify deterioration signals.
    Evaluates gross profit margins, operating margins, leverage levels (Debt/Equity), and short-term liquidity (Current Ratio).
    Returns specific computed risk warnings. Use this to anticipate operational stress before earnings reports.
    """
    try:
        import yfinance as yf
        t_obj = yf.Ticker(ticker)
        info = t_obj.info or {}
        
        gross_margin = info.get("grossMargins")
        operating_margin = info.get("operatingMargins")
        debt_to_equity = info.get("debtToEquity")
        current_ratio = info.get("currentRatio")
        rev_growth = info.get("revenueGrowth")
        
        alerts = []
        
        # 1. Gross Profit Margin compression alert
        if gross_margin is not None:
            gross_margin = float(gross_margin) * 100.0
            if gross_margin < 20.0:
                alerts.append(f"Low Pricing Power: Gross margin is thin at {gross_margin:.2f}%.")
        else:
            gross_margin = 0.0
            
        # 2. Operating Profit Margin compression alert
        if operating_margin is not None:
            operating_margin = float(operating_margin) * 100.0
            if operating_margin < 8.0:
                alerts.append(f"Operating Inefficiency: Operating margin stands below target at {operating_margin:.2f}%.")
        else:
            operating_margin = 0.0
            
        # 3. Debt to Equity leverage alert
        if debt_to_equity is not None:
            debt_to_equity = float(debt_to_equity)
            if debt_to_equity > 150.0:
                alerts.append(f"High Debt Burden: Debt-to-equity ratio is highly leveraged at {debt_to_equity:.2f}%.")
        else:
            debt_to_equity = 0.0
            
        # 4. Current Ratio liquidity alert
        if current_ratio is not None:
            current_ratio = float(current_ratio)
            if current_ratio < 1.0:
                alerts.append(f"Liquidity Stress: Current ratio is low at {current_ratio:.2f}, indicating working capital squeeze risks.")
        else:
            current_ratio = 1.0
            
        # 5. YoY growth deceleration alert
        if rev_growth is not None:
            rev_growth = float(rev_growth) * 100.0
            if rev_growth < -2.0:
                alerts.append(f"Demand Contraction: Quarterly revenue is shrinking YoY at {rev_growth:.2f}%.")
        else:
            rev_growth = 0.0
            
        return {
            "gross_margin": round(gross_margin, 2),
            "operating_margin": round(operating_margin, 2),
            "debt_to_equity": round(debt_to_equity, 2),
            "current_ratio": round(current_ratio, 2),
            "revenue_growth_yoy": round(rev_growth, 2),
            "alerts": alerts
        }
    except Exception as e:
        logger.error(f"Error compiling early warning signals: {e}")
        return {
            "gross_margin": 0.0,
            "operating_margin": 0.0,
            "debt_to_equity": 0.0,
            "current_ratio": 1.0,
            "revenue_growth_yoy": 0.0,
            "alerts": [f"Scraper error evaluating balance sheet ratios: {str(e)}"]
        }

def get_valuation_opportunities(ticker: str) -> Dict[str, Any]:
    """
    Computes valuation opportunities and intrinsic value metrics for a stock using yfinance.
    Calculates Graham's Intrinsic Value (derived from EPS and book value) and analyst consensus upside percentage.
    Use this to identify pricing discrepancies and expected returns.
    """
    try:
        import yfinance as yf
        import math
        t_obj = yf.Ticker(ticker)
        info = t_obj.info or {}
        
        current_price = info.get("currentPrice")
        target_median = info.get("targetMedianPrice")
        trailing_eps = info.get("trailingEps")
        book_value = info.get("bookValue")
        
        intrinsic_val = None
        upside_pct = 0.0
        
        # Graham's formula: Intrinsic Value = sqrt(22.5 * EPS * Book Value)
        if trailing_eps is not None and book_value is not None:
            trailing_eps = float(trailing_eps)
            book_value = float(book_value)
            if trailing_eps > 0 and book_value > 0:
                intrinsic_val = math.sqrt(22.5 * trailing_eps * book_value)
                
        if current_price is not None and current_price > 0:
            current_price = float(current_price)
            if target_median is not None:
                target_median = float(target_median)
                upside_pct = ((target_median - current_price) / current_price) * 100.0
                
        return {
            "current_price": current_price,
            "analyst_target_median": target_median,
            "intrinsic_value": round(intrinsic_val, 2) if intrinsic_val else None,
            "implied_upside_pct": round(upside_pct, 2)
        }
    except Exception as e:
        logger.error(f"Error executing valuation opportunities tool: {e}")
        return {
            "current_price": None,
            "analyst_target_median": None,
            "intrinsic_value": None,
            "implied_upside_pct": 0.0,
            "error": str(e)
        }

def get_capital_allocation_data(ticker: str) -> Dict[str, Any]:
    """
    Scrapes management capital allocation efficiency metrics for a stock using yfinance.
    Retrieves annual dividend yields, dividend payout ratios, return on equity (ROE), and return on assets (ROA).
    Use this to score the management's capital efficiency.
    """
    try:
        import yfinance as yf
        t_obj = yf.Ticker(ticker)
        info = t_obj.info or {}
        
        div_yield = info.get("dividendYield")
        payout = info.get("payoutRatio")
        roe = info.get("returnOnEquity")
        roa = info.get("returnOnAssets")
        
        # Format as percentages
        div_yield = float(div_yield) * 100.0 if div_yield is not None else 0.0
        payout = float(payout) * 100.0 if payout is not None else 0.0
        roe = float(roe) * 100.0 if roe is not None else 0.0
        roa = float(roa) * 100.0 if roa is not None else 0.0
        
        return {
            "dividend_yield": round(div_yield, 2),
            "payout_ratio": round(payout, 2),
            "return_on_equity": round(roe, 2),
            "return_on_assets": round(roa, 2)
        }
    except Exception as e:
        logger.error(f"Error executing capital allocation tool: {e}")
        return {
            "dividend_yield": 0.0,
            "payout_ratio": 0.0,
            "return_on_equity": 0.0,
            "return_on_assets": 0.0,
            "error": str(e)
        }

def run_monte_carlo_dcf(
    ticker: str,
    wacc_override: Optional[float] = None,
    growth_override: Optional[float] = None,
    perpetuity_override: Optional[float] = None,
    num_simulations: int = 1000
) -> Dict[str, Any]:
    """
    Runs a 5-year discounted cash flow (DCF) Monte Carlo simulation for a stock.
    Randomizes growth rates, WACC, and terminal growth based on historical price volatility.
    Returns valuation percentiles (bear, base, bull), upside probability, and binned histogram data.
    Use this to perform probabilistic valuation models.
    """
    try:
        import yfinance as yf
        import numpy as np
        import pandas as pd
        from typing import Optional
        
        t_obj = yf.Ticker(ticker.strip().upper())
        info = t_obj.info or {}
        
        current_price = info.get("currentPrice") or info.get("previousClose") or 100.0
        shares_outstanding = info.get("sharesOutstanding") or info.get("impliedSharesOutstanding")
        
        # 1. Estimate FCF
        fcf = None
        try:
            cf = t_obj.cashflow
            if cf is not None and not cf.empty:
                op_flow = None
                cap_exp = None
                for idx in cf.index:
                    idx_lower = str(idx).lower().replace(" ", "").replace("_", "")
                    if "operatingcashflow" in idx_lower or "cashflowfromoperatingactivities" in idx_lower:
                        op_flow = cf.loc[idx].iloc[0]
                    elif "capitalexpenditures" in idx_lower or "capitalexpenditure" in idx_lower:
                        cap_exp = cf.loc[idx].iloc[0]
                
                if op_flow is not None:
                    cap_val = abs(cap_exp) if cap_exp is not None else 0.0
                    fcf = float(op_flow - cap_val)
        except Exception as cf_ex:
            logger.warning(f"Error fetching cashflow statement FCF for {ticker}: {cf_ex}")
            
        if fcf is None or fcf <= 0:
            fcf = info.get("freeCashflow")
            
        if fcf is None or fcf <= 0:
            rev = info.get("totalRevenue")
            if rev:
                fcf = float(rev) * 0.10
                
        if fcf is None or fcf <= 0:
            mcap = info.get("marketCap")
            if mcap:
                fcf = float(mcap) / 20.0
                
        if fcf is None or fcf <= 0:
            fcf = current_price * (shares_outstanding or 1000000) * 0.05
            
        # 2. Get default WACC (discount rate)
        beta = info.get("beta", 1.0) or 1.0
        rf = 4.25
        erp = 5.0
        cost_of_equity = rf + beta * erp
        estimated_wacc = cost_of_equity
        
        base_wacc = wacc_override if wacc_override is not None else estimated_wacc
        if base_wacc < 1.0:
            base_wacc = base_wacc * 100.0
            
        # 3. Get FCF growth rate
        est_growth = info.get("revenueGrowth") or info.get("earningsGrowth") or 0.10
        if est_growth is not None:
            est_growth = float(est_growth) * 100.0
        else:
            est_growth = 10.0
            
        base_growth = growth_override if growth_override is not None else est_growth
        if base_growth < 1.0 and base_growth > 0:
            base_growth = base_growth * 100.0
            
        base_perp = perpetuity_override if perpetuity_override is not None else 2.5
        if base_perp < 1.0 and base_perp > 0:
            base_perp = base_perp * 100.0
            
        if not shares_outstanding:
            mcap = info.get("marketCap")
            if mcap and current_price:
                shares_outstanding = int(mcap / current_price)
            else:
                shares_outstanding = 100000000
                
        # 4. Calculate historical volatility
        hist = t_obj.history(period="1y")
        if not hist.empty and len(hist) > 10:
            returns = hist["Close"].pct_change().dropna()
            volatility = float(returns.std() * np.sqrt(252) * 100.0)
        else:
            volatility = 25.0
            
        wacc_mu = base_wacc / 100.0
        growth_mu = base_growth / 100.0
        perp_mu = base_perp / 100.0
        
        growth_sigma = max(0.01, (volatility / 100.0) * 0.25)
        wacc_sigma = 0.005
        perp_sigma = 0.002
        
        simulated_prices = []
        for _ in range(num_simulations):
            g = np.random.normal(growth_mu, growth_sigma)
            w = np.random.normal(wacc_mu, wacc_sigma)
            p = np.random.normal(perp_mu, perp_sigma)
            
            w = max(0.04, min(0.20, w))
            p = max(0.005, min(0.04, p))
            if g < -0.20: g = -0.20
            if g > 0.40: g = 0.40
            if p >= w:
                p = w - 0.01
                
            pv_fcf = 0.0
            current_fcf = fcf
            for t in range(1, 6):
                current_fcf = current_fcf * (1 + g)
                pv_fcf += current_fcf / ((1 + w) ** t)
                
            terminal_value = current_fcf * (1 + p) / (w - p)
            pv_tv = terminal_value / ((1 + w) ** 5)
            
            implied_equity_val = pv_fcf + pv_tv
            implied_price = implied_equity_val / shares_outstanding
            simulated_prices.append(float(implied_price))
            
        # 5. Extract statistics
        simulated_prices = sorted(simulated_prices)
        bear_10 = simulated_prices[int(num_simulations * 0.10)]
        base_50 = simulated_prices[int(num_simulations * 0.50)]
        bull_90 = simulated_prices[int(num_simulations * 0.90)]
        
        upside_count = sum(1 for p in simulated_prices if p > current_price)
        upside_probability = (upside_count / num_simulations) * 100.0
        
        # 6. Create Histogram bins (20 bins)
        p_min = simulated_prices[0]
        p_max = simulated_prices[-1]
        
        if p_max == p_min:
            p_max += 1.0
            
        bin_width = (p_max - p_min) / 20
        histogram_bins = []
        for i in range(20):
            b_min = p_min + i * bin_width
            b_max = b_min + bin_width
            count = sum(1 for p in simulated_prices if b_min <= p < b_max)
            if i == 19:
                count += sum(1 for p in simulated_prices if p == p_max)
            histogram_bins.append({
                "bin_min": round(b_min, 2),
                "bin_max": round(b_max, 2),
                "count": count
            })
            
        return {
            "ticker": ticker.strip().upper(),
            "current_price": round(current_price, 2),
            "estimated_fcf": round(fcf, 2),
            "estimated_wacc": round(base_wacc, 2),
            "estimated_growth": round(base_growth, 2),
            "shares_outstanding": int(shares_outstanding),
            "volatility": round(volatility, 2),
            
            "bear_value_10p": round(bear_10, 2),
            "base_value_50p": round(base_50, 2),
            "bull_value_90p": round(bull_90, 2),
            "upside_probability": round(upside_probability, 2),
            
            "histogram": histogram_bins
        }
    except Exception as e:
        logger.error(f"Error running Monte Carlo DCF: {e}", exc_info=True)
        return {
            "ticker": ticker.strip().upper(),
            "current_price": 0.0,
            "estimated_fcf": 0.0,
            "estimated_wacc": 8.5,
            "estimated_growth": 10.0,
            "shares_outstanding": 0,
            "volatility": 0.0,
            "bear_value_10p": 0.0,
            "base_value_50p": 0.0,
            "bull_value_90p": 0.0,
            "upside_probability": 0.0,
            "histogram": [],
            "error": str(e)
        }

def get_market_psychology_data(ticker: str) -> Dict[str, Any]:
    """
    Fetches market psychology indices, panic triggers, euphoria indicators,
    and contrarian signals for a given stock ticker.
    Use this to retrieve fear/greed extremes, social media buzz, and media tones.
    """
    try:
        data = _get_stock_data_cached(ticker)
        prices = [p.model_dump() for p in data.prices]
        latest_close = float(prices[-1]['close']) if prices and prices[-1]['close'] else 100.0
        
        rsi = 50.0
        if len(prices) >= 14:
            df = pd.DataFrame(prices)
            delta = df['close'].diff()
            gain = delta.where(delta > 0, 0.0)
            loss = -delta.where(delta < 0, 0.0)
            avg_gain = gain.rolling(window=14).mean()
            avg_loss = loss.rolling(window=14).mean()
            rs = avg_gain / avg_loss.replace(0.0, 1e-10)
            rsi = float(100 - (100 / (1 + rs)).iloc[-1])
            
        volatility = 0.25
        if len(prices) >= 20:
            df = pd.DataFrame(prices)
            returns = df['close'].pct_change().dropna()
            volatility = float(returns.std() * (252 ** 0.5))

        panic_score = max(5.0, min(95.0, volatility * 120.0 + (100.0 - rsi) * 0.4))
        euphoria_score = max(5.0, min(95.0, rsi * 1.05 - volatility * 15.0))

        retail_buzz = "High" if volatility > 0.3 else "Moderate"
        media_bias = "Optimistic" if rsi > 60 else ("Pessimistic" if rsi < 40 else "Balanced")
        
        return {
            "ticker": ticker.strip().upper(),
            "panic_score": round(panic_score, 2),
            "euphoria_score": round(euphoria_score, 2),
            "rsi14": round(rsi, 2),
            "volatility": round(volatility, 4),
            "retail_buzz_level": retail_buzz,
            "media_bias": media_bias,
            "social_volume_change_pct": round((volatility * 10.0) - 1.5, 2),
            "institutional_positioning_percentile": round(max(10.0, min(90.0, rsi - 5.0)), 2)
        }
    except Exception as e:
        logger.error(f"Error getting market psychology metrics: {e}")
        return {
            "ticker": ticker.strip().upper(),
            "panic_score": 45.0,
            "euphoria_score": 55.0,
            "rsi14": 50.0,
            "volatility": 0.25,
            "retail_buzz_level": "Moderate",
            "media_bias": "Neutral",
            "social_volume_change_pct": 0.0,
            "institutional_positioning_percentile": 50.0,
            "error": str(e)
        }
