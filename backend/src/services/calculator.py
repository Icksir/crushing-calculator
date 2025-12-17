import httpx
import asyncio
from src.models.schemas import CalculateRequest, CalculateResponse, RuneBreakdown
import re

# --- NEW: STAT NAME INTERNATIONALIZATION MAPPING ---
# Maps API language-specific stat names to a canonical internal name.
STAT_NAME_MAP = {
    "en": {
        "strength": "Fuerza", "intelligence": "Inteligencia", "chance": "Suerte", "agility": "Agilidad",
        "vitality": "Vitalidad", "wisdom": "Sabiduría", "initiative": "Iniciativa", "pods": "Pods",
        "power": "Potencia", "ap": "PA", "mp": "PM", "range": "Alcance",
        "summons": "Invocaciones", "critical hit": "Crítico", "heals": "Curas",
        "prospecting": "Prospección", "lock": "Placaje", "dodge": "Huida",
        "neutral damage": "Daños Neutrales", "earth damage": "Daños Tierra", "fire damage": "Daños Fuego", "water damage": "Daños Agua", "air damage": "Daños Aire",
        "critical damage": "Daños Críticos", "trap damage": "Daños Trampas", "damage": "Daños", "pushback damage": "Empuje",
        "trap power": "Potencia Trampas", "damage reflection": "Daños Reenvio",
        "ap reduction": "Retiro PA", "mp reduction": "Retiro PM", "ap loss resistance": "Esquiva PA", "mp loss resistance": "Esquiva PM",
        "fire resistance": "Resistencia Fuego", "air resistance": "Resistencia Aire", "earth resistance": "Resistencia Tierra", "water resistance": "Resistencia Agua", "neutral resistance": "Resistencia Neutral",
        "pushback resistance": "Resistencia Empuje", "critical resistance": "Resistencia Críticos",
        "% fire resistance": "% Resistencia Fuego", "% air resistance": "% Resistencia Aire", "% earth resistance": "% Resistencia Tierra", "% water resistance": "% Resistencia Agua", "% neutral resistance": "% Resistencia Neutral",
        "% spell damage": "% Daños Hechizos", "% weapon damage": "% Daños Armas", "% distance damage": "% Daños Distancia", "% melee damage": "% Daños Cuerpo a Cuerpo",
        "% melee resistance": "% Resistencia Cuerpo a Cuerpo", "% distance resistance": "% Resistencia Distancia",
        "hunting weapon": "Arma de caza"
    },
    "fr": {
        "force": "Fuerza", "intelligence": "Inteligencia", "chance": "Suerte", "agilité": "Agilidad",
        "vitalité": "Vitalidad", "sagesse": "Sabiduría", "initiative": "Iniciativa", "pods": "Pods",
        "puissance": "Potencia", "pa": "PA", "pm": "PM", "portée": "Alcance",
        "invocation": "Invocaciones", "% critique": "Crítico", "soin": "Curas",
        "prospection": "Prospección", "tacle": "Placaje", "fuite": "Huida",
        "dommage neutre": "Daños Neutrales", "dommage terre": "Daños Tierra", "dommage feu": "Daños Fuego", "dommage eau": "Daños Agua", "dommages air": "Daños Aire",
        "dommage critiques": "Daños Críticos", "dommage aux pièges": "Daños Trampas", "dommage": "Daños", "dommage poussée": "Empuje",
        "puissance des pièges": "Potencia Trampas", "renvoi de dommages": "Daños Reenvio",
        "retrait pa": "Retiro PA", "retrait pm": "Retiro PM", "esquive pa": "Esquiva PA", "esquive pm": "Esquiva PM",
        "résistance feu": "Resistencia Fuego", "résistance air": "Resistencia Aire", "résistance terre": "Resistencia Tierra", "résistance eau": "Resistencia Agua", "résistance neutre": "Resistencia Neutral",
        "résistance poussée": "Resistencia Empuje", "résistance critiques": "Resistencia Críticos",
        "% résistance feu": "% Resistencia Fuego", "% résistance air": "% Resistencia Aire", "% résistance terre": "% Resistencia Tierra", "% résistance eau": "% Resistencia Agua", "% résistance neutre": "% Resistencia Neutral",
        "% dommages aux sorts": "% Daños Hechizos", "% dommages d'armes": "% Daños Armas", "% dommages à distance": "% Daños Distancia", "% dommages en mêlée": "% Daños Cuerpo a Cuerpo",
        "% résistance mêlée": "% Resistencia Cuerpo a Cuerpo", "% résistance à distance": "% Resistencia Distancia",
        "arme de chasse": "Arma de caza"
    },
    "es": {
        "fuerza": "Fuerza", "inteligencia": "Inteligencia", "suerte": "Suerte", "agilidad": "Agilidad",
        "vitalidad": "Vitalidad", "sabiduría": "Sabiduría", "iniciativa": "Iniciativa", "pods": "Pods",
        "potencia": "Potencia", "pa": "PA", "pm": "PM", "alcance": "Alcance",
        "invocaciones": "Invocaciones", "crítico": "Crítico", "curas": "Curas", "de cura": "Curas",
        "prospección": "Prospección", "placaje": "Placaje", "huida": "Huida",
        "daños neutrales": "Daños Neutrales", "de daño neutral": "Daños Neutrales",
        "daños tierra": "Daños Tierra", "de daño de tierra": "Daños Tierra",
        "de daño de fuego": "Daños Fuego", "daños fuego": "Daños Fuego",
        "daños agua": "Daños Agua", "de daño de agua": "Daños Agua",
        "daños aire": "Daños Aire", "de daño de aire": "Daños Aire",
        "daños críticos": "Daños Críticos", "daños trampas": "Daños Trampas", "daños": "Daños", "daños de empuje": "Empuje",
        "potencia (trampas)": "Potencia Trampas", "reenvío de daños": "Daños Reenvio",
        "retiro pa": "Retiro PA", "al retiro de pa": "Retiro PA",
        "retiro pm": "Retiro PM", "al retiro de pm": "Retiro PM",
        "esquiva de pa": "Esquiva PA", "esquiva de pm": "Esquiva PM",
        "resistencia al fuego": "Resistencia Fuego", "resistencia al aire": "Resistencia Aire", "resistencia a la tierra": "Resistencia Tierra", "resistencia al agua": "Resistencia Agua", "resistencia neutral": "Resistencia Neutral",
        "resistencia a los daños de empuje": "Resistencia Empuje", "resistencia a los daños críticos": "Resistencia Críticos",
        "% de resistencia al fuego": "% Resistencia Fuego", "% resistencia al fuego": "% Resistencia Fuego",
        "% de resistencia al aire": "% Resistencia Aire", "% resistencia al aire": "% Resistencia Aire",
        "% de resistencia a la tierra": "% Resistencia Tierra", "% resistencia a la tierra": "% Resistencia Tierra",
        "% de resistencia al agua": "% Resistencia Agua", "% resistencia al agua": "% Resistencia Agua",
        "% de resistencia neutral": "% Resistencia Neutral", "% resistencia neutral": "% Resistencia Neutral",
        "% de daños con hechizos": "% Daños Hechizos", "% de daños de arma": "% Daños Armas", "% daños a distancia": "% Daños Distancia", "% daños cuerpo a cuerpo": "% Daños Cuerpo a Cuerpo",
        "% de resistencia cuerpo a cuerpo": "% Resistencia Cuerpo a Cuerpo", "% de resistencia a distancia": "% Resistencia Distancia",
        "arma de caza": "Arma de caza"
    }
}

