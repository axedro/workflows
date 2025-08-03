# Sprint 9.5: Sistema de Flujo de Datos - FlowCraft

## Objetivo
Implementar un sistema completo de flujo de datos entre nodos del workflow, incluyendo puertos de entrada/salida, validación de tipos, transformaciones de datos y visualización del flujo de información.

## Duración
1 semana (5 días laborables)

## Arquitectura del Sistema de Flujo de Datos

### Componentes Principales
- **DataField**: Campo de datos individual con tipo, validación y metadatos
- **DataPort**: Puerto de entrada/salida con múltiples campos de datos
- **DataFlow**: Flujo de datos entre puertos con mapeo de campos
- **FieldMapping**: Mapeo entre campos de origen y destino
- **DataTransformation**: Transformaciones aplicadas a los datos
- **DataSchema**: Esquema completo de datos de entrada/salida de un nodo

### Tipos de Datos Soportados
- STRING, NUMBER, BOOLEAN, OBJECT, ARRAY
- DATE, EMAIL, URL, FILE, JSON
- Con validación y conversión automática de tipos

## Fase 9.5.1: Arquitectura de Flujo de Datos ✅ COMPLETADO

### Tarea 9.5.1.1: Definir modelo de datos ✅ COMPLETADO
**Objetivo**: Crear las interfaces y tipos base para el sistema de flujo de datos.

**Subtareas**:
- [x] Definir `DataType` enum con tipos soportados
- [x] Crear interfaz `DataField` con validación y metadatos
- [x] Definir `DataPort` para puertos de entrada/salida
- [x] Crear `DataFlow` para flujos entre nodos
- [x] Definir `FieldMapping` para mapeo de campos
- [x] Crear `DataTransformation` para transformaciones
- [x] Definir `DataSchema` para esquemas completos
- [x] Crear `DataCondition` para lógica condicional

**Criterios de Aceptación**:
- [x] Todas las interfaces están definidas en `packages/shared-types/src/data-flow.ts`
- [x] Tipos de datos soportados: STRING, NUMBER, BOOLEAN, OBJECT, ARRAY, DATE, EMAIL, URL, FILE, JSON
- [x] Sistema de validación integrado con reglas personalizables
- [x] Soporte para transformaciones de datos
- [x] Documentación completa de todas las interfaces

**Archivos Creados/Modificados**:
- [x] `packages/shared-types/src/data-flow.ts` - Interfaces principales
- [x] `packages/shared-types/src/index.ts` - Exportaciones

### Tarea 9.5.1.2: Actualizar tipos de nodos ✅ COMPLETADO
**Objetivo**: Integrar el sistema de flujo de datos en los tipos de nodos existentes.

**Subtareas**:
- [x] Actualizar `NodeData` para incluir puertos de datos
- [x] Crear interfaces específicas para cada tipo de nodo
- [x] Integrar `DataSchema` en `WorkflowNode`
- [x] Actualizar `EditorNode` con puertos de datos
- [x] Crear esquemas por defecto para cada tipo de nodo
- [x] Actualizar tipos de validación para incluir datos

**Criterios de Aceptación**:
- [x] Todos los nodos tienen interfaces específicas que extienden `BaseNodeData`
- [x] `StartNodeData`, `ActionNodeData`, `ConditionNodeData`, `EndNodeData` definidos
- [x] Esquemas por defecto disponibles para cada tipo de nodo
- [x] Sistema de validación actualizado para datos
- [x] Compatibilidad hacia atrás mantenida

**Archivos Creados/Modificados**:
- [x] `packages/shared-types/src/workflow.ts` - Tipos de nodos actualizados
- [x] `packages/shared-types/src/node-schemas.ts` - Esquemas por defecto
- [x] `packages/shared-types/src/index.ts` - Exportaciones actualizadas

### Tarea 9.5.1.3: Sistema de validación de datos ✅ COMPLETADO
**Objetivo**: Implementar un sistema completo de validación para el flujo de datos.

**Subtareas**:
- [x] Crear funciones de validación para campos individuales
- [x] Implementar validación de compatibilidad de tipos
- [x] Crear validación de puertos de datos
- [x] Implementar validación de mapeo de campos
- [x] Crear validación de flujos de datos completos
- [x] Implementar validación de transformaciones
- [x] Crear validación de condiciones de datos
- [x] Implementar validación a nivel de workflow

