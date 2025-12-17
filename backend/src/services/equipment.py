import httpx
import asyncio
from typing import List, Optional
from src.models.schemas import ItemSearchResponse, ItemDetailsResponse, ItemStat, Ingredient
from src.services.calculator import get_rune_info

DOFUSDUDE_API_BASE_URL = "https://api.dofusdu.de/dofus3/v1"

async def search_equipment(query: str, lang: str = "es") -> List[ItemSearchResponse]:
    async with httpx.AsyncClient() as client:
        # Using the correct search endpoint
        url = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/equipment/search?query={query}&limit=20"
        response = await client.get(url)
        if response.status_code != 200:
            return []
            
        # The response is a list directly, not a dict with 'items'
        items = response.json()
        
        results = []
        for item in items:
            # Search endpoint might not return effects.
            # If it doesn't, we return empty stats and fetch them later in details.
            stats = []
            if 'effects' in item:
                for effect in item.get('effects', []):
                    type_name = effect.get('type', {}).get('name')
                    if not type_name:
                        continue
                    value = effect.get('int_maximum', 0)
                    min_val = effect.get('int_minimum', 0)
                    max_val = effect.get('int_maximum', 0)
                    
                    # Determine rune name
                    rune_info = get_rune_info(type_name, lang)
                    rune_name = rune_info["name"] if rune_info else None
                    
                    stats.append(ItemStat(name=type_name, value=value, min=min_val, max=max_val, rune_name=rune_name))
            
            results.append(ItemSearchResponse(
                id=item.get('ankama_id'),
                name=item.get('name'),
                img=item.get('image_urls', {}).get('icon'),
                stats=stats
            ))
        return results

async def search_resource(query: str, lang: str = "es") -> Optional[int]:
    """
    Search for a resource by name and return its Ankama ID.
    Returns the ID of the first match or None.
    """
    async with httpx.AsyncClient() as client:
        # Search in resources
        url_res = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/resources/search?query={query}&limit=1"
        response = await client.get(url_res)
        if response.status_code == 200:
            items = response.json()
            if items and len(items) > 0:
                return items[0].get('ankama_id')
        
        # Fallback: Search in consumables
        url_con = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/consumables/search?query={query}&limit=1"
        response = await client.get(url_con)
        if response.status_code == 200:
            items = response.json()
            if items and len(items) > 0:
                return items[0].get('ankama_id')
                
        # Fallback: Search in equipment (some items might be equipment)
        url_eq = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/equipment/search?query={query}&limit=1"
        response = await client.get(url_eq)
        if response.status_code == 200:
            items = response.json()
            if items and len(items) > 0:
                return items[0].get('ankama_id')
                
        return None

async def get_item_details(ankama_id: int, lang: str = "es") -> Optional[ItemDetailsResponse]:
    async with httpx.AsyncClient() as client:
        # Fetch item details
        url = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/equipment/{ankama_id}"
        response = await client.get(url)
        if response.status_code != 200:
            return None
            
        item = response.json()
        
        # Parse stats
        stats = []
        for effect in item.get('effects', []):
            # Ignorar efectos activos (daño de arma)
            if effect.get('type', {}).get('is_active'):
                continue

            type_name = effect.get('type', {}).get('name')
            if not type_name:
                continue
            value = effect.get('int_maximum', 0)
            min_val = effect.get('int_minimum', 0)
            max_val = effect.get('int_maximum', 0)
            
            # Determine rune name
            rune_info = get_rune_info(type_name, lang)
            rune_name = rune_info["name"] if rune_info else None
            
            stats.append(ItemStat(name=type_name, value=value, min=min_val, max=max_val, rune_name=rune_name))
            
        # Parse recipe
        recipe_data = item.get('recipe', [])
        ingredients = []
        
        # Fetch ingredient details in parallel
        tasks = []
        for ing in recipe_data:
            ing_id = ing.get('item_ankama_id')
            subtype = ing.get('item_subtype', 'resources')
            # We need to know if it's resource or equipment or consumable to build the URL
            # The API usually separates them.
            # But we can try to guess or use a generic endpoint if it exists?
            # Dofusdude has /items/{ankama_id} ? No.
            # We have to know the type.
            # 'item_subtype': 'resources' -> /items/resources/{id}
            # 'item_subtype': 'equipment' -> /items/equipment/{id} (rare for recipes but possible)
            # 'item_subtype': 'consumables' -> /items/consumables/{id}
            
            url_part = "resources"
            if ing.get('item_subtype') == 'equipment':
                url_part = "equipment"
            elif ing.get('item_subtype') == 'consumables':
                url_part = "consumables"
            elif ing.get('item_subtype') == 'weapons': # sometimes weapons are separate?
                 url_part = "equipment" # usually under equipment in this API?
            
            # Actually, let's just try resources first, as 99% are resources.
            # Or better, define a helper to fetch generic item info.
            tasks.append(fetch_ingredient_details(client, ing_id, url_part, ing.get('quantity', 1), lang))
            
        ingredients = await asyncio.gather(*tasks)
        # Filter out Nones
        ingredients = [i for i in ingredients if i is not None]
        
        return ItemDetailsResponse(
            id=item.get('ankama_id'),
            name=item.get('name'),
            img=item.get('image_urls', {}).get('icon'),
            level=item.get('level', 1),
            type=item.get('type', {}).get('name'),
            stats=stats,
            recipe=ingredients
        )

