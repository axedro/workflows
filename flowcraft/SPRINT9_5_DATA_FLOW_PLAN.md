# Sprint 9.5: Sistema de Flujo de Datos - Plan Detallado
## FlowCraft Workflow Automation Platform

### Objetivo
Implementar un sistema completo de flujo de datos entre nodos que permita:
- Visualizar y validar el flujo de datos entre nodos
- Configurar mapeo de campos de entrada a salida
- Implementar nodos de condición como rombos con lógica de bifurcación
- Validar tipos de datos en tiempo real
- Proporcionar feedback visual del flujo de datos

### Duración
1 semana (5 días laborables)

---

## ARQUITECTURA DEL SISTEMA DE DATOS

### 1. Modelo de Datos Base

#### DataField Interface
```typescript
interface DataField {
  id: string;
  name: string;
  type: DataType;
  required: boolean;
  description?: string;
  defaultValue?: any;
  validation?: FieldValidation;
}

enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  DATE = 'date',
  EMAIL = 'email',
  URL = 'url'
}

interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
}
```

#### DataPort Interface
```typescript
interface DataPort {
  id: string;
  name: string;
  type: 'input' | 'output';
  fields: DataField[];
  position: 'top' | 'bottom' | 'left' | 'right';
  required: boolean;
  multiple?: boolean; // Para condiciones con múltiples salidas
}
```

#### DataFlow Interface
```typescript
interface DataFlow {
  id: string;
  sourcePortId: string;
  targetPortId: string;
  fieldMappings: FieldMapping[];
  transformations?: DataTransformation[];
  validation: FlowValidation;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: FieldTransformation;
}

interface DataTransformation {
  type: 'rename' | 'filter' | 'transform' | 'aggregate';
  config: Record<string, any>;
}
```

### 2. Actualización de Tipos de Nodos

#### NodeData Enhancement
```typescript
interface NodeData {
  // ... existing properties
  inputPorts: DataPort[];
  outputPorts: DataPort[];
  dataSchema: {
    input: Record<string, DataField>;
    output: Record<string, DataField>;
  };
  transformations: DataTransformation[];
  validation: NodeValidation;
}
```

---

## TAREAS DETALLADAS

### Tarea 9.5.1: Data Flow Architecture (Día 1)

#### 9.5.1.1 Definir modelo de datos ✅ COMPLETADO
**Objetivo:** Crear las interfaces y tipos base para el sistema de flujo de datos

**Subtareas:**
- [x] Crear `packages/shared-types/src/data-flow.ts`
- [x] Implementar `DataField`, `DataType`, `FieldValidation` interfaces
- [x] Implementar `DataPort`, `DataFlow`, `FieldMapping` interfaces
- [x] Implementar `DataTransformation`, `FieldTransformation` interfaces
- [x] Crear enums para tipos de datos y validaciones

**Criterios de Aceptación:**
- [x] Todas las interfaces están definidas y tipadas
- [x] Los tipos son compatibles con TypeScript strict mode
- [x] Las interfaces son extensibles para futuras funcionalidades
- [x] Documentación JSDoc completa

**Testing:**
```bash
# Verificar tipos
pnpm type-check

# Verificar compilación
pnpm build
```

**Estado:** ✅ COMPLETADO - Archivo `data-flow.ts` creado con todas las interfaces necesarias

#### 9.5.1.2 Actualizar tipos de nodos ✅ COMPLETADO
**Objetivo:** Integrar el sistema de datos con los tipos de nodos existentes

**Subtareas:**
- [x] Actualizar `NodeData` interface en `shared-types`
- [x] Agregar `inputPorts` y `outputPorts` a `EditorNode`
- [x] Actualizar `EditorEdge` para incluir `DataFlow`
- [x] Crear tipos específicos para cada tipo de nodo
- [x] Implementar validación de tipos de datos

**Criterios de Aceptación:**
- [x] Los nodos existentes siguen funcionando
- [x] Los nuevos campos son opcionales para compatibilidad
- [x] La validación de tipos funciona correctamente
- [x] No hay errores de TypeScript

**Estado:** ✅ COMPLETADO - Tipos de nodos actualizados con soporte completo para flujo de datos

#### 9.5.1.3 Sistema de validación de datos
**Objetivo:** Implementar validación en tiempo real del flujo de datos

**Subtareas:**
- [ ] Crear `DataValidationService` en `packages/shared-types`
- [ ] Implementar validación de compatibilidad de tipos
- [ ] Crear sistema de warnings para conversiones automáticas
- [ ] Implementar validación de campos requeridos
- [ ] Crear sistema de errores de validación

