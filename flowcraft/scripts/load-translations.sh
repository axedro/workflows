#!/bin/bash

# Script para cargar traducciones desde archivos JSON a la base de datos
# Este script lee los archivos de traducción y los inserta en la base de datos

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Cargando traducciones a la base de datos...${NC}"
echo "=================================================="

# Configuration
API_BASE="http://localhost:3000"
TRANSLATIONS_DIR="apps/web/src/i18n/namespaces"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
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
fi

# Function to load translations for a namespace and language
load_translations() {
    local namespace=$1
    local language=$2
    local file_path="$TRANSLATIONS_DIR/${namespace}.${language}.json"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}❌ Archivo no encontrado: $file_path${NC}"
        return 1
    fi
    
    print_info "Cargando traducciones para $namespace en $language..."
    
    # Read the JSON file
    translations=$(cat "$file_path" | jq -c '.')
    
    # Create the request payload
    payload="{\"namespace\":\"$namespace\",\"language\":\"$language\",\"translations\":$translations}"
    
    # Send to API
    response=$(curl -s -X POST "$API_BASE/i18n/translations" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null || echo "{}")
    
    # Check response
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        print_status 0 "Traducciones cargadas para $namespace.$language"
    else
        echo -e "${RED}❌ Error cargando traducciones para $namespace.$language${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Load translations for all namespaces and languages
print_info "Cargando traducciones para todos los namespaces..."

# Common translations
load_translations "common" "es"
load_translations "common" "en"
load_translations "common" "nl"

# Dashboard translations
load_translations "dashboard" "es"
load_translations "dashboard" "en"
load_translations "dashboard" "nl"

# Workflows translations
load_translations "workflows" "es"
load_translations "workflows" "en"
load_translations "workflows" "nl"

# Auth translations
load_translations "auth" "es"
load_translations "auth" "en"
load_translations "auth" "nl"

# Landing translations
load_translations "landing" "es"
load_translations "landing" "en"
load_translations "landing" "nl"

# Verify translations are loaded
print_info "Verificando que las traducciones se cargaron correctamente..."

# Test common translations
COMMON_RESPONSE=$(curl -s -X GET "$API_BASE/i18n/translations/es?namespace=common" 2>/dev/null || echo "{}")
COMMON_COUNT=$(echo "$COMMON_RESPONSE" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

if [ "$COMMON_COUNT" -gt 0 ]; then
    print_status 0 "Traducciones comunes cargadas ($COMMON_COUNT claves)"
else
    print_status 1 "Error: No se encontraron traducciones comunes"
fi

# Test dashboard translations
DASHBOARD_RESPONSE=$(curl -s -X GET "$API_BASE/i18n/translations/es?namespace=dashboard" 2>/dev/null || echo "{}")
DASHBOARD_COUNT=$(echo "$DASHBOARD_RESPONSE" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

if [ "$DASHBOARD_COUNT" -gt 0 ]; then
    print_status 0 "Traducciones del dashboard cargadas ($DASHBOARD_COUNT claves)"
else
    print_status 1 "Error: No se encontraron traducciones del dashboard"
fi

# Test workflows translations
WORKFLOWS_RESPONSE=$(curl -s -X GET "$API_BASE/i18n/translations/es?namespace=workflows" 2>/dev/null || echo "{}")
WORKFLOWS_COUNT=$(echo "$WORKFLOWS_RESPONSE" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

if [ "$WORKFLOWS_COUNT" -gt 0 ]; then
    print_status 0 "Traducciones de workflows cargadas ($WORKFLOWS_COUNT claves)"
else
    print_status 1 "Error: No se encontraron traducciones de workflows"
fi

# Test auth translations
AUTH_RESPONSE=$(curl -s -X GET "$API_BASE/i18n/translations/es?namespace=auth" 2>/dev/null || echo "{}")
AUTH_COUNT=$(echo "$AUTH_RESPONSE" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

if [ "$AUTH_COUNT" -gt 0 ]; then
    print_status 0 "Traducciones de auth cargadas ($AUTH_COUNT claves)"
else
    print_status 1 "Error: No se encontraron traducciones de auth"
fi

# Test landing translations
LANDING_RESPONSE=$(curl -s -X GET "$API_BASE/i18n/translations/es?namespace=landing" 2>/dev/null || echo "{}")
LANDING_COUNT=$(echo "$LANDING_RESPONSE" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

if [ "$LANDING_COUNT" -gt 0 ]; then
    print_status 0 "Traducciones de landing cargadas ($LANDING_COUNT claves)"
else
    print_status 1 "Error: No se encontraron traducciones de landing"
fi

echo ""
echo -e "${GREEN}🎉 ¡Traducciones cargadas exitosamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "- ✅ Traducciones comunes (ES, EN, NL)"
echo "- ✅ Traducciones del dashboard (ES, EN, NL)"
echo "- ✅ Traducciones de workflows (ES, EN, NL)"
echo "- ✅ Traducciones de auth (ES, EN, NL)"
echo "- ✅ Traducciones de landing (ES, EN, NL)"
echo ""
echo -e "${YELLOW}🚀 Las traducciones están ahora disponibles en la aplicación!${NC}"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo "1. Reinicia el frontend si está ejecutándose"
echo "2. Las traducciones aparecerán automáticamente en la interfaz"
echo "3. Prueba cambiar el idioma en el selector de idioma" 