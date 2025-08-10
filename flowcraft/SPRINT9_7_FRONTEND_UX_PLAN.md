# Sprint 9.7: Frontend Workflow Management & UX Improvements

## Objetivo
Mejorar la experiencia de usuario (UX) del frontend con funcionalidades de gestión de workflows, validaciones mejoradas, paginación y ajustes de layout que optimicen la usabilidad y productividad.

## Duración
**1 semana (5 días laborables)**

## Contexto
Análisis del código actual reveló que:
- **WorkflowList** ya tiene paginación implementada (líneas 238-261)
- **WorkflowCreationModal** ya tiene validación básica de nombres (líneas 34-49)
- **WorkflowEditor** tiene estructura base pero necesita ajustes de layout
- **Header** existe pero no está sticky
- Botones de acción (delete, activate, edit) ya existen pero necesitan mejoras

---

## Fase 9.7.1: Validación de Nombres de Workflow

### ✅ Tarea 9.7.1.1: Implementar validación de nombres duplicados
**Objetivo**: Prevenir la creación de workflows con nombres ya existentes en la organización.

**Estado Actual**: 
- Validación básica de nombres implementada en `WorkflowCreationModal.tsx` (líneas 34-49)
- Falta validación de duplicados contra nombres existentes

**Subtareas**:
- [x] Analizar validación actual en `WorkflowCreationModal.tsx`
- [ ] Crear función `checkWorkflowNameExists()` en workflowStore
- [ ] Implementar endpoint backend `/workflows/check-name` si no existe
- [ ] Añadir validación en tiempo real en el modal de creación
- [ ] Mostrar sugerencias de nombres alternativos
- [ ] Añadir validación similar en modal de duplicación

**Criterios de Aceptación**:
- [ ] No se pueden crear workflows con nombres duplicados
- [ ] Validación en tiempo real mientras el usuario escribe
- [ ] Mensaje de error claro cuando hay duplicados
- [ ] Sugerencias de nombres alternativos (ej. "Workflow Name (2)")
- [ ] Validación también aplica al duplicar workflows

**Archivos a Modificar**:
- `apps/web/src/components/WorkflowCreationModal.tsx` - Añadir validación de duplicados
- `apps/web/src/stores/workflowStore.ts` - Función checkWorkflowNameExists()
- `apps/web/src/services/api.ts` - Endpoint para verificar nombres
- `apps/api/src/routes/workflows.ts` - Endpoint backend si es necesario

---

## Fase 9.7.2: Mejoras en Lista de Workflows

### ✅ Tarea 9.7.2.1: Optimizar componente WorkflowList existente
**Objetivo**: Mejorar la lista de workflows existente con mejor UX para acciones.

**Estado Actual**: 
- **Paginación YA IMPLEMENTADA** (líneas 238-261 en WorkflowList.tsx)
- **Botones delete, edit YA IMPLEMENTADOS** (líneas 189-225)
- Falta botón de activación/desactivación

**Subtareas**:
- [x] Confirmar que paginación ya está implementada ✅
- [x] Confirmar que delete/edit buttons ya existen ✅  
- [ ] Añadir toggle button para activar/desactivar workflows
- [ ] Mejorar disposición visual de botones (más compacta)
- [ ] Añadir tooltips informativos en botones
- [ ] Implementar acciones en lote (opcional)
- [ ] Añadir indicadores de estado más claros

**Criterios de Aceptación**:
- [ ] Botón toggle para activar/desactivar workflows
- [ ] Tooltips informativos en todos los botones de acción
- [ ] Disposición más compacta y profesional
- [ ] Estados visuales claros (active, paused, draft, archived)
- [ ] Confirmaciones apropiadas para acciones destructivas

**Archivos a Modificar**:
- `apps/web/src/components/WorkflowList.tsx` - Añadir botón toggle y mejoras
- `apps/web/src/stores/workflowStore.ts` - Función toggleWorkflowStatus()
- `apps/web/src/services/api.ts` - Endpoint para cambiar status

### Tarea 9.7.2.2: Añadir filtros y ordenación avanzada
**Objetivo**: Mejorar la capacidad de encontrar workflows específicos.

**Subtareas**:
- [ ] Añadir filtro por fecha de creación/modificación
- [ ] Implementar ordenación por nombre, fecha, status
- [ ] Añadir filtro por autor
- [ ] Implementar búsqueda por tags/categorías
- [ ] Guardar preferencias de filtros en localStorage

**Criterios de Aceptación**:
- [ ] Filtros adicionales funcionando correctamente
- [ ] Ordenación múltiple implementada
- [ ] Preferencias de usuario persistentes
- [ ] Performance optimizada para listas grandes

---