async def fetch_ingredient_details(client: httpx.AsyncClient, ankama_id: int, type_str: str, quantity: int, lang: str = "es") -> Optional[Ingredient]:
    retries = 3
    base_delay = 1.0
    
    for attempt in range(retries):
        try:
            # Try the guessed type
            url = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/{type_str}/{ankama_id}"
            response = await client.get(url)
            
            if response.status_code == 429:
                if attempt < retries - 1:
                    await asyncio.sleep(base_delay * (2 ** attempt))
                    continue
                else:
                    print(f"Failed to fetch {ankama_id} with type {type_str}. Status: 429 (Max retries)")
                    return None

            if response.status_code != 200:
                # Fallback: try resources if we failed and didn't try it yet
                if type_str != "resources":
                     fallback_url = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/resources/{ankama_id}"
                     response = await client.get(fallback_url)
                     if response.status_code == 429:
                        if attempt < retries - 1:
                            await asyncio.sleep(base_delay * (2 ** attempt))
                            continue
                        else:
                            return None
            
                if response.status_code != 200:
                    print(f"Failed to fetch {ankama_id} (fallback). Status: {response.status_code}")
                    return None

            data = response.json()
            return Ingredient(
                id=data.get('ankama_id'),
                name=data.get('name'),
                img=data.get('image_urls', {}).get('icon'),
                quantity=quantity
            )
        except Exception as e:
            print(f"Exception fetching {ankama_id}: {e}")
            return None
    return None

async def fetch_raw_equipment(types: List[str], min_level: int, max_level: int, lang: str = "es") -> List[dict]:
    filter_types = [t.lower() for t in types]
    
    # Handle 'backpack' specially because it doesn't have a valid name_id slug in Spanish
    has_backpack = 'backpack' in filter_types
    if has_backpack:
        filter_types.remove('backpack')
    
    all_items = []
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Fetch normal types
        if filter_types:
            url = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/equipment/all"
            params = {
                "filter[min_level]": min_level,
                "filter[max_level]": max_level,
                "filter[type.name_id]": ",".join(filter_types),
                "page[size]": -1,
                "sort[level]": "desc"
            }
            try:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        all_items.extend(data)
                    elif isinstance(data, dict) and 'items' in data:
                        all_items.extend(data['items'])
                else:
                    print(f"Error fetching equipment types {filter_types}: {response.status_code}")
            except Exception as e:
                print(f"Exception fetching equipment: {e}")

        # Fetch backpacks if needed
        if has_backpack:
            url = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/equipment/all"
            params = {
                "filter[min_level]": min_level,
                "filter[max_level]": max_level,
                "filter[type.id]": 102, # Backpack ID
                "page[size]": -1,
                "sort[level]": "desc"
            }
            try:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        all_items.extend(data)
                    elif isinstance(data, dict) and 'items' in data:
                        all_items.extend(data['items'])
                else:
                    print(f"Error fetching backpacks: {response.status_code}")
            except Exception as e:
                print(f"Exception fetching backpacks: {e}")
                
    return all_items

async def get_ingredients_by_filter(types: List[str], min_level: int, max_level: int, lang: str = "es") -> List[Ingredient]:
    items = await fetch_raw_equipment(types, min_level, max_level, lang)
            
    unique_ingredients = {} # Map id -> subtype
    
    for item in items:
        if not isinstance(item, dict): continue
        
        recipe = item.get('recipe')
        if recipe:
            for ing in recipe:
                ing_id = ing.get('item_ankama_id')
                if ing_id and ing_id not in unique_ingredients:
                    unique_ingredients[ing_id] = ing.get('item_subtype', 'resources')
    
    if not unique_ingredients:
        return []

    # Increased timeout to handle large number of requests
    async with httpx.AsyncClient(timeout=60.0) as client:
        sem = asyncio.Semaphore(5) # Reduced concurrency to 5 to avoid 429
        
        async def fetch_with_sem(ing_id, subtype):
            url_part = "resources"
            if subtype == 'equipment' or subtype == 'weapons':
                url_part = "equipment"
            elif subtype == 'consumables':
                url_part = "consumables"
                
            async with sem:
                return await fetch_ingredient_details(client, ing_id, url_part, 1, lang)

        tasks = [fetch_with_sem(ing_id, subtype) for ing_id, subtype in unique_ingredients.items()]
        ingredients = await asyncio.gather(*tasks)
        
    valid_ingredients = [i for i in ingredients if i is not None]
    valid_ingredients.sort(key=lambda x: x.name)
    
    return valid_ingredients
