from pydantic import BaseModel, Field
from typing import List, Optional

class TechnicalMomentumAnalysis(BaseModel):
    evaluation: str
    rsi_analysis: str
    trend_analysis: str

class FundamentalHealthAnalysis(BaseModel):
    evaluation: str
    valuation_analysis: str
    profitability_analysis: str

class SentimentAnalysis(BaseModel):
    evaluation: str
    news_summary: str

class OverallRecommendation(BaseModel):
    rating: str
    summary: str
    confidence_score: float

class RiskMetrics(BaseModel):
    annual_volatility: float
    sharpe_ratio: float
    max_drawdown: float
    avg_daily_return: float

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

class InsiderTransactionItem(BaseModel):
    date: str
    transaction_type: str
    shares: float
    value: float
    insider_name: str
    position: str

class InstitutionalHolderItem(BaseModel):
    holder: str
    shares: float
    value: float
    pct_held: float

class InsiderFlowAnalysis(BaseModel):
    evaluation: str
    insider_summary: str
    institutional_summary: str

class MacroIndicatorItem(BaseModel):
    name: str
    value: float
    change: float
    status: str

class SectorEtfData(BaseModel):
    ticker: str
    name: str
    current_price: float
    one_month_return: float
    six_month_return: float

class MacroFlowAnalysis(BaseModel):
    evaluation: str
    macro_summary: str
    sector_summary: str

class CompetitorComparisonItem(BaseModel):
    ticker: str
    company_name: str
    pe_ratio: Optional[float] = None
    roe: Optional[float] = None
    revenue_growth: Optional[float] = None
    gross_margin: Optional[float] = None

class CompetitorFlowAnalysis(BaseModel):
    evaluation: str
    competitor_summary: str

class UnusualOptionContract(BaseModel):
    strike: float
    type: str
    open_interest: float
    volume: float
    implied_volatility: float

class OptionsFlowAnalysis(BaseModel):
    evaluation: str
    put_call_oi_ratio: float
    put_call_volume_ratio: float
    flow_summary: str

class EarningsHistoryItem(BaseModel):
    quarter: str
    eps_estimate: Optional[float] = None
    eps_actual: Optional[float] = None
    surprise_pct: Optional[float] = None

class EarningsFlowAnalysis(BaseModel):
    evaluation: str
    next_earnings_date: Optional[str] = None
    next_eps_estimate: Optional[float] = None
    intelligence_summary: str

class EarlyWarningFlowAnalysis(BaseModel):
    evaluation: str
    deteriorating_signals_count: int
    warning_summary: str
    gross_margin: float
    operating_margin: float
    current_ratio: float
    debt_to_equity: float

class ValuationOpportunityFlowAnalysis(BaseModel):
    evaluation: str
    intrinsic_value: Optional[float] = None
    analyst_target_median: Optional[float] = None
    implied_upside_pct: Optional[float] = None
    valuation_summary: str
    dcf_bear_value: Optional[float] = None
    dcf_base_value: Optional[float] = None
    dcf_bull_value: Optional[float] = None
    dcf_upside_probability: Optional[float] = None

class CapitalAllocationFlowAnalysis(BaseModel):
    evaluation: str
    dividend_yield: Optional[float] = None
    payout_ratio: Optional[float] = None
    return_on_equity: Optional[float] = None
    return_on_assets: Optional[float] = None
    allocation_summary: str

class CommitteeMemberDebate(BaseModel):
    persona: str
    stance: str
    confidence_score: float
    argument: str

class InvestmentCommitteeAnalysis(BaseModel):
    consensus_recommendation: str
    consensus_confidence: float
    debate_summary: str
    members: List[CommitteeMemberDebate]

class CorporateMoatAnalysis(BaseModel):
    evaluation: str
    moat_score: float
    pricing_power: str
    moat_summary: str

class MarketPsychologyAnalysis(BaseModel):
    panic_level: float
    euphoria_level: float
    contrarian_opportunities: List[str]
    fear_agent_summary: str
    greed_agent_summary: str
    media_sentiment_summary: str
    retail_sentiment_summary: str
    institutional_sentiment_summary: str

class OptionsAgentAnalysis(BaseModel):
    persona: str
    stance: str
    summary: str

class MultiAgentOptionsAnalysis(BaseModel):
    recommendation: str
    confidence_score: float
    rationale: str
    agents: List[OptionsAgentAnalysis]

class BreakoutWatchlistItem(BaseModel):
    ticker: str
    score: float
    pattern: str
    rationale: str

