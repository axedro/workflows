# Sprint 8-9: Workflow Editor Foundation - Plan Detallado
## FlowCraft Workflow Automation Platform

### Objetivo
Implementar el editor visual básico de workflows con React Flow, incluyendo canvas, nodos básicos, conexiones, y gestión de estado.

### Duración
2 semanas (10 días laborables)

---

## FASE 1: React Flow Implementation (Días 1-3)

### Tarea 1.1: Canvas Setup con React Flow
**Objetivo:** Configurar el canvas básico de React Flow

#### Subtareas:
- [ ] **1.1.1** Instalar dependencias actualizadas de React Flow
  - [ ] Actualizar `react-flow-renderer` a la versión más reciente
  - [ ] Instalar `@reactflow/core` y `@reactflow/controls`
  - [ ] Verificar compatibilidad con React 18

- [ ] **1.1.2** Configurar el componente WorkflowEditor
  - [ ] Crear estructura básica del canvas
  - [ ] Configurar ReactFlowProvider
  - [ ] Implementar controles básicos (zoom, pan, fit view)
  - [ ] Configurar estilos del canvas

- [ ] **1.1.3** Configurar tipos TypeScript
  - [ ] Definir tipos para nodos personalizados
  - [ ] Definir tipos para edges personalizados
  - [ ] Configurar tipos para el estado del editor

#### Criterios de Aceptación:
- [ ] Canvas se renderiza correctamente
- [ ] Controles de zoom y pan funcionan
- [ ] No hay errores de TypeScript
- [ ] Estilos aplicados correctamente

#### Testing:
```bash
# Verificar instalación
pnpm list react-flow-renderer @reactflow/core @reactflow/controls

# Verificar compilación
pnpm type-check

# Verificar renderizado
# Navegar a /workflow-editor y verificar canvas
```

---

### Tarea 1.2: Node Types Básicos
**Objetivo:** Implementar nodos básicos (start, end, action)

#### Subtareas:
- [ ] **1.2.1** Crear estructura de nodos
  - [ ] Crear directorio `src/components/workflow-editor/nodes/`
  - [ ] Implementar `StartNode.tsx`
  - [ ] Implementar `EndNode.tsx`
  - [ ] Implementar `ActionNode.tsx`

- [ ] **1.2.2** Configurar tipos de nodos
  - [ ] Definir `NodeTypes` en shared-types
  - [ ] Configurar `nodeTypes` en ReactFlow
  - [ ] Implementar validación de tipos

- [ ] **1.2.3** Estilos de nodos
  - [ ] Diseñar estilos para cada tipo de nodo
  - [ ] Implementar estados hover y selected
  - [ ] Configurar colores y iconos

#### Criterios de Aceptación:
- [ ] Los 3 tipos de nodos se renderizan correctamente
- [ ] Cada nodo tiene estilos distintivos
- [ ] Estados hover y selected funcionan
- [ ] Tipos TypeScript están correctos

#### Testing:
```bash
# Verificar componentes
pnpm type-check

# Verificar renderizado
# Arrastrar nodos al canvas y verificar estilos
```

---

### Tarea 1.3: Edge Connections
**Objetivo:** Implementar conexiones entre nodos

#### Subtareas:
- [ ] **1.3.1** Configurar tipos de edges
  - [ ] Definir `EdgeTypes` en shared-types
  - [ ] Implementar edge personalizado básico
  - [ ] Configurar validación de conexiones

- [ ] **1.3.2** Implementar lógica de conexión
  - [ ] Configurar `onConnect` handler
  - [ ] Implementar validación de conexiones válidas
  - [ ] Prevenir conexiones inválidas (ej: end → start)

- [ ] **1.3.3** Estilos de edges
  - [ ] Diseñar estilos para edges
  - [ ] Implementar estados hover y selected
  - [ ] Configurar marcadores de dirección

#### Criterios de Aceptación:
- [ ] Se pueden crear conexiones entre nodos
- [ ] Las conexiones inválidas se previenen
- [ ] Los edges tienen estilos apropiados
- [ ] La validación funciona correctamente

#### Testing:
```bash
# Verificar conexiones
# Conectar nodos y verificar validación
# Intentar conexiones inválidas
```

---

### Tarea 1.4: Drag and Drop Functionality
**Objetivo:** Implementar funcionalidad de arrastrar y soltar

