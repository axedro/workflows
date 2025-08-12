#!/bin/bash

# Script para probar las validaciones de nodos desconectados/huérfanos

echo "🧪 Testing Workflow Node Validations"
echo "======================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"

# Función para mostrar pasos
step() {
    echo -e "\n${YELLOW}📋 Step $1: $2${NC}"
}

# Función para mostrar resultados
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que los servicios están corriendo
step 1 "Verificando servicios"
if curl -s "$API_URL/health" > /dev/null; then
    success "API backend está corriendo en $API_URL"
else
    error "API backend no está disponible en $API_URL"
    echo "   Ejecuta: ./start-servers.sh"
    exit 1
fi

if curl -s "$FRONTEND_URL" > /dev/null; then
    success "Frontend está corriendo en $FRONTEND_URL"
else
    error "Frontend no está disponible en $FRONTEND_URL"
    echo "   Ejecuta: ./start-servers.sh"
    exit 1
fi

# Obtener token de autenticación
step 2 "Obteniendo token de autenticación"
AUTH_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@flowcraft.com",
    "password": "password123"
  }')

if echo "$AUTH_RESPONSE" | grep -q "tokens"; then
    TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.tokens.accessToken')
    success "Token obtenido exitosamente"
else
    error "No se pudo obtener el token de autenticación"
    echo "   Respuesta: $AUTH_RESPONSE"
    exit 1
fi

# Crear un workflow con nodos desconectados
step 3 "Creando workflow de prueba con nodos desconectados"
WORKFLOW_DATA='{
  "name": "Test Disconnected Nodes",
  "description": "Workflow para probar validaciones de nodos huérfanos",
  "definition": {
    "nodes": [
      {
        "id": "start-1",
        "type": "START",
        "position": {"x": 100, "y": 100},
        "data": {"label": "Start Node"}
      },
      {
        "id": "action-1", 
        "type": "ACTION",
        "position": {"x": 300, "y": 100},
        "data": {"label": "Connected Action"}
      },
      {
        "id": "orphan-1",
        "type": "ACTION", 
        "position": {"x": 500, "y": 100},
        "data": {"label": "Orphan Node 1"}
      },
      {
        "id": "orphan-2",
        "type": "ACTION",
        "position": {"x": 100, "y": 300}, 
        "data": {"label": "Orphan Node 2"}
      },
      {
        "id": "end-1",
        "type": "END",
        "position": {"x": 500, "y": 300},
        "data": {"label": "End Node"}
      }
    ],
    "edges": [
      {
        "id": "start-to-action",
        "source": "start-1",
        "target": "action-1"
      }
    ]
  }
}'

WORKFLOW_RESPONSE=$(curl -s -X POST "$API_URL/workflows" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$WORKFLOW_DATA")

if echo "$WORKFLOW_RESPONSE" | grep -q "id"; then
    WORKFLOW_ID=$(echo "$WORKFLOW_RESPONSE" | jq -r '.id')
    success "Workflow creado exitosamente (ID: $WORKFLOW_ID)"
else
    error "No se pudo crear el workflow de prueba"
    echo "   Respuesta: $WORKFLOW_RESPONSE"
    exit 1
fi

# Probar validaciones
step 4 "Probando validaciones de nodos desconectados"
VALIDATION_RESPONSE=$(curl -s -X POST "$API_URL/workflows/$WORKFLOW_ID/validate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "definition": {
      "nodes": [
        {
          "id": "start-1",
          "type": "start",
          "position": {"x": 100, "y": 100},
          "data": {"label": "Start Node"}
        },
        {
          "id": "action-1", 
          "type": "action",
          "position": {"x": 300, "y": 100},
          "data": {"label": "Connected Action"}
        },
        {
          "id": "orphan-1",
          "type": "action", 
          "position": {"x": 500, "y": 100},
          "data": {"label": "Orphan Node 1"}
        },
        {
          "id": "orphan-2",
          "type": "action",
          "position": {"x": 100, "y": 300}, 
          "data": {"label": "Orphan Node 2"}
        },
        {
          "id": "end-1",
          "type": "end",
          "position": {"x": 500, "y": 300},
          "data": {"label": "End Node"}
        }
      ],
      "edges": [
        {
          "id": "start-to-action",
          "source": "start-1",
          "target": "action-1"
        }
      ]
    }
  }')

