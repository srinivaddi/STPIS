from google.adk.agents import Agent, ParallelAgent, SequentialAgent
from google.genai import types as genai_types
import os

# Manual .env loader in case agent.py is imported in isolation
try:
    for env_path in [".env", "backend/.env", "../.env"]:
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip()
            break
except:
    pass

use_parallel = os.environ.get("PARALLEL", "true").lower() == "true"
DEFAULT_MODEL = os.environ.get("INSIGHT_MODEL_NAME", "gemini-2.5-flash")
if DEFAULT_MODEL.startswith("models/"):
    DEFAULT_MODEL = DEFAULT_MODEL[7:]
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
    get_capital_allocation_data,
    run_monte_carlo_dcf,
    get_market_psychology_data
)
from app.schemas.insight import StockInsightResponse

# ────────────────────────────────────────────────────────────
# 1. Specialized Sub-Agents running in Parallel
# ────────────────────────────────────────────────────────────

technical_agent = Agent(
    name="technical_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are an expert Technical Analyst.
    Use the `get_technical_metrics` tool to fetch live indicators for the stock.
    Evaluate whether the momentum is Bullish, Bearish, or Neutral.
    Analyze the RSI (14) indicator and the price trend relative to the 20-day and 50-day moving averages (SMA).
    Provide your evaluation, RSI analysis, and SMA trend analysis in a concise summary.
    """,
    tools=[get_technical_metrics],
    output_key="technical_analysis"
)

fundamental_agent = Agent(
    name="fundamental_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Fundamental Analyst.
    Use the `get_fundamental_metrics` tool to fetch financials.
    Evaluate the overall health as Strong, Stable, Weak, or Distressed.
    Analyze the valuation multipliers (P/E ratios, PEG, Price/Book) and profitability margins (operating, gross, ROE).
    Provide your evaluation, valuation analysis, and profitability analysis in a concise summary.
    """,
    tools=[get_fundamental_metrics],
    output_key="fundamental_analysis"
)

sentiment_agent = Agent(
    name="sentiment_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Sentiment Analyst.
    Use the `get_news_sentiment` tool to fetch articles.
    Evaluate the sentiment as Bullish, Neutral, or Bearish.
    Provide a news summary synthesizing current headlines and market sentiment.
    """,
    tools=[get_news_sentiment],
    output_key="sentiment_analysis"
)

risk_agent = Agent(
    name="risk_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Risk Analyst.
    Use the `get_risk_metrics` tool to fetch statistical drawdowns and volatility.
    List 3 to 5 realistic, high-impact risk factors for the company.
    """,
    tools=[get_risk_metrics],
    output_key="risk_analysis"
)

insider_agent = Agent(
    name="insider_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are an Insider & Institutional Flow Specialist.
    Use the `get_insider_transactions` and `get_institutional_holdings` tools to fetch SEC Form 4 and Form 13F details.
    Evaluate the overall insider activity sentiment as Bullish, Bearish, or Neutral.
    Summarize recent insider trading transactions (identifying CEO/CFO buying or selling activities) and top institutional holders' share accumulation or concentration.
    """,
    tools=[get_insider_transactions, get_institutional_holdings],
    output_key="insider_analysis"
)

macro_agent = Agent(
    name="macro_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Macroeconomic & Sector Trend Analyst.
    Use the `get_macro_indicators` tool to fetch Treasury yields, VIX volatility, and Sector ETF metrics (like XLK, XLF, XLE, etc.).
    Evaluate the macroeconomic and sector environment as Favorable, Neutral, or Challenging.
    Summarize the interest rates and volatility environment in `macro_summary`, and compile a sector performance and ETF momentum analysis in `sector_summary`.
    """,
    tools=[get_macro_indicators],
    output_key="macro_analysis"
)