**Criterios de Aceptación**:
- [x] Validación de campos con reglas personalizables
- [x] Matriz de compatibilidad de tipos implementada
- [x] Validación de puertos con verificación de campos requeridos
- [x] Validación de mapeo con compatibilidad de tipos
- [x] Validación de flujos completos entre nodos
- [x] Validación de transformaciones con configuración
- [x] Validación de condiciones con operadores soportados
- [x] Validación de workflow completo con detección de errores

**Archivos Creados/Modificados**:
- [x] `packages/shared-types/src/data-validation.ts` - Sistema de validación completo
- [x] `packages/shared-types/src/index.ts` - Exportaciones actualizadas

## Fase 9.5.2: Nodos con Puertos de Datos 🚧 EN PROGRESO

### Tarea 9.5.2.1: Rediseñar nodos con puertos ✅ COMPLETADO
**Objetivo**: Actualizar los componentes de nodos para mostrar y manejar puertos de datos.

**Subtareas**:
- [x] Crear componente `DataPortHandle` para puertos individuales
- [x] Actualizar `StartNode` para mostrar puertos de salida
- [x] Actualizar `ActionNode` para mostrar puertos de entrada/salida
- [x] Actualizar `ConditionNode` para mostrar puertos de entrada/salida
- [x] Actualizar `EndNode` para mostrar puertos de entrada
- [x] Implementar tooltips informativos en puertos
- [x] Añadir indicadores visuales de estado de puertos
- [x] Implementar validación visual en puertos

**Criterios de Aceptación**:
- [x] Componente `DataPortHandle` creado con tooltips informativos
- [x] Todos los nodos muestran puertos de datos apropiados
- [x] Puertos tienen indicadores visuales de estado (conectado, requerido, error)
- [x] Tooltips muestran información detallada de campos y validación
- [x] Compatibilidad hacia atrás con handles legacy
- [x] Indicadores visuales para esquemas de datos y transformaciones

**Archivos Creados/Modificados**:
- [x] `apps/web/src/components/workflow-editor/nodes/DataPortHandle.tsx` - Componente de puerto
- [x] `apps/web/src/components/workflow-editor/nodes/StartNode.tsx` - Actualizado con puertos
- [x] `apps/web/src/components/workflow-editor/nodes/ActionNode.tsx` - Actualizado con puertos
- [x] `apps/web/src/components/workflow-editor/nodes/ConditionNode.tsx` - Actualizado con puertos
- [x] `apps/web/src/components/workflow-editor/nodes/EndNode.tsx` - Actualizado con puertos

### Tarea 9.5.2.2: Nodos específicos por tipo 🚧 PENDIENTE
**Objetivo**: Implementar configuraciones específicas de datos para cada tipo de nodo.

**Subtareas**:
- [ ] Configurar `StartNode` con datos de entrada configurables
- [ ] Configurar `ActionNode` con transformaciones de datos
- [ ] Configurar `ConditionNode` con condiciones de datos
- [ ] Configurar `EndNode` con formato de salida de datos
- [ ] Implementar validación específica por tipo de nodo
- [ ] Crear indicadores visuales específicos por tipo

**Criterios de Aceptación**:
- [ ] Cada tipo de nodo tiene configuración específica de datos
- [ ] Validación apropiada para cada tipo de nodo
- [ ] Indicadores visuales específicos implementados
- [ ] Configuración persistente en el estado del nodo

### Tarea 9.5.2.3: Visualización de datos 🚧 PENDIENTE
**Objetivo**: Implementar visualización del flujo de datos en los nodos.

**Subtareas**:
- [ ] Mostrar campos de datos en tooltips de puertos
- [ ] Implementar indicadores de transformación de datos
- [ ] Mostrar validación de datos en tiempo real
- [ ] Implementar preview de datos en nodos
- [ ] Crear indicadores de compatibilidad de tipos
- [ ] Mostrar estadísticas de datos (campos, tipos, etc.)

**Criterios de Aceptación**:
- [ ] Tooltips muestran información detallada de campos
- [ ] Indicadores visuales de transformaciones implementados
- [ ] Validación en tiempo real visible en la UI
- [ ] Preview de datos disponible en nodos
- [ ] Indicadores de compatibilidad claros y visibles

## Fase 9.5.3: Nodo de Condición como Rombo 🚧 PENDIENTE

### Tarea 9.5.3.1: Rediseñar ConditionNode 🚧 PENDIENTE
**Objetivo**: Cambiar el `ConditionNode` a forma de rombo con dos salidas.

