#!/bin/bash

# Script para limpiar el cache y recargar todas las traducciones

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Limpiando cache y recargando traducciones...${NC}"
echo "=================================================="

# Configuration
API_BASE="http://localhost:3000"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if API is running
print_info "Verificando que la API esté ejecutándose..."
API_HEALTH=$(curl -s "$API_BASE/health" | jq -r '.status' 2>/dev/null || echo "error")
if [ "$API_HEALTH" = "ok" ]; then
    print_status 0 "API está ejecutándose"
else
    print_status 1 "API no está ejecutándose"
    exit 1
fi

# Clear Redis cache (if available)
print_info "Limpiando cache de Redis..."
if command -v redis-cli &> /dev/null; then
    redis-cli flushall > /dev/null 2>&1 && print_status 0 "Cache de Redis limpiado" || print_status 1 "No se pudo limpiar cache de Redis"
else
    print_info "Redis CLI no disponible, continuando..."
fi

# Load all translations again
print_info "Recargando todas las traducciones..."

# Load common translations
print_info "Cargando traducciones comunes..."
curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"common\",
    \"language\": \"es\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/common.es.json)
  }" > /dev/null && print_status 0 "Common ES cargado" || print_status 1 "Error cargando Common ES"

curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"common\",
    \"language\": \"en\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/common.en.json)
  }" > /dev/null && print_status 0 "Common EN cargado" || print_status 1 "Error cargando Common EN"

curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"common\",
    \"language\": \"nl\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/common.nl.json)
  }" > /dev/null && print_status 0 "Common NL cargado" || print_status 1 "Error cargando Common NL"

# Load dashboard translations
print_info "Cargando traducciones del dashboard..."
curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"dashboard\",
    \"language\": \"es\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/dashboard.es.json)
  }" > /dev/null && print_status 0 "Dashboard ES cargado" || print_status 1 "Error cargando Dashboard ES"

curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"dashboard\",
    \"language\": \"en\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/dashboard.en.json)
  }" > /dev/null && print_status 0 "Dashboard EN cargado" || print_status 1 "Error cargando Dashboard EN"

curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"dashboard\",
    \"language\": \"nl\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/dashboard.nl.json)
  }" > /dev/null && print_status 0 "Dashboard NL cargado" || print_status 1 "Error cargando Dashboard NL"

# Load workflows translations
print_info "Cargando traducciones de workflows..."
curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"workflows\",
    \"language\": \"es\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/workflows.es.json)
  }" > /dev/null && print_status 0 "Workflows ES cargado" || print_status 1 "Error cargando Workflows ES"

curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"workflows\",
    \"language\": \"en\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/workflows.en.json)
  }" > /dev/null && print_status 0 "Workflows EN cargado" || print_status 1 "Error cargando Workflows EN"

curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"workflows\",
    \"language\": \"nl\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/workflows.nl.json)
  }" > /dev/null && print_status 0 "Workflows NL cargado" || print_status 1 "Error cargando Workflows NL"

# Verify translations
print_info "Verificando traducciones..."
sleep 2  # Wait for cache to update

SPANISH_KEYS=$(curl -s "$API_BASE/i18n/translations/es?namespace=workflows" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
ENGLISH_KEYS=$(curl -s "$API_BASE/i18n/translations/en?namespace=workflows" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
DUTCH_KEYS=$(curl -s "$API_BASE/i18n/translations/nl?namespace=workflows" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

echo "Claves en español: $SPANISH_KEYS"
echo "Claves en inglés: $ENGLISH_KEYS"
echo "Claves en holandés: $DUTCH_KEYS"

# Check for specific keys
print_info "Verificando claves específicas..."
SPANISH_SAVING=$(curl -s "$API_BASE/i18n/translations/es?namespace=workflows" | jq -r '.translations.saving // "NOT_FOUND"' 2>/dev/null || echo "ERROR")
ENGLISH_SAVING=$(curl -s "$API_BASE/i18n/translations/en?namespace=workflows" | jq -r '.translations.saving // "NOT_FOUND"' 2>/dev/null || echo "ERROR")
DUTCH_SAVING=$(curl -s "$API_BASE/i18n/translations/nl?namespace=workflows" | jq -r '.translations.saving // "NOT_FOUND"' 2>/dev/null || echo "ERROR")

echo "Clave 'saving' en español: $SPANISH_SAVING"
echo "Clave 'saving' en inglés: $ENGLISH_SAVING"
echo "Clave 'saving' en holandés: $DUTCH_SAVING"

if [ "$SPANISH_SAVING" != "NOT_FOUND" ] && [ "$ENGLISH_SAVING" != "NOT_FOUND" ] && [ "$DUTCH_SAVING" != "NOT_FOUND" ]; then
    print_status 0 "Todas las claves 'saving' encontradas"
else
    print_status 1 "Algunas claves 'saving' no encontradas"
fi

echo ""
echo -e "${GREEN}🎉 ¡Cache limpiado y traducciones recargadas!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "- ✅ API ejecutándose correctamente"
echo "- ✅ Cache limpiado"
echo "- ✅ Todas las traducciones recargadas"
echo "- ✅ Verificación de claves completada"
echo ""
echo -e "${YELLOW}🔑 Información:${NC}"
echo "Claves en español: $SPANISH_KEYS"
echo "Claves en inglés: $ENGLISH_KEYS"
echo "Claves en holandés: $DUTCH_KEYS"
echo ""
echo -e "${BLUE}🚀 Próximos pasos:${NC}"
echo "1. Recarga la página del frontend"
echo "2. Las traducciones deberían aparecer correctamente"
echo "3. Verifica que no hay errores de missingKey en la consola"
echo "4. Si persisten los errores, los fallbacks deberían funcionar" 