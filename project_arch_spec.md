# STPIS Project Specification (project_spec.md)
## System Architecture, Design Schemas, and Setup Manifest for Stock Trend Prediction and Insight System

This specification document acts as a complete blueprint of the **STPIS** application. It contains the system architecture, file layouts, dependency requirements, API schemas, design decisions, and setup instructions necessary to rebuild the entire system from scratch.

---

## 1. High-Level Architecture & Data Flow

STPIS utilizes a decoupled client-server architecture:
*   **Frontend (Next.js + Tailwind CSS + Recharts)**: An interactive web dashboard supporting live search, real-time calculation monitoring, multi-agent committee visualizations, and a Monte Carlo DCF scenario modeler.
*   **Backend (FastAPI + Python)**: Ingests live market data (financial statements, historic prices, and news feed) via yfinance, caches calculations, performs mathematical indicator modeling, triggers the multi-agent LLM analysis roundtable, and runs the programmatic safety overrides.

### System Flow Diagram
```text
┌─────────────────┐       GET /api/stock/{ticker}        ┌─────────────────┐
│                 ├─────────────────────────────────────►│                 │
│                 │                                      │                 │
│   Next.js UI    │       GET /api/insight/{ticker}      │   FastAPI App   │
│   Dashboard     ├─────────────────────────────────────►│     Backend     │
│                 │                                      │                 │
│                 │◄─────────────────────────────────────┤                 │
└─────────────────┘      JSON Payload (Unified Schema)   └────────┬────────┘
                                                                  │
                                   ┌──────────────────────────────┴──────────────────────────────┐
                                   ▼                                                             ▼
                       ┌───────────────────────┐                                     ┌───────────────────────┐
                       │  Quantitative Engine  │                                     │   AI Inference Agent  │
                       │                       │                                     │   (Gemini/HF/Ollama)  │
                       │  - RSI & SMA Trends   │                                     │                       │
                       │  - Volatility Risk    │                                     │  Roundtable Personae: │
                       │  - Moat Score (ROE)   │                                     │  - Value Investor     │
                       │  - Insider Form 4s    │                                     │  - Growth Investor    │
                       │  - Sector ETF Returns │                                     │  - Quant / Technical  │
                       │  - DCF MC Simulation  │                                     │  - Macro Strategist   │
                       └───────────┬───────────┘                                     │  - Risk Officer       │
                                   │                                                 └───────────┬───────────┘
                                   │                                                             │
                                   └──────────────────────────────┬──────────────────────────────┘
                                                                  ▼
                                                   ┌────────────────────────────┐
                                                   │    Sync & Safety Handler   │
                                                   │  (Overrides Thesis if P/E  │
                                                   │   exceeds threshold bounds)│
                                                   └────────────────────────────┘
```

---

## 2. Directory & File Tree

The complete project structure is as follows:

```text
STPIS/
├── .agents/                    # Custom agent instructions and skills
│   └── skills/
│       ├── code-review/
│       ├── system-design/
│       └── tech-stack/
├── backend/
│   ├── app/
│   │   ├── app_utils/          # Helper modules for mathematical scoring
│   │   ├── schemas/            # Pydantic data schemas
│   │   │   ├── __init__.py
│   │   │   ├── dcf.py          # Monte Carlo simulator schemas
│   │   │   ├── insight.py      # Multi-agent/Audited report schema
│   │   │   └── stock.py        # Raw yfinance ingestion schemas
│   │   ├── services/           # Underlying computational services
│   │   │   ├── __init__.py
│   │   │   ├── backtester.py   # Historical trading strategy logic
│   │   │   ├── insight_service.py # LLM client orchestration & fallbacks
│   │   │   └── stock_service.py # Ingestion & caching layer for yfinance
│   │   ├── __init__.py
│   │   ├── agent.py            # Custom CLI and Prompt wrapper definitions
│   │   ├── cache.py            # Local cache manager (TTL-based)
│   │   ├── fast_api_app.py     # FastAPI instance config
│   │   ├── main.py             # Server endpoints & route definitions
│   │   └── tools.py            # Financial indicators & Form 4 mock database
│   ├── .env                    # LLM configuration (Excluded by gitignore)
│   ├── .env_sample             # Environment configuration template
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── requirements.txt        # Python backend dependencies
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── app/                # Next.js App Router (Layout & Global CSS)
│   │   │   ├── favicon.ico
│   │   │   ├── globals.css     # Base Tailwind directives & custom animations
│   │   │   ├── layout.tsx      # Viewport setup & Font layouts
│   │   │   └── page.tsx        # Dashboard wrapper
│   │   └── components/         # Core React views
│   │       ├── RiskTab.tsx     # Custom visualization for risk metrics
│   │       └── StockDashboard.tsx # Comprehensive UI views & interactive states
│   ├── .gitignore              # Frontend Git ignore
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts          # Build configs
│   ├── package.json            # Frontend package dependencies
│   ├── postcss.config.mjs
│   ├── tsconfig.json           # TypeScript configuration compiler
│   └── README.md
├── .gitignore                  # Global Git ignore (virtual environments, node_modules, envs)
├── README.md                   # Main descriptive file and quickstart guide
├── run.py                      # Multi-process Windows/Posix runner script
└── run_app.py                  # Integration and Playwright automation test suite
```

