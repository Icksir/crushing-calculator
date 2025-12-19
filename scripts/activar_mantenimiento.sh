#!/bin/bash

# Mensajes de mantenimiento por idioma
MSG_ES="Habrá un reinicio por mantenimiento en 15 minutos. El servicio estará momentáneamente no disponible. Gracias por su comprensión."
MSG_EN="Maintenance restart in 15 minutes. Service will be momentarily unavailable. Thank you for your understanding."
MSG_FR="Redémarrage de maintenance dans 15 minutes. Le service sera momentanément indisponible. Merci de votre compréhension."

cat <<EOF > backend/config/status.json
{
  "active": true,
  "messages": {
    "es": "$MSG_ES",
    "en": "$MSG_EN",
    "fr": "$MSG_FR"
  }
}
EOF

# 4. Feedback visual
echo "✅ Modo mantenimiento activado."
echo "📂 Archivo escrito en: backend/config/status.json"