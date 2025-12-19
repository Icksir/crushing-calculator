#!/bin/bash

# Construir el objeto JSON para el estado inactivo
JSON_CONTENT=$(cat <<EOF
{
  "active": false,
  "messages": {
    "es": "",
    "en": "",
    "fr": ""
  }
}
EOF
)

# Escribir el archivo de estado
echo "$JSON_CONTENT" > ./backend/config/status.json
echo "✅ Modo mantenimiento desactivado."
