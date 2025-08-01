# Arquitectura Técnica Detallada
## FlowCraft - Sistema de Workflows

### 1. Arquitectura General del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │   CLI Tools     │
│   (React SPA)   │    │   (React Native)│    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │    (Nginx)      │
                    └─────────────────┘
                                  │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Kong/Envoy)  │
                    └─────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────────────┐    ┌─────────────────┐    ┌───────────────┐
│ Workflow API  │    │ Execution API   │    │ Monitoring API│
│  (Node.js)    │    │   (Node.js)     │    │  (Node.js)    │
└───────────────┘    └─────────────────┘    └───────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                    ┌─────────────────┐
                    │  Message Queue  │
                    │ (Redis/RabbitMQ)│
                    └─────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────────────┐    ┌─────────────────┐    ┌───────────────┐
│ Worker Nodes  │    │   Scheduler     │    │  Log Service  │
│ (Kubernetes)  │    │   (Cron Jobs)   │    │ (ELK Stack)   │
└───────────────┘    └─────────────────┘    └───────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                    ┌─────────────────┐
                    │   Databases     │
                    │ PostgreSQL/Redis│
                    └─────────────────┘
```

### 2. Stack Tecnológico Detallado

#### 2.1 Frontend (React SPA)
```typescript
// Estructura del proyecto
src/
├── components/
│   ├── workflow-editor/
│   │   ├── NodeEditor.tsx
│   │   ├── FlowCanvas.tsx
│   │   └── PropertyPanel.tsx
│   ├── dashboard/
│   ├── monitoring/
│   └── shared/
├── hooks/
├── services/
├── stores/
└── types/

// Dependencias principales
{
  "react": "^18.2.0",
  "react-flow-renderer": "^11.10.0",
  "@tanstack/react-query": "^4.0.0",
  "zustand": "^4.4.0",
  "tailwindcss": "^3.3.0",
  "@radix-ui/react-dialog": "^1.0.0",
  "framer-motion": "^10.0.0"
}
```

#### 2.2 Backend Services

##### API Gateway
```typescript
// Kong configuration
services:
  - name: workflow-service
    url: http://workflow-api:3001
    routes:
      - name: workflows
        paths: ["/api/workflows"]
        methods: ["GET", "POST", "PUT", "DELETE"]
        plugins:
          - name: jwt
          - name: rate-limiting
            config:
              minute: 100
```

##### Workflow Service
```typescript
// src/services/workflow/app.ts
import Fastify from 'fastify'
import { PrismaClient } from '@prisma/client'

const server = Fastify({ logger: true })
const prisma = new PrismaClient()

// Workflow CRUD endpoints
server.post('/workflows', async (request, reply) => {
  const workflow = await prisma.workflow.create({
    data: request.body
  })
  return workflow
})

server.get('/workflows/:id/execute', async (request, reply) => {
  // Queue workflow for execution
  await workflowQueue.add('execute-workflow', {
    workflowId: request.params.id,
    userId: request.user.id
  })
  return { status: 'queued' }
})
```

##### Execution Engine
```typescript
// src/services/execution/executor.ts
export class WorkflowExecutor {
  async execute(workflow: Workflow, context: ExecutionContext) {
    const executionId = generateId()
    
    try {
      const graph = this.buildExecutionGraph(workflow)
      const result = await this.executeGraph(graph, context)
      
      await this.saveExecution(executionId, 'completed', result)
      return result
    } catch (error) {
      await this.saveExecution(executionId, 'failed', null, error)
      throw error
    }
  }

  private async executeGraph(graph: ExecutionGraph, context: ExecutionContext) {
    const nodeResults = new Map()
    
    for (const node of graph.getExecutionOrder()) {
      const nodeResult = await this.executeNode(node, nodeResults, context)
      nodeResults.set(node.id, nodeResult)
    }
    
    return nodeResults
  }
}
```

### 3. Esquema de Base de Datos

```sql
-- Usuarios y Organizaciones
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflows
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  status VARCHAR(50) DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ejecuciones
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  input_data JSONB,
  output_data JSONB,
  error_details JSONB,
  execution_time_ms INTEGER
);

-- Nodos de ejecución
CREATE TABLE execution_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES executions(id),
  node_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  input_data JSONB,
  output_data JSONB,
  error_details JSONB
);

