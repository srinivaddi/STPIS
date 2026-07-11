"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Newspaper,
  Loader2,
  Sparkles,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  Scale,
  HelpCircle,
  LayoutDashboard,
  BrainCircuit,
  Coins,
  BarChart4,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Briefcase,
  DollarSign,
  AlertCircle,
  Compass,
  Shield,
  Users,
  Cpu,
} from "lucide-react";

// ────────────────────────────────────────────────────────────
// Types matching the Backend schemas
// ────────────────────────────────────────────────────────────
interface StockPriceItem {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  sma20?: number | null;
  sma50?: number | null;
  rsi14?: number | null;
  macd_histogram?: number | null;
  macd_line?: number | null;
  macd_signal?: number | null;
}

interface NewsArticleItem {
  title: string | null;
  publisher: string | null;
  link: string | null;
  publish_time: number | null;
  type: string | null;
}

interface FinancialMetricsTTM {
  trailing_pe: number | null;
  forward_pe: number | null;
  trailing_eps: number | null;
  forward_eps: number | null;
  profit_margin: number | null;
  operating_margin: number | null;
  gross_margin: number | null;
  return_on_equity: number | null;
  return_on_assets: number | null;
  ebitda: number | null;
  trailing_revenue: number | null;
  trailing_net_income: number | null;
  dividend_yield: number | null;
  price_to_book: number | null;
  enterprise_to_revenue: number | null;
  enterprise_to_ebitda: number | null;
  market_cap: number | null;
}

interface StockDataResponse {
  ticker: string;
  company_name: string | null;
  metrics: FinancialMetricsTTM;
  prices: StockPriceItem[];
  news: NewsArticleItem[];
  cached_at: number;
}

interface TechnicalMomentumAnalysis {
  evaluation: string;
  rsi_analysis: string;
  trend_analysis: string;
}

interface FundamentalHealthAnalysis {
  evaluation: string;
  valuation_analysis: string;
  profitability_analysis: string;
}

interface SentimentAnalysis {
  evaluation: string;
  news_summary: string;
}

interface OverallRecommendation {
  rating: string;
  summary: string;
  confidence_score: number;
}

interface RiskMetrics {
  annual_volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  avg_daily_return: number;
}

interface TechnicalScales {
  rsi14: number;
  sma20: number;
  sma50: number;
  macd_histogram: number;
  trend_score: number;
  momentum_score: number;
}

interface FundamentalComparisonItem {
  metric: string;
  value: number;
  benchmark: number;
  explanation: string;
}

interface InsiderTransactionItem {
  date: string;
  transaction_type: string;
  shares: number;
  value: number;
  insider_name: string;
  position: string;
}

interface InstitutionalHolderItem {
  holder: string;
  shares: number;
  value: number;
  pct_held: number;
}

interface InsiderFlowAnalysis {
  evaluation: string;
  insider_summary: string;
  institutional_summary: string;
}

interface MacroIndicatorItem {
  name: string;
  value: number;
  change: number;
  status: string;
}

interface SectorEtfData {
  ticker: string;
  name: string;
  current_price: number;
  one_month_return: number;
  six_month_return: number;
}

interface MacroFlowAnalysis {
  evaluation: string;
  macro_summary: string;
  sector_summary: string;
}

interface CompetitorComparisonItem {
  ticker: string;
  company_name: string;
  pe_ratio: number | null;
  roe: number | null;
  revenue_growth: number | null;
  gross_margin: number | null;
}

interface CompetitorFlowAnalysis {
  evaluation: string;
  competitor_summary: string;
}

interface UnusualOptionContract {
  strike: number;
  type: string;
  open_interest: number;
  volume: number;
  implied_volatility: number;
}

interface OptionsFlowAnalysis {
  evaluation: string;
  put_call_oi_ratio: number;
  put_call_volume_ratio: number;
  flow_summary: string;
}

interface EarningsHistoryItem {
  quarter: string;
  eps_estimate: number | null;
  eps_actual: number | null;
  surprise_pct: number | null;
}

interface EarningsFlowAnalysis {
  evaluation: string;
  next_earnings_date: string | null;
  next_eps_estimate: number | null;
  intelligence_summary: string;
}

interface EarlyWarningFlowAnalysis {
  evaluation: string;
  deteriorating_signals_count: number;
  warning_summary: string;
  gross_margin: number;
  operating_margin: number;
  current_ratio: number;
  debt_to_equity: number;
}

interface ValuationOpportunityFlowAnalysis {
  evaluation: string;
  intrinsic_value: number | null;
  analyst_target_median: number | null;
  implied_upside_pct: number | null;
  valuation_summary: string;
  dcf_bear_value?: number | null;
  dcf_base_value?: number | null;
  dcf_bull_value?: number | null;
  dcf_upside_probability?: number | null;
}

interface CapitalAllocationFlowAnalysis {
  evaluation: string;
  dividend_yield: number | null;
  payout_ratio: number | null;
  return_on_equity: number | null;
  return_on_assets: number | null;
  allocation_summary: string;
}

interface CorporateMoatAnalysis {
  evaluation: string;
  moat_score: number;
  pricing_power: string;
  moat_summary: string;
}

interface CommitteeMemberDebate {
  persona: string;
  stance: string;
  confidence_score: number;
  argument: string;
}

interface InvestmentCommitteeAnalysis {
  consensus_recommendation: string;
  consensus_stance: string;
  consensus_confidence: number;
  debate_summary: string;
  members: CommitteeMemberDebate[];
}

interface DebateParticipant {
  role: string;
  stance: string;
  arguments: string[];
}

interface ModeratorSummary {
  bull_case: string[];
  bear_case: string[];
  key_uncertainties: string[];
  retail_takeaway?: string;
  actionable_checklist?: string[];
}

interface BullBearDebateAnalysis {
  participants: DebateParticipant[];
  moderator_summary: ModeratorSummary;
}

interface MarketPsychologyAnalysis {
  panic_level: number;
  euphoria_level: number;
  contrarian_opportunities: string[];
  fear_agent_summary: string;
  greed_agent_summary: string;
  media_sentiment_summary: string;
  retail_sentiment_summary: string;
  institutional_sentiment_summary: string;
}

interface OptionsAgentAnalysis {
  persona: string;
  stance: string;
  summary: string;
}

interface MultiAgentOptionsAnalysis {
  recommendation: string;
  confidence_score: number;
  rationale: string;
  agents: OptionsAgentAnalysis[];
}

interface BreakoutWatchlistItem {
  ticker: string;
  score: number;
  pattern: string;
  rationale: string;
}

interface BreakoutHunterAnalysis {
  recommendation: string;
  confidence_score: number;
  watchlist: BreakoutWatchlistItem[];
  volume_spike_summary: string;
  price_action_summary: string;
  market_trend_summary: string;
  sector_summary: string;
  confirmation_summary: string;
}

interface AlphaDiscoveryItem {
  ticker: string;
  alpha_score: number;
  pattern: string;
  rationale: string;
}

interface AlphaDiscoveryAnalysis {
  recommendation: string;
  confidence_score: number;
  watchlist: AlphaDiscoveryItem[];
  sec_filing_summary: string;
  insider_trading_summary: string;
  patent_summary: string;
  earnings_summary: string;
  news_summary: string;
  ranking_summary: string;
}

interface MisinfoReportItem {
  claim: string;
  verdict: string;
  credibility_score: number;
  source_count: number;
  evidence: string;
}

interface MisinformationAnalysis {
  overall_verdict: string;
  network_confidence: number;
  reports: MisinfoReportItem[];
  fact_agent_summary: string;
  source_agent_summary: string;
  citation_agent_summary: string;
  contradiction_agent_summary: string;
  confidence_agent_summary: string;
}

interface EquityPoint {
  date: string;
  strategy_value: number;
  benchmark_value: number;
}

interface TradeRecord {
  date: string;
  action: string;
  price: number;
  shares: number;
  value: number;
  pnl?: number;
}

interface BacktestPerformance {
  strategy_return_pct: number;
  benchmark_return_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  win_rate_pct: number;
  total_trades: number;
  equity_curve: EquityPoint[];
  trades: TradeRecord[];
}

interface ScreenerStockItem {
  rank: number;
  ticker: string;
  company_name: string;
  composite_score: number;
  consensus_rating: string;
  technical_signal: string;
  fundamental_signal: string;
  sentiment_signal: string;
  options_signal: string;
}

interface ScreenerAnalysis {
  generated_at: string;
  watchlist: ScreenerStockItem[];
}

interface StockInsightResponse {
  ticker: string;
  bull_bear_debate?: BullBearDebateAnalysis;
  market_psychology?: MarketPsychologyAnalysis;
  options_analyzer?: MultiAgentOptionsAnalysis;
  breakout_hunter?: BreakoutHunterAnalysis;
  alpha_discovery?: AlphaDiscoveryAnalysis;
  misinformation?: MisinformationAnalysis;
  backtest?: BacktestPerformance;
  screener?: ScreenerAnalysis;
  technical_momentum: TechnicalMomentumAnalysis;
  fundamental_health: FundamentalHealthAnalysis;
  sentiment: SentimentAnalysis;
  key_risks: string[];
  overall_recommendation: OverallRecommendation;
  insider_flow: InsiderFlowAnalysis;
  insider_transactions: InsiderTransactionItem[];
  institutional_holders: InstitutionalHolderItem[];
  macro_flow: MacroFlowAnalysis;
  macro_indicators: MacroIndicatorItem[];
  sector_etf: SectorEtfData;
  competitor_analysis: CompetitorFlowAnalysis;
  competitor_comparisons: CompetitorComparisonItem[];
  options_flow: OptionsFlowAnalysis;
  unusual_options: UnusualOptionContract[];
  earnings_intelligence: EarningsFlowAnalysis;
  earnings_history: EarningsHistoryItem[];
  early_warning: EarlyWarningFlowAnalysis;
  warning_alerts: string[];
  valuation_opportunity: ValuationOpportunityFlowAnalysis;
  capital_allocation: CapitalAllocationFlowAnalysis;
  corporate_moat: CorporateMoatAnalysis;
  investment_committee: InvestmentCommitteeAnalysis;
  model_name: string;
  is_mock: boolean;
  generated_at: number;
  risk_metrics: RiskMetrics;
  technical_scales: TechnicalScales;
  fundamental_comparisons: FundamentalComparisonItem[];
  executive_thesis?: string;
}

interface HistogramBin {
  bin_min: number;
  bin_max: number;
  count: number;
}

interface SimulationResponse {
  ticker: string;
  current_price: number;
  estimated_fcf: number;
  estimated_wacc: number;
  estimated_growth: number;
  shares_outstanding: number;
  volatility: number;
  bear_value_10p: number;
  base_value_50p: number;
  bull_value_90p: number;
  upside_probability: number;
  histogram: HistogramBin[];
  error?: string;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const formatNumber = (num: number | null): string => {
  if (num === null || num === undefined || isNaN(num)) return "N/A";
  const absNum = Math.abs(num);
  if (absNum >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (absNum >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (absNum >= 1e6) return (num / 1e6).toFixed(2) + "M";
  return num.toLocaleString();
};

const formatPercent = (val: number | null): string => {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  return (val * 100).toFixed(2) + "%";
};

// Colour‑coded scale bar (0–100 range, or explicit min/max)
const ScaleBar = ({
  value,
  min = 0,
  max = 100,
  label,
  unit = "",
  invert = false,
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
  invert?: boolean;
}) => {
  const pct = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const colour =
    pct < 30
      ? invert
        ? "bg-rose-500"
        : "bg-emerald-500"
      : pct < 60
      ? "bg-amber-500"
      : invert
      ? "bg-emerald-500"
      : "bg-rose-500";

  const textColour =
    pct < 30
      ? invert
        ? "text-rose-400"
        : "text-emerald-400"
      : pct < 60
      ? "text-amber-400"
      : invert
      ? "text-emerald-400"
      : "text-rose-400";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
          {label}
        </span>
        <span className={`text-sm font-bold ${textColour}`}>
          {value.toFixed(2)}
          {unit}
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Tab type
// ────────────────────────────────────────────────────────────
type TabKey = "overview" | "technical" | "fundamentals" | "risk" | "sentiment" | "insider" | "macro" | "competitor" | "options" | "earnings" | "warning" | "valuation" | "capital" | "committee" | "dcf" | "moat" | "debate" | "psychology" | "options_analyzer" | "breakout_hunter" | "alpha_discovery" | "misinformation" | "backtest" | "screener";

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────
export default function StockDashboard() {
  const [mounted, setMounted] = useState(false);
  const [searchTicker, setSearchTicker] = useState("");
  const [activeTicker, setActiveTicker] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [stockData, setStockData] = useState<StockDataResponse | null>(null);
  const [insightData, setInsightData] = useState<StockInsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insightResponseMs, setInsightResponseMs] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);
  const [showRatingExplanation, setShowRatingExplanation] = useState(false);
  const [explanationType, setExplanationType] = useState<"system" | "committee" | "psychology" | "options_analyzer" | "breakout_hunter" | "alpha_discovery" | "misinformation" | "backtest" | "screener">("system");

  // DCF Simulation State
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [waccInput, setWaccInput] = useState<string>("");
  const [growthInput, setGrowthInput] = useState<string>("");
  const [perpInput, setPerpInput] = useState<string>("2.5");
  const [runsInput, setRunsInput] = useState<number>(1000);

  // Backtester Strategy Slider States
  const [backtestSmaPeriod, setBacktestSmaPeriod] = useState<number>(20);
  const [backtestRsiBuy, setBacktestRsiBuy] = useState<number>(70);
  const [backtestRsiSell, setBacktestRsiSell] = useState<number>(75);
  const [backtestStopLoss, setBacktestStopLoss] = useState<number>(0); // 0 means disabled/None

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showRatingExplanation) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showRatingExplanation]);

  const triggerSimulation = async (
    ticker: string,
    wacc?: number,
    growth?: number,
    perp?: number,
    runs: number = 1000
  ) => {
    setLoadingSimulation(true);
    try {
      const payload: any = { simulations: runs };
      if (wacc !== undefined) payload.wacc = wacc;
      if (growth !== undefined) payload.growth_rate = growth;
      if (perp !== undefined) payload.perpetuity_growth = perp;

      const res = await fetch(`http://127.0.0.1:8000/api/stock/${ticker}/dcf_simulation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Simulation endpoint failed.");
      const data: SimulationResponse = await res.json();
      setSimulationData(data);
      if (wacc === undefined) setWaccInput(data.estimated_wacc.toString());
      if (growth === undefined) setGrowthInput(data.estimated_growth.toString());
    } catch (err) {
      console.error("DCF Simulation error:", err);
    } finally {
      setLoadingSimulation(false);
    }
  };

  const triggerSearch = async (ticker: string) => {
    if (!ticker.trim()) return;
    const cleanTicker = ticker.trim().toUpperCase();
    setActiveTicker(cleanTicker);
    setError(null);
    setLoadingData(true);
    setLoadingInsight(true);
    setStockData(null);
    setInsightData(null);
    setSimulationData(null);
    setInsightResponseMs(null);
    setWaccInput("");
    setGrowthInput("");
    triggerSimulation(cleanTicker);

    // Step 1: Fetch basic financials & price history
    try {
      const dataRes = await fetch(`http://127.0.0.1:8000/api/stock/${cleanTicker}`);
      if (!dataRes.ok) {
        if (dataRes.status === 404) throw new Error(`Ticker '${cleanTicker}' not found.`);
        throw new Error("Failed to fetch stock financials.");
      }
      const dataJson: StockDataResponse = await dataRes.json();
      setStockData(dataJson);
      setLoadingData(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred fetching stock financials.");
      setStockData(null);
      setLoadingData(false);
      setLoadingInsight(false);
      return; // Stop execution if basic stock data is unavailable
    }

    // Step 2: Fetch AI generated insights & metrics
    try {
      const insightStart = performance.now();
      const insightRes = await fetch(`http://127.0.0.1:8000/api/stock/${cleanTicker}/insight`);
      if (!insightRes.ok) throw new Error("Failed to fetch AI insights.");
      const insightJson: StockInsightResponse = await insightRes.json();
      const insightEnd = performance.now();
      setInsightData(insightJson);
      setInsightResponseMs(Math.round(insightEnd - insightStart));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred fetching AI insights.");
      setInsightData(null);
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(searchTicker);
  };

  const getEvalBadge = (evalStr: string | undefined, isClickable = false, type: "system" | "committee" | "psychology" | "options_analyzer" = "system") => {
    if (!evalStr) return null;
    const v = evalStr.toLowerCase();
    let cls = "bg-zinc-800 text-zinc-300";
    if (v.includes("bullish") || v.includes("strong") || v.includes("buy"))
      cls = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    else if (v.includes("bearish") || v.includes("distressed") || v.includes("sell"))
      cls = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    else if (v.includes("neutral") || v.includes("stable") || v.includes("hold"))
      cls = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return (
      <span
        onClick={isClickable ? () => {
          console.log("Clicked rating badge:", type);
          setExplanationType(type);
          setShowRatingExplanation(true);
        } : undefined}
        title={isClickable ? `Click to view ${type} rating breakdown` : undefined}
        className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${cls} ${isClickable ? "cursor-pointer hover:brightness-125 select-none transition-all flex items-center gap-1.5 active:scale-95 border-dashed border-2 relative z-10 pointer-events-auto" : ""}`}
      >
        {evalStr}
        {isClickable && <HelpCircle className="w-3.5 h-3.5" />}
      </span>
    );
  };

  const TAB_GROUPS: {
    title: string;
    icon: any;
    tabs: { key: TabKey; label: string }[];
  }[] = [
    {
      title: "Executive View",
      icon: LayoutDashboard,
      tabs: [
        { key: "overview", label: "Overview" },
        { key: "risk", label: "Risk" },
        { key: "warning", label: "Early Warnings" },
      ],
    },
    {
      title: "AI & Debate Intelligence",
      icon: BrainCircuit,
      tabs: [
        { key: "committee", label: "Investment Committee" },
        { key: "debate", label: "Bull vs Bears Debate" },
        { key: "sentiment", label: "Sentiment" },
        { key: "psychology", label: "Market Psychology Engine" },
        { key: "misinformation", label: "Misinformation Network" },
        { key: "screener", label: "Multi-Agent Stock Screener" },
        { key: "options_analyzer", label: "Multi-Agent Options Analyzer" },
        { key: "breakout_hunter", label: "Breakout Hunter" },
        { key: "alpha_discovery", label: "Alpha Discovery Engine" },
      ],
    },
    {
      title: "Financials & Valuation",
      icon: Coins,
      tabs: [
        { key: "fundamentals", label: "Fundamentals" },
        { key: "earnings", label: "Earnings Intel" },
        { key: "capital", label: "Capital Allocations" },
        { key: "valuation", label: "Valuation Intel" },
        { key: "moat", label: "Corporate Moat & Pricing Power Analysis" },
        { key: "dcf", label: "Scenario & DCF" },
      ],
    },
    {
      title: "Market Flows & Momentum",
      icon: BarChart4,
      tabs: [
        { key: "technical", label: "Technical" },
        { key: "backtest", label: "Strategy Backtester" },
        { key: "insider", label: "Insider & Institutional" },
        { key: "macro", label: "Macro & Sector" },
        { key: "options", label: "Options Flow" },
        { key: "competitor", label: "Competitor Comparison" },
      ],
    },
  ];

  const TABS = TAB_GROUPS.flatMap((group) => group.tabs);

  // ──────────────────────────────────────────────
  // TAB CONTENT RENDERERS
  // ──────────────────────────────────────────────

  const renderPsychology = () => {
    if (loadingInsight) return renderTabLoader("Analyzing market panic extremes, euphoria indicators, and crowd psychology...");
    if (!insightData) return renderTabError("Could not load Market Psychology data.");

    const psych = insightData.market_psychology || {
      panic_level: 45.0,
      euphoria_level: 55.0,
      contrarian_opportunities: ["No contrarian opportunities generated yet. Please re-run analysis."],
      fear_agent_summary: "No fear analysis details available.",
      greed_agent_summary: "No greed analysis details available.",
      media_sentiment_summary: "No media sentiment analysis details available.",
      retail_sentiment_summary: "No retail sentiment details available.",
      institutional_sentiment_summary: "No institutional positioning details available."
    };

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Title Block */}
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-emerald-400" />
            <span>Market Psychology Engine</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            "Most investors track prices. Few track psychology." Multi-agent sentiment analytics, measuring fear, greed, and crowd behaviors to surface contrarian edges.
          </p>
        </div>

        {/* Contrarian Psychology Signal Block */}
        {(() => {
          let signal = "HOLD";
          let badgeLabel = "HOLD";
          let signalColor = "text-amber-400 border-amber-500/20 bg-amber-500/5";
          let plainAnalysis = "";

          if (psych.panic_level >= 65.0) {
            signal = "BUY";
            badgeLabel = "BUY (Contrarian Panic)";
            signalColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
            plainAnalysis = `Extreme panic levels (${psych.panic_level}%) suggest heavy capitulation. According to contrarian investing principles, widespread fear represents a prime buying window as weak hands liquidate.`;
          } else if (psych.euphoria_level >= 65.0) {
            signal = "SELL";
            badgeLabel = "SELL (Contrarian Euphoria)";
            signalColor = "text-rose-400 border-rose-500/20 bg-rose-500/5";
            plainAnalysis = `Extreme euphoria levels (${psych.euphoria_level}%) indicate heavy FOMO buying. Greed-driven sentiment increases the risk of multiple compression, suggesting it is time to take profits or pause buying.`;
          } else {
            signal = "HOLD";
            badgeLabel = "HOLD / ACCUMULATE";
            signalColor = "text-amber-400 border-amber-500/20 bg-amber-500/5";
            plainAnalysis = `Sentiment levels are currently balanced (Panic: ${psych.panic_level}%, Euphoria: ${psych.euphoria_level}%). There are no crowd extremes. Recommend standard dollar-cost averaging in existing entry zones.`;
          }

          return (
            <div className={`border rounded-2xl p-5 backdrop-blur-sm shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${signalColor}`}>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-80 block">
                  Contrarian Psychology Signal
                </span>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 animate-pulse text-emerald-400" />
                  <span
                    onClick={() => {
                      setExplanationType("psychology");
                      setShowRatingExplanation(true);
                    }}
                    title="Click to view contrarian signal breakdown"
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border-2 border-dashed cursor-pointer select-none transition-all flex items-center gap-1.5 active:scale-95 hover:brightness-125 hover:scale-105 relative z-10 pointer-events-auto ${
                      signal === "BUY"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : signal === "SELL"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {badgeLabel}
                    <HelpCircle className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-2 max-w-2xl">
                  {plainAnalysis}
                </p>
              </div>
              <div className="flex-shrink-0 bg-slate-950/40 border border-slate-900 rounded-xl px-4 py-3 text-center self-start md:self-auto font-mono text-[10px] text-slate-400 space-y-0.5">
                <div>Panic Score: {psych.panic_level}%</div>
                <div>Euphoria Score: {psych.euphoria_level}%</div>
              </div>
            </div>
          );
        })()}

        {/* Emotion Gauges Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          
          {/* Panic Level Meter */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Panic / Stress Levels</span>
              </h4>
              <span className="text-lg font-mono font-bold text-rose-400">{psych.panic_level}%</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full transition-all duration-1000" 
                style={{ width: `${psych.panic_level}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Measures volatility triggers, downside momentum extremes, and risk-off capitulation extremes.
            </p>
          </div>

          {/* Euphoria Level Meter */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Euphoria / FOMO Levels</span>
              </h4>
              <span className="text-lg font-mono font-bold text-amber-400">{psych.euphoria_level}%</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-300 rounded-full transition-all duration-1000" 
                style={{ width: `${psych.euphoria_level}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Measures upward overextension, retail volume surges, and optimistic option flow buying excesses.
            </p>
          </div>

        </div>

        {/* Contrarian Opportunities */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Contrarian Opportunities & Tactical Rationale</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {psych.contrarian_opportunities.map((opt, idx) => (
              <div key={idx} className="bg-slate-950/50 border border-slate-900 rounded-xl p-4 flex gap-3 items-start hover:border-emerald-500/20 transition-all">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center border border-emerald-500/20">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{opt}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Five Specialist Emotion Agents */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">
            Specialist Sentiment Agent Deliberations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Fear Agent Card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 uppercase font-mono">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Fear Agent</span>
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-6">
                  {psych.fear_agent_summary}
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-2 block">Focus: Downside Capitulation</span>
            </div>

            {/* Greed Agent Card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase font-mono">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Greed Agent</span>
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-6">
                  {psych.greed_agent_summary}
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-2 block">Focus: FOMO & Momentum Bias</span>
            </div>

            {/* Media Agent Card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5 uppercase font-mono">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>Media Sentiment</span>
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-6">
                  {psych.media_sentiment_summary}
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-2 block">Focus: News & Press Tone</span>
            </div>

            {/* Retail Agent Card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-mono">
                  <Users className="w-3.5 h-3.5" />
                  <span>Retail Sentiment</span>
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-6">
                  {psych.retail_sentiment_summary}
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-2 block">Focus: Herd & Social Chatter</span>
            </div>

            {/* Institutional Agent Card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5 uppercase font-mono">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Institutional Flow</span>
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-6">
                  {psych.institutional_sentiment_summary}
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-2 block">Focus: Option Positionings</span>
            </div>

          </div>
        </div>

      </div>
    );
  };

  const renderOptionsAnalyzer = () => {
    if (loadingInsight) return renderTabLoader("Simulating multi-agent options strategy deliberations...");
    if (!insightData || !insightData.options_analyzer) return renderTabError("Could not load options strategy analysis.");

    const opt = insightData.options_analyzer;
    
    return (
      <div className="space-y-6">
        {/* Recommendation Header Banner */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center gap-6 justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500/10 px-4 py-1.5 rounded-bl-xl text-xs font-mono text-indigo-400 border-l border-b border-slate-900 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span>AI OPTIONS STRATEGY PLATFORM</span>
          </div>
          
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                Options Recommendation
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 animate-pulse text-indigo-400" />
              <span
                onClick={() => {
                  setExplanationType("options_analyzer");
                  setShowRatingExplanation(true);
                }}
                title="Click to view options strategy explanation"
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border-2 border-dashed cursor-pointer select-none transition-all flex items-center gap-1.5 active:scale-95 hover:brightness-125 hover:scale-105 relative z-10 pointer-events-auto ${
                  opt.recommendation === "Buy Calls"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : opt.recommendation === "Buy Puts"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {opt.recommendation}
                <HelpCircle className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-2 max-w-2xl">
              {opt.rationale}
            </p>
          </div>
          
          <div className="flex-shrink-0 bg-slate-950/40 border border-slate-900 rounded-xl px-5 py-4 text-center self-start md:self-auto font-mono text-xs text-slate-400 space-y-1 shadow-inner">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Stance Confidence</div>
            <div className="text-xl font-black text-slate-200">{opt.confidence_score.toFixed(1)}%</div>
          </div>
        </div>

        {/* 5 sub-agent strategy cards */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">
            Specialist Options Agent Deliberations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {opt.agents.map((agent, idx) => {
              const isBull = agent.stance.toLowerCase().includes("bull");
              const isBear = agent.stance.toLowerCase().includes("bear");
              const borderCol = isBull ? "border-emerald-500/20" : isBear ? "border-rose-500/20" : "border-slate-800";
              const bgGlow = isBull ? "from-emerald-500/5 to-transparent" : isBear ? "from-rose-500/5 to-transparent" : "from-amber-500/5 to-transparent";

              return (
                <div key={idx} className={`bg-gradient-to-b ${bgGlow} bg-slate-900/60 border ${borderCol} rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg`}>
                  <div className="space-y-1.5">
                    <h5 className="text-[11px] font-bold text-slate-100 flex items-center justify-between uppercase font-mono border-b border-slate-800/80 pb-2">
                      <span>{agent.persona}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        isBull ? "bg-emerald-500/10 text-emerald-400" : isBear ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {agent.stance}
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed italic mt-1">
                      "{agent.summary}"
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block">
                    Agent Role: {agent.persona === "Greeks Agent" ? "Risk Metrics Exposure" :
                                 agent.persona === "Volatility Agent" ? "IV & Gaps Analysis" :
                                 agent.persona === "Earnings Agent" ? "Calendar Events Catalyst" :
                                 agent.persona === "Probability Agent" ? "Expected Target Bounds" :
                                 "Capital Requirements Staging"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderBreakoutHunter = () => {
    if (loadingInsight) return renderTabLoader("Hunting technical breakouts across volume spikes & price action...");
    if (!insightData || !insightData.breakout_hunter) return renderTabError("Could not load breakout hunter analysis.");

    const bh = insightData.breakout_hunter;
    
    return (
      <div className="space-y-6">
        {/* Recommendation Header Banner */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center gap-6 justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500/10 px-4 py-1.5 rounded-bl-xl text-xs font-mono text-emerald-400 border-l border-b border-slate-900 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>AI BREAKOUT HUNTER ENGINE</span>
          </div>
          
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                Primary Breakout Rating
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 animate-pulse text-emerald-400" />
              <span
                onClick={() => {
                  setExplanationType("breakout_hunter");
                  setShowRatingExplanation(true);
                }}
                title="Click to view breakout strategy explanation"
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border-2 border-dashed cursor-pointer select-none transition-all flex items-center gap-1.5 active:scale-95 hover:brightness-125 hover:scale-105 relative z-10 pointer-events-auto ${
                  bh.recommendation === "High Conviction Breakout"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : bh.recommendation === "Avoid Bull Trap"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {bh.recommendation}
                <HelpCircle className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mt-2 max-w-2xl">
              The multi-agent breakout engine scans price boundaries and volume anomalies. 
              Breakout conditions are currently evaluated with a {bh.confidence_score}% alignment rating.
            </p>
          </div>
          
          <div className="flex-shrink-0 bg-slate-950/40 border border-slate-900 rounded-xl px-5 py-4 text-center self-start md:self-auto font-mono text-xs text-slate-400 space-y-1 shadow-inner">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Hunter Score</div>
            <div className="text-xl font-black text-slate-200">{bh.confidence_score.toFixed(1)}%</div>
          </div>
        </div>

        {/* Watchlist Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">
            Ranked Watchlist
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {bh.watchlist.map((item, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
                <div className="absolute top-0 right-0 bg-slate-800/80 px-2.5 py-1 rounded-bl-lg text-[10px] font-bold text-slate-400 font-mono">
                  RANK #{idx + 1}
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-white">{item.ticker}</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{item.score.toFixed(1)} Pts</span>
                  </div>
                  <div className="inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.pattern}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                    {item.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5 sub-agent breakout cards */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">
            Breakout Hunter Committee Deliberations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Volume Spike Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Volume Spike Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{bh.volume_spike_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: RVOL & Block Accumulation</span>
            </div>

            {/* Price Action Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Price Action Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{bh.price_action_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: Resistance & Channels</span>
            </div>

            {/* Market Trend Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Market Trend Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{bh.market_trend_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: Index & Breadth</span>
            </div>

            {/* Sector Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Sector Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{bh.sector_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: ETF Strength & Flows</span>
            </div>

            {/* Confirmation Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Confirmation Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{bh.confirmation_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: Crossovers & Indicators</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAlphaDiscovery = () => {
    if (loadingInsight) return renderTabLoader("Scanning SEC filings, insider transactions, patent databases & news signals across 6 specialist agents...");
    if (!insightData || !insightData.alpha_discovery) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-3">
          <BrainCircuit className="w-10 h-10 text-slate-700" />
          <p className="text-sm font-semibold text-slate-400">No Alpha Signals Yet</p>
          <p className="text-xs text-slate-600 text-center max-w-xs">Search a stock ticker to run the Alpha Discovery Engine and surface under-the-radar opportunities.</p>
        </div>
      );
    }

    const alpha = insightData.alpha_discovery;

    return (
      <div className="space-y-6">
        {/* Banner header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-extrabold">
                Alpha Signals Engine
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Alpha Discovery Engine</h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Find under-the-radar stocks before they breakout. Our 6 multi-agent specialists scan SEC filings, insider transactions, IP patent databases, and news chatter to compute composite Alpha Ratings.
            </p>
          </div>

          <div className="flex items-center gap-6 z-10">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center min-w-[120px] backdrop-blur-sm">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold font-mono">
                Alpha Rating
              </span>
              <button
                onClick={() => {
                  setExplanationType("alpha_discovery");
                  setShowRatingExplanation(true);
                }}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-xs font-extrabold text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all cursor-pointer"
              >
                {alpha.recommendation}
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center min-w-[100px] backdrop-blur-sm">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold font-mono">
                Engine Confidence
              </span>
              <span className="text-lg font-extrabold text-slate-100 block mt-0.5">
                {alpha.confidence_score}%
              </span>
            </div>
          </div>
        </div>

        {/* Watchlist cards */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
            Top Under-The-Radar Alpha Opportunities
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {alpha.watchlist.map((item, idx) => (
              <div key={item.ticker} className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                    <button
                      onClick={() => {
                        setExplanationType("alpha_discovery");
                        setShowRatingExplanation(true);
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-extrabold text-indigo-400 flex items-center gap-1 hover:bg-indigo-500/20 transition-all cursor-pointer"
                    >
                      Alpha: {item.alpha_score}
                      <HelpCircle className="w-2.5 h-2.5 text-indigo-400" />
                    </button>
                  </div>
                  <h5 className="text-sm font-bold text-slate-200">{item.ticker}</h5>
                  <span className="inline-block text-[10px] bg-slate-900 border border-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                    {item.pattern}
                  </span>
                  <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                    {item.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Agent Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
            Engine Specialist Debriefs
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SEC Filing Agent */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  SEC Filing Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{alpha.sec_filing_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: Form 13F & Regulatory Filings</span>
            </div>

            {/* Insider Trading Agent */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Insider Trading Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{alpha.insider_trading_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: Executive C-suite Flows</span>
            </div>

            {/* Patent Agent */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Patent Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{alpha.patent_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: IP Patents & Breakthroughs</span>
            </div>

            {/* Earnings Agent */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Earnings Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{alpha.earnings_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: Profit Margins & Estimates</span>
            </div>

            {/* News Agent */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  News Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{alpha.news_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: Unreported News & Social Chatter</span>
            </div>

            {/* Ranking Agent */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Ranking Agent
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{alpha.ranking_summary}"
                </p>
              </div>
              <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: Alpha Score Factor Weights</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMisinformation = () => {
    if (loadingInsight) return renderTabLoader("Running 5 specialist investigation agents — cross-referencing claims, verifying citations, detecting contradictions...");
    if (!insightData || !insightData.misinformation) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-3">
          <ShieldAlert className="w-10 h-10 text-slate-700" />
          <p className="text-sm font-semibold text-slate-400">No Investigation Reports Yet</p>
          <p className="text-xs text-slate-600 text-center max-w-xs">Search a stock ticker to run the Misinformation Investigation Network and generate credibility reports.</p>
        </div>
      );
    }

    const mis = insightData.misinformation;

    const verdictColor = (v: string) => {
      if (v === "Verified") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      if (v === "False") return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      if (v === "Misleading") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      return "text-slate-400 bg-slate-800 border-slate-700";
    };

    const scoreBarColor = (s: number) =>
      s >= 75 ? "bg-emerald-500" : s >= 45 ? "bg-amber-500" : "bg-rose-500";

    const overallColor =
      mis.overall_verdict === "High Credibility"
        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
        : mis.overall_verdict === "Misinformation Alert"
        ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
        : "text-amber-400 border-amber-500/30 bg-amber-500/10";

    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5 z-10">
            <span className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-extrabold">
              Misinformation Investigation Network
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-1">Evidence-Backed Credibility Reports</h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              5 specialist agents independently investigate the media narrative landscape — cross-referencing claims against official filings, verifying citations, and flagging contradictions to produce an evidence-backed credibility verdict.
            </p>
          </div>

          <div className="flex items-center gap-5 z-10">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center min-w-[130px] backdrop-blur-sm">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold font-mono">Network Verdict</span>
              <button
                onClick={() => { setExplanationType("misinformation"); setShowRatingExplanation(true); }}
                className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-extrabold hover:opacity-80 transition-all cursor-pointer ${overallColor}`}
              >
                {mis.overall_verdict}
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center min-w-[110px] backdrop-blur-sm">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold font-mono">Network Confidence</span>
              <span className="text-lg font-extrabold text-slate-100 block mt-0.5">{mis.network_confidence}%</span>
            </div>
          </div>
        </div>

        {/* Claim Investigation Reports */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-1">Claim Investigation Reports</h4>
          <div className="space-y-3">
            {mis.reports.map((report, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-900 rounded-xl p-4 hover:border-slate-700 transition-all">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${verdictColor(report.verdict)}`}>
                        {report.verdict}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{report.source_count} sources cross-referenced</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 leading-relaxed">"{report.claim}"</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{report.evidence}</p>
                  </div>
                  <div className="flex-shrink-0 w-full md:w-28 text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">Credibility</span>
                    <span className="text-2xl font-extrabold text-slate-100">{report.credibility_score}</span>
                    <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
                      <div className={`h-1 rounded-full ${scoreBarColor(report.credibility_score)}`} style={{ width: `${report.credibility_score}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Agent Debriefs */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-1">Specialist Agent Debriefs</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Fact Agent", summary: mis.fact_agent_summary, focus: "Official Filing Cross-Reference" },
              { label: "Source Agent", summary: mis.source_agent_summary, focus: "Source Credibility Audit" },
              { label: "Citation Agent", summary: mis.citation_agent_summary, focus: "Statistic & Citation Verification" },
              { label: "Contradiction Agent", summary: mis.contradiction_agent_summary, focus: "Claim Contradiction Detection" },
              { label: "Confidence Agent", summary: mis.confidence_agent_summary, focus: "Network Confidence Synthesis" },
            ].map((agent) => (
              <div key={agent.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-200 border-b border-slate-800/80 pb-2 uppercase font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {agent.label}
                  </h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed italic">"{agent.summary}"</p>
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-4 block">Focus: {agent.focus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDCF = () => {
    if (loadingSimulation && !simulationData) {
      return renderTabLoader("Simulating 1,000 discounted cash flow valuation scenarios...");
    }
    if (!simulationData) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <Activity className="h-12 w-12 text-indigo-500 animate-pulse mb-4" />
          <p className="text-sm">No simulation data available. Please select a stock ticker to start.</p>
        </div>
      );
    }

    const {
      current_price,
      estimated_fcf,
      estimated_wacc,
      estimated_growth,
      shares_outstanding,
      volatility,
      bear_value_10p,
      base_value_50p,
      bull_value_90p,
      upside_probability,
      histogram,
    } = simulationData;

    const chartData = histogram.map((bin) => ({
      range: `$${bin.bin_min.toFixed(0)} - $${bin.bin_max.toFixed(0)}`,
      count: bin.count,
      bin_center: (bin.bin_min + bin.bin_max) / 2,
    }));

    const handleSubmitSimulation = (e: React.FormEvent) => {
      e.preventDefault();
      const waccVal = parseFloat(waccInput);
      const growthVal = parseFloat(growthInput);
      const perpVal = parseFloat(perpInput);
      triggerSimulation(
        activeTicker,
        isNaN(waccVal) ? undefined : waccVal,
        isNaN(growthVal) ? undefined : growthVal,
        isNaN(perpVal) ? undefined : perpVal,
        runsInput
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Scenario Analysis & DCF Monte Carlo Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Runs probabilistic valuation loops by randomizing parameters around financial defaults.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Ticker:</span>
            <span className="text-lg font-black text-indigo-400 tracking-wider">{activeTicker}</span>
            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Current: ${current_price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Monte Carlo Explanation Box */}
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl text-slate-300 text-xs md:text-sm leading-relaxed space-y-2">
          <p className="font-semibold text-slate-100 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-indigo-400" />
            How the Monte Carlo Simulation Works:
          </p>
          <p>
            Discounted Cash Flow (DCF) models are highly sensitive to initial inputs. A small 1% change in projected growth rates or discount variables can wildly swing the calculated intrinsic value.
          </p>
          <p>
            Instead of relying on a single static projection, this simulator executes **{runsInput} trials**. In each simulation, the system randomizes the **FCF Growth Rate**, **Discount Rate (WACC)**, and **Perpetuity Growth Rate** using a normal distribution. The growth rate variance is dynamically modeled after the stock's actual **1-year historical price volatility ({volatility.toFixed(1)}%)**.
          </p>
          <p>
            By compiling all trial outcomes, the simulator outputs a probability curve. The **Base Case** represents the median (50th percentile) result, while the **Bear Case (10th percentile)** and **Bull Case (90th percentile)** represent conservative and optimistic value boundaries. The **Upside Probability** measures the percentage of runs that returned an intrinsic value higher than the stock's current trading price.
          </p>
          <p className="border-t border-slate-800 pt-2 text-slate-400">
            <span className="font-semibold text-amber-400">💡 Valuation Note on High-Growth Stocks:</span> If the simulated prices are below the current stock price, this is a mathematically valid and common result. Traditional DCF models value stocks strictly on their raw cash generation (FCF yield) discounted back to the present. High-growth market leaders (like Apple or Nvidia) often trade at high P/FCF premiums (e.g., 40x+) due to brand equity, share buybacks, and low risk premiums. You can adjust the parameters in the control panel to see what assumptions (e.g. higher growth rate or lower WACC) the current market price is implying.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Scale className="h-4 w-4 text-indigo-400" />
              Simulation Assumptions
            </h3>
            <form onSubmit={handleSubmitSimulation} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Discount Rate / WACC (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={waccInput}
                  onChange={(e) => setWaccInput(e.target.value)}
                  placeholder={`${estimated_wacc}% (Estimated)`}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Projected FCF Growth (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={growthInput}
                  onChange={(e) => setGrowthInput(e.target.value)}
                  placeholder={`${estimated_growth}% (Estimated)`}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Perpetuity Growth (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={perpInput}
                  onChange={(e) => setPerpInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold uppercase">Simulation Runs</label>
                <select
                  value={runsInput}
                  onChange={(e) => setRunsInput(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={500}>500 runs</option>
                  <option value={1000}>1000 runs (Recommended)</option>
                  <option value={2000}>2000 runs</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loadingSimulation}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2.5 text-xs font-bold uppercase tracking-wider transition duration-200 flex justify-center items-center gap-2"
              >
                {loadingSimulation ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  "Run Monte Carlo Loop"
                )}
              </button>
            </form>

            <div className="border-t border-slate-800 pt-4 mt-2 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Estimated Base FCF:</span>
                <span className="font-semibold text-slate-200">${(estimated_fcf / 1e6).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span>Historical Volatility:</span>
                <span className="font-semibold text-slate-200">{volatility.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Shares Outstanding:</span>
                <span className="font-semibold text-slate-200">{(shares_outstanding / 1e6).toFixed(1)}M</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">Bear Case (10%)</span>
                <div className="text-xl font-black text-rose-500 mt-1">${bear_value_10p.toFixed(2)}</div>
                <p className="text-[9px] text-slate-500 mt-1">90% of simulations exceed this value.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Median Value (50%)</span>
                <div className="text-xl font-black text-indigo-400 mt-1">${base_value_50p.toFixed(2)}</div>
                <p className="text-[9px] text-slate-500 mt-1">Simulated base intrinsic price midpoint.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Bull Case (90%)</span>
                <div className="text-xl font-black text-emerald-400 mt-1">${bull_value_90p.toFixed(2)}</div>
                <p className="text-[9px] text-slate-500 mt-1">10% of simulations exceed this value.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Upside Probability</span>
                  <div className="text-xl font-black text-amber-500 mt-1">{upside_probability.toFixed(1)}%</div>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      upside_probability > 60 ? "bg-emerald-500" : upside_probability > 30 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${upside_probability}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex justify-between items-center">
                <span>Monte Carlo Price Distribution</span>
                <span className="text-xs font-normal text-slate-500">
                  Current Stock Price: ${current_price.toFixed(2)}
                </span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                      labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                      itemStyle={{ color: "#818cf8" }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => {
                        const isCurrent = current_price >= entry.bin_center - 10 && current_price <= entry.bin_center + 10;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isCurrent ? "#f59e0b" : "#4f46e5"}
                            fillOpacity={isCurrent ? 0.9 : 0.75}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-500 text-center italic">
                Blue bars represent simulated intrinsic value frequencies. Amber highlight indicates the range where the current trading price sits.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Base Case 5-Year DCF Projection (MID Point)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2">Metric (in millions USD)</th>
                  <th className="pb-2 text-right">Year 0</th>
                  <th className="pb-2 text-right">Year 1</th>
                  <th className="pb-2 text-right">Year 2</th>
                  <th className="pb-2 text-right">Year 3</th>
                  <th className="pb-2 text-right">Year 4</th>
                  <th className="pb-2 text-right">Year 5 (Terminal)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-2 font-medium text-slate-400">Projected Free Cash Flow</td>
                  <td className="py-2 text-right font-mono">${(estimated_fcf / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono">${((estimated_fcf * (1 + estimated_growth / 100)) / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono">${((estimated_fcf * Math.pow(1 + estimated_growth / 100, 2)) / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono">${((estimated_fcf * Math.pow(1 + estimated_growth / 100, 3)) / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono">${((estimated_fcf * Math.pow(1 + estimated_growth / 100, 4)) / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono">${((estimated_fcf * Math.pow(1 + estimated_growth / 100, 5)) / 1e6).toFixed(1)}</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-slate-400">Discount Factor (WACC: {estimated_wacc}%)</td>
                  <td className="py-2 text-right font-mono">1.0000</td>
                  <td className="py-2 text-right font-mono">{(1 / (1 + estimated_wacc / 100)).toFixed(4)}</td>
                  <td className="py-2 text-right font-mono">{(1 / Math.pow(1 + estimated_wacc / 100, 2)).toFixed(4)}</td>
                  <td className="py-2 text-right font-mono">{(1 / Math.pow(1 + estimated_wacc / 100, 3)).toFixed(4)}</td>
                  <td className="py-2 text-right font-mono">{(1 / Math.pow(1 + estimated_wacc / 100, 4)).toFixed(4)}</td>
                  <td className="py-2 text-right font-mono">{(1 / Math.pow(1 + estimated_wacc / 100, 5)).toFixed(4)}</td>
                </tr>
                <tr className="bg-slate-950/40">
                  <td className="py-2 font-medium text-indigo-400 font-semibold">Present Value of FCF</td>
                  <td className="py-2 text-right font-mono font-semibold text-slate-400">${(estimated_fcf / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono font-semibold text-indigo-300">${(((estimated_fcf * (1 + estimated_growth / 100)) / (1 + estimated_wacc / 100)) / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono font-semibold text-indigo-300">${(((estimated_fcf * Math.pow(1 + estimated_growth / 100, 2)) / Math.pow(1 + estimated_wacc / 100, 2)) / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono font-semibold text-indigo-300">${(((estimated_fcf * Math.pow(1 + estimated_growth / 100, 3)) / Math.pow(1 + estimated_wacc / 100, 3)) / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono font-semibold text-indigo-300">${(((estimated_fcf * Math.pow(1 + estimated_growth / 100, 4)) / Math.pow(1 + estimated_wacc / 100, 4)) / 1e6).toFixed(1)}</td>
                  <td className="py-2 text-right font-mono font-semibold text-indigo-300">${(((estimated_fcf * Math.pow(1 + estimated_growth / 100, 5)) / Math.pow(1 + estimated_wacc / 100, 5)) / 1e6).toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // TAB CONTENT RENDERERS
  // ──────────────────────────────────────────────

  const renderMoat = () => {
    if (loadingInsight) return renderTabLoader("Analyzing corporate moat strength and pricing power profiles...");
    if (!insightData) return renderTabError("Could not load corporate moat analytics.");

    const moat = insightData.corporate_moat || {
      evaluation: "N/A",
      moat_score: 50.0,
      pricing_power: "N/A",
      moat_summary: "No analysis available",
    };

    const comps = insightData.competitor_comparisons || [];
    const targetGM = insightData.early_warning?.gross_margin || 0.0;
    const targetROE = insightData.capital_allocation?.return_on_equity || 0.0;

    const validComps = comps.filter((c) => c.ticker.toUpperCase() !== activeTicker.toUpperCase());
    const peerAvgGM = validComps.length
      ? validComps.reduce((acc, c) => acc + (c.gross_margin || 0), 0) / validComps.length
      : 0.0;
    const peerAvgROE = validComps.length
      ? validComps.reduce((acc, c) => acc + (c.roe || 0), 0) / validComps.length
      : 0.0;

    const gmPremium = targetGM - peerAvgGM;
    const roePremium = targetROE - peerAvgROE;

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-400" />
              Corporate Moat & Pricing Power Analytics
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Evaluates structural barriers to entry, switching costs, brand strength, and capital efficiency.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getEvalBadge(moat.evaluation)}
            <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
              moat.pricing_power.toLowerCase() === "strong"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : moat.pricing_power.toLowerCase() === "moderate"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}>
              {moat.pricing_power} Pricing Power
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">Moat Scorecard</h3>
            <ScaleBar value={moat.moat_score} min={0} max={100} label="Moat Strength Index" unit="/100" invert={true} />
            <div className="pt-2 text-xs text-slate-400 space-y-3">
              <p>
                A score above **70** signals a **Wide Moat** protected by massive brand equity, high switching costs, or network effects.
              </p>
              <p>
                A score between **35 and 70** indicates a **Narrow Moat** (sustainable but subject to competitor intrusion).
              </p>
              <p>
                A score between **1 and 30** indicates **No Moat** (commodity business vulnerable to price wars and direct competitor encroachment).
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-4">Moat Structure & Pricing Power Synthesis</h3>
              <p className="text-sm text-slate-200 leading-relaxed">{moat.moat_summary}</p>
            </div>
            <div className="text-[10px] text-slate-500 mt-4 border-t border-slate-800 pt-2">
              Analyzed via Multi-Agent pricing benchmarking routines.
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Pricing Power Proof Points (vs. Peers)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Gross Margin Premium</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-white">{targetGM.toFixed(1)}%</span>
                  <span className="text-xs text-slate-500">vs. peer average {peerAvgGM.toFixed(1)}%</span>
                </div>
              </div>
              <div className={`mt-3 text-xs font-semibold flex items-center gap-1 ${gmPremium >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {gmPremium >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    +{gmPremium.toFixed(1)}% Margin Premium (Pricing Power Active)
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4" />
                    {gmPremium.toFixed(1)}% Margin Deficit (Cost Pressure / Lack of Pricing Power)
                  </>
                )}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Capital Return Premium (ROE)</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-white">{targetROE.toFixed(1)}%</span>
                  <span className="text-xs text-slate-500">vs. peer average {peerAvgROE.toFixed(1)}%</span>
                </div>
              </div>
              <div className={`mt-3 text-xs font-semibold flex items-center gap-1 ${roePremium >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {roePremium >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    +{roePremium.toFixed(1)}% ROE Premium (Structural Capital Efficiency)
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4" />
                    {roePremium.toFixed(1)}% ROE Deficit (Relative Inefficiency)
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCommittee = () => {
    if (loadingInsight) return renderTabLoader("Spawning investment committee agents and starting debate...");
    if (!insightData) return renderTabError("Could not load investment committee debate.");
    
    const committee = insightData.investment_committee || {
      consensus_recommendation: "Hold",
      consensus_stance: "Hold",
      consensus_confidence: 50,
      debate_summary: "No debate details available.",
      members: []
    };

    // Compute vote tally from member stances for display
    const bullishVotes = (committee.members || []).filter(m => m.stance.toLowerCase().includes("bull")).length;
    const bearishVotes = (committee.members || []).filter(m => m.stance.toLowerCase().includes("bear")).length;
    const neutralVotes = (committee.members || []).filter(m => !m.stance.toLowerCase().includes("bull") && !m.stance.toLowerCase().includes("bear")).length;
    const consensusRec = committee.consensus_recommendation || committee.consensus_stance || "Hold";

    return (
      <div className="space-y-6">
        {/* Consensus Dashboard Card */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500/10 px-4 py-1.5 rounded-bl-xl text-xs font-mono text-emerald-400 border-l border-b border-slate-900 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>CIO CONSENSUS SYNTHESIS</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between border-b border-slate-800 pb-5 mb-5 mt-2">
            <div>
              <h4 className="text-lg font-bold text-white mb-2">Committee Consensus Verdict</h4>
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{committee.debate_summary}</p>
            </div>
            <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-900 p-4 rounded-xl shadow-lg flex-shrink-0">
              {/* Vote tally */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Vote Tally</span>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{bullishVotes}B</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{neutralVotes}N</span>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">{bearishVotes}S</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Consensus</span>
                <span className="mt-1">{getEvalBadge(consensusRec, true, "committee")}</span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Confidence</span>
                <span className="text-xl font-extrabold text-slate-100 mt-1">{committee.consensus_confidence.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Debate Arena Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(committee.members || []).map((m, idx) => {
            const isBull = m.stance.toLowerCase().includes("bull");
            const isBear = m.stance.toLowerCase().includes("bear");
            const borderCol = isBull ? "border-emerald-500/20" : isBear ? "border-rose-500/20" : "border-slate-800";
            const bgGlow = isBull ? "from-emerald-500/5 to-transparent" : isBear ? "from-rose-500/5 to-transparent" : "from-amber-500/5 to-transparent";
            
            return (
              <div key={idx} className={`bg-gradient-to-b ${bgGlow} bg-slate-900/60 border ${borderCol} rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                    <span className="text-xs font-extrabold text-slate-100">{m.persona}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isBull ? "bg-emerald-500/10 text-emerald-400" : isBear ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {m.stance}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic mt-2">"{m.argument}"</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 uppercase tracking-wide">Confidence:</span>
                  <span className="font-mono font-bold text-slate-200">{m.confidence_score.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDebate = () => {
    if (loadingInsight) return renderTabLoader("Spawning Bull vs Bear Analyst agents and starting debate...");
    if (!insightData) return renderTabError("Could not load Bull vs Bear debate.");

    const debate = insightData.bull_bear_debate || {
      participants: [
        { role: "Bull Analyst", stance: "Bullish", arguments: ["No arguments available."] },
        { role: "Bear Analyst", stance: "Bearish", arguments: ["No arguments available."] },
        { role: "Neutral Analyst", stance: "Neutral", arguments: ["No arguments available."] }
      ],
      moderator_summary: {
        bull_case: ["No bull case points available."],
        bear_case: ["No bear case points available."],
        key_uncertainties: ["No uncertainties points available."]
      }
    };

    const retailTakeaway = debate.moderator_summary?.retail_takeaway || "No layman takeaway available.";
    const actionableChecklist = debate.moderator_summary?.actionable_checklist || ["No actions checklists available."];

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Title Block */}
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <span>Bull vs Bear Debate Platform</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Structured adversarial debate simulated in real-time between specialized analyst agents, moderated to identify core thesis variables.
          </p>
        </div>

        {/* Actionable Retail Takeaway Dashboard */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>THE BOTTOM LINE (Jargon-Free Layman Summary)</span>
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              {retailTakeaway}
            </p>
          </div>
          <div className="lg:col-span-2 bg-slate-950/40 border border-slate-900 rounded-xl p-4 space-y-3">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Actionable Retail Checklist</span>
            </h4>
            <ul className="space-y-2">
              {actionableChecklist.map((item: string, idx: number) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Moderator Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bull Case */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-sm shadow-lg">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-4 border-b border-emerald-500/10 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Moderator: Bull Case Synthesis</span>
            </h4>
            <ul className="space-y-3">
              {(debate.moderator_summary?.bull_case || []).map((point, idx) => (
                <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bear Case */}
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-5 backdrop-blur-sm shadow-lg">
            <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-4 border-b border-rose-500/10 pb-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Moderator: Bear Case Synthesis</span>
            </h4>
            <ul className="space-y-3">
              {(debate.moderator_summary?.bear_case || []).map((point, idx) => (
                <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Uncertainties */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-sm shadow-lg">
            <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-4 border-b border-amber-500/10 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Moderator: Key Uncertainties</span>
            </h4>
            <ul className="space-y-3">
              {(debate.moderator_summary?.key_uncertainties || []).map((point, idx) => (
                <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Debate Transcripts */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Simulated Debate Proceedings</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(debate.participants || []).map((p, idx) => {
              const isBull = p.role.toLowerCase().includes("bull");
              const isBear = p.role.toLowerCase().includes("bear");
              
              let borderCol = "border-slate-800";
              let titleCol = "text-slate-100";
              let badgeCol = "bg-slate-800 text-slate-400";
              
              if (isBull) {
                borderCol = "border-emerald-500/30";
                titleCol = "text-emerald-400";
                badgeCol = "bg-emerald-500/10 text-emerald-400";
              } else if (isBear) {
                borderCol = "border-rose-500/30";
                titleCol = "text-rose-400";
                badgeCol = "bg-rose-500/10 text-rose-400";
              } else {
                borderCol = "border-amber-500/30";
                titleCol = "text-amber-400";
                badgeCol = "bg-amber-500/10 text-amber-400";
              }

              return (
                <div key={idx} className={`bg-slate-900/60 border ${borderCol} rounded-2xl p-5 shadow-xl flex flex-col justify-between backdrop-blur-sm hover:translate-y-[-2px] transition-all duration-300`}>
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${titleCol}`}>{p.role}</span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${badgeCol}`}>{p.stance}</span>
                    </div>
                    <ul className="space-y-3">
                      {(p.arguments || []).map((arg, argIdx) => (
                        <li key={argIdx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                          <span className={`${isBull ? "text-emerald-500" : isBear ? "text-rose-500" : "text-amber-500"} mt-0.5`}>•</span>
                          <span>{arg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    if (!stockData) return null;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold tracking-tight text-white">{stockData.ticker}</span>
                  <span className="text-sm text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono uppercase">{stockData.company_name}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Daily closing prices for the last 30 days (15m delayed)</p>
              </div>
              {stockData.prices.length > 1 && (() => {
                const prices = stockData.prices;
                const last = prices[prices.length - 1].close || 0;
                const prev = prices[prices.length - 2].close || last;
                const diff = last - prev;
                const pct = (diff / prev) * 100;
                const isUp = diff >= 0;
                return (
                  <div className="flex items-center gap-3 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 w-fit">
                    <span className="text-xl font-bold text-slate-100">${last.toFixed(2)}</span>
                    <div className={`flex items-center gap-0.5 text-sm font-semibold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                      {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {isUp ? "+" : ""}{pct.toFixed(2)}%
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="h-[300px] w-full mt-4">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockData.prices.slice(-30)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false}
                      tickFormatter={(str) => {
                        try { return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
                        catch { return str; }
                      }} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                      labelStyle={{ color: "#94a3b8", fontSize: "12px", fontWeight: "bold" }}
                      itemStyle={{ color: "#10b981", fontSize: "13px" }}
                      formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, "Close"]} />
                    <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 6, stroke: "#0f172a", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">Loading chart...</div>
              )}
            </div>
          </div>
        </div>

        {/* TTM Metrics */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">TTM Valuation &amp; Margins</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[
                ["Market Cap", formatNumber(stockData.metrics.market_cap)],
                ["Trailing PE", stockData.metrics.trailing_pe?.toFixed(2) ?? "N/A"],
                ["Trailing EPS", stockData.metrics.trailing_eps ? `$${stockData.metrics.trailing_eps.toFixed(2)}` : "N/A"],
                ["TTM Revenue", formatNumber(stockData.metrics.trailing_revenue)],
                ["Profit Margin", formatPercent(stockData.metrics.profit_margin)],
                ["Operating Margin", formatPercent(stockData.metrics.operating_margin)],
                ["ROE", formatPercent(stockData.metrics.return_on_equity)],
                ["Price/Book", stockData.metrics.price_to_book?.toFixed(2) ?? "N/A"],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-950/60 border border-slate-900 rounded-xl p-3">
                  <span className="block text-xs text-slate-500 font-semibold tracking-wide uppercase">{label}</span>
                  <span className="text-base font-bold text-slate-200 mt-1 block">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-500 text-center mt-6 pt-4 border-t border-slate-800">
            Cache age: {new Date(stockData.cached_at * 1000).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  const renderTabLoader = (msg: string) => (
    <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-12 backdrop-blur-sm text-center flex flex-col items-center justify-center space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      <p className="text-slate-400 text-sm">{msg}</p>
    </div>
  );

  const renderTabError = (msg: string) => (
    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center text-rose-200">
      <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
      <p className="text-sm font-semibold">{msg}</p>
      <p className="text-xs text-rose-400 mt-1">Please try searching the ticker again or check backend services.</p>
    </div>
  );

  const calculateDynamicBacktest = (
    smaPeriod: number,
    rsiBuy: number,
    rsiSell: number,
    stopLossPct: number
  ): BacktestPerformance => {
    const rawPrices = stockData?.prices || [];
    if (rawPrices.length < Math.max(smaPeriod, 20)) {
      return insightData?.backtest || {
        strategy_return_pct: 0,
        benchmark_return_pct: 0,
        sharpe_ratio: 0,
        max_drawdown_pct: 0,
        win_rate_pct: 0,
        total_trades: 0,
        equity_curve: [],
        trades: []
      };
    }

    // Sort prices by date ascending
    const prices = [...rawPrices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 1. Calculate SMA and RSI dynamically
    const closePrices = prices.map(p => p.close || 0);
    const smas: number[] = [];
    const rsis: number[] = [];

    // Simple SMA calculation
    for (let i = 0; i < prices.length; i++) {
      if (i < smaPeriod - 1) {
        smas.push(0);
      } else {
        let sum = 0;
        for (let j = i - smaPeriod + 1; j <= i; j++) {
          sum += closePrices[j];
        }
        smas.push(sum / smaPeriod);
      }
    }

    // Simple RSI 14 calculation
    const rsiPeriod = 14;
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        gains.push(0);
        losses.push(0);
        rsis.push(50); // Default neutral
      } else {
        const diff = closePrices[i] - closePrices[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        gains.push(gain);
        losses.push(loss);

        if (i < rsiPeriod) {
          rsis.push(50);
        } else {
          let avgGain = gains.slice(i - rsiPeriod + 1, i + 1).reduce((s, x) => s + x, 0) / rsiPeriod;
          let avgLoss = losses.slice(i - rsiPeriod + 1, i + 1).reduce((s, x) => s + x, 0) / rsiPeriod;
          if (avgLoss === 0) {
            rsis.push(100);
          } else {
            const rs = avgGain / avgLoss;
            rsis.push(100 - 100 / (1 + rs));
          }
        }
      }
    }

    // 2. Run simulation loop
    const initialCapital = 10000;
    let capital = initialCapital;
    let position = 0; // Number of shares held
    let buyPrice = 0; // Track purchase price for stop-loss
    const trades: TradeRecord[] = [];
    const equityCurve: EquityPoint[] = [];

    const startPrice = closePrices[smaPeriod];
    const benchmarkShares = initialCapital / startPrice;

    for (let i = smaPeriod; i < prices.length; i++) {
      const dateStr = prices[i].date;
      const currentPrice = closePrices[i];
      const rsi = rsis[i];
      const sma = smas[i];

      // Buy when price crosses above SMA, and RSI < buy trigger cap
      const buySignal = currentPrice > sma && rsi < rsiBuy;
      
      // Sell when price crosses below SMA, or RSI goes over overbought trigger limit
      let sellSignal = currentPrice < sma || rsi > rsiSell;

      // Stop-loss trigger logic
      if (position > 0 && stopLossPct > 0) {
        const currentLossPct = ((buyPrice - currentPrice) / buyPrice) * 100;
        if (currentLossPct >= stopLossPct) {
          sellSignal = true; // Force exit
        }
      }

      if (position === 0 && buySignal) {
        position = capital / currentPrice;
        buyPrice = currentPrice;
        const cost = position * currentPrice;
        capital -= cost;
        trades.push({
          date: dateStr,
          action: "BUY",
          price: currentPrice,
          shares: position,
          value: cost,
          pnl: 0
        });
      } else if (position > 0 && sellSignal) {
        const revenue = position * currentPrice;
        capital += revenue;
        const costBasisVal = buyPrice * position;
        const tradePnl = revenue - costBasisVal;
        
        // Mark if exit was stop loss or standard crossover signal
        const isStopLossExit = stopLossPct > 0 && ((buyPrice - currentPrice) / buyPrice) * 100 >= stopLossPct;

        trades.push({
          date: dateStr,
          action: isStopLossExit ? "STOP LOSS" : "SELL",
          price: currentPrice,
          shares: position,
          value: revenue,
          pnl: tradePnl
        });
        position = 0;
        buyPrice = 0;
      }

      const strategyVal = capital + (position * currentPrice);
      const benchmarkVal = benchmarkShares * currentPrice;

      equityCurve.push({
        date: dateStr,
        strategy_value: Math.round(strategyVal * 100) / 100,
        benchmark_value: Math.round(benchmarkVal * 100) / 100
      });
    }

    // 3. Performance Metrics
    const finalStrategyVal = capital + (position * closePrices[closePrices.length - 1]);
    const strategyReturnPct = ((finalStrategyVal - initialCapital) / initialCapital) * 100;
    const benchmarkReturnPct = ((closePrices[closePrices.length - 1] - startPrice) / startPrice) * 100;

    // Max Drawdown
    let peak = initialCapital;
    let maxDd = 0;
    const vals = equityCurve.map(pt => pt.strategy_value);
    for (const v of vals) {
      if (v > peak) peak = v;
      const dd = (peak - v) / peak;
      if (dd > maxDd) maxDd = dd;
    }

    // Sharpe Ratio
    let sharpe = 0;
    if (equityCurve.length > 1) {
      const returns: number[] = [];
      for (let i = 1; i < equityCurve.length; i++) {
        returns.push((equityCurve[i].strategy_value - equityCurve[i - 1].strategy_value) / equityCurve[i - 1].strategy_value);
      }
      const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
      const stdDev = Math.sqrt(variance);
      if (stdDev > 0) {
        sharpe = (meanReturn / stdDev) * Math.sqrt(252);
      }
    }

    // Win Rate
    const sellTrades = trades.filter(t => t.action === "SELL" || t.action === "STOP LOSS");
    const winningTrades = sellTrades.filter(t => (t.pnl || 0) > 0);
    const winRatePct = sellTrades.length > 0 ? (winningTrades.length / sellTrades.length) * 100 : 0;

    return {
      strategy_return_pct: Math.round(strategyReturnPct * 100) / 100,
      benchmark_return_pct: Math.round(benchmarkReturnPct * 100) / 100,
      sharpe_ratio: Math.round(sharpe * 100) / 100,
      max_drawdown_pct: Math.round(maxDd * 10000) / 100,
      win_rate_pct: Math.round(winRatePct * 10) / 10,
      total_trades: trades.length,
      equity_curve: equityCurve,
      trades: trades
    };
  };

  const renderScreener = () => {
    if (loadingInsight) return renderTabLoader("Deliberating stock scanner parameters across multiple AI agents...");
    if (!insightData || !insightData.screener) return renderTabError("Could not load Stock Screener data.");

    const sc = insightData.screener;

    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 z-10 relative">
            <div className="space-y-1.5">
              <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-extrabold">
                Multi-Agent Intelligence Scanner
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-1">AI Stock Screener &amp; Ranked Watchlist</h3>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Ranks a core group of institutional tech leaders. AI specialist agents dynamically evaluate technical patterns, fundamental margins, unusual option flow, and narrative sentiment to yield a weighted **Composite Score**.
              </p>
            </div>
            
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-center min-w-[170px] backdrop-blur-sm z-10 relative">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold font-mono">Ranking System</span>
              <button
                onClick={() => {
                  setExplanationType("screener");
                  setShowRatingExplanation(true);
                }}
                className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-extrabold hover:bg-indigo-500/20 transition-all cursor-pointer active:scale-95"
              >
                HOW IT WORKS
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Layman Analysis block */}
        <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-2xl p-5">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5 font-mono">
            Layman's Quick Guide: What does this watchlist mean?
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            This dashboard scans a select watchlist of market giants and ranks them from best to worst. 
            A higher **Composite Score** indicates that our independent AI agents (Technical, Fundamental, Options, and Sentiment) are in strong bullish alignment. 
            Use this table to identify which core stock currently displays the most robust upside momentum combined with high fundamental safety.
          </p>
        </div>

        {/* Screener Ranked List Card View */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Ranked Core Leaders List</h4>
            <span className="text-[10px] text-slate-500 font-semibold font-mono">Generated: {sc.generated_at}</span>
          </div>
          <div>
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                  <th className="py-2.5 px-2 text-center w-12">Rank</th>
                  <th className="py-2.5 px-2 w-16">Ticker</th>
                  <th className="py-2.5 px-2">Company Name</th>
                  <th className="py-2.5 px-2 text-center w-36">Composite Score</th>
                  <th className="py-2.5 px-2 text-center w-24">Consensus</th>
                  <th className="py-2.5 px-1 text-center w-20">Technical</th>
                  <th className="py-2.5 px-1 text-center w-20">Fundamental</th>
                  <th className="py-2.5 px-1 text-center w-20">Sentiment</th>
                  <th className="py-2.5 px-1 text-center w-20">Options</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/50">
                {sc.watchlist.map((item) => {
                  const getSignalStyle = (sig: string) => {
                    const clean = sig.toUpperCase();
                    if (clean === "BULLISH" || clean === "STRONG" || clean === "BUY") {
                      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                    }
                    if (clean === "BEARISH" || clean === "WEAK" || clean === "SELL") {
                      return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                    }
                    return "bg-slate-800/40 text-slate-400 border border-slate-700/30";
                  };

                  return (
                    <tr 
                      key={item.ticker} 
                      onClick={() => {
                        setSearchTicker(item.ticker);
                        triggerSearch(item.ticker);
                      }}
                      className="hover:bg-slate-800/20 cursor-pointer transition-all duration-150 active:scale-[0.99]"
                    >
                      {/* Rank */}
                      <td className="py-3 px-2 text-center font-mono font-black text-slate-400">
                        #{item.rank}
                      </td>

                      {/* Ticker */}
                      <td className="py-3 px-2 font-extrabold text-slate-100 font-mono text-sm">
                        {item.ticker}
                      </td>

                      {/* Company Name */}
                      <td className="py-3 px-2 text-slate-300 font-semibold truncate">
                        {item.company_name}
                      </td>

                      {/* Composite Score Progress */}
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-bold text-slate-200 min-w-[28px] text-right">{item.composite_score}</span>
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className="bg-indigo-500 h-full rounded-full" 
                              style={{ width: `${item.composite_score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Consensus */}
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] ${getSignalStyle(item.consensus_rating)}`}>
                          {item.consensus_rating}
                        </span>
                      </td>

                      {/* Technical */}
                      <td className="py-3 px-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] ${getSignalStyle(item.technical_signal)}`}>
                          {item.technical_signal}
                        </span>
                      </td>

                      {/* Fundamental */}
                      <td className="py-3 px-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] ${getSignalStyle(item.fundamental_signal)}`}>
                          {item.fundamental_signal}
                        </span>
                      </td>

                      {/* Sentiment */}
                      <td className="py-3 px-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] ${getSignalStyle(item.sentiment_signal)}`}>
                          {item.sentiment_signal}
                        </span>
                      </td>

                      {/* Options */}
                      <td className="py-3 px-1 text-center">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] ${getSignalStyle(item.options_signal)}`}>
                          {item.options_signal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 italic text-center">
            * Click any stock row to immediately search that stock and load its full multi-agent deliberations command center.
          </div>
        </div>
      </div>
    );
  };

  const renderBacktester = () => {
    if (loadingInsight) return renderTabLoader("Simulating historical trading rules against technical momentum data...");
    if (!insightData) return renderTabError("Please search a ticker to initialize the simulator.");

    // Compute dynamic strategy returns using selected sliders parameters
    const bt = calculateDynamicBacktest(
      backtestSmaPeriod,
      backtestRsiBuy,
      backtestRsiSell,
      backtestStopLoss
    );
    const isStrategyWinner = bt.strategy_return_pct >= bt.benchmark_return_pct;
    console.log(`Backtest recalc for active ticker. Strategy: ${bt.strategy_return_pct}%, Benchmark: ${bt.benchmark_return_pct}%, Winner: ${isStrategyWinner ? 'Strategy' : 'Benchmark'}`);

    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 z-10 relative">
            <div className="space-y-1.5 z-10">
              <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-extrabold">
                Quantitative Trading Simulator
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-1">Trend Crossover Backtesting Engine</h3>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Evaluates a simulated <strong>Trend Momentum strategy</strong> over the past year: 
                <span className="text-emerald-400"> Buy</span> when price crosses above the {backtestSmaPeriod}-day SMA and RSI is below {backtestRsiBuy}; 
                <span className="text-rose-400"> Sell</span> when price drops below the {backtestSmaPeriod}-day SMA, RSI exceeds {backtestRsiSell}
                {backtestStopLoss > 0 ? `, or when standard Stop Loss protects capital below -${backtestStopLoss}%` : ""}.
              </p>
            </div>
            
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-center min-w-[150px] backdrop-blur-sm z-10 relative">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold font-mono">Performance vs Buy &amp; Hold</span>
              <button
                onClick={() => {
                  setExplanationType("backtest");
                  setShowRatingExplanation(true);
                }}
                className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded border text-xs font-extrabold transition-all cursor-pointer active:scale-95 hover:brightness-110"
                style={{
                  color: isStrategyWinner ? "#10b981" : "#f43f5e",
                  borderColor: isStrategyWinner ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)",
                  backgroundColor: isStrategyWinner ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)"
                }}
              >
                {isStrategyWinner ? "OUTPERFORMED" : "UNDERPERFORMED"}
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Parameter Sliders */}
        <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* SMA Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-400">SMA Trend Period</span>
              <span className="font-mono text-emerald-400 font-bold">{backtestSmaPeriod} Days</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={backtestSmaPeriod}
              onChange={(e) => setBacktestSmaPeriod(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-[9px] text-slate-500 block leading-relaxed">
              Price cross above SMA indicates standard momentum trends.
            </span>
          </div>

          {/* RSI Buy Cap Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-400">RSI Entry Cap (Buy)</span>
              <span className="font-mono text-emerald-400 font-bold">RSI &lt; {backtestRsiBuy}</span>
            </div>
            <input
              type="range"
              min="40"
              max="80"
              step="1"
              value={backtestRsiBuy}
              onChange={(e) => setBacktestRsiBuy(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-[9px] text-slate-500 block leading-relaxed">
              Prevents entering positions when stock is already overextended.
            </span>
          </div>

          {/* RSI Sell Trigger Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-400">RSI Overbought (Sell)</span>
              <span className="font-mono text-emerald-400 font-bold">RSI &gt; {backtestRsiSell}</span>
            </div>
            <input
              type="range"
              min="55"
              max="90"
              step="1"
              value={backtestRsiSell}
              onChange={(e) => setBacktestRsiSell(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-[9px] text-slate-500 block leading-relaxed">
              Closes positions to lock in profits at overbought extreme values.
            </span>
          </div>

          {/* Stop Loss Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-400">Stop-Loss Protection</span>
              <span className="font-mono text-emerald-400 font-bold">
                {backtestStopLoss === 0 ? "None (Disabled)" : `-${backtestStopLoss}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={backtestStopLoss}
              onChange={(e) => setBacktestStopLoss(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-[9px] text-slate-500 block leading-relaxed">
              Closes trades if price drops this percentage below entry price.
            </span>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            {
              label: "Strategy Return",
              value: `${bt.strategy_return_pct >= 0 ? "+" : ""}${bt.strategy_return_pct}%`,
              sub: "Simulated Strategy",
              color: bt.strategy_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"
            },
            {
              label: "Benchmark Return",
              value: `${bt.benchmark_return_pct >= 0 ? "+" : ""}${bt.benchmark_return_pct}%`,
              sub: "Buy & Hold (1-Year)",
              color: bt.benchmark_return_pct >= 0 ? "text-slate-200" : "text-rose-400"
            },
            {
              label: "Sharpe Ratio",
              value: bt.sharpe_ratio.toFixed(2),
              sub: "Risk-Adjusted Ratio",
              color: bt.sharpe_ratio >= 1.0 ? "text-emerald-400" : "text-slate-300"
            },
            {
              label: "Max Drawdown",
              value: `-${bt.max_drawdown_pct.toFixed(2)}%`,
              sub: "Peak-to-Trough Decline",
              color: "text-rose-400"
            },
            {
              label: "Win Rate",
              value: `${bt.win_rate_pct.toFixed(1)}%`,
              sub: "Profitable Closed Trades",
              color: bt.win_rate_pct >= 50 ? "text-emerald-400" : "text-slate-300"
            },
            {
              label: "Total Trades",
              value: bt.total_trades.toString(),
              sub: "Executed Order Count",
              color: "text-indigo-400"
            }
          ].map((card, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">{card.label}</span>
              <div className="my-2">
                <span className={`text-xl font-black block tracking-tight ${card.color}`}>{card.value}</span>
              </div>
              <span className="text-[9px] text-slate-400 block">{card.sub}</span>
            </div>
          ))}
        </div>

        {/* Equity Curve Chart */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">Historical Equity Curve ($10,000 Starting Capital)</h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bt.equity_curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `$${v.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "12px" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "bold", fontSize: "11px" }}
                  itemStyle={{ fontSize: "11px" }}
                  formatter={(val: any) => [`$${parseFloat(val).toLocaleString()}`, "Portfolio Value"]}
                />
                <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                <Line
                  name="Trend Momentum Strategy"
                  type="monotone"
                  dataKey="strategy_value"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  name="Buy &amp; Hold Benchmark"
                  type="monotone"
                  dataKey="benchmark_value"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade Logs Table */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-4">Simulated Transactions Log</h4>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Shares</th>
                  <th className="py-3 px-4 text-right">Order Value</th>
                  <th className="py-3 px-4 text-right">Realized P&amp;L</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-800/50">
                {bt.trades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">No transactions executed in this period.</td>
                  </tr>
                ) : (
                  bt.trades.map((trade, i) => (
                    <tr key={i} className="hover:bg-slate-800/10">
                      <td className="py-3 px-4 font-mono text-slate-400">{trade.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                          trade.action === "BUY"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                            : trade.action === "STOP LOSS"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                        }`}>
                          {trade.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-200">${trade.price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{trade.shares.toFixed(1)}</td>
                      <td className="py-3 px-4 text-right text-slate-300">${trade.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-bold">
                        {(trade.action === "SELL" || trade.action === "STOP LOSS") && trade.pnl !== undefined ? (
                          <span className={trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTechnical = () => {
    if (loadingInsight) return renderTabLoader("Analyzing technical indicators & SMA trends...");
    if (!insightData) return renderTabError("Could not load technical analysis.");

    const ts = insightData.technical_scales || { rsi14: 50, sma20: 0, sma50: 0, macd_histogram: 0, trend_score: 50, momentum_score: 50 };
    const tm = insightData.technical_momentum || { evaluation: "N/A", rsi_analysis: "No analysis available", trend_analysis: "No analysis available" };

    // Calculate SMA deviations relative to latest close
    const prices = stockData?.prices || [];
    const latestClose = prices.length > 0 ? (prices[prices.length - 1].close || 0) : 0;
    
    // Deviation from SMA (positive means price is above SMA, indicating bullishness)
    const sma20Diff = ts.sma20 ? ((latestClose - ts.sma20) / ts.sma20) * 100 : 0;
    const sma50Diff = ts.sma50 ? ((latestClose - ts.sma50) / ts.sma50) * 100 : 0;
    
    // Normalize MACD to % of price to plot it on a scale bar
    const macdPct = latestClose ? (ts.macd_histogram / latestClose) * 100 : 0;

    // Filters prices to only include days where both SMA20 and SMA50 are fully calculated (not null)
    // This aligns the starting point of Close, SMA20, and SMA50 to the same period.
    const alignedPrices = prices.filter(p => p.sma20 !== null && p.sma20 !== undefined && p.sma50 !== null && p.sma50 !== undefined);
    
    // Slices to the last 30 trading days of aligned price data
    const priceData = alignedPrices.slice(-30).map((p, idx, arr) => {
      let crossover: "Golden Cross" | "Death Cross" | null = null;
      if (idx > 0) {
        const prev = arr[idx - 1];
        if (prev.sma20 && prev.sma50 && p.sma20 && p.sma50) {
          const prev20 = prev.sma20;
          const prev50 = prev.sma50;
          const curr20 = p.sma20;
          const curr50 = p.sma50;
          if (prev20 <= prev50 && curr20 > curr50) {
            crossover = "Golden Cross";
          } else if (prev20 >= prev50 && curr20 < curr50) {
            crossover = "Death Cross";
          }
        }
      }
      return {
        ...p,
        crossover,
      };
    });

    return (
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-lg">Technical Momentum Indicators</h3>
            </div>
            {getEvalBadge(tm.evaluation)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colour-coded scales */}
            <div className="space-y-6">
              <ScaleBar label="RSI (14)" value={ts.rsi14 ?? 0} min={0} max={100} unit="" />
              <ScaleBar label="SMA 20 Position (Price vs SMA20)" value={sma20Diff} min={-10} max={10} unit="%" />
              <ScaleBar label="SMA 50 Position (Price vs SMA50)" value={sma50Diff} min={-10} max={10} unit="%" />
            </div>
            <div className="space-y-6">
              <ScaleBar label="MACD Histogram (Normalized)" value={macdPct} min={-1} max={1} unit="%" />
              <ScaleBar label="Trend Score" value={ts.trend_score ?? 0} min={0} max={100} unit="" />
              <ScaleBar label="Momentum Score" value={ts.momentum_score ?? 0} min={0} max={100} unit="" />
            </div>
          </div>

          {/* Absolute Numerical Values Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800">
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-center">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">SMA 20 Value</span>
              <p className="text-lg font-extrabold text-emerald-400 mt-1">${(ts.sma20 ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-center">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">SMA 50 Value</span>
              <p className="text-lg font-extrabold text-teal-400 mt-1">${(ts.sma50 ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 text-center">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">MACD Histogram (Raw)</span>
              <p className={`text-lg font-extrabold mt-1 ${(ts.macd_histogram ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {(ts.macd_histogram ?? 0).toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
          <h4 className="text-base font-bold text-white border-b border-slate-800 pb-3">AI Technical Analysis</h4>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">RSI Momentum</p>
            <p className="text-sm text-slate-200 leading-relaxed">{tm.rsi_analysis}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Trend &amp; SMA</p>
            <p className="text-sm text-slate-200 leading-relaxed">{tm.trend_analysis}</p>
          </div>
        </div>

        {/* Technical Analysis Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: SMA & Price with Crossover Signals */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center justify-between">
                <span>SMA Crossovers (20 / 50)</span>
                <span className="text-[10px] font-mono text-slate-500">Last 30 Days</span>
              </h4>
              <p className="text-[11px] text-slate-400">Golden Cross (GC) &amp; Death Cross (DC) signals</p>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false}
                    tickFormatter={(str) => {
                      try { return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
                      catch { return str; }
                    }} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                    labelStyle={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold" }}
                    itemStyle={{ fontSize: "11px" }}
                    formatter={(value: any, name: any) => [`$${parseFloat(value).toFixed(2)}`, name]} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "10px" }} />
                  <Line type="monotone" dataKey="close" stroke="#ffffff" strokeWidth={1.5} dot={false} name="Close" />
                  <Line type="monotone" dataKey="sma20" stroke="#10b981" strokeWidth={1.5} dot={false} name="SMA 20" />
                  <Line type="monotone" dataKey="sma50" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="SMA 50" />
                  {priceData.filter(d => d.crossover).map((d, i) => (
                    <ReferenceDot
                      key={i}
                      x={d.date}
                      y={d.close || 0}
                      r={5}
                      fill={d.crossover === "Golden Cross" ? "#10b981" : "#ef4444"}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      label={{
                        value: d.crossover === "Golden Cross" ? "GC" : "DC",
                        position: "top",
                        fill: d.crossover === "Golden Cross" ? "#34d399" : "#f87171",
                        fontSize: 9,
                        fontWeight: "bold"
                      }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: RSI 14 */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center justify-between">
                <span>RSI (14) Indicator</span>
                <span className="text-[10px] font-mono text-slate-500">Last 30 Days</span>
              </h4>
              <p className="text-[11px] text-slate-400">Overbought &gt; 70 and Oversold &lt; 30 zones</p>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false}
                    tickFormatter={(str) => {
                      try { return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
                      catch { return str; }
                    }} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                    labelStyle={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold" }}
                    itemStyle={{ color: "#a855f7", fontSize: "11px" }}
                    formatter={(value: any) => [parseFloat(value).toFixed(2)]} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
                  <Line type="monotone" dataKey="rsi14" stroke="#a855f7" strokeWidth={2} dot={false} name="RSI" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: MACD Histogram */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center justify-between">
                <span>MACD Histogram</span>
                <span className="text-[10px] font-mono text-slate-500">Last 30 Days</span>
              </h4>
              <p className="text-[11px] text-slate-400">Signal crossover divergence bars</p>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false}
                    tickFormatter={(str) => {
                      try { return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
                      catch { return str; }
                    }} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                    labelStyle={{ color: "#94a3b8", fontSize: "11px", fontWeight: "bold" }}
                    itemStyle={{ fontSize: "11px" }}
                    formatter={(value: any) => [parseFloat(value).toFixed(4)]} />
                  <Bar dataKey="macd_histogram" name="MACD Hist">
                    {priceData.map((entry, index) => {
                      const val = entry.macd_histogram ?? 0;
                      return <Cell key={`cell-${index}`} fill={val >= 0 ? "#10b981" : "#ef4444"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFundamentals = () => {
    if (loadingInsight) return renderTabLoader("Comparing metrics to market benchmarks...");
    if (!insightData) return renderTabError("Could not load fundamentals comparison.");

    const fh = insightData.fundamental_health || { evaluation: "N/A", valuation_analysis: "No analysis available", profitability_analysis: "No analysis available" };
    const fc = insightData.fundamental_comparisons || [];

    return (
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-lg">Fundamentals vs. Benchmark</h3>
            </div>
            {getEvalBadge(fh.evaluation)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Metric</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Value</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Benchmark</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">vs. Market</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {fc.map((item, i) => {
                  const val = item.value ?? 0;
                  const bench = item.benchmark ?? 0;
                  const diff = val - bench;
                  const isAbove = diff >= 0;
                  return (
                    <tr key={i} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-200">{item.metric}</td>
                      <td className={`py-3 px-3 text-right font-bold ${isAbove ? "text-emerald-400" : "text-rose-400"}`}>
                        {val.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">{bench.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isAbove ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                          {isAbove ? "▲ Above" : "▼ Below"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400 max-w-xs">{item.explanation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* AI Fundamental Analysis */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-4">
          <h4 className="text-base font-bold text-white border-b border-slate-800 pb-3">AI Fundamental Analysis</h4>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Valuation Check</p>
            <p className="text-sm text-slate-200 leading-relaxed">{fh.valuation_analysis}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Profitability &amp; Efficiency</p>
            <p className="text-sm text-slate-200 leading-relaxed">{fh.profitability_analysis}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderRisk = () => {
    if (loadingInsight) return renderTabLoader("Computing annualized volatility, Sharpe ratio, and drawdowns...");
    if (!insightData) return renderTabError("Could not load risk metrics.");

    const rm = insightData.risk_metrics || { annual_volatility: 0, sharpe_ratio: 0, max_drawdown: 0, avg_daily_return: 0 };
    const risks = insightData.key_risks || [];

    return (
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-lg">Risk Metrics (Colour-Coded)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Annual Volatility: higher = more risk, invert=true so low value = green */}
              <ScaleBar label="Annual Volatility" value={rm.annual_volatility ?? 0} min={0} max={60} unit="%" invert={true} />
              {/* Max Drawdown: higher = worse, invert=true */}
              <ScaleBar label="Max Drawdown" value={rm.max_drawdown ?? 0} min={0} max={50} unit="%" invert={true} />
            </div>
            <div className="space-y-6">
              {/* Sharpe Ratio: higher = better. Map 0–3, invert=false */}
              <ScaleBar label="Sharpe Ratio" value={Math.max(rm.sharpe_ratio ?? 0, 0)} min={0} max={3} unit="" invert={false} />
              {/* Avg Daily Return: map -1 to +1, invert=false (higher=better) */}
              <ScaleBar
                label="Avg Daily Return"
                value={(rm.avg_daily_return ?? 0) + 1}
                min={0}
                max={2}
                unit="%"
                invert={false}
              />
            </div>
          </div>

          {/* Numeric summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: "Annual Volatility", val: `${(rm.annual_volatility ?? 0).toFixed(2)}%`, level: (rm.annual_volatility ?? 0) < 20 ? "Low" : (rm.annual_volatility ?? 0) < 40 ? "Medium" : "High", good: (rm.annual_volatility ?? 0) < 20 },
              { label: "Sharpe Ratio", val: (rm.sharpe_ratio ?? 0).toFixed(2), level: (rm.sharpe_ratio ?? 0) > 1 ? "Good" : (rm.sharpe_ratio ?? 0) > 0.5 ? "Fair" : "Poor", good: (rm.sharpe_ratio ?? 0) > 1 },
              { label: "Max Drawdown", val: `${(rm.max_drawdown ?? 0).toFixed(2)}%`, level: (rm.max_drawdown ?? 0) < 15 ? "Low" : (rm.max_drawdown ?? 0) < 30 ? "Medium" : "High", good: (rm.max_drawdown ?? 0) < 15 },
              { label: "Avg Daily Return", val: `${(rm.avg_daily_return ?? 0).toFixed(2)}%`, level: (rm.avg_daily_return ?? 0) > 0.1 ? "Positive" : (rm.avg_daily_return ?? 0) > 0 ? "Marginal" : "Negative", good: (rm.avg_daily_return ?? 0) > 0 },
            ].map(({ label, val, level, good }) => (
              <div key={label} className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</span>
                <span className="text-xl font-bold text-slate-100">{val}</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded w-fit ${good ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                  {level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Risks from AI */}
        {risks.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <h4 className="text-base font-bold text-white border-b border-slate-800 pb-3 mb-4">Key Risk Factors (AI Identified)</h4>
            <ul className="space-y-3">
              {risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                  <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderSentiment = () => {
    if (loadingInsight) return renderTabLoader("Scanning news feeds & articles...");
    if (!insightData) return renderTabError("Could not load sentiment analysis.");

    const sent = insightData.sentiment || { evaluation: "N/A", news_summary: "No summary available" };

    return (
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-lg">News Sentiment</h3>
            </div>
            {getEvalBadge(sent.evaluation)}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{sent.news_summary}</p>
        </div>

        {/* News articles */}
        {stockData && stockData.news && stockData.news.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-slate-400" /> Recent Market Coverage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stockData.news.map((item, idx) => (
                <a key={idx} href={item.link || "#"} target="_blank" rel="noopener noreferrer"
                  className="bg-slate-900/40 border border-slate-900 hover:border-slate-700 p-4 rounded-xl flex flex-col justify-between transition-all group backdrop-blur-sm">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-400">{item.publisher || "Finance Feed"}</span>
                      {item.publish_time && <span>{new Date(item.publish_time * 1000).toLocaleDateString()}</span>}
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">{item.title}</h4>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-3 group-hover:underline">
                    Read Article <ArrowUpRight className="w-3 h-3" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInsider = () => {
    if (loadingInsight) return renderTabLoader("Fetching SEC Form 4 filings and Form 13F holders...");
    if (!insightData) return renderTabError("Could not load insider & institutional flow.");

    const inf = insightData.insider_flow || { evaluation: "N/A", insider_summary: "No analysis available", institutional_summary: "No analysis available" };
    const transactions = insightData.insider_transactions || [];
    const holders = insightData.institutional_holders || [];

    return (
      <div className="space-y-6">
        {/* AI Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white">Insider Trading Sentiment</h4>
                {getEvalBadge(inf.evaluation)}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{inf.insider_summary}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white">Institutional Holdings Flow</h4>
                <span className="text-[10px] font-mono text-slate-500">13F Filings</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{inf.institutional_summary}</p>
            </div>
          </div>
        </div>

        {/* Transactions and Holders Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Insider Transactions Table */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <h4 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-3">Recent Insider Transactions (Form 4)</h4>
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent insider transactions reported.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Insider Name</th>
                      <th className="py-2 px-3">Position</th>
                      <th className="py-2 px-3 text-center">Type</th>
                      <th className="py-2 px-3 text-right">Shares</th>
                      <th className="py-2 px-3 text-right">Value (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => {
                      const isBuy = tx.transaction_type.toLowerCase().includes("buy") || tx.transaction_type.toLowerCase().includes("purchase");
                      const isSell = tx.transaction_type.toLowerCase().includes("sell") || tx.transaction_type.toLowerCase().includes("sale");
                      return (
                        <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                          <td className="py-2 px-3 text-slate-400 font-mono">{tx.date}</td>
                          <td className="py-2 px-3 font-semibold text-slate-200">{tx.insider_name}</td>
                          <td className="py-2 px-3 text-slate-400">{tx.position}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBuy ? "bg-emerald-500/10 text-emerald-400" :
                              isSell ? "bg-rose-500/10 text-rose-400" :
                              "bg-slate-800 text-slate-300"
                            }`}>
                              {tx.transaction_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-300">
                            {tx.shares !== null && tx.shares !== undefined ? tx.shares.toLocaleString() : "N/A"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-100 font-semibold">
                            {tx.value !== null && tx.value !== undefined ? `$${tx.value.toLocaleString()}` : "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Institutional Holders Table */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <h4 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-3">Top Institutional Shareholders</h4>
            {holders.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No institutional holding data reported.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-2 px-3">Shareholder</th>
                      <th className="py-2 px-3 text-right">Shares Held</th>
                      <th className="py-2 px-3 text-right">Value (USD)</th>
                      <th className="py-2 px-3 text-right">Portfolio Pct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.map((holder, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                        <td className="py-2 px-3 font-semibold text-slate-200">{holder.holder}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300">
                          {holder.shares !== null && holder.shares !== undefined ? holder.shares.toLocaleString() : "N/A"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-100 font-semibold">
                          {holder.value !== null && holder.value !== undefined ? `$${holder.value.toLocaleString()}` : "N/A"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-400 font-bold">
                          {holder.pct_held !== null && holder.pct_held !== undefined ? `${holder.pct_held.toFixed(2)}%` : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMacro = () => {
    if (loadingInsight) return renderTabLoader("Fetching global yield curves and sector indexes...");
    if (!insightData) return renderTabError("Could not load macroeconomic trends.");

    const mf = insightData.macro_flow || { evaluation: "N/A", macro_summary: "No analysis available", sector_summary: "No analysis available" };
    const indicators = insightData.macro_indicators || [];
    const etf = insightData.sector_etf || { ticker: "SPY", name: "S&P 500", current_price: 0, one_month_return: 0, six_month_return: 0 };

    return (
      <div className="space-y-6">
        {/* AI Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white">Macro Environment Analysis</h4>
                {getEvalBadge(mf.evaluation)}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{mf.macro_summary}</p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h4 className="text-base font-bold text-white">Sector Performance Analysis</h4>
                <span className="text-[10px] font-mono text-slate-500">Benchmark: {etf.ticker}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{mf.sector_summary}</p>
            </div>
          </div>
        </div>

        {/* Macro & Sector Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* US 10-Year yield or generic indicators */}
          {indicators.map((ind, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Indicator</span>
                <h4 className="text-sm font-bold text-white mt-1 mb-2">{ind.name}</h4>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-extrabold text-slate-100">{ind.value}%</span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    ind.change >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {ind.change >= 0 ? "+" : ""}{ind.change}%
                  </span>
                </div>
              </div>
              <div className="mt-4 border-t border-slate-800 pt-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Status:</span>
                <span className="text-[11px] text-slate-200 font-bold ml-1.5">{ind.status}</span>
              </div>
            </div>
          ))}

          {/* Sector ETF performance card */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Benchmark Sector ETF</span>
              <h4 className="text-sm font-bold text-white mt-1 mb-1">{etf.name} ({etf.ticker})</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Current Price: ${etf.current_price.toFixed(2)}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex flex-col">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">1-Month Return</span>
                  <span className={`text-sm font-bold mt-1 ${etf.one_month_return >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {etf.one_month_return >= 0 ? "+" : ""}{etf.one_month_return}%
                  </span>
                </div>
                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex flex-col">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">6-Month Return</span>
                  <span className={`text-sm font-bold mt-1 ${etf.six_month_return >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {etf.six_month_return >= 0 ? "+" : ""}{etf.six_month_return}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompetitors = () => {
    if (loadingInsight) return renderTabLoader("Fetching competitor benchmark multiples and growth figures...");
    if (!insightData) return renderTabError("Could not load competitor benchmarking details.");

    const ca = insightData.competitor_analysis || { evaluation: "N/A", competitor_summary: "No analysis available" };
    const comparisons = insightData.competitor_comparisons || [];

    return (
      <div className="space-y-6">
        {/* AI Competitor Summary Card */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white">Competitor Benchmarking Summary</h4>
              {getEvalBadge(ca.evaluation)}
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{ca.competitor_summary}</p>
          </div>
        </div>

        {/* Competitor Benchmarking Metrics Table */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <h4 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-3">Key Financial Peer Matrix</h4>
          {comparisons.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No competitor comparison metrics found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2 px-3">Company (Ticker)</th>
                    <th className="py-2 px-3 text-right">Trailing P/E</th>
                    <th className="py-2 px-3 text-right">Return on Equity (ROE)</th>
                    <th className="py-2 px-3 text-right">Revenue Growth</th>
                    <th className="py-2 px-3 text-right">Gross Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c, idx) => {
                    const isTarget = c.ticker.toUpperCase() === activeTicker.toUpperCase();
                    return (
                      <tr key={idx} className={`border-b border-slate-800/50 hover:bg-slate-900/20 ${isTarget ? "bg-emerald-500/5 font-semibold border-l-2 border-l-emerald-500" : ""}`}>
                        <td className="py-3 px-3 text-slate-200">
                          {c.company_name} <span className="text-slate-400 font-mono text-[10px] ml-1">({c.ticker})</span>
                          {isTarget && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">Target</span>}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-100">
                          {c.pe_ratio !== null ? c.pe_ratio.toFixed(2) : "N/A"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {c.roe !== null ? `${c.roe.toFixed(2)}%` : "N/A"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {c.revenue_growth !== null ? `${c.revenue_growth.toFixed(2)}%` : "N/A"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {c.gross_margin !== null ? `${c.gross_margin.toFixed(2)}%` : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOptions = () => {
    if (loadingInsight) return renderTabLoader("Fetching options chain aggregates and unusual contracts...");
    if (!insightData) return renderTabError("Could not load options derivatives flows.");

    const of = insightData.options_flow || { evaluation: "N/A", put_call_oi_ratio: 1.0, put_call_volume_ratio: 1.0, flow_summary: "No analysis available" };
    const unusual = insightData.unusual_options || [];

    return (
      <div className="space-y-6">
        {/* AI Options Summary Card */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white">Options Sentiment Analysis</h4>
              {getEvalBadge(of.evaluation)}
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{of.flow_summary}</p>
          </div>
        </div>

        {/* Options Ratios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Put/Call Ratio (Open Interest)</span>
              <h4 className="text-2xl font-extrabold text-slate-100 mt-2">{of.put_call_oi_ratio.toFixed(3)}</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ratios below 0.8 reflect bullish speculation (calls outnumber puts). Ratios above 1.2 suggest active protective put hedging (puts outnumber calls).
              </p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Put/Call Ratio (Volume)</span>
              <h4 className="text-2xl font-extrabold text-slate-100 mt-2">{of.put_call_volume_ratio.toFixed(3)}</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Reflects real-time trading flow dynamics. Volume ratios fluctuate more quickly than open interest and flag intra-day speculative surges.
              </p>
            </div>
          </div>
        </div>

        {/* Unusual Options Table */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <h4 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-3">Unusual Options Activity (Highest Open Interest Contracts)</h4>
          {unusual.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No unusual options contracts reported.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2 px-3">Strike Price</th>
                    <th className="py-2 px-3 text-center">Contract Type</th>
                    <th className="py-2 px-3 text-right">Open Interest (OI)</th>
                    <th className="py-2 px-3 text-right">Volume</th>
                    <th className="py-2 px-3 text-right">Implied Volatility (IV)</th>
                  </tr>
                </thead>
                <tbody>
                  {unusual.map((contract, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                      <td className="py-3 px-3 font-semibold text-slate-100">${contract.strike.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          contract.type.toLowerCase() === "call" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {contract.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {contract.open_interest.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {contract.volume.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-100 font-semibold">
                        {contract.implied_volatility.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEarnings = () => {
    if (loadingInsight) return renderTabLoader("Fetching quarterly earnings reports and consensus estimates...");
    if (!insightData) return renderTabError("Could not load earnings intelligence details.");

    const ei = insightData.earnings_intelligence || { evaluation: "N/A", next_earnings_date: null, next_eps_estimate: null, intelligence_summary: "No analysis available" };
    const history = insightData.earnings_history || [];

    return (
      <div className="space-y-6">
        {/* AI Earnings Summary Card */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white">Earnings Outlook & Surprise Analysis</h4>
              {getEvalBadge(ei.evaluation)}
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{ei.intelligence_summary}</p>
          </div>
        </div>

        {/* Forward Projections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Scheduled Next Release Date</span>
              <h4 className="text-xl font-extrabold text-slate-100 mt-2">{ei.next_earnings_date || "Not Announced"}</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Reflects the company's next projected earnings announcement date. Shifts in this date can signal management's readiness to report.
              </p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Analysts EPS Forecast Target</span>
              <h4 className="text-xl font-extrabold text-slate-100 mt-2">
                {ei.next_eps_estimate !== null ? `$${ei.next_eps_estimate.toFixed(2)}` : "N/A"}
              </h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Consensus EPS estimate that the company must meet or exceed to avoid negative surprises.
              </p>
            </div>
          </div>
        </div>

        {/* Earnings History Table */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <h4 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-3">Historical EPS Surprises</h4>
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No historical quarterly surprises reported.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2 px-3">Release Date</th>
                    <th className="py-2 px-3 text-right">Estimated EPS</th>
                    <th className="py-2 px-3 text-right">Reported EPS</th>
                    <th className="py-2 px-3 text-right">Surprise Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-900/20">
                      <td className="py-3 px-3 font-semibold text-slate-100">{h.quarter}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {h.eps_estimate !== null ? `$${h.eps_estimate.toFixed(2)}` : "N/A"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {h.eps_actual !== null ? `$${h.eps_actual.toFixed(2)}` : "N/A"}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-semibold ${
                        (h.surprise_pct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {h.surprise_pct !== null ? `${h.surprise_pct.toFixed(2)}%` : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWarning = () => {
    if (loadingInsight) return renderTabLoader("Evaluating operational stability and computed risk warnings...");
    if (!insightData) return renderTabError("Could not load early warning flags.");

    const ew = insightData.early_warning || { evaluation: "Safe", deteriorating_signals_count: 0, warning_summary: "No analysis available" };
    const alerts = insightData.warning_alerts || [];
    
    const grossVal = ew.gross_margin !== undefined ? ew.gross_margin / 100 : null;
    const operVal = ew.operating_margin !== undefined ? ew.operating_margin / 100 : null;
    const currentVal = ew.current_ratio;
    const debtVal = ew.debt_to_equity;

    return (
      <div className="space-y-6">
        {/* AI Warning Summary Card */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white">Operational Stability & Credit Ratios</h4>
              <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                ew.evaluation.toLowerCase().includes("high") ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                ew.evaluation.toLowerCase().includes("warning") ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {ew.evaluation}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{ew.warning_summary}</p>
          </div>
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Gross Profit Margin</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">{grossVal !== undefined && grossVal !== null ? `${(grossVal * 100).toFixed(2)}%` : "N/A"}</h4>
            <span className="text-[10px] text-slate-400 mt-1">Target: &gt; 20%</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Operating Margin</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">{operVal !== undefined && operVal !== null ? `${(operVal * 100).toFixed(2)}%` : "N/A"}</h4>
            <span className="text-[10px] text-slate-400 mt-1">Target: &gt; 8%</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Current Ratio</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">{currentVal !== undefined && currentVal !== null ? currentVal.toFixed(2) : "N/A"}</h4>
            <span className="text-[10px] text-slate-400 mt-1">Target: &gt; 1.0</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Debt / Equity</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">{debtVal !== undefined && debtVal !== null ? `${debtVal.toFixed(2)}%` : "N/A"}</h4>
            <span className="text-[10px] text-slate-400 mt-1">Target: &lt; 150%</span>
          </div>
        </div>

        {/* Warning Alerts List */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <h4 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-3">Active Warning Flags ({ew.deteriorating_signals_count})</h4>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <span className="text-emerald-400 text-sm font-bold">✓ Safe Health Status</span>
              <p className="text-xs text-slate-400 mt-1">No operational or liquidity stress signals are currently flagged.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {alerts.map((alert, idx) => (
                <li key={idx} className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 flex items-start space-x-3 text-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <span className="text-xs">{alert}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  const renderValuation = () => {
    if (loadingInsight) return renderTabLoader("Computing intrinsic target anchors and valuation multiples...");
    if (!insightData) return renderTabError("Could not load valuation metrics.");

    const vo = insightData.valuation_opportunity || { evaluation: "Fairly Valued", intrinsic_value: null, analyst_target_median: null, implied_upside_pct: 0.0, valuation_summary: "No analysis available" };
    const latestPrice = stockData?.prices?.[0]?.close || 0;

    return (
      <div className="space-y-6">
        {/* AI Valuation Summary Card */}
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white">Valuation Opportunities & Expected Returns</h4>
              <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                vo.evaluation.toLowerCase().includes("under") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                vo.evaluation.toLowerCase().includes("over") ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {vo.evaluation}
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{vo.valuation_summary}</p>
          </div>
        </div>

        {/* Pricing Anchors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Current Market Price</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">${latestPrice.toFixed(2)}</h4>
            <span className="text-[10px] text-slate-400 mt-1">Live trading price</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Graham Intrinsic Value</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">
              {vo.intrinsic_value !== null ? `$${vo.intrinsic_value.toFixed(2)}` : "N/A"}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1">Based on EPS & Book Value</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Analyst Target Median</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">
              {vo.analyst_target_median !== null ? `$${vo.analyst_target_median.toFixed(2)}` : "N/A"}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1">Consensus target median</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Implied Analyst Upside</span>
            <h4 className={`text-lg font-extrabold mt-1 ${(vo.implied_upside_pct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {vo.implied_upside_pct !== null ? `${vo.implied_upside_pct.toFixed(2)}%` : "0.00%"}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1">Expected Return levels</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCapital = () => {
    if (loadingInsight) return renderTabLoader("Evaluating management decisions and capital efficiency...");
    if (!insightData) return renderTabError("Could not load capital allocation metrics.");

    const ca = insightData.capital_allocation || {
      evaluation: "Balanced",
      dividend_yield: 0.0,
      payout_ratio: 0.0,
      return_on_equity: 0.0,
      return_on_assets: 0.0,
      allocation_summary: "No analysis available"
    };

    return (
      <div className="space-y-6">
        <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-lg">Management Capital Allocation</h3>
            </div>
            {getEvalBadge(ca.evaluation)}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{ca.allocation_summary}</p>
        </div>

        {/* Capital Efficiency Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Return on Equity (ROE)</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">
              {ca.return_on_equity !== null ? `${ca.return_on_equity.toFixed(2)}%` : "N/A"}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1">Profitability relative to equity</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Return on Assets (ROA)</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">
              {ca.return_on_assets !== null ? `${ca.return_on_assets.toFixed(2)}%` : "N/A"}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1">Profitability relative to assets</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Dividend Yield</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">
              {ca.dividend_yield !== null ? `${ca.dividend_yield.toFixed(2)}%` : "0.00%"}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1">Annual dividend yield rate</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 backdrop-blur-sm shadow-xl flex flex-col">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Payout Ratio</span>
            <h4 className="text-lg font-extrabold text-slate-100 mt-1">
              {ca.payout_ratio !== null ? `${ca.payout_ratio.toFixed(2)}%` : "0.00%"}
            </h4>
            <span className="text-[10px] text-slate-400 mt-1">Dividends paid relative to income</span>
          </div>
        </div>
      </div>
    );
  };

  const renderExecutiveThesis = () => {
    if (!insightData) return null;
    const rec = insightData.overall_recommendation || { rating: "N/A", summary: "No recommendation available" };
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-xs font-mono border-l border-b border-slate-900 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400">
          {insightData.is_mock ? (
            <span className="text-amber-400 font-bold">⚠️ OFFLINE RULE FALLBACK</span>
          ) : (
            <span>AI ANALYSIS LOG</span>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h3 className="font-bold text-white text-base">Executive Investment Thesis</h3>
          <div className="ml-auto flex items-center gap-2">
            {insightData.model_name && (
              <span className="px-2 py-1 rounded text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {insightData.model_name}
              </span>
            )}
            {rec.confidence_score !== undefined && (
              <span className="px-2 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Confidence: {rec.confidence_score.toFixed(1)}%
              </span>
            )}
            {getEvalBadge(rec.rating, true)}
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed w-full">{rec.summary}</p>
        <div className="text-[10px] text-slate-500 mt-4 border-t border-slate-800 pt-2 flex items-center gap-2 flex-wrap">
          <span>Model: {insightData.model_name}</span>
          <span>•</span>
          <span>Analysis: {new Date(insightData.generated_at * 1000).toLocaleString()}</span>
          {insightResponseMs !== null && (
            <>
              <span>•</span>
              <span
                className={`flex items-center gap-1 font-mono font-semibold ${
                  insightResponseMs < 5000
                    ? "text-emerald-400"
                    : insightResponseMs < 20000
                    ? "text-amber-400"
                    : "text-rose-400"
                }`}
              >
                ⏱ {(insightResponseMs / 1000).toFixed(1)}s response
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* UNIFIED COMPACT ALERTS BANNER */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>
                <span className="font-semibold text-amber-300">Data Feed Alert:</span> Free tier financial data delayed by 15m.
              </span>
              <span className="hidden md:inline text-amber-500/40">|</span>
              <span className="hidden md:inline font-semibold text-amber-300">Disclaimer:</span>
              <span className="hidden md:inline text-amber-200/90">Educational research tool. Not financial advice.</span>
            </div>
            <button
              onClick={() => setShowFullDisclaimer(!showFullDisclaimer)}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider underline focus:outline-none self-start md:self-auto"
            >
              {showFullDisclaimer ? "Hide Disclaimer" : "View Full Disclaimer & Advisor Advisory"}
            </button>
          </div>
          {showFullDisclaimer && (
            <div className="mt-2 border-t border-amber-500/20 pt-2 text-[11px] text-amber-200/90 leading-relaxed flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
              <div>
                This platform is an educational AI research tool and does not constitute professional investment, tax, or legal advice. Whether a security fits your portfolio depends entirely on your personal investment goals, time horizon, and risk tolerance. Please consult a certified financial advisor before executing any market transactions.
              </div>
            </div>
          )}
        </div>

        {/* HEADER & SEARCH */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200 flex items-center gap-2">
              STPIS Financial Engine <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Stock Trend Prediction and Insight System</p>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex w-full md:w-auto max-w-sm items-center relative">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search ticker (e.g. AAPL, NVDA)..."
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                className="w-full uppercase pl-9 pr-20 py-1.5 rounded-lg bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs placeholder-slate-500 transition-all text-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={loadingData}
              className="absolute right-1 top-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold px-3 py-1 rounded text-[10px] hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center gap-1 shadow"
            >
              {loadingData ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : "SEARCH"}
            </button>
          </form>
        </header>

        {!loadingData && !stockData && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-900 rounded-3xl backdrop-blur-sm text-center px-4 max-w-2xl mx-auto mt-12 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
              <Search className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Search Ticker to Analyze</h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
              Enter a US stock ticker (e.g., AAPL, TSLA, NVDA) in the search bar above to trigger the multi-agent Investment Committee deliberation and quantitative safety overrides.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["AAPL", "TSLA", "NVDA", "MSFT", "AMZN"].map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => {
                    setSearchTicker(symbol);
                    triggerSearch(symbol);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-all active:scale-95 cursor-pointer"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* THESIS SECTION ABOVE TABS */}
        {!loadingData && stockData && (
          <div className="mt-4">
            {insightData ? renderExecutiveThesis() : loadingInsight ? (
              <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm animate-pulse flex items-center justify-center text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 mr-2" />
                <span>Generating AI Investment Thesis...</span>
              </div>
            ) : null}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start space-x-3 text-rose-200">
            <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-400" />
            <div className="text-sm"><span className="font-semibold text-rose-300">Error:</span> {error}</div>
          </div>
        )}

        {/* LOADING DATA SKELETON */}
        {loadingData && (
          <div className="flex items-center gap-3 text-slate-400 text-sm animate-pulse py-8">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Fetching stock financials for {activeTicker}...</span>
          </div>
        )}

        {/* MOBILE SELECT NAVIGATION (Visible on screens < lg) */}
        {!loadingData && stockData && (
          <div className="block lg:hidden w-full">
            <label htmlFor="mobile-tab-select" className="sr-only">Select Tab</label>
            <select
              id="mobile-tab-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabKey)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-semibold"
            >
              {TAB_GROUPS.map((group) => (
                <optgroup key={group.title} label={group.title} className="bg-slate-950 text-slate-400 font-bold">
                  {group.tabs.map((tab) => (
                    <option key={tab.key} value={tab.key} className="bg-slate-900 text-slate-100 font-medium">
                      {tab.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {/* SIDEBAR + WORKSPACE GRID */}
        {!loadingData && stockData && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* SIDEBAR NAVIGATION (Hidden on mobile, block on lg) */}
            <aside className="hidden lg:block lg:col-span-1 space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm shadow-xl space-y-4 sticky top-6">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono px-2">
                  Command Center
                </div>
                <nav className="space-y-4">
                  {TAB_GROUPS.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <div key={group.title} className="space-y-1.5">
                        <h3 className="text-[11px] font-extrabold text-slate-300 flex items-center gap-2 px-2 uppercase tracking-wide">
                          <GroupIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{group.title}</span>
                        </h3>
                        <div className="space-y-0.5 pl-3.5 border-l border-slate-800/80 ml-2">
                          {group.tabs.map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                              <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer block truncate relative group ${
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500 pl-2 font-bold"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 pl-3"
                                }`}
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* MAIN WORKSPACE CONTENT */}
            <main className="lg:col-span-3 space-y-6">
              {/* TAB CONTENT */}
              <div className="bg-slate-900/40 border border-slate-900/60 rounded-2xl p-6 backdrop-blur-sm min-h-[500px]">
                {activeTab === "overview" && renderOverview()}
                {activeTab === "technical" && renderTechnical()}
                {activeTab === "fundamentals" && renderFundamentals()}
                {activeTab === "risk" && renderRisk()}
                {activeTab === "sentiment" && renderSentiment()}
                {activeTab === "insider" && renderInsider()}
                {activeTab === "macro" && renderMacro()}
                {activeTab === "competitor" && renderCompetitors()}
                {activeTab === "options" && renderOptions()}
                {activeTab === "earnings" && renderEarnings()}
                {activeTab === "warning" && renderWarning()}
                {activeTab === "valuation" && renderValuation()}
                {activeTab === "capital" && renderCapital()}
                {activeTab === "committee" && renderCommittee()}
                {activeTab === "debate" && renderDebate()}
                {activeTab === "moat" && renderMoat()}
                {activeTab === "dcf" && renderDCF()}
                {activeTab === "psychology" && renderPsychology()}
                {activeTab === "screener" && renderScreener()}
                {activeTab === "options_analyzer" && renderOptionsAnalyzer()}
                {activeTab === "breakout_hunter" && renderBreakoutHunter()}
                {activeTab === "alpha_discovery" && renderAlphaDiscovery()}
                {activeTab === "misinformation" && renderMisinformation()}
                {activeTab === "backtest" && renderBacktester()}
              </div>
            </main>
          </div>
        )}

        <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${showRatingExplanation ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
          {/* Backdrop click to close */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowRatingExplanation(false)} />
          
          <div className={`relative w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-start overflow-y-auto z-10 transition-transform duration-300 ease-out transform ${
            showRatingExplanation ? "translate-x-0" : "translate-x-full"
          }`}>
                <button
                  onClick={() => setShowRatingExplanation(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white text-base font-bold focus:outline-none bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                >
                  ✕
                </button>
              {explanationType === "committee" ? (
                <>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-white">Consensus Voting System Breakdown</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    The committee consensus recommendation is calculated based on a majority vote mechanism across the 8 specialist AI agents:
                  </p>
                  
                  <div className="space-y-4">
                    {/* Agent 1 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        1. Value Investor Agent
                      </h4>
                      <p className="text-xs text-slate-400">
                        Evaluates P/E bounds relative to historical benchmarks. Votes **Bullish** if P/E &le; 25, **Bearish** if P/E &gt; 30, and **Neutral** otherwise.
                      </p>
                    </div>

                    {/* Agent 2 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        2. Growth Investor Agent
                      </h4>
                      <p className="text-xs text-slate-400">
                        Evaluates profit margin buffers. Votes **Bullish** if margins &gt; 12%, **Bearish** if margins &lt; 4%, and **Neutral** otherwise.
                      </p>
                    </div>

                    {/* Agent 3 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        3. Quant Agent
                      </h4>
                      <p className="text-xs text-slate-400">
                        Evaluates short-term technical indicators. Stance matches price momentum relative to the 20-day SMA trend.
                      </p>
                    </div>

                    {/* Agent 4 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        4. Macro Strategist Agent
                      </h4>
                      <p className="text-xs text-slate-400">
                        Evaluates yields and industry performance. Votes **Bullish** if benchmark sector index ETF (e.g. XLK) shows positive 1-month returns.
                      </p>
                    </div>

                    {/* Agent 5 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        5. Risk Officer Agent
                      </h4>
                      <p className="text-xs text-slate-400">
                        Evaluates balance sheet warning alerts. Votes **Bearish** if 2+ flags are active, **Bullish** if 0 flags are active, and **Neutral** otherwise.
                      </p>
                    </div>

                    {/* Agent 6 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        6. Warren Buffett Agent
                      </h4>
                      <p className="text-xs text-slate-400">
                        Focuses on durable competitive advantages (moats), stable returns on capital, and compounding margins. Votes **Bullish** if Return on Equity &gt; 20% and Return on Assets &gt; 10%.
                      </p>
                    </div>

                    {/* Agent 7 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        7. Peter Lynch Agent
                      </h4>
                      <p className="text-xs text-slate-400">
                        Focuses on Growth-to-Valuation ratios (PEG) and PEG scaling ratios. Votes **Bullish** if Trailing P/E &lt; 20 and revenue growth &gt; 10%.
                      </p>
                    </div>

                    {/* Agent 8 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        8. Momentum Agent
                      </h4>
                      <p className="text-xs text-slate-400">
                        Focuses on technical breakout configurations and strong price trend directions. Stance follows short-term momentum signals.
                      </p>
                    </div>

                    {/* Voting Logic */}
                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/25 text-xs space-y-1.5 text-slate-300">
                      <span className="font-extrabold text-indigo-400 block">Consensus Verdict Logic:</span>
                      <p>• **Buy**: Triggered if Bullish votes exceed both Bearish and Neutral votes.</p>
                      <p>• **Sell**: Triggered if Bearish votes exceed both Bullish and Neutral votes.</p>
                      <p>• **Hold**: Triggered in any other case (e.g., tie or absolute Neutral majority).</p>
                    </div>
                  </div>
                </>
              ) : explanationType === "psychology" ? (
                <div className="flex-1 flex flex-col gap-4 justify-between h-full min-h-[calc(100vh-100px)]">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3 flex-shrink-0">
                    <BrainCircuit className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-white">Contrarian Psychology Signal Logic</h2>
                  </div>
                  
                  {/* Signal 1: Buy */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-emerald-500/30">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Contrarian BUY (Extreme Panic)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when panic_level &ge; 65%. Widespread market panic, rising capitulation indexes, and heavy downside volume spikes indicate extreme crowd fear. Historically, buying during these high-stress regime bounds offers the highest probability margin of safety, as asset liquidations by retail hands create underpriced value entry points. Widespread capitulation represents a prime window to begin staging accumulative long positions.
                    </p>
                  </div>

                  {/* Signal 2: Sell */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-rose-500/30">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Contrarian SELL (Extreme Euphoria)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when euphoria_level &ge; 65%. High euphoria, excessive buyer FOMO, and overextended technical channels suggest severe speculative greed. According to valuation benchmarks, crowd overoptimism inflates price multiples, creating a major risk of near-term multiple compression, correction regimes, and sudden reversals. It is highly recommended to tighten stop-losses, pause buy-ins, and secure options hedges.
                    </p>
                  </div>

                  {/* Signal 3: Hold */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-amber-500/30">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      HOLD / ACCUMULATE (Balanced Sentiment)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when panic and euphoria indices remain in a balanced channel (both under 65%). Neutral crowd sentiment represents structural consolidation with no directional market extremes. Recommendation centers on conservative dollar-cost averaging and stable portfolio staging inside existing baseline support anchors rather than chasing options flow or sector momentum.
                    </p>
                  </div>

                  {/* Multi-Agent Psychology Roles */}
                  <div className="bg-emerald-500/5 p-5 rounded-xl border border-emerald-500/20 text-xs flex-1 flex flex-col justify-center">
                    <span className="font-extrabold text-emerald-400 block mb-2">Psychology Sub-Agent Inputs:</span>
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Fear & Greed Agents:</strong> Evaluate short-term technical stress levels and buyer FOMO indexes.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Media & Retail Agents:</strong> Track news headlines and retail social discussion channels.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Institutional Agent:</strong> Evaluates call/put options open interest configurations.</p>
                    </div>
                  </div>
                </div>
              ) : explanationType === "options_analyzer" ? (
                <div className="flex-1 flex flex-col gap-4 justify-between h-full min-h-[calc(100vh-100px)]">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3 flex-shrink-0">
                    <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-white">Options Strategy Recommendation Breakdown</h2>
                  </div>
                  
                  {/* Strategy 1: Buy Calls */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-emerald-500/30">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Buy Calls (Bullish Momentum)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Recommended when the technical, fundamental, and committee agents align on a strong bullish stance. Buying call options allows you to leverage upward momentum with limited downside risk (premium paid). Best suited in low Implied Volatility environments to avoid high premium decay.
                    </p>
                  </div>

                  {/* Strategy 2: Buy Puts */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-rose-500/30">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Buy Puts (Bearish Hedge)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Recommended when structural risks, macro headwinds, or balance sheet warnings signal a downward correction. Buying puts provides leverage on stock price drops and serves as a portfolio hedge during volatility expansions.
                    </p>
                  </div>

                  {/* Strategy 3: Spread Calls */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-amber-500/30">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Spread Calls (Theta & Volatility Mitigation)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Recommended when expecting moderate bullish price movement but facing high Implied Volatility (e.g. before earnings) or Theta decay. By buying a call and simultaneously selling a higher strike call, you reduce net premium cost, define risk, and mitigate the impact of IV crush.
                    </p>
                  </div>

                  {/* Options Sub-Agent Descriptions */}
                  <div className="bg-indigo-500/5 p-5 rounded-xl border border-indigo-500/20 text-xs flex-1 flex flex-col justify-center">
                    <span className="font-extrabold text-indigo-400 block mb-2">Options Committee Inputs:</span>
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Greeks Agent:</strong> Evaluates delta ratios and theta decay speed constraints.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Volatility Agent:</strong> Analyzes implied volatility percentiles and skew smile curvatures.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Earnings Agent:</strong> Maps upcoming earnings date moves against volatility expectations.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Probability Agent:</strong> Evaluates strike price target probability of completion distributions.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Risk Agent:</strong> Models margin requirements, leverage barriers, and maximum loss profiles.</p>
                    </div>
                  </div>
                </div>
              ) : explanationType === "breakout_hunter" ? (
                <div className="flex-1 flex flex-col gap-4 justify-between h-full min-h-[calc(100vh-100px)]">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-white">Technical Breakout Strategy Logic</h2>
                  </div>
                  
                  {/* Strategy 1: High Conviction Breakout */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-emerald-500/30">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      High Conviction Breakout (Bullish Continuation)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when key resistance lines are breached with a high volume spike multiplier (RVOL &gt; 1.5x) and positive sector flows. Indicates strong institutional backing, offering a high probability of breakout trend continuation.
                    </p>
                  </div>

                  {/* Strategy 2: Avoid Bull Trap */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-rose-500/30">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Avoid Bull Trap (Divergence Warnings)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when price tests resistance but lacks volume confirmation, or exhibits bearish RSI/MACD divergence. Warns that the breakout is unsustainable, indicating high risk of rejection and downside reversals.
                    </p>
                  </div>

                  {/* Strategy 3: Accumulation Zone */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-amber-500/30">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Accumulation Zone (Consolidation Regime)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when the price is consolidating within tight support and resistance channels with average volume. Suggests staging positions using standard dollar-cost averaging near baseline supports, waiting for the next catalyst.
                    </p>
                  </div>

                  {/* Breakout Hunter Committee Inputs */}
                  <div className="bg-emerald-500/5 p-5 rounded-xl border border-emerald-500/20 text-xs flex-1 flex flex-col justify-center">
                    <span className="font-extrabold text-emerald-400 block mb-2">Breakout Hunter Inputs:</span>
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Volume Spike Agent:</strong> Monitors relative volume multipliers (RVOL) and block trade accumulation.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Price Action Agent:</strong> Tracks resistance breakthroughs, pattern formations, and target price gaps.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Market Trend Agent:</strong> Measures overall index trends and price breadth boundaries.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Sector Agent:</strong> Analyzes relative strength index of sector-specific ETF flows.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Confirmation Agent:</strong> Verifies momentum oscillators to avoid fakeouts and bull traps.</p>
                    </div>
                  </div>
                </div>
              ) : explanationType === "alpha_discovery" ? (
                <div className="flex-1 flex flex-col gap-4 justify-between h-full min-h-[calc(100vh-100px)]">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3 flex-shrink-0">
                    <BrainCircuit className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-white">Alpha Score Methodology</h2>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    The <strong className="text-indigo-300">Alpha Score</strong> is a composite signal strength rating (0–100) synthesized from 6 independent AI specialist agents. Each agent independently scans a different data source and contributes a weighted sub-score to the final Alpha Rating.
                  </p>

                  {/* Strategy 1: High Conviction Alpha */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-indigo-500/30">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      High Conviction Alpha (Score ≥ 80)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when multiple independent agents simultaneously detect a cluster of strong pre-breakout signals — e.g., stealth institutional buying in 13F filings, confirmed insider cluster purchases, AND a new approved patent. This represents the highest-confidence hidden alpha opportunity.
                    </p>
                  </div>

                  {/* Strategy 2: Growth Catalyst */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-amber-500/30">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Growth Catalyst (Score 55–79)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when at least 2–3 agents identify meaningful early signals (e.g., earnings guidance upgrades + rising social chatter). The stock shows promising momentum building but has not yet crossed into full institutional confirmation. Consider watching closely.
                    </p>
                  </div>

                  {/* Strategy 3: Wait for Confirmation */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-rose-500/30">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Wait for Confirmation (Score &lt; 55)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when signals are mixed or sparse across agent sources. Not enough convergence exists to act with confidence. Wait for additional confirming signals before entering a position.
                    </p>
                  </div>

                  {/* Alpha Score Component Breakdown */}
                  <div className="bg-indigo-500/5 p-5 rounded-xl border border-indigo-500/20 text-xs flex-1 flex flex-col justify-center">
                    <span className="font-extrabold text-indigo-400 block mb-2">Alpha Score Component Weights:</span>
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>SEC Filing Agent (20%):</strong> Scans Form 13F filings for unusual institutional accumulation patterns.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Insider Trading Agent (25%):</strong> Detects C-suite cluster buys — the strongest pre-breakout signal.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Patent Agent (15%):</strong> Monitors new IP approvals that signal technology moat expansion.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Earnings Agent (20%):</strong> Flags early margin expansion signals and guidance revisions.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>News Agent (10%):</strong> Detects early-stage retail and media sentiment shifts before they go mainstream.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Ranking Agent (10%):</strong> Synthesizes all sub-scores into the final composite Alpha Score ranking.</p>
                    </div>
                  </div>
                </div>
              ) : explanationType === "misinformation" ? (
                <div className="flex-1 flex flex-col gap-4 justify-between h-full min-h-[calc(100vh-100px)]">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3 flex-shrink-0">
                    <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-white">Misinformation Network — Verdict Guide</h2>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    The <strong className="text-rose-300">Network Verdict</strong> is the output of 5 specialist agents independently investigating the current media narrative landscape. Each agent scrutinizes a different dimension of information credibility and contributes to a network-wide confidence score.
                  </p>

                  {/* Verdict 1: High Credibility */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-emerald-500/30">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      High Credibility (Confidence ≥ 75%)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when the majority of circulating narratives are confirmed by multiple independent, high-authority sources and cross-referenced against official filings. Investors can act with high confidence that the information landscape is factually grounded.
                    </p>
                  </div>

                  {/* Verdict 2: Mixed Signals */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-amber-500/30">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Mixed Signals (Confidence 45–74%)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when verified narratives coexist with unverified or misleading claims. Some media sources may be amplifying early-stage or unconfirmed developments. Cross-reference any claims before trading on them.
                    </p>
                  </div>

                  {/* Verdict 3: Misinformation Alert */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-rose-500/30">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Misinformation Alert (Confidence &lt; 45%)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Triggered when the Contradiction Agent detects systematic factual distortions or when the Source Agent identifies narratives originating predominantly from low-credibility outlets. Exercise extreme caution — the narrative environment may be actively manipulated.
                    </p>
                  </div>

                  {/* Agent Methodology */}
                  <div className="bg-rose-500/5 p-5 rounded-xl border border-rose-500/20 text-xs flex-1 flex flex-col justify-center">
                    <span className="font-extrabold text-rose-400 block mb-2">Investigation Agent Methodology:</span>
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Fact Agent:</strong> Cross-references each claim against official SEC filings, earnings transcripts, and regulatory databases.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Source Agent:</strong> Scores the credibility and editorial track record of each source publishing the narrative.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Citation Agent:</strong> Verifies that cited statistics and data points trace back to real, traceable primary sources.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Contradiction Agent:</strong> Flags logical inconsistencies between current claims and historical statements or known facts.</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">• <strong>Confidence Agent:</strong> Synthesizes all agent signals into the final network confidence score and overall verdict.</p>
                    </div>
                  </div>
                </div>
              ) : explanationType === "backtest" ? (
                <div className="flex-1 flex flex-col gap-4 justify-between h-full min-h-[calc(100vh-100px)]">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3 flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-white">Backtesting Strategy Explained</h2>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    This simulator compares the historical returns of the <strong className="text-emerald-300">Trend Crossover strategy</strong> against a simple <strong className="text-slate-300">Buy &amp; Hold benchmark</strong> over the past year.
                  </p>

                  {/* strategy definition */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-emerald-500/30">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Trend Crossover Strategy ({backtestSmaPeriod}-Day SMA)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Starts with an initial capital of **$10,000**. The engine executes a position entry (**BUY**) when the stock price crosses above the **{backtestSmaPeriod}-day** Simple Moving Average (SMA), provided the 14-day RSI is below **{backtestRsiBuy}** (not overbought). It closes the position (**SELL**) when the price drops below the **{backtestSmaPeriod}-day** SMA or the RSI exceeds **{backtestRsiSell}**
                      {backtestStopLoss > 0 ? `, or when a standard Stop Loss exits below -${backtestStopLoss}%` : ""}.
                    </p>
                  </div>

                  {/* benchmark definition */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-slate-500/30">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      Buy &amp; Hold Benchmark
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Simulates purchasing **$10,000** worth of the ticker at the start price of the 1-year historical window and holding it without executing any trades. The benchmark value simply tracks the market price of the stock.
                    </p>
                  </div>

                  {/* Possible performance outcomes */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-emerald-500/30">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Performance Rating Outcomes
                    </h4>
                    <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                      <p>
                        <strong className="text-emerald-400">• OUTPERFORMED:</strong> Triggered when the Trend Crossover strategy's net cumulative return percentage is **higher** than the Buy &amp; Hold benchmark. This indicates that moving to cash during downward crossovers successfully avoided losses or preserved capital better than holding.
                      </p>
                      <p>
                        <strong className="text-rose-400">• UNDERPERFORMED:</strong> Triggered when the Trend Crossover strategy's net return is **lower** than the Buy &amp; Hold benchmark. This typically occurs in strong, uninterrupted bull markets where trading commissions/slippage or late indicators cut into standard buy-and-hold profits.
                      </p>
                    </div>
                  </div>

                  {/* Value derivation */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex-1 flex flex-col justify-center transition-all hover:border-indigo-500/30">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      How Values Are Derived
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      • **Portfolio Equity:** Calculated daily. Cash remaining plus the market value of any held shares.
                      <br />• **Sharpe Ratio:** Annualized average daily returns divided by daily standard deviation (using 252 trading days).
                      <br />• **Max Drawdown:** The largest peak-to-trough drop in strategy value over the year.
                    </p>
                  </div>
                </div>
              ) : explanationType === "screener" ? (
                <div className="flex-1 flex flex-col gap-4 justify-between h-full min-h-[calc(100vh-100px)]">
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3 flex-shrink-0">
                    <BrainCircuit className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-white">Screener Score Methodology</h2>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    The **Composite Score** ranks stocks on a scale of 0 to 100 based on weighted metrics evaluated by 4 different specialized AI agent domains.
                  </p>

                  {/* Weight 1 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      1. Technical momentum (30% Weight)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Evaluates relative strength index (RSI), Simple Moving Average alignments (SMA 20/50), MACD momentum, and overall directional breakouts.
                    </p>
                  </div>

                  {/* Weight 2 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      2. Fundamental Health (30% Weight)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Measures trailing P/E bounds, operational margins (Gross, Profit, and Operating), EPS growth rates, and Return on Equity (ROE).
                    </p>
                  </div>

                  {/* Weight 3 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      3. Sentiment Alignment (20% Weight)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Synthesizes social media narratives, news articles, and insider filing flows to calculate aggregate bullish/bearish scores.
                    </p>
                  </div>

                  {/* Weight 4 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      4. Options Open Interest (20% Weight)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Scans Put/Call Open Interest ratios and Unusual Option volumes to gauge institutional hedging and speculative leverages.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-extrabold text-white">System Scoring Rules Breakdown</h2>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    The rating badge is generated programmatically by calculating a composite factor score (from 0 to 100) based on strict quantitative rules to prevent AI contradiction relative to actual market values:
                  </p>
                  
                  <div className="space-y-4">
                    {/* Rule 1 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        1. Technical Factors (up to ±15 points)
                      </h4>
                      <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                        <li>Price above 20-day Simple Moving Average (SMA): <span className="text-emerald-400 font-semibold">+10 points</span></li>
                        <li>Price below 20-day SMA: <span className="text-rose-400 font-semibold">-10 points</span></li>
                        <li>Relative Strength Index (RSI) Stable (40 to 65) or Oversold (&lt;30): <span className="text-emerald-400 font-semibold">+5 points</span></li>
                        <li>RSI Overbought (&gt;70): <span className="text-rose-400 font-semibold">-5 points</span></li>
                      </ul>
                    </div>

                    {/* Rule 2 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        2. Fundamental Metrics (up to +20 / -30 points)
                      </h4>
                      <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                        <li>Valuation: Trailing P/E between 0 and 22: <span className="text-emerald-400 font-semibold">+10 points</span></li>
                        <li>Valuation: Trailing P/E above 35 or negative: <span className="text-rose-400 font-semibold">-15 points</span></li>
                        <li>Margin Premium: profit margin &gt; 15%: <span className="text-emerald-400 font-semibold">+10 points</span>; under 5%: <span className="text-rose-400 font-semibold">-15 points</span></li>
                        <li>ROE efficiency: &gt; 15%: <span className="text-emerald-400 font-semibold">+10 points</span>; under 5%: <span className="text-rose-400 font-semibold">-15 points</span></li>
                      </ul>
                    </div>

                    {/* Rule 3 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        3. Insider Activity Factor (up to ±5 points)
                      </h4>
                      <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                        <li>Presence of corporate insider buy transaction files: <span className="text-emerald-400 font-semibold">+5 points</span></li>
                        <li>Absence or liquidation trades: <span className="text-rose-400 font-semibold">-5 points</span></li>
                      </ul>
                    </div>

                    {/* Rule 4 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        4. Macro & Sector Strength (up to ±10 points)
                      </h4>
                      <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                        <li>Benchmark Sector Index ETF 1-Month positive returns: <span className="text-emerald-400 font-semibold">+5 points</span></li>
                        <li>Sector ETF 6-Month positive returns: <span className="text-emerald-400 font-semibold">+5 points</span></li>
                      </ul>
                    </div>

                    {/* Rule 5 */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        5. Capital Stewardship Factors (up to +15 / -20 points)
                      </h4>
                      <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                        <li>Capital efficiency: Return on Equity &gt; 15.0%: <span className="text-emerald-400 font-semibold">+10 points</span>; &lt; 5.0%: <span className="text-rose-400 font-semibold">-15 points</span></li>
                        <li>Payout security: Dividend payout ratio between 10% and 60%: <span className="text-emerald-400 font-semibold">+5 points</span></li>
                      </ul>
                    </div>

                    {/* Verdict Scale */}
                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/25 flex flex-col sm:flex-row justify-between text-xs gap-3">
                      <div>
                        <span className="font-extrabold text-indigo-400 block mb-0.5">Rating Verdict Scale:</span>
                        <span className="text-slate-300">Composite Score decides the final recommendation badge.</span>
                      </div>
                      <div className="flex gap-2 self-start sm:set-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Buy (Score &gt;= 80)</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">Hold (21 to 79)</span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">Sell (&lt;= 20)</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

      </div>
    </div>
  );
}
