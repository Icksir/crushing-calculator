import requests

def obtener_efectos_dofus_api(lang="es", min_level=None, max_level=None, type_name_id=None):
    """
    Descarga items de la API de Dofusdu respetando los parámetros de filtrado
    y extrae los nombres únicos de los efectos inactivos (type.name).
    """
    # 1. Configuración del Endpoint (Path Parameters)
    game = "dofus3"
    endpoint = f"https://api.dofusdu.de/{game}/v1/{lang}/items/equipment/all"
    
    # 2. Configuración de Filtros (Query Parameters - según tu imagen)
    # Si el valor es None, requests no lo enviará, obteniendo el listado completo por defecto.
    query_params = {
        "sort[level]": "desc",  # Ordenar por nivel descendente (opcional)
        "filter[min_level]": min_level,
        "filter[max_level]": max_level,
        # "filter[type.name_id]": type_name_id # Ejemplo: ["wood"] para filtrar tipos
    }

    # Headers recomendados en la documentación (Gzip para velocidad)
    headers = {
        "Accept-Encoding": "gzip",
        "User-Agent": "EffectNormalizer/2.0 (Python)"
    }

    print(f"🚀 Conectando a: {endpoint}")
    print(f"⚙️  Aplicando filtros: { {k:v for k,v in query_params.items() if v is not None} }")

    try:
        # Petición GET con params
        response = requests.get(endpoint, headers=headers, params=query_params)
        response.raise_for_status() # Lanza error si hay 404, 500, etc.
        
        data = response.json()
        
        # La API devuelve los items directamente en una lista o dentro de una clave "items"
        # Según el endpoint /all, a veces devuelve la lista raíz o un dict.
        # En tu json anterior venía dentro de "items". Nos aseguramos:
        if isinstance(data, dict) and "items" in data:
            items_list = data["items"]
        elif isinstance(data, list):
            items_list = data
        else:
            items_list = []

        print(f"✅ Descarga completada. Procesando {len(items_list)} objetos...")

        # 3. Extracción de Nombres de Efectos (Tu lógica de normalización)
        nombres_unicos = set()

        for item in items_list:
            efectos = item.get("effects", [])
            if not efectos:
                continue

            for efecto in efectos:
                tipo = efecto.get("type", {})
                
                # CONDICIÓN: is_active debe ser False (son las etiquetas de stat)
                if tipo.get("is_active") is False:
                    nombre_raw = tipo.get("name")
                    if nombre_raw:
                        nombres_unicos.add(nombre_raw)

        return sorted(list(nombres_unicos))

    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return []
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return []

# --- BLOQUE PRINCIPAL ---
if __name__ == "__main__":
    # CONFIGURA AQUÍ TUS PARÁMETROS
    IDIOMA = "fr"       # "es", "fr", "en", "de"
    NIVEL_MIN = 1       # Cambia a 190 o 200 si solo quieres ver efectos de items finales
    NIVEL_MAX = 200     # null o 200
    
    # Llamada a la función
    resultados = obtener_efectos_dofus_api(
        lang=IDIOMA, 
        min_level=NIVEL_MIN, 
        max_level=NIVEL_MAX
    )

    if resultados:
        print(f"\n📋 --- LISTADO DE EFECTOS ({IDIOMA.upper()}) ---")
        print(f"Total encontrados: {len(resultados)}\n")
        
        print("KNOWN_EFFECTS = [")
        for nombre in resultados:
            print(f"    '{nombre}',")
        print("]")
    else:
        print("⚠️ No se encontraron resultados. Revisa los filtros o la conexión.")