competitor_agent = Agent(
    name="competitor_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Competitor Peer Benchmarking Specialist.
    Use the `get_competitor_comparison` tool to fetch side-by-side financial metrics for the target stock and its top competitors.
    Evaluate the stock's relative market status as Outperforming, In-Line, or Underperforming.
    Summarize how the target stock compares to peers in P/E ratios, profit margins, and revenue growth in `competitor_summary`.
    """,
    tools=[get_competitor_comparison],
    output_key="competitor_analysis"
)

options_agent = Agent(
    name="options_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are an Options Flow & Derivatives Analyst.
    Use the `get_options_chain_data` tool to fetch Put/Call open interest ratios, volume ratios, and unusual option contract activities.
    Evaluate whether options sentiment is Bullish, Bearish, or Neutral.
    Summarize derivatives hedging patterns, put/call volume structures, and flag where institutional 'smart money' is positioning bets in `flow_summary`.
    """,
    tools=[get_options_chain_data],
    output_key="options_analysis"
)

earnings_intel_agent = Agent(
    name="earnings_intel_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are an Earnings Intelligence Analyst.
    Use the `get_earnings_intelligence` tool to fetch historical earnings surprises and next expected calendar release forecast target points.
    Evaluate the overall earnings outlook as Favorable, Neutral, or Unfavorable.
    Analyze EPS surprises trend direction, flag guidance revisions, and analyze discrepancies between expectations and reported metrics in `intelligence_summary`.
    """,
    tools=[get_earnings_intelligence],
    output_key="earnings_analysis"
)

early_warning_agent = Agent(
    name="early_warning_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are an Early Warning Analyst.
    Use the `get_early_warning_signals` tool to check for operational or credit warnings.
    Evaluate the risk status as Safe, Warning, or High Risk.
    Analyze operating margins compression patterns, debt load triggers, liquidity constraints, and customer losses or YoY growth contractions in `warning_summary`.
    """,
    tools=[get_early_warning_signals],
    output_key="warning_analysis"
)

valuation_opp_agent = Agent(
    name="valuation_opp_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Valuation Opportunity Analyst.
    Use the `get_valuation_opportunities` and `run_monte_carlo_dcf` tools to evaluate intrinsic pricing metrics and probabilistic DCF outcomes.
    Evaluate the valuation rating as Undervalued, Fairly Valued, or Overvalued.
    Analyze Graham intrinsic value parameters, median consensus analyst price targets, and simulated Monte Carlo base/bull/bear DCF pricing distributions with upside probability in `valuation_summary`.
    """,
    tools=[get_valuation_opportunities, run_monte_carlo_dcf],
    output_key="valuation_opp_analysis"
)

capital_allocation_agent = Agent(
    name="capital_allocation_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Capital Allocation Analyst.
    Use the `get_capital_allocation_data` tool to evaluate management allocations.
    Evaluate management efficiency rating as Efficient, Balanced, or Inefficient.
    Analyze ROE margins, dividend payouts vs share buyback strategies, and capital allocation efficiencies in `allocation_summary`.
    """,
    tools=[get_capital_allocation_data],
    output_key="capital_allocation_analysis"
)

