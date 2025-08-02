# Estructura del Proyecto FlowCraft
## Organización de Directorios y Archivos

### Estructura General (Monorepo)

```
flowcraft/
├── .github/                    # GitHub Actions y configuraciones
├── apps/                       # Aplicaciones principales
│   ├── web/                    # Frontend React SPA
│   ├── api/                    # Backend API Gateway
│   ├── workflow-service/       # Servicio de workflows
│   ├── execution-service/      # Servicio de ejecución
│   └── monitoring-service/     # Servicio de monitorización
├── packages/                   # Paquetes compartidos
│   ├── shared-types/           # Tipos TypeScript compartidos
│   ├── database/               # Configuración de base de datos
│   ├── connectors/             # Framework de conectores
│   └── ui/                     # Componentes UI compartidos
├── infrastructure/             # Configuración de infraestructura
│   ├── docker/                 # Dockerfiles y docker-compose
│   ├── k8s/                    # Kubernetes manifests
│   └── terraform/              # Infraestructura como código
├── docs/                       # Documentación
├── scripts/                    # Scripts de utilidad
└── tools/                      # Herramientas de desarrollo
```

---

## Apps Directory

### `/apps/web` - Frontend React SPA

```
apps/web/
├── public/                     # Archivos estáticos
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
├── src/
│   ├── components/             # Componentes React
│   │   ├── auth/               # Componentes de autenticación
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── AuthProvider.tsx
│   │   ├── dashboard/          # Componentes del dashboard
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Overview.tsx
│   │   │   ├── WorkflowList.tsx
│   │   │   ├── TemplateGallery.tsx
│   │   │   ├── ExecutionHistory.tsx
│   │   │   └── Metrics.tsx
│   │   ├── workflow-editor/    # Editor de workflows
│   │   │   ├── FlowCanvas.tsx
│   │   │   ├── NodePalette.tsx
│   │   │   ├── PropertyPanel.tsx
│   │   │   ├── nodes/          # Tipos de nodos
│   │   │   │   ├── HttpNode.tsx
│   │   │   │   ├── SlackNode.tsx
│   │   │   │   ├── EmailNode.tsx
│   │   │   │   └── ConditionNode.tsx
│   │   │   └── edges/          # Tipos de conexiones
│   │   ├── monitoring/         # Componentes de monitorización
│   │   │   ├── ExecutionLogs.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   └── AlertCenter.tsx
│   │   ├── settings/           # Configuraciones
│   │   │   ├── UserProfile.tsx
│   │   │   ├── OrganizationSettings.tsx
│   │   │   └── ConnectorConfig.tsx
│   │   ├── shared/             # Componentes compartidos
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Loading.tsx
│   │   └── i18n/               # Componentes de internacionalización
│   │       ├── LanguageSelector.tsx
│   │       └── I18nProvider.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useWorkflows.ts
│   │   ├── useExecutions.ts
│   │   ├── useConnectors.ts
│   │   └── i18n/               # Hooks de internacionalización
│   │       ├── useTranslation.ts
│   │       └── useLanguage.ts
│   ├── services/               # Servicios de API
│   │   ├── api.ts              # Cliente API base
│   │   ├── auth.ts
│   │   ├── workflows.ts
│   │   ├── executions.ts
│   │   ├── connectors.ts
│   │   └── i18n.ts
│   ├── stores/                 # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   ├── workflowStore.ts
│   │   ├── templateStore.ts
│   │   ├── executionStore.ts
│   │   └── uiStore.ts
│   ├── types/                  # Tipos TypeScript
│   │   ├── auth.ts
│   │   ├── workflow.ts
│   │   ├── execution.ts
│   │   ├── connector.ts
│   │   └── i18n.ts
│   ├── utils/                  # Utilidades
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── styles/                 # Estilos globales
│   │   ├── globals.css
│   │   └── tailwind.css
│   ├── i18n/                   # Configuración de internacionalización
│   │   ├── namespaces/         # Archivos de traducción
│   │   │   ├── auth.es.json
│   │   │   ├── auth.en.json
│   │   │   ├── auth.nl.json
│   │   │   ├── common.es.json
│   │   │   ├── common.en.json
│   │   │   ├── common.nl.json
│   │   │   ├── dashboard.es.json
│   │   │   ├── dashboard.en.json
│   │   │   └── dashboard.nl.json
│   │   ├── locales/            # Configuraciones de idioma
│   │   │   ├── es.ts
│   │   │   ├── en.ts
│   │   │   └── nl.ts
│   │   └── config.ts           # Configuración i18next
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── .eslintrc.js
```

