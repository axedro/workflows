# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Starting/Stopping Development Servers
- `./start-servers.sh` - Start all development servers (API on :3000, Frontend on :5173)
- `./stop-servers.sh` - Stop all development servers and clean logs
- `docker compose up -d` - Start PostgreSQL and Redis containers (required before starting servers)
- `docker compose down` - Stop Docker containers

### Package Management (pnpm workspace)
- `pnpm dev` - Start all apps in development mode concurrently
- `pnpm build` - Build all packages and apps recursively
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Run ESLint across all packages with auto-fix
- `pnpm type-check` - Run TypeScript type checking recursively
- `pnpm clean` - Clean build artifacts across all packages

### Individual App Development
- `pnpm --filter @flowcraft/api dev` - Start only API server
- `pnpm --filter @flowcraft/web dev` - Start only web frontend
- `pnpm --filter @flowcraft/api test` - Run API tests
- `pnpm --filter @flowcraft/web build` - Build frontend only

### Database Operations
- `pnpm --filter database migrate` - Run Prisma migrations
- `pnpm --filter database seed` - Seed database with test data
- `pnpm --filter database studio` - Open Prisma Studio

### Docker Operations
- `pnpm docker:build` - Build all Docker images
- `pnpm docker:up` - Start all services with Docker Compose
- `pnpm docker:down` - Stop all Docker services

## Architecture Overview

