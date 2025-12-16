import cv2
import numpy as np
import pyautogui

def buscar_precio_dinamico(imagen_referencia_path, offset_x=50, offset_y=0, w=100, h=30):
    """
    Busca una imagen en pantalla y devuelve la región del precio relativa a ella.
    offset_x/y: Cuántos píxeles a la derecha/abajo está el precio respecto a la referencia.
    w/h: Ancho y alto de la caja del precio.
    """
    # 1. Tomar screenshot completa
    screenshot = pyautogui.screenshot()
    screenshot = np.array(screenshot)
    # Convertir a BGR (formato OpenCV)
    screen_img = cv2.cvtColor(screenshot, cv2.COLOR_RGB2BGR)
    
    # 2. Cargar imagen referencia (ej. icono de kamas)
    template = cv2.imread(imagen_referencia_path)
    if template is None:
        print("Error: No se encontró la imagen de referencia.")
        return None

    # 3. Buscar la referencia en la pantalla
    # TM_CCOEFF_NORMED es el mejor método para coincidencias exactas
    resultado = cv2.matchTemplate(screen_img, template, cv2.TM_CCOEFF_NORMED)
    
    # Definir umbral de confianza (0.8 = 80% de similitud)
    umbral = 0.8
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(resultado)
    
    if max_val >= umbral:
        # max_loc es la esquina superior izquierda de donde encontró la referencia
        ref_x, ref_y = max_loc
        h_template, w_template = template.shape[:2]
        
        # 4. Calcular dónde está el precio relativo a la referencia
        # Aquí ajustamos: "Si encontré el icono, el precio está X píxeles a la derecha"
        precio_x = ref_x + w_template + offset_x
        precio_y = ref_y + offset_y
        
        # Dibujar un rectángulo para verificar visualmente (opcional)
        cv2.rectangle(screen_img, (precio_x, precio_y), (precio_x + w, precio_y + h), (0, 255, 0), 2)
        cv2.imwrite('debug_deteccion.png', screen_img) # Guarda foto para comprobar
        
        return (precio_x, precio_y, w, h)
    else:
        print("No se encontró la referencia en pantalla.")
        return None

# Uso:
# region_detectada = buscar_precio_dinamico('icono_kama.png', offset_x=10, w=80)
# if region_detectada:
#     precio = leer_precio_dofus(region_detectada) # Tu función del script anterior