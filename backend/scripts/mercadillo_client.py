import requests
from PIL import ImageGrab, ImageChops, ImageStat
import io
import time
import threading

# IP de tu servidor SSH (si estás en la misma red o VPN)
SERVER_URL = "http://0.0.0.0:8000/api/scan" 
REGION_MERCADILLO = (2001, 173, 436, 357)

def send_image(image):
    # Convertir a bytes para enviar
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    # Enviar al servidor SSH
    print("🚀 Enviando al servidor...")
    try:
        response = requests.post(SERVER_URL, files={'file': img_byte_arr})
        if response.status_code == 200:
            print("✅ Respuesta del Servidor:")
            print(response.json())
        else:
            print(f"❌ Error servidor: {response.text}")
    except Exception as e:
        print(f"❌ No se pudo conectar: {e}")

def monitor_changes():
    x, y, w, h = REGION_MERCADILLO
    bbox = (x, y, x + w, y + h)
    
    print("👀 Monitoreando cambios en la región...")
    last_screenshot = ImageGrab.grab(bbox=bbox, all_screens=True)
    
    # Enviar primera captura
    threading.Thread(target=send_image, args=(last_screenshot,)).start()

    while True:
        time.sleep(1)
        current_screenshot = ImageGrab.grab(bbox=bbox, all_screens=True)
        
        diff = ImageChops.difference(last_screenshot, current_screenshot)
        if diff.getbbox():
            stat = ImageStat.Stat(diff)
            diff_amt = sum(stat.mean)
            
            # Solo si el cambio es sustancial (ajusta el 0.5 según necesites)
            if diff_amt > 6:
                print(f"📸 Cambio detectado! (Nivel: {diff_amt:.2f})")
                threading.Thread(target=send_image, args=(current_screenshot,)).start()
                last_screenshot = current_screenshot

if __name__ == "__main__":
    monitor_changes()