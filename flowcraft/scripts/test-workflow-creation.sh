#!/bin/bash

# Script para verificar que la creación de workflows funciona correctamente

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Verificando creación de workflows...${NC}"
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

# Login to get a valid token
print_info "Obteniendo token de autenticación..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@flowcraft.com",
    "password": "password123"
  }' 2>/dev/null || echo "{}")

if echo "$LOGIN_RESPONSE" | jq -e '.tokens.accessToken' > /dev/null 2>&1; then
    print_status 0 "Login exitoso"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken')
else
    print_status 1 "Login falló"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test workflow creation
print_info "Probando creación de workflow..."
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
    WORKFLOW_NAME=$(echo "$WORKFLOW_RESPONSE" | jq -r '.name')
    echo "Workflow ID: $WORKFLOW_ID"
    echo "Workflow Name: $WORKFLOW_NAME"
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

# Test workflow list
print_info "Probando listado de workflows..."
LIST_WORKFLOWS_RESPONSE=$(curl -s -X GET "$API_BASE/workflows" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" 2>/dev/null || echo "{}")

if echo "$LIST_WORKFLOWS_RESPONSE" | jq -e '.workflows' > /dev/null 2>&1; then
    print_status 0 "Listado de workflows exitoso"
    WORKFLOW_COUNT=$(echo "$LIST_WORKFLOWS_RESPONSE" | jq -r '.workflows | length')
    echo "Workflows encontrados: $WORKFLOW_COUNT"
else
    print_status 1 "Listado de workflows falló"
    echo "Response: $LIST_WORKFLOWS_RESPONSE"
fi

# Test workflow update
print_info "Probando actualización de workflow..."
UPDATE_WORKFLOW_RESPONSE=$(curl -s -X PUT "$API_BASE/workflows/$WORKFLOW_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Workflow",
    "description": "Updated description"
  }' 2>/dev/null || echo "{}")

if echo "$UPDATE_WORKFLOW_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_status 0 "Actualización de workflow exitosa"
    UPDATED_NAME=$(echo "$UPDATE_WORKFLOW_RESPONSE" | jq -r '.name')
    echo "Nombre actualizado: $UPDATED_NAME"
else
    print_status 1 "Actualización de workflow falló"
    echo "Response: $UPDATE_WORKFLOW_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 ¡Creación de workflows funcionando correctamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "- ✅ API ejecutándose correctamente"
echo "- ✅ Autenticación funcionando"
echo "- ✅ Creación de workflow exitosa"
echo "- ✅ Obtención de workflow funcionando"
echo "- ✅ Listado de workflows funcionando"
echo "- ✅ Actualización de workflow funcionando"
echo ""
echo -e "${YELLOW}🔑 Información:${NC}"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo "Workflow ID: $WORKFLOW_ID"
echo "Workflow Name: $WORKFLOW_NAME"
echo ""
echo -e "${BLUE}🚀 Próximos pasos:${NC}"
echo "1. El frontend debería funcionar correctamente ahora"
echo "2. Prueba crear un workflow desde la interfaz"
echo "3. Verifica que no hay errores de autenticación"
echo ""
echo -e "${YELLOW}💡 Solución aplicada:${NC}"
echo "- Añadido middleware de autenticación a los endpoints de workflows"
echo "- Los endpoints ahora requieren un token válido"
echo "- El error 'Cannot read properties of null (reading userId)' está solucionado" 