**Criterios de Aceptación:**
- [ ] La validación funciona en tiempo real
- [ ] Los errores se muestran claramente
- [ ] Los warnings son informativos
- [ ] La performance es aceptable

---

### Tarea 9.5.2: Nodos con Puertos de Datos (Día 2)

#### 9.5.2.1 Rediseñar nodos con puertos
**Objetivo:** Actualizar todos los nodos para mostrar puertos de datos

**Subtareas:**
- [ ] Crear `DataPortHandle` component
- [ ] Implementar tooltips para mostrar campos de datos
- [ ] Agregar indicadores visuales de tipo de datos
- [ ] Implementar validación visual de conexiones
- [ ] Crear estilos para puertos válidos/inválidos

**Criterios de Aceptación:**
- [ ] Los puertos son visibles y claros
- [ ] Los tooltips muestran información útil
- [ ] La validación visual es inmediata
- [ ] Los estilos son consistentes

#### 9.5.2.2 Nodos específicos por tipo
**Objetivo:** Configurar cada tipo de nodo con sus puertos específicos

**Subtareas:**
- [ ] **StartNode**: Solo output port con datos iniciales configurables
- [ ] **ActionNode**: Input port + output port con transformaciones
- [ ] **ConditionNode**: Input port + 2 output ports (true/false)
- [ ] **EndNode**: Solo input port para datos finales
- [ ] Configurar esquemas de datos por defecto

**Criterios de Aceptación:**
- [ ] Cada nodo tiene los puertos correctos
- [ ] Los esquemas de datos son apropiados
- [ ] La configuración es intuitiva
- [ ] Los datos fluyen correctamente

#### 9.5.2.3 Visualización de datos
**Objetivo:** Mostrar información de datos en tiempo real

**Subtareas:**
- [ ] Implementar preview de datos en tooltips
- [ ] Mostrar campos disponibles en nodos
- [ ] Indicar transformaciones aplicadas
- [ ] Mostrar campos requeridos vs opcionales
- [ ] Implementar indicadores de estado de datos

**Criterios de Aceptación:**
- [ ] La información es clara y útil
- [ ] El rendimiento es bueno
- [ ] La información se actualiza en tiempo real
- [ ] La UX es intuitiva

---

### Tarea 9.5.3: Nodo de Condición como Rombo (Día 3)

#### 9.5.3.1 Rediseñar ConditionNode
**Objetivo:** Cambiar la forma y comportamiento del nodo de condición

**Subtareas:**
- [ ] Cambiar CSS de rectángulo a rombo
- [ ] Implementar una entrada en la parte superior
- [ ] Implementar dos salidas (true/false) en los lados
- [ ] Agregar indicadores visuales de condición
- [ ] Implementar estilos para estados válidos/inválidos

**Criterios de Aceptación:**
- [ ] La forma es claramente un rombo
- [ ] Los puertos están en posiciones lógicas
- [ ] Los indicadores visuales son claros
- [ ] Los estilos son consistentes

#### 9.5.3.2 Lógica de flujo de datos
**Objetivo:** Implementar la lógica de bifurcación de datos

**Subtareas:**
- [ ] Transmitir datos solo por la rama que cumple condición
- [ ] Implementar filtrado de datos por condición
- [ ] Validar que ambas ramas tienen destino
- [ ] Mostrar preview de datos filtrados
- [ ] Implementar lógica de evaluación de condiciones

**Criterios de Aceptación:**
- [ ] Los datos fluyen correctamente por las ramas
- [ ] El filtrado funciona según la condición
- [ ] La validación previene errores
- [ ] El preview es preciso

#### 9.5.3.3 Configuración de condiciones
**Objetivo:** Crear un editor intuitivo para configurar condiciones

**Subtareas:**
- [ ] Crear editor de condiciones con campos disponibles
- [ ] Implementar operadores lógicos (equals, not equals, greater than, etc.)
- [ ] Validar tipos de datos para operaciones
- [ ] Implementar preview de resultado de condición
- [ ] Crear sistema de condiciones complejas

**Criterios de Aceptación:**
- [ ] El editor es intuitivo
- [ ] Los operadores son apropiados
- [ ] La validación previene errores
- [ ] El preview es útil

---

### Tarea 9.5.4: Conexiones Direccionales con Datos (Día 4)

#### 9.5.4.1 Rediseñar edges con datos
**Objetivo:** Actualizar las conexiones para mostrar información de datos

**Subtareas:**
- [ ] Implementar flechas direccionales claras
- [ ] Mostrar campos de datos que fluyen
- [ ] Indicar transformaciones en la conexión
- [ ] Validar compatibilidad de tipos
- [ ] Implementar estilos para diferentes tipos de conexión

