from pydantic import BaseModel, Field
from typing import List, Optional

class SimulationRequest(BaseModel):
    wacc: Optional[float] = Field(None, description="Discount rate / WACC in percent")
    growth_rate: Optional[float] = Field(None, description="5-year projected FCF growth rate in percent")
    perpetuity_growth: Optional[float] = Field(None, description="Perpetuity growth rate in percent")
    simulations: int = Field(1000, description="Number of Monte Carlo trials to run")

class HistogramBin(BaseModel):
    bin_min: float
    bin_max: float
    count: int

class SimulationResponse(BaseModel):
    ticker: str
    current_price: float
    estimated_fcf: float
    estimated_wacc: float
    estimated_growth: float
    shares_outstanding: int
    volatility: float
    
    bear_value_10p: float
    base_value_50p: float
    bull_value_90p: float
    upside_probability: float
    
    histogram: List[HistogramBin]