#### Subtareas:
- [ ] **1.4.1** Configurar Node Palette
  - [ ] Crear sidebar con nodos disponibles
  - [ ] Implementar drag desde palette
  - [ ] Configurar drop zones en canvas

- [ ] **1.4.2** Implementar drag de nodos existentes
  - [ ] Configurar `onNodeDrag` handler
  - [ ] Implementar snap to grid (opcional)
  - [ ] Validar posiciones válidas

- [ ] **1.4.3** Feedback visual
  - [ ] Mostrar preview durante drag
  - [ ] Indicar zonas válidas de drop
  - [ ] Feedback de éxito/error

#### Criterios de Aceptación:
- [ ] Se pueden arrastrar nodos desde la palette
- [ ] Se pueden mover nodos existentes
- [ ] El feedback visual funciona
- [ ] No hay nodos fuera del canvas

#### Testing:
```bash
# Verificar drag and drop
# Arrastrar nodos desde palette
# Mover nodos existentes
# Verificar feedback visual
```

---

### Tarea 1.5: Zoom y Pan Controls
**Objetivo:** Implementar controles de navegación

#### Subtareas:
- [ ] **1.5.1** Configurar controles básicos
  - [ ] Implementar botones de zoom in/out
  - [ ] Implementar botón de fit view
  - [ ] Implementar botón de reset view

- [ ] **1.5.2** Configurar controles avanzados
  - [ ] Implementar zoom con rueda del mouse
  - [ ] Implementar pan con click y drag
  - [ ] Configurar límites de zoom

- [ ] **1.5.3** Mejorar UX
  - [ ] Agregar tooltips a controles
  - [ ] Implementar atajos de teclado
  - [ ] Mostrar nivel de zoom actual

#### Criterios de Aceptación:
- [ ] Todos los controles funcionan correctamente
- [ ] Los atajos de teclado funcionan
- [ ] Los límites de zoom se respetan
- [ ] La UX es intuitiva

#### Testing:
```bash
# Verificar controles
# Probar zoom in/out
# Probar fit view
# Probar atajos de teclado
```

---

## FASE 2: Node Library (Días 4-6)

### Tarea 2.1: Node Palette Sidebar
**Objetivo:** Crear sidebar con biblioteca de nodos

#### Subtareas:
- [ ] **2.1.1** Diseñar estructura de sidebar
  - [ ] Crear componente `NodePalette.tsx`
  - [ ] Organizar nodos por categorías
  - [ ] Implementar diseño responsive

- [ ] **2.1.2** Implementar categorías
  - [ ] Core (Start, End, Action)
  - [ ] Connectors (HTTP, Email, Slack)
  - [ ] Logic (Condition, Loop)
  - [ ] Data (Transform, Filter)

- [ ] **2.1.3** Configurar drag desde palette
  - [ ] Implementar `onDragStart`
  - [ ] Configurar `dragHandle`
  - [ ] Mostrar preview durante drag

#### Criterios de Aceptación:
- [ ] Sidebar se muestra correctamente
- [ ] Nodos están organizados por categorías
- [ ] Se puede arrastrar desde la palette
- [ ] El diseño es responsive

#### Testing:
```bash
# Verificar sidebar
# Probar categorías
# Probar drag desde palette
# Verificar responsive design
```

---

### Tarea 2.2: Node Configuration Panels
**Objetivo:** Implementar paneles de configuración de nodos

#### Subtareas:
- [ ] **2.2.1** Crear estructura de paneles
  - [ ] Crear componente `PropertyPanel.tsx`
  - [ ] Implementar selección de nodos
  - [ ] Configurar layout del panel

- [ ] **2.2.2** Implementar formularios de configuración
  - [ ] Crear formularios para cada tipo de nodo
  - [ ] Implementar validación de campos
  - [ ] Configurar actualización en tiempo real

- [ ] **2.2.3** Configurar persistencia
  - [ ] Guardar configuración en estado
  - [ ] Implementar auto-save
  - [ ] Configurar reset de configuración

#### Criterios de Aceptación:
- [ ] Panel se muestra al seleccionar nodo
- [ ] Formularios funcionan correctamente
- [ ] Validación funciona en tiempo real
- [ ] Configuración se persiste

#### Testing:
```bash
# Verificar paneles
# Seleccionar nodos
# Configurar propiedades
# Verificar validación
```