### `/apps/api` - API Gateway

```
apps/api/
├── src/
│   ├── middleware/             # Middlewares
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   ├── rateLimit.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── routes/                 # Rutas de la API
│   │   ├── auth.ts
│   │   ├── health.ts
│   │   ├── users.ts
│   │   ├── organizations.ts
│   │   ├── workflows.ts
│   │   ├── workflowTemplates.ts
│   │   ├── workflowImportExport.ts
│   │   ├── executions.ts
│   │   └── connectors.ts
│   ├── services/               # Servicios de negocio
│   │   ├── authService.ts
│   │   ├── i18nService.ts
│   │   ├── workflowService.ts
│   │   ├── workflowTemplateService.ts
│   │   ├── workflowValidationService.ts
│   │   ├── executionService.ts
│   │   └── connectorService.ts
│   ├── utils/                  # Utilidades
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── response.ts
│   ├── types/                  # Tipos
│   │   ├── request.ts
│   │   ├── response.ts
│   │   └── middleware.ts
│   ├── config/                 # Configuraciones
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── jwt.ts
│   │   └── cors.ts
│   └── index.ts                # Aplicación principal
├── package.json
├── tsconfig.json
├── env.example
└── Dockerfile
```

### `/apps/workflow-service` - Servicio de Workflows

```
apps/workflow-service/
├── src/
│   ├── controllers/            # Controladores
│   │   ├── WorkflowController.ts
│   │   ├── TemplateController.ts
│   │   └── VersionController.ts
│   ├── services/               # Servicios de negocio
│   │   ├── WorkflowService.ts
│   │   ├── ValidationService.ts
│   │   ├── TemplateService.ts
│   │   └── VersionService.ts
│   ├── models/                 # Modelos de datos
│   │   ├── Workflow.ts
│   │   ├── Template.ts
│   │   └── Version.ts
│   ├── repositories/           # Repositorios de datos
│   │   ├── WorkflowRepository.ts
│   │   ├── TemplateRepository.ts
│   │   └── VersionRepository.ts
│   ├── validators/             # Validadores
│   │   ├── WorkflowValidator.ts
│   │   └── SchemaValidator.ts
│   ├── utils/                  # Utilidades
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   └── helpers.ts
│   └── app.ts
├── prisma/                     # Esquema de base de datos
│   ├── schema.prisma
│   └── migrations/
├── package.json
├── tsconfig.json
└── Dockerfile
```

### `/apps/execution-service` - Servicio de Ejecución

```
apps/execution-service/
├── src/
│   ├── executor/               # Motor de ejecución
│   │   ├── WorkflowExecutor.ts
│   │   ├── NodeExecutor.ts
│   │   ├── ExecutionGraph.ts
│   │   └── ErrorHandler.ts
│   ├── queue/                  # Sistema de colas
│   │   ├── WorkflowQueue.ts
│   │   ├── workers/
│   │   │   ├── ExecutionWorker.ts
│   │   │   └── RetryWorker.ts
│   │   └── processors/
│   ├── connectors/             # Conectores
│   │   ├── BaseConnector.ts
│   │   ├── HttpConnector.ts
│   │   ├── SlackConnector.ts
│   │   └── registry/
│   │       ├── ConnectorRegistry.ts
│   │       └── index.ts
│   ├── state/                  # Gestión de estado
│   │   ├── ExecutionState.ts
│   │   ├── NodeState.ts
│   │   └── StateManager.ts
│   ├── scheduler/              # Programación
│   │   ├── CronScheduler.ts
│   │   ├── EventScheduler.ts
│   │   └── TriggerManager.ts
│   ├── monitoring/             # Monitorización
│   │   ├── MetricsCollector.ts
│   │   ├── LogCollector.ts
│   │   └── AlertManager.ts
│   └── app.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

### `/apps/monitoring-service` - Servicio de Monitorización

```
apps/monitoring-service/
├── src/
│   ├── collectors/             # Recolectores de métricas
│   │   ├── MetricsCollector.ts
│   │   ├── LogCollector.ts
│   │   └── HealthCollector.ts
│   ├── processors/             # Procesadores
│   │   ├── MetricsProcessor.ts
│   │   ├── LogProcessor.ts
│   │   └── AlertProcessor.ts
│   ├── storage/                # Almacenamiento
│   │   ├── MetricsStorage.ts
│   │   ├── LogStorage.ts
│   │   └── AlertStorage.ts
│   ├── api/                    # API de métricas
│   │   ├── MetricsController.ts
│   │   ├── LogController.ts
│   │   └── AlertController.ts
│   ├── dashboards/             # Dashboards
│   │   ├── WorkflowDashboard.ts
│   │   ├── PerformanceDashboard.ts
│   │   └── SystemDashboard.ts
│   └── app.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## Packages Directory

