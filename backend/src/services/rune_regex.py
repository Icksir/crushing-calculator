STAT_MAPS = {
    "es": {
        # --- Porcentajes ---
        '% crítico': 'Crítico',
        '% daños CaC': '% Daños Cuerpo a Cuerpo',
        '% daños distancia': '% Daños Distancia',
        '% daños a los hechizos': '% Daños Hechizos',
        '% daños de hechizos': '% Daños Hechizos',
        '% daños de armas': '% Daños Armas',
        
        '% resistencia CaC': '% Resistencia Cuerpo a Cuerpo',
        '% resistencia distancia': '% Resistencia Distancia',
        '% resistencia a la tierra': '% Resistencia Tierra',
        '% resistencia al agua': '% Resistencia Agua',
        '% resistencia al aire': '% Resistencia Aire',
        '% resistencia al fuego': '% Resistencia Fuego',
        '% resistencia neutral': '% Resistencia Neutral',

        # --- Daños Fijos ---
        'de daño': 'Daños',
        'de daño crítico': 'Daños Críticos',
        'de daño neutro': 'Daños Neutrales',
        'de daño de tierra': 'Daños Tierra',
        'de daño de fuego': 'Daños Fuego',
        'de daño de agua': 'Daños Agua',
        'de daño de aire': 'Daños Aire',
        'de daño de empuje': 'Empuje',
        'de daño de trampas': 'Daños Trampas',
        'de daños devueltos': 'Daños Reenvio',

        # --- Resistencias Fijas ---
        'de resistencia a críticos': 'Resistencia Críticos',
        'de resistencia a los críticos': 'Resistencia Críticos', # Variante común
        'de resistencia a la tierra': 'Resistencia Tierra',
        'de resistencia al agua': 'Resistencia Agua',
        'de resistencia al aire': 'Resistencia Aire',
        'de resistencia al fuego': 'Resistencia Fuego',
        'de resistencia al neutro': 'Resistencia Neutral',
        'de resistencia al empuje': 'Resistencia Empuje',

        # --- Stats Base ---
        'vitalidad': 'Vitalidad',
        'fuerza': 'Fuerza',
        'inteligencia': 'Inteligencia',
        'suerte': 'Suerte',
        'agilidad': 'Agilidad',
        'sabiduría': 'Sabiduría',
        
        'iniciativa': 'Iniciativa',
        'prospección': 'Prospección',
        'pod': 'Pods',
        
        # --- Potencia ---
        'potencia (daños generales)': 'Potencia',
        'potencia (daños generales) con trampas': 'Potencia Trampas',

        # --- PA / PM / Alcance ---
        'PA': 'PA',
        'PM': 'PM',
        'alcance': 'Alcance',
        
        # --- Retiros y Esquivas ---
        'al retiro de PA': 'Retiro PA',
        'supresión PA': 'Retiro PA',
        'al retiro de PM': 'Retiro PM',
        'supresión PM': 'Retiro PM',
        
        'esquiva de PA': 'Esquiva PA',
        'a la esquiva pérdidas de PA': 'Esquiva PA',
        'esquiva PM': 'Esquiva PM',
        'a la esquiva pérdidas de PM': 'Esquiva PM',

        # --- Otros ---
        'invocaciones': 'Invocaciones',
        'de cura': 'Curas',
        'placaje': 'Placaje',
        'huida': 'Huida',
        'Arma de caza': 'Arma de caza', # Único stat especial que se suele conservar
        },
    
    # IMPORTANTE: Los idiomas EN y FR también deben devolver 
    # las llaves en ESPAÑOL para que coincidan con tu STAT_DENSITIES.
    "en": {
        # ==========================================
        # 1. PORCENTAJES
        # ==========================================
        "% Fire Resistance": "% Resistencia Fuego",
        "% Air Resistance": "% Resistencia Aire",
        "% Earth Resistance": "% Resistencia Tierra",
        "% Water Resistance": "% Resistencia Agua",
        "% Neutral Resistance": "% Resistencia Neutral",
        
        "% Spell Damage": "% Daños Hechizos",
        "% Weapon Damage": "% Daños Armas",
        "% Ranged Damage": "% Daños Distancia",
        "% Melee Damage": "% Daños Cuerpo a Cuerpo",
        
        "% Ranged Resistance": "% Resistencia Distancia",
        "% Melee Resistance": "% Resistencia Cuerpo a Cuerpo",
        
        "% Critical": "Crítico",
        ": +% Critical": "Crítico",

        # ==========================================
        # 2. DAÑOS ESPECÍFICOS
        # ==========================================
        "Neutral Damage": "Daños Neutrales",
        "Earth Damage": "Daños Tierra",
        "Fire Damage": "Daños Fuego",
        "Water Damage": "Daños Agua",
        "Air damage": "Daños Aire", # Nota: la lista original tenía 'd' minúscula
        
        "Critical Damage": "Daños Críticos",
        "Trap Damage": "Daños Trampas",
        "Pushback Damage": "Empuje",
        "reflected damage": "Daños Reenvio",

        # ==========================================
        # 3. RESISTENCIAS FIJAS
        # ==========================================
        "Fire Resistance": "Resistencia Fuego",
        "Air Resistance": "Resistencia Aire",
        "Earth Resistance": "Resistencia Tierra",
        "Water Resistance": "Resistencia Agua",
        "Neutral Resistance": "Resistencia Neutral",
        
        "Pushback Resistance": "Resistencia Empuje",
        "Critical Resistance": "Resistencia Críticos",

        # ==========================================
        # 4. ESQUIVAS Y RETIROS
        # ==========================================
        "AP Reduction": "Retiro PA",
        "MP Reduction": "Retiro PM",
        "AP Parry": "Esquiva PA",
        "MP Parry": "Esquiva PM",

        # ==========================================
        # 5. STATS BASE
        # ==========================================
        "Strength": "Fuerza",
        "Intelligence": "Inteligencia",
        "Chance": "Suerte",
        "Agility": "Agilidad",
        "Vitality": "Vitalidad",
        "Wisdom": "Sabiduría",
        "Initiative": "Iniciativa",
        "Pod": "Pods",
        "Summons": "Invocaciones",
        "Heal": "Curas",
        "Prospecting": "Prospección",
        "Lock": "Placaje",
        "Dodge": "Huida",
        
        # Potencia
        "Power": "Potencia",
        "Power (traps)": "Potencia Trampas",

        # ==========================================
        # 6. ABREVIATURAS Y VARIANTES
        # ==========================================
        "AP": "PA",
        ": - AP": "PA", # Malus, pero la runa es PA
        "MP": "PM",
        
        # Alcance (Variantes de la lista)
        "Range": "Alcance",
        ": + Maximum Range": "Alcance",
        ": modifiable Range": "Alcance",
        
        # Daños Genéricos (Variantes de la lista)
        "Damage": "Daños",
        ": + Damage": "Daños",
        ": + base damage": "Daños",
        
        # Especiales
        "Hunting weapon": "Arma de caza"
        },

    "fr": {
        # --- Porcentajes ---
        '% Critique': 'Crítico',
        '% Dommages mêlée': '% Daños Cuerpo a Cuerpo',
        '% Dommages distance': '% Daños Distancia',
        '% Dommages aux sorts': '% Daños Hechizos',
        '% Dommages d\'armes': '% Daños Armas', # Nota el escape de la comilla simple

        '% Résistance mêlée': '% Resistencia Cuerpo a Cuerpo',
        '% Résistance distance': '% Resistencia Distancia',
        '% Résistance Terre': '% Resistencia Tierra',
        '% Résistance Eau': '% Resistencia Agua',
        '% Résistance Air': '% Resistencia Aire',
        '% Résistance Feu': '% Resistencia Fuego',
        '% Résistance Neutre': '% Resistencia Neutral',

        # --- Daños Fijos (Dommage) ---
        # Nota: Dofus FR es inconsistente (singular "Dommage" vs plural "Dommages")
        # Copiamos exactamente como viene en tu lista.
        'Dommage': 'Daños',
        'Dommage Critiques': 'Daños Críticos',
        'Dommage Neutre': 'Daños Neutrales',
        'Dommage Terre': 'Daños Tierra',
        'Dommage Feu': 'Daños Fuego',
        'Dommage Eau': 'Daños Agua',
        'Dommage Air': 'Daños Aire',
        'Dommage Poussée': 'Empuje',
        'Dommage Pièges': 'Daños Trampas',
        'Dommages Renvoyés': 'Daños Reenvio',

        # --- Resistencias Fijas ---
        'Résistance Critiques': 'Resistencia Críticos',
        'Résistance Terre': 'Resistencia Tierra',
        'Résistance Eau': 'Resistencia Agua',
        'Résistance Air': 'Resistencia Aire',
        'Résistance Feu': 'Resistencia Fuego',
        'Résistance Neutre': 'Resistencia Neutral',
        'Résistance Poussée': 'Resistencia Empuje',

        # --- Stats Base ---
        'Vitalité': 'Vitalidad',
        'Force': 'Fuerza',
        'Intelligence': 'Inteligencia',
        'Chance': 'Suerte',
        'Agilité': 'Agilidad',
        'Sagesse': 'Sabiduría',
        
        'Initiative': 'Iniciativa',
        'Prospection': 'Prospección',
        'Pod': 'Pods',
        
        # --- Potencia ---
        'Puissance': 'Potencia',
        'Puissance Pièges': 'Potencia Trampas',

        # --- PA / PM / Alcance ---
        'PA': 'PA',
        'PM': 'PM',
        'Portée': 'Alcance',
        
        # --- Retiros y Esquivas ---
        'Retrait PA': 'Retiro PA',
        'Retrait PM': 'Retiro PM',
        
        'Esquive PA': 'Esquiva PA',
        'Esquive PM': 'Esquiva PM',

        # --- Otros ---
        'Invocation': 'Invocaciones',
        'Soin': 'Curas',
        'Tacle': 'Placaje',
        'Fuite': 'Huida',
        'Arme de chasse': 'Arma de caza',
    }
}