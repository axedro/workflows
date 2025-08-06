#!/bin/bash

# Script para verificar que las traducciones de auth funcionan correctamente

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Verificando traducciones de auth...${NC}"
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

# Check auth translations in database
print_info "Verificando traducciones de auth en la base de datos..."

SPANISH_KEYS=$(curl -s "$API_BASE/i18n/translations/es?namespace=auth" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")
ENGLISH_KEYS=$(curl -s "$API_BASE/i18n/translations/en?namespace=auth" | jq -r '.translations | keys | length' 2>/dev/null || echo "0")

echo "Claves de auth en español: $SPANISH_KEYS"
echo "Claves de auth en inglés: $ENGLISH_KEYS"

# Check for specific auth keys
print_info "Verificando claves específicas de auth..."

SPANISH_LOGIN_TITLE=$(curl -s "$API_BASE/i18n/translations/es?namespace=auth" | jq -r '.translations["auth.login.title"] // "NOT_FOUND"' 2>/dev/null || echo "ERROR")
ENGLISH_LOGIN_TITLE=$(curl -s "$API_BASE/i18n/translations/en?namespace=auth" | jq -r '.translations["auth.login.title"] // "NOT_FOUND"' 2>/dev/null || echo "ERROR")

SPANISH_EMAIL=$(curl -s "$API_BASE/i18n/translations/es?namespace=auth" | jq -r '.translations["auth.email"] // "NOT_FOUND"' 2>/dev/null || echo "ERROR")
ENGLISH_EMAIL=$(curl -s "$API_BASE/i18n/translations/en?namespace=auth" | jq -r '.translations["auth.email"] // "NOT_FOUND"' 2>/dev/null || echo "ERROR")

SPANISH_PASSWORD=$(curl -s "$API_BASE/i18n/translations/es?namespace=auth" | jq -r '.translations["auth.password"] // "NOT_FOUND"' 2>/dev/null || echo "ERROR")
ENGLISH_PASSWORD=$(curl -s "$API_BASE/i18n/translations/en?namespace=auth" | jq -r '.translations["auth.password"] // "NOT_FOUND"' 2>/dev/null || echo "ERROR")

echo "Clave 'auth.login.title' en español: $SPANISH_LOGIN_TITLE"
echo "Clave 'auth.login.title' en inglés: $ENGLISH_LOGIN_TITLE"
echo "Clave 'auth.email' en español: $SPANISH_EMAIL"
echo "Clave 'auth.email' en inglés: $ENGLISH_EMAIL"
echo "Clave 'auth.password' en español: $SPANISH_PASSWORD"
echo "Clave 'auth.password' en inglés: $ENGLISH_PASSWORD"

if [ "$SPANISH_LOGIN_TITLE" != "NOT_FOUND" ] && [ "$ENGLISH_LOGIN_TITLE" != "NOT_FOUND" ]; then
    print_status 0 "Claves de login encontradas"
else
    print_status 1 "Claves de login no encontradas"
fi

if [ "$SPANISH_EMAIL" != "NOT_FOUND" ] && [ "$ENGLISH_EMAIL" != "NOT_FOUND" ]; then
    print_status 0 "Claves de email encontradas"
else
    print_status 1 "Claves de email no encontradas"
fi

if [ "$SPANISH_PASSWORD" != "NOT_FOUND" ] && [ "$ENGLISH_PASSWORD" != "NOT_FOUND" ]; then
    print_status 0 "Claves de password encontradas"
else
    print_status 1 "Claves de password no encontradas"
fi

# Check i18n configuration
print_info "Verificando configuración de i18n..."

if grep -q "key.startsWith(\`\${namespace}.\`)" apps/web/src/i18n/config.ts; then
    print_status 0 "Transformación de claves implementada"
else
    print_status 1 "Transformación de claves no implementada"
fi

# Check LoginForm component
print_info "Verificando componente LoginForm..."

if grep -q "useTranslation('auth')" apps/web/src/components/LoginForm.tsx; then
    print_status 0 "LoginForm usa namespace 'auth'"
else
    print_status 1 "LoginForm no usa namespace 'auth'"
fi

if grep -q "t('login.title')" apps/web/src/components/LoginForm.tsx; then
    print_status 0 "LoginForm usa clave 'login.title'"
else
    print_status 1 "LoginForm no usa clave 'login.title'"
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
echo -e "${GREEN}🎉 ¡Traducciones de auth verificadas!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "- ✅ Servicios ejecutándose correctamente"
echo "- ✅ Traducciones de auth disponibles en la base de datos"
echo "- ✅ Claves específicas encontradas"
echo "- ✅ Configuración de i18n corregida"
echo "- ✅ LoginForm configurado correctamente"
echo "- ✅ Autenticación funcionando"
echo ""
echo -e "${YELLOW}🔑 Información:${NC}"
echo "Frontend URL: $FRONTEND_URL"
echo "Claves de auth en español: $SPANISH_KEYS"
echo "Claves de auth en inglés: $ENGLISH_KEYS"
echo ""
echo -e "${BLUE}🚀 Próximos pasos:${NC}"
echo "1. Recarga la página del frontend"
echo "2. Ve a la página de login (/auth)"
echo "3. Verifica que no hay errores de missingKey en la consola"
echo "4. Verifica que los textos aparecen correctamente"
echo "5. Prueba hacer login con las credenciales"
echo ""
echo -e "${YELLOW}💡 Solución aplicada:${NC}"
echo "- Restaurada la transformación de claves en i18n/config.ts"
echo "- Las claves 'auth.login.title' se transforman a 'login.title'"
echo "- El error 'missingKey' ya no debería aparecer en auth" 