-- Conectores
CREATE TABLE connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL,
  definition JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Logs
CREATE TABLE workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES executions(id),
  level VARCHAR(20) NOT NULL, -- 'debug', 'info', 'warn', 'error'
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Microservicios Detallados

#### 4.1 Workflow Service
```typescript
// Estructura del servicio
workflow-service/
├── src/
│   ├── controllers/
│   │   ├── WorkflowController.ts
│   │   └── TemplateController.ts
│   ├── services/
│   │   ├── WorkflowService.ts
│   │   └── ValidationService.ts
│   ├── models/
│   └── routes/
├── prisma/
│   └── schema.prisma
└── Dockerfile

// Funcionalidades principales
export class WorkflowService {
  async createWorkflow(data: CreateWorkflowDTO): Promise<Workflow>
  async updateWorkflow(id: string, data: UpdateWorkflowDTO): Promise<Workflow>
  async deleteWorkflow(id: string): Promise<void>
  async validateWorkflow(definition: WorkflowDefinition): Promise<ValidationResult>
  async duplicateWorkflow(id: string): Promise<Workflow>
}
```

#### 4.2 Execution Service
```typescript
// execution-service/
execution-service/
├── src/
│   ├── executor/
│   │   ├── WorkflowExecutor.ts
│   │   ├── NodeExecutor.ts
│   │   └── ErrorHandler.ts
│   ├── connectors/
│   │   ├── BaseConnector.ts
│   │   ├── HttpConnector.ts
│   │   └── DatabaseConnector.ts
│   ├── queue/
│   │   ├── WorkflowQueue.ts
│   │   └── workers/
│   └── utils/
└── Dockerfile

// Worker de ejecución
export class ExecutionWorker {
  async processJob(job: Job<ExecuteWorkflowData>) {
    const { workflowId, executionId, inputData } = job.data
    
    try {
      const workflow = await this.workflowService.getWorkflow(workflowId)
      const executor = new WorkflowExecutor(workflow)
      
      const result = await executor.execute(inputData)
      
      await this.updateExecutionStatus(executionId, 'completed', result)
    } catch (error) {
      await this.updateExecutionStatus(executionId, 'failed', null, error)
      throw error
    }
  }
}
```

#### 4.3 Monitoring Service
```typescript
// monitoring-service/
monitoring-service/
├── src/
│   ├── collectors/
│   │   ├── MetricsCollector.ts
│   │   └── LogCollector.ts
│   ├── alerts/
│   │   ├── AlertManager.ts
│   │   └── NotificationService.ts
│   ├── dashboards/
│   └── analytics/
└── Dockerfile

// Métricas principales
export interface WorkflowMetrics {
  executionsPerMinute: number
  averageExecutionTime: number
  errorRate: number
  successRate: number
  queueLength: number
  activeWorkers: number
}
```

### 5. Sistema de Conectores

#### 5.1 Arquitectura de Conectores
```typescript
// Base Connector Interface
export abstract class BaseConnector {
  abstract name: string
  abstract category: string
  abstract version: string
  
  abstract async execute(
    config: ConnectorConfig,
    input: any,
    context: ExecutionContext
  ): Promise<any>
  
  abstract validate(config: ConnectorConfig): ValidationResult
  abstract getSchema(): ConnectorSchema
}

// HTTP Connector Example
export class HttpConnector extends BaseConnector {
  name = 'http'
  category = 'communication'
  version = '1.0.0'
  
  async execute(config: HttpConnectorConfig, input: any, context: ExecutionContext) {
    const { method, url, headers, body } = config
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: method !== 'GET' ? JSON.stringify(body || input) : undefined
    })
    
    if (!response.ok) {
      throw new ConnectorError(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  }
}
```

#### 5.2 Registro de Conectores
```typescript
// Connector Registry
export class ConnectorRegistry {
  private connectors = new Map<string, BaseConnector>()
  
  register(connector: BaseConnector) {
    this.connectors.set(connector.name, connector)
  }
  
  get(name: string): BaseConnector | undefined {
    return this.connectors.get(name)
  }
  
  list(): ConnectorInfo[] {
    return Array.from(this.connectors.values()).map(c => ({
      name: c.name,
      category: c.category,
      version: c.version,
      schema: c.getSchema()
    }))
  }
}

// Inicialización
const registry = new ConnectorRegistry()
registry.register(new HttpConnector())
registry.register(new SlackConnector())
registry.register(new GmailConnector())
// ... más conectores
```

