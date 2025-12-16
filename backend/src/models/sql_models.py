from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from src.db.database import Base

class RunePriceModel(Base):
    __tablename__ = "rune_prices"

    rune_name = Column(String, primary_key=True, index=True)
    price = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class IngredientPriceModel(Base):
    __tablename__ = "ingredient_prices"

    item_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True) # Optional, for readability
    price = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ItemCoefficientHistoryModel(Base):
    __tablename__ = "item_coefficient_history"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, index=True)
    coefficient = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PredictionDataset(Base):
    __tablename__ = "prediction_dataset"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- TARGET (Y) ---
    real_coefficient = Column(Float)

    # --- FEATURES (X) ---
    craft_cost = Column(Float)
    rune_value_100 = Column(Float)
    ratio_profit = Column(Float)      # X1
    item_level = Column(Integer)      # X2
    item_type = Column(String)        # X7
    recipe_difficulty = Column(Integer) # X6
    
    day_of_week = Column(Integer)     # X4
    hour_of_day = Column(Integer)     # X4
    days_since_last_update = Column(Float) # X5
