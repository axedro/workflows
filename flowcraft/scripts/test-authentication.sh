#!/bin/bash

# Script para verificar y solucionar problemas de autenticación

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Verificando autenticación...${NC}"
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

# Test authentication endpoints
print_info "Probando endpoints de autenticación..."

# Test registration
print_info "Probando registro de usuario..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@flowcraft.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "organizationName": "Test Organization"
  }' 2>/dev/null || echo "{}")

if echo "$REGISTER_RESPONSE" | jq -e '.tokens.accessToken' > /dev/null 2>&1; then
    print_status 0 "Registro exitoso"
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.tokens.accessToken')
else
    # Try login if registration failed (user might already exist)
    print_info "Registro falló, probando login..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@flowcraft.com",
        "password": "TestPassword123!"
      }' 2>/dev/null || echo "{}")
    
    if echo "$LOGIN_RESPONSE" | jq -e '.tokens.accessToken' > /dev/null 2>&1; then
        print_status 0 "Login exitoso"
        ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken')
    else
        print_status 1 "Login falló"
        echo "Response: $LOGIN_RESPONSE"
        exit 1
    fi
fi

# Test current user endpoint
print_info "Probando endpoint de usuario actual..."
USER_RESPONSE=$(curl -s -X GET "$API_BASE/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null || echo "{}")

if echo "$USER_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_status 0 "Endpoint de usuario actual funciona"
    USER_ID=$(echo "$USER_RESPONSE" | jq -r '.id')
    echo "User ID: $USER_ID"
else
    print_status 1 "Endpoint de usuario actual falló"
    echo "Response: $USER_RESPONSE"
    exit 1
fi

# Test workflow creation with authentication
print_info "Probando creación de workflow con autenticación..."
WORKFLOW_RESPONSE=$(curl -s -X POST "$API_BASE/workflows" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "Test description",
    "definition": {
      "nodes": [
        {
          "id": "start",
          "type": "start",
          "position": {"x": 100, "y": 100},
          "data": {"label": "Start"}
        },
        {
          "id": "end",
          "type": "end",
          "position": {"x": 300, "y": 100},
          "data": {"label": "End"}
        }
      ],
      "edges": []
    }
  }' 2>/dev/null || echo "{}")

if echo "$WORKFLOW_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_status 0 "Creación de workflow exitosa"
    WORKFLOW_ID=$(echo "$WORKFLOW_RESPONSE" | jq -r '.id')
    echo "Workflow ID: $WORKFLOW_ID"
else
    print_status 1 "Creación de workflow falló"
    echo "Response: $WORKFLOW_RESPONSE"
    exit 1
fi

# Test workflow retrieval
print_info "Probando obtención de workflow..."
GET_WORKFLOW_RESPONSE=$(curl -s -X GET "$API_BASE/workflows/$WORKFLOW_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null || echo "{}")

if echo "$GET_WORKFLOW_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_status 0 "Obtención de workflow exitosa"
else
    print_status 1 "Obtención de workflow falló"
    echo "Response: $GET_WORKFLOW_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 ¡Autenticación funcionando correctamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "- ✅ API ejecutándose correctamente"
echo "- ✅ Registro/Login funcionando"
echo "- ✅ Token de acceso válido"
echo "- ✅ Endpoint de usuario actual funcionando"
echo "- ✅ Creación de workflow con autenticación exitosa"
echo "- ✅ Obtención de workflow funcionando"
echo ""
echo -e "${YELLOW}🔑 Información de autenticación:${NC}"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo "User ID: $USER_ID"
echo "Workflow ID: $WORKFLOW_ID"
echo ""
echo -e "${BLUE}🚀 Próximos pasos:${NC}"
echo "1. El frontend debería funcionar correctamente ahora"
echo "2. Prueba crear un workflow desde la interfaz"
echo "3. Si sigue fallando, verifica que el frontend esté usando el token correcto"
echo ""
echo -e "${YELLOW}💡 Solución manual si es necesario:${NC}"
echo "1. Abre las herramientas de desarrollador del navegador"
echo "2. Ve a la pestaña Application/Storage"
echo "3. Busca 'accessToken' en localStorage"
echo "4. Si no existe o está vacío, haz login nuevamente" 