---

## 3. Configuration & Dependency Manifests

### 3.1 Backend Dependencies (`backend/requirements.txt`)
```text
fastapi>=0.100.0
uvicorn>=0.22.0
yfinance>=0.2.38
pandas>=2.0.0
pydantic>=2.0
google-generativeai>=0.3.0
google-adk>=0.1.0
huggingface_hub>=0.20.0
openai>=1.0.0
```

### 3.2 Backend Environment Variables (`backend/.env`)
Create this file in the `backend/` directory.

```properties
# Models Available: GOOGLE, HUGGINGFACE, LOCAL
LLM_PROVIDER=GOOGLE

# Google Gemini API Config
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_BACKUP=your_backup_gemini_api_key_here
# Global model name configuration (defaults to gemini-2.5-flash)
INSIGHT_MODEL_NAME=gemini-2.5-flash
# Dynamic model response verbosity level: SHORT or VERBOSE
VERBOSITY_LEVEL=SHORT

# Hugging Face Configuration
HF_TOKEN=your_hugging_face_token_here
HF_MODEL=meta-llama/Llama-3.2-3B-Instruct

# Local Ollama Configuration (if provider = LOCAL)
OLLAMA_MODEL=mistral-nemo:latest

# Performance Tuning
PARALLEL=false
BATCH=true
```

### 3.3 Frontend Dependencies (`frontend/package.json`)
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "lucide-react": "^1.22.0",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.9.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 4. Key Schemas & Data Structures

The system uses Pydantic v2 schemas to strictly validate inputs and outputs.

### 4.1 Stock Data Ingestion Schema (`backend/app/schemas/stock.py`)
Matches the raw yfinance response payload returned to the frontend.

```python
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class PriceHistoryItem(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class FinancialMetrics(BaseModel):
    trailing_pe: Optional[float] = None
    forward_pe: Optional[float] = None
    trailing_eps: Optional[float] = None
    forward_eps: Optional[float] = None
    profit_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    gross_margin: Optional[float] = None
    return_on_equity: Optional[float] = None
    return_on_assets: Optional[float] = None
    ebitda: Optional[float] = None
    trailing_revenue: Optional[float] = None
    trailing_net_income: Optional[float] = None
    price_to_book: Optional[float] = None
    enterprise_to_revenue: Optional[float] = None
    enterprise_to_ebitda: Optional[float] = None
    market_cap: Optional[float] = None

class StockDataResponse(BaseModel):
    ticker: str
    company_name: str
    sector: str
    industry: str
    prices: List[PriceHistoryItem]
    metrics: FinancialMetrics
    news: List[Dict[str, Any]]
```

### 4.2 Comprehensive Insight Schema (`backend/app/schemas/insight.py`)
This represents the final validated audited report returned by the backend:

```python
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class TechnicalScales(BaseModel):
    rsi14: float
    sma20: float
    sma50: float
    macd_histogram: float
    trend_score: float
    momentum_score: float

class FundamentalComparisonItem(BaseModel):
    metric: str
    value: float
    benchmark: float
    explanation: str

class RiskMetrics(BaseModel):
    annual_volatility: float
    sharpe_ratio: float
    max_drawdown: float
    avg_daily_return: float

class CommitteeMember(BaseModel):
    persona: str
    stance: str
    confidence_score: float
    argument: str

class InvestmentCommittee(BaseModel):
    consensus_recommendation: str
    consensus_confidence: float
    debate_summary: str
    members: List[CommitteeMember]

class StockInsightResponse(BaseModel):
    ticker: str
    technical_momentum: Dict[str, Any]
    fundamental_health: Dict[str, Any]
    sentiment: Dict[str, Any]
    key_risks: List[str]
    overall_recommendation: Dict[str, Any]
    risk_metrics: RiskMetrics
    technical_scales: TechnicalScales
    fundamental_comparisons: List[FundamentalComparisonItem]
    insider_flow: Dict[str, Any]
    insider_transactions: List[Dict[str, Any]]
    institutional_holders: List[Dict[str, Any]]
    macro_flow: Dict[str, Any]
    macro_indicators: List[Dict[str, Any]]
    sector_etf: Dict[str, Any]
    competitor_analysis: Dict[str, Any]
    competitor_comparisons: List[Dict[str, Any]]
    options_flow: Dict[str, Any]
    unusual_options: List[Dict[str, Any]]
    earnings_intelligence: Dict[str, Any]
    earnings_history: List[Dict[str, Any]]
    early_warning: Dict[str, Any]
    warning_alerts: List[str]
    valuation_opportunity: Dict[str, Any]
    capital_allocation: Dict[str, Any]
    corporate_moat: Dict[str, Any]
    investment_committee: InvestmentCommittee
    bull_bear_debate: Dict[str, Any]
    market_psychology: Dict[str, Any]
    options_analyzer: Dict[str, Any]
    model_name: str
    is_mock: bool
    generated_at: float
```

