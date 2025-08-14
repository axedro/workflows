#!/bin/bash

# Stop Local Services Script
# This script stops local PostgreSQL and Redis services to avoid conflicts with Docker

set -e

echo "🛑 Stopping local PostgreSQL and Redis services..."

# Stop PostgreSQL if running via Homebrew
if brew services list | grep -q "postgresql.*started"; then
    echo "🛑 Stopping PostgreSQL via Homebrew..."
    brew services stop postgresql@14 2>/dev/null || true
    brew services stop postgresql@15 2>/dev/null || true
    brew services stop postgresql 2>/dev/null || true
    echo "✅ PostgreSQL stopped"
else
    echo "ℹ️  PostgreSQL not running via Homebrew"
fi

# Stop Redis if running via Homebrew
if brew services list | grep -q "redis.*started"; then
    echo "🛑 Stopping Redis via Homebrew..."
    brew services stop redis 2>/dev/null || true
    echo "✅ Redis stopped"
else
    echo "ℹ️  Redis not running via Homebrew"
fi

# Kill any remaining PostgreSQL processes (be careful!)
echo "🔍 Checking for remaining PostgreSQL processes..."
PG_PIDS=$(pgrep -f "postgres" | grep -v "postgres.*postgres" | grep -v "postgres.*distnoted" | grep -v "postgres.*mdbulkimport" || true)

if [ ! -z "$PG_PIDS" ]; then
    echo "⚠️  Found PostgreSQL processes: $PG_PIDS"
    echo "   You may need to manually stop these processes if they're not related to FlowCraft"
    echo "   Use: sudo pkill -f postgres (be careful!)"
else
    echo "✅ No conflicting PostgreSQL processes found"
fi

# Check if ports are free
echo "🔍 Checking port availability..."

if lsof -i :5432 >/dev/null 2>&1; then
    echo "⚠️  Port 5432 is still in use. You may need to stop the service manually."
    lsof -i :5432
else
    echo "✅ Port 5432 is free"
fi

if lsof -i :6379 >/dev/null 2>&1; then
    echo "⚠️  Port 6379 is still in use. You may need to stop the service manually."
    lsof -i :6379
else
    echo "✅ Port 6379 is free"
fi

echo ""
echo "🎉 Local services stopped!"
echo "📝 Next steps:"
echo "   1. Run: ./scripts/setup-docker.sh"
echo "   2. Or manually start Docker services: docker-compose -f infrastructure/docker/docker-compose.yml up -d"
