import httpx
import asyncio
from src.models.schemas import CalculateRequest, CalculateResponse, RuneBreakdown
import re

# --- 1. TU FUNCIÓN DE BÚSQUEDA (INTEGRADA) ---
# Mantenemos tu lógica exacta para obtener la imagen.

URL_SEARCH = "https://api.dofusdu.de/dofus3/v1/es/items/resources/search"
IMAGE_CACHE = {}  # Pequeño caché para no saturar la API

async def buscar_y_obtener_imagen(nombre_runa: str, client: httpx.AsyncClient = None):
    # Revisamos caché primero
    if nombre_runa in IMAGE_CACHE:
        return IMAGE_CACHE[nombre_runa]

    print(f"🔎 Buscando en API: '{nombre_runa}'...")

    params = {
        "query": nombre_runa,
        "filter[min_level]": 1,
        "filter[max_level]": 200,
        "limit": 8
    }

    try:
        if client:
            response = await client.get(URL_SEARCH, params=params, timeout=10.0)
        else:
            async with httpx.AsyncClient() as local_client:
                response = await local_client.get(URL_SEARCH, params=params, timeout=10.0)
            
        if response.status_code != 200:
            print(f"❌ Error API: {response.status_code}")
            return None
        
        resultados = response.json()

        if not resultados:
            print(f"❌ No se encontró: {nombre_runa}")
            return None

        # Tomamos el primer resultado
        mejor_coincidencia = resultados[0]
        imagenes = mejor_coincidencia.get("image_urls", {})
        url_imagen = imagenes.get("icon") or imagenes.get("sd")
        
        if url_imagen:
            # Guardamos en caché y retornamos solo la URL
            IMAGE_CACHE[nombre_runa] = url_imagen
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

# --- 2. BASE DE DATOS DE RUNAS (100% ESPAÑOL) ---
# Se han reemplazado los términos franceses (Fo, Ine, Cha, Pui, Do, Ré) 
# por sus contrapartes en español (Fu, Inte, Sue, Pot, Da, Res).