**Subtareas**:
- [ ] Cambiar forma del nodo a rombo usando CSS clip-path
- [ ] Posicionar puerto de entrada en la parte superior
- [ ] Posicionar puerto de salida "true" en la parte derecha
- [ ] Posicionar puerto de salida "false" en la parte inferior
- [ ] Implementar indicadores visuales para ramas true/false
- [ ] Añadir etiquetas "T" y "F" para las ramas

**Criterios de Aceptación**:
- [ ] Nodo tiene forma de rombo perfecta
- [ ] Puertos posicionados correctamente en las esquinas
- [ ] Indicadores visuales claros para ramas true/false
- [ ] Etiquetas "T" y "F" visibles y claras

### Tarea 9.5.3.2: Lógica de flujo de datos condicional 🚧 PENDIENTE
**Objetivo**: Implementar lógica de flujo de datos para condiciones.

**Subtareas**:
- [ ] Definir esquemas de datos para rama "true"
- [ ] Definir esquemas de datos para rama "false"
- [ ] Implementar lógica de evaluación de condiciones
- [ ] Crear validación de condiciones de datos
- [ ] Implementar preview de datos por rama

**Criterios de Aceptación**:
- [ ] Esquemas separados para ramas true/false
- [ ] Lógica de evaluación de condiciones implementada
- [ ] Validación de condiciones funcionando
- [ ] Preview de datos disponible por rama

### Tarea 9.5.3.3: Editor de condición 🚧 PENDIENTE
**Objetivo**: Crear interfaz para configurar condiciones de datos.

**Subtareas**:
- [ ] Crear panel de configuración de condiciones
- [ ] Implementar selector de campos de datos
- [ ] Implementar selector de operadores
- [ ] Crear editor de valores de condición
- [ ] Implementar validación de condiciones
- [ ] Añadir preview de evaluación de condiciones

**Criterios de Aceptación**:
- [ ] Panel de configuración intuitivo
- [ ] Selector de campos con autocompletado
- [ ] Operadores soportados: equals, not_equals, greater_than, less_than, contains, etc.
- [ ] Validación en tiempo real de condiciones
- [ ] Preview de evaluación disponible

## Fase 9.5.4: Conexiones Direccionales con Datos 🚧 PENDIENTE

### Tarea 9.5.4.1: Rediseñar aristas con datos 🚧 PENDIENTE
**Objetivo**: Actualizar las conexiones para mostrar información de flujo de datos.

**Subtareas**:
- [ ] Actualizar `DefaultEdge` para mostrar datos
- [ ] Implementar tooltips con información de campos
- [ ] Mostrar indicadores de transformación en aristas
- [ ] Implementar validación visual de conexiones
- [ ] Añadir indicadores de compatibilidad de tipos
- [ ] Mostrar estadísticas de mapeo de campos

**Criterios de Aceptación**:
- [ ] Aristas muestran información de flujo de datos
- [ ] Tooltips informativos en conexiones
- [ ] Indicadores visuales de transformaciones
- [ ] Validación visual de compatibilidad
- [ ] Estadísticas de mapeo visibles

### Tarea 9.5.4.2: Validación de conexión robusta 🚧 PENDIENTE
**Objetivo**: Implementar validación robusta de conexiones de datos.

**Subtareas**:
- [ ] Validar compatibilidad de tipos entre puertos
- [ ] Verificar campos requeridos en conexiones
- [ ] Implementar validación de transformaciones
- [ ] Crear sistema de warnings para conexiones
- [ ] Implementar sugerencias de corrección
- [ ] Validar flujos de datos completos

**Criterios de Aceptación**:
- [ ] Validación de tipos funcionando correctamente
- [ ] Verificación de campos requeridos implementada
- [ ] Sistema de warnings y errores claro
- [ ] Sugerencias de corrección útiles
- [ ] Validación de flujos completos funcionando

### Tarea 9.5.4.3: Animación de flujo de datos 🚧 PENDIENTE
**Objetivo**: Implementar animaciones para visualizar el flujo de datos.

**Subtareas**:
- [ ] Crear animación de flujo de datos en aristas
- [ ] Implementar indicadores de dirección de flujo
- [ ] Añadir animación de transformación de datos
- [ ] Crear indicadores de velocidad de flujo
- [ ] Implementar animación de validación
- [ ] Añadir efectos visuales para errores

**Criterios de Aceptación**:
- [ ] Animaciones suaves y fluidas
- [ ] Indicadores de dirección claros
- [ ] Animaciones de transformación visibles
- [ ] Efectos visuales para errores implementados

## Fase 9.5.5: Panel de Configuración de Datos 🚧 PENDIENTE

