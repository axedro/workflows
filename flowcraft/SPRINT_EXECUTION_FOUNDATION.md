# 🚨 SPRINT DE EMERGENCIA: Execution Foundation
## FlowCraft - Workflow Execution Engine Implementation

**Duración:** 2 semanas (10 días hábiles)  
**Objetivo:** Implementar capacidad básica de ejecución de workflows end-to-end  
**Outcome:** Los usuarios pueden crear un workflow con HTTP Request y ejecutarlo completamente

---

## 📊 Estado Actual - Infraestructura Existente

### ✅ **YA TENEMOS (60% Infrastructure)**
- **Database Schema Completo**: Tablas `Execution`, `ExecutionNode`, `ExecutionLog` con relaciones
- **Connector Framework**: BaseConnector, ConnectorExecutor, ConnectorRegistry
- **Redis + PostgreSQL**: Infraestructura de colas y persistencia configurada
- **Tipos TypeScript**: Definiciones completas para execution y connectors
- **Docker Setup**: Entorno desarrollo listo para servicios adicionales

### ❌ **FALTA IMPLEMENTAR (40% Runtime)**
- **Execution Service**: Orquestador principal de ejecución
- **Queue System**: Bull/BullMQ para procesamiento asíncrono
- **API Endpoints**: Rutas de ejecución (/execute, /status, /logs)
- **HTTP Connector**: Implementación concreta del connector más crítico
- **Frontend Integration**: UI para ejecutar y monitorear workflows

---

## 📋 PLAN DETALLADO - 10 DÍAS

### **DÍA 1-2: Core Execution Service Setup**

#### **Tarea 1.1: Execution Service Foundation** ⏱️ 1 día
- [ ] **Crear `apps/execution-service`** directory con estructura base
  - [ ] `package.json` con dependencies (Bull, BullMQ, Fastify)
  - [ ] `src/main.ts` - Entry point del servicio
  - [ ] `src/config/` - Configuración Redis/Database
  - [ ] `src/types/` - Tipos específicos del execution service
  
- [ ] **ExecutionEngine Class Core**
  - [ ] `src/services/ExecutionEngine.ts` - Orquestador principal
  - [ ] `executeWorkflow(workflowId, userId, input?)` método básico
  - [ ] Connection con Prisma para workflow/execution data
  - [ ] Logging básico con `ExecutionLog` table

#### **Tarea 1.2: Queue System Integration** ⏱️ 1 día
- [ ] **Bull/BullMQ Setup**
  - [ ] `src/queues/WorkflowQueue.ts` - Queue configuration
  - [ ] Redis connection using existing configuration
  - [ ] Job definition types (`WorkflowExecutionJob`, `NodeExecutionJob`)
  - [ ] Queue options (retry, delay, concurrency)

- [ ] **Worker Process Foundation**
  - [ ] `src/workers/WorkflowWorker.ts` - Job processor básico
  - [ ] Job handler que recibe `{workflowId, executionId, nodeId}`
  - [ ] Error handling y job failure management
  - [ ] Connection a ExecutionEngine para processing

---

### **DÍA 3-4: API Integration & Database**

#### **Tarea 2.1: Execution API Endpoints** ⏱️ 1.5 días
- [ ] **Extender API Service** (`apps/api`)
  - [ ] `src/routes/executions.ts` - Nuevas rutas de ejecución
  - [ ] `POST /api/workflows/:id/execute` - Trigger execution
  - [ ] `GET /api/executions/:id` - Get execution status  
  - [ ] `GET /api/workflows/:id/executions` - List workflow executions
  - [ ] `GET /api/executions/:id/logs` - Get execution logs

- [ ] **Execution Service Client**
  - [ ] `src/services/executionService.ts` en API
  - [ ] HTTP/gRPC client para comunicar con execution-service
  - [ ] Error handling y timeout management
  - [ ] Integration con existing authentication middleware

#### **Tarea 2.2: Database Operations** ⏱️ 0.5 días
- [ ] **Execution Data Management**
  - [ ] `src/models/Execution.ts` - CRUD operations
  - [ ] `createExecution()`, `updateExecutionStatus()`, `addExecutionLog()`
  - [ ] Query methods para execution history
  - [ ] Prisma transactions para atomic updates

---

### **DÍA 5-6: HTTP Connector Implementation**

#### **Tarea 3.1: HTTP Request Connector** ⏱️ 2 días
- [ ] **Concrete HTTP Connector** (`packages/connectors`)
  - [ ] `src/connectors/HttpRequestConnector.ts`
  - [ ] Extend `BaseConnector` with HTTP-specific logic
  - [ ] Support para GET, POST, PUT, DELETE methods
  - [ ] Headers configuration y JSON body processing
  - [ ] Response handling con status codes y error detection

- [ ] **HTTP Connector Features**
  - [ ] Authentication básica (Bearer token, Basic auth)
  - [ ] Timeout handling (configurable, default 30s)
  - [ ] Request/Response logging para debugging
  - [ ] Error categorization (network, HTTP error, timeout)
  - [ ] Response data extraction y mapping

- [ ] **Connector Registration**
  - [ ] Register HTTP connector en ConnectorRegistry
  - [ ] Validation schema para HTTP connector inputs
  - [ ] Integration tests con real HTTP endpoints
  - [ ] Connector configuration UI metadata

---

### **DÍA 7: Workflow Execution Logic**

#### **Tarea 4.1: Node Execution Orchestration** ⏱️ 1 día
- [ ] **Workflow Execution Flow**
  - [ ] `executeWorkflowNodes()` - Sequential node execution
  - [ ] Node dependency resolution (follow edges)
  - [ ] Data passing between connected nodes
  - [ ] Execution state tracking en `ExecutionNode` table

