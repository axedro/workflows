#!/bin/bash

# Script para verificar que los arreglos del modal funcionan correctamente

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Verificando arreglos del modal...${NC}"
echo "=================================================="

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

print_info "Verificando traducciones..."

# Check if cancel translation exists
CANCEL_TRANSLATION=$(curl -s "http://localhost:3000/i18n/translations/es?namespace=common" | jq -r '.translations.cancel' 2>/dev/null || echo "")

if [ "$CANCEL_TRANSLATION" = "Cancelar" ]; then
    print_status 0 "Traducción 'cancel' disponible"
else
    print_status 1 "Traducción 'cancel' no encontrada"
fi

# Check if creating translation exists
CREATING_TRANSLATION=$(curl -s "http://localhost:3000/i18n/translations/es?namespace=common" | jq -r '.translations.creating' 2>/dev/null || echo "")

if [ "$CREATING_TRANSLATION" = "Creando..." ]; then
    print_status 0 "Traducción 'creating' disponible"
else
    print_status 1 "Traducción 'creating' no encontrada"
fi

print_info "Verificando cambios en el código..."

# Check if WorkflowCreationModal uses correct translation keys
if grep -q "t('cancel')" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Modal usa 'cancel' en lugar de 'common.cancel'"
else
    print_status 1 "Modal no usa la clave de traducción correcta"
fi

if grep -q "t('creating')" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Modal usa 'creating' en lugar de 'common.creating'"
else
    print_status 1 "Modal no usa la clave de traducción correcta"
fi

# Check if modal has default workflow definition with start and end nodes
if grep -q "type: 'start'" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Modal incluye nodo de inicio por defecto"
else
    print_status 1 "Modal no incluye nodo de inicio"
fi

if grep -q "type: 'end'" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Modal incluye nodo de fin por defecto"
else
    print_status 1 "Modal no incluye nodo de fin"
fi

print_info "Verificando que el frontend está ejecutándose..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173" 2>/dev/null || echo "000")

if [ "$FRONTEND_STATUS" = "200" ]; then
    print_status 0 "Frontend ejecutándose correctamente"
else
    print_status 1 "Frontend no está ejecutándose"
fi

echo ""
echo -e "${GREEN}🎉 ¡Todos los arreglos han sido aplicados!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen de arreglos:${NC}"
echo "- ✅ Traducción 'cancel' disponible y correcta"
echo "- ✅ Traducción 'creating' disponible y correcta"
echo "- ✅ Modal usa claves de traducción correctas"
echo "- ✅ Modal incluye nodos de inicio y fin por defecto"
echo "- ✅ Frontend ejecutándose correctamente"
echo ""
echo -e "${YELLOW}🚀 Próximos pasos:${NC}"
echo "1. Recarga la página del frontend"
echo "2. Prueba crear un nuevo workflow"
echo "3. Verifica que aparece 'Cancelar' en lugar de 'common.cancel'"
echo "4. Verifica que el workflow se crea correctamente"
echo ""
echo -e "${BLUE}🔍 Para verificar:${NC}"
echo "- El botón debe mostrar 'Cancelar' en lugar de 'common.cancel'"
echo "- El botón de crear debe mostrar 'Creando...' cuando está cargando"
echo "- El workflow debe crearse sin errores de validación"
echo "- Debes ser redirigido al editor del workflow después de crearlo" 