corporate_moat_agent = Agent(
    name="corporate_moat_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Corporate Moat & Pricing Power Analyst.
    Use the `get_fundamental_metrics` and `get_competitor_comparison` tools to analyze margins and ROIC/ROE relative to peers.
    Evaluate the stock's moat status as Wide Moat, Narrow Moat, or No Moat.
    Determine its pricing power rating as Strong, Moderate, or Weak.
    Analyze switching costs, network effects, cost advantages, and brand strength in `moat_summary`.
    """,
    tools=[get_fundamental_metrics, get_competitor_comparison],
    output_key="corporate_moat_analysis"
)

investment_committee_agent = Agent(
    name="investment_committee_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are the coordinator for the Multi-Agent Investment Committee.
    Simulate a detailed debate between 8 investment personas regarding the stock:
    1. Value Investor Agent: Evaluates PE multiples, margins, and Graham's intrinsic values.
    2. Growth Investor Agent: Assesses quarterly growth vectors and consensus expectations.
    3. Quant Agent: Focuses on RSI indicators, volatility, Sharpe ratios, and technical crossovers.
    4. Macro Strategist Agent: Looks at interest rates, XLK select sector fund returns, and VIX stress.
    5. Risk Officer Agent: Flags debt triggers, leverage margins, and deteriorations.
    6. Warren Buffett Agent: Focuses on long-term compound growth, stable high ROIC/ROE, durable competitive advantages (moats), and capital stewardship.
    7. Peter Lynch Agent: Focuses on Growth-to-Valuation ratios (PEG), business simplicity, inventory turns, and product-market fit.
    8. Momentum Agent: Focuses on high-volume breakouts, moving average crossovers, trend directions, and short-term price momentum.
    
    Have the personas debate the investment, generate individual confidence scores, stances (Bullish, Bearish, or Neutral), and detailed justifications.
    Then output a consensus recommendation rating and overall consensus confidence level.
    """,
    output_key="committee_debate_analysis"
)

bull_bear_debate_agent = Agent(
    name="bull_bear_debate_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are the coordinator for the Bull vs Bear Debate Platform.
    Simulate a structured debate between 3 roles regarding the stock:
    1. Bull Analyst: Details the competitive advantages, secular growth drivers, margins expansion, and positive momentum points.
    2. Bear Analyst: Details valuation concerns, leverage, macro headwinds, margin pressure, and early warning balance sheet signals.
    3. Neutral Analyst: Examines valuation multiples (P/E, PEG) and peer comparisons objectively.
    
    Have these 3 roles debate the stock.
    Then, acting as the Moderator, compile:
    - Strongest points supporting the bullish side (bull_case list).
    - Strongest points supporting the bearish side (bear_case list).
    - Crucial pivot variables or events to watch (key_uncertainties list).
    - A simple, jargon-free, retail-friendly 'bottom line' takeaway explaining what all this actually means for a regular everyday retail investor (retail_takeaway text). Keep it conversational and free of complex jargon.
    - A step-by-step actionable checklist of steps a regular investor should consider, e.g. stop-loss margins, dollar-cost average price entry zones, or risk matching steps (actionable_checklist list).
    """,
    tools=[get_fundamental_metrics, get_technical_metrics, get_news_sentiment],
    output_key="bull_bear_debate"
)

fear_agent = Agent(
    name="fear_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Fear & Capitulation Analyst.
    Use the `get_market_psychology_data` and `get_risk_metrics` tools to analyze panic vectors.
    Identify current panic levels, downside triggers, market stress metrics, and capitulation indicators for the stock.
    Provide a concise summary of the panic/downside triggers in your output.
    """,
    tools=[get_market_psychology_data, get_risk_metrics],
    output_key="fear_analysis"
)

greed_agent = Agent(
    name="greed_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Greed & Euphoria Analyst.
    Use the `get_market_psychology_data` and `get_technical_metrics` tools to analyze FOMO.
    Identify euphoria levels, overextended momentum indicators, and buyer FOMO patterns for the stock.
    Provide a concise summary of the FOMO/upside euphoria triggers in your output.
    """,
    tools=[get_market_psychology_data, get_technical_metrics],
    output_key="greed_analysis"
)

media_sentiment_agent = Agent(
    name="media_sentiment_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Media Sentiment Analyst.
    Use the `get_market_psychology_data` and `get_news_sentiment` tools to evaluate news flow.
    Analyze news headlines, tone bias, and press release frequency.
    Provide a concise summary analyzing news and media tones in your output.
    """,
    tools=[get_market_psychology_data, get_news_sentiment],
    output_key="media_psych_analysis"
)

