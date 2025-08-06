#!/bin/bash

# Script temporal para solucionar el problema de la clave 'saving'

echo "🔧 Solucionando problema con la clave 'saving'..."

# Limpiar cache de Redis
echo "Limpiando cache..."
redis-cli flushall 2>/dev/null || echo "Redis no disponible"

# Cargar la clave saving manualmente para todos los idiomas
echo "Cargando clave 'saving' manualmente..."

curl -s -X POST "http://localhost:3000/i18n/translations" \
  -H "Content-Type: application/json" \
  -d '{"namespace":"workflows","language":"es","translations":{"saving":"Guardando..."}}' > /dev/null

curl -s -X POST "http://localhost:3000/i18n/translations" \
  -H "Content-Type: application/json" \
  -d '{"namespace":"workflows","language":"en","translations":{"saving":"Saving..."}}' > /dev/null

curl -s -X POST "http://localhost:3000/i18n/translations" \
  -H "Content-Type: application/json" \
  -d '{"namespace":"workflows","language":"nl","translations":{"saving":"Opslaan..."}}' > /dev/null

# Verificar que se cargó correctamente
echo "Verificando carga..."
ES_SAVING=$(curl -s "http://localhost:3000/i18n/translations/es?namespace=workflows" | jq -r '.translations.saving // "NOT_FOUND"')
EN_SAVING=$(curl -s "http://localhost:3000/i18n/translations/en?namespace=workflows" | jq -r '.translations.saving // "NOT_FOUND"')

if [ "$ES_SAVING" != "NOT_FOUND" ] && [ "$EN_SAVING" != "NOT_FOUND" ]; then
    echo "✅ Clave 'saving' cargada correctamente"
    echo "ES: $ES_SAVING"
    echo "EN: $EN_SAVING"
else
    echo "❌ Problema persistente con la clave 'saving'"
    echo "ES: $ES_SAVING"
    echo "EN: $EN_SAVING"
fi

echo "�� Script completado" 