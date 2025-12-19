#!/bin/bash

# Este script sincroniza las imágenes de las runas llamando al endpoint de la API.
# Asegúrate de que el backend esté corriendo antes de ejecutarlo.

# Se puede pasar un argumento para especificar el servidor. Si no, usa "Dakal" por defecto.
SERVER=${1:-Dakal}
# Se puede pasar un segundo argumento para el puerto. Si no, usa 8080 por defecto.
PORT=${2:-8000}

API_URL="http://localhost:${PORT}/api/prices/runes/sync-images?server=${SERVER}"

echo "🚀 Sincronizando imágenes de runas para el servidor: ${SERVER}..."
echo "📞 Llamando a: ${API_URL}"

# Llamada a la API con curl
RESPONSE=$(curl -s -X POST "${API_URL}")

# Verificar si curl tuvo éxito
if [ $? -eq 0 ]; then
  echo "✅ Sincronización completada."
  echo "Respuesta del servidor:"
  echo "${RESPONSE}"
else
  echo "❌ Error: No se pudo conectar a la API. ¿Está el servidor backend corriendo en el puerto ${PORT}?"
fi