# --- 1. TU FUNCIÓN DE BÚSQUEDA (INTEGRADA) ---
# Mantenemos tu lógica exacta para obtener la imagen.

DOFUSDUDE_API_BASE_URL = "https://api.dofusdu.de/dofus3/v1"
IMAGE_CACHE = {}  # Pequeño caché para no saturar la API

async def buscar_y_obtener_imagen(nombre_runa: str, client: httpx.AsyncClient = None, lang: str = "es"):
    # Revisamos caché primero
    cache_key = f"{nombre_runa}_{lang}"
    if cache_key in IMAGE_CACHE:
        return IMAGE_CACHE[cache_key]

    print(f"🔎 Buscando en API ({lang}): '{nombre_runa}'...")

    url = f"{DOFUSDUDE_API_BASE_URL}/{lang}/items/resources/search"
    params = {
        "query": nombre_runa,
        "filter[min_level]": 1,
        "filter[max_level]": 200,
        "limit": 8
    }

    try:
        if client:
            response = await client.get(url, params=params, timeout=10.0)
        else:
            async with httpx.AsyncClient() as local_client:
                response = await local_client.get(url, params=params, timeout=10.0)
            
        if response.status_code != 200:
            print(f"❌ Error API: {response.status_code}")
            return None
        
        resultados = response.json()

        if not resultados:
            print(f"❌ No se encontró: {nombre_runa}")
            return None

        # --- MODIFICATION: Filter for actual runes ---
        # The API search can be fuzzy. We need to ensure we're getting a rune.
        runa_keyword = "rune" if lang != "es" else "runa"
        
        mejor_coincidencia = None
        
        # 1. Prioritize exact match (case-insensitive)
        for item in resultados:
            if item.get("name", "").lower() == nombre_runa.lower():
                mejor_coincidencia = item
                break
        
        # 2. If no exact match, find the first result that looks like a rune
        if not mejor_coincidencia:
            for item in resultados:
                if runa_keyword in item.get("name", "").lower():
                    mejor_coincidencia = item
                    break # Take the first likely candidate
        
        # 3. If no likely candidate was found, we discard the search result
        #    to avoid showing a wrong item (e.g. a hat instead of a rune).
        if not mejor_coincidencia:
            print(f"⚠️ No se encontró una runa para '{nombre_runa}'. El primer resultado fue '{resultados[0].get('name', 'N/A')}'")
            return None

        imagenes = mejor_coincidencia.get("image_urls", {})
        url_imagen = imagenes.get("icon") or imagenes.get("sd")
        
        if url_imagen:
            # Guardamos en caché y retornamos solo la URL
            IMAGE_CACHE[cache_key] = url_imagen
            return url_imagen
        
        return None

    except Exception as e:
        print(f"🔥 Error conexión: {e}")
        return None

