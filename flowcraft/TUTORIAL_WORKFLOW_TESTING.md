# 🎯 Tutorial: Testing FlowCraft Workflow Editor - Sprint 9.5

## 📋 Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Workflow 1: Flujo Básico](#workflow-1-flujo-básico)
3. [Workflow 2: Condiciones y Transformaciones](#workflow-2-condiciones-y-transformaciones)
4. [Workflow 3: Conectores HTTP y Email](#workflow-3-conectores-http-y-email)
5. [Workflow 4: Sistema Complejo de Notificaciones](#workflow-4-sistema-complejo-de-notificaciones)
6. [Workflow 5: Pipeline de Datos Avanzado](#workflow-5-pipeline-de-datos-avanzado)
7. [Testing de Validaciones](#testing-de-validaciones)
8. [Testing de Importación/Exportación](#testing-de-importaciónexportación)
9. [Testing de Esquemas Dinámicos](#testing-de-esquemas-dinámicos)

---

## 🚀 Configuración Inicial

### 1. Iniciar el Servidor de Desarrollo
```bash
cd flowcraft
./scripts/start-servers.sh
```

### 2. Acceder a la Aplicación
- Abrir navegador en: `http://localhost:5173`
- Iniciar sesión o registrarse
- Ir al Dashboard

### 3. Crear Nuevo Workflow
- Click en "Create New Workflow"
- Nombre: "Tutorial Workflow"
- Descripción: "Workflow para testing de funcionalidades"

---

## 🔗 Workflow 1: Flujo Básico

### Objetivo
Probar la funcionalidad básica de nodos, conexiones y flujo de datos.

### Pasos

#### 1. Crear Nodos Básicos
1. **Start Node**
   - Arrastrar desde la paleta de nodos
   - Posicionar en la parte superior izquierda
   - Verificar que tiene un puerto de salida (derecha)

2. **Action Node**
   - Arrastrar desde la paleta
   - Posicionar a la derecha del Start Node
   - Verificar que tiene puertos de entrada (izquierda) y salida (derecha)

3. **End Node**
   - Arrastrar desde la paleta
   - Posicionar a la derecha del Action Node
   - Verificar que tiene un puerto de entrada (izquierda)

#### 2. Crear Conexiones
1. **Start → Action**
   - Click en el puerto de salida del Start Node
   - Arrastrar hasta el puerto de entrada del Action Node
   - Verificar que se crea una conexión con animación de puntos verdes

2. **Action → End**
   - Click en el puerto de salida del Action Node
   - Arrastrar hasta el puerto de entrada del End Node
   - Verificar la conexión

#### 3. Configurar Action Node
1. **Seleccionar Action Node**
   - Click en el Action Node
   - Verificar que aparece el panel de propiedades

2. **Verificar Data Schema**
   - En el panel, buscar la sección "Data Schema"
   - Verificar que se muestran los campos de entrada (📥 Input Fields)
   - Verificar que se muestran los campos de salida (📤 Output Fields)
   - Los campos deberían mostrar tipos de datos (STRING, NUMBER, etc.)
   - Los campos requeridos deberían estar marcados en rojo

3. **Configurar Datos**
   - En la sección "Basic Properties", configurar Label y Description
   - En la sección "Node Configuration", configurar los campos específicos del nodo
   - **Verificar el botón Save**: Debería mostrar "Unsaved changes" cuando hagas cambios
   - **Probar el guardado**: Click en "Save" y verificar que cambia a "Saved!"

#### 4. Testing de Validación
1. **Probar Auto-conexión**
   - Intentar conectar un nodo consigo mismo
   - Debería mostrar error de validación

2. **Probar Conexión Duplicada**
   - Intentar crear otra conexión entre los mismos nodos
   - Debería mostrar error de validación

### Resultado Esperado
- Workflow con 3 nodos conectados
- Conexiones con animaciones de flujo de datos
- Panel de propiedades funcionando
- Validaciones de conexión activas

---

## 🔄 Workflow 2: Condiciones y Transformaciones

### Objetivo
Probar el nodo de condición (rombo) y el sistema de transformaciones de datos.

### Pasos

#### 1. Crear Workflow con Condición
1. **Start Node**
   - Posicionar en la parte superior

2. **Condition Node (Rombo)**
   - Arrastrar desde la paleta
   - Posicionar debajo del Start Node
   - Verificar que tiene forma de rombo
   - Verificar que tiene 3 puertos: entrada (arriba), salida True (derecha), salida False (abajo)

3. **Action Node (True Branch)**
   - Posicionar a la derecha del Condition Node
   - Conectar desde el puerto True del Condition

4. **Action Node (False Branch)**
   - Posicionar abajo del Condition Node
   - Conectar desde el puerto False del Condition

5. **End Node**
   - Posicionar a la derecha de ambos Action Nodes
   - Conectar desde ambos Action Nodes

#### 2. Configurar Condition Node
1. **Seleccionar Condition Node**
   - Click en el nodo rombo
   - Verificar que aparece el editor de condiciones

2. **Añadir Condición**
   - Click en "Add Condition"
   - Configurar:
     - Field: "data.status" (nota: usar data.status, no solo status)
     - Operator: "equals"
     - Value: "active"
   - Verificar que aparece en la lista de condiciones

3. **Añadir Segunda Condición**
   - Click en "Add Condition"
   - Configurar:
     - Field: "data.count" (nota: usar data.count, no solo count)
     - Operator: "greater_than"
     - Value: "10"
   - Verificar que ambas condiciones aparecen

4. **Testing de Preview**
   - En la sección "Evaluation Preview"
   - Verificar que se muestran datos de ejemplo
   - Verificar que se evalúa correctamente

**Nota Importante**: Para acceder a campos anidados en el objeto `data`, usar la notación de punto:
- `data.status` para acceder a `{ data: { status: "active" } }`
- `data.count` para acceder a `{ data: { count: 15 } }`
- `data.user.name` para acceder a `{ data: { user: { name: "John" } } }`

#### 3. Configurar Data Flow
1. **Seleccionar Conexión Start → Condition**
   - Click en la conexión
   - Verificar que aparece el panel de configuración de datos

2. **Configurar Field Mapping**
   - Ir a la pestaña "Field Mapping"
   - Click en "Add Mapping"
   - Mapear: source "data.status" → target "status"
   - Mapear: source "data.count" → target "count"

3. **Añadir Transformación**
   - Ir a la pestaña "Transformations"
   - Click en "Add Transformation"
   - Tipo: "TRANSFORM"
   - Field: "status"
   - Expression: "toUpperCase"
   - Verificar que se aplica la transformación

4. **Testing de Preview**
   - Ir a la pestaña "Preview"
   - Verificar que se muestran datos de entrada y salida
   - Verificar que las transformaciones se aplican correctamente

### Resultado Esperado
- Workflow con nodo de condición en forma de rombo
- Editor de condiciones funcionando
- Configuración de flujo de datos en conexiones
- Preview de datos funcionando

---

## 🌐 Workflow 3: Conectores HTTP y Email

### Objetivo
Probar los conectores HTTP Request y Email con validaciones específicas.

### Pasos

#### 1. Crear Workflow con Conectores
1. **Start Node**
   - Posicionar en la parte superior

2. **HTTP Request Node**
   - Arrastrar desde la paleta
   - Posicionar debajo del Start Node
   - Conectar desde Start Node

3. **Condition Node**
   - Posicionar debajo del HTTP Request Node
   - Conectar desde HTTP Request Node

4. **Email Node (True Branch)**
   - Posicionar a la derecha del Condition Node
   - Conectar desde puerto True

5. **End Node**
   - Posicionar debajo del Email Node
   - Conectar desde Email Node

#### 2. Configurar HTTP Request Node
1. **Seleccionar HTTP Request Node**
   - Click en el nodo
   - Verificar que aparece el panel de propiedades

2. **Configurar Campos**
   - URL: "https://jsonplaceholder.typicode.com/posts/1"
   - Method: "GET"
   - Headers: `{"Content-Type": "application/json"}`
   - Verificar que no hay errores de validación

3. **Testing de Validación**
   - Cambiar URL a "invalid-url"
   - Verificar que aparece error de validación
   - Cambiar Method a "INVALID"
   - Verificar que aparece error de validación
   - Restaurar valores válidos

#### 3. Configurar Condition Node
1. **Seleccionar Condition Node**
   - Añadir condición:
     - Field: "responseStatus"
     - Operator: "equals"
     - Value: "200"

#### 4. Configurar Email Node
1. **Seleccionar Email Node**
   - Configurar campos:
     - To: `["admin@example.com"]`
     - Subject: "HTTP Request Successful"
     - Email Body: "The API request returned status 200"
   - Verificar validación de email

2. **Testing de Validación**
   - Cambiar To a `["invalid-email"]`
   - Verificar que aparece error de validación
   - Dejar Subject vacío
   - Verificar que aparece error de validación
   - Restaurar valores válidos

#### 5. Configurar Data Flow
1. **Conexión Start → HTTP Request**
   - Configurar mapeo de datos básico

2. **Conexión HTTP Request → Condition**
   - Mapear: source "responseStatus" → target "responseStatus"
   - Mapear: source "responseData" → target "data"

3. **Conexión Condition → Email**
   - Mapear datos del response al email

### Resultado Esperado
- Workflow con conectores HTTP y Email
- Validaciones específicas funcionando
- Mensajes de error claros
- Configuración de flujo de datos

---

## 📧 Workflow 4: Sistema Complejo de Notificaciones

### Objetivo
Probar un workflow complejo con múltiples conectores y lógica condicional.

### Pasos

#### 1. Crear Workflow Complejo
```
Start → Timer → HTTP Request → Condition → [True: Email, False: Slack] → End
```

#### 2. Configurar Timer Node
1. **Seleccionar Timer Node**
   - Duration: 5000 (5 segundos)
   - Schedule: "0 */6 * * *" (cada 6 horas)
   - Verificar validación de cron expression

#### 3. Configurar HTTP Request Node
1. **Configurar para API de usuarios**
   - URL: "https://jsonplaceholder.typicode.com/users"
   - Method: "GET"
   - Verificar respuesta

#### 4. Configurar Condition Node
1. **Condición compleja**
   - Field: "responseData.length"
   - Operator: "greater_than"
   - Value: "5"
   - Añadir segunda condición:
     - Field: "responseStatus"
     - Operator: "equals"
     - Value: "200"

#### 5. Configurar Email Node (True Branch)
1. **Email de éxito**
   - To: `["admin@example.com", "manager@example.com"]`
   - Subject: "User Data Retrieved Successfully"
   - Email Body: "Retrieved {{responseData.length}} users from API"

#### 6. Configurar Slack Node (False Branch)
1. **Notificación de error**
   - Channel: "#alerts"
   - Message: "⚠️ Failed to retrieve user data. Status: {{responseStatus}}"

#### 7. Configurar Data Flow Complejo
1. **Múltiples transformaciones**
   - Renombrar campos
   - Filtrar datos
   - Formatear mensajes

### Resultado Esperado
- Workflow complejo con múltiples conectores
- Lógica condicional avanzada
- Transformaciones de datos complejas
- Notificaciones diferenciadas

---

## 🔄 Workflow 5: Pipeline de Datos Avanzado

### Objetivo
Probar un pipeline completo de procesamiento de datos con múltiples transformaciones.

### Pasos

#### 1. Crear Pipeline de Datos
```
Start → Data Transform → Condition → [True: HTTP Request, False: Data Transform] → End
```

#### 2. Configurar Data Transform Node (Primero)
1. **Transformación de entrada**
   - Type: "map"
   - Config: Transformar nombres a mayúsculas
   - Filtrar registros con status "active"

#### 3. Configurar Condition Node
1. **Condición de procesamiento**
   - Verificar si hay datos válidos
   - Contar registros procesados

#### 4. Configurar HTTP Request Node (True Branch)
1. **Enviar datos procesados**
   - POST a API externa
   - Incluir datos transformados

#### 5. Configurar Data Transform Node (False Branch)
1. **Transformación adicional**
   - Agregar campos de metadata
   - Formatear para logging

#### 6. Configurar Data Flow Avanzado
1. **Múltiples transformaciones**
   - Mapeo de campos complejo
   - Transformaciones en cadena
   - Validaciones de datos

### Resultado Esperado
- Pipeline completo de procesamiento
- Transformaciones en cadena
- Manejo de errores
- Logging de operaciones

---

## ✅ Testing de Validaciones

### 1. Validación de Nodos
- **Probar nodos sin conexiones**: Debería mostrar advertencia
- **Probar nodos huérfanos**: Debería mostrar error
- **Probar ciclos**: Debería prevenir conexiones circulares

### 2. Validación de Datos
- **Campos requeridos**: Debería mostrar error si faltan
- **Tipos de datos**: Debería validar tipos correctos
- **Rangos de valores**: Debería validar límites

### 3. Validación de Conectores
- **URLs inválidas**: Debería mostrar error
- **Emails inválidos**: Debería mostrar error
- **Configuraciones incompletas**: Debería mostrar error

---

## 📤 Testing de Importación/Exportación

### 1. Exportar Workflow
1. **Seleccionar workflow**
2. **Click en "Export"**
3. **Verificar archivo JSON generado**
4. **Verificar que incluye todos los datos**

### 2. Importar Workflow
1. **Click en "Import"**
2. **Seleccionar archivo exportado**
3. **Verificar que se carga correctamente**
4. **Verificar que mantiene todas las configuraciones**

### 3. Testing de Esquemas
1. **Ir a pestaña "Connectors"**
2. **Exportar esquema de HTTP Request**
3. **Modificar esquema exportado**
4. **Importar esquema modificado**
5. **Verificar validaciones**

---

## 🎯 Checklist de Testing

### ✅ Funcionalidades Básicas
- [ ] Creación de nodos
- [ ] Conexiones entre nodos
- [ ] Panel de propiedades
- [ ] Validaciones básicas

### ✅ Nodo de Condición
- [ ] Forma de rombo
- [ ] Conectores en vértices
- [ ] Editor de condiciones
- [ ] Evaluación en tiempo real

### ✅ Flujo de Datos
- [ ] Mapeo de campos
- [ ] Transformaciones
- [ ] Preview de datos
- [ ] Validaciones de flujo

### ✅ Conectores
- [ ] HTTP Request
- [ ] Email
- [ ] Slack
- [ ] Timer
- [ ] Data Transform
- [ ] Webhook

### ✅ Validaciones
- [ ] Validación específica por conector
- [ ] Mensajes de error claros
- [ ] Sugerencias de corrección
- [ ] Validación en tiempo real

### ✅ Importación/Exportación
- [ ] Exportar workflows
- [ ] Importar workflows
- [ ] Exportar esquemas
- [ ] Importar esquemas

### ✅ Esquemas Dinámicos
- [ ] Esquemas de entrada vacíos para nodos sin conexiones
- [ ] Esquemas calculados basados en conexiones reales
- [ ] Transformaciones aplicadas en el flujo de datos
- [ ] Generadores específicos por tipo de nodo
- [ ] Eliminación de esquemas hardcodeados

---

## 🔄 Testing de Esquemas Dinámicos

### Objetivo
Probar el nuevo sistema de esquemas dinámicos que calcula los esquemas de entrada/salida basándose en las conexiones reales del workflow.

### Workflow de Prueba: START → CONDITION → ACTION → END

#### 1. Crear Workflow Básico
1. **Crear nodos en orden**:
   - START (arriba izquierda)
   - CONDITION (centro)
   - ACTION (derecha)
   - END (abajo derecha)

2. **Conectar nodos**:
   - START → CONDITION
   - CONDITION → ACTION
   - ACTION → END

#### 2. Verificar Esquemas Dinámicos

##### **Nodo START (sin conexiones entrantes)**
1. **Seleccionar nodo START**
2. **Ir a panel de propiedades**
3. **Verificar sección "Data Schema"**:
   - 📥 **Input Fields**: Debería estar vacío (sin campos)
   - 📤 **Output Fields**: Debería mostrar campos generados dinámicamente:
     - `id` (STRING)
     - `timestamp` (DATE)
     - `data` (JSON) con ejemplo: `{ status: "active", count: 42 }`

##### **Nodo CONDITION (con conexión desde START)**
1. **Seleccionar nodo CONDITION**
2. **Verificar sección "Data Schema"**:
   - 📥 **Input Fields**: Debería mostrar los campos de salida del START:
     - `id` (STRING)
     - `timestamp` (DATE)
     - `data` (JSON)
   - 📤 **Output Fields**: Debería mostrar campos condicionales:
     - `conditionResult` (BOOLEAN)
     - `trueBranch.id`, `trueBranch.timestamp`, `trueBranch.data`
     - `falseBranch.id`, `falseBranch.timestamp`, `falseBranch.data`

##### **Nodo ACTION (con conexión desde CONDITION)**
1. **Seleccionar nodo ACTION**
2. **Verificar sección "Data Schema"**:
   - 📥 **Input Fields**: Debería mostrar campos de la rama condicional
   - 📤 **Output Fields**: Debería incluir campos adicionales:
     - `actionResult` (JSON)
     - `executionTime` (NUMBER)

##### **Nodo END (con conexión desde ACTION)**
1. **Seleccionar nodo END**
2. **Verificar sección "Data Schema"**:
   - 📥 **Input Fields**: Debería mostrar todos los campos de salida del ACTION
   - 📤 **Output Fields**: Debería estar vacío (nodo final)

#### 3. Probar Transformaciones de Data Flow

##### **Configurar Transformación en START → CONDITION**
1. **Seleccionar conexión START → CONDITION**
2. **Ir a pestaña "Transformations"**
3. **Añadir transformación**:
   - Type: `TRANSFORM`
   - Field: `data.status`
   - Expression: `toUpperCase`
4. **Verificar que el esquema de entrada del CONDITION refleja la transformación**

##### **Configurar Mapeo de Campos en CONDITION → ACTION**
1. **Seleccionar conexión CONDITION → ACTION**
2. **Ir a pestaña "Mapping"**
3. **Añadir mapeo**:
   - Source: `trueBranch.data`
   - Target: `inputData`
4. **Verificar que el esquema de entrada del ACTION refleja el mapeo**

#### 4. Probar Nodos sin Conexiones

##### **Crear Nodo Aislado**
1. **Añadir un nuevo ACTION node sin conectar**
2. **Seleccionar el nodo**
3. **Verificar que el esquema de entrada está vacío**
4. **Verificar que el esquema de salida muestra campos por defecto**

#### 5. Probar Diferentes Tipos de Nodos

##### **HTTP Request Node**
1. **Reemplazar ACTION con HTTP_REQUEST**
2. **Verificar esquemas específicos**:
   - Input: campos de configuración HTTP
   - Output: campos de respuesta HTTP (`responseStatus`, `responseData`, `responseHeaders`)

##### **Email Node**
1. **Reemplazar ACTION con EMAIL**
2. **Verificar esquemas específicos**:
   - Input: campos de configuración de email
   - Output: campos de resultado (`emailSent`, `messageId`)

##### **Data Transform Node**
1. **Reemplazar ACTION con DATA_TRANSFORM**
2. **Configurar transformaciones**
3. **Verificar que el esquema de salida refleja las transformaciones aplicadas**

### Resultado Esperado

#### **✅ Esquemas Dinámicos Funcionando**:
- Nodos sin conexiones tienen esquemas de entrada vacíos
- Esquemas de entrada se calculan basados en conexiones reales
- Transformaciones se aplican correctamente en el flujo
- Esquemas de salida reflejan la configuración específica del nodo
- Cada tipo de nodo genera esquemas apropiados

#### **✅ Eliminación de Esquemas Hardcodeados**:
- No hay campos de entrada antes de conexiones
- Los datos fluyen real y dinámicamente
- Las transformaciones se reflejan en los esquemas
- El sistema es escalable para workflows complejos

---

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Nodos no se conectan
- **Causa**: Validación de tipos de puertos
- **Solución**: Verificar que conectas output → input

#### 2. Panel de propiedades no aparece
- **Causa**: Nodo no seleccionado
- **Solución**: Click en el nodo para seleccionarlo

#### 3. Validaciones no funcionan
- **Causa**: Datos inválidos
- **Solución**: Verificar formato de datos según esquema

#### 4. Animaciones no aparecen
- **Causa**: CSS no cargado
- **Solución**: Recargar página

### Logs de Debug
- Abrir DevTools (F12)
- Ir a Console
- Verificar mensajes de error
- Verificar warnings de validación

---

## 🎉 Conclusión

Este tutorial cubre todas las funcionalidades implementadas en el Sprint 9.5:

1. **Sistema de Flujo de Datos Completo**
2. **Nodos con Puertos Tipados**
3. **Nodo de Condición en Forma de Rombo**
4. **Conexiones Direccionales con Animaciones**
5. **Panel de Configuración de Datos**
6. **Integración Completa con Conectores**
7. **Sistema de Esquemas Dinámicos** 🆕

### 🚀 Funcionalidades Clave del Sistema de Esquemas Dinámicos:

- **Esquemas Calculados en Tiempo Real**: Los esquemas de entrada/salida se calculan dinámicamente basándose en las conexiones reales del workflow
- **Eliminación de Esquemas Hardcodeados**: Los nodos no tienen datos de entrada hasta que se conectan
- **Transformaciones Aplicadas**: Las transformaciones de data flow se reflejan en los esquemas
- **Generadores Específicos por Tipo**: Cada tipo de nodo genera esquemas apropiados
- **Flujo de Datos Real**: Los datos fluyen real y dinámicamente a través del workflow

¡El sistema está listo para workflows complejos y producción! 🚀 