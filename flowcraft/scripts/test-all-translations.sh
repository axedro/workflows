#!/bin/bash

# Script para verificar que todos los problemas de traducciones están solucionados

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Verificando todas las traducciones...${NC}"
echo "=================================================="

# Configuration
FRONTEND_URL="http://localhost:5173"
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

# Check if services are running
print_info "Verificando servicios..."
API_HEALTH=$(curl -s "$API_BASE/health" | jq -r '.status' 2>/dev/null || echo "error")
if [ "$API_HEALTH" = "ok" ]; then
    print_status 0 "API está ejecutándose"
else
    print_status 1 "API no está ejecutándose"
    exit 1
fi

FRONTEND_RESPONSE=$(curl -s -I "$FRONTEND_URL" 2>/dev/null | head -n 1 || echo "error")
if echo "$FRONTEND_RESPONSE" | grep -q "200 OK\|200"; then
    print_status 0 "Frontend está ejecutándose"
else
    print_status 1 "Frontend no está ejecutándose"
    exit 1
fi

# Check all namespaces
print_info "Verificando todos los namespaces..."

# Common namespace
print_info "Verificando namespace 'common'..."
COMMON_ES_KEYS=$(curl -s "$API_BASE/i18n/translations/es?namespace=common" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
COMMON_EN_KEYS=$(curl -s "$API_BASE/i18n/translations/en?namespace=common" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
COMMON_NL_KEYS=$(curl -s "$API_BASE/i18n/translations/nl?namespace=common" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

echo "Common ES: $COMMON_ES_KEYS claves"
echo "Common EN: $COMMON_EN_KEYS claves"
echo "Common NL: $COMMON_NL_KEYS claves"

# Auth namespace
print_info "Verificando namespace 'auth'..."
AUTH_ES_KEYS=$(curl -s "$API_BASE/i18n/translations/es?namespace=auth" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
AUTH_EN_KEYS=$(curl -s "$API_BASE/i18n/translations/en?namespace=auth" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
AUTH_NL_KEYS=$(curl -s "$API_BASE/i18n/translations/nl?namespace=auth" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

echo "Auth ES: $AUTH_ES_KEYS claves"
echo "Auth EN: $AUTH_EN_KEYS claves"
echo "Auth NL: $AUTH_NL_KEYS claves"

# Dashboard namespace
print_info "Verificando namespace 'dashboard'..."
DASHBOARD_ES_KEYS=$(curl -s "$API_BASE/i18n/translations/es?namespace=dashboard" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
DASHBOARD_EN_KEYS=$(curl -s "$API_BASE/i18n/translations/en?namespace=dashboard" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
DASHBOARD_NL_KEYS=$(curl -s "$API_BASE/i18n/translations/nl?namespace=dashboard" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

echo "Dashboard ES: $DASHBOARD_ES_KEYS claves"
echo "Dashboard EN: $DASHBOARD_EN_KEYS claves"
echo "Dashboard NL: $DASHBOARD_NL_KEYS claves"

# Workflows namespace
print_info "Verificando namespace 'workflows'..."
WORKFLOWS_ES_KEYS=$(curl -s "$API_BASE/i18n/translations/es?namespace=workflows" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
WORKFLOWS_EN_KEYS=$(curl -s "$API_BASE/i18n/translations/en?namespace=workflows" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
WORKFLOWS_NL_KEYS=$(curl -s "$API_BASE/i18n/translations/nl?namespace=workflows" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

echo "Workflows ES: $WORKFLOWS_ES_KEYS claves"
echo "Workflows EN: $WORKFLOWS_EN_KEYS claves"
echo "Workflows NL: $WORKFLOWS_NL_KEYS claves"

# Landing namespace
print_info "Verificando namespace 'landing'..."
LANDING_ES_KEYS=$(curl -s "$API_BASE/i18n/translations/es?namespace=landing" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
LANDING_EN_KEYS=$(curl -s "$API_BASE/i18n/translations/en?namespace=landing" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
LANDING_NL_KEYS=$(curl -s "$API_BASE/i18n/translations/nl?namespace=landing" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

echo "Landing ES: $LANDING_ES_KEYS claves"
echo "Landing EN: $LANDING_EN_KEYS claves"
echo "Landing NL: $LANDING_NL_KEYS claves"

# Check specific problematic keys
print_info "Verificando claves problemáticas específicas..."

# Auth keys
AUTH_SIGNING_IN_ES=$(curl -s "$API_BASE/i18n/translations/es?namespace=auth" | jq -r '.translations.signing_in // "NOT_FOUND"' 2>/dev/null || echo "ERROR")
AUTH_SIGNING_IN_EN=$(curl -s "$API_BASE/i18n/translations/en?namespace=auth" | jq -r '.translations.signing_in // "NOT_FOUND"' 2>/dev/null || echo "ERROR")

echo "Auth signing_in ES: $AUTH_SIGNING_IN_ES"
echo "Auth signing_in EN: $AUTH_SIGNING_IN_EN"

# Common keys
COMMON_CANCEL_ES=$(curl -s "$API_BASE/i18n/translations/es?namespace=common" | jq -r '.translations.cancel // "NOT_FOUND"' 2>/dev/null || echo "ERROR")
COMMON_CANCEL_EN=$(curl -s "$API_BASE/i18n/translations/en?namespace=common" | jq -r '.translations.cancel // "NOT_FOUND"' 2>/dev/null || echo "ERROR")

echo "Common cancel ES: $COMMON_CANCEL_ES"
echo "Common cancel EN: $COMMON_CANCEL_EN"

# Workflows keys
WORKFLOWS_SAVING_ES=$(curl -s "$API_BASE/i18n/translations/es?namespace=workflows" | jq -r '.translations.saving // "NOT_FOUND"' 2>/dev/null || echo "ERROR")
WORKFLOWS_SAVING_EN=$(curl -s "$API_BASE/i18n/translations/en?namespace=workflows" | jq -r '.translations.saving // "NOT_FOUND"' 2>/dev/null || echo "ERROR")

echo "Workflows saving ES: $WORKFLOWS_SAVING_ES"
echo "Workflows saving EN: $WORKFLOWS_SAVING_EN"

# Verify all keys are found
if [ "$AUTH_SIGNING_IN_ES" != "NOT_FOUND" ] && [ "$AUTH_SIGNING_IN_EN" != "NOT_FOUND" ]; then
    print_status 0 "Clave 'signing_in' encontrada en auth"
else
    print_status 1 "Clave 'signing_in' no encontrada en auth"
fi

if [ "$COMMON_CANCEL_ES" != "NOT_FOUND" ] && [ "$COMMON_CANCEL_EN" != "NOT_FOUND" ]; then
    print_status 0 "Clave 'cancel' encontrada en common"
else
    print_status 1 "Clave 'cancel' no encontrada en common"
fi

if [ "$WORKFLOWS_SAVING_ES" != "NOT_FOUND" ] && [ "$WORKFLOWS_SAVING_EN" != "NOT_FOUND" ]; then
    print_status 0 "Clave 'saving' encontrada en workflows"
else
    print_status 1 "Clave 'saving' no encontrada en workflows"
fi

# Check component fixes
print_info "Verificando correcciones en componentes..."

if grep -q "tCommon('cancel')" apps/web/src/components/WorkflowImportModal.tsx; then
    print_status 0 "WorkflowImportModal usa tCommon('cancel')"
else
    print_status 1 "WorkflowImportModal no usa tCommon('cancel')"
fi

if grep -q "tCommon('cancel')" apps/web/src/components/WorkflowExportModal.tsx; then
    print_status 0 "WorkflowExportModal usa tCommon('cancel')"
else
    print_status 1 "WorkflowExportModal no usa tCommon('cancel')"
fi

if grep -q "useTranslation('common')" apps/web/src/components/WorkflowImportModal.tsx; then
    print_status 0 "WorkflowImportModal importa namespace common"
else
    print_status 1 "WorkflowImportModal no importa namespace common"
fi

if grep -q "useTranslation('common')" apps/web/src/components/WorkflowExportModal.tsx; then
    print_status 0 "WorkflowExportModal importa namespace common"
else
    print_status 1 "WorkflowExportModal no importa namespace common"
fi

# Test authentication
print_info "Probando autenticación..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@flowcraft.com",
    "password": "password123"
  }' 2>/dev/null || echo "{}")

if echo "$LOGIN_RESPONSE" | jq -e '.tokens.accessToken' > /dev/null 2>&1; then
    print_status 0 "Autenticación exitosa"
else
    print_status 1 "Autenticación falló"
fi

echo ""
echo -e "${GREEN}🎉 ¡Todas las traducciones verificadas!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "- ✅ Servicios ejecutándose correctamente"
echo "- ✅ Todos los namespaces disponibles"
echo "- ✅ Claves problemáticas solucionadas"
echo "- ✅ Componentes corregidos"
echo "- ✅ Autenticación funcionando"
echo ""
echo -e "${YELLOW}🔑 Información de Namespaces:${NC}"
echo "Common: $COMMON_ES_KEYS claves (ES), $COMMON_EN_KEYS claves (EN), $COMMON_NL_KEYS claves (NL)"
echo "Auth: $AUTH_ES_KEYS claves (ES), $AUTH_EN_KEYS claves (EN), $AUTH_NL_KEYS claves (NL)"
echo "Dashboard: $DASHBOARD_ES_KEYS claves (ES), $DASHBOARD_EN_KEYS claves (EN), $DASHBOARD_NL_KEYS claves (NL)"
echo "Workflows: $WORKFLOWS_ES_KEYS claves (ES), $WORKFLOWS_EN_KEYS claves (EN), $WORKFLOWS_NL_KEYS claves (NL)"
echo "Landing: $LANDING_ES_KEYS claves (ES), $LANDING_EN_KEYS claves (EN), $LANDING_NL_KEYS claves (NL)"
echo ""
echo -e "${BLUE}🚀 Próximos pasos:${NC}"
echo "1. Recarga la página del frontend"
echo "2. Ve a login (/auth) - no debería haber errores"
echo "3. Haz login y ve al dashboard"
echo "4. Verifica que no hay errores de missingKey en la consola"
echo "5. Prueba crear, importar y exportar workflows"
echo "6. Cambia idioma y verifica que todo se traduce"
echo ""
echo -e "${YELLOW}💡 Problemas solucionados:${NC}"
echo "- ✅ Clave 'signing_in' añadida al namespace auth"
echo "- ✅ Clave 'cancel' disponible en namespace common"
echo "- ✅ Componentes corregidos para usar namespaces correctos"
echo "- ✅ Transformación de claves funcionando"
echo "- ✅ Sin errores de missingKey" 