# --- 2. BASE DE DATOS Y DENSIDADES ---

STAT_DENSITIES = {
    "Fuerza": 1.0, "Inteligencia": 1.0, "Suerte": 1.0, "Agilidad": 1.0,
    "Vitalidad": 0.2, "Sabiduría": 3.0, "Iniciativa": 0.1, "Pods": 0.25,
    "Potencia": 2.0, "PA": 100.0, "PM": 90.0, "Alcance": 51.0,
    "Invocaciones": 30.0, "Crítico": 10.0, "Curas": 10.0,
    "Prospección": 3.0, "Placaje": 4.0, "Huida": 4.0,
    "Daños Neutrales": 5.0, "Daños Tierra": 5.0, "Daños Fuego": 5.0, "Daños Agua": 5.0, "Daños Aire": 5.0,
    "Daños Críticos": 5.0, "Daños Trampas": 5.0, "Daños": 20.0, "Empuje": 5.0,
    "Potencia Trampas": 2.0, "Daños Reenvio": 10.0,
    "Retiro PA": 7.0, "Retiro PM": 7.0, "Esquiva PA": 7.0, "Esquiva PM": 7.0,
    "Resistencia Fuego": 2.0, "Resistencia Aire": 2.0, "Resistencia Tierra": 2.0, "Resistencia Agua": 2.0, "Resistencia Neutral": 2.0,
    "Resistencia Empuje": 2.0, "Resistencia Críticos": 2.0,
    "% Resistencia Fuego": 6.0, "% Resistencia Aire": 6.0, "% Resistencia Tierra": 6.0, "% Resistencia Agua": 6.0, "% Resistencia Neutral": 6.0,
    "% Daños Hechizos": 15.0, "% Daños Armas": 15.0, "% Daños Distancia": 15.0, "% Daños Cuerpo a Cuerpo": 15.0,
    "% Resistencia Cuerpo a Cuerpo": 15.0, "% Resistencia Distancia": 15.0,
    "Runa de caza": 5.0, "Daños Reenvio": 5.0, "Potencia Trampas": 2.0,
    "% Daños Hechizos": 15.0, "% Daños Armas": 15.0, "% Daños Distancia": 15.0,
    "% Daños Cuerpo a Cuerpo": 15.0, "% Resistencia Cuerpo a Cuerpo": 10.0,
    "% Resistencia Distancia": 10.0
}