### `/packages/shared-types` - Tipos Compartidos

```
packages/shared-types/
├── src/
│   ├── auth.ts                 # Tipos de autenticación
│   │   ├── User interface      # Usuario con organización
│   │   ├── Organization interface # Organización
│   │   ├── AuthRequest/Response # Requests/Responses de auth
│   │   └── JWT payload types   # Tipos de JWT
│   ├── workflow.ts             # Tipos de workflows
│   │   ├── Workflow interface  # Workflow principal
│   │   ├── WorkflowDefinition  # Definición del workflow
│   │   ├── WorkflowNode        # Nodos del workflow
│   │   ├── WorkflowEdge        # Conexiones del workflow
│   │   ├── WorkflowVersion     # Versionado
│   │   ├── WorkflowTemplate    # Templates
│   │   ├── WorkflowStatus      # Estados del workflow
│   │   └── Validation types    # Tipos de validación
│   ├── execution.ts            # Tipos de ejecución
│   ├── connector.ts            # Tipos de conectores
│   ├── api.ts                  # Tipos de API
│   │   ├── Pagination types    # Paginación
│   │   ├── Error types         # Tipos de error
│   │   ├── Import/Export types # Import/Export
│   │   └── Response types      # Tipos de respuesta
│   └── index.ts                # Exportaciones
├── package.json
├── tsconfig.json
└── README.md
```

### `/packages/database` - Configuración de Base de Datos

```
packages/database/
├── src/
│   ├── client.ts               # Cliente de base de datos
│   ├── migrations.ts           # Gestión de migraciones
│   ├── seeds.ts                # Datos de prueba
│   └── utils.ts                # Utilidades
├── prisma/
│   ├── schema.prisma           # Esquema principal
│   │   ├── User model          # Usuarios y autenticación
│   │   ├── Organization model  # Organizaciones
│   │   ├── Workflow model      # Workflows principales
│   │   ├── WorkflowVersion model # Versionado de workflows
│   │   ├── WorkflowTemplate model # Templates reutilizables
│   │   ├── Connector model     # Conectores disponibles
│   │   ├── Language model      # Idiomas soportados
│   │   ├── TranslationKey model # Claves de traducción
│   │   └── Translation model   # Traducciones por idioma
│   └── migrations/
│       ├── 20241201000000_initial_schema/
│       ├── 20241202000000_add_i18n_tables/
│       └── 20250802082336_enhance_workflow_models/
├── package.json
└── README.md
```

### `/packages/connectors` - Framework de Conectores

```
packages/connectors/
├── src/
│   ├── base/                   # Clases base
│   │   ├── BaseConnector.ts
│   │   ├── BaseNode.ts
│   │   └── BaseEdge.ts
│   ├── registry/               # Registro de conectores
│   │   ├── ConnectorRegistry.ts
│   │   ├── NodeRegistry.ts
│   │   └── EdgeRegistry.ts
│   ├── validation/             # Validación
│   │   ├── SchemaValidator.ts
│   │   ├── ConfigValidator.ts
│   │   └── ExecutionValidator.ts
│   ├── execution/              # Ejecución
│   │   ├── ExecutionContext.ts
│   │   ├── ExecutionResult.ts
│   │   └── ExecutionError.ts
│   ├── types/                  # Tipos específicos
│   │   ├── ConnectorTypes.ts
│   │   ├── NodeTypes.ts
│   │   └── EdgeTypes.ts
│   └── utils/                  # Utilidades
│       ├── logger.ts
│       ├── errors.ts
│       └── helpers.ts
├── package.json
├── tsconfig.json
└── README.md
```

### `/packages/ui` - Componentes UI Compartidos

```
packages/ui/
├── src/
│   ├── components/             # Componentes base
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Table/
│   │   └── Chart/
│   ├── hooks/                  # Hooks compartidos
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── useClickOutside.ts
│   ├── utils/                  # Utilidades UI
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── animations.ts
│   └── index.ts                # Exportaciones
├── package.json
├── tsconfig.json
└── README.md
```

---

## Infrastructure Directory

### `/infrastructure/docker` - Configuración Docker

```
infrastructure/docker/
├── docker-compose.yml          # Desarrollo local
├── docker-compose.prod.yml     # Producción
├── Dockerfile.web              # Frontend
├── Dockerfile.api              # API Gateway
├── Dockerfile.workflow         # Workflow Service
├── Dockerfile.execution        # Execution Service
├── Dockerfile.monitoring       # Monitoring Service
└── .dockerignore
```