**Criterios de Aceptación:**
- [ ] Las flechas son claras y direccionales
- [ ] La información de datos es visible
- [ ] Las transformaciones se muestran
- [ ] La validación funciona

#### 9.5.4.2 Visualización de flujo
**Objetivo:** Crear visualizaciones atractivas del flujo de datos

**Subtareas:**
- [ ] Implementar tooltip con campos de datos
- [ ] Crear animación de flujo de datos
- [ ] Indicar estado de validación de conexión
- [ ] Mostrar warnings de conversión de tipos
- [ ] Implementar indicadores de rendimiento

**Criterios de Aceptación:**
- [ ] Las visualizaciones son atractivas
- [ ] La información es clara
- [ ] Las animaciones son suaves
- [ ] El rendimiento es bueno

#### 9.5.4.3 Validación de conexiones
**Objetivo:** Implementar validación robusta de conexiones

**Subtareas:**
- [ ] Prevenir conexiones incompatibles
- [ ] Validar que campos requeridos están disponibles
- [ ] Implementar sugerencias de mapeo automático
- [ ] Mostrar errores de validación en tiempo real
- [ ] Crear sistema de warnings informativos

**Criterios de Aceptación:**
- [ ] Las conexiones inválidas se previenen
- [ ] Los errores se muestran claramente
- [ ] Las sugerencias son útiles
- [ ] La validación es rápida

---

### Tarea 9.5.5: Panel de Configuración de Datos (Día 5)

#### 9.5.5.1 Data Configuration Panel
**Objetivo:** Crear un panel dedicado para configurar el flujo de datos

**Subtareas:**
- [ ] Crear `DataConfigurationPanel` component
- [ ] Implementar drag & drop para mapear campos
- [ ] Mostrar preview de transformaciones
- [ ] Validar configuraciones en tiempo real
- [ ] Integrar con el panel de propiedades existente

**Criterios de Aceptación:**
- [ ] El panel es intuitivo
- [ ] El drag & drop funciona bien
- [ ] El preview es preciso
- [ ] La validación es inmediata

#### 9.5.5.2 Field Mapping Interface
**Objetivo:** Crear una interfaz para mapear campos de entrada a salida

**Subtareas:**
- [ ] Implementar interfaz de mapeo visual
- [ ] Crear transformaciones básicas (rename, filter, transform)
- [ ] Implementar preview de datos resultantes
- [ ] Validar tipos y formatos
- [ ] Crear sistema de templates de mapeo

**Criterios de Aceptación:**
- [ ] La interfaz es clara
- [ ] Las transformaciones funcionan
- [ ] El preview es útil
- [ ] La validación es robusta

#### 9.5.5.3 Data Preview y Testing
**Objetivo:** Permitir testing del flujo de datos

**Subtareas:**
- [ ] Implementar preview con datos de ejemplo
- [ ] Crear testing de transformaciones con datos reales
- [ ] Validar performance de transformaciones
- [ ] Implementar debug de flujo de datos
- [ ] Crear sistema de logs de transformaciones

**Criterios de Aceptación:**
- [ ] El preview es útil
- [ ] El testing funciona
- [ ] La performance es aceptable
- [ ] El debug es informativo

---

### Tarea 9.5.6: Integración con Conectores (Día 5 - Continuación)

#### 9.5.6.1 Conectores con datos
**Objetivo:** Preparar los conectores para trabajar con el sistema de datos

**Subtareas:**
- [ ] Definir esquemas de datos para cada conector
- [ ] Implementar validación de configuraciones
- [ ] Crear mapeo automático de campos
- [ ] Documentar formatos de datos
- [ ] Crear templates de configuración

**Criterios de Aceptación:**
- [ ] Los esquemas están definidos
- [ ] La validación funciona
- [ ] El mapeo automático es útil
- [ ] La documentación es clara

#### 9.5.6.2 Importación de datos
**Objetivo:** Implementar importación desde fuentes externas

**Subtareas:**
- [ ] Crear sistema de importación de datos
- [ ] Validar formatos de datos importados
- [ ] Crear esquemas dinámicos basados en datos
- [ ] Manejar errores de importación
- [ ] Implementar preview de datos importados

**Criterios de Aceptación:**
- [ ] La importación funciona
- [ ] La validación es robusta
- [ ] Los esquemas se crean correctamente
- [ ] Los errores se manejan bien

#### 9.5.6.3 Exportación de datos
**Objetivo:** Implementar exportación a formatos estándar

