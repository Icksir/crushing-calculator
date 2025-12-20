STAT_REGEX_PATTERNS = {
    "es": [
        # ==========================================
        # 1. PORCENTAJES (Prioridad Máxima)
        # ==========================================
        # Matches: "% resistencia al fuego", "% resistencia a la tierra", etc.
        (r"(?i)%\s*resis.*\b(?:a\s*l[aeos]*\s*)?(fuego|feu)", "% Resistencia Fuego"),
        (r"(?i)%\s*resis.*\b(?:a\s*l[aeos]*\s*)?(aire|air)", "% Resistencia Aire"),
        (r"(?i)%\s*resis.*\b(?:a\s*l[aeos]*\s*)?(tierra|terre)", "% Resistencia Tierra"),
        (r"(?i)%\s*resis.*\b(?:a\s*l[aeos]*\s*)?(agua|eau)", "% Resistencia Agua"),
        (r"(?i)%\s*resis.*\b(?:a\s*l[aeos]*\s*)?(neutr)", "% Resistencia Neutral"),
        
        # Matches: "% daños...", "% daños CaC", etc.
        (r"(?i)%\s*daños?\s*de\s*hechizos?", "% Daños Hechizos"), # "% daños de hechizos"
        (r"(?i)%\s*daños?\s*a\s*los\s*hechizos?", "% Daños Hechizos"), # "% daños a los hechizos"
        (r"(?i)%\s*daños?\s*(?:de\s*)?armas?", "% Daños Armas"),
        (r"(?i)%\s*daños?\s*distancia", "% Daños Distancia"),
        (r"(?i)%\s*daños?\s*(?:cuerpo|cac)", "% Daños Cuerpo a Cuerpo"), # "% daños CaC"
        
        (r"(?i)%\s*resis.*\b(?:cuerpo|cac)", "% Resistencia Cuerpo a Cuerpo"),
        (r"(?i)%\s*resis.*\bdistancia", "% Resistencia Distancia"),
        
        # Matches: ": +% de crítico", "% crítico"
        (r"(?i)(?::\s*\+)?%?\s*(?:de\s+)?cr[íi]tico", "Crítico"), 

        # ==========================================
        # 2. DAÑOS ESPECIFICOS (Fijos)
        # ==========================================
        # Matches: "de daño de fuego", "de daño neutro", ": + de daños básicos"
        # Usamos (?:de\s+|:\s*\+\s*de\s+)? para comerse los prefijos
        
        (r"(?i)(?:de\s+|:\s*\+\s*de\s+)?daños?\s*(?:de\s+|tipo\s*)?neutr", "Daños Neutrales"),
        (r"(?i)(?:de\s+|:\s*\+\s*de\s+)?daños?\s*(?:de\s+|tipo\s*)?tierra", "Daños Tierra"),
        (r"(?i)(?:de\s+|:\s*\+\s*de\s+)?daños?\s*(?:de\s+|tipo\s*)?fuego", "Daños Fuego"),
        (r"(?i)(?:de\s+|:\s*\+\s*de\s+)?daños?\s*(?:de\s+|tipo\s*)?agua", "Daños Agua"),
        (r"(?i)(?:de\s+|:\s*\+\s*de\s+)?daños?\s*(?:de\s+|tipo\s*)?aire", "Daños Aire"),
        
        # Especiales
        (r"(?i)(?:de\s+)?daños?\s*cr[íi]ticos?", "Daños Críticos"), # "de daño crítico"
        (r"(?i)(?:de\s+)?daños?\s*(?:de\s*)?trampas?", "Daños Trampas"), # "de daño de trampas"
        
        # Empuje: "de daño de empuje"
        (r"(?i)(?:de\s+)?daños?\s*(?:de\s*)?empuje", "Empuje"), 
        
        # Reenvío: "de daños devueltos"
        (r"(?i)(?:de\s+)?daños?\s*(?:devueltos|reenv)", "Daños Reenvio"),

        # ==========================================
        # 3. RESISTENCIAS FIJAS
        # ==========================================
        # Matches: "de resistencia al fuego", "de resistencia a la tierra"
        
        (r"(?i)(?:de\s+)?resis.*\b(?:a\s*l[aeos]*\s*)?(fuego|feu)", "Resistencia Fuego"),
        (r"(?i)(?:de\s+)?resis.*\b(?:a\s*l[aeos]*\s*)?(aire|air)", "Resistencia Aire"),
        (r"(?i)(?:de\s+)?resis.*\b(?:a\s*l[aeos]*\s*)?(tierra|terre)", "Resistencia Tierra"),
        (r"(?i)(?:de\s+)?resis.*\b(?:a\s*l[aeos]*\s*)?(agua|eau)", "Resistencia Agua"),
        (r"(?i)(?:de\s+)?resis.*\b(?:a\s*l[aeos]*\s*)?(neutr)", "Resistencia Neutral"),
        
        (r"(?i)(?:de\s+)?resis.*\b(?:a\s*l[aeos]*\s*)?(empuje|pouss)", "Resistencia Empuje"),
        (r"(?i)(?:de\s+)?resis.*\b(?:a\s*l[aeos]*\s*)?cr[íi]ticos?", "Resistencia Críticos"),

        # ==========================================
        # 4. ESQUIVAS Y RETIROS (Técnicos)
        # ==========================================
        # Matches: "al retiro de PA", "supresión PA", "supresión PM"
        (r"(?i)(?:al\s+)?(?:retiro|supresi[óo]n)\s*(?:de\s+)?pa", "Retiro PA"),
        (r"(?i)(?:al\s+)?(?:retiro|supresi[óo]n)\s*(?:de\s+)?pm", "Retiro PM"),
        
        # Matches: "esquiva de PA", "a la esquiva pérdidas de PA"
        (r"(?i)(?:a\s*la\s+)?esquiva\s*(?:de\s+|pérdidas\s+de\s+)?pa", "Esquiva PA"),
        (r"(?i)(?:a\s*la\s+)?esquiva\s*(?:de\s+|pérdidas\s+de\s+)?pm", "Esquiva PM"),
        
        # ==========================================
        # 5. CASOS ESPECIALES
        # ==========================================
        # "potencia (daños generales) con trampas" -> Potencia Trampas
        (r"(?i)potencia.*trampas", "Potencia Trampas"),
        (r"(?i)arma\s*(?:de\s*)?caza", "Arma de caza"),
        
        # ==========================================
        # 6. STATS BASE
        # ==========================================
        # Matches: "potencia (daños generales)", "potencia"
        (r"(?i)^potencia", "Potencia"), 
        
        (r"(?i)^fuerza$", "Fuerza"),
        (r"(?i)^inteligencia$", "Inteligencia"),
        (r"(?i)^suerte$", "Suerte"),
        (r"(?i)^agilidad$", "Agilidad"),
        (r"(?i)^vitalidad$", "Vitalidad"),
        (r"(?i)^sabidur[íi]a$", "Sabiduría"),
        (r"(?i)^iniciativa$", "Iniciativa"),
        
        # Matches: "pod" (en la lista viene en singular) o "pods"
        (r"(?i)^pods?$", "Pods"),
        
        (r"(?i)^invocaci", "Invocaciones"),
        
        # Matches: "de cura"
        (r"(?i)(?:de\s+)?curas?$", "Curas"),
        
        (r"(?i)^prospecci[óo]n$", "Prospección"),
        (r"(?i)^placaje$", "Placaje"),
        (r"(?i)^huida$", "Huida"),
        
        # ==========================================
        # 7. ABREVIATURAS
        # ==========================================
        # Matches: "PA", ": - PA"
        (r"(?i)(?::\s*-\s*)?^pa$", "PA"),
        (r"(?i)^pm$", "PM"),
        
        # Matches: ": + de alcance máximo", "alcance"
        (r"(?i)(?::\s*\+\s*de\s+)?(?:alcance|po).*", "Alcance"),
        
        # ==========================================
        # 8. FALLBACK (Lo último)
        # ==========================================
        # Matches: "de daño", ": + de daños", "daños"
        (r"(?i)(?:de\s+|:\s*\+\s*de\s+)?daños?$", "Daños"),
    ],
    
    # IMPORTANTE: Los idiomas EN y FR también deben devolver 
    # las llaves en ESPAÑOL para que coincidan con tu STAT_DENSITIES.
    "en": [
        # ==========================================
        # 1. PORCENTAJES (Prioridad Máxima)
        # ==========================================
        # Matches: "% Fire Resistance", "% Critical", ": +% Critical"
        (r"(?i)%\s*fire\s*res", "% Resistencia Fuego"),
        (r"(?i)%\s*air\s*res", "% Resistencia Aire"),
        (r"(?i)%\s*earth\s*res", "% Resistencia Tierra"),
        (r"(?i)%\s*water\s*res", "% Resistencia Agua"),
        (r"(?i)%\s*neutral\s*res", "% Resistencia Neutral"),
        
        # Damages %
        (r"(?i)%\s*spell\s*dam", "% Daños Hechizos"),
        (r"(?i)%\s*weapon\s*dam", "% Daños Armas"),
        (r"(?i)%\s*ranged?\s*dam", "% Daños Distancia"),
        (r"(?i)%\s*melee\s*dam", "% Daños Cuerpo a Cuerpo"),
        
        # Resis % Special
        (r"(?i)%\s*melee\s*res", "% Resistencia Cuerpo a Cuerpo"),
        (r"(?i)%\s*ranged?\s*res", "% Resistencia Distancia"),
        
        # Critical % (Handle ": +% Critical" and "% Critical")
        (r"(?i)(?::\s*\+\s*)?%\s*crit", "Crítico"),

        # ==========================================
        # 2. DAÑOS ESPECIFICOS (Fijos)
        # ==========================================
        # Matches: "Fire Damage", ": + base damage" (generic fallback later)
        (r"(?i)neutral\s*dam", "Daños Neutrales"),
        (r"(?i)earth\s*dam", "Daños Tierra"),
        (r"(?i)fire\s*dam", "Daños Fuego"),
        (r"(?i)water\s*dam", "Daños Agua"),
        (r"(?i)air\s*dam", "Daños Aire"),
        
        # Special Damages
        (r"(?i)crit.*\bdam", "Daños Críticos"), # Critical Damage
        (r"(?i)trap\s*dam", "Daños Trampas"),   # Trap Damage
        (r"(?i)pushback\s*dam", "Empuje"),      # Pushback Damage
        (r"(?i)reflected\s*dam", "Daños Reenvio"), # reflected damage
        
        # ==========================================
        # 3. RESISTENCIAS FIJAS
        # ==========================================
        # Anchored ^ to avoid matching % variants if prefix is clean
        (r"(?i)^fire\s*res", "Resistencia Fuego"),
        (r"(?i)^air\s*res", "Resistencia Aire"),
        (r"(?i)^earth\s*res", "Resistencia Tierra"),
        (r"(?i)^water\s*res", "Resistencia Agua"),
        (r"(?i)^neutral\s*res", "Resistencia Neutral"),
        
        (r"(?i)pushback\s*res", "Resistencia Empuje"),
        (r"(?i)crit.*\bres", "Resistencia Críticos"),

        # ==========================================
        # 4. AP/MP SPECIALS (Reduction/Parry)
        # ==========================================
        # API uses "Reduction" and "Parry"
        (r"(?i)ap\s*red", "Retiro PA"),      # AP Reduction
        (r"(?i)mp\s*red", "Retiro PM"),      # MP Reduction
        (r"(?i)ap\s*parry", "Esquiva PA"),   # AP Parry
        (r"(?i)mp\s*parry", "Esquiva PM"),   # MP Parry
        
        # ==========================================
        # 5. SPECIAL CASES
        # ==========================================
        # "Power (traps)" must come before generic "Power"
        (r"(?i)power\s*\(traps\)", "Potencia Trampas"), 
        (r"(?i)hunting\s*weapon", "Arma de caza"),

        # ==========================================
        # 6. STATS BASE
        # ==========================================
        (r"(?i)^strength$", "Fuerza"),
        (r"(?i)^intelligence$", "Inteligencia"),
        (r"(?i)^chance$", "Suerte"),
        (r"(?i)^agility$", "Agilidad"),
        (r"(?i)^vitality$", "Vitalidad"),
        (r"(?i)^wisdom$", "Sabiduría"),
        (r"(?i)^initiative$", "Iniciativa"),
        (r"(?i)^pods?$", "Pods"), # Pod or Pods
        (r"(?i)^power$", "Potencia"),
        (r"(?i)^summons?$", "Invocaciones"),
        (r"(?i)^heal$", "Curas"), # API says "Heal" (singular)
        (r"(?i)^prospecting$", "Prospección"),
        (r"(?i)^lock$", "Placaje"),
        (r"(?i)^dodge$", "Huida"),
        
        # ==========================================
        # 7. ABREVIATURAS & PREFIXED STATS
        # ==========================================
        # Matches: "AP", ": - AP"
        (r"(?i)(?::\s*-\s*)?^ap$", "PA"),
        (r"(?i)(?::\s*-\s*)?^mp$", "PM"),
        
        # Matches: "Range", ": + Maximum Range", ": modifiable Range"
        (r"(?i)(?::\s*(?:\+|modifiable)\s*(?:maximum\s*)?)?range", "Alcance"),
        
        # ==========================================
        # 8. FALLBACK
        # ==========================================
        # Matches: "Damage", ": + Damage", ": + base damage"
        (r"(?i)(?::\s*\+\s*(?:base\s+)?)?^damage$", "Daños"),
    ],

    "fr": [
        # ==========================================
        # 1. POURCENTAGES (Priorité)
        # ==========================================
        # Matches: "% Résistance Feu", ": +% Critique"
        (r"(?i)%\s*résis.*\bfeu", "% Resistencia Fuego"),
        (r"(?i)%\s*résis.*\bair", "% Resistencia Aire"),
        (r"(?i)%\s*résis.*\bterre", "% Resistencia Tierra"),
        (r"(?i)%\s*résis.*\beau", "% Resistencia Agua"),
        (r"(?i)%\s*résis.*\bneutre", "% Resistencia Neutral"),
        
        # Dommages %
        (r"(?i)%\s*dom.*\bsorts?", "% Daños Hechizos"),
        (r"(?i)%\s*dom.*\barmes?", "% Daños Armas"),
        (r"(?i)%\s*dom.*\bdistance", "% Daños Distancia"),
        (r"(?i)%\s*dom.*\bmêlée", "% Daños Cuerpo a Cuerpo"),
        
        # Résistance Spéciale %
        (r"(?i)%\s*résis.*\bmêlée", "% Resistencia Cuerpo a Cuerpo"),
        (r"(?i)%\s*résis.*\bdistance", "% Resistencia Distancia"),
        
        # Critique % (Gère ": +% Critique" et "% Critique")
        (r"(?i)(?::\s*\+\s*)?%?\s*critique", "Crítico"),

        # ==========================================
        # 2. DOMMAGES SPÉCIFIQUES (Fixes)
        # ==========================================
        # Matches: "Dommage Feu", ": + dégâts de base"
        (r"(?i)dom.*\bneutre", "Daños Neutrales"),
        (r"(?i)dom.*\bterre", "Daños Tierra"),
        (r"(?i)dom.*\bfeu", "Daños Fuego"),
        (r"(?i)dom.*\beau", "Daños Agua"),
        (r"(?i)dom.*\bair", "Daños Aire"),
        
        # Spéciaux
        (r"(?i)dom.*\bcritiques?", "Daños Críticos"),
        (r"(?i)dom.*\bpièges?", "Daños Trampas"),
        (r"(?i)dom.*\bpoussée", "Empuje"),
        
        # Renvoi: "Dommages Renvoyés"
        (r"(?i)(?:renvoi|dommages\s+renvoyés)", "Daños Reenvio"),

        # ==========================================
        # 3. RÉSISTANCES FIXES
        # ==========================================
        # Ancrage ^ pour éviter les %
        (r"(?i)^résis.*\bfeu", "Resistencia Fuego"),
        (r"(?i)^résis.*\bair", "Resistencia Aire"),
        (r"(?i)^résis.*\bterre", "Resistencia Tierra"),
        (r"(?i)^résis.*\beau", "Resistencia Agua"),
        (r"(?i)^résis.*\bneutre", "Resistencia Neutral"),
        
        (r"(?i)résis.*\bpoussée", "Resistencia Empuje"),
        (r"(?i)résis.*\bcritiques?", "Resistencia Críticos"),

        # ==========================================
        # 4. TECHNIQUE (Retrait/Esquive)
        # ==========================================
        (r"(?i)retrait\s*pa", "Retiro PA"),
        (r"(?i)retrait\s*pm", "Retiro PM"),
        (r"(?i)esquive\s*pa", "Esquiva PA"),
        (r"(?i)esquive\s*pm", "Esquiva PM"),
        
        # ==========================================
        # 5. CAS SPÉCIAUX
        # ==========================================
        # "Puissance Pièges" avant "Puissance"
        (r"(?i)pui.*\bpièges?", "Potencia Trampas"),
        (r"(?i)arme\s*(?:de\s*)?chasse", "Arma de caza"), # "Arme de chasse"

        # ==========================================
        # 6. STATS DE BASE
        # ==========================================
        (r"(?i)^force$", "Fuerza"),
        (r"(?i)^intelligence$", "Inteligencia"),
        (r"(?i)^chance$", "Suerte"),
        (r"(?i)^agilité$", "Agilidad"),
        (r"(?i)^vitalité$", "Vitalidad"),
        (r"(?i)^sagesse$", "Sabiduría"),
        (r"(?i)^initiative$", "Iniciativa"),
        (r"(?i)^pods?$", "Pods"), # "Pod"
        (r"(?i)^puissance", "Potencia"),
        (r"(?i)^invo", "Invocaciones"),
        (r"(?i)^soins?$", "Curas"), # "Soin"
        (r"(?i)^prospection$", "Prospección"),
        (r"(?i)^tacle$", "Placaje"),
        (r"(?i)^fuite$", "Huida"),
        
        # ==========================================
        # 7. ABRÉVIATIONS & PRÉFIXES
        # ==========================================
        # Matches: "PA", ": - PA"
        (r"(?i)(?::\s*-\s*)?^pa$", "PA"),
        (r"(?i)^pm$", "PM"),
        
        # Matches: "Portée", ": + Portée maximale", ": Portée modifiable"
        (r"(?i)(?::\s*(?:\+|modifiable)\s*(?:maximale\s*)?)?portée", "Alcance"),
        
        # ==========================================
        # 8. FALLBACK
        # ==========================================
        # Matches: "Dommage", ": + Dommages", ": + dégâts de base"
        (r"(?i)(?::\s*\+\s*(?:dégâts\s+de\s+base)?)?^dommages?$", "Daños"),
    ]
}