---

### Tarea 2.3: Node Validation
**Objetivo:** Implementar validación de nodos

#### Subtareas:
- [ ] **2.3.1** Validación de configuración
  - [ ] Implementar validación de campos requeridos
  - [ ] Validar formatos (URLs, emails, etc.)
  - [ ] Mostrar errores de validación

- [ ] **2.3.2** Validación de conexiones
  - [ ] Validar tipos de entrada/salida
  - [ ] Prevenir conexiones incompatibles
  - [ ] Mostrar warnings de conexión

- [ ] **2.3.3** Validación de workflow
  - [ ] Verificar que hay un nodo start
  - [ ] Verificar que hay un nodo end
  - [ ] Verificar que todos los nodos están conectados

#### Criterios de Aceptación:
- [ ] Validación de campos funciona
- [ ] Validación de conexiones funciona
- [ ] Validación de workflow funciona
- [ ] Errores se muestran claramente

#### Testing:
```bash
# Verificar validación
# Probar campos inválidos
# Probar conexiones inválidas
# Verificar mensajes de error
```

---

### Tarea 2.4: Node Preview Functionality
**Objetivo:** Implementar vista previa de nodos

#### Subtareas:
- [ ] **2.4.1** Preview en palette
  - [ ] Mostrar preview al hacer hover
  - [ ] Mostrar descripción del nodo
  - [ ] Mostrar icono y nombre

- [ ] **2.4.2** Preview en canvas
  - [ ] Mostrar tooltip con información
  - [ ] Mostrar estado de validación
  - [ ] Mostrar configuración actual

- [ ] **2.4.3** Preview de conexiones
  - [ ] Mostrar tipo de datos
  - [ ] Mostrar estado de la conexión
  - [ ] Mostrar información de validación

#### Criterios de Aceptación:
- [ ] Preview en palette funciona
- [ ] Preview en canvas funciona
- [ ] Preview de conexiones funciona
- [ ] Información es útil y clara

#### Testing:
```bash
# Verificar previews
# Hover en nodos de palette
# Hover en nodos del canvas
# Verificar información mostrada
```

---

### Tarea 2.5: Search y Filtros
**Objetivo:** Implementar búsqueda y filtros en la palette

#### Subtareas:
- [ ] **2.5.1** Búsqueda de nodos
  - [ ] Implementar campo de búsqueda
  - [ ] Búsqueda por nombre y descripción
  - [ ] Búsqueda en tiempo real

- [ ] **2.5.2** Filtros por categoría
  - [ ] Implementar filtros por categoría
  - [ ] Filtros múltiples
  - [ ] Botón de limpiar filtros

- [ ] **2.5.3** Resultados de búsqueda
  - [ ] Mostrar resultados filtrados
  - [ ] Mostrar mensaje si no hay resultados
  - [ ] Resaltar términos de búsqueda

#### Criterios de Aceptación:
- [ ] Búsqueda funciona correctamente
- [ ] Filtros funcionan correctamente
- [ ] Resultados se muestran apropiadamente
- [ ] UX es intuitiva

#### Testing:
```bash
# Verificar búsqueda
# Buscar nodos por nombre
# Aplicar filtros
# Verificar resultados
```

---

## FASE 3: Workflow State Management (Días 7-10)

### Tarea 3.1: Zustand Store para Workflow Editor
**Objetivo:** Implementar estado global del editor

#### Subtareas:
- [ ] **3.1.1** Crear store del editor
  - [ ] Crear `workflowEditorStore.ts`
  - [ ] Definir estado inicial
  - [ ] Implementar acciones básicas

- [ ] **3.1.2** Integrar con React Flow
  - [ ] Conectar estado con ReactFlow
  - [ ] Implementar sincronización bidireccional
  - [ ] Configurar listeners de eventos

- [ ] **3.1.3** Persistencia local
  - [ ] Implementar auto-save en localStorage
  - [ ] Configurar recuperación de estado
  - [ ] Manejar conflictos de versión

#### Criterios de Aceptación:
- [ ] Store funciona correctamente
- [ ] Estado se sincroniza con ReactFlow
- [ ] Auto-save funciona
- [ ] Recuperación de estado funciona

#### Testing:
```bash
# Verificar store
# Probar acciones del store
# Verificar sincronización
# Probar auto-save
```

---

### Tarea 3.2: Undo/Redo Functionality
**Objetivo:** Implementar funcionalidad de deshacer/rehacer

#### Subtareas:
- [ ] **3.2.1** Implementar historial
  - [ ] Crear sistema de historial
  - [ ] Implementar snapshots del estado
  - [ ] Configurar límite de historial

- [ ] **3.2.2** Implementar acciones undo/redo
  - [ ] Implementar `undo()` action
  - [ ] Implementar `redo()` action
  - [ ] Configurar atajos de teclado

- [ ] **3.2.3** Integrar con UI
  - [ ] Agregar botones undo/redo
  - [ ] Mostrar estado de disponibilidad
  - [ ] Configurar tooltips

#### Criterios de Aceptación:
- [ ] Undo/redo funciona correctamente
- [ ] Atajos de teclado funcionan
- [ ] UI refleja estado de disponibilidad
- [ ] Historial se mantiene apropiadamente

#### Testing:
```bash
# Verificar undo/redo
# Probar atajos de teclado
# Verificar historial
# Probar límites de historial
```

---

### Tarea 3.3: Auto-save
**Objetivo:** Implementar guardado automático

#### Subtareas:
- [ ] **3.3.1** Configurar auto-save
  - [ ] Implementar guardado automático
  - [ ] Configurar intervalo de guardado
  - [ ] Manejar cambios no guardados

- [ ] **3.3.2** Integrar con API
  - [ ] Conectar con endpoints de workflow
  - [ ] Implementar guardado incremental
  - [ ] Manejar errores de guardado

- [ ] **3.3.3** Feedback de usuario
  - [ ] Mostrar indicador de guardado
  - [ ] Mostrar estado de sincronización
  - [ ] Alertar sobre cambios no guardados

#### Criterios de Aceptación:
- [ ] Auto-save funciona correctamente
- [ ] API integration funciona
- [ ] Feedback de usuario es claro
- [ ] Manejo de errores funciona

#### Testing:
```bash
# Verificar auto-save
# Probar guardado automático
# Verificar API integration
# Probar manejo de errores
```

---

### Tarea 3.4: Workflow Validation en Tiempo Real
**Objetivo:** Implementar validación en tiempo real

#### Subtareas:
- [ ] **3.4.1** Validación de estructura
  - [ ] Validar que hay nodo start
  - [ ] Validar que hay nodo end
  - [ ] Validar conectividad

- [ ] **3.4.2** Validación de configuración
  - [ ] Validar campos requeridos
  - [ ] Validar formatos
  - [ ] Validar dependencias

- [ ] **3.4.3** Validación de performance
  - [ ] Detectar ciclos
  - [ ] Validar complejidad
  - [ ] Prevenir loops infinitos

#### Criterios de Aceptación:
- [ ] Validación funciona en tiempo real
- [ ] Errores se muestran claramente
- [ ] Performance es aceptable
- [ ] Validación es completa

#### Testing:
```bash
# Verificar validación
# Probar casos de error
# Verificar performance
# Probar casos edge
```

---

### Tarea 3.5: Error Highlighting
**Objetivo:** Implementar resaltado de errores

#### Subtareas:
- [ ] **3.5.1** Resaltado visual
  - [ ] Resaltar nodos con errores
  - [ ] Resaltar conexiones problemáticas
  - [ ] Mostrar indicadores de error

- [ ] **3.5.2** Mensajes de error
  - [ ] Mostrar tooltips con errores
  - [ ] Implementar panel de errores
  - [ ] Agrupar errores por tipo

- [ ] **3.5.3** Navegación de errores
  - [ ] Permitir navegar entre errores
  - [ ] Auto-focus en errores
  - [ ] Sugerir correcciones

#### Criterios de Aceptación:
- [ ] Errores se resaltan visualmente
- [ ] Mensajes son claros y útiles
- [ ] Navegación funciona
- [ ] UX es intuitiva

#### Testing:
```bash
# Verificar resaltado
# Probar mensajes de error
# Verificar navegación
# Probar sugerencias
```

---

## FASE 4: Testing y Polish (Días 9-10)

### Tarea 4.1: Testing Completo
**Objetivo:** Probar todas las funcionalidades

#### Subtareas:
- [ ] **4.1.1** Testing de componentes
  - [ ] Probar todos los componentes
  - [ ] Verificar renderizado
  - [ ] Probar interacciones

- [ ] **4.1.2** Testing de integración
  - [ ] Probar flujo completo
  - [ ] Verificar integración con API
  - [ ] Probar persistencia

- [ ] **4.1.3** Testing de performance
  - [ ] Probar con workflows grandes
  - [ ] Verificar rendimiento
  - [ ] Optimizar si es necesario

#### Criterios de Aceptación:
- [ ] Todos los tests pasan
- [ ] Performance es aceptable
- [ ] No hay errores críticos
- [ ] UX es fluida

#### Testing:
```bash
# Ejecutar tests
pnpm test

# Verificar performance
# Probar workflows grandes
```

---

### Tarea 4.2: Polish y Optimización
**Objetivo:** Mejorar UX y performance

#### Subtareas:
- [ ] **4.2.1** Optimización de performance
  - [ ] Optimizar re-renders
  - [ ] Implementar lazy loading
  - [ ] Optimizar bundle size

- [ ] **4.2.2** Mejoras de UX
  - [ ] Agregar animaciones
  - [ ] Mejorar feedback visual
  - [ ] Optimizar responsive design

- [ ] **4.2.3** Documentación
  - [ ] Documentar componentes
  - [ ] Crear guías de uso
  - [ ] Documentar API del editor

#### Criterios de Aceptación:
- [ ] Performance es óptima
- [ ] UX es excelente
- [ ] Documentación está completa
- [ ] Código está limpio

#### Testing:
```bash
# Verificar performance
# Probar UX
# Revisar documentación
```

---

## ENTREGABLES FINALES

### ✅ Editor Visual Funcional
- Canvas de React Flow completamente funcional
- Nodos básicos (start, end, action) implementados
- Conexiones entre nodos funcionando
- Drag and drop desde palette
- Controles de zoom y pan

### ✅ Biblioteca de Nodos Básica
- Node palette sidebar con categorías
- Paneles de configuración para cada nodo
- Validación de nodos en tiempo real
- Preview functionality
- Búsqueda y filtros

### ✅ Gestión de Estado del Editor
- Zustand store para workflow editor
- Funcionalidad undo/redo
- Auto-save con API integration
- Validación en tiempo real
- Error highlighting

### ✅ Testing y Quality
- Todos los componentes testeados
- Performance optimizada
- UX pulida y responsive
- Documentación completa

---

## CRITERIOS DE ÉXITO

### Métricas Técnicas
- [ ] **Performance:** <2s para cargar editor
- [ ] **Reliability:** 100% de funcionalidades funcionando
- [ ] **Usability:** <5 minutos para crear workflow básico
- [ ] **Quality:** 0 errores críticos

### Métricas de UX
- [ ] **Intuitividad:** Usuarios pueden crear workflows sin ayuda
- [ ] **Eficiencia:** <10 clicks para workflow básico
- [ ] **Satisfacción:** Feedback positivo en testing
- [ ] **Accesibilidad:** Cumple estándares WCAG

### Métricas de Desarrollo
- [ ] **Cobertura:** >80% de código testado
- [ ] **Documentación:** 100% de componentes documentados
- [ ] **Performance:** Bundle size <2MB
- [ ] **Maintainability:** Código limpio y bien estructurado

---

## PRÓXIMOS PASOS

### Sprint 10-11: Conectores Esenciales
- Implementar 20 conectores esenciales
- Integrar conectores con editor
- Testing de conectores

### Sprint 12-13: Motor de Ejecución
- Sistema de ejecución de workflows
- Queue system con Bull/BullMQ
- Execution monitoring

---

## NOTAS IMPORTANTES

### Dependencias
- React Flow ya está instalado (`react-flow-renderer`)
- Zustand ya está configurado
- API endpoints ya están implementados
- Base de datos ya está configurada

### Consideraciones Técnicas
- Usar TypeScript strict mode
- Seguir patrones de diseño establecidos
- Mantener consistencia con código existente
- Implementar error handling robusto

### Consideraciones de UX
- Mantener consistencia visual con resto de la app
- Usar componentes de @flowcraft/ui
- Implementar feedback visual apropiado
- Optimizar para dispositivos móviles

---

**Estado:** PENDIENTE - Listo para implementación
**Prioridad:** ALTA - Base para próximos sprints
**Complejidad:** MEDIA - React Flow ya está instalado 