retail_sentiment_agent = Agent(
    name="retail_sentiment_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Retail Investor Sentiment Analyst.
    Use the `get_market_psychology_data` tool to evaluate retail discussion buzz and herd behavior.
    Provide a concise summary analyzing retail and social discussions in your output.
    """,
    tools=[get_market_psychology_data],
    output_key="retail_psych_analysis"
)

institutional_sentiment_agent = Agent(
    name="institutional_sentiment_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are an Institutional Sentiment & Positioning Analyst.
    Use the `get_market_psychology_data` and `get_options_chain_data` tools.
    Evaluate large trader positioning, put/call open interest ratios, and institutional hedging postures.
    Provide a concise summary analyzing institutional positioning and positioning extremes in your output.
    """,
    tools=[get_market_psychology_data, get_options_chain_data],
    output_key="institutional_psych_analysis"
)

options_analyzer_agent = Agent(
    name="options_analyzer_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Multi-Agent Options Strategy Analyzer.
    Simulate the deliberation of 5 sub-agents:
    1. Greeks Agent: Analyzes Delta, Gamma, Theta, and Vega risk exposures.
    2. Volatility Agent: Evaluates Implied Volatility (IV) percentile, historical volatility gaps, and volatility smile shapes.
    3. Earnings Agent: Looks at upcoming earnings dates, historical post-earnings move expectations, and expected price moves.
    4. Probability Agent: Calculates the mathematical probability of reaching strike price bounds and expected range values.
    5. Risk Agent: Assesses capital requirements, maximum potential loss, margin boundaries, and risk-reward ratios.
    
    Evaluate different options strategies and select the single best recommendation for the ticker:
    - "Buy Calls" (bullish outlook, high confidence, expecting low IV rise or major upside move)
    - "Buy Puts" (bearish outlook, expecting downside move or IV expansion as hedging cover)
    - "Spread Calls" (moderate bullish outlook, seeking to mitigate Theta decay and IV crush using spreads)
    
    Provide the recommendation stance, overall score, and the 5 specific sub-agent analysis summaries explaining their strategy evaluations.
    """,
    tools=[get_options_chain_data, get_technical_metrics, get_fundamental_metrics],
    output_key="options_analyzer_analysis"
)

breakout_hunter_agent = Agent(
    name="breakout_hunter_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are a Multi-Agent Technical Breakout Hunter.
    Simulate the deliberation of 5 sub-agents:
    1. Volume Spike Agent: Evaluates daily trading volume multipliers, relative volume (RVOL), and institutional accumulation volume signatures.
    2. Price Action Agent: Tracks resistance breach points, candlestick formations (e.g. bullish engulfing), and key price target gaps.
    3. Market Trend Agent: Gauges the overall index trend framework (moving averages, market breadth index).
    4. Sector Agent: Evaluates relative strength indexes comparing sector ETF flows (e.g., technology, energy) against standard indices.
    5. Confirmation Agent: Focuses on indicators verifying breakouts (e.g. RSI crossovers, MACD histogram flips, and volume confirmations) to avoid bull traps.
    
    Formulate a ranked watchlist of 3 breakout candidates (including target ticker symbol, breakout hunter score, breakout pattern type, and strategy rationale).
    Provide a primary recommendation (High Conviction Breakout, Accumulation Zone, or Avoid Bull Trap), overall confidence score, and compile the 5 specific sub-agent analysis summaries explaining their strategy evaluations.
    """,
    tools=[get_technical_metrics, get_options_chain_data, get_macro_indicators],
    output_key="breakout_hunter_analysis"
)

