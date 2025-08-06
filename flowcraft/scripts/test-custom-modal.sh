#!/bin/bash

# Script para verificar que el modal personalizado funciona correctamente

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Verificando modal personalizado...${NC}"
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

# Check if WorkflowCreationModal uses inline styles
if grep -q "position: 'fixed'" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Modal usa estilos inline para posicionamiento"
else
    print_status 1 "Modal no usa estilos inline"
fi

# Check if z-index is set to 9999
if grep -q "zIndex: 9999" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Z-index configurado a 9999"
else
    print_status 1 "Z-index no configurado correctamente"
fi

# Check if modal has backdrop
if grep -q "backgroundColor: 'rgba(0, 0, 0, 0.5)'" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Modal tiene backdrop oscuro"
else
    print_status 1 "Modal no tiene backdrop"
fi

# Check if modal is centered
if grep -q "alignItems: 'center'" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Modal está centrado verticalmente"
else
    print_status 1 "Modal no está centrado"
fi

# Check if body scroll is prevented
if grep -q "document.body.style.overflow" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Scroll del body se previene cuando el modal está abierto"
else
    print_status 1 "No se previene el scroll del body"
fi

# Check if input has autoFocus
if grep -q "autoFocus" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Input tiene auto-focus"
else
    print_status 1 "Input no tiene auto-focus"
fi

# Check if click outside closes modal
if grep -q "onClick={onClose}" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Click fuera del modal lo cierra"
else
    print_status 1 "Click fuera del modal no lo cierra"
fi

# Check if click inside doesn't close modal
if grep -q "stopPropagation" "apps/web/src/components/WorkflowCreationModal.tsx"; then
    print_status 0 "Click dentro del modal no lo cierra"
else
    print_status 1 "Click dentro del modal lo cierra"
fi

echo ""
echo -e "${GREEN}🎉 ¡Modal personalizado configurado correctamente!${NC}"
echo ""
echo -e "${BLUE}📋 Resumen de características:${NC}"
echo "- ✅ Posicionamiento fijo con estilos inline"
echo "- ✅ Z-index alto (9999) para aparecer encima de todo"
echo "- ✅ Backdrop oscuro para overlay"
echo "- ✅ Centrado vertical y horizontal"
echo "- ✅ Prevención de scroll del body"
echo "- ✅ Auto-focus en el campo de nombre"
echo "- ✅ Click fuera cierra el modal"
echo "- ✅ Click dentro no cierra el modal"
echo "- ✅ Estilos inline para evitar conflictos CSS"
echo ""
echo -e "${YELLOW}🚀 Próximos pasos:${NC}"
echo "1. Reinicia el frontend para aplicar los cambios"
echo "2. El modal debería aparecer como overlay oscuro"
echo "3. Debería estar centrado en la pantalla"
echo "4. El campo de nombre debería tener auto-focus"
echo "5. Click fuera debería cerrar el modal"
echo ""
echo -e "${BLUE}🔍 Para verificar:${NC}"
echo "- Modal aparece como overlay oscuro sobre toda la página"
echo "- Modal está perfectamente centrado"
echo "- Campo de nombre tiene focus automático"
echo "- Puedes escribir en el campo de nombre"
echo "- Click fuera del modal lo cierra"
echo "- Click dentro del modal no lo cierra"
echo "- Scroll del body está bloqueado cuando el modal está abierto" 