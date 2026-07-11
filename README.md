# STPIS (Stock Trend Prediction and Insight System)
## A Multi-Agent Investment Intelligence Engine with Programmatic Safeguards

STPIS is an advanced, full-stack financial intelligence platform that utilizes a multi-agent AI system alongside a programmatic quantitative override engine to deliver unified, audited investment analysis.

---

## 1. Problem Statement
High-stakes investment analysis is plagued by two opposing extremes:
* **Information Overload**: Investors are bombarded with fragmented data points—trailing multiples, SMA moving averages, RSI indicator limits, insider Form 4 activity logs, and sector index returns. Manually synthesizing these conflicting metrics to make cohesive trading decisions is error-prone.
* **LLM Hallucinations**: Large Language Models (LLMs) excel at qualitative summarization but are notoriously poor at arithmetic and lack real-time access to actual market data. In high-stakes investment fields, relying on a hallucinating model can lead to catastrophic capital loss.

---

## 2. Solution Design & Architecture
STPIS implements a unified, layered architecture to ingest, audit, and analyze equity markets:
* **Decoupled API Pipeline**: Next.js UI Frontend, FastAPI Backend server, AI Agent Inference layers, and Multi-API financial data pipelines.
* **Multi-Agent Deliberation**: The 5 AI agents analyze the ingested metrics, submitting arguments and stances.
* **Scoring & Safety Audits**: The Quantitative engine scores the stock and overrides the overall recommendation if necessary.
* **Interactive UI & Visualization**: Next.js dashboard styling (glassmorphism, vibrant palettes, dark mode).

```text
[Market Ingestion] 
       │
       ├──► 5-Agent Roundtable (ADK) ────► Democratic Voting (Buy/Sell/Hold) ──┐
       │                                                                       ▼
       └──► Quantitative Engine (Rules) ──► 100-Point Composite Health Scorer ──┼─► [Sync Handler] ──► Dashboard UI
                                                                               ▲
                                                  Valuation Multiplier Override┘
```

---

## 3. Core Features & Key Concepts

### Concept 1: Multi-Agent System (ADK Alignment)
The system leverages five specialized AI agent personas that mimic an investment committee:
* **Value Investor Agent**: Audits target P/E multiples relative to safety thresholds.
* **Growth Investor Agent**: Measures return on equity (ROE) and profit margins.
* **Quant Agent**: Analyzes technical momentum and trends relative to the 20-day SMA.
* **Macro Strategist Agent**: Evaluates sector index ETF returns.
* **Risk Officer Agent**: Audits balance-sheet warning flags and leverage limits.
* **Consensus Verdict Logic**: Matches the consensus badge with the agents' actual vote distribution.

### Concept 2: Model Context Protocol (MCP) Server Integration
The MCP server exposes custom tools such as `get_insider_transactions` (Form 4 database query) and `get_options_flow` (open-interest ratios) to supply real-time financial records directly to our agents as external tools.

### Concept 3: Modular Agent Skills (Agents CLI Schemas)
STPIS structures analytical capabilities as independent, reusable Agent Skills:
* **Scenario Projections Skill**: Generates 1,000-run Monte Carlo simulations for DCF valuations.
* **Early Warning Audit Skill**: Scans current ratio bounds and gross margins to flag liquidity concerns.
* **Override Sync Skill**: Automatically checks for alignment between the model's qualitative summary and the programmatic engine score, overriding the thesis badge to enforce strict safety bounds.

---

## 4. Run & Setup Instructions

### Prerequisites
* Python 3.12+
* Node.js 18+
* API credentials (if using Gemini/Hugging Face)

### Quick Start (Fastest Way)
You can start both the backend and frontend servers together using the project-level startup script:
```powershell
python run.py
```
This automatically configures the Python Environment, runs Uvicorn on Port 8000, runs the Next.js dev server on Port 3000, and enables graceful termination when pressing `Ctrl+C`.

---

### Manual Setup (Step-by-Step)

#### Step 1: Run the Backend
Navigate to the `backend` directory and set up your Python environment:
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
venv\Scripts\activate   # On Windows
source venv/bin/activate # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the uvicorn API server with the backend module path configured
# On Windows PowerShell:
$env:PYTHONPATH="backend"
# On macOS/Linux:
export PYTHONPATH="backend"

uvicorn app.main:app --reload --port 8000
```

#### Step 2: Run the Frontend
Navigate to the `frontend` directory and set up your npm packages:
```bash
cd ../frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
Open **http://localhost:3000** in your browser to access the dashboard.
