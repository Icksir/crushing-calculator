import asyncio
from src.models.schemas import CalculateRequest, ItemStat
from src.services.calculator import calculate_profit

# --- FUNCIÓN DE REPORTES ---
def print_report(response):
    print("\n" + "="*50)
    print(f"💰 REPORTE DE BRISAGE (DOFUS 3 - UNITY)")
    print("="*50)
    print(f"💎 Valor Estimado: {response.total_estimated_value:,.0f} k")
    print(f"📉 Costo Objeto:   {response.item_cost:,.0f} k")
    print(f"📊 Profit Neto:    {response.net_profit:,.0f} k")
    print("-" * 50)
    
    print("DETALLE DE RUNAS OBTENIDAS:")
    for item in response.breakdown:
        # Solo mostramos si salió algo (count > 0)
        if item.count > 0:
            print(f"\n🔹 {item.stat} (Sink: {item.weight})")
            print(f"   -> {item.count} x {item.rune_name}")
            print(f"      Valor: {item.value:,.0f} k")
            if item.rune_image:
                print(f"      🖼️ URL: {item.rune_image}")
            else:
                print(f"      ❌ URL: No encontrada")

async def main():
    # --- CASO 1: ANILLO DE FUERZA ---
    # Objeto: 50 Fuerza.
    # Resultado esperado: ~60 Runa Fo (si coef es 120%)
    # SOLO enviamos precio de Runa Fo.
    
    print("\n🧪 TEST 1: Fuerza (Solo Runa Base)...")
    
    req_fuerza = CalculateRequest(
        item_cost=5000,
        coefficient=120, 
        stats=[
            ItemStat(name="Fuerza", value=50),
            ItemStat(name="Iniciativa", value=100)
        ],
        rune_prices={
            "Runa Fo": 50,   # Solo nos importa esta
            "Runa Ini": 10   # Y esta
        }
    )

    try:
        res = await calculate_profit(req_fuerza)
        print_report(res)
    except Exception as e:
        print(f"❌ Error: {e}")

    # --- CASO 2: VITALIDAD ---
    # Objeto: 400 Vitalidad.
    # Resultado esperado: ~400 Runa Vi (si coef es 100% y peso 0.2)
    # 400 * 0.2 = 80 Sink. 80 / 0.2 (peso runa) = 400 runas.
    
    print("\n\n🧪 TEST 2: Vitalidad (Solo Runa Base)...")
    
    req_vitalidad = CalculateRequest(
        item_cost=2000,
        coefficient=100,
        stats=[
            ItemStat(name="Vitalidad", value=400),
        ],
        rune_prices={
            "Runa Vi": 20 # Solo nos importa esta
        }
    )
    
    try:
        res_vi = await calculate_profit(req_vitalidad)
        print_report(res_vi)
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())