## Fase 9.7.3: Ajustes de Layout del Editor

### Tarea 9.7.3.1: Optimizar layout del WorkflowEditor
**Objetivo**: Ajustar el canvas al tamaño de la pantalla y mejorar la disposición general.

**Estado Actual**: 
- Canvas implementado pero con problemas de altura tras añadir título
- Header no es sticky

**Subtareas**:
- [ ] Analizar problema de altura del canvas tras añadir título
- [ ] Implementar cálculo dinámico de altura del canvas
- [ ] Usar `calc()` CSS para ajustar altura automáticamente
- [ ] Optimizar para diferentes tamaños de pantalla
- [ ] Mejorar responsive design del editor
- [ ] Añadir breakpoints apropiados

**Criterios de Aceptación**:
- [ ] Canvas ocupa toda la altura disponible de la pantalla
- [ ] Layout se ajusta correctamente al añadir título
- [ ] Responsive en móvil, tablet y desktop
- [ ] Sin scrollbars innecesarios
- [ ] Layout fluido al redimensionar ventana

**Archivos a Modificar**:
- `apps/web/src/components/WorkflowEditor.tsx` - Ajustar layout principal
- `apps/web/src/styles/globals.css` - Añadir clases CSS necesarias

### Tarea 9.7.3.2: Reposicionar botón Export
**Objetivo**: Mover botón de export a una posición más accesible en la parte superior.

**Subtareas**:
- [ ] Analizar ubicación actual del botón export
- [ ] Crear barra de herramientas superior en el editor
- [ ] Mover botón export a la barra superior
- [ ] Añadir otros botones relevantes (save, undo, redo)
- [ ] Implementar layout sticky para la barra de herramientas

**Criterios de Aceptación**:
- [ ] Botón export fácilmente accesible en la parte superior
- [ ] Barra de herramientas sticky y siempre visible
- [ ] Consistente con patrones de UX modernos
- [ ] Agrupa acciones relacionadas lógicamente

**Archivos a Modificar**:
- `apps/web/src/components/WorkflowEditor.tsx` - Añadir toolbar superior
- `apps/web/src/components/WorkflowExportModal.tsx` - Integrar con nueva posición

---

## Fase 9.7.4: Header Sticky Global

### Tarea 9.7.4.1: Implementar Header sticky
**Objetivo**: Mantener el header general pegado a la parte superior de la pantalla.

**Estado Actual**: 
- Header implementado en `Header.tsx` pero no sticky
- Se usa en múltiples páginas

**Subtareas**:
- [ ] Añadir `position: sticky` al Header component
- [ ] Ajustar z-index apropiado para que esté siempre visible
- [ ] Modificar layout general para acomodar header sticky
- [ ] Ajustar padding/margin en páginas principales
- [ ] Probar compatibilidad en diferentes navegadores
- [ ] Implementar animación suave al hacer scroll

**Criterios de Aceptación**:
- [ ] Header permanece visible al hacer scroll
- [ ] No interfiere con otros elementos sticky
- [ ] Z-index correcto para estar siempre arriba
- [ ] Transición suave y profesional
- [ ] Funciona en todas las páginas principales

**Archivos a Modificar**:
- `apps/web/src/components/Header.tsx` - Añadir sticky positioning
- `apps/web/src/styles/globals.css` - Estilos para sticky header
- `apps/web/src/components/WorkflowEditor.tsx` - Ajustar para header sticky
- `apps/web/src/components/Dashboard.tsx` - Ajustar para header sticky

---

## Fase 9.7.5: Mejoras de UX Adicionales

### Tarea 9.7.5.1: Mejorar feedback visual
**Objetivo**: Proporcionar mejor feedback visual para todas las acciones.

**Subtareas**:
- [ ] Añadir loading spinners más elegantes
- [ ] Implementar toast notifications para acciones
- [ ] Mejorar estados hover/focus en botones
- [ ] Añadir animaciones suaves para transiciones
- [ ] Implementar skeleton loaders para carga

**Criterios de Aceptación**:
- [ ] Feedback visual inmediato para todas las acciones
- [ ] Notificaciones toast no invasivas
- [ ] Animaciones fluidas y profesionales
- [ ] Estados visuales consistentes

### Tarea 9.7.5.2: Implementar atajos de teclado
**Objetivo**: Añadir atajos de teclado para acciones comunes.

**Subtareas**:
- [ ] Definir atajos para acciones principales
- [ ] Implementar sistema de hotkeys
- [ ] Añadir tooltip con atajos en botones
- [ ] Crear help modal con lista de atajos
- [ ] Manejar conflictos con atajos del navegador

