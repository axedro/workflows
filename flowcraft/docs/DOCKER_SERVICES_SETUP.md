# Docker Services Setup Guide

## Overview

This guide explains how to set up PostgreSQL, Redis, and Prisma services using Docker for the FlowCraft project. The goal is to consolidate all database and cache services in Docker to avoid conflicts with local installations.

## Current Issues

### ❌ Problems Identified

1. **PostgreSQL Duplication**: Local PostgreSQL installation conflicts with Docker PostgreSQL
2. **Port Conflicts**: Both local and Docker services try to use ports 5432 and 6379
3. **Docker Not Available**: Docker commands not in PATH
4. **Configuration Inconsistency**: Environment files point to localhost but Docker services may not be running

### ✅ Solution

Consolidate all services in Docker containers with proper configuration and scripts.

## Services Configuration

### Docker Compose Services

```yaml
# PostgreSQL Database
postgres:
  image: postgres:15-alpine
  container_name: flowcraft-postgres
  environment:
    POSTGRES_DB: flowcraft
    POSTGRES_USER: flowcraft
    POSTGRES_PASSWORD: flowcraft123
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./init.sql:/docker-entrypoint-initdb.d/init.sql

# Redis Cache
redis:
  image: redis:7-alpine
  container_name: flowcraft-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data

# Prisma Studio
prisma-studio:
  image: node:18-alpine
  container_name: flowcraft-prisma-studio
  ports:
    - "5555:5555"
  environment:
    DATABASE_URL: postgresql://flowcraft:flowcraft123@postgres:5432/flowcraft
```

### Environment Configuration

**Root .env file**:
```env
# Database
DATABASE_URL="postgresql://flowcraft:flowcraft123@localhost:5432/flowcraft"

# Redis
REDIS_URL="redis://localhost:6379"
```

## Setup Instructions

### Prerequisites

1. **Install Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. **Start Docker Desktop**: Ensure Docker is running
3. **Verify Docker**: Run `docker --version` to confirm installation

### Step 1: Stop Local Services

Stop any local PostgreSQL and Redis services to avoid conflicts:

```bash
# Stop local services
pnpm run docker:stop-local

# Or run manually
./scripts/stop-local-services.sh
```

### Step 2: Setup Docker Services

Start the Docker services:

```bash
# Setup and start Docker services
pnpm run docker:setup

# Or run manually
./scripts/setup-docker.sh
```

### Step 3: Verify Services

Check that all services are running:

```bash
# Check service status
docker-compose -f infrastructure/docker/docker-compose.yml ps

# Check logs
pnpm run docker:logs
```

### Step 4: Database Setup

Initialize the database:

```bash
# Run migrations
pnpm run db:migrate

# Seed the database
pnpm run db:seed

# Open Prisma Studio (optional)
pnpm run db:studio
```

## Available Scripts

### Docker Management

```bash
# Setup Docker services
pnpm run docker:setup

# Stop local services
pnpm run docker:stop-local

# Start Docker services
pnpm run docker:up

# Stop Docker services
pnpm run docker:down

# View logs
pnpm run docker:logs

# Restart services
pnpm run docker:restart

# Build services
pnpm run docker:build
```

### Database Management

```bash
# Run migrations
pnpm run db:migrate

# Seed database
pnpm run db:seed

# Open Prisma Studio
pnpm run db:studio
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| PostgreSQL | `localhost:5432` | `flowcraft/flowcraft123` |
| Redis | `localhost:6379` | No authentication |
| Prisma Studio | `http://localhost:5555` | Web interface |

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
lsof -i :5432
lsof -i :6379

# Stop conflicting services
pnpm run docker:stop-local
```

#### 2. Docker Not Found

```bash
# Install Docker Desktop
# https://www.docker.com/products/docker-desktop/

# Add Docker to PATH (if needed)
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
```

#### 3. Database Connection Issues

```bash
# Check if services are running
docker-compose -f infrastructure/docker/docker-compose.yml ps

# Check service logs
pnpm run docker:logs

# Restart services
pnpm run docker:restart
```

#### 4. Permission Issues

```bash
# Fix Docker permissions
sudo chown $USER:$USER ~/.docker
sudo chmod 666 /var/run/docker.sock
```

### Reset Everything

If you need to start fresh:

```bash
# Stop and remove everything
docker-compose -f infrastructure/docker/docker-compose.yml down -v

# Remove volumes
docker volume rm flowcraft_postgres_data flowcraft_redis_data

# Start fresh
pnpm run docker:setup
```

## Development Workflow

### Daily Development

1. **Start services**: `pnpm run docker:up`
2. **Start development**: `pnpm run dev`
3. **Stop services**: `pnpm run docker:down`

### Database Changes

1. **Modify schema**: Edit `packages/database/prisma/schema.prisma`
2. **Generate migration**: `pnpm --filter database migrate:dev`
3. **Apply migration**: `pnpm run db:migrate`

### Monitoring

- **Database**: Use Prisma Studio at `http://localhost:5555`
- **Logs**: `pnpm run docker:logs`
- **Status**: `docker-compose -f infrastructure/docker/docker-compose.yml ps`

## Best Practices

1. **Always use Docker**: Avoid local PostgreSQL/Redis installations
2. **Check ports**: Ensure ports 5432 and 6379 are free
3. **Use scripts**: Use the provided npm scripts for consistency
4. **Monitor logs**: Check logs when troubleshooting
5. **Backup data**: Use Docker volumes for data persistence

## Files Modified

- `infrastructure/docker/docker-compose.yml` - Docker services configuration
- `infrastructure/docker/init.sql` - Database initialization
- `scripts/setup-docker.sh` - Docker setup script
- `scripts/stop-local-services.sh` - Local services cleanup
- `package.json` - Added Docker scripts
- `.env` - Environment configuration
- `docs/DOCKER_SERVICES_SETUP.md` - This documentation
