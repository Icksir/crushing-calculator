import cv2
import pytesseract
import numpy as np
from PIL import ImageGrab, Image
import time
import re
import os # Importamos os para verificar si existen carpetas

# --- CONFIGURACIÓN ---
# Tus coordenadas (x, y, w, h)
REGION_MERCADILLO = (2001, 173, 436, 357)

# [NUEVO] Configuración OCR para NOMBRES (letras y espacios)
# --psm 7: Trata la imagen como una sola línea de texto.
# whitelist: Permite letras mayúsculas, minúsculas, espacio, guion y apóstrofe (comunes en Dofus).
config_tesseract_nombre = r'--psm 7 -c tessedit_char_whitelist="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ \'-"'

# Configuración OCR para PRECIOS (existente)
config_tesseract_precios = r'--psm 6 -c tessedit_char_whitelist=x0123456789.'

def preprocesar_hsv(img):
    if img is None or img.size == 0: return None
    
    # 1. Escalado (Zoom x3) para definir mejor los caracteres
    scale = 3
    # Usamos INTER_LINEAR que es un poco más suave para letras, o INTER_CUBIC
    img_resized = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # 2. Convertir a espacio de color HSV
    hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
    
    # --- FILTRO MÁGICO PARA TEXTO BLANCO ---
    # Hue: 0-180 (Cualquier color)
    # Saturation: 0-50 (Baja saturación = tirando a blanco/gris)
    # Value: 190-255 (Alto brillo = blanco intenso)
    lower_white = np.array([0, 0, 190])
    upper_white = np.array([180, 50, 255])
    
    # Crear máscara
    mask = cv2.inRange(hsv, lower_white, upper_white)
    
    # 3. Invertir máscara (Texto negro sobre fondo blanco para Tesseract)
    mask_inv = cv2.bitwise_not(mask)
    
    # [OPCIONAL] Un poco de dilatación para engrosar letras delgadas si hace falta
    # kernel = np.ones((2,2), np.uint8)
    # mask_inv = cv2.erode(mask_inv, kernel, iterations=1)
    
    return mask_inv

def parsear_resultados_precios(texto_raw):
    """Analiza texto con el formato: x1 792"""
    resultados = {}
    lineas = texto_raw.split('\n')
    patron = re.compile(r'x\s*([\d\.]+)\s+([\d\.]+)')

    for linea in lineas:
        linea = linea.strip()
        if not linea: continue
        
        match = patron.search(linea)
        if match:
            lote_str = match.group(1)
            precio_str = match.group(2)
            
            try:
                lote_clean = lote_str.replace('.', '')
                precio_clean = precio_str.replace('.', '')
                lote = int(lote_clean)
                precio = int(precio_clean)
                resultados[f"x{lote}"] = precio
                print(f"   ✅ Leído: Lote {lote} -> {precio} kamas")
            except ValueError:
                continue
    return resultados

def main():
    print(f"📸 Capturando región: {REGION_MERCADILLO}...")
    x, y, w, h = REGION_MERCADILLO
    
    try:
        bbox = (x, y, x + w, y + h)
        screenshot = ImageGrab.grab(bbox=bbox, all_screens=True)
        img_np = np.array(screenshot)
        img = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    except Exception as e:
        print(f"❌ Error captura: {e}")
        return

    h_img, w_img = img.shape[:2]
    print(f"Dimensiones captura: {w_img}x{h_img}")

    # ==========================================
    # [NUEVO] --- EXTRACCIÓN DEL NOMBRE ---
    # ==========================================
    print("🔍 Extrayendo nombre del objeto...")
    
    # 1. Definir ROI del Nombre (Region of Interest)
    # Basado en tus imágenes, el nombre está arriba a la derecha del icono.
    # y: empieza aprox en el pixel 10 y termina en el 55 (altura de 45px)
    # x: empieza después del icono (aprox px 85) y va hasta casi el final.
    roi_nombre = img[40:65, 85:w_img]

    # 2. Preprocesar (Usamos el mismo filtro HSV, funciona bien para texto blanco)
    img_nombre_proc = preprocesar_hsv(roi_nombre)

    # Guardar debug
    # cv2.imwrite("debug_nombre_mask.png", img_nombre_proc)

    # 3. OCR con configuración de SÓLO LETRAS
    nombre_raw = pytesseract.image_to_string(img_nombre_proc, config=config_tesseract_nombre)
    
    # Limpieza básica: quitar espacios al inicio/final y tomar solo la primera línea si hubiera basura
    nombre_limpio = nombre_raw.strip().split('\n')[0]

    if not nombre_limpio:
        nombre_limpio = "Desconocido/No detectado"
        print("⚠️ No se pudo leer el nombre claramente.")
    else:
        print(f"📦 NOMBRE DETECTADO: '{nombre_limpio}'")

    # ==========================================
    # --- EXTRACCIÓN DE PRECIOS (Existente) ---
    # ==========================================
    print("💰 Extrayendo precios...")
    # Ajuste de recorte de la tabla (tu recorte original estaba bien)
    # y: desde 180 hasta el final
    # x: desde 60 (saltar icono lote) hasta ancho-120 (saltar botón comprar)
    roi_precios = img[180:h_img, 60:w_img-120]

    # Procesar y guardar debug
    img_precios_proc = preprocesar_hsv(roi_precios)
    # cv2.imwrite("debug_precios_mask.png", img_precios_proc)
    
    # OCR con configuración de SÓLO NÚMEROS y 'x'
    texto_precios = pytesseract.image_to_string(img_precios_proc, config=config_tesseract_precios)
    
    # Parsear
    datos_precios = parsear_resultados_precios(texto_precios)

    # ==========================================
    # --- RESULTADO FINAL ---
    # ==========================================
    resultado_final = {
        "nombre_objeto": nombre_limpio,
        "precios_mercado": datos_precios
    }

    print("\n" + "="*30)
    print("✅ JSON FINAL COMPLETO:", resultado_final)
    print("="*30)

if __name__ == "__main__":
    # Pequeña pausa para cambiar de ventana si es necesario
    print("Iniciando en 2 segundos...")
    time.sleep(2)
    main()