### `/infrastructure/k8s` - Kubernetes Manifests

```
infrastructure/k8s/
├── namespaces/
│   └── flowcraft.yaml
├── deployments/
│   ├── web.yaml
│   ├── api.yaml
│   ├── workflow-service.yaml
│   ├── execution-service.yaml
│   └── monitoring-service.yaml
├── services/
│   ├── web-service.yaml
│   ├── api-service.yaml
│   └── internal-services.yaml
├── ingress/
│   └── flowcraft-ingress.yaml
├── configmaps/
│   ├── app-config.yaml
│   └── connector-config.yaml
├── secrets/
│   └── app-secrets.yaml
├── persistent-volumes/
│   ├── postgres-pv.yaml
│   └── redis-pv.yaml
└── monitoring/
    ├── prometheus.yaml
    ├── grafana.yaml
    └── alertmanager.yaml
```

### `/infrastructure/terraform` - Infraestructura como Código

```
infrastructure/terraform/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── modules/
│   ├── eks/
│   ├── rds/
│   ├── redis/
│   ├── s3/
│   └── vpc/
├── variables.tf
├── main.tf
├── outputs.tf
└── versions.tf
```

---

## Configuración de Desarrollo

### Archivos de Configuración Raíz

```
flowcraft/
├── package.json                # Workspace principal
├── pnpm-workspace.yaml         # Configuración de workspace
├── .gitignore
├── .eslintrc.js               # Configuración ESLint
├── .prettierrc                # Configuración Prettier
├── tsconfig.json              # TypeScript base
├── tailwind.config.js         # Tailwind CSS
├── vite.config.ts             # Vite (frontend)
├── jest.config.js             # Testing
├── .env.example               # Variables de entorno
├── README.md                  # Documentación principal
└── CHANGELOG.md               # Historial de cambios
```

### Scripts de Desarrollo

```json
{
  "scripts": {
    "dev": "pnpm run --parallel dev",
    "build": "pnpm run --recursive build",
    "test": "pnpm run --recursive test",
    "lint": "pnpm run --recursive lint",
    "type-check": "pnpm run --recursive type-check",
    "clean": "pnpm run --recursive clean",
    "docker:build": "docker compose build",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "db:migrate": "pnpm --filter database migrate",
    "db:seed": "pnpm --filter database seed",
    "api:dev": "cd apps/api && pnpm dev",
    "web:dev": "cd apps/web && pnpm dev",
    "db:studio": "pnpm --filter database studio"
  }
}
```

---

## Estructura de Base de Datos

### Tablas Principales

```sql
-- Usuarios y Organizaciones
users (id, email, name, password_hash, organization_id, language_preference, created_at, updated_at)
organizations (id, name, plan, settings, created_at, updated_at)
user_roles (id, user_id, role, created_at)

-- Workflows
workflows (id, name, description, definition, user_id, organization_id, status, is_public, created_at, updated_at)
workflow_versions (id, workflow_id, definition, version_number, changelog, created_by, created_at)
workflow_templates (id, name, description, definition, category, organization_id, created_by, is_public, created_at, updated_at)

-- Ejecuciones
executions (id, workflow_id, status, started_at, completed_at, input_data, output_data, error_details)
execution_nodes (id, execution_id, node_id, status, started_at, completed_at, input_data, output_data)

-- Conectores
connectors (id, name, category, version, definition, is_active, created_at)
connector_configs (id, connector_id, user_id, config_data, created_at, updated_at)

-- Internacionalización (i18n)
languages (id, code, name, native_name, flag_emoji, is_active, is_default, created_at, updated_at)
translation_keys (id, key, namespace, category, description, is_active, created_at, updated_at)
translations (id, language_id, key_id, value, is_approved, approved_by, approved_at, created_at, updated_at)

-- Monitorización
execution_logs (id, execution_id, level, message, metadata, created_at)
metrics (id, name, value, labels, timestamp)
alerts (id, name, condition, status, created_at, resolved_at)
```

### Relaciones Clave
- **Workflows** → **Users** (created_by)
- **Workflows** → **Organizations** (belongs_to)
- **WorkflowVersions** → **Workflows** (version_of)
- **WorkflowTemplates** → **Organizations** (created_by_org)
- **Translations** → **Languages** (language)
- **Translations** → **TranslationKeys** (key)

---

## Convenciones de Nomenclatura

