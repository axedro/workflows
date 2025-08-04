# 🎯 FlowCraft Workflow Examples - Sprint 9.5

Este directorio contiene ejemplos de workflows y herramientas de testing para probar todas las funcionalidades implementadas en el Sprint 9.5.

## 📁 Estructura del Directorio

```
examples/
├── README.md                    # Este archivo
├── workflows/                   # Workflows de ejemplo
│   ├── workflow-1-basic.json    # Workflow básico
│   ├── workflow-2-conditions.json # Workflow con condiciones
│   ├── workflow-3-connectors.json # Workflow con conectores
│   └── workflow-6-dynamic-schemas.json # Workflow de esquemas dinámicos
└── testing/                     # Herramientas de testing
    └── test-workflow-features.sh # Script de testing automatizado
```

## 🚀 Inicio Rápido

### 1. Iniciar Servidores
```bash
cd flowcraft
./scripts/start-servers.sh
```

### 2. Ejecutar Tests Automatizados
```bash
./scripts/test-workflow-features.sh
```

### 3. Acceder a la Aplicación
- Frontend: http://localhost:5173
- API: http://localhost:3000

## 📋 Workflows de Ejemplo

### 🔗 Workflow 1: Flujo Básico
**Archivo**: `workflows/workflow-1-basic.json`

**Descripción**: Workflow básico para probar nodos, conexiones y flujo de datos.

**Características**:
- 3 nodos: Start → Action → End
- Conexiones simples
- Mapeo básico de datos
- Sin transformaciones complejas

**Uso**:
1. Crear nuevo workflow en la aplicación
2. Importar el archivo JSON
3. Verificar que se cargan los nodos correctamente
4. Probar las conexiones y el panel de propiedades

### 🔄 Workflow 2: Condiciones y Transformaciones
**Archivo**: `workflows/workflow-2-conditions.json`

**Descripción**: Workflow con nodo de condición (rombo) y transformaciones de datos.

**Características**:
- Nodo de condición en forma de rombo
- Múltiples condiciones (AND logic)
- Transformaciones de datos
- Flujo condicional (True/False branches)

**Uso**:
1. Importar el workflow
2. Seleccionar el nodo de condición
3. Verificar el editor de condiciones
4. Probar las transformaciones en las conexiones
5. Verificar el preview de datos

### 🌐 Workflow 3: Conectores HTTP y Email
**Archivo**: `workflows/workflow-3-connectors.json`

**Descripción**: Workflow con conectores HTTP Request y Email con validaciones específicas.

**Características**:
- Conector HTTP Request
- Conector Email
- Validaciones específicas por conector
- Transformaciones complejas
- Mapeo de datos entre conectores

**Uso**:
1. Importar el workflow
2. Configurar los conectores
3. Probar las validaciones
4. Verificar el flujo de datos
5. Testing de la pestaña de conectores

### 🔄 Workflow 6: Esquemas Dinámicos
**Archivo**: `workflows/workflow-6-dynamic-schemas.json`

**Descripción**: Workflow avanzado que demuestra el sistema de esquemas dinámicos con diferentes tipos de nodos y transformaciones.

**Características**:
- Sistema de esquemas dinámicos completo
- Múltiples tipos de nodos (START, CONDITION, HTTP_REQUEST, DATA_TRANSFORM, EMAIL, SLACK, END)
- Transformaciones de data flow
- Flujo condicional con ramas true/false
- Esquemas calculados basados en conexiones reales
- Eliminación de esquemas hardcodeados

**Uso**:
1. Importar el workflow
2. Seleccionar cada nodo y verificar sus esquemas dinámicos
3. Probar las transformaciones en las conexiones
4. Verificar que los esquemas se calculan correctamente
5. Testing del sistema de esquemas dinámicos

## 🧪 Testing Automatizado

### Script de Testing
El script `test-workflow-features.sh` automatiza el testing de todas las funcionalidades:

```bash
# Ejecutar todos los tests
./scripts/test-workflow-features.sh

# Tests específicos
./scripts/test-workflow-features.sh --services    # Solo servicios
./scripts/test-workflow-features.sh --api         # Solo API
./scripts/test-workflow-features.sh --compile     # Solo compilación
./scripts/test-workflow-features.sh --workflows   # Solo workflows
```

