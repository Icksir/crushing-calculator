from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from src.db.database import Base

class SuggestionModel(Base):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String(500), nullable=False)
    ip_hash = Column(String(64), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    likes = Column(Integer, default=0)
    dislikes = Column(Integer, default=0)
    status = Column(String, default="open")

class SuggestionVoteModel(Base):
    __tablename__ = "suggestion_votes"

    id = Column(Integer, primary_key=True, index=True)
    suggestion_id = Column(Integer, nullable=False, index=True)
    ip_hash = Column(String(64), nullable=False)
    vote_type = Column(Integer, nullable=False)  # 1 = like, -1 = dislike

    __table_args__ = (
        UniqueConstraint("suggestion_id", "ip_hash", name="uq_suggestion_ip"),
    )

class SuggestionCommentModel(Base):
    __tablename__ = "suggestion_comments"

    id = Column(Integer, primary_key=True, index=True)
    suggestion_id = Column(Integer, nullable=False, index=True)
    text = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RunePriceModel(Base):
    __tablename__ = "rune_prices"

    rune_name = Column(String, primary_key=True, index=True)
    server = Column(String, primary_key=True, default="Dakal")
    price = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class IngredientPriceModel(Base):
    __tablename__ = "ingredient_prices"

    item_id = Column(Integer, primary_key=True, index=True)
    server = Column(String, primary_key=True, default="Dakal")
    name = Column(String, nullable=True) # Optional, for readability
    price = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ItemCoefficientHistoryModel(Base):
    __tablename__ = "item_coefficient_history"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, index=True)
    server = Column(String, default="Dakal", index=True)
    coefficient = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PredictionDataset(Base):
    __tablename__ = "prediction_dataset"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, index=True)
    server = Column(String, index=True, default="Dakal")  # CRÍTICO: Contexto macroeconómico
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- TARGET (Y) ---
    real_coefficient = Column(Float)

    # --- FEATURES (X) ---
    # Económicos
    craft_cost = Column(Float)
    rune_value_real = Column(Float) # NOTE: Stores value at REAL coefficient
    ratio_profit = Column(Float)
    profit_amount = Column(Float) # Nuevo: Profit plano (neto)
    
    # Propiedades del ítem
    item_level = Column(Integer)
    item_type = Column(String)
    recipe_difficulty = Column(Integer)
    
    # Composición de Runas (NUEVO)
    has_high_value_rune = Column(Boolean, default=False) # Flag binaria
    dominant_rune_type = Column(String, nullable=True)   # "PA", "PM", "Alcance", "Generic"
    
    # Tendencia (NUEVO)
    previous_coefficient_24h = Column(Float, nullable=True) # Trend signal
    
    # Temporales
    day_of_week = Column(Integer)
    hour_of_day = Column(Integer)
    days_since_last_update = Column(Float)
    
    # Tipo de envío
    saved = Column(Boolean, default=False)  # True para guardados manuales, False para predicciones automáticas