### 6. Sistema de Monitorización

#### 6.1 Métricas con Prometheus
```typescript
// metrics/prometheus.ts
import prometheus from 'prom-client'

export const workflowExecutions = new prometheus.Counter({
  name: 'workflow_executions_total',
  help: 'Total number of workflow executions',
  labelNames: ['workflow_id', 'status', 'user_id']
})

export const executionDuration = new prometheus.Histogram({
  name: 'workflow_execution_duration_seconds',
  help: 'Duration of workflow executions',
  labelNames: ['workflow_id'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300]
})

export const queueLength = new prometheus.Gauge({
  name: 'workflow_queue_length',
  help: 'Number of workflows in queue'
})
```

#### 6.2 Logging con Winston
```typescript
// logging/logger.ts
import winston from 'winston'
import { ElasticsearchTransport } from 'winston-elasticsearch'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'workflow-engine' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: process.env.ELASTICSEARCH_URL }
    })
  ]
})
```

### 7. Deployment con Kubernetes

#### 7.1 Configuración de Kubernetes
```yaml
# k8s/workflow-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workflow-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: workflow-service
  template:
    metadata:
      labels:
        app: workflow-service
    spec:
      containers:
      - name: workflow-service
        image: flowcraft/workflow-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: workflow-service
spec:
  selector:
    app: workflow-service
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

#### 7.2 Helm Chart
```yaml
# Chart.yaml
apiVersion: v2
name: flowcraft
version: 0.1.0
description: FlowCraft Workflow Engine

# values.yaml
replicaCount: 3

image:
  repository: flowcraft/workflow-service
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.flowcraft.io
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: flowcraft-tls
      hosts:
        - api.flowcraft.io

postgresql:
  enabled: true
  auth:
    database: flowcraft
    username: flowcraft

redis:
  enabled: true
  auth:
    enabled: false
```

### 8. Plan de Implementación por Fases

#### Fase 1: Core MVP (Meses 1-4)
**Sprint 1-2: Infraestructura Base**
- Setup de repositorios y CI/CD
- Configuración de Kubernetes local
- Base de datos y esquemas iniciales
- Autenticación JWT

**Sprint 3-4: Editor Básico**
- Interfaz de workflow editor
- CRUD de workflows
- Sistema básico de nodos
- 5 conectores esenciales (HTTP, Email, Webhook, Timer, Condition)

**Sprint 5-6: Ejecución Simple**
- Motor de ejecución single-threaded
- Queue system básico
- Logs y monitorización básica
- Dashboard simple

**Sprint 7-8: Testing y Pulimiento**
- Tests unitarios e integración
- Documentación básica
- Optimización de performance
- Bug fixes y UX improvements

#### Fase 2: Escalabilidad (Meses 5-8)
**Sprint 9-10: Ejecución Distribuida**
- Sistema de workers distribuidos
- Load balancing de ejecuciones
- Retry logic y error handling
- Horizontal scaling

**Sprint 11-12: Más Conectores**
- 30 conectores adicionales
- SDK para conectores custom
- Marketplace básico
- Testing de conectores

**Sprint 13-14: Monitorización Avanzada**
- Métricas detalladas
- Alertas inteligentes
- Dashboard avanzado
- Performance analytics

**Sprint 15-16: Colaboración**
- Workspaces y equipos
- Sharing de workflows
- Control de permisos
- Comentarios y versioning

### 9. Consideraciones de Seguridad

#### 9.1 Autenticación y Autorización
```typescript
// auth/jwt.ts
export class JWTService {
  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h',
      issuer: 'flowcraft'
    })
  }
  
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
  }
}

// middleware/auth.ts
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return reply.code(401).send({ error: 'Token required' })
  }
  
  try {
    const payload = jwtService.verifyToken(token)
    request.user = payload
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' })
  }
}
```

#### 9.2 Secrets Management
```typescript
// secrets/manager.ts
export class SecretsManager {
  private vault: VaultClient
  