RUNE_DB = {
    # --- ELEMENTALES ---
    "Fuerza":       [{"name": "Runa Fu",   "weight": 1.0}], # Antes Fo
    "Inteligencia": [{"name": "Runa Inte", "weight": 1.0}], # Antes Ine
    "Suerte":       [{"name": "Runa Sue",  "weight": 1.0}], # Antes Cha
    "Agilidad":     [{"name": "Runa Agi",  "weight": 1.0}], # Agi es igual
    
    # --- SECUNDARIOS ---
    "Vitalidad":    [{"name": "Runa Vi",   "weight": 1.0}],
    "Sabiduría":    [{"name": "Runa Sa",   "weight": 3.0}],
    "Iniciativa":   [{"name": "Runa Ini",  "weight": 1.0}], 
    "Pods":         [{"name": "Runa Pod",  "weight": 2.5}], 
    "Potencia":     [{"name": "Runa Pot",  "weight": 2.0}], # Antes Pui
    
    # --- MAYORES ---
    "PA":           [{"name": "Runa Ga PA",  "weight": 100.0}],
    "PM":           [{"name": "Runa Ga PM", "weight": 90.0}], # Ga Pme suele mantenerse o ser "Runa PM"
    "Alcance":      [{"name": "Runa Al",     "weight": 51.0}],  # Antes Po (Portée) -> Al (Alcance)
    "Invocaciones": [{"name": "Runa Invo",   "weight": 30.0}],
    
    # --- COMBATE ---
    "Crítico":      [{"name": "Runa Cri",    "weight": 10.0}],
    "Curas":        [{"name": "Runa Cu",     "weight": 10.0}], # Antes So (Soin) -> Cu (Curas)
    "Prospección":  [{"name": "Runa Prospe",   "weight": 3.0}],  # Antes Prospe
    "Placaje":      [{"name": "Runa Pla",    "weight": 4.0}],  # Antes Tac (Tacle) -> Pla (Placaje)
    "Huida":        [{"name": "Runa Hui",    "weight": 4.0}],  # Antes Fui (Fuite) -> Hui (Huida)
    
    # --- DAÑOS ELEMENTALES (Do -> Da) ---
    "Daños Neutrales": [{"name": "Runa Da Neutral", "weight": 5.0}],
    "Daños Tierra":    [{"name": "Runa Da Tierra", "weight": 5.0}], # Ter -> Tie
    "Daños Fuego":     [{"name": "Runa Da Fuego", "weight": 5.0}], # Feu -> Fue
    "Daños Agua":      [{"name": "Runa Da Agua", "weight": 5.0}], # Eau -> Agu
    "Daños Aire":      [{"name": "Runa Da Aire", "weight": 5.0}], # Air -> Air
    
    # --- OTROS DAÑOS ---
    "Daños":           [{"name": "Runa Da",      "weight": 20.0}],
    "Daños Trampas":   [{"name": "Runa Da Tram",  "weight": 5.0}],
    "Daños Críticos":  [{"name": "Runa Da Cri",  "weight": 5.0}],
    "Empuje":          [{"name": "Runa Da Emp",  "weight": 5.0}], # Pou -> Emp
    "Daños Reenvio":   [{"name": "Runa Da Reen", "weight": 5.0}],
    "Potencia Trampas": [{"name": "Runa Por Tram", "weight": 2.0}],
    
    # --- RETIRAS Y ESQUIVAS ---
    "Retiro PA":  [{"name": "Runa Ret PA",  "weight": 7.0}],
    "Retiro PM":  [{"name": "Runa Ret PM",  "weight": 7.0}],
    "Esquiva PA": [{"name": "Runa Re PA",  "weight": 7.0}], # Ré -> Esq (Esquiva)
    "Esquiva PM": [{"name": "Runa Re PM",  "weight": 7.0}], # Ré -> Esq

    # --- RESISTENCIAS FIJAS (Ré -> Res) ---
    "Resistencia Fuego":   [{"name": "Runa Re Fuego", "weight": 2.0}],
    "Resistencia Aire":    [{"name": "Runa Re Aire", "weight": 2.0}],
    "Resistencia Tierra":  [{"name": "Runa Re Tierra", "weight": 2.0}],
    "Resistencia Agua":    [{"name": "Runa Re Agua", "weight": 2.0}],
    "Resistencia Neutral": [{"name": "Runa Re Neutral", "weight": 2.0}],
    "Resistencia Empuje":  [{"name": "Runa Re Emp", "weight": 2.0}],
    "Resistencia Críticos":[{"name": "Runa Re Cri", "weight": 2.0}],
    
    # --- RESISTENCIAS % (Ré Per -> Res %) ---
    "% Resistencia Fuego":   [{"name": "Runa Re Fuego Por", "weight": 6.0}],
    "% Resistencia Aire":    [{"name": "Runa Re Aire Por", "weight": 6.0}],
    "% Resistencia Tierra":  [{"name": "Runa Re Tierra Por", "weight": 6.0}],
    "% Resistencia Agua":    [{"name": "Runa Re Agua Por", "weight": 6.0}],
    "% Resistencia Neutral": [{"name": "Runa Re Neutral Por", "weight": 6.0}],

    # --- NUEVAS RUNAS (DOFUS 3 / SCRIPT) ---
    "% Daños Hechizos": [{"name": "Runa Da Por He", "weight": 15.0}],
    "% Daños Armas": [{"name": "Runa Da Por Ar", "weight": 15.0}],
    "% Daños Distancia": [{"name": "Runa Da Por Di", "weight": 15.0}],
    "% Daños Cuerpo a Cuerpo": [{"name": "Runa Da Por CC", "weight": 15.0}],
    "% Resistencia Cuerpo a Cuerpo": [{"name": "Runa Re Por CC", "weight": 10.0}],
    "% Resistencia Distancia": [{"name": "Runa Re Por Di", "weight": 10.0}],
    "Arma de caza": [{"name": "Runa de caza", "weight": 5.0}],
}

# --- 4. HELPERS ---

