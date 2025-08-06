#!/bin/bash

# Script para recargar específicamente las traducciones de workflows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Recargando traducciones de workflows...${NC}"
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

# Load Spanish translations
print_info "Cargando traducciones en español..."
SPANISH_RESPONSE=$(curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"workflows\",
    \"language\": \"es\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/workflows.es.json)
  }" 2>/dev/null || echo "{}")

if echo "$SPANISH_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    print_status 0 "Traducciones en español cargadas"
else
    print_status 1 "Error cargando traducciones en español"
    echo "Response: $SPANISH_RESPONSE"
fi

# Load English translations
print_info "Cargando traducciones en inglés..."
ENGLISH_RESPONSE=$(curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"workflows\",
    \"language\": \"en\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/workflows.en.json)
  }" 2>/dev/null || echo "{}")

if echo "$ENGLISH_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    print_status 0 "Traducciones en inglés cargadas"
else
    print_status 1 "Error cargando traducciones en inglés"
    echo "Response: $ENGLISH_RESPONSE"
fi

# Load Dutch translations
print_info "Cargando traducciones en holandés..."
DUTCH_RESPONSE=$(curl -s -X POST "$API_BASE/i18n/translations" \
  -H "Content-Type: application/json" \
  -d "{
    \"namespace\": \"workflows\",
    \"language\": \"nl\",
    \"translations\": $(cat apps/web/src/i18n/namespaces/workflows.nl.json)
  }" 2>/dev/null || echo "{}")

if echo "$DUTCH_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    print_status 0 "Traducciones en holandés cargadas"
else
    print_status 1 "Error cargando traducciones en holandés"
    echo "Response: $DUTCH_RESPONSE"
fi

# Verify translations
print_info "Verificando traducciones..."
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
echo -e "${GREEN}🎉 ¡Traducciones de workflows recargadas!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "- ✅ API ejecutándose correctamente"
echo "- ✅ Traducciones en español cargadas"
echo "- ✅ Traducciones en inglés cargadas"
echo "- ✅ Traducciones en holandés cargadas"
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