- [ ] **Node Execution Engine**
  - [ ] `executeNode(nodeId, executionId, inputData)` method
  - [ ] Connector instantiation y execution
  - [ ] Input data validation usando existing schemas
  - [ ] Output data capture y storage
  - [ ] Error handling per node con recovery options

- [ ] **Conditional Logic** (Basic)
  - [ ] Simple condition evaluation for CONDITION nodes
  - [ ] Branch selection based on condition results
  - [ ] Data flow routing based on edge conditions

---

### **DÍA 8-9: Frontend Integration**

#### **Tarea 5.1: Workflow Editor Execution UI** ⏱️ 1.5 días
- [ ] **Execute Button Integration**
  - [ ] Add "Execute" button to WorkflowEditor toolbar
  - [ ] Execute API call using React Query
  - [ ] Loading state management durante execution
  - [ ] Success/Error feedback con toast notifications

- [ ] **Execution Status Display**
  - [ ] `ExecutionStatusPanel` component
  - [ ] Real-time status updates (polling every 2s)
  - [ ] Progress indicator con execution steps
  - [ ] Execution time tracking y display

#### **Tarea 5.2: Execution History & Logs** ⏱️ 0.5 días
- [ ] **Execution History Panel**
  - [ ] List recent executions for current workflow
  - [ ] Status badges (Running, Completed, Failed)
  - [ ] Execution duration y timestamp display
  - [ ] Click to view execution details

- [ ] **Basic Logs Viewer**
  - [ ] Simple execution logs display
  - [ ] Log level filtering (Error, Info, Debug)
  - [ ] Scrollable logs con auto-refresh
  - [ ] Node-level log grouping

---

### **DÍA 10: Testing & Integration**

#### **Tarea 6.1: End-to-End Testing** ⏱️ 0.5 días
- [ ] **E2E Workflow Test**
  - [ ] Create simple HTTP workflow (Start → HTTP Request → End)
  - [ ] Execute workflow via UI
  - [ ] Verify execution completes successfully
  - [ ] Check execution logs y database records

- [ ] **HTTP Connector Testing**
  - [ ] Test with real HTTP endpoints (httpbin.org, jsonplaceholder)
  - [ ] Verify different HTTP methods work
  - [ ] Test error scenarios (404, timeout, network error)
  - [ ] Validate response data capture

#### **Tarea 6.2: Documentation & Cleanup** ⏱️ 0.5 días
- [ ] **API Documentation**
  - [ ] Document new execution endpoints en OpenAPI
  - [ ] Add execution examples y response schemas
  - [ ] Update API client documentation

- [ ] **Code Cleanup & Optimization**
  - [ ] Remove debug logging y temporary code
  - [ ] Optimize database queries y connection pooling
  - [ ] Add proper error messages y user feedback
  - [ ] Final integration testing

---

## 🎯 DELIVERABLES ESPECÍFICOS

### **Funcionalidad Mínima Viable**
1. **Workflow Execution**: Usuario puede clickear "Execute" en un workflow
2. **HTTP Request**: Workflows pueden hacer HTTP calls a APIs externas
3. **Status Tracking**: Usuario ve el progreso y resultado de execution
4. **Error Handling**: Errores de ejecución se muestran claramente al usuario
5. **Execution History**: Usuario puede ver execuciones anteriores

### **Componentes Técnicos**
- ✅ **ExecutionService** running como microservicio independiente
- ✅ **Bull/BullMQ** procesando workflow jobs asíncronamente
- ✅ **HTTP Connector** funcional con configuración completa
- ✅ **API Endpoints** para trigger y monitorear execuciones
- ✅ **Frontend UI** para ejecutar workflows y ver resultados

### **Métricas de Éxito**
- **E2E Success**: Create workflow → Configure HTTP node → Execute → See results
- **Performance**: Execution completes in <10 seconds para HTTP simple
- **Reliability**: >90% success rate para HTTP requests válidos
- **UX**: User feedback claro en cada step del proceso

---

## ⚠️ RIESGOS Y MITIGACIONES

### **Riesgo 1: Queue System Complexity**
- **Mitigación**: Start con setup básico Bull, evitar BullMQ advanced features
- **Fallback**: Implementar execution síncrona si queues fallan

### **Riesgo 2: HTTP Connector Edge Cases**
- **Mitigación**: Focus en happy path, GET/POST básico únicamente
- **Testing**: Test con httpbin.org para casos controlados

### **Riesgo 3: Frontend-Backend Integration**
- **Mitigación**: Mock API responses para desarrollo paralelo
- **Contingencia**: API-first development con OpenAPI specs

### **Riesgo 4: Data Flow Between Nodes**
- **Mitigación**: Implement data passing básico, usar existing schema system
- **Simplification**: Linear workflows únicamente (no parallel branches)

---

## 🚀 SUCCESS CRITERIA

### **Demo Scenario Final**
1. **Create Workflow**: User creates new workflow con Start → HTTP Request → End
2. **Configure HTTP**: Configure HTTP node to call `httpbin.org/get`
3. **Execute**: Click Execute button, see execution start
4. **Monitor**: Watch real-time execution progress
5. **Results**: See execution complete successfully con HTTP response data
6. **History**: View execution in history list con logs

### **Technical Validation**
- [ ] Execution creates records en `Execution` table
- [ ] HTTP request actually happens con real network call
- [ ] Response data stored correctamente
- [ ] Execution logs captured para debugging
- [ ] UI updates in real-time durante execution
- [ ] Error scenarios handled gracefully

**OUTCOME**: FlowCraft transforms from design tool to **functional automation platform** 🎉