Feature: Stock Trend Prediction and Insight System (STPIS) Specification
  As an Engineer or AI Coding Agent
  I want to specify the behavior, user interface views, data models, and business logic for all 16 analytical dashboard tabs in STPIS
  So that the entire system can be recreated, tested, and verified programmatically.

  Background: Core Tech Stack and Decoupled Architecture
    Given a FastAPI backend application written in Python 3.12
    And a Next.js frontend web application written in TypeScript and React 19
    And a local virtual environment located at "backend/venv"
    And a project-level automation and startup script named "run.py"

  # =========================================================================
  # SYSTEM SYSTEM RUNTIME & SETUP
  # =========================================================================

  Scenario: Setting up and launching the full-stack system concurrently
    Given the backend dependencies are specified in "backend/requirements.txt"
    And the frontend dependencies are specified in "frontend/package.json"
    When I run the startup command "python run.py" from the project root directory
    Then the script should configure "PYTHONPATH=backend" as an environment variable
    And the script should launch "uvicorn app.main:app --reload --port 8000" in the background
    And the script should launch "npm run dev" inside the "frontend" directory in the background
    And the script should open the default web browser and navigate to "http://localhost:3000"
    And pressing "Ctrl+C" should gracefully terminate both frontend and backend processes

  Scenario Outline: Ingesting market data and calculating technical indicators
    Given a request is made to the backend endpoint "GET /api/stock/<ticker>"
    When the backend fetches historical daily closing prices for "<ticker>" from yfinance
    Then it must calculate the 20-day Simple Moving Average (SMA20) for the last trading day
    And it must calculate the 50-day Simple Moving Average (SMA50) for the last trading day
    And it must calculate the 14-day Relative Strength Index (RSI14) using Wilder's smoothing logic:
      """
      RSI = 100 - (100 / (1 + RS))
      where RS = Average Gain / Average Loss over the 14-day window
      """
    And it must calculate the MACD histogram value as:
      """
      MACD_Line = EMA_12(Close) - EMA_26(Close)
      Signal_Line = EMA_9(MACD_Line)
      MACD_Histogram = MACD_Line - Signal_Line
      """
    And it must return a validated JSON payload matching the Pydantic schema
    Examples:
      | ticker |
      | TSLA   |
      | AAPL   |
      | NVDA   |

  # =========================================================================
  # ENVIRONMENT CONFIGURATION & BACKEND USE CASES
  # =========================================================================

  Scenario Outline: Configuring environment parameters from env_sample template
    Given a template configuration file exists at "backend/.env_sample"
    When the developer copies ".env_sample" to create a new "backend/.env" configuration file
    And configures the keys:
      | Key               | Configured Value   |
      | LLM_PROVIDER      | <provider>         |
      | GEMINI_API_KEY    | <gemini_key>       |
      | HF_TOKEN          | <hf_token>         |
      | OLLAMA_MODEL      | <ollama_model>     |
    Then the "StockInsightAgent" constructor must load these variables into memory
    And route request triggers to the active client interface for "<provider>"
    But if no api credentials are found in the environment
    Then the agent must fallback to generating dynamic mock insights to allow local offline execution
    Examples:
      | provider    | gemini_key | hf_token | ollama_model        |
      | GOOGLE      | AQ_GEMINI  | None     | None                |
      | HUGGINGFACE | None       | hf_token | None                |
      | LOCAL       | None       | None     | mistral-nemo:latest |

  Scenario: Backend Use Case 1 - Financial Ingestion Caching (cache.py)
    Given a request is made to the FastAPI server for ticker details "AAPL"
    When the cache manager checks the local memory cache database
    Then if the ticker data is present in cache and has not expired (TTL < 30 minutes)
      And the server must return the cached JSON payload immediately without invoking yfinance APIs
    But if the ticker data is missing or expired (TTL >= 30 minutes)
      Then the server must query yfinance, process new metrics, save them to the cache, and return the fresh JSON payload

  Scenario: Backend Use Case 2 - Historical Trading Rule Simulations (backtester.py)
    Given the backend receives a backtest request for "TSLA" containing SMA period, RSI triggers, and stop-loss %
    When the backtester pulls 1 year of historical price charts
    And simulates buy orders when the price crosses above the SMA and RSI is below the entry threshold
    And simulates sell orders when the price crosses below the SMA, RSI exceeds the exit threshold, or stop-loss trigger is met
    Then it must return a validated JSON payload containing:
      * Win Rate percentage: (winning trades count / total trades count) * 100
      * Sharpe Ratio: ratio of mean excess return to return volatility
      * Max Drawdown percentage: the peak-to-trough drop in simulated capital
      * Equity Curve array: list of values comparing strategy portfolio value vs standard buy-and-hold value over time

  Scenario: Backend Use Case 3 - AI Model Orchestration (insight_service.py)
    Given a request to compile an investment thesis for "NVDA"
    And the stock metrics and technical indicators are fully computed
    When the active provider is configured to "GOOGLE"
      Then the client must initialize "google.genai.Client" and call "client.models.generate_content" with "response_mime_type=application/json"
    When the active provider is configured to "HUGGINGFACE"
      Then the client must initialize "huggingface_hub.InferenceClient" and call "client.chat_completion" with "response_format={'type': 'json_object'}"
    When the active provider is configured to "LOCAL"
      Then the client must dispatch a POST request to the local Ollama service "http://localhost:11434/api/generate"
    Then the returned response from either service must be parsed, schema-verified, and returned as a "StockInsightResponse" object

  # =========================================================================
  # INITIAL LANDING PAGE & ALERTS BANNERS
  # =========================================================================

  Scenario: Loading the initial landing page before stock search
    Given the user navigates to the application URL "http://localhost:3000"
    And no search query has been executed yet
    Then the interface must display a welcome container titled "Search Ticker to Analyze"
    And it must render a search bar with placeholder "Search ticker (e.g. AAPL, NVDA)..."
    And it must present a helper paragraph instruction:
      """
      Enter a US stock ticker (e.g., AAPL, TSLA, NVDA) in the search bar above to trigger the multi-agent Investment Committee deliberation and quantitative safety overrides.
      """
    And it must show quick-search buttons for popular tickers: "AAPL", "TSLA", "NVDA", "MSFT", "AMZN"
    When the user clicks on any quick-search button or submits a ticker in the search bar
    Then the interface must display a loading spinner indicating details are loading from the backend

  Scenario: Command Center Left Sidebar Navigation Layout
    Given the dashboard analysis has loaded successfully
    Then the interface must display a sticky left sidebar panel titled "Command Center"
    And it must organize the 24 tabs into 4 distinct high-level categories with icons:
      | Category                   | Icon name       | Sub-Tabs Included                                                                                                                     |
      | Executive View             | LayoutDashboard | Overview, Risk, Early Warnings                                                                                                        |
      | AI & Debate Intelligence    | BrainCircuit    | Investment Committee, Bull vs Bears Debate, Sentiment, Market Psychology Engine, Misinformation Network, Multi-Agent Stock Screener, Multi-Agent Options Analyzer, Breakout Hunter, Alpha Discovery Engine |
      | Financials & Valuation     | Coins           | Fundamentals, Earnings Intel, Capital Allocations, Valuation Intel, Corporate Moat & Pricing Power Analysis, Scenario & DCF           |
      | Market Flows & Momentum    | BarChart4       | Technical, Strategy Backtester, Insider & Institutional, Macro & Sector, Options Flow, Competitor Comparison                          |
    When the user clicks on any sub-tab link in the sidebar
    Then the sub-tab must become active and display the corresponding workspace page
    And the clicked tab must render in highlighted style (emerald background tint with a green left-side vertical border)
    And all other tabs must revert to standard inactive text styling (slate-400 color)

  Scenario: Rendering warning alerts, data feed alerts, and disclaimer banners
    Given the user has opened the application
    Then a compact alert banner must render at the very top of the page
    And it must display a "Data Feed Alert" warning the user:
      """
      Free tier financial data delayed by 15m.
      """
    And it must display a brief "Disclaimer" informing:
      """
      Educational research tool. Not financial advice.
      """
    And it must present a button labeled "View Full Disclaimer & Advisor Advisory"
    When the user clicks the disclaimer toggle button
    Then a detailed disclaimer paragraph must expand, showing:
      """
      This platform is an educational AI research tool and does not constitute professional investment, tax, or legal advice. Whether a security fits your portfolio depends entirely on your personal investment goals, time horizon, and risk tolerance. Please consult a certified financial advisor before executing any market transactions.
      """

  Scenario: Rendering the AI Investment Thesis section
    Given a search has succeeded and stock data has loaded
    Then the top of the workspace must render the "Executive Investment Thesis" block
    And it must show an indicator of the active AI model name (e.g. "Local Ollama (mistral-nemo:latest)")
    And it must show a "Confidence Score" percentage badge (e.g., "Confidence: 85.0%")
    And it must show a consensus rating badge (e.g., "BUY", "HOLD", or "SELL")
    And it must output the qualitative summary paragraph generated by the AI
    And it must display a metadata footer containing:
      * The underlying AI model name
      * The analysis timestamp
      * An AI response timer showing latency in seconds (e.g., "⏱ 1.4s response")

  # =========================================================================
  # DASHBOARD TABS AND FUNCTIONS SPECIFICATION
  # =========================================================================

  Scenario: Tab 1 - Overview Tab Functionality
    Given the user has loaded the dashboard for a specific ticker (e.g., "NVDA")
    And the "Overview" tab is selected by default
    Then the page must render the "Executive Investment Thesis" section
    And it must display a latency timer badge indicating backend processing duration (e.g. "Response Time: 1,420 ms")
    And it must show the "Committee Consensus Recommendation" badge (Buy, Sell, or Hold)
    And it must show the "System Confidence Score" percentage
    And it must render the "Core Moat Rating" and "Quantitative Safety Score" side-by-side
    And the consensus badge must automatically sync with the voting output from the multi-agent committee
    But if the stock P/E multiple is greater than 45, the rating must be overridden to "Hold" or "Sell" as a safety fallback

  # =========================================================================
  # DASHBOARD TABS AND FUNCTIONS SPECIFICATION (DETAILED DISPLAYS & CONTROLS)
  # =========================================================================

  Scenario: Tab 1 - Overview Tab Functionality
    Given the user has loaded the dashboard for a specific ticker (e.g., "NVDA")
    And the "Overview" tab is selected
    Then the interface must display:
      * An Executive Investment Thesis block with qualitative text.
      * A composite performance table showing scores for Technicals, Fundamentals, Sentiment, and Options.
      * High-level metadata (Model Name, Generation Timestamp, and Latency Timer).
    And the controls on this tab are:
      * The Consensus Rating Badge: Clickable, triggers the "Consensus Voting System Breakdown" drawer.
      * The Sidebar navigation: Links to other tabs.
      * The Mobile Dropdown Select: Used to navigate tabs on smaller viewports.

  Scenario: Tab 2 - Technical Tab Functionality
    Given the user selects the "Technical" tab
    Then the interface must display:
      * Color-coded progress bars for RSI (14), SMA20 Deviation, SMA50 Deviation, MACD, Trend, and Momentum.
      * Absolute numeric cards showing SMA20 Value, SMA50 Value, and MACD Histogram (Raw).
      * A 30-day historical stock price line chart showing Close (white line), SMA20 (green line), and SMA50 (blue line) with Golden/Death Cross indicator dots.
      * An RSI indicator line chart with dotted reference lines at 70 and 30.
      * A MACD Histogram bar chart with green/red bars.
    And the controls on this tab are:
      * Chart tooltips: Hovering over any data point displays the exact price and indicator value for that day.
      * Chart legends: Interactive keys to show or hide individual indicator lines.

  Scenario: Tab 3 - Fundamentals Tab Functionality
    Given the user selects the "Fundamentals" tab
    Then the interface must display:
      * A detailed comparison table comparing the company's multiples (Trailing P/E, Forward P/E, Price-to-Book, Profit Margin, Operating Margin, ROE) against sector benchmarks.
      * Indicators marking if each metric is "▲ Above" or "▼ Below" the benchmark.
      * Qualitative blocks for AI Valuation Check and AI Profitability & Efficiency analysis.
    And the controls on this tab are:
      * Table rows: Highlights on hover for easier comparative scanning.

  Scenario: Tab 4 - Risk Tab Functionality
    Given the user selects the "Risk" tab
    Then the interface must display:
      * Progress bars for Annual Volatility, Max Drawdown, Sharpe Ratio, and Average Daily Return.
      * Level indicators (Low, Medium, High) for each risk category.
      * A bulleted list of AI-identified key risk factors.
    And the controls on this tab are:
      * Risk Cards: Hovering displays tooltips defining each volatility parameter.

  Scenario: Tab 5 - Sentiment Tab Functionality
    Given the user selects the "Sentiment" tab
    Then the interface must display:
      * A qualitative summary text summarizing recent news sentiment.
      * An aggregated sentiment score badge (Bullish, Neutral, Bearish).
      * A grid of the 5 most recent market news coverage cards.
    And the controls on this tab are:
      * Read Article links: Clickable hyperlinks that open the full news source in a new browser tab.

  Scenario: Tab 6 - Insider & Institutional Tab Functionality
    Given the user selects the "Insider & Institutional" tab
    Then the interface must display:
      * A table of recent Form 4 insider transactions, including Date, Insider Name, Position, Type (Buy/Sell), Shares, and Value.
      * A table of top institutional shareholders showing Name, Shares Held, Value, and Portfolio %.
    And the controls on this tab are:
      * Type Badges: Highlighted green for Buy actions and red for Sell actions for quick visual filtering.

  Scenario: Tab 7 - Macro & Sector Tab Functionality
    Given the user selects the "Macro & Sector" tab
    Then the interface must display:
      * Cards showing Macro Indicators: US 10-Year Treasury Yield and CBOE VIX, along with daily changes and status.
      * A card showing Sector ETF (e.g. XLK) details: price, 1-month return, and 6-month return.
    And the controls on this tab are:
      * Status labels: Dynamically colored based on risk levels (VIX) or return trends.

  Scenario: Tab 8 - Competitor Comparison Tab Functionality
    Given the user selects the "Competitor Comparison" tab
    Then the interface must display:
      * A financial peer matrix table comparing the target stock against 3 key competitors across trailing P/E, ROE, revenue growth, and gross margin.
    And the controls on this tab are:
      * Target Highlight: The row containing the active target ticker is highlighted in green with a "Target" badge to contrast with competitor rows.
      * Row click: User can click any competitor row to immediately trigger a search and load that competitor's dashboard.

  Scenario: Tab 9 - Options Flow Tab Functionality
    Given the user selects the "Options Flow" tab
    Then the interface must display:
      * Put/Call Open Interest (OI) ratio, Put/Call Volume ratio, and options flow summary.
      * A table of Unusual Options Activity showing Strike Price, Contract Type (Call/Put), Open Interest, Volume, and Implied Volatility (IV).
    And the controls on this tab are:
      * Contract Type badges: Color-coded green for Calls and red for Puts.

  Scenario: Tab 10 - Earnings Intel Tab Functionality
    Given the user selects the "Earnings Intel" tab
    Then the interface must display:
      * Next scheduled release date and consensus EPS estimate target.
      * A historical EPS surprises table showing Estimated vs. Actual EPS and Surprise %.
    And the controls on this tab are:
      * Surprise Highlight: Positive surprises are highlighted in green, negative surprises in red.

  Scenario: Tab 11 - Early Warnings Tab Functionality
    Given the user selects the "Early Warnings" tab
    Then the interface must display:
      * Financial ratios: Gross Margin, Operating Margin, Current Ratio, and Debt-to-Equity.
      * A list of active warning flags (operational or liquidity stress points).
    And the controls on this tab are:
      * Safe status check: Shows a green checkmark "✓ Safe Health Status" if no warning alerts are triggered.

  Scenario: Tab 12 - Valuation Intel Tab Functionality
    Given the user selects the "Valuation Intel" tab
    Then the interface must display:
      * Pricing anchors: Current price, Graham intrinsic value, analyst target median, and implied upside %.
    And the controls on this tab are:
      * Price Target Slider: Renders the current stock price position on a range slider bounded by the lowest and highest analyst targets.

  Scenario: Tab 13 - Capital Allocation Tab Functionality
    Given the user selects the "Capital Allocation" tab
    Then the interface must display:
      * Allocation efficiency rating.
      * Cards showing Return on Equity (ROE), Return on Assets (ROA), Dividend Yield, and Payout Ratio.
    And the controls on this tab are:
      * Efficiency Badge: Color-coded to indicate balanced or efficient asset reuse.

  Scenario: Tab 14 - Corporate Moat Tab Functionality
    Given the user selects the "Corporate Moat" tab
    Then the interface must display:
      * Moat strength gauge and moat score (0-100).
      * Qualitative moat summaries (brand pricing power, switching costs, cost advantages).
    And the controls on this tab are:
      * Progress Bar: Moat score scale from 0 to 100.

  Scenario: Tab 15 - Investment Committee Tab Functionality
    Given the user selects the "Investment Committee" tab
    Then the interface must display:
      * Cards for each AI committee member (Value, Growth, Quant, Macro, Risk) showing their stance (Buy/Hold/Sell) and a summary.
      * Consensus verdict breakdown panel.
    And the controls on this tab are:
      * Expandable member cards: Clicking any card opens a slide-over panel with their detailed argument and transcript.
      * Radar Consensus breakdown trigger: Opens a drawer showing vote distributions.

  Scenario: Tab 16 - Scenario & DCF Tab Functionality
    Given the user selects the "Scenario & DCF" tab
    Then the interface must display:
      * Statistical cases cards: Downside (10th percentile), Expected (50th percentile), and Upside (90th percentile).
      * Upside Probability percentage.
      * A valuation frequency distribution histogram (Recharts).
    And the controls on this tab are:
      * WACC slider: Adjusts base discount rate (range 5% to 20%).
      * Growth Rate slider: Adjusts cash flow growth (range 0% to 30%).
      * Perpetuity Growth slider: Adjusts long-term growth rate (range 1% to 5%).
      * Simulation Runs slider: Adjusts iterations (range 100 to 1,000).
      * RUN SIMULATION button: Dispatches new parameters to the backend simulator.

  Scenario: Tab 17 - Strategy Backtester Tab Functionality
    Given the user selects the "Strategy Backtester" tab
    Then the interface must display:
      * KPI Cards: Strategy Return, Benchmark Return, Sharpe Ratio, Max Drawdown, Win Rate, and Total Trades.
      * An equity curve chart comparing Trend Momentum Strategy vs Buy & Hold Benchmark.
      * Simulated transactions log table (Date, Action, Price, Shares, Value, P&L).
    And the controls on this tab are:
      * SMA Trend Period slider: range 10 to 200 days.
      * RSI Entry Cap slider: range 40 to 80.
      * RSI Overbought Sell slider: range 55 to 90.
      * Stop-Loss Protection slider: range 0% (disabled) to 25%.
      * Transactions Table: Scrollable body with custom paging buttons.

  Scenario: Tab 18 - Multi-Agent Stock Screener Tab Functionality
    Given the user selects the "Multi-Agent Stock Screener" tab
    Then the interface must display:
      * A watchlist table showing company rank, ticker, company name, composite score progress bar, and signals (consensus, technical, fundamental, sentiment, options).
    And the controls on this tab are:
      * Watchlist Rows: Clickable; clicking a row immediately triggers a search for that stock.
      * HOW IT WORKS info button: Opens the drawer explaining scoring weights.

  Scenario: Tab 19 - Market Psychology Engine Tab Functionality
    Given the user selects the "Market Psychology Engine" tab
    Then the interface must display:
      * Panic Score and Euphoria Score gauges.
      * Contrarian Psychology Signal banner (BUY, SELL, or HOLD).
      * Tactical rationale cards for contrarian opportunities.
      * Emotion agent cards (Fear Agent, Greed Agent, Media Sentiment, Retail Sentiment, Institutional Flow).
    And the controls on this tab are:
      * Signal Badge: Clickable; opens details explaining how crowd emotion scores are mapped.

  Scenario: Tab 20 - Multi-Agent Options Analyzer Tab Functionality
    Given the user selects the "Multi-Agent Options Analyzer" tab
    Then the interface must display:
      * Options recommendation banner with confidence score and rationale.
      * Deliberation cards from options agents: Greeks Agent, Volatility Agent, Earnings Agent, Probability Agent, Risk Agent.
    And the controls on this tab are:
      * Strategy Recommendation Badge: Clickable; opens drawer with delta/gamma hedging rules.

  Scenario: Tab 21 - Breakout Hunter Tab Functionality
    Given the user selects the "Breakout Hunter" tab
    Then the interface must display:
      * Breakout watchlist of candidates showing ticker, score, pattern, and rationale.
      * Volume spike analysis, price action checks, and sector flow details.
    And the controls on this tab are:
      * Watchlist Items: Clickable rows to switch the dashboard to the selected breakout candidate.

  Scenario: Tab 22 - Alpha Discovery Engine Tab Functionality
    Given the user selects the "Alpha Discovery Engine" tab
    Then the interface must display:
      * Alpha watchlist of under-the-radar candidates with alpha scores and catalyst rationales.
      * Summaries for SEC filing scans, patent filings, and insider trading patterns.
    And the controls on this tab are:
      * Candidate Rows: Clickable; searches the selected ticker.

  Scenario: Tab 23 - Misinformation Network Tab Functionality
    Given the user selects the "Misinformation Network" tab
    Then the interface must display:
      * Misinformation claims fact-check cards containing claims, verdicts, credibility scores, source counts, and validated evidence.
      * Fact-check agent cards (Fact Agent, Source Agent, Citation Agent, Contradiction Agent, Confidence Agent).
    And the controls on this tab are:
      * Verdict Badges: Color-coded green for Verified, red for False, and amber for Misleading/Unverified.
      * Expandable Evidence panel: Click to reveal full citations.

  Scenario: Tab 24 - Bull vs Bears Debate Tab Functionality
    Given the user selects the "Bull vs Bears Debate" tab
    Then the interface must display:
      * Bull case arguments (list of 3 points).
      * Bear case arguments (list of 3 points).
      * Moderator summary (bull case, bear case, key uncertainties, and retail takeaway).
      * Actionable Checklist card.
    And the controls on this tab are:
      * Collapsible Cards: User can expand/collapse individual debate rows.


  Scenario Outline: Clickable rating buttons opening detail drawers and flyouts
    Given the dashboard analysis has loaded successfully
    When the user clicks on the "<badge_selector>" rating badge
    Then the interface must slide open a detail drawer from the right
    And the drawer header must display "<header_text>"
    And the drawer body must render "<content_description>"
    When the user clicks the close icon ("✕") or clicks the blurred backdrop
    Then the drawer must slide back to the right and disappear
    Examples:
      | badge_selector          | header_text                           | content_description                                                                           |
      | Executive Thesis Badge  | Consensus Voting System Breakdown     | The voting rules and composite weights (value, growth, quant, macro, risk, buffett, lynch)    |
      | Contrarian Signal Badge | Market Psychology Signal Details      | Crowd fear and greed indicators, panic vs euphoria indexes, and contrarian rules              |
      | Options Strategy Badge  | AI Options Strategy Platform details  | The underlying options agents deliberations (Greeks, Volatility, Earnings, Probability, Risk) |

