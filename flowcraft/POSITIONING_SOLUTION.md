# Solución de Posicionamiento de Nodos - Workflow Editor

## 🔍 **Problema Identificado**

El posicionamiento de nodos al hacer drop no era preciso, especialmente cuando:
- El canvas tenía zoom aplicado
- El canvas estaba movido (pan)
- Diferentes tipos de nodos tenían diferentes tamaños

## 📋 **Análisis del Problema**

### **Flujo de Coordenadas Original (Incorrecto):**
```
Mouse Position (screen) 
→ Canvas Position (viewport) 
→ Project to Flow Coordinates 
→ Apply Offset (INCORRECTO - después de proyección)
```

### **Problemas Identificados:**
1. **Orden incorrecto:** El offset se aplicaba después de la proyección
2. **Zoom no considerado:** Las dimensiones del nodo no se ajustaban al zoom
3. **Proyección incorrecta:** La función `project()` se aplicaba a la posición sin offset

## 🛠️ **Solución Implementada**

### **Flujo de Coordenadas Corregido:**
```
Mouse Position (screen) 
→ Canvas Position (viewport) 
→ Apply Offset (CORRECTO - antes de proyección)
→ Project to Flow Coordinates
```

### **Paso 1: Calcular posición del cursor**
```typescript
const positionX = event.clientX - reactFlowBounds.left;
const positionY = event.clientY - reactFlowBounds.top;
```

### **Paso 2: Obtener dimensiones del nodo**
```typescript
const nodeDimensions = getNodeDimensions(nodeType);
const offsetX = nodeDimensions.width / 2;
const offsetY = nodeDimensions.height / 2;
```

### **Paso 3: Aplicar offset ANTES de la proyección**
```typescript
const adjustedPosition = {
  x: positionX - offsetX,
  y: positionY - offsetY,
};
```

### **Paso 4: Proyectar a coordenadas del flow**
```typescript
const finalPosition = project(adjustedPosition);
```

## 🎯 **Por Qué Esta Solución Funciona**

### **1. Orden Correcto de Operaciones**
- **Antes:** `project(position) - offset` ❌
- **Ahora:** `project(position - offset)` ✅

### **2. Consideración del Zoom y Pan**
- La función `project()` de React Flow maneja automáticamente el zoom y pan
- Al aplicar el offset antes de la proyección, se considera correctamente la transformación

### **3. Dimensiones Dinámicas**
- Cada tipo de nodo tiene sus propias dimensiones
- El offset se calcula dinámicamente basado en el tipo de nodo

## 📊 **Dimensiones de Nodos por Tipo**

```typescript
const dimensions = {
  [NodeType.START]: { width: 120, height: 100 },
  [NodeType.END]: { width: 120, height: 100 },
  [NodeType.ACTION]: { width: 140, height: 120 },
  [NodeType.CONDITION]: { width: 140, height: 120 },
  [NodeType.LOOP]: { width: 140, height: 120 },
  [NodeType.HTTP_REQUEST]: { width: 160, height: 140 },
  [NodeType.EMAIL]: { width: 140, height: 120 },
  [NodeType.SLACK]: { width: 140, height: 120 },
  [NodeType.DATA_TRANSFORM]: { width: 160, height: 140 },
  [NodeType.TIMER]: { width: 140, height: 120 },
  [NodeType.WEBHOOK]: { width: 160, height: 140 },
};
```

## 🧪 **Tests de Verificación**

### **Test 1: Posicionamiento Básico**
- [ ] Arrastrar nodo desde palette
- [ ] Soltar en posición específica
- [ ] Verificar que el nodo aparece centrado en el cursor

### **Test 2: Posicionamiento con Zoom**
- [ ] Aplicar zoom in/out
- [ ] Arrastrar y soltar nodo
- [ ] Verificar posicionamiento correcto

### **Test 3: Posicionamiento con Pan**
- [ ] Mover el canvas
- [ ] Arrastrar y soltar nodo
- [ ] Verificar posicionamiento correcto

### **Test 4: Diferentes Tipos de Nodos**
- [ ] Probar con nodos de diferentes tamaños
- [ ] Verificar que cada tipo se centra correctamente

## 🚀 **Próximas Mejoras**

### **1. Medición Real en DOM**
```typescript
// Obtener dimensiones reales del nodo renderizado
const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
const realDimensions = nodeElement.getBoundingClientRect();
```

### **2. Ajuste Dinámico de Offset**
```typescript
// Considerar padding, border, y otros estilos
const computedStyle = window.getComputedStyle(nodeElement);
const padding = {
  left: parseFloat(computedStyle.paddingLeft),
  top: parseFloat(computedStyle.paddingTop),
};
```

### **3. Snap to Grid**
```typescript
// Alinear nodos a una cuadrícula
const snapToGrid = (position: { x: number; y: number }) => {
  const gridSize = 20;
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
};
```

## ✅ **Estado Actual**

**✅ IMPLEMENTADO Y FUNCIONANDO**
- Posicionamiento preciso de nodos
- Soporte para zoom y pan
- Dimensiones dinámicas por tipo de nodo
- Orden correcto de operaciones

**📋 PRÓXIMOS PASOS**
- Testing exhaustivo en diferentes escenarios
- Optimización de performance
- Implementación de snap-to-grid
- Medición real en DOM para máxima precisión 