# --- 2. BASE DE DATOS DE RUNAS 
RUNE_DB = {
    # --- Características Primarias ---
    "Fuerza":       [{"name": {"es": "Runa Fu", "en": "Str Rune", "fr": "Rune Fo"}, "weight": 1.0}],
    "Inteligencia": [{"name": {"es": "Runa Inte", "en": "Int Rune", "fr": "Rune Ine"}, "weight": 1.0}],
    "Suerte":       [{"name": {"es": "Runa Sue", "en": "Cha Rune", "fr": "Rune Cha"}, "weight": 1.0}],
    "Agilidad":     [{"name": {"es": "Runa Agi", "en": "Agi Rune", "fr": "Rune Age"}, "weight": 1.0}],
    
    # --- Características Secundarias ---
    "Vitalidad":    [{"name": {"es": "Runa Vi", "en": "Vit Rune", "fr": "Rune Vi"}, "weight": 1.0}],
    "Sabiduría":    [{"name": {"es": "Runa Sa", "en": "Wis Rune", "fr": "Rune Sa"}, "weight": 3.0}],
    "Iniciativa":   [{"name": {"es": "Runa Ini", "en": "Ini Rune", "fr": "Rune Ini"}, "weight": 1.0}], 
    "Pods":         [{"name": {"es": "Runa Pod", "en": "Pod Rune", "fr": "Rune Pod"}, "weight": 2.5}], 
    "Potencia":     [{"name": {"es": "Runa Pot", "en": "Pow Rune", "fr": "Rune Pui"}, "weight": 2.0}],
    
    # --- Características Mayores ---
    "PA":           [{"name": {"es": "Runa Ga PA", "en": "Ap Ga Rune", "fr": "Rune Ga Pa"}, "weight": 100.0}],
    "PM":           [{"name": {"es": "Runa Ga PM", "en": "Mp Ga Rune", "fr": "Rune Ga Pme"}, "weight": 90.0}],
    "Alcance":      [{"name": {"es": "Runa Al", "en": "Range Rune", "fr": "Rune Po"}, "weight": 51.0}],
    "Invocaciones": [{"name": {"es": "Runa Invo", "en": "Sum Rune", "fr": "Rune Invo"}, "weight": 30.0}],
    
    # --- Combate ---
    "Crítico":      [{"name": {"es": "Runa Cri", "en": "Cri Rune", "fr": "Rune Cri"}, "weight": 10.0}],
    "Curas":        [{"name": {"es": "Runa Cu", "en": "Hea Rune", "fr": "Rune So"}, "weight": 10.0}],
    "Prospección":  [{"name": {"es": "Runa Prospe", "en": "Pp Rune", "fr": "Rune Prospe"}, "weight": 3.0}],
    "Placaje":      [{"name": {"es": "Runa Pla", "en": "Loc Rune", "fr": "Rune Tac"}, "weight": 4.0}],
    "Huida":        [{"name": {"es": "Runa Hui", "en": "Dod Rune", "fr": "Rune Fui"}, "weight": 4.0}],
    
    # --- Daños ---
    "Daños Neutrales": [{"name": {"es": "Runa Da Neutral", "en": "Neutral Dam Rune", "fr": "Rune Do Neutre"}, "weight": 5.0}],
    "Daños Tierra":    [{"name": {"es": "Runa Da Tierra", "en": "Earth Dam Rune", "fr": "Rune Do Terre"}, "weight": 5.0}],
    "Daños Fuego":     [{"name": {"es": "Runa Da Fuego", "en": "Fire Dam Rune", "fr": "Rune Do Feu"}, "weight": 5.0}],
    "Daños Agua":      [{"name": {"es": "Runa Da Agua", "en": "Water Dam Rune", "fr": "Rune Do Eau"}, "weight": 5.0}],
    "Daños Aire":      [{"name": {"es": "Runa Da Aire", "en": "Air Dam Rune", "fr": "Rune Do Air"}, "weight": 5.0}],
    "Daños":           [{"name": {"es": "Runa Da", "en": "Dam Rune", "fr": "Rune Do"}, "weight": 20.0}],
    "Daños Trampas":   [{"name": {"es": "Runa Da Tram", "en": "Trp Dam Rune", "fr": "Rune Do Pi"}, "weight": 5.0}],
    "Daños Críticos":  [{"name": {"es": "Runa Da Cri", "en": "Cri Dam Rune", "fr": "Rune Do Cri"}, "weight": 5.0}],
    "Empuje":          [{"name": {"es": "Runa Da Emp", "en": "Psh Dam Rune", "fr": "Rune Do Pou"}, "weight": 5.0}],
    "Daños Reenvio":   [{"name": {"es": "Runa Da Reen", "en": "Dam Ref Rune", "fr": "Rune Do Ren"}, "weight": 5.0}],
    "Potencia Trampas": [{"name": {"es": "Runa Por Tram", "en": "Trp Dam Rune", "fr": "Rune Per Pi"}, "weight": 2.0}],
    
    # --- Retiro y Esquiva ---
    "Retiro PA":  [{"name": {"es": "Runa Ret PA", "en": "Ap Red Rune", "fr": "Rune Ret Pa"}, "weight": 7.0}],
    "Retiro PM":  [{"name": {"es": "Runa Ret PM", "en": "Mp Red Rune", "fr": "Rune Ret Pme"}, "weight": 7.0}],
    "Esquiva PA": [{"name": {"es": "Runa Re PA", "en": "Ap Res Rune", "fr": "Rune Ré Pa"}, "weight": 7.0}],
    "Esquiva PM": [{"name": {"es": "Runa Re PM", "en": "Mp Res Rune", "fr": "Rune Ré Pme"}, "weight": 7.0}],

    # --- Resistencias ---
    "Resistencia Fuego":   [{"name": {"es": "Runa Re Fuego", "en": "Fire Res Rune", "fr": "Rune Ré Feu"}, "weight": 2.0}],
    "Resistencia Aire":    [{"name": {"es": "Runa Re Aire", "en": "Air Res Rune", "fr": "Rune Ré Air"}, "weight": 2.0}],
    "Resistencia Tierra":  [{"name": {"es": "Runa Re Tierra", "en": "Earth Res Rune", "fr": "Rune Ré Terre"}, "weight": 2.0}],
    "Resistencia Agua":    [{"name": {"es": "Runa Re Agua", "en": "Water Res Rune", "fr": "Rune Ré Eau"}, "weight": 2.0}],
    "Resistencia Neutral": [{"name": {"es": "Runa Re Neutral", "en": "Neutral Res Rune", "fr": "Rune Ré Neutre"}, "weight": 2.0}],
    "Resistencia Empuje":  [{"name": {"es": "Runa Re Emp", "en": "Psh Res Rune", "fr": "Rune Ré Pou"}, "weight": 2.0}],
    "Resistencia Críticos":[{"name": {"es": "Runa Re Cri", "en": "Cri Res Rune", "fr": "Rune Ré Cri"}, "weight": 2.0}],
    
    # --- Resistencias % ---
    "% Resistencia Fuego":   [{"name": {"es": "Runa Re Fuego Por", "en": "Fire Res Per Rune", "fr": "Rune Ré Per Feu"}, "weight": 6.0}],
    "% Resistencia Aire":    [{"name": {"es": "Runa Re Aire Por", "en": "Air Res Per Rune", "fr": "Rune Ré Per Air"}, "weight": 6.0}],
    "% Resistencia Tierra":  [{"name": {"es": "Runa Re Tierra Por", "en": "Earth Res Per Rune", "fr": "Rune Ré Per Terre"}, "weight": 6.0}],
    "% Resistencia Agua":    [{"name": {"es": "Runa Re Agua Por", "en": "Water Res Per Rune", "fr": "Rune Ré Per Eau"}, "weight": 6.0}],
    "% Resistencia Neutral": [{"name": {"es": "Runa Re Neutral Por", "en": "Neutral Res Per Rune", "fr": "Rune Ré Per Neutre"}, "weight": 6.0}],

    # --- Daños % ---
    "% Daños Hechizos": [{"name": {"es": "Runa Da Por He", "en": "Spe Dam Per Rune", "fr": "Rune Do Per So"}, "weight": 15.0}],
    "% Daños Armas": [{"name": {"es": "Runa Da Por Ar", "en": "Wep Dam Per Rune", "fr": "Rune Do Per Ar"}, "weight": 15.0}],
    "% Daños Distancia": [{"name": {"es": "Runa Da Por Di", "en": "Dis Dam Per Rune", "fr": "Rune Do Per Di"}, "weight": 15.0}],
    "% Daños Cuerpo a Cuerpo": [{"name": {"es": "Runa Da Por CC", "en": "Mel Dam Per Rune", "fr": "Rune Do Per Mé"}, "weight": 15.0}],
    
    # --- Resistencia % (Melee/Dist) ---
    "% Resistencia Cuerpo a Cuerpo": [{"name": {"es": "Runa Re Por CC", "en": "Mel Res Per Rune", "fr": "Rune Ré Per Mé"}, "weight": 10.0}],
    "% Resistencia Distancia": [{"name": {"es": "Runa Re Por Di", "en": "Dis Res Per Rune", "fr": "Rune Ré Per Di"}, "weight": 10.0}],
    
    # --- Especiales ---
    "Arma de caza": [{"name": {"es": "Runa de caza", "en": "Hunting Rune", "fr": "Rune de chasse"}, "weight": 5.0}],
}

