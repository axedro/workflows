### Sprint 8-9: Workflow Editor Foundation (2 semanas)
**Objetivo:** Editor visual básico de workflows

#### React Flow Implementation
- [ ] Canvas setup con React Flow
- [ ] Node types básicos (start, end, action)
- [ ] Edge connections
- [ ] Drag and drop functionality
- [ ] Zoom y pan controls

#### Node Library
- [ ] Node palette sidebar
- [ ] Node configuration panels
- [ ] Node validation
- [ ] Node preview functionality
- [ ] Search y filtros

#### Workflow State Management
- [ ] Zustand store para workflow editor
- [ ] Undo/redo functionality
- [ ] Auto-save
- [ ] Workflow validation en tiempo real
- [ ] Error highlighting

**Entregables:**
- Editor visual funcional
- Biblioteca de nodos básica
- Gestión de estado del editor

**Estado:** 90% COMPLETADO - Funcionalidad principal implementada

**Últimas actualizaciones:**
- ✅ Workflow persistence arreglado - nodes ahora se guardan y cargan correctamente
- ✅ Schema validation mejorado en API con `additionalProperties: true`
- ✅ Auto-save funcionando correctamente
- ✅ Debugging logs removidos del código de producción
- ✅ Validación de workflow re-habilitada

---

### Sprint 9.5: Sistema de Flujo de Datos (1 semana) ✅ COMPLETADO
**Objetivo:** Implementar sistema completo de flujo de datos entre nodos

#### Data Flow Architecture ✅
- [x] Definir modelo de datos (DataField, DataPort, DataFlow)
- [x] Tipos de datos (string, number, boolean, object, array)
- [x] Sistema de validación de tipos de datos
- [x] Mapeo de campos entre nodos

#### Nodos con Puertos de Datos ✅
- [x] Rediseñar nodos con puertos input/output tipados
- [x] StartNode: Solo output port con datos iniciales
- [x] ActionNode: Input port + output port con transformación
- [x] ConditionNode: Input port + 2 output ports (true/false)
- [x] EndNode: Solo input port para datos finales
- [x] Visualización de campos de datos en tiempo real

#### Nodo de Condición como Rombo ✅
- [x] Cambiar forma de ConditionNode de rectángulo a rombo
- [x] Una entrada (top) y dos salidas (true/false)
- [x] Lógica de flujo de datos condicional
- [x] Transmitir datos solo por la rama que cumple condición
- [x] Editor de condiciones con campos disponibles

#### Conexiones Direccionales con Datos ✅
- [x] Flechas direccionales claras con sentido de flujo
- [x] Mostrar campos de datos que fluyen en conexiones
- [x] Validación de compatibilidad de tipos entre puertos
- [x] Prevenir conexiones incompatibles
- [x] Animación de flujo de datos

#### Panel de Configuración de Datos ✅
- [x] Panel para configurar mapeo de campos
- [x] Drag & drop para mapear campos de entrada a salida
- [x] Transformaciones básicas (rename, filter, transform)
- [x] Preview de datos resultantes
- [x] Testing de transformaciones con datos reales

#### Integración con Conectores ✅
- [x] Definir esquemas de datos para cada conector
- [x] Importación de datos desde fuentes externas
- [x] Exportación de datos a formatos estándar
- [x] Validación de configuraciones de conectores

#### Sistema de Esquemas Dinámicos ✅ 🆕
- [x] Cálculo dinámico de esquemas de entrada/salida
- [x] Esquemas basados en conexiones reales del workflow
- [x] Aplicación de transformaciones en el flujo de datos
- [x] Generadores específicos por tipo de nodo
- [x] Eliminación de esquemas hardcodeados

**Entregables:**
- Sistema completo de flujo de datos
- Nodos con puertos tipados
- Nodos de condición como rombos
- Conexiones direccionales con validación
- Panel de configuración de datos
- Integración con conectores
- Sistema de esquemas dinámicos

**Estado:** ✅ 100% COMPLETADO - Sistema de flujo de datos funcional con esquemas dinámicos

---

### Sprint 9.7: Sistema de Validación Unificado (1 semana) ✅ COMPLETADO
**Objetivo:** Implementar sistema comprensivo de validación para workflows completos

#### Arquitectura de Validación Unificada ✅
- [x] UnifiedValidationService centralizado
- [x] Consolidación de validaciones de nodos y edges
- [x] Categorización de validaciones (workflow, field, structural)
- [x] Sistema de códigos de error únicos
- [x] Integración con ConnectorValidationService existente

#### Validaciones de Nodos Comprehensivas ✅
- [x] HTTP_REQUEST: URL, método, headers, configuración
- [x] EMAIL: direcciones, formato, asunto, contenido
- [x] SLACK: canales, mensajes, configuración
- [x] CONDITION: expresiones, sintaxis, lógica
- [x] DATA_TRANSFORM: operaciones, configuración
- [x] START/END: validaciones específicas del flujo

#### Validaciones de Edges Avanzadas ✅
- [x] Validación estructural: nodos existentes, self-loops, IDs
- [x] Validación de flujo de datos: compatibilidad de tipos, transformaciones
- [x] Validación de condiciones: sintaxis, operadores, lógica
- [x] Validación de mapeo de campos: estructura, formato, transformaciones
- [x] Detección de ciclos con algoritmo DFS optimizado
- [x] Análisis de componentes desconectados

#### Interfaz de Usuario Mejorada ✅
- [x] Issues dropdown con scroll y altura máxima controlada
- [x] Separación visual de errores de nodos vs edges
- [x] Información detallada: ID, campo, categoría, código de error
- [x] Badge "CONNECTION" para validaciones de edges
- [x] Validación en tiempo real con debounce de 1 segundo

#### Integración Visual ✅
- [x] Bordes rojos/naranjas en nodos inválidos
- [x] Feedback visual inmediato en ActionNode
- [x] Persistencia de validación entre selecciones de nodos
- [x] Consolidación con sistema de validación API legacy

#### Navegación de Issues ✅ 🆕
- [x] Click navigation desde Issues dropdown hacia nodos/edges problemáticos
- [x] Auto-apertura del PropertyPanel con el elemento seleccionado
- [x] Centrado automático de vista en el elemento problemático
- [x] Highlighting temporal de campos específicos con ring rojo
- [x] Scroll automático hacia el campo problemático
- [x] Manejo correcto de contexto ReactFlow con refs
- [x] Soporte para navegación tanto de nodos como de edges

**Entregables:**
- Sistema de validación completamente unificado
- Validaciones comprehensivas para todos los tipos de nodos
- Validaciones avanzadas de edges con detección de ciclos
- UI mejorada con categorización detallada de issues
- Integración completa con editor visual
- Sistema de navegación clickeable desde Issues hacia elementos problemáticos

**Estado:** ✅ 100% COMPLETADO - Sistema de validación unificado con validaciones de nodos y edges completas + navegación clickeable desde Issues dropdown

---

### Sprint 10-11: Conectores Esenciales (2 semanas) 