### Qué Testea el Script

#### 1. **Servicios**
- Frontend (localhost:5173)
- API (localhost:3000)

#### 2. **Endpoints de API**
- Health endpoint
- i18n endpoint

#### 3. **Compilación TypeScript**
- Verificación de errores de compilación
- Validación de tipos

#### 4. **Archivos de Workflow**
- Validación de JSON
- Verificación de campos requeridos
- Estructura correcta

#### 5. **Servicios de Validación**
- Connector validation service
- Data config panel
- Node schemas

#### 6. **Componentes Específicos**
- Condition node
- Data flow types
- Interfaces y tipos

## 🎯 Checklist de Testing Manual

### ✅ Funcionalidades Básicas
- [ ] Creación de nodos desde la paleta
- [ ] Conexiones entre nodos
- [ ] Panel de propiedades
- [ ] Validaciones básicas de conexión

### ✅ Nodo de Condición
- [ ] Forma de rombo correcta
- [ ] Conectores en los vértices
- [ ] Editor de condiciones funcionando
- [ ] Evaluación en tiempo real
- [ ] Múltiples condiciones (AND/OR)

### ✅ Flujo de Datos
- [ ] Mapeo de campos en conexiones
- [ ] Transformaciones de datos
- [ ] Preview de datos funcionando
- [ ] Validaciones de flujo
- [ ] Sugerencias automáticas

### ✅ Conectores
- [ ] HTTP Request con validaciones
- [ ] Email con validaciones
- [ ] Slack con validaciones
- [ ] Timer con validaciones
- [ ] Data Transform con validaciones
- [ ] Webhook con validaciones

### ✅ Validaciones
- [ ] Validación específica por conector
- [ ] Mensajes de error claros
- [ ] Sugerencias de corrección
- [ ] Validación en tiempo real

### ✅ Importación/Exportación
- [ ] Exportar workflows
- [ ] Importar workflows
- [ ] Exportar esquemas de conectores
- [ ] Importar esquemas de conectores

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. **Servicios no inician**
```bash
# Verificar puertos
lsof -i :5173  # Frontend
lsof -i :3000  # API

# Reiniciar servicios
./scripts/stop-servers.sh
./scripts/start-servers.sh
```

#### 2. **Errores de compilación**
```bash
# Limpiar y reinstalar dependencias
rm -rf node_modules
pnpm install
```

#### 3. **Workflows no se importan**
- Verificar formato JSON válido
- Verificar campos requeridos
- Revisar estructura de nodos y edges

#### 4. **Validaciones no funcionan**
- Verificar que los servicios están corriendo
- Revisar logs del navegador (F12)
- Verificar configuración de conectores

### Logs de Debug

#### Frontend
```bash
# Abrir DevTools (F12)
# Ir a Console
# Verificar errores y warnings
```

#### API
```bash
# Ver logs del servidor
cd apps/api
npm run dev
```

## 📊 Métricas de Testing

### Cobertura de Funcionalidades
- **Nodos**: 100% (Start, Action, Condition, End, HTTP, Email, Slack, Timer, Data Transform, Webhook)
- **Conexiones**: 100% (Validación, Animaciones, Data Flow)
- **Validaciones**: 100% (Tipos, Campos, Conectores)
- **UI/UX**: 100% (Paneles, Editores, Preview)

### Performance
- **Tiempo de carga**: < 2 segundos
- **Validación en tiempo real**: < 100ms
- **Compilación**: < 30 segundos
- **Importación de workflows**: < 1 segundo

## 🎉 Conclusión

Estos ejemplos y herramientas de testing cubren todas las funcionalidades implementadas en el Sprint 9.5:

1. **Sistema de Flujo de Datos Completo**
2. **Nodos con Puertos Tipados**
3. **Nodo de Condición en Forma de Rombo**
4. **Conexiones Direccionales con Animaciones**
5. **Panel de Configuración de Datos**
6. **Integración Completa con Conectores**

¡El sistema está listo para workflows complejos y producción! 🚀

## 📞 Soporte

Si encuentras problemas o tienes preguntas:

1. Revisar este README
2. Ejecutar el script de testing
3. Verificar logs de error
4. Consultar la documentación del Sprint 9.5

---

**FlowCraft Team** - Sprint 9.5 Testing Suite 