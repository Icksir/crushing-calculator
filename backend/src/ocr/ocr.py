import cv2
import pytesseract
import numpy as np
from PIL import ImageGrab, Image
import time
import re

# --- CONFIGURACIÓN ---
# Tus coordenadas (x, y, w, h)
REGION_MERCADILLO = (2001, 173, 436, 357)

# Configuración OCR
# --psm 6: Asume un bloque de texto uniforme (ideal para listas).
config_tesseract = r'--psm 6 -c tessedit_char_whitelist=x0123456789.'

def preprocesar_hsv(img):
    if img is None: return None
    
    # 1. Escalado (Zoom x3) para definir mejor los caracteres
    scale = 3
    img_resized = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # 2. Convertir a espacio de color HSV
    hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
    
    # --- FILTRO MÁGICO ---
    # Definimos qué es "blanco" en Dofus
    # Hue: 0-180 (Cualquier color, no importa en blancos)
    # Saturation: 0-40 (Muy bajo, sin intensidad de color)
    # Value: 180-255 (Muy alto, muy brillante)
    lower_white = np.array([0, 0, 180])
    upper_white = np.array([180, 30, 255])
    
    # Crear máscara: Pone en BLANCO (255) lo que coincide, y NEGRO (0) lo demás
    mask = cv2.inRange(hsv, lower_white, upper_white)
    
    # 3. Invertir máscara
    # Tesseract prefiere letras Negras sobre fondo Blanco.
    # Actualmente 'mask' tiene letras blancas sobre fondo negro. Invertimos:
    mask_inv = cv2.bitwise_not(mask)
    
    # 4. Limpieza (Morfología) - Opcional
    # Si ves puntos negros sueltos (ruido), descomenta esto:
    # kernel = np.ones((2,2), np.uint8)
    # mask_inv = cv2.erode(mask_inv, kernel, iterations=1)
    
    return mask_inv

def parsear_resultados(texto_raw):
    """
    Analiza texto con el formato:
    x1 792
    x1.000 10
    """
    resultados = {}
    
    # Dividir el texto en líneas
    lineas = texto_raw.split('\n')
    
    # Regex Explicada:
    # x        -> Busca la letra literal 'x'
    # \s* -> 0 o más espacios (por si Tesseract lee "x 1")
    # ([\d\.]+) -> GRUPO 1 (Lote): Dígitos y puntos (ej: "1.000" o "100")
    # \s+      -> 1 o más espacios de separación
    # ([\d\.]+) -> GRUPO 2 (Precio): Dígitos y puntos (ej: "59.990")
    patron = re.compile(r'x\s*([\d\.]+)\s+([\d\.]+)')

    for linea in lineas:
        linea = linea.strip()
        if not linea: continue
        
        match = patron.search(linea)
        if match:
            lote_str = match.group(1)   # Ej: "1.000"
            precio_str = match.group(2) # Ej: "10"
            
            try:
                # 1. Limpieza: Eliminar los puntos de miles en AMBOS lados
                # Dofus usa "1.000" -> Python necesita "1000" para convertir a int
                lote_clean = lote_str.replace('.', '')
                precio_clean = precio_str.replace('.', '')
                
                # 2. Conversión
                lote = int(lote_clean)
                precio = int(precio_clean)
                
                # 3. Guardar en diccionario
                resultados[f"x{lote}"] = precio
                
                # Debug (Opcional, para ver en consola qué está validando)
                print(f"   ✅ Leído: Lote {lote} -> {precio} kamas")
                
            except ValueError:
                print(f"   ⚠️ Error convirtiendo línea: {linea}")
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


    # Ajuste de recorte:
    # Saltamos el encabezado (~100px) y cortamos el botón de la derecha (~100px)
    # Esto deja solo "x Cantidad       Precio"
    h_img, w_img = img.shape[:2]
    roi = img[180:h_img, 60:w_img-120] 

    # Procesar
    img_procesada = preprocesar_hsv(roi)

    # GUARDAR DEBUG (Vital para ajustar los valores HSV)
    cv2.imwrite("debug_hsv_mask.png", img_procesada)
    print("💾 Guardado 'debug_hsv_mask.png'. ¡Ábrela para verificar!")
    
    # OCR
    print("📖 Leyendo texto...")
    texto = pytesseract.image_to_string(img_procesada, config=config_tesseract)
    
    print(f"--- Texto Crudo Detectado ---\n{texto}\n-----------------------------")
    
    # Parsear
    datos = parsear_resultados(texto)
    print("✅ DATOS JSON:", datos)

if __name__ == "__main__":
    time.sleep(2)
    main()