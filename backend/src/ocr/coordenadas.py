import tkinter as tk
from tkinter import Canvas
import pyautogui
from PIL import Image, ImageTk
import warnings

warnings.filterwarnings("ignore")

# --- CONFIGURACIÓN DE TU PANTALLA ---
# Ajusta esto según tu resolución.
# Si tu pantalla principal es 1920x1080 y la segunda está a la derecha:
OFFSET_X = 1920  # Donde empieza tu segunda pantalla (ancho de la primera)
OFFSET_Y = 0     # Usualmente 0 si están alineadas arriba
WIDTH = 1920     # Ancho de la segunda pantalla (donde está el juego)
HEIGHT = 1080    # Alto de la segunda pantalla

class SelectorFakeTransparency:
    def __init__(self):
        print("1. Tomando captura de la pantalla para simular transparencia...")
        try:
            # Capturamos SOLO la zona del segundo monitor
            # region=(left, top, width, height)
            self.screenshot = pyautogui.screenshot(region=(OFFSET_X, OFFSET_Y, WIDTH, HEIGHT))
        except Exception as e:
            print(f"Error al tomar captura (¿tienes 'scrot' instalado?): {e}")
            return

        self.root = tk.Tk()
        
        # --- TRUCO PARA MOVER LA VENTANA A LA 2DA PANTALLA ---
        # Formato de geometry: "anchoxalto+pos_x+pos_y"
        self.root.geometry(f"{WIDTH}x{HEIGHT}+{OFFSET_X}+{OFFSET_Y}")
        
        # Quitamos bordes para que parezca full screen
        self.root.overrideredirect(True)
        
        self.puntos = []
        self.canvas = Canvas(self.root, width=WIDTH, height=HEIGHT, highlightthickness=0)
        self.canvas.pack(fill="both", expand=True)

        # Convertir la captura para que Tkinter la pueda mostrar
        self.tk_image = ImageTk.PhotoImage(self.screenshot)
        
        # Poner la imagen de fondo (esto simula la transparencia)
        self.canvas.create_image(0, 0, image=self.tk_image, anchor="nw")
        
        # Bindings
        self.canvas.bind("<Button-1>", self.on_click)
        self.root.bind("<Escape>", lambda e: self.root.destroy())

        print("\n=== INSTRUCCIONES ===")
        print("Haz clic en las 4 esquinas del precio en la imagen estática.")
        print("Presiona ESC para salir.")
        
        self.root.mainloop()

    def on_click(self, event):
        x, y = event.x, event.y
        self.puntos.append((x, y))
        
        # Dibujar marca visual (círculo rojo)
        r = 5
        self.canvas.create_oval(x-r, y-r, x+r, y+r, fill='red', outline='yellow', width=2)
        print(f"Punto {len(self.puntos)}: ({x}, {y}) [Relativo a la segunda pantalla]")

        if len(self.puntos) == 4:
            self.calcular_region()

    def calcular_region(self):
        xs = [p[0] for p in self.puntos]
        ys = [p[1] for p in self.puntos]
        
        min_x = min(xs)
        max_x = max(xs)
        min_y = min(ys)
        max_y = max(ys)
        
        w_rect = max_x - min_x
        h_rect = max_y - min_y
        
        # Dibujar rectángulo final
        self.canvas.create_rectangle(min_x, min_y, max_x, max_y, outline='green', width=3)
        self.root.update()
        
        # AJUSTE IMPORTANTE:
        # Las coordenadas que obtuvimos son RELATIVAS a la ventana (0,0 es la esquina del 2do monitor).
        # Para que PyAutoGUI las entienda después, debemos sumar el OFFSET.
        
        final_x = min_x + OFFSET_X
        final_y = min_y + OFFSET_Y
        
        print("\n✅ ¡COORDENADAS GLOBALES OBTENIDAS!")
        print("Copia esto en tu bot:")
        print("-" * 40)
        print(f"region = ({final_x}, {final_y}, {w_rect}, {h_rect})")
        print("-" * 40)
        
        self.root.after(2000, self.root.destroy)

if __name__ == "__main__":
    app = SelectorFakeTransparency()