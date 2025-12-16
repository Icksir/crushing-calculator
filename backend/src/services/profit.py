from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from src.models.sql_models import IngredientPriceModel, RunePriceModel, ItemCoefficientHistoryModel
from src.services.equipment import fetch_raw_equipment
from src.services.calculator import get_rune_info, get_stat_density
from src.models.schemas import ProfitItem

async def calculate_profitability(types: List[str], min_level: int, max_level: int, min_profit: int, db: AsyncSession) -> List[ProfitItem]:
    # 1. Fetch items
    items = await fetch_raw_equipment(types, min_level, max_level)
    if not items:
        return []

    # 2. Fetch prices
    ing_prices_result = await db.execute(select(IngredientPriceModel))
    ing_prices = {row.IngredientPriceModel.item_id: row.IngredientPriceModel.price for row in ing_prices_result}
    
    rune_prices_result = await db.execute(select(RunePriceModel))
    rune_prices = {row.RunePriceModel.rune_name: row.RunePriceModel.price for row in rune_prices_result}

    results = []

    for item in items:
        if not isinstance(item, dict): continue
        
        # Calculate Craft Cost
        recipe = item.get('recipe', [])
        if not recipe: continue # Skip items without recipe
        
        craft_cost = 0
        is_craftable = True
        for ing in recipe:
            ing_id = ing.get('item_ankama_id')
            qty = ing.get('quantity', 1)
            price = ing_prices.get(ing_id, 0)
            
            # If price is -1, the ingredient is marked as unavailable
            if price == -1:
                is_craftable = False
                break
                
            # If price is 0, the cost is underestimated, but we proceed as requested
            craft_cost += price * qty
            
        if not is_craftable or craft_cost == 0:
            continue

        # Calculate Rune Value (Base)
        effects = item.get('effects', [])
        if not effects: continue
        
        item_level = item.get('level', 1)
        
        # Store stat data for focus calculation
        stat_data_list = []
        total_vr_sum = 0
        
        for effect in effects:
            # Skip active effects (e.g. weapon damage, spells)
            if effect.get('type', {}).get('is_active'):
                continue

            type_name = effect.get('type', {}).get('name')
            if not type_name: continue
            
            # Use average value for estimation
            min_val = effect.get('int_minimum', 0)
            max_val = effect.get('int_maximum', 0)
            
            # Handle cases where min/max might be inverted or zero
            if max_val == 0 and min_val != 0: max_val = min_val
            if min_val == 0 and max_val != 0: min_val = max_val
            
            # Use integer division to match frontend Math.floor()
            avg_val = int((min_val + max_val) / 2)
            
            if avg_val <= 0: continue
            
            rune_info = get_rune_info(type_name)
            if not rune_info: continue
            
            rune_name = rune_info["name"]
            rune_weight = rune_info["weight"]
            rune_price = rune_prices.get(rune_name, 0)
            
            density = get_stat_density(type_name)
            
            # Apply calculator.py logic for value adjustments
            adjusted_val = avg_val
            if type_name in {"PA", "PM", "Alcance", "Invocaciones"} and 0 <= adjusted_val <= 1:
                adjusted_val = 1
            
            if type_name == "Pods":
                adjusted_val = adjusted_val / 2.5

            # Formula: ((value * density * item_lvl * 0.0150) + 1)
            vr = ((adjusted_val * density * item_level * 0.0150) + 1)
            
            stat_data_list.append({
                'name': type_name,
                'vr': vr,
                'rune_weight': rune_weight,
                'rune_price': rune_price
            })
            total_vr_sum += vr
            
        if not stat_data_list:
            continue
            
        # Calculate Normal Value (Sum of all stats)
        normal_value = 0
        for stat in stat_data_list:
            # Normal: vr / weight * price
            num_runes = stat['vr'] / stat['rune_weight']
            normal_value += num_runes * stat['rune_price']
            
        # Calculate Focus Values
        max_focus_value = 0
        
        for stat in stat_data_list:
            vr_propio = stat['vr']
            vr_resto = total_vr_sum - vr_propio
            
            # Focus Formula: Propio + (0.5 * Resto)
            vr_focus_total = vr_propio + (0.5 * vr_resto)
            
            # Pods adjustment for Focus
            if stat['name'] == "Pods":
                vr_focus_total = vr_focus_total / 2.5
                
            num_runes_focus = vr_focus_total / stat['rune_weight']
            focus_value = num_runes_focus * stat['rune_price']
            
            if focus_value > max_focus_value:
                max_focus_value = focus_value
                
        # Best Value (Normal vs Focus)
        total_rune_value = max(normal_value, max_focus_value)
            
        if total_rune_value == 0:
            continue
            
        # Check minimum profit (assuming 100% coefficient for this check, or just raw value difference)
        # Profit = RuneValue - Cost
        if (total_rune_value - craft_cost) < min_profit:
            continue
            
        # Calculate min coefficient as percentage (e.g. 50.0 for 50%)
        # Coef = Cost / BaseValue
        # If Cost=100, Base=200 -> Coef=0.5 -> 50%
        min_coef = (craft_cost / total_rune_value) * 100
        
        results.append(ProfitItem(
            id=item.get('ankama_id'),
            name=item.get('name'),
            img=item.get('image_urls', {}).get('icon'),
            level=item_level,
            min_coefficient=round(min_coef, 2),
            craft_cost=round(craft_cost, 2),
            estimated_rune_value=round(total_rune_value, 2)
        ))
        
    # Sort by min_coefficient ascending
    results.sort(key=lambda x: x.min_coefficient)
    
    top_results = results[:10]
    
    # Fetch last coefficients for these items
    for res in top_results:
        query = select(ItemCoefficientHistoryModel.coefficient).where(
            ItemCoefficientHistoryModel.item_id == res.id
        ).order_by(desc(ItemCoefficientHistoryModel.created_at)).limit(1)
        
        coeff_result = await db.execute(query)
        res.last_coefficient = coeff_result.scalar_one_or_none()
        
    return top_results