  async storeSecret(key: string, value: string, userId: string): Promise<void> {
    const encrypted = await this.encrypt(value, userId)
    await this.vault.write(`secrets/${userId}/${key}`, { value: encrypted })
  }
  
  async getSecret(key: string, userId: string): Promise<string> {
    const encrypted = await this.vault.read(`secrets/${userId}/${key}`)
    return await this.decrypt(encrypted.value, userId)
  }
  
  private async encrypt(value: string, userId: string): Promise<string> {
    const key = await this.getUserKey(userId)
    const cipher = crypto.createCipher('aes-256-gcm', key)
    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
  }
  
  private async decrypt(encrypted: string, userId: string): Promise<string> {
    const key = await this.getUserKey(userId)
    const decipher = crypto.createDecipher('aes-256-gcm', key)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}
```

### 10. Testing Strategy

#### 10.1 Unit Tests
```typescript
// tests/services/WorkflowService.test.ts
import { WorkflowService } from '../../src/services/WorkflowService'
import { PrismaClient } from '@prisma/client'

jest.mock('@prisma/client')

describe('WorkflowService', () => {
  let workflowService: WorkflowService
  let prisma: jest.Mocked<PrismaClient>

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>
    workflowService = new WorkflowService(prisma)
  })

  describe('createWorkflow', () => {
    it('should create a workflow with valid data', async () => {
      const workflowData = {
        name: 'Test Workflow',
        description: 'Test Description',
        definition: { nodes: [], edges: [] }
      }

      prisma.workflow.create.mockResolvedValue({
        id: '123',
        ...workflowData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await workflowService.createWorkflow(workflowData)

      expect(result).toHaveProperty('id', '123')
      expect(prisma.workflow.create).toHaveBeenCalledWith({
        data: workflowData
      })
    })

    it('should throw error for invalid workflow definition', async () => {
      const invalidData = {
        name: 'Test',
        definition: { nodes: 'invalid' }
      }

      await expect(workflowService.createWorkflow(invalidData))
        .rejects.toThrow('Invalid workflow definition')
    })
  })
})
```

#### 10.2 Integration Tests
```typescript
// tests/integration/workflow-execution.test.ts
import { FastifyInstance } from 'fastify'
import { buildApp } from '../../src/app'

describe('Workflow Execution Integration', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp({ logger: false })
    await app.ready()
  })

  afterAll(() => app.close())

  it('should execute a simple workflow end-to-end', async () => {
    // Create workflow
    const createResponse = await app.inject({
      method: 'POST',
      url: '/workflows',
      headers: {
        authorization: 'Bearer test-token'
      },
      payload: {
        name: 'Simple HTTP Workflow',
        definition: {
          nodes: [
            {
              id: 'http-1',
              type: 'http',
              config: {
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts/1'
              }
            }
          ],
          edges: []
        }
      }
    })

    expect(createResponse.statusCode).toBe(201)
    const workflow = JSON.parse(createResponse.body)

    // Execute workflow
    const executeResponse = await app.inject({
      method: 'POST',
      url: `/workflows/${workflow.id}/execute`,
      headers: {
        authorization: 'Bearer test-token'
      }
    })

    expect(executeResponse.statusCode).toBe(200)
    
    // Wait for execution to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check execution result
    const statusResponse = await app.inject({
      method: 'GET',
      url: `/executions/${workflow.id}`,
      headers: {
        authorization: 'Bearer test-token'
      }
    })

    expect(statusResponse.statusCode).toBe(200)
    const execution = JSON.parse(statusResponse.body)
    expect(execution.status).toBe('completed')
  })
})
```

#### 10.3 Load Tests
```typescript
// tests/load/workflow-execution.load.test.ts
import { check, sleep } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'],
    http_req_failed: ['rate<0.1']
  }
}