### Archivos y Directorios
- **Componentes React:** PascalCase (ej: `WorkflowEditor.tsx`)
- **Hooks:** camelCase con prefijo `use` (ej: `useWorkflow.ts`)
- **Servicios:** camelCase con sufijo `Service` (ej: `workflowService.ts`)
- **Tipos:** PascalCase (ej: `WorkflowDefinition.ts`)
- **Utilidades:** camelCase (ej: `formatDate.ts`)
- **Constantes:** UPPER_SNAKE_CASE (ej: `API_ENDPOINTS.ts`)

### Base de Datos
- **Tablas:** snake_case plural (ej: `workflow_executions`)
- **Columnas:** snake_case (ej: `created_at`)
- **Índices:** idx_tabla_columna (ej: `idx_workflows_user_id`)

### API Endpoints
- **Rutas:** kebab-case (ej: `/api/workflow-executions`)
- **Métodos:** RESTful (GET, POST, PUT, DELETE)
- **Versiones:** `/api/v1/workflows`

Esta estructura proporciona una base sólida y escalable para el desarrollo del proyecto FlowCraft, siguiendo las mejores prácticas de arquitectura de software y facilitando el trabajo en equipo.

---

## Funcionalidades Implementadas - Sprint 6-7

### Core API y Workflow CRUD

#### Backend Services Implementados
- **WorkflowService**: CRUD completo de workflows con versionado automático
- **WorkflowTemplateService**: Gestión de templates públicos y privados
- **WorkflowValidationService**: Validación robusta de definiciones de workflow
- **I18nService**: Sistema de traducciones con cache Redis

#### API Endpoints Implementados
- **Workflows**: 20+ endpoints para gestión completa
  - `GET /workflows` - Listar workflows con paginación
  - `POST /workflows` - Crear workflow con validación
  - `GET /workflows/:id` - Obtener workflow por ID
  - `PUT /workflows/:id` - Actualizar workflow
  - `DELETE /workflows/:id` - Eliminar workflow
  - `POST /workflows/:id/versions` - Crear nueva versión
  - `GET /workflows/:id/versions` - Listar versiones

- **Workflow Templates**: Gestión de templates
  - `GET /workflow-templates` - Listar templates
  - `POST /workflow-templates` - Crear template
  - `GET /workflow-templates/:id` - Obtener template
  - `PUT /workflow-templates/:id` - Actualizar template
  - `DELETE /workflow-templates/:id` - Eliminar template
  - `POST /workflow-templates/:id/duplicate` - Duplicar template

- **Import/Export**: Funcionalidad completa
  - `POST /import-export/import` - Importar workflow/template
  - `GET /import-export/export/:id` - Exportar workflow/template
  - `POST /import-export/validate` - Validar archivo de importación

#### Frontend Components Implementados
- **WorkflowList**: Lista de workflows con búsqueda y filtros
- **TemplateGallery**: Galería de templates con vista previa
- **API Client**: Cliente completo con manejo de errores
- **Zustand Stores**: Estado global para workflows y templates

#### Database Schema Enhancements
- **WorkflowVersion**: Versionado automático con changelog
- **WorkflowTemplate**: Templates con visibilidad pública/privada
- **Validation**: Esquemas de validación robustos
- **Performance**: Índices optimizados para consultas

#### API Documentation
- **OpenAPI/Swagger**: Documentación completa en `/docs`
- **Request/Response Validation**: Validación con Zod
- **Error Handling**: Manejo estandarizado de errores con i18n
- **Pagination**: Implementación de paginación

#### Testing & Quality
- **Type Safety**: TypeScript strict mode
- **Validation**: Validación de workflows en tiempo real
- **Error Handling**: Manejo robusto de errores
- **Performance**: Respuestas <200ms para operaciones CRUD

### Estado Actual del Proyecto
- ✅ **Sprint 1-2**: Infraestructura Base (100% completado)
- ✅ **Sprint 3-4**: Autenticación y Usuarios (90% completado)
- ✅ **Sprint 5**: Internacionalización (85% completado)
- ✅ **Sprint 6-7**: Core API y Workflow CRUD (100% completado)
- ⏳ **Sprint 5.5**: Completar Funcionalidades Pendientes
- ⏳ **Sprint 8-9**: Workflow Editor Foundation
- ⏳ **Sprint 10-11**: Conectores Esenciales (20)
- ⏳ **Sprint 12-13**: Motor de Ejecución
- ⏳ **Sprint 14-15**: Dashboard y Monitorización
- ⏳ **Sprint 16-17**: Testing, Polish y Deploy

**Progreso Total: 37.5% de la Fase 1 completada (7.5/20 semanas)** 