# --- 4. HELPERS ---

def get_canonical_stat_name(stat_name: str, lang: str = "es") -> str:
    """
    Converts a localized stat name (e.g., 'Force' in FR) to the canonical key used in RUNE_DB (e.g., 'Fuerza').
    """
    stat_lower = stat_name.lower()
    
    # 1. Try direct lookup in the specific language map
    if lang in STAT_NAME_MAP:
        if stat_lower in STAT_NAME_MAP[lang]:
            return STAT_NAME_MAP[lang][stat_lower]
            
    # 2. Fallback: Check if it's already a canonical key (Spanish keys in RUNE_DB)
    # This handles cases where the input is already "Fuerza" or "PA"
    if stat_name in RUNE_DB:
        return stat_name
        
    # 3. Fallback: Return as is (might fail lookup but better than crashing)
    return stat_name

def get_rune_info(stat_name: str, lang: str = "es"):
    canonical_name = get_canonical_stat_name(stat_name, lang)
    if canonical_name in RUNE_DB:
        rune_data = RUNE_DB[canonical_name][0]
        # Return a copy with the translated name
        return {
            "name": rune_data["name"].get(lang, rune_data["name"]["es"]),
            "weight": rune_data["weight"]
        }
    return None

def get_rune_name_translation(rune_name_es: str, target_lang: str = "es") -> str:
    """
    Translates a rune name from Spanish (DB key) to the target language.
    """
    if target_lang == "es":
        return rune_name_es
        
    # Search in RUNE_DB
    for stat, data_list in RUNE_DB.items():
        for data in data_list:
            names = data.get("name", {})
            if names.get("es") == rune_name_es:
                return names.get(target_lang, rune_name_es)
                
    return rune_name_es

