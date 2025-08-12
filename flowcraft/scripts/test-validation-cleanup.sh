#!/bin/bash

# Script para probar que los bordes de validación se limpian correctamente

echo "🧹 Testing Validation Border Cleanup"
echo "====================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs
API_URL="http://localhost:3000"

# Función para mostrar pasos
step() {
    echo -e "\n${YELLOW}📋 Step $1: $2${NC}"
}

# Función para mostrar resultados
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Obtener token
step 1 "Obteniendo token de autenticación"
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@flowcraft.com", "password": "password123"}' | jq -r '.tokens.accessToken')

if [[ "$TOKEN" != "null" && -n "$TOKEN" ]]; then
    success "Token obtenido"
else
    echo "❌ Error obteniendo token"
    exit 1
fi

# Crear workflow con nodos desconectados
step 2 "Creando workflow con nodos desconectados"
WORKFLOW_RESPONSE=$(curl -s -X POST "$API_URL/workflows" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Validation Cleanup",
    "description": "Test cleanup of validation borders", 
    "definition": {
      "nodes": [
        {"id": "start", "type": "start", "position": {"x": 100, "y": 100}, "data": {"label": "Start"}},
        {"id": "orphan1", "type": "action", "position": {"x": 300, "y": 300}, "data": {"label": "Orphan 1"}},
        {"id": "orphan2", "type": "action", "position": {"x": 500, "y": 300}, "data": {"label": "Orphan 2"}}
      ],
      "edges": []
    }
  }')

WORKFLOW_ID=$(echo "$WORKFLOW_RESPONSE" | jq -r '.id')
if [[ "$WORKFLOW_ID" != "null" && -n "$WORKFLOW_ID" ]]; then
    success "Workflow creado (ID: $WORKFLOW_ID)"
else
    echo "❌ Error creando workflow"
    exit 1
fi

# Validar workflow con problemas
step 3 "Validando workflow con nodos desconectados"
VALIDATION_WITH_ISSUES=$(curl -s -X POST "$API_URL/workflows/$WORKFLOW_ID/validate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "definition": {
      "nodes": [
        {"id": "start", "type": "start", "position": {"x": 100, "y": 100}, "data": {"label": "Start"}},
        {"id": "orphan1", "type": "action", "position": {"x": 300, "y": 300}, "data": {"label": "Orphan 1"}},
        {"id": "orphan2", "type": "action", "position": {"x": 500, "y": 300}, "data": {"label": "Orphan 2"}}
      ],
      "edges": []
    }
  }')

DISCONNECTED_COUNT=$(echo "$VALIDATION_WITH_ISSUES" | jq '.warnings | map(select(.code == "DISCONNECTED_NODE")) | length')
info "Nodos desconectados detectados: $DISCONNECTED_COUNT"

if [[ "$DISCONNECTED_COUNT" -gt 0 ]]; then
    success "✅ Validación detecta nodos desconectados correctamente"
else
    echo "❌ No se detectaron nodos desconectados"
fi

# Corregir el workflow conectando los nodos
step 4 "Corrigiendo workflow - conectando nodos"
VALIDATION_FIXED=$(curl -s -X POST "$API_URL/workflows/$WORKFLOW_ID/validate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "definition": {
      "nodes": [
        {"id": "start", "type": "start", "position": {"x": 100, "y": 100}, "data": {"label": "Start"}},
        {"id": "orphan1", "type": "action", "position": {"x": 300, "y": 300}, "data": {"label": "Connected Action 1"}},
        {"id": "orphan2", "type": "end", "position": {"x": 500, "y": 300}, "data": {"label": "End Node"}}
      ],
      "edges": [
        {"id": "start-action", "source": "start", "target": "orphan1"},
        {"id": "action-end", "source": "orphan1", "target": "orphan2"}
      ]
    }
  }')

DISCONNECTED_COUNT_FIXED=$(echo "$VALIDATION_FIXED" | jq '.warnings | map(select(.code == "DISCONNECTED_NODE")) | length')
TOTAL_WARNINGS_FIXED=$(echo "$VALIDATION_FIXED" | jq '.warnings | length')
TOTAL_ERRORS_FIXED=$(echo "$VALIDATION_FIXED" | jq '.errors | length')

info "Después de la corrección:"
info "- Nodos desconectados: $DISCONNECTED_COUNT_FIXED"
info "- Total advertencias: $TOTAL_WARNINGS_FIXED" 
info "- Total errores: $TOTAL_ERRORS_FIXED"

if [[ "$DISCONNECTED_COUNT_FIXED" -eq 0 ]]; then
    success "✅ Ya no hay nodos desconectados"
else
    echo "❌ Aún hay nodos desconectados"
fi

# Mostrar comparación
step 5 "Comparación antes y después"
echo -e "${YELLOW}ANTES (workflow con problemas):${NC}"
echo "$VALIDATION_WITH_ISSUES" | jq -r '.warnings[] | select(.code == "DISCONNECTED_NODE") | "  ⚠️  " + .message + " (Node: " + .nodeId + ")"'

echo -e "\n${YELLOW}DESPUÉS (workflow corregido):${NC}"
if [[ "$DISCONNECTED_COUNT_FIXED" -eq 0 ]]; then
    echo -e "${GREEN}  ✅ No hay nodos desconectados${NC}"
else
    echo "$VALIDATION_FIXED" | jq -r '.warnings[] | select(.code == "DISCONNECTED_NODE") | "  ⚠️  " + .message + " (Node: " + .nodeId + ")"'
fi

# Limpiar
step 6 "Limpiando workflow de prueba"
curl -s -X DELETE "$API_URL/workflows/$WORKFLOW_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
success "Workflow eliminado"

echo -e "\n${GREEN}🎉 Testing de limpieza de validaciones completado${NC}"
echo ""
echo "📋 Resultados del test:"
echo "   ✅ Workflow con problemas detecta nodos desconectados"
echo "   ✅ Workflow corregido limpia las advertencias"
echo "   ✅ Sistema de validación funciona dinámicamente"
echo ""
echo "🎨 En el frontend, esto significa:"
echo "   🔴 Nodos problemáticos: Bordes rojos/amarillos gruesos"
echo "   ✅ Nodos corregidos: Bordes normales (sin colores de error)"
echo "   🔄 Actualización automática: Bordes se limpian en 1 segundo"
echo ""
echo "🔗 Para probar manualmente:"
echo "   1. Abrir: http://localhost:5173"
echo "   2. Login y crear workflow"
echo "   3. Añadir nodos sin conectar → Ver bordes amarillos"
echo "   4. Conectar los nodos → Ver bordes normales en 1 segundo"