---

## 5. Main Computational Modules & Rules

### 5.1 Technical Indicator Calculations
Technical indicators are generated programmatically on the historical price dictionary using `pandas`:
*   **SMA (20-day & 50-day)**: Rolling average of closing price over the specified trading periods.
*   **RSI (14-day)**: Wilder's smoothing ratio of Average Gains to Average Losses:
    $$\text{RSI} = 100 - \left(\frac{100}{1 + \text{RS}}\right), \quad \text{where } \text{RS} = \frac{\text{Average Gain}}{\text{Average Loss}}$$
*   **MACD Histogram**: Evaluated as the difference between the MACD Line (12-day EMA - 26-day EMA) and the Signal Line (9-day EMA of the MACD Line).

### 5.2 Programmatic Scoring Engine Rules
Calculates a 0-100 score indicating overall stock health:
1.  **Technical Factor (+15 / -15 points)**:
    *   Price relative to 20-day SMA ($>\text{SMA}$ yields $+10$, else $-10$).
    *   RSI within normal range ($40 \le \text{RSI} \le 65$ yields $+5$, overbought $\ge 70$ yields $-5$, oversold $\le 30$ yields $+5$).
2.  **Fundamental Factor (+20 / -30 points)**:
    *   Profit margin ($>15\%$ yields $+10$, $<5\%$ yields $-15$, missing $-5$).
    *   Trailing P/E ratio ($0 < P/E \le 22$ yields $+10$, excessive $P/E > 35$ or negative yields $-15$).
    *   Return on Equity ($ROE > 15\%$ yields $+10$, $<5\%$ yields $-15$).
3.  **Insider Activity (+5 / -5 points)**: Presence of Form 4 buy actions adds $+5$, else $-5$.
4.  **Macro/Sector (+10 / -10 points)**: Sector ETF 1-month and 6-month returns contribute up to $\pm 10$ points.
5.  **Capital Allocation (+15 / -20 points)**: Return on equity and healthy payout ratio ($10\% \le \text{payout} \le 60\%$) contribute up to $+15$ or $-20$.

### 5.3 Programmatic Safe Override Rule
To safeguard against LLM hallucinations regarding valuation multiples:
*   **The Check**: If the ingested stock metrics indicate a trailing P/E ratio $> 45$, the System Scorer automatically flags this as an overvalued anomaly.
*   **The Action**: The programmatic override runs inside `_sync_recommendation` within `insight_service.py`. Regardless of the LLM's recommended rating (e.g., "Buy" or "Hold"), the system overrides the consensus verdict to **"Hold"** or **"Sell"** to protect the user from overpaying.

### 5.4 Monte Carlo DCF Simulation Logic
Simulates 100 to 1,000 runs using a volatility-weighted discount rate and cash flows:
*   **Free Cash Flow Growth Rate**: Modeled as a normal distribution around the estimated growth rate, standard deviation based on historical profit margins.
*   **WACC (Weighted Average Cost of Capital)**: Modeled as a normal distribution around the base discount rate, standard deviation based on the stock's annual price volatility.
*   **Expected Valuation**: Generates terminal value using the perpetuity method:
    $$\text{Terminal Value} = \frac{\text{FCF}_n \times (1 + g_{\text{terminal}})}{\text{WACC} - g_{\text{terminal}}}$$
*   Outputs the median base case value, downside risk (10th percentile case), upside potential (90th percentile case), and probability of upside (percentage of runs where DCF valuation exceeds current price).

---

## 6. Execution & Verification Guides

### 6.1 Unified Run Configuration (`python run.py`)
Run the following script at the root directory to initiate both the frontend and backend servers together. It configures paths and handles SIGINT (Ctrl+C) to terminate both servers safely.

```python
# Launch command
python run.py
```

### 6.2 Manual Service Initialization

#### Starting the FastAPI Backend
```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows: venv\Scripts\activate
# Posix: source venv/bin/activate

pip install -r requirements.txt

# Configure PYTHONPATH so python finds the "app" module relative to the root
# Windows PowerShell:
$env:PYTHONPATH="backend"
# macOS/Linux:
export PYTHONPATH="backend"

# Run Uvicorn dev server
python -m uvicorn app.main:app --reload --port 8000
```

#### Starting the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```

The system will now be active:
*   **Frontend client interface**: [http://localhost:3000](http://localhost:3000)
*   **FastAPI API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