**Criterios de Aceptación**:
- [ ] Atajos funcionando para save, export, delete
- [ ] Help modal con lista completa
- [ ] Compatible con diferentes OS (Ctrl/Cmd)
- [ ] No interfiere con funcionalidad existente

---

## Entregables del Sprint

### Funcionalidades Principales
- [x] **Análisis completo** de componentes existentes
- [ ] **Validación de nombres únicos** para workflows
- [ ] **Lista de workflows optimizada** con toggle de activación
- [ ] **Layout del editor ajustado** con canvas a pantalla completa
- [ ] **Botón export reposicionado** en barra superior
- [ ] **Header sticky** en todas las páginas
- [ ] **Mejoras de UX adicionales** (feedback, atajos)

### Componentes Nuevos/Modificados
- [ ] `WorkflowCreationModal.tsx` - Validación de duplicados
- [ ] `WorkflowList.tsx` - Botón toggle y mejoras UX
- [ ] `WorkflowEditor.tsx` - Layout optimizado y toolbar
- [ ] `Header.tsx` - Positioning sticky
- [ ] `workflowStore.ts` - Funciones adicionales
- [ ] `api.ts` - Endpoints necesarios
- [ ] `globals.css` - Estilos CSS necesarios

### Nuevos Archivos a Crear
- [ ] `TooltipManager.tsx` - Sistema de tooltips centralizado
- [ ] `ToastNotification.tsx` - Sistema de notificaciones
- [ ] `HotkeyManager.tsx` - Gestión de atajos de teclado
- [ ] `HelpModal.tsx` - Modal de ayuda con atajos

---

## Métricas de Éxito

### Métricas de UX
- [ ] Tiempo de navegación entre workflows < 2 segundos
- [ ] Tasa de error en creación de workflows < 2%
- [ ] Satisfacción de usuario con nuevo layout > 4.5/5
- [ ] Tiempo de aprendizaje para nuevos usuarios < 15 minutos

### Métricas Técnicas
- [ ] Tiempo de carga de lista de workflows < 1 segundo
- [ ] Layout responsivo funcionando en 95% dispositivos
- [ ] Sin errores de console en navegadores principales
- [ ] Performance score > 85 en Lighthouse

### Métricas de Funcionalidad
- [ ] 100% de validaciones funcionando correctamente
- [ ] Botones de acción responsivos < 200ms
- [ ] Header sticky funcionando en 100% de páginas
- [ ] Atajos de teclado funcionando en 95% casos de uso

---

## Riesgos y Mitigaciones

### Riesgo: Cambios de layout pueden afectar funcionalidad existente
**Mitigación**: Testing exhaustivo en diferentes tamaños de pantalla

### Riesgo: Header sticky puede interferir con elementos existentes
**Mitigación**: Z-index management y testing de superposición

### Riesgo: Validación de nombres puede impactar performance
**Mitigación**: Debouncing y caching de resultados

---

## Criterios de Aceptación Generales

### Must Have ✅ CRÍTICO
- [ ] **Validación de nombres duplicados funcionando**
- [ ] **Canvas del editor ajustado correctamente a pantalla**
- [ ] **Header sticky implementado**
- [ ] **Botón export en posición superior**

### Should Have 📋 IMPORTANTE  
- [ ] **Toggle de activación en workflows**
- [ ] **Tooltips informativos**
- [ ] **Toast notifications**
- [ ] **Mejoras de layout responsive**

### Could Have 🔧 NICE-TO-HAVE
- [ ] **Atajos de teclado**
- [ ] **Filtros avanzados**
- [ ] **Animaciones suaves**
- [ ] **Help modal**

---

## Próximos Pasos Post-Sprint

### Sprint 10-11: Conectores Esenciales
- Aprovechar las mejoras de UX para facilitar configuración de conectores
- Integrar tooltips con documentación de conectores
- Usar layout optimizado para panels de configuración

### Integración Continua
- Implementar tests automatizados para nuevas funcionalidades
- Documentar patrones de UX para futuros componentes
- Crear guía de estilos basada en mejoras implementadas

---

## Estado del Sprint

### Progreso Actual: 15% (Análisis Completado)
- ✅ **Análisis de componentes existentes** - COMPLETADO
- ✅ **Identificación de requerimientos** - COMPLETADO
- ✅ **Plan detallado de implementación** - COMPLETADO
- ⏳ **Implementación de funcionalidades** - PENDIENTE

### Próximo Hito Crítico
**Validación de nombres únicos** - Base fundamental para prevenir conflictos en workflows

**El Sprint 9.7 complementa perfectamente las funcionalidades técnicas ya implementadas (flujo de datos, persistencia, editor visual) con mejoras de UX que harán FlowCraft más profesional y fácil de usar.**