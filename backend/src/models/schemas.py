from pydantic import BaseModel
from typing import List, Dict, Optional

class ItemStat(BaseModel):
    name: str
    value: float
    min: float = 0
    max: float = 0
    rune_name: Optional[str] = None

class ItemSearchResponse(BaseModel):
    id: int
    name: str
    img: str
    stats: List[ItemStat]

class Ingredient(BaseModel):
    id: int
    name: str
    img: str
    quantity: int

from datetime import datetime

class ItemDetailsResponse(BaseModel):
    id: int
    name: str
    img: str
    level: int
    type: Optional[str] = None
    stats: List[ItemStat]
    recipe: List[Ingredient]
    last_coefficient: Optional[float] = None
    last_coefficient_date: Optional[datetime] = None

class CalculateRequest(BaseModel):
    item_level: int           # <--- NUEVO: Vital para la fórmula de Dofus 3
    stats: List[ItemStat]
    coefficient: float        # Coeficiente en % (ej: 211)
    item_cost: float
    rune_prices: Dict[str, float]

class RuneBreakdown(BaseModel):
    stat: str
    rune_name: str
    rune_image: Optional[str] = None
    weight: float
    count: float
    value: float
    
    focus_rune_name: str 
    focus_image: Optional[str] = None
    focus_count: float
    focus_value: float

class ProfitItem(BaseModel):
    id: int
    name: str
    img: str
    level: int
    min_coefficient: float
    craft_cost: float
    estimated_rune_value: float
    value_at_100: float
    last_coefficient: Optional[float] = None

class ItemCoefficientRequest(BaseModel):
    coefficient: float

class CalculateResponse(BaseModel):
    total_estimated_value: float
    net_profit: float
    max_focus_profit: float
    best_focus_stat: Optional[str]
    breakdown: List[RuneBreakdown]
    item_cost: float
    coefficient: float 

class PaginatedProfitResponse(BaseModel):
    items: List[ProfitItem]
    total: int
    page: int
    size: int
    total_pages: int 