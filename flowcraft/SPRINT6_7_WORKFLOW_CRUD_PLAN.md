# Sprint 6-7: Core API y Workflow CRUD - Plan Detallado

## 🎯 Objetivo del Sprint
Desarrollar la API base para gestión de workflows con CRUD completo, validación, versioning y templates.

## ⏱️ Duración: 2 semanas (10 días laborables)

---

## 📋 Plan de Tareas Detallado

### 🗄️ Fase 1: Database Schema (Días 1-2)

#### Tarea 1.1: Workflow Schema
- [ ] **Crear modelo Workflow en Prisma**
  - [ ] Campos: id, name, description, definition (JSONB), version, status
  - [ ] Relaciones: organization_id, created_by, updated_by
  - [ ] Índices: organization_id, status, created_at
  - [ ] Validaciones: name required, version auto-increment

#### Tarea 1.2: Workflow Version Schema
- [ ] **Crear modelo WorkflowVersion**
  - [ ] Campos: id, workflow_id, version_number, definition, changelog
  - [ ] Relaciones: workflow_id, created_by
  - [ ] Índices: workflow_id, version_number
  - [ ] Validaciones: version_number unique por workflow

#### Tarea 1.3: Workflow Template Schema
- [ ] **Crear modelo WorkflowTemplate**
  - [ ] Campos: id, name, description, category, definition, is_public
  - [ ] Relaciones: organization_id, created_by
  - [ ] Índices: category, is_public, organization_id
  - [ ] Validaciones: name required, category enum

#### Tarea 1.4: Migración y Seeds
- [ ] **Crear migración Prisma**
  - [ ] Generar migración con `prisma migrate dev`
  - [ ] Verificar estructura de tablas
  - [ ] Crear seeds para templates básicos
  - [ ] Testear relaciones y constraints

**Criterios de Aceptación:**
- ✅ Schema de base de datos creado
- ✅ Migración aplicada sin errores
- ✅ Seeds con datos de prueba
- ✅ Relaciones funcionando correctamente

---

### 🔧 Fase 2: Backend Services (Días 3-5)

#### Tarea 2.1: Workflow Service
- [ ] **Crear WorkflowService**
  - [ ] Método createWorkflow()
  - [ ] Método getWorkflow(id)
  - [ ] Método updateWorkflow(id, data)
  - [ ] Método deleteWorkflow(id)
  - [ ] Método listWorkflows(filters, pagination)
  - [ ] Validación de permisos por organización

#### Tarea 2.2: Workflow Version Service
- [ ] **Crear WorkflowVersionService**
  - [ ] Método createVersion(workflowId, definition)
  - [ ] Método getVersion(workflowId, versionNumber)
  - [ ] Método listVersions(workflowId)
  - [ ] Método rollbackToVersion(workflowId, versionNumber)
  - [ ] Auto-increment de version_number

#### Tarea 2.3: Workflow Template Service
- [ ] **Crear WorkflowTemplateService**
  - [ ] Método createTemplate(data)
  - [ ] Método getTemplate(id)
  - [ ] Método updateTemplate(id, data)
  - [ ] Método deleteTemplate(id)
  - [ ] Método listTemplates(filters, pagination)
  - [ ] Método instantiateTemplate(templateId, organizationId)

#### Tarea 2.4: Validación de Workflows
- [ ] **Crear WorkflowValidator**
  - [ ] Validar estructura JSON del workflow
  - [ ] Validar nodos requeridos (start, end)
  - [ ] Validar conexiones entre nodos
  - [ ] Validar configuración de nodos
  - [ ] Validar ciclos en el grafo
  - [ ] Retornar errores detallados

**Criterios de Aceptación:**
- ✅ Servicios creados con métodos CRUD
- ✅ Validación de workflows implementada
- ✅ Manejo de errores robusto
- ✅ Permisos por organización funcionando

---

### 🌐 Fase 3: API Endpoints (Días 6-8)

#### Tarea 3.1: Workflow Routes
- [ ] **Crear routes/workflows.ts**
  - [ ] POST /workflows - Crear workflow
  - [ ] GET /workflows - Listar workflows
  - [ ] GET /workflows/:id - Obtener workflow
  - [ ] PUT /workflows/:id - Actualizar workflow
  - [ ] DELETE /workflows/:id - Eliminar workflow
  - [ ] Schemas de validación con Fastify

#### Tarea 3.2: Workflow Version Routes
- [ ] **Crear routes/workflow-versions.ts**
  - [ ] POST /workflows/:id/versions - Crear nueva versión
  - [ ] GET /workflows/:id/versions - Listar versiones
  - [ ] GET /workflows/:id/versions/:version - Obtener versión
  - [ ] POST /workflows/:id/rollback/:version - Rollback a versión
  - [ ] Validación de versiones

