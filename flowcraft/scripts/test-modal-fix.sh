#!/bin/bash

# Script para verificar que el modal de creación de workflows funciona correctamente

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

print_info "Verificando cambios realizados..."

# Check if Modal.tsx has been updated with portal
if grep -q "createPortal" "packages/ui/src/components/Modal.tsx"; then
    print_status 0 "Modal actualizado con createPortal"
else
    print_status 1 "Modal no tiene createPortal"
fi

# Check if z-index has been increased
if grep -q "z-\[9999\]" "packages/ui/src/components/Modal.tsx"; then
    print_status 0 "Z-index aumentado a 9999"
else
    print_status 1 "Z-index no ha sido aumentado"
fi

# Check if WorkflowCreationModal uses native input
if grep -q "<input" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "WorkflowCreationModal usa input nativo"
else
    print_status 1 "WorkflowCreationModal no usa input nativo"
fi

# Check if i18n config has been updated
if grep -q "namespace={{ns}}" "apps/web/src/i18n/config.ts"; then
    print_status 0 "Configuración de i18n actualizada"
else
    print_status 1 "Configuración de i18n no actualizada"
fi

# Check if workflows namespace is included
if grep -q "'workflows'" "apps/web/src/i18n/config.ts"; then
    print_status 0 "Namespace 'workflows' incluido"
else
    print_status 1 "Namespace 'workflows' no incluido"
fi

echo ""
echo -e "${GREEN}🎉 ¡Todos los arreglos han sido aplicados!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen de arreglos:${NC}"
echo "- ✅ Modal renderizado con createPortal (fuera del flujo DOM normal)"
echo "- ✅ Z-index aumentado a 9999 para asegurar que aparezca encima"
echo "- ✅ Input nativo en lugar del componente Input del UI package"
echo "- ✅ Configuración de i18n corregida para cargar traducciones"
echo "- ✅ Namespace 'workflows' incluido en la configuración"
echo ""
echo -e "${YELLOW}🚀 Próximos pasos:${NC}"
echo "1. Reinicia el frontend para aplicar los cambios"
echo "2. El modal debería aparecer correctamente como overlay"
echo "3. El campo de nombre debería ser funcional"
echo "4. Las traducciones deberían cargarse correctamente"
echo ""
echo -e "${BLUE}🔍 Para verificar:${NC}"
echo "- El modal debe aparecer como overlay oscuro sobre toda la página"
echo "- Debe estar centrado vertical y horizontalmente"
echo "- El campo de nombre debe tener auto-focus"
echo "- Debe poder escribir en el campo de nombre"
echo "- Las traducciones deben aparecer correctamente" 