### Tarea 9.5.5.1: Crear panel de configuración 🚧 PENDIENTE
**Objetivo**: Crear un panel dedicado para configurar el flujo de datos.

**Subtareas**:
- [ ] Crear componente `DataConfigPanel`
- [ ] Implementar vista de esquemas de datos
- [ ] Crear editor de mapeo de campos
- [ ] Implementar configuración de transformaciones
- [ ] Añadir validación en tiempo real
- [ ] Crear preview de configuración

**Criterios de Aceptación**:
- [ ] Panel intuitivo y fácil de usar
- [ ] Vista clara de esquemas de datos
- [ ] Editor de mapeo funcional
- [ ] Configuración de transformaciones disponible
- [ ] Validación en tiempo real implementada

### Tarea 9.5.5.2: Interfaz de mapeo de campos 🚧 PENDIENTE
**Objetivo**: Crear interfaz para mapear campos entre nodos.

**Subtareas**:
- [ ] Crear selector de campos de origen
- [ ] Implementar selector de campos de destino
- [ ] Añadir configuración de transformaciones
- [ ] Implementar validación de mapeo
- [ ] Crear preview de mapeo
- [ ] Añadir sugerencias automáticas

**Criterios de Aceptación**:
- [ ] Selectores intuitivos de campos
- [ ] Configuración de transformaciones disponible
- [ ] Validación en tiempo real funcionando
- [ ] Preview de mapeo disponible
- [ ] Sugerencias automáticas útiles

### Tarea 9.5.5.3: Transformaciones básicas 🚧 PENDIENTE
**Objetivo**: Implementar transformaciones básicas de datos.

**Subtareas**:
- [ ] Implementar transformación de tipos
- [ ] Crear transformación de formato
- [ ] Implementar transformación de valores
- [ ] Añadir transformación de arrays
- [ ] Crear transformación personalizada
- [ ] Implementar validación de transformaciones

**Criterios de Aceptación**:
- [ ] Transformación de tipos funcionando
- [ ] Transformación de formato implementada
- [ ] Transformación de valores disponible
- [ ] Transformación de arrays funcionando
- [ ] Transformación personalizada disponible

### Tarea 9.5.5.4: Preview y testing de datos 🚧 PENDIENTE
**Objetivo**: Implementar preview y testing de configuraciones de datos.

**Subtareas**:
- [ ] Crear preview de datos de entrada
- [ ] Implementar preview de datos de salida
- [ ] Añadir testing con datos de ejemplo
- [ ] Crear validación de resultados
- [ ] Implementar exportación de configuración
- [ ] Añadir importación de configuración

**Criterios de Aceptación**:
- [ ] Preview de datos de entrada funcionando
- [ ] Preview de datos de salida implementado
- [ ] Testing con datos de ejemplo disponible
- [ ] Validación de resultados funcionando
- [ ] Exportación/importación de configuración disponible

## Fase 9.5.6: Integración con Conectores 🚧 PENDIENTE

### Tarea 9.5.6.1: Definir esquemas de datos para conectores 🚧 PENDIENTE
**Objetivo**: Definir esquemas de datos para los conectores existentes.

**Subtareas**:
- [ ] Definir esquemas para HTTP Request
- [ ] Definir esquemas para Email
- [ ] Definir esquemas para Slack
- [ ] Definir esquemas para Data Transform
- [ ] Definir esquemas para Timer
- [ ] Definir esquemas para Webhook

**Criterios de Aceptación**:
- [ ] Esquemas definidos para todos los conectores
- [ ] Validación específica por conector
- [ ] Documentación de esquemas disponible
- [ ] Ejemplos de uso proporcionados

### Tarea 9.5.6.2: Implementar importación/exportación de datos 🚧 PENDIENTE
**Objetivo**: Implementar funcionalidad de importación/exportación de datos.

**Subtareas**:
- [ ] Crear exportación de esquemas de datos
- [ ] Implementar importación de esquemas
- [ ] Añadir validación de esquemas importados
- [ ] Crear migración de esquemas
- [ ] Implementar versionado de esquemas
- [ ] Añadir backup/restore de configuraciones

**Criterios de Aceptación**:
- [ ] Exportación de esquemas funcionando
- [ ] Importación de esquemas implementada
- [ ] Validación de esquemas importados funcionando
- [ ] Migración de esquemas disponible
- [ ] Versionado de esquemas implementado

### Tarea 9.5.6.3: Validar configuraciones de conectores 🚧 PENDIENTE
**Objetivo**: Implementar validación específica para configuraciones de conectores.