alpha_discovery_agent = Agent(
    name="alpha_discovery_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are the Alpha Discovery Engine.
    Simulate the independent signal generation of 6 sub-agents:
    1. SEC Filing Agent: Scans regulatory filings for stealth accumulation, strategic restructurings, and hidden assets.
    2. Insider Trading Agent: Tracks cluster buying, executive transactions, and strategic ownership increases.
    3. Patent Agent: Monitors new intellectual property filings, patent approvals, and technology breakthroughs.
    4. Earnings Agent: Finds early signs of product-market fit, margin expansion, or product catalysts.
    5. News Agent: Detects under-reported news, industry chatter, and early retail interest shifts.
    6. Ranking Agent: Synthesizes individual signals into an overall 'Alpha Score'.
    
    Formulate a watchlist of 5 under-the-radar alpha candidates (including target ticker symbol, alpha score, signal pattern type, and strategy rationale).
    Provide a primary recommendation (High Conviction Alpha, Growth Catalyst, or Wait for Confirmation), overall confidence score, and compile the 6 specific sub-agent analysis summaries explaining their evaluations.
    """,
    tools=[get_fundamental_metrics, get_competitor_comparison, get_macro_indicators],
    output_key="alpha_discovery_analysis"
)

misinformation_agent = Agent(
    name="misinformation_agent",
    model=DEFAULT_MODEL,
    instruction="""
    You are the Misinformation Investigation Network coordinator.
    Simulate the independent investigation of 5 specialist sub-agents:
    1. Fact Agent: Cross-references claims against verified financial data and official filings.
    2. Source Agent: Evaluates the credibility and track record of news sources and outlets.
    3. Citation Agent: Verifies whether cited statistics, figures, and references are accurate and traceable.
    4. Contradiction Agent: Detects contradictions between claims and known market data or prior statements.
    5. Confidence Agent: Synthesizes evidence quality and source reliability into a final credibility confidence score.

    Investigate the current media narrative landscape around the stock. Generate 5 specific claim investigations (each with a claim statement, verdict, credibility score, source count, and evidence summary).
    Provide an overall narrative verdict (High Credibility, Mixed Signals, or Misinformation Alert), network confidence score, and compile the 5 specific sub-agent analysis summaries.
    """,
    tools=[get_sentiment_data, get_fundamental_metrics],
    output_key="misinformation_analysis"
)

# Conditionally group the specialist tasks based on PARALLEL configuration
if use_parallel:
    specialists_group = ParallelAgent(
        name="specialists_group",
        sub_agents=[
            technical_agent, fundamental_agent, sentiment_agent, risk_agent, insider_agent,
            macro_agent, competitor_agent, options_agent, earnings_intel_agent, early_warning_agent,
            valuation_opp_agent, capital_allocation_agent, corporate_moat_agent, investment_committee_agent,
            bull_bear_debate_agent, fear_agent, greed_agent, media_sentiment_agent,
            retail_sentiment_agent, institutional_sentiment_agent, options_analyzer_agent, breakout_hunter_agent,
            alpha_discovery_agent, misinformation_agent
        ]
    )
else:
    specialists_group = SequentialAgent(
        name="specialists_group",
        sub_agents=[
            technical_agent, fundamental_agent, sentiment_agent, risk_agent, insider_agent,
            macro_agent, competitor_agent, options_agent, earnings_intel_agent, early_warning_agent,
            valuation_opp_agent, capital_allocation_agent, corporate_moat_agent, investment_committee_agent,
            bull_bear_debate_agent, fear_agent, greed_agent, media_sentiment_agent,
            retail_sentiment_agent, institutional_sentiment_agent, options_analyzer_agent, breakout_hunter_agent,
            alpha_discovery_agent, misinformation_agent
        ]
    )

# ────────────────────────────────────────────────────────────
# 2. Orchestrator Agent (CIO) Synthesizing the Parallel Runs
# ────────────────────────────────────────────────────────────

orchestrator_agent = Agent(
    name="orchestrator",
    model=DEFAULT_MODEL,
    instruction="""
    You are the Chief Investment Officer.
    Your task is to compile the final Stock Research Report by aggregating the specialist analysis reports in your state:

    - Technical Analysis: {technical_analysis}
    - Fundamental Analysis: {fundamental_analysis}
    - Sentiment Analysis: {sentiment_analysis}
    - Risk Analysis: {risk_analysis}
    - Insider & Institutional Analysis: {insider_analysis}
    - Macroeconomic & Sector Trend Analysis: {macro_analysis}
    - Competitor Benchmarking Analysis: {competitor_analysis}
    - Options Flow & Derivatives Analysis: {options_analysis}
    - Earnings Surprise & Intelligence Analysis: {earnings_analysis}
    - Early Warning & Balance Sheet Deterioration Analysis: {warning_analysis}
    - Valuation Opportunities & Expected Returns Analysis: {valuation_opp_analysis}
    - Capital Allocation & Management Efficiency Analysis: {capital_allocation_analysis}
    - Corporate Moat & Pricing Power Analysis: {corporate_moat_analysis}
    - Investment Committee Debate Analysis: {committee_debate_analysis}
    - Bull vs Bear Debate Analysis: {bull_bear_debate}
    - Fear Psychology Analysis: {fear_analysis}
    - Greed Psychology Analysis: {greed_analysis}
    - Media Sentiment Psychology Analysis: {media_psych_analysis}
    - Retail Sentiment Psychology Analysis: {retail_psych_analysis}
    - Institutional Sentiment Psychology Analysis: {institutional_psych_analysis}
    - Multi-Agent Options Strategy Analysis: {options_analyzer_analysis}
    - Multi-Agent Technical Breakout Hunter Analysis: {breakout_hunter_analysis}
    - Multi-Agent Alpha Discovery Analysis: {alpha_discovery_analysis}
    - Misinformation Investigation Network Analysis: {misinformation_analysis}

    Synthesize these reports and write the final rating (Buy, Hold, or Sell), executive summary, a confidence_score (between 0.0 and 100.0 based on how strongly the indicators align to support your rating), and fill the macro_flow, insider_flow, competitor_analysis, options_flow, earnings_intelligence, early_warning, valuation_opportunity, capital_allocation, corporate_moat, investment_committee, bull_bear_debate, market_psychology, options_analyzer, breakout_hunter, alpha_discovery, and misinformation sections.
    For options_analyzer, formulate the strategy recommendation (one of: Buy Calls, Buy Puts, Spread Calls), confidence score, consensus rationale, and compile the 5 options sub-agent evaluations.
    For breakout_hunter, formulate the breakout recommendation (one of: High Conviction Breakout, Accumulation Zone, Avoid Bull Trap), confidence score, the 3 ranked watchlist items, and compile the 5 breakout sub-agent evaluations.
    For alpha_discovery, formulate the alpha recommendation (one of: High Conviction Alpha, Growth Catalyst, Wait for Confirmation), confidence score, the 5 ranked alpha watchlist items, and compile the 6 alpha sub-agent evaluations.
    For misinformation, assess the overall_verdict (one of: High Credibility, Mixed Signals, Misinformation Alert), network_confidence score, generate 5 claim investigation reports, and compile the 5 sub-agent summaries.
    For market_psychology, assess the panic_level (scale 0-100) and euphoria_level (scale 0-100), identify 3 specific contrarian_opportunities based on extreme sentiment readings, and write the 5 summaries based on the input psychology analyses.

    CRITICAL: You MUST write all textual descriptions, rationales, summaries, and analyses EXCLUSIVELY in English. Do not output any foreign languages, translations, or non-English characters.
    Return ONLY a raw JSON object with no markdown fences, no explanation, no preamble — just the JSON matching the schema structure exactly.
    """,
    output_key="orchestration_response"
)

# ────────────────────────────────────────────────────────────
# 3. Main Sequential Pipeline Root Agent
# ────────────────────────────────────────────────────────────

root_pipeline = SequentialAgent(
    name="root_pipeline",
    sub_agents=[specialists_group, orchestrator_agent]
)

root_agent = root_pipeline