**Subtareas:**
- [ ] Implementar exportación a JSON, CSV, XML
- [ ] Validar esquemas de salida
- [ ] Crear templates de exportación
- [ ] Manejar transformaciones de formato
- [ ] Implementar preview de exportación

**Criterios de Aceptación:**
- [ ] La exportación funciona
- [ ] Los formatos son estándar
- [ ] Los templates son útiles
- [ ] El preview es preciso

---

## ENTREGABLES FINALES

### ✅ Sistema de Flujo de Datos Completo
- [ ] Modelo de datos robusto y extensible
- [ ] Nodos con puertos de entrada/salida tipados
- [ ] Validación de tipos en tiempo real
- [ ] Visualización clara del flujo de datos

### ✅ Nodos de Condición como Rombos
- [ ] Forma de rombo implementada
- [ ] Una entrada y dos salidas
- [ ] Lógica de bifurcación de datos
- [ ] Editor de condiciones intuitivo

### ✅ Conexiones Direccionales
- [ ] Flechas con sentido de flujo claro
- [ ] Información de datos visible
- [ ] Validación de compatibilidad
- [ ] Animaciones de flujo

### ✅ Panel de Configuración
- [ ] Interfaz de mapeo de campos
- [ ] Transformaciones básicas
- [ ] Preview de datos
- [ ] Testing de transformaciones

### ✅ Integración con Conectores
- [ ] Esquemas de datos definidos
- [ ] Importación/exportación funcional
- [ ] Validación de configuraciones
- [ ] Templates de configuración

---

## CRITERIOS DE ÉXITO

### Métricas Técnicas
- [ ] **Performance:** <100ms para validación de tipos
- [ ] **Reliability:** 100% de validaciones funcionando
- [ ] **Usability:** <2 minutos para configurar flujo de datos básico
- [ ] **Quality:** 0 errores críticos en validación de datos

### Métricas de UX
- [ ] **Intuitividad:** Usuarios pueden mapear campos sin ayuda
- [ ] **Eficiencia:** <5 clicks para configurar transformación básica
- [ ] **Satisfacción:** Feedback positivo en testing
- [ ] **Claridad:** Información de datos siempre visible

### Métricas de Desarrollo
- [ ] **Cobertura:** >90% de código del sistema de datos testado
- [ ] **Documentación:** 100% de interfaces documentadas
- [ ] **Performance:** Validación en tiempo real sin lag
- [ ] **Maintainability:** Código limpio y bien estructurado

---

## RIESGOS Y MITIGACIONES

### Riesgos Técnicos
**Riesgo:** Complejidad del sistema de validación de tipos
**Mitigación:** Implementar validación incremental, empezar con tipos básicos

**Riesgo:** Performance de validación en tiempo real
**Mitigación:** Usar debouncing, optimizar algoritmos de validación

**Riesgo:** UX compleja para mapeo de campos
**Mitigación:** Prototipado temprano, testing con usuarios

### Riesgos de Timeline
**Riesgo:** Scope creep en transformaciones de datos
**Mitigación:** Priorizar transformaciones básicas, dejar avanzadas para futuros sprints

**Riesgo:** Integración compleja con conectores existentes
**Mitigación:** Diseñar interfaces compatibles, implementar gradualmente

### Riesgos de Calidad
**Riesgo:** Validación insuficiente de tipos
**Mitigación:** Testing exhaustivo, casos edge cubiertos

**Riesgo:** UX inconsistente entre nodos
**Mitigación:** Design system, componentes reutilizables

---

## PRÓXIMOS PASOS

### Post-Sprint 9.5
- [ ] **Sprint 10-11:** Conectores Esenciales con integración de datos
- [ ] **Sprint 12-13:** Motor de Ejecución con flujo de datos
- [ ] **Testing:** Validación completa del sistema de datos
- [ ] **Documentación:** Guías de usuario para flujo de datos

### Mejoras Futuras
- [ ] Transformaciones de datos avanzadas
- [ ] Validación de esquemas complejos
- [ ] Optimización de performance
- [ ] Integración con bases de datos externas

---

## CONCLUSIÓN

El Sprint 9.5 es crítico para la funcionalidad de workflow automation. Sin un sistema de flujo de datos robusto, los workflows serían meramente visuales sin capacidad de procesamiento real de datos.

La implementación de este sprint permitirá:
- **Workflows funcionales** con procesamiento real de datos
- **Validación en tiempo real** que previene errores
- **UX intuitiva** para configurar transformaciones
- **Base sólida** para conectores y motor de ejecución

**Próximo hito:** Sistema de flujo de datos completamente funcional al final del Sprint 9.5. 