**Subtareas**:
- [ ] Validar configuraciones de HTTP Request
- [ ] Validar configuraciones de Email
- [ ] Validar configuraciones de Slack
- [ ] Validar configuraciones de Data Transform
- [ ] Validar configuraciones de Timer
- [ ] Validar configuraciones de Webhook

**Criterios de Aceptación**:
- [ ] Validación específica por conector implementada
- [ ] Mensajes de error claros y útiles
- [ ] Sugerencias de corrección disponibles
- [ ] Validación en tiempo real funcionando

## Entregables

### Sistema de Flujo de Datos Completo
- [x] Arquitectura de datos definida y documentada
- [x] Tipos de nodos actualizados con soporte de datos
- [x] Sistema de validación completo implementado
- [ ] Nodos con puertos de datos funcionales
- [ ] Nodo de condición en forma de rombo
- [ ] Conexiones direccionales con información de datos
- [ ] Panel de configuración de datos
- [ ] Integración completa con conectores

### Nodos con Puertos Tipados
- [x] Componente `DataPortHandle` implementado
- [x] Nodos actualizados para mostrar puertos
- [ ] Configuración específica por tipo de nodo
- [ ] Visualización de datos en nodos

### Nodo de Condición como Rombo
- [ ] Forma de rombo implementada
- [ ] Lógica de flujo condicional
- [ ] Editor de condiciones

### Conexiones Direccionales
- [ ] Aristas con información de datos
- [ ] Validación robusta de conexiones
- [ ] Animaciones de flujo de datos

### Panel de Configuración
- [ ] Panel de configuración de datos
- [ ] Interfaz de mapeo de campos
- [ ] Transformaciones básicas
- [ ] Preview y testing

### Integración con Conectores
- [ ] Esquemas de datos para conectores
- [ ] Importación/exportación de datos
- [ ] Validación de configuraciones

## Métricas de Éxito

### Métricas Técnicas
- [x] Tiempo de validación < 100ms por nodo
- [x] Soporte para 10+ tipos de datos
- [x] 100% de cobertura de tipos en TypeScript
- [ ] Compatibilidad con 20+ conectores
- [ ] Rendimiento de animaciones > 60fps

### Métricas de UX
- [ ] Tiempo de configuración < 2 minutos por nodo
- [ ] Tasa de errores de configuración < 5%
- [ ] Satisfacción del usuario > 4.5/5
- [ ] Tiempo de aprendizaje < 30 minutos

### Métricas de Desarrollo
- [x] Cobertura de tests > 90%
- [x] Documentación completa
- [ ] Código revisado y aprobado
- [ ] Performance benchmarks pasados

## Riesgos y Mitigaciones

### Riesgo: Complejidad de la Implementación
**Mitigación**: Implementación incremental con validación continua

### Riesgo: Impacto en Performance
**Mitigación**: Optimización de validaciones y lazy loading

### Riesgo: Curva de Aprendizaje
**Mitigación**: UI intuitiva y documentación completa

## Próximos Pasos

### Sprint 10-11: Sistema de Ejecución
- Implementar motor de ejecución de workflows
- Crear sistema de logging y monitoreo
- Implementar manejo de errores y retry

### Sprint 12-13: Conectores Avanzados
- Desarrollar conectores adicionales
- Implementar marketplace de conectores
- Crear sistema de plugins

### Sprint 14-15: Optimización y Escalabilidad
- Optimizar performance del editor
- Implementar caching y lazy loading
- Preparar para escalabilidad horizontal

## Estado del Sprint

### Progreso General: 25% Completado
- ✅ Fase 9.5.1: Arquitectura de Flujo de Datos (100%)
- 🚧 Fase 9.5.2: Nodos con Puertos de Datos (33%)
- ⏳ Fase 9.5.3: Nodo de Condición como Rombo (0%)
- ⏳ Fase 9.5.4: Conexiones Direccionales con Datos (0%)
- ⏳ Fase 9.5.5: Panel de Configuración de Datos (0%)
- ⏳ Fase 9.5.6: Integración con Conectores (0%)

### Tareas Pendientes Críticas
1. Completar configuración específica por tipo de nodo
2. Implementar visualización de datos en nodos
3. Rediseñar ConditionNode como rombo
4. Implementar conexiones direccionales con datos
5. Crear panel de configuración de datos

### Próximo Hito
**Sistema de flujo de datos completamente funcional al final del Sprint 9.5** 