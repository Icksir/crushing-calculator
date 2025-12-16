import cv2
import pytesseract
import numpy as np
from PIL import ImageGrab

# Configura la ruta a tu ejecutable de tesseract si no está en el PATH
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def leer_precio_dofus(region):
    """
    region: tupla (x, y, width, height) de la zona del precio en pantalla
    """
    # 1. Captura de pantalla de la zona específica
    screenshot = ImageGrab.grab(bbox=region)
    
    # Convertir a formato que entiende OpenCV (numpy array)
    img = np.array(screenshot)
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    # --- PREPROCESAMIENTO (La clave del éxito) ---
    
    # A. Escala de grises
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # B. Escalado (Upscaling): Tesseract funciona mal con fuentes pequeñas (menos de 30px de alto)
    # Aumentamos la imagen x3 usando interpolación cúbica para mantener bordes suaves
    gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    
    # C. Binarización (Thresholding):
    # Convertimos todo a blanco o negro puro. 
    # Ajusta el valor '150' según el brillo del texto en Dofus 3.
    # Si el texto es blanco sobre fondo oscuro, usa cv2.THRESH_BINARY_INV
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)

    # Opcional: Dilatación si los números son muy finos
    # kernel = np.ones((2,2), np.uint8)
    # thresh = cv2.dilate(thresh, kernel, iterations=1)

    # --- LECTURA OCR ---
    
    # Configuración CRÍTICA para juegos:
    # --psm 7: Asume que es una sola línea de texto.
    # whitelist: Le forzamos a buscar SOLO números y caracteres de moneda (k, m, puntos).
    custom_config = r'--psm 7 -c tessedit_char_whitelist=0123456789.mk'
    
    texto = pytesseract.image_to_string(thresh, config=custom_config)
    
    # Limpieza final del string
    return texto.strip()

# Ejemplo de uso (ajusta las coordenadas a tu pantalla)
# x=100, y=200, ancho=150, alto=40
coordenadas_precio = (100, 200, 250, 240) 

# Nota: Para probar, puedes mostrar la imagen procesada con cv2.imshow para calibrar
precio = leer_precio_dofus(coordenadas_precio)
print(f"Precio detectado: {precio}")