export default function() {
  const payload = JSON.stringify({
    name: `Load Test Workflow ${__VU}-${__ITER}`,
    definition: {
      nodes: [
        {
          id: 'delay-1',
          type: 'delay',
          config: { duration: 1000 }
        }
      ],
      edges: []
    }
  })

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer load-test-token'
    }
  }

  // Create workflow
  let response = http.post('http://api.flowcraft.test/workflows', payload, params)
  check(response, {
    'workflow created': (r) => r.status === 201
  })

  if (response.status === 201) {
    const workflow = JSON.parse(response.body)
    
    // Execute workflow
    response = http.post(`http://api.flowcraft.test/workflows/${workflow.id}/execute`, null, params)
    check(response, {
      'workflow executed': (r) => r.status === 200
    })
  }

  sleep(1)
}
```

### 11. CI/CD Pipeline

#### 11.1 GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/flowcraft_test
        REDIS_URL: redis://localhost:6379
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/flowcraft_test
        REDIS_URL: redis://localhost:6379
    
    - name: Build application
      run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build-and-deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: flowcraft-api
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
    
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name flowcraft-cluster
        kubectl set image deployment/workflow-service workflow-service=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        kubectl rollout status deployment/workflow-service
```

#### 11.2 Dockerfile Multi-stage
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "dist/index.js"]
```

### 12. Monitorización en Producción

#### 12.1 Configuración de Grafana Dashboards
```json
{
  "dashboard": {
    "title": "FlowCraft - Workflow Metrics",
    "panels": [
      {
        "title": "Workflow Executions per Minute",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(workflow_executions_total[5m]) * 60",
            "legendFormat": "Executions/min"
          }
        ]
      },
      {
        "title": "Average Execution Duration",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.5, workflow_execution_duration_seconds_bucket)",
            "legendFormat": "p50"
          },
          {
            "expr": "histogram_quantile(0.95, workflow_execution_duration_seconds_bucket)",
            "legendFormat": "p95"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(workflow_executions_total{status=\"failed\"}[5m]) / rate(workflow_executions_total[5m]) * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      },
      {
        "title": "Queue Length",
        "type": "graph",
        "targets": [
          {
            "expr": "workflow_queue_length",
            "legendFormat": "Queue Length"
          }
        ]
      }
    ]
  }
}
```

#### 12.2 Alertas con AlertManager
```yaml
# alertmanager/rules.yml
groups:
- name: flowcraft-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(workflow_executions_total{status="failed"}[5m]) / rate(workflow_executions_total[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"

  - alert: LongQueueLength
    expr: workflow_queue_length > 1000
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Workflow queue is backing up"
      description: "Queue length is {{ $value }} workflows"

  - alert: SlowExecutions
    expr: histogram_quantile(0.95, workflow_execution_duration_seconds_bucket) > 300
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Slow workflow executions detected"
      description: "95th percentile execution time is {{ $value }}s"

  - alert: ServiceDown
    expr: up{job="workflow-service"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service is down"
      description: "{{ $labels.instance }} has been down for more than 1 minute"
```

### 13. Documentación y SDK

#### 13.1 API Documentation (OpenAPI)
```yaml
# docs/openapi.yml
openapi: 3.0.0
info:
  title: FlowCraft API
  version: 1.0.0
  description: API for managing workflows and executions

paths:
  /workflows:
    get:
      summary: List workflows
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of workflows
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Workflow'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: Create workflow
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateWorkflow'
      responses:
        '201':
          description: Workflow created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Workflow'

components:
  schemas:
    Workflow:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        definition:
          type: object
        status:
          type: string
          enum: [draft, active, paused]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

#### 13.2 JavaScript SDK
```typescript
// sdk/flowcraft-sdk/src/FlowCraftClient.ts
export class FlowCraftClient {
  private baseUrl: string
  private apiKey: string

  constructor(options: { baseUrl: string; apiKey: string }) {
    this.baseUrl = options.baseUrl
    this.apiKey = options.apiKey
  }

  // Workflows
  async getWorkflows(options?: ListOptions): Promise<PaginatedResponse<Workflow>> {
    const params = new URLSearchParams(options as any)
    const response = await fetch(`${this.baseUrl}/workflows?${params}`, {
      headers: this.getHeaders()
    })
    return response.json()
  }

  async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    const response = await fetch(`${this.baseUrl}/workflows`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    })
    return response.json()
  }

  async executeWorkflow(workflowId: string, input?: any): Promise<Execution> {
    const response = await fetch(`${this.baseUrl}/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ input })
    })
    return response.json()
  }

  // Executions
  async getExecution(executionId: string): Promise<Execution> {
    const response = await fetch(`${this.baseUrl}/executions/${executionId}`, {
      headers: this.getHeaders()
    })
    return response.json()
  }

  async waitForExecution(executionId: string, timeout = 60000): Promise<Execution> {
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      const execution = await this.getExecution(executionId)
      
      if (execution.status === 'completed' || execution.status === 'failed') {
        return execution
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('Execution timeout')
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    }
  }
}

