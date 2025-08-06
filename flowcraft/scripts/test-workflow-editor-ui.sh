#!/bin/bash

# Script para verificar que la nueva UI del editor de workflows funciona correctamente

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎨 Verificando nueva UI del editor de workflows...${NC}"
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

# Test authentication and create workflow
print_info "Creando workflow de prueba..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@flowcraft.com",
    "password": "password123"
  }' 2>/dev/null || echo "{}")

if echo "$LOGIN_RESPONSE" | jq -e '.tokens.accessToken' > /dev/null 2>&1; then
    print_status 0 "Autenticación exitosa"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken')
else
    print_status 1 "Autenticación falló"
    exit 1
fi

WORKFLOW_RESPONSE=$(curl -s -X POST "$API_BASE/workflows" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow UI",
    "description": "Workflow para probar la nueva UI del editor",
    "definition": {
      "nodes": [
        {"id": "start", "type": "start", "position": {"x": 100, "y": 100}, "data": {"label": "Start"}},
        {"id": "end", "type": "end", "position": {"x": 300, "y": 100}, "data": {"label": "End"}}
      ],
      "edges": []
    }
  }' 2>/dev/null || echo "{}")

if echo "$WORKFLOW_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_status 0 "Workflow creado exitosamente"
    WORKFLOW_ID=$(echo "$WORKFLOW_RESPONSE" | jq -r '.id')
    WORKFLOW_NAME=$(echo "$WORKFLOW_RESPONSE" | jq -r '.name')
    echo "Workflow ID: $WORKFLOW_ID"
    echo "Workflow Name: $WORKFLOW_NAME"
else
    print_status 1 "Creación de workflow falló"
    exit 1
fi

# Check for new UI components in code
print_info "Verificando componentes de UI..."

# Check for Header import
if grep -q "import.*Header.*from.*Header" apps/web/src/components/WorkflowEditor.tsx; then
    print_status 0 "Header importado correctamente"
else
    print_status 1 "Header no está importado"
fi

# Check for useTranslation import
if grep -q "import.*useTranslation.*from.*hooks/i18n" apps/web/src/components/WorkflowEditor.tsx; then
    print_status 0 "useTranslation importado correctamente"
else
    print_status 1 "useTranslation no está importado"
fi

# Check for editable fields
if grep -q "workflowName.*setWorkflowName" apps/web/src/components/WorkflowEditor.tsx; then
    print_status 0 "Campo editable de nombre implementado"
else
    print_status 1 "Campo editable de nombre no implementado"
fi

if grep -q "workflowDescription.*setWorkflowDescription" apps/web/src/components/WorkflowEditor.tsx; then
    print_status 0 "Campo editable de descripción implementado"
else
    print_status 1 "Campo editable de descripción no implementado"
fi

# Check for back button
if grep -q "handleBackToDashboard" apps/web/src/components/WorkflowEditor.tsx; then
    print_status 0 "Botón de volver implementado"
else
    print_status 1 "Botón de volver no implementado"
fi

# Check for new translations
print_info "Verificando traducciones..."

if grep -q "back_to_dashboard" apps/web/src/i18n/namespaces/workflows.es.json; then
    print_status 0 "Traducción 'back_to_dashboard' en español"
else
    print_status 1 "Traducción 'back_to_dashboard' faltante en español"
fi

if grep -q "untitled_workflow" apps/web/src/i18n/namespaces/workflows.en.json; then
    print_status 0 "Traducción 'untitled_workflow' en inglés"
else
    print_status 1 "Traducción 'untitled_workflow' faltante en inglés"
fi

if grep -q "saving" apps/web/src/i18n/namespaces/workflows.nl.json; then
    print_status 0 "Traducción 'saving' en holandés"
else
    print_status 1 "Traducción 'saving' faltante en holandés"
fi

# Test workflow update functionality
print_info "Probando actualización de workflow..."
UPDATE_RESPONSE=$(curl -s -X PUT "$API_BASE/workflows/$WORKFLOW_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Workflow UI",
    "description": "Workflow actualizado para probar la nueva UI"
  }' 2>/dev/null || echo "{}")

if echo "$UPDATE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    print_status 0 "Actualización de workflow exitosa"
    UPDATED_NAME=$(echo "$UPDATE_RESPONSE" | jq -r '.name')
    echo "Nombre actualizado: $UPDATED_NAME"
else
    print_status 1 "Actualización de workflow falló"
fi

echo ""
echo -e "${GREEN}🎉 ¡Nueva UI del editor verificada correctamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen:${NC}"
echo "- ✅ Servicios ejecutándose correctamente"
echo "- ✅ Autenticación funcionando"
echo "- ✅ Workflow creado y actualizado exitosamente"
echo "- ✅ Header importado correctamente"
echo "- ✅ Campos editables implementados"
echo "- ✅ Botón de volver implementado"
echo "- ✅ Traducciones añadidas en 3 idiomas"
echo "- ✅ Funcionalidad de actualización verificada"
echo ""
echo -e "${YELLOW}🔑 Información:${NC}"
echo "Frontend URL: $FRONTEND_URL"
echo "Workflow ID: $WORKFLOW_ID"
echo "Workflow Name: $UPDATED_NAME"
echo ""
echo -e "${BLUE}🚀 Próximos pasos:${NC}"
echo "1. Abre el navegador en $FRONTEND_URL"
echo "2. Haz login con: user@flowcraft.com / password123"
echo "3. Ve al dashboard y crea un nuevo workflow"
echo "4. Verifica que aparece el header con el logo"
echo "5. Verifica que puedes editar nombre y descripción"
echo "6. Verifica que el botón 'Volver al Dashboard' funciona"
echo "7. Verifica que el estado de guardado se muestra correctamente"
echo ""
echo -e "${YELLOW}💡 Nuevas funcionalidades:${NC}"
echo "- Header consistente con el dashboard"
echo "- Campos editables para nombre y descripción"
echo "- Botón para volver al dashboard"
echo "- Indicador de estado de guardado"
echo "- Traducciones completas en 3 idiomas" 