#### Tarea 3.3: Workflow Template Routes
- [ ] **Crear routes/workflow-templates.ts**
  - [ ] POST /workflow-templates - Crear template
  - [ ] GET /workflow-templates - Listar templates
  - [ ] GET /workflow-templates/:id - Obtener template
  - [ ] PUT /workflow-templates/:id - Actualizar template
  - [ ] DELETE /workflow-templates/:id - Eliminar template
  - [ ] POST /workflow-templates/:id/instantiate - Instanciar template

#### Tarea 3.4: Import/Export Routes
- [ ] **Crear routes/workflow-import-export.ts**
  - [ ] POST /workflows/:id/export - Exportar workflow
  - [ ] POST /workflows/import - Importar workflow
  - [ ] POST /workflow-templates/:id/export - Exportar template
  - [ ] POST /workflow-templates/import - Importar template
  - [ ] Validación de archivos JSON

#### Tarea 3.5: API Documentation
- [ ] **Configurar OpenAPI/Swagger**
  - [ ] Definir schemas para todos los endpoints
  - [ ] Documentar parámetros y respuestas
  - [ ] Añadir ejemplos de uso
  - [ ] Configurar UI de documentación
  - [ ] Integrar con Fastify

**Criterios de Aceptación:**
- ✅ Todos los endpoints funcionando
- ✅ Validación de requests implementada
- ✅ Documentación OpenAPI completa
- ✅ Manejo de errores estandarizado

---

### ⚛️ Fase 4: Frontend Integration (Días 9-10)

#### Tarea 4.1: API Client
- [ ] **Crear services/workflowApi.ts**
  - [ ] Cliente para endpoints de workflows
  - [ ] Cliente para endpoints de versiones
  - [ ] Cliente para endpoints de templates
  - [ ] Cliente para import/export
  - [ ] Manejo de errores con i18n

#### Tarea 4.2: React Query Integration
- [ ] **Crear hooks/useWorkflows.ts**
  - [ ] useWorkflows() - Listar workflows
  - [ ] useWorkflow(id) - Obtener workflow
  - [ ] useCreateWorkflow() - Crear workflow
  - [ ] useUpdateWorkflow() - Actualizar workflow
  - [ ] useDeleteWorkflow() - Eliminar workflow
  - [ ] Optimistic updates

#### Tarea 4.3: Workflow List Component
- [ ] **Crear components/WorkflowList.tsx**
  - [ ] Tabla de workflows con paginación
  - [ ] Filtros por status, organización
  - [ ] Búsqueda por nombre
  - [ ] Acciones: ver, editar, eliminar
  - [ ] Loading states y error handling

#### Tarea 4.4: Workflow Form Component
- [ ] **Crear components/WorkflowForm.tsx**
  - [ ] Formulario para crear/editar workflow
  - [ ] Validación de campos
  - [ ] Preview del workflow
  - [ ] Integración con templates
  - [ ] Manejo de versiones

#### Tarea 4.5: Template Gallery Component
- [ ] **Crear components/TemplateGallery.tsx**
  - [ ] Grid de templates disponibles
  - [ ] Filtros por categoría
  - [ ] Preview de templates
  - [ ] Botón de instanciar template
  - [ ] Búsqueda de templates

**Criterios de Aceptación:**
- ✅ API client funcionando
- ✅ React Query hooks implementados
- ✅ Componentes de UI creados
- ✅ Integración con i18n
- ✅ Loading states y error handling

---

## 🎯 Entregables Finales

### Backend
- ✅ API REST completa para workflows
- ✅ CRUD de workflows, versiones y templates
- ✅ Validación de workflow definitions
- ✅ Sistema de versioning
- ✅ Import/export functionality
- ✅ Documentación OpenAPI

### Frontend
- ✅ API client con React Query
- ✅ Componentes de gestión de workflows
- ✅ Template gallery
- ✅ Error handling con i18n
- ✅ Loading states y optimistic updates

### Database
- ✅ Schema de workflows, versiones y templates
- ✅ Migraciones aplicadas
- ✅ Seeds con datos de prueba
- ✅ Índices optimizados

---

## 🔄 Plan de Testing

### Unit Tests
- [ ] WorkflowService tests
- [ ] WorkflowVersionService tests
- [ ] WorkflowTemplateService tests
- [ ] WorkflowValidator tests

### Integration Tests
- [ ] API endpoints tests
- [ ] Database operations tests
- [ ] Import/export tests

### E2E Tests
- [ ] Crear workflow completo
- [ ] Versionar workflow
- [ ] Instanciar template
- [ ] Import/export workflow

---

## 📊 Métricas de Éxito

- **Performance:** < 200ms para operaciones CRUD
- **Reliability:** 100% de endpoints funcionando
- **Documentation:** 100% de endpoints documentados
- **Testing:** > 80% de cobertura de código

---

## 🚀 Próximos Pasos

Al completar este sprint, tendremos:
- ✅ Base sólida para el editor de workflows
- ✅ API completa para gestión de workflows
- ✅ Sistema de templates funcional
- ✅ Frontend integrado con backend

**Próximo Sprint:** Workflow Editor Foundation (React Flow) 