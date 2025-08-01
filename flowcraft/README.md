# FlowCraft - Workflow Automation Platform

FlowCraft is a modern workflow automation platform that combines no-code visual interface with pro-code capabilities. Create, execute, and monitor complex workflows through an intuitive visual interface, integrating with 200+ services.

## 🚀 Features

- **Visual Workflow Editor** - Drag & drop interface for creating workflows
- **200+ Connectors** - Pre-built integrations with popular services
- **Real-time Execution** - Monitor workflow execution in real-time
- **Scalable Architecture** - Built with microservices and cloud-native technologies
- **Enterprise Ready** - Security, monitoring, and collaboration features

## 🏗️ Architecture

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
                    │ (Redis/BullMQ)  │
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

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **React Flow** (visual workflow editor)
- **Tailwind CSS** + shadcn/ui components
- **Zustand** (state management)
- **React Query** (data fetching)
- **Framer Motion** (animations)

### Backend
- **Node.js** + TypeScript + Fastify
- **PostgreSQL** (metadata) + Redis (cache/queues)
- **Prisma ORM**
- **JWT** + OAuth 2.0 authentication
- **Docker** + Kubernetes deployment

### Execution Engine
- **Bull/BullMQ** (job queues)
- **Worker nodes** (scalable)
- **Event sourcing** pattern
- **Distributed locks** (Redis)

### Monitoring
- **Prometheus** + Grafana (metrics)
- **ELK Stack** (logs)
- **Jaeger** (tracing)

## 📦 Project Structure

```
flowcraft/
├── apps/                       # Applications
│   ├── web/                    # Frontend React SPA
│   ├── api/                    # Backend API Gateway
│   ├── workflow-service/       # Workflow management service
│   ├── execution-service/      # Workflow execution service
│   └── monitoring-service/     # Monitoring and analytics service
├── packages/                   # Shared packages
│   ├── shared-types/           # TypeScript types
│   ├── database/               # Database configuration
│   ├── connectors/             # Connector framework
│   └── ui/                     # Shared UI components
├── infrastructure/             # Infrastructure configuration
│   ├── docker/                 # Docker configurations
│   ├── k8s/                    # Kubernetes manifests
│   └── terraform/              # Infrastructure as code
└── docs/                       # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flowcraft
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development services**
   ```bash
   # Start PostgreSQL and Redis
   pnpm docker:up
   
   # Run database migrations
   pnpm db:migrate
   
   # Generate Prisma client
   pnpm --filter database generate
   ```

5. **Start development servers**
   ```bash
   # Start all services in development mode
   pnpm dev
   ```

6. **Open the application**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000
   - Prisma Studio: http://localhost:5555

### Production Deployment

```bash
# Build all packages
pnpm build

# Deploy to Kubernetes
kubectl apply -f infrastructure/k8s/

# Or use Terraform
cd infrastructure/terraform
terraform init
terraform apply
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Connector Development](./docs/connectors.md)
- [Deployment Guide](./docs/deployment.md)
- [Architecture Overview](./docs/architecture.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@flowcraft.io
- 💬 Discord: [FlowCraft Community](https://discord.gg/flowcraft)
- 📖 Documentation: [docs.flowcraft.io](https://docs.flowcraft.io)
- 🐛 Issues: [GitHub Issues](https://github.com/flowcraft/flowcraft/issues)

## 🗺️ Roadmap

### Phase 1: MVP (Months 1-4) ✅
- [x] Basic workflow editor
- [x] 20 essential connectors
- [x] Simple execution engine
- [x] Basic dashboard

### Phase 2: Core Features (Months 5-8) 🚧
- [ ] Distributed execution
- [ ] 50+ connectors
- [ ] Advanced monitoring
- [ ] Collaboration features

### Phase 3: Enterprise (Months 9-12) 📋
- [ ] 200+ connectors
- [ ] Advanced security
- [ ] Enterprise SSO
- [ ] White-label options

### Phase 4: AI Integration (Months 13+) 🔮
- [ ] AI-powered suggestions
- [ ] Natural language workflows
- [ ] Predictive analytics
- [ ] Auto-optimization

---

Made with ❤️ by the FlowCraft Team 