def normalize_stat_name(raw_name: str) -> str:
    """
    Convierte cualquier variación de texto OCR/User input en la Key Oficial
    de Dofus 3.4.
    Ej: "de resistencia a la tierra" -> "Resistencia Tierra"
    Ej: "% res fuego" -> "% Resistencia Fuego"
    """
    # 1. Limpieza inicial: Minúsculas y quitar acentos básicos para facilitar regex
    text = raw_name.lower().strip()
    replacements = (('á', 'a'), ('é', 'e'), ('í', 'i'), ('ó', 'o'), ('ú', 'u'), ('.', ''))
    for old, new in replacements:
        text = text.replace(old, new)
    
    # 2. Detectar Elementos (Tokens comunes)
    element = None
    if "fuego" in text or "inte" in text: element = "Fuego"
    elif "tierra" in text or "fuerza" in text and "res" in text: element = "Tierra" # Cuidado con confundir stat Fuerza
    elif "agua" in text or "suerte" in text and "res" in text: element = "Agua"
    elif "aire" in text or "agilidad" in text and "res" in text: element = "Aire"
    elif "neutral" in text or "neutro" in text: element = "Neutral"
    elif "empuje" in text: element = "Empuje"
    elif "critico" in text: element = "Críticos"
    elif "trampa" in text: element = "Trampas"
    elif "cac" in text or "cuerpo" in text: element = "Cuerpo a Cuerpo"
    elif "distancia" in text: element = "Distancia"
    elif "arma" in text: element = "Armas"
    elif "hechizo" in text: element = "Hechizos"

    # 3. Detectar si es Porcentual (%)
    is_percent = "%" in text

    # --- LÓGICA DE CATEGORÍAS ---

    # A. RESISTENCIAS (La más compleja de mapear)
    # Detecta: "resistencia", "res", "resis"
    if re.search(r'\bres(?:is|istencia)?\b', text):
        if not element: return "Resistencia" # Caso raro
        prefix = "% " if is_percent else ""
        return f"{prefix}Resistencia {element}"

    # A.1 POTENCIA (Prioridad Alta para evitar confusión con Daños)
    if "potencia" in text or "pui" in text: 
        if "trampa" in text: return "Potencia Trampas"
        return "Potencia"

    # B. DAÑOS (Daños fijos, elementales, especiales)
    # Detecta: "daño", "danos", "do"
    if re.search(r'\b(?:da|do)(?:ñ|n)os?\b', text):
        prefix = "% " if is_percent else ""
        if "reenvio" in text: return "Daños Reenvio"
        if element:
            if element == "Neutral": return f"{prefix}Daños Neutrales"
            if element == "Empuje": return "Empuje"
            return f"{prefix}Daños {element}"
        # Fix: Ensure "Daños" doesn't match "Daños Críticos" or "Daños Trampas" if they were not caught by element
        if "critico" in text: return "Daños Críticos"
        if "trampa" in text: return "Daños Trampas"
        return "Daños" # Daños genéricos

    # C. RETIRAS Y ESQUIVAS
    # Detecta "retiro", "ret"
    if "retiro" in text or "ret" in text:
        if "pm" in text: return "Retiro PM"
        if "pa" in text: return "Retiro PA"
    
    # Detecta "esquiva", "esq"
    if "esquiva" in text or "esq" in text:
        if "pm" in text: return "Esquiva PM"
        if "pa" in text: return "Esquiva PA"

    # D. STATS BASE (Simples)
    # Usamos "startswith" o regex simple para evitar falsos positivos
    if "vitalidad" in text or text == "vit": return "Vitalidad"
    if "sabiduria" in text or text == "sab": return "Sabiduría"
    if "inteligencia" in text or text == "inte": return "Inteligencia"
    if "fuerza" in text or text == "fo": return "Fuerza"
    if "agilidad" in text or text == "agi": return "Agilidad"
    if "suerte" in text or text == "cha": return "Suerte"
    
    # E. OTROS
    if "iniciativa" in text or "ini" in text: return "Iniciativa"
    if "prospeccion" in text or "pros" in text: return "Prospección"
    # Potencia moved to A.1
    if "pod" in text: return "Pods"
    if "curas" in text or "curaciones" in text or "cura" in text: return "Curas"
    if "placaje" in text: return "Placaje"
    if "huida" in text: return "Huida"
    if "invoca" in text: return "Invocaciones"
    if "alcance" in text or re.match(r'\bal\b', text) or text == "po": return "Alcance"
    if "caza" in text: return "Arma de caza"
    
    # F. CRÍTICO (Solo)
    if "critico" in text and "daño" not in text and "res" not in text:
        return "Crítico"

    # G. PA / PM (Tokens cortos, cuidado con falsos positivos)
    # Buscamos PA o PM aislado, o al inicio/fin
    if re.search(r'\bpa\b', text) and "opa" not in text: return "PA"
    if re.search(r'\bpm\b', text): return "PM"

    # Fallback: Retornar el original capitalizado si no se encontró nada
    return raw_name.title()

def get_rune_info(stat_name: str):
    # 1. Normalizamos el nombre sucio a la Key Oficial
    official_name = normalize_stat_name(stat_name)
    
    # 2. Buscamos directamente en la DB
    if official_name in RUNE_DB:
        return RUNE_DB[official_name][0]
    
    return None

def get_stat_density(stat_name: str) -> float:
    # 1. Normalizamos
    official_name = normalize_stat_name(stat_name)
    
    # 2. Buscamos densidad
    return STAT_DENSITIES.get(official_name, 0.0)

async def calculate_profit(request: CalculateRequest) -> CalculateResponse:
    total_rune_value = 0.0
    breakdown_list = []
    
    # 1. VALIDACIÓN Y PREPARACIÓN
    item_lvl = getattr(request, "item_level", 200) 
    server_coef = request.coefficient / 100.0

    # 2. FASE 1: CALCULAR EL 'POOL' DE ROMPIMIENTO (VR)
    # Calculamos el VR de cada stat usando la fórmula del script.
    
    stat_vrs = {}      # Diccionario para guardar el VR de cada stat individual
    total_vr_sum = 0.0 # Suma total de todos los VR del objeto

    for stat in request.stats:
        density = get_stat_density(stat.name)
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
        rune_info = get_rune_info(stat.name)
        if rune_info:
            rune_names_to_fetch.add(rune_info["name"])
    
    image_map = {}
    if rune_names_to_fetch:
        names_list = list(rune_names_to_fetch)
        async with httpx.AsyncClient() as client:
            tasks = [buscar_y_obtener_imagen(name, client) for name in names_list]
            results = await asyncio.gather(*tasks)
            image_map = dict(zip(names_list, results))
    # -----------------------------------------------------

    for stat in request.stats:
        rune_info = get_rune_info(stat.name)
        
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
            weight=get_stat_density(stat.name),
            
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