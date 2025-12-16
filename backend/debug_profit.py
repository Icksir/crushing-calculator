import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.services.equipment import fetch_raw_equipment
from src.services.calculator import get_rune_info, STAT_DENSITIES

# Mock prices (we just want to see the rune value calculation logic)
# We will assume price = 1 for all runes to check the "Volume" of runes.
# Or better, we can print the breakdown of stats.

async def debug_martillo():
    print("Fetching Martillo Xiko...")
    # Use English type name "Hammer"
    items = await fetch_raw_equipment(["Hammer"], 129, 129)
    
    target_item = None
    for item in items:
        if item.get('ankama_id') == 8097:
            target_item = item
            break
            
    if not target_item:
        print("Martillo Xiko not found in API response")
        return

    print(f"Found: {target_item['name']}")
    effects = target_item.get('effects', [])
    item_level = target_item.get('level', 1)
    
    print(f"Level: {item_level}")
    print("Effects found in raw response:")
    for e in effects:
        print(f" - {e.get('type', {}).get('name')}: {e.get('int_minimum')}-{e.get('int_maximum')}")

    # Logic from profit.py
    stat_data_list = []
    total_vr_sum = 0
    
    print("\n--- Processing Stats (Profit Logic) ---")
    
    for effect in effects:
        if effect.get('type', {}).get('is_active'):
            continue

        type_name = effect.get('type', {}).get('name')
        if not type_name: continue
        
        min_val = effect.get('int_minimum', 0)
        max_val = effect.get('int_maximum', 0)
        
        if max_val == 0 and min_val != 0: max_val = min_val
        if min_val == 0 and max_val != 0: min_val = max_val
        
        avg_val = int((min_val + max_val) / 2)
        
        if avg_val <= 0: continue
        
        rune_info = get_rune_info(type_name)
        if not rune_info: 
            print(f"Skipping {type_name} (No rune info)")
            continue
        
        rune_name = rune_info["name"]
        rune_weight = rune_info["weight"]
        # Mock price
        rune_price = 100 
        
        density = STAT_DENSITIES.get(type_name, 0)
        
        adjusted_val = avg_val
        if type_name in {"PA", "PM", "Alcance", "Invocaciones"} and 0 <= adjusted_val <= 1:
            adjusted_val = 1
        
        if type_name == "Pods":
            adjusted_val = adjusted_val / 2.5

        vr = ((adjusted_val * density * item_level * 0.0150) + 1)
        
        print(f"Stat: {type_name}, Avg: {avg_val}, Density: {density}, VR: {vr}")
        
        stat_data_list.append({
            'name': type_name,
            'vr': vr,
            'rune_weight': rune_weight,
            'rune_price': rune_price
        })
        total_vr_sum += vr

    # Calculate Normal Value
    normal_value = 0
    for stat in stat_data_list:
        num_runes = stat['vr'] / stat['rune_weight']
        normal_value += num_runes * stat['rune_price']
        
    print(f"\nNormal Value (Price=100): {normal_value}")
    
    # Calculate Focus Values
    max_focus_value = 0
    best_focus = None
    
    for stat in stat_data_list:
        vr_propio = stat['vr']
        vr_resto = total_vr_sum - vr_propio
        
        vr_focus_total = vr_propio + (0.5 * vr_resto)
        
        if stat['name'] == "Pods":
            vr_focus_total = vr_focus_total / 2.5
            
        num_runes_focus = vr_focus_total / stat['rune_weight']
        focus_value = num_runes_focus * stat['rune_price']
        
        print(f"Focus {stat['name']}: VR_Total={vr_focus_total}, Value={focus_value}")
        
        if focus_value > max_focus_value:
            max_focus_value = focus_value
            best_focus = stat['name']
            
    print(f"Max Focus Value: {max_focus_value} ({best_focus})")
    print(f"Total Rune Value Used: {max(normal_value, max_focus_value)}")

if __name__ == "__main__":
    asyncio.run(debug_martillo())
