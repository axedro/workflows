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

### Sprint 9.5: Sistema de Flujo de Datos (1 semana) 🆕 NUEVO
**Objetivo:** Implementar sistema completo de flujo de datos entre nodos

#### Data Flow Architecture
- [ ] Definir modelo de datos (DataField, DataPort, DataFlow)
- [ ] Tipos de datos (string, number, boolean, object, array)
- [ ] Sistema de validación de tipos de datos
- [ ] Mapeo de campos entre nodos

#### Nodos con Puertos de Datos
- [ ] Rediseñar nodos con puertos input/output tipados
- [ ] StartNode: Solo output port con datos iniciales
- [ ] ActionNode: Input port + output port con transformación
- [ ] ConditionNode: Input port + 2 output ports (true/false)
- [ ] EndNode: Solo input port para datos finales
- [ ] Visualización de campos de datos en tiempo real

#### Nodo de Condición como Rombo
- [ ] Cambiar forma de ConditionNode de rectángulo a rombo
- [ ] Una entrada (top) y dos salidas (true/false)
- [ ] Lógica de flujo de datos condicional
- [ ] Transmitir datos solo por la rama que cumple condición
- [ ] Editor de condiciones con campos disponibles

#### Conexiones Direccionales con Datos
- [ ] Flechas direccionales claras con sentido de flujo
- [ ] Mostrar campos de datos que fluyen en conexiones
- [ ] Validación de compatibilidad de tipos entre puertos
- [ ] Prevenir conexiones incompatibles
- [ ] Animación de flujo de datos

#### Panel de Configuración de Datos
- [ ] Panel para configurar mapeo de campos
- [ ] Drag & drop para mapear campos de entrada a salida
- [ ] Transformaciones básicas (rename, filter, transform)
- [ ] Preview de datos resultantes
- [ ] Testing de transformaciones con datos reales

#### Integración con Conectores
- [ ] Definir esquemas de datos para cada conector
- [ ] Importación de datos desde fuentes externas
- [ ] Exportación de datos a formatos estándar
- [ ] Validación de configuraciones de conectores

**Entregables:**
- Sistema completo de flujo de datos
- Nodos con puertos tipados
- Nodos de condición como rombos
- Conexiones direccionales con validación
- Panel de configuración de datos
- Integración con conectores

**Estado:** PENDIENTE - Sprint crítico para funcionalidad de workflow automation

---

### Sprint 10-11: Conectores Esenciales (2 semanas) 