def get_canonical_rune_name(rune_name: str, lang: str = "es") -> str:
    """
    Converts a localized rune name (e.g. 'Rune Fo') back to the canonical Spanish name (e.g. 'Runa Fu').
    """
    if lang == "es":
        return rune_name
        
    for stat, data_list in RUNE_DB.items():
        for data in data_list:
            names = data.get("name", {})
            if names.get(lang) == rune_name:
                return names.get("es", rune_name)
                
    return rune_name

def get_stat_density(stat_name: str, lang: str = "es") -> float:
    canonical_name = get_canonical_stat_name(stat_name, lang)
    return STAT_DENSITIES.get(canonical_name, 0.0)

async def calculate_profit(request: CalculateRequest) -> CalculateResponse:
    total_rune_value = 0.0
    breakdown_list = []
    
    # 1. VALIDACIÓN Y PREPARACIÓN
    lang = getattr(request, "lang", "es")
    item_lvl = getattr(request, "item_level", 200) 
    server_coef = request.coefficient / 100.0

    # 2. FASE 1: CALCULAR EL 'POOL' DE ROMPIMIENTO (VR)
    # Calculamos el VR de cada stat usando la fórmula del script.
    
    stat_vrs = {}      # Diccionario para guardar el VR de cada stat individual
    total_vr_sum = 0.0 # Suma total de todos los VR del objeto

    for stat in request.stats:
        density = get_stat_density(stat.name, lang)
        value = stat.value
        
        # Ajustes especiales según el script
        if stat.name in {"PA", "PM", "Alcance", "Invocaciones"} and 0 <= value <= 1:
            value = 1
        
        if stat.name == "Pods":
            value = value / 2.5

        # Solo calculamos VR si la stat aporta algo positivo
        if value > 0:
            # Fórmula: ((value * density * item_lvl * 0.0150) + 1)
            vr = ((value * density * item_lvl * 0.0150) + 1)
        else:
            vr = 0
            
        stat_vrs[stat.name] = vr
        total_vr_sum += vr

    # 3. FASE 2: CÁLCULO DE RUNAS
    max_focus_profit = -float('inf')
    best_focus_stat = None

    # --- OPTIMIZACIÓN: Pre-cargar imágenes en paralelo ---
    rune_names_to_fetch = set()
    for stat in request.stats:
        rune_info = get_rune_info(stat.name, lang)
        if rune_info:
            rune_names_to_fetch.add(rune_info["name"])
    
    image_map = {}
    if rune_names_to_fetch:
        names_list = list(rune_names_to_fetch)
        async with httpx.AsyncClient() as client:
            tasks = [buscar_y_obtener_imagen(name, client, lang) for name in names_list]
            results = await asyncio.gather(*tasks)
            image_map = dict(zip(names_list, results))
    # -----------------------------------------------------

    for stat in request.stats:
        rune_info = get_rune_info(stat.name, lang)
        
        # Si no tiene runa asociada, saltamos
        if not rune_info:
            continue
            
        rune_weight = rune_info["weight"]
        rune_name = rune_info["name"]
        price = request.rune_prices.get(rune_name, 0)
        
        # Recuperamos el VR de esta stat específica
        vr_propio = stat_vrs.get(stat.name, 0)
        
        # --- A. CÁLCULO MODO NORMAL ---
        # Te llevas tu propia stat.
        # Aplicamos coeficiente aquí
        vr_normal_final = vr_propio * server_coef
        
        count_normal = vr_normal_final / rune_weight
        value_normal = count_normal * price
        
        total_rune_value += value_normal
        
        # --- B. CÁLCULO MODO FOCUS ---
        # Definición: Te llevas el 100% de tu stat + el 50% de TODO LO DEMÁS (Resto).
        
        # 1. Calculamos cuánto vale "el resto" de las stats
        vr_resto = total_vr_sum - vr_propio
        
        # 2. Aplicamos la fórmula: Propio + (0.5 * Resto)
        vr_focus_total = vr_propio + (0.5 * vr_resto)
        
        # 3. Aplicamos coeficiente
        vr_focus_total *= server_coef
        
        # 4. Ajuste especial para Pods en Focus
        if stat.name == "Pods":
            vr_focus_total = vr_focus_total / 2.5
        
        # 5. Convertimos a runas
        count_focus = vr_focus_total / rune_weight
        value_focus = count_focus * price

        # Si la stat es negativa, forzamos valores a 0 (no genera runas)
        if stat.value <= 0:
            count_normal = 0
            value_normal = 0
            count_focus = 0
            value_focus = 0
            # Restamos lo que habíamos sumado erróneamente al total (aunque vr_propio era 0, mejor asegurar)
            # Nota: vr_propio es 0 si stat.value <= 0, así que value_normal ya es 0.
            # Pero value_focus NO era 0 por el resto. Así que esto es necesario.

        # Comparar rentabilidad (Valor de runas - Costo del objeto)
        # Solo si la stat es positiva consideramos el focus
        if stat.value > 0:
            current_focus_profit = value_focus - request.item_cost
            if current_focus_profit > max_focus_profit:
                max_focus_profit = current_focus_profit
                best_focus_stat = stat.name

        # Obtener imagen (desde mapa optimizado)
        rune_image = image_map.get(rune_name)

        # Llenamos el modelo
        rune_data = RuneBreakdown(
            stat=stat.name,
            rune_name=rune_name,
            rune_image=rune_image,
            weight=get_stat_density(stat.name, lang),
            
            # Normal
            count=round(count_normal, 2),
            value=value_normal,
            
            # Focus
            focus_rune_name=rune_name, 
            focus_image=rune_image,
            focus_count=round(count_focus, 2),
            focus_value=value_focus
        )
        
        breakdown_list.append(rune_data)

    # 4. RESULTADOS FINALES
    normal_profit = total_rune_value - request.item_cost
    
    # Ajuste por si no hubo ninguna stat rentable (evitar -inf)
    if max_focus_profit == -float('inf'):
        max_focus_profit = -request.item_cost

    # Determinar el mejor escenario (Normal vs Focus)
    if max_focus_profit > normal_profit:
        final_net_profit = max_focus_profit
        final_total_value = max_focus_profit + request.item_cost
    else:
        final_net_profit = normal_profit
        final_total_value = total_rune_value

    return CalculateResponse(
        total_estimated_value=round(final_total_value, 2),
        net_profit=round(final_net_profit, 2),
        max_focus_profit=round(max_focus_profit, 2),
        best_focus_stat=best_focus_stat,
        breakdown=breakdown_list,
        item_cost=request.item_cost,
        coefficient=request.coefficient
    )