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
│   │   │   └── AuthProvider.tsx
│   │   ├── dashboard/          # Componentes del dashboard
│   │   │   ├── Overview.tsx
│   │   │   ├── WorkflowList.tsx
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
│   │   └── shared/             # Componentes compartidos
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Table.tsx
│   │       └── Loading.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useWorkflows.ts
│   │   ├── useExecutions.ts
│   │   └── useConnectors.ts
│   ├── services/               # Servicios de API
│   │   ├── api.ts              # Cliente API base
│   │   ├── auth.ts
│   │   ├── workflows.ts
│   │   ├── executions.ts
│   │   └── connectors.ts
│   ├── stores/                 # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   ├── workflowStore.ts
│   │   ├── executionStore.ts
│   │   └── uiStore.ts
│   ├── types/                  # Tipos TypeScript
│   │   ├── auth.ts
│   │   ├── workflow.ts
│   │   ├── execution.ts
│   │   └── connector.ts
│   ├── utils/                  # Utilidades
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── styles/                 # Estilos globales
│   │   ├── globals.css
│   │   └── tailwind.css
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
│   │   ├── workflows.ts
│   │   ├── executions.ts
│   │   ├── connectors.ts
│   │   └── health.ts
│   ├── services/               # Servicios de negocio
│   │   ├── authService.ts
│   │   ├── workflowService.ts
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
│   └── app.ts                  # Aplicación principal
├── package.json
├── tsconfig.json
├── .env.example
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
│   ├── workflow.ts             # Tipos de workflows
│   ├── execution.ts            # Tipos de ejecución
│   ├── connector.ts            # Tipos de conectores
│   ├── api.ts                  # Tipos de API
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
│   └── migrations/
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
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "db:migrate": "pnpm --filter database migrate",
    "db:seed": "pnpm --filter database seed"
  }
}
```

---

## Estructura de Base de Datos

### Tablas Principales

```sql
-- Usuarios y Organizaciones
users (id, email, name, password_hash, organization_id, created_at, updated_at)
organizations (id, name, plan, settings, created_at, updated_at)
user_roles (id, user_id, role, created_at)

-- Workflows
workflows (id, name, description, definition, user_id, organization_id, status, version, created_at, updated_at)
workflow_versions (id, workflow_id, definition, version, created_at)
workflow_templates (id, name, description, definition, category, created_at)

-- Ejecuciones
executions (id, workflow_id, status, started_at, completed_at, input_data, output_data, error_details)
execution_nodes (id, execution_id, node_id, status, started_at, completed_at, input_data, output_data)

-- Conectores
connectors (id, name, category, version, definition, is_active, created_at)
connector_configs (id, connector_id, user_id, config_data, created_at, updated_at)

-- Monitorización
execution_logs (id, execution_id, level, message, metadata, created_at)
metrics (id, name, value, labels, timestamp)
alerts (id, name, condition, status, created_at, resolved_at)
```

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