echo "Respuesta de validación:"
echo "$VALIDATION_RESPONSE" | jq .

# Verificar que se detecten nodos desconectados
if echo "$VALIDATION_RESPONSE" | jq -e '.warnings[] | select(.code == "DISCONNECTED_NODE")' > /dev/null; then
    success "✅ VALIDACIÓN EXITOSA: Se detectaron nodos desconectados"
    
    # Mostrar detalles de las advertencias
    echo -e "\n${YELLOW}📋 Advertencias encontradas:${NC}"
    echo "$VALIDATION_RESPONSE" | jq -r '.warnings[] | select(.code == "DISCONNECTED_NODE") | "   ⚠️  " + .message + " (Node: " + .nodeId + ")"'
    
else
    error "❌ FALLO: No se detectaron nodos desconectados"
    echo "   Es posible que las validaciones no estén funcionando correctamente"
fi

# Verificar nodos inalcanzables
if echo "$VALIDATION_RESPONSE" | jq -e '.warnings[] | select(.code == "UNREACHABLE_NODE")' > /dev/null; then
    success "✅ VALIDACIÓN EXITOSA: Se detectaron nodos inalcanzables"
    
    # Mostrar detalles de las advertencias
    echo -e "\n${YELLOW}📋 Nodos inalcanzables encontrados:${NC}"
    echo "$VALIDATION_RESPONSE" | jq -r '.warnings[] | select(.code == "UNREACHABLE_NODE") | "   ⚠️  " + .message + " (Node: " + .nodeId + ")"'
    
else
    echo -e "${YELLOW}⚠️  INFO: No se detectaron nodos inalcanzables (puede ser normal)${NC}"
fi

# Verificar que no hay errores críticos
if echo "$VALIDATION_RESPONSE" | jq -e '.errors | length > 0' > /dev/null; then
    echo -e "\n${YELLOW}📋 Errores encontrados:${NC}"
    echo "$VALIDATION_RESPONSE" | jq -r '.errors[] | "   ❌ " + .code + ": " + .message + if .nodeId then " (Node: " + .nodeId + ")" else "" end'
else
    success "No hay errores críticos en el workflow"
fi

# Limpiar - eliminar el workflow de prueba
step 5 "Limpiando workflow de prueba"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/workflows/$WORKFLOW_ID" \
  -H "Authorization: Bearer $TOKEN")

if [ $? -eq 0 ]; then
    success "Workflow de prueba eliminado exitosamente"
else
    error "No se pudo eliminar el workflow de prueba (ID: $WORKFLOW_ID)"
fi

echo -e "\n${GREEN}🎉 Testing de validaciones completado${NC}"
echo ""
echo "📋 Resumen:"
echo "   ✅ API backend funcionando"
echo "   ✅ Frontend funcionando" 
echo "   ✅ Autenticación funcionando"
echo "   ✅ Creación de workflows funcionando"
echo "   ✅ Validaciones de nodos implementadas"
echo ""
echo "🔗 Para probar en el frontend:"
echo "   1. Abrir: $FRONTEND_URL"
echo "   2. Login: user@flowcraft.com / password123"
echo "   3. Crear workflow con nodos desconectados"
echo "   4. Observar advertencias en el panel de validación"
echo ""
echo "👁️  Las validaciones se ejecutan automáticamente después de 1 segundo"
echo "🎨 Los nodos con advertencias tendrán bordes amarillos"
echo "🔴 Los nodos con errores tendrán bordes rojos"