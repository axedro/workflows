#!/bin/bash

# FlowCraft Docker Setup Script
# This script sets up Docker services for PostgreSQL, Redis, and Prisma

set -e

# Add Docker to PATH
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

echo "🐳 Setting up FlowCraft Docker services..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first:"
    echo "   https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is available and running"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f infrastructure/docker/docker-compose.yml down 2>/dev/null || true

# Remove any existing containers and volumes (optional - uncomment if you want fresh start)
# echo "🧹 Removing existing containers and volumes..."
# docker compose -f infrastructure/docker/docker-compose.yml down -v 2>/dev/null || true

# Build and start services
echo "🚀 Starting Docker services..."
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker compose -f infrastructure/docker/docker-compose.yml exec -T postgres pg_isready -U flowcraft -d flowcraft; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

# Check Redis
if docker compose -f infrastructure/docker/docker-compose.yml exec -T redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
    exit 1
fi

echo "🎉 All services are ready!"
echo ""
echo "📊 Service Status:"
echo "   PostgreSQL: localhost:5432 (flowcraft/flowcraft123)"
echo "   Redis: localhost:6379"
echo "   Prisma Studio: localhost:5555"
echo ""
echo "🔧 Next steps:"
echo "   1. Run database migrations: pnpm run db:migrate"
echo "   2. Seed the database: pnpm run db:seed"
echo "   3. Start the development servers: pnpm run dev"