### Monorepo Structure
- **apps/**: Main applications (web frontend, api gateway)
- **packages/**: Shared libraries (shared-types, database, connectors, ui)
- **infrastructure/**: Docker, Kubernetes, and Terraform configs
- **scripts/**: Development and testing utilities

### Tech Stack
- **Frontend**: React 18 + TypeScript, React Flow, Tailwind CSS, Zustand, React Query
- **Backend**: Node.js + Fastify + TypeScript, PostgreSQL + Prisma, Redis
- **Build**: pnpm workspaces, Vite (frontend), tsx (backend)
- **Infrastructure**: Docker + Kubernetes, AWS EKS

### Key Applications

#### Frontend (apps/web)
- React SPA with TypeScript and Vite
- React Flow for visual workflow editor
- Zustand for state management, React Query for data fetching
- Tailwind CSS + shadcn/ui components
- Complete i18n system with ES/EN/NL support

#### API Gateway (apps/api)
- Fastify server with TypeScript
- JWT + OAuth 2.0 authentication
- Comprehensive workflow CRUD operations
- Template management system with import/export
- Full i18n backend support with Redis caching

### Database Schema
- **workflows**: Main workflow definitions with versioning
- **workflow_templates**: Reusable workflow templates (public/private)
- **workflow_versions**: Version history with changelog tracking
- **executions**: Workflow execution tracking and results
- **i18n tables**: translations, translation_keys, languages for multi-language support
- Uses UUIDs for primary keys, JSONB for flexible data storage

### Current Implementation Status
- ✅ Core infrastructure and authentication (90% complete)
- ✅ Workflow CRUD operations with versioning (100% complete)
- ✅ Template management system (100% complete)
- ✅ Import/export functionality (100% complete)
- ✅ Comprehensive i18n system (85% complete)
- ⏳ Workflow visual editor (in progress - Sprint 8-9)
- ⏳ Connector system (planned - Sprint 10-11)
- ⏳ Execution engine (planned - Sprint 12-13)

## Development Guidelines

### File Organization
- Use PascalCase for React components: `WorkflowEditor.tsx`
- Use camelCase for services and utilities: `workflowService.ts`
- Use kebab-case for directories: `workflow-editor/`
- Keep TypeScript types in dedicated `types/` directories
- All i18n files use namespace.locale.json format: `auth.es.json`

### Code Standards
- Strict TypeScript enabled across all packages
- ESLint + Prettier enforced via pre-commit hooks
- Interface-first design with comprehensive type definitions
- Error handling with custom error types and i18n support

### Testing
- Unit tests required for all business logic
- Integration tests for API endpoints
- Use Vitest for backend testing, React Testing Library for frontend

### API Conventions
- RESTful endpoints with consistent naming
- Zod validation for all request/response data
- Comprehensive error responses with i18n
- OpenAPI documentation available at `/docs`
- Pagination implemented for list endpoints

### Internationalization (i18n)
- Never use hardcoded strings - always use translation keys
- Organize keys by namespace: auth, common, dashboard, workflows
- Support for ES (Spanish), EN (English), NL (Dutch)
- Database-driven translations with Redis caching
- Language detection: browser → geolocation → default (ES)

### Workflow System Architecture
- Dynamic schema calculation based on node connections
- Real-time input/output schema generation
- Node-specific schema generators (Start, Action, Condition, etc.)
- Field mapping and data transformations
- Comprehensive validation service for workflow definitions

## Important Notes

### Known Issues and Solutions

#### Workflow Editor Node Persistence Issue (RESOLVED)
**Issue**: Workflow nodes would disappear when saved and reloaded, despite backend correctly saving and retrieving data.

**Root Cause**: Fastify response schema validation was stripping object properties from `definition` fields that didn't have `additionalProperties: true` in the schema definition.

**Solution**: Added `additionalProperties: true` to all definition object schemas in `/apps/api/src/routes/workflows.ts` for the following endpoints:
- POST `/` (Create workflow) - line 66
- GET `/:id` (Get workflow) - line 236
- PUT `/:id` (Update workflow) - line 347
- POST `/:id/duplicate` (Duplicate workflow) - line 543
- POST `/:id/versions` (Create version) - line 630
- GET `/:id/versions/:version` (Get version) - line 718

**Key Learning**: When using Fastify with JSON schema validation, always include `additionalProperties: true` for flexible object fields like workflow definitions that contain dynamic node/edge data.

### Environment Setup
- Requires Node.js 18+ and pnpm 8+
- PostgreSQL and Redis must be running (use Docker Compose)
- Environment variables defined in `env.example`

### Development Workflow
- Always start Docker containers before running servers
- Use the provided start/stop scripts for consistent development experience
- Check logs in `apps/api/api.log` and `apps/web/frontend.log`
- API health check available at `http://localhost:3000/health`

### Key Dependencies
- React Flow for workflow editor
- Prisma for database ORM
- Fastify for high-performance API
- Zustand for lightweight state management
- React Query for server state
- i18next for internationalization
- Zod for runtime validation

### Project Structure Notes
- This is a monorepo using pnpm workspaces
- Shared types are centralized in `packages/shared-types`
- UI components shared in `packages/ui`
- Database schema and migrations in `packages/database`
- Each app has its own Docker configuration

### Performance Considerations
- Redis caching for translations and frequently accessed data
- Database indices optimized for common queries
- React Query caching for API responses
- Lazy loading for translation namespaces
- Response times target <200ms for CRUD operations

### Security Implementation
- JWT authentication with refresh tokens
- OAuth 2.0 integration ready
- Secrets management system in place
- Rate limiting on all API endpoints
- Input validation and sanitization
- SQL injection prevention via Prisma

### DataConfigPanel Improvements (Recent)
- **Field Mapping Enhancements**: Removed duplicating "Add Mapping" bug, improved UX with contextual buttons
- **Custom Mappings**: Custom mappings now appear at top of list with visual highlighting for better UX
- **Index-based Identification**: Switched from sourceField-based to index-based mapping identification for better custom mapping support
- **UI Simplification**: Removed "Field Mapping Suggestions" and "Connectors" tabs to focus on core functionality
- **Code Documentation**: Extracted ConnectorSchemaViewer to `/docs/ConnectorSchemaViewer.tsx` for future wizard implementations

### Connector Schema Documentation
- ConnectorSchemaViewer component saved in `/docs/ConnectorSchemaViewer.tsx`
- Contains full schema reference for all connector types (HTTP, Email, Slack, etc.)
- Includes validation testing and import/export functionality
- Ready for integration into future connector wizards or documentation pages