class BreakoutHunterAnalysis(BaseModel):
    recommendation: str
    confidence_score: float
    watchlist: List[BreakoutWatchlistItem]
    volume_spike_summary: str
    price_action_summary: str
    market_trend_summary: str
    sector_summary: str
    confirmation_summary: str

class AlphaDiscoveryItem(BaseModel):
    ticker: str
    alpha_score: float
    pattern: str
    rationale: str

class AlphaDiscoveryAnalysis(BaseModel):
    recommendation: str
    confidence_score: float
    watchlist: List[AlphaDiscoveryItem]
    sec_filing_summary: str
    insider_trading_summary: str
    patent_summary: str
    earnings_summary: str
    news_summary: str
    ranking_summary: str

class MisinfoReportItem(BaseModel):
    claim: str
    verdict: str
    credibility_score: float
    source_count: int
    evidence: str

class MisinformationAnalysis(BaseModel):
    overall_verdict: str
    network_confidence: float
    reports: List[MisinfoReportItem]
    fact_agent_summary: str
    source_agent_summary: str
    citation_agent_summary: str
    contradiction_agent_summary: str
    confidence_agent_summary: str

class EquityPoint(BaseModel):
    date: str
    strategy_value: float
    benchmark_value: float

class TradeRecord(BaseModel):
    date: str
    action: str
    price: float
    shares: float
    value: float
    pnl: Optional[float] = None

class BacktestPerformance(BaseModel):
    strategy_return_pct: float
    benchmark_return_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    win_rate_pct: float
    total_trades: int
    equity_curve: List[EquityPoint]
    trades: List[TradeRecord]

class ScreenerStockItem(BaseModel):
    rank: int
    ticker: str
    company_name: str
    composite_score: float
    consensus_rating: str
    technical_signal: str
    fundamental_signal: str
    sentiment_signal: str
    options_signal: str

class ScreenerAnalysis(BaseModel):
    generated_at: str
    watchlist: List[ScreenerStockItem]

class StockInsightResponse(BaseModel):
    ticker: str
    options_analyzer: Optional[MultiAgentOptionsAnalysis] = None
    breakout_hunter: Optional[BreakoutHunterAnalysis] = None
    alpha_discovery: Optional[AlphaDiscoveryAnalysis] = None
    misinformation: Optional[MisinformationAnalysis] = None
    backtest: Optional[BacktestPerformance] = None
    screener: Optional[ScreenerAnalysis] = None
    technical_momentum: TechnicalMomentumAnalysis
    fundamental_health: FundamentalHealthAnalysis
    sentiment: SentimentAnalysis
    key_risks: List[str]
    overall_recommendation: OverallRecommendation
    risk_metrics: RiskMetrics
    technical_scales: TechnicalScales
    fundamental_comparisons: List[FundamentalComparisonItem]
    insider_flow: InsiderFlowAnalysis
    insider_transactions: List[InsiderTransactionItem]
    institutional_holders: List[InstitutionalHolderItem]
    macro_flow: MacroFlowAnalysis
    macro_indicators: List[MacroIndicatorItem]
    sector_etf: SectorEtfData
    competitor_analysis: CompetitorFlowAnalysis
    competitor_comparisons: List[CompetitorComparisonItem]
    options_flow: OptionsFlowAnalysis
    unusual_options: List[UnusualOptionContract]
    earnings_intelligence: EarningsFlowAnalysis
    earnings_history: List[EarningsHistoryItem]
    early_warning: EarlyWarningFlowAnalysis
    warning_alerts: List[str]
    valuation_opportunity: ValuationOpportunityFlowAnalysis
    capital_allocation: CapitalAllocationFlowAnalysis
    corporate_moat: CorporateMoatAnalysis
    investment_committee: InvestmentCommitteeAnalysis
    bull_bear_debate: Optional["BullBearDebateAnalysis"] = None
    market_psychology: Optional[MarketPsychologyAnalysis] = None
    model_name: str
    is_mock: bool
    generated_at: float

class DebateParticipant(BaseModel):
    role: str
    stance: str
    arguments: List[str]

class ModeratorSummary(BaseModel):
    bull_case: List[str]
    bear_case: List[str]
    key_uncertainties: List[str]
    retail_takeaway: str
    actionable_checklist: List[str]

class BullBearDebateAnalysis(BaseModel):
    participants: List[DebateParticipant]
    moderator_summary: ModeratorSummary