// Usage example
const client = new FlowCraftClient({
  baseUrl: 'https://api.flowcraft.io',
  apiKey: 'your-api-key'
})

const workflow = await client.createWorkflow({
  name: 'My Workflow',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'webhook',
        config: {}
      },
      {
        id: 'process',
        type: 'http',
        config: {
          method: 'POST',
          url: 'https://api.example.com/process'
        }
      }
    ],
    edges: [
      { from: 'start', to: 'process' }
    ]
  }
})

const execution = await client.executeWorkflow(workflow.id, { data: 'test' })
const result = await client.waitForExecution(execution.id)
```

### 14. Estrategia de Escalabilidad

#### 14.1 Horizontal Scaling
```yaml
# k8s/horizontal-pod-autoscaler.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: workflow-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: workflow-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: workflow_queue_length
      target:
        type: AverageValue
        averageValue: "10"

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: execution-workers-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: execution-workers
  minReplicas: 5
  maxReplicas: 100
  metrics:
  - type: Pods
    pods:
      metric:
        name: active_jobs_per_worker
      target:
        type: AverageValue
        averageValue: "5"
```

#### 14.2 Database Scaling
```typescript
// database/read-replicas.ts
export class DatabaseManager {
  private writeDb: PrismaClient
  private readReplicas: PrismaClient[]
  private currentReplicaIndex = 0

  constructor() {
    this.writeDb = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_WRITE_URL }
      }
    })

    this.readReplicas = [
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_READ_REPLICA_1_URL }
        }
      }),
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_READ_REPLICA_2_URL }
        }
      })
    ]
  }

  getWriteClient(): PrismaClient {
    return this.writeDb
  }

  getReadClient(): PrismaClient {
    const replica = this.readReplicas[this.currentReplicaIndex]
    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.readReplicas.length
    return replica
  }
}
```

### 15. Costos y Presupuesto Detallado

#### 15.1 Infraestructura Cloud (AWS)
```yaml
# Estimación mensual de costos AWS
compute:
  eks_cluster: $73  # Control plane
  worker_nodes:
    - instance_type: m5.large
      count: 10
      cost_per_hour: $0.096
      monthly_cost: $691
  
  total_compute: $764

storage:
  rds_postgresql:
    - instance: db.r5.xlarge
      storage: 1000GB
      monthly_cost: $350
  
  redis_elasticache:
    - instance: cache.r5.large
      monthly_cost: $150
  
  s3_storage: $50
  ebs_volumes: $100
  
  total_storage: $650

networking:
  load_balancer: $20
  data_transfer: $100
  cloudfront_cdn: $50
  
  total_networking: $170

monitoring:
  cloudwatch: $80
  elasticsearch: $200
  
  total_monitoring: $280

total_monthly_aws: $1,864
total_annual_aws: $22,368
```

#### 15.2 Personal y Desarrollo
```yaml
# Costos anuales de personal (USD)
team_salaries:
  tech_lead: $180,000
  senior_backend_engineers: $450,000  # 3 x $150k
  senior_frontend_engineers: $300,000  # 2 x $150k
  devops_engineer: $140,000
  integration_engineers: $240,000  # 2 x $120k
  qa_engineer: $100,000
  security_engineer: $160,000
  data_engineer: $130,000

benefits_and_taxes: $468,000  # 30% of salaries

tools_and_licenses:
  development_tools: $24,000
  security_tools: $36,000
  monitoring_tools: $12,000
  design_tools: $6,000

office_and_equipment:
  co_working_space: $36,000
  equipment: $24,000

total_annual_personnel: $2,206,000
```

Este plan detallado proporciona una base sólida para el desarrollo de FlowCraft. La arquitectura es escalable, las tecnologías son modernas y probadas, y el plan de implementación está estructurado en fases manejables. ¿Te gustaría que profundice en alguna sección específica o que ajuste algún aspecto del plan?