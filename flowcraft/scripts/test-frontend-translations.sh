#!/bin/bash

# Script para probar que las traducciones se cargan correctamente en el frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Probando traducciones del frontend...${NC}"
echo "=================================================="

# Configuration
API_BASE="http://localhost:3000"

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

# Test translations for each namespace and language
print_info "Probando traducciones para cada namespace y idioma..."

# Test common translations
print_info "Probando traducciones comunes..."
COMMON_ES=$(curl -s "$API_BASE/i18n/translations/es?namespace=common" | jq -r '.translations["common.welcome"]' 2>/dev/null || echo "")
COMMON_EN=$(curl -s "$API_BASE/i18n/translations/en?namespace=common" | jq -r '.translations["common.welcome"]' 2>/dev/null || echo "")
COMMON_NL=$(curl -s "$API_BASE/i18n/translations/nl?namespace=common" | jq -r '.translations["common.welcome"]' 2>/dev/null || echo "")

if [ "$COMMON_ES" = "Bienvenido" ] && [ "$COMMON_EN" = "Welcome" ] && [ "$COMMON_NL" = "Welkom" ]; then
    print_status 0 "Traducciones comunes funcionando correctamente"
else
    print_status 1 "Error en traducciones comunes"
    echo "ES: $COMMON_ES, EN: $COMMON_EN, NL: $COMMON_NL"
fi

# Test dashboard translations
print_info "Probando traducciones del dashboard..."
DASHBOARD_ES=$(curl -s "$API_BASE/i18n/translations/es?namespace=dashboard" | jq -r '.translations["recent_workflows.create_first"]' 2>/dev/null || echo "")
DASHBOARD_EN=$(curl -s "$API_BASE/i18n/translations/en?namespace=dashboard" | jq -r '.translations["recent_workflows.create_first"]' 2>/dev/null || echo "")
DASHBOARD_NL=$(curl -s "$API_BASE/i18n/translations/nl?namespace=dashboard" | jq -r '.translations["recent_workflows.create_first"]' 2>/dev/null || echo "")

if [ "$DASHBOARD_ES" = "Crear Primer Workflow" ] && [ "$DASHBOARD_EN" = "Create First Workflow" ] && [ "$DASHBOARD_NL" = "Eerste Workflow Maken" ]; then
    print_status 0 "Traducciones del dashboard funcionando correctamente"
else
    print_status 1 "Error en traducciones del dashboard"
    echo "ES: $DASHBOARD_ES, EN: $DASHBOARD_EN, NL: $DASHBOARD_NL"
fi

# Test workflows translations
print_info "Probando traducciones de workflows..."
WORKFLOWS_ES=$(curl -s "$API_BASE/i18n/translations/es?namespace=workflows" | jq -r '.translations["create.title"]' 2>/dev/null || echo "")
WORKFLOWS_EN=$(curl -s "$API_BASE/i18n/translations/en?namespace=workflows" | jq -r '.translations["create.title"]' 2>/dev/null || echo "")
WORKFLOWS_NL=$(curl -s "$API_BASE/i18n/translations/nl?namespace=workflows" | jq -r '.translations["create.title"]' 2>/dev/null || echo "")

if [ "$WORKFLOWS_ES" = "Crear Nuevo Workflow" ] && [ "$WORKFLOWS_EN" = "Create New Workflow" ] && [ "$WORKFLOWS_NL" = "Nieuwe Workflow Maken" ]; then
    print_status 0 "Traducciones de workflows funcionando correctamente"
else
    print_status 1 "Error en traducciones de workflows"
    echo "ES: $WORKFLOWS_ES, EN: $WORKFLOWS_EN, NL: $WORKFLOWS_NL"
fi

# Test specific translation that was mentioned
print_info "Probando traducción específica 'recent_workflows.create_first'..."
SPECIFIC_TRANSLATION=$(curl -s "$API_BASE/i18n/translations/es?namespace=dashboard" | jq -r '.translations["recent_workflows.create_first"]' 2>/dev/null || echo "")

if [ "$SPECIFIC_TRANSLATION" = "Crear Primer Workflow" ]; then
    print_status 0 "Traducción 'recent_workflows.create_first' disponible"
else
    print_status 1 "Error: Traducción 'recent_workflows.create_first' no encontrada"
    echo "Valor encontrado: $SPECIFIC_TRANSLATION"
fi

echo ""
echo -e "${GREEN}🎉 ¡Todas las traducciones están funcionando correctamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "- ✅ Traducciones comunes (ES, EN, NL)"
echo "- ✅ Traducciones del dashboard (ES, EN, NL)"
echo "- ✅ Traducciones de workflows (ES, EN, NL)"
echo "- ✅ Traducción específica 'recent_workflows.create_first'"
echo ""
echo -e "${YELLOW}🚀 Las traducciones están listas para usar en el frontend!${NC}"
echo ""
echo -e "${BLUE}Próximos pasos:${NC}"
echo "1. Reinicia el frontend para cargar las nuevas traducciones"
echo "2. Verifica que el modal de creación de workflows funciona correctamente"
echo "3. Prueba cambiar el idioma en el selector" 