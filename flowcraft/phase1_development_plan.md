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

**Estado:** 65% COMPLETADO - En progreso

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

### Sprint 10-11: Conectores Esenciales (2 semanas) 