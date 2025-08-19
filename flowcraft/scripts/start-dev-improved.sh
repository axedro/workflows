#!/bin/bash

# FlowCraft Development Startup Script (Improved Version)
# This script starts all services needed for development with proper cleanup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Add Docker to PATH
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# Store the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to cleanup existing processes
cleanup_existing_processes() {
    echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
    
    # Kill processes by PID files first
    local pid_files=(".api.pid" ".web.pid" ".execution.pid" ".prisma.pid")
    for pid_file in "${pid_files[@]}"; do
        if [ -f "$ROOT_DIR/$pid_file" ]; then
            local pid=$(cat "$ROOT_DIR/$pid_file")
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${YELLOW}🛑 Killing process from $pid_file (PID: $pid)...${NC}"
                kill -9 $pid 2>/dev/null || true
            fi
            rm -f "$ROOT_DIR/$pid_file"
        fi
    done
    
    # Kill processes on our specific ports
    local ports=(3000 5173 3001 5555)
    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            echo -e "${YELLOW}🛑 Killing process on port $port...${NC}"
            lsof -ti :$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Kill any remaining tsx processes for our project
    pkill -f "tsx.*src/index.ts" 2>/dev/null || true
    pkill -f "pnpm.*dev.*flowcraft" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service to be ready on port $port...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            echo -e "${GREEN}✅ $service is ready on port $port${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service failed to start on port $port${NC}"
    return 1
}

# Function to handle script interruption
cleanup_on_exit() {
    echo -e "\n${YELLOW}🛑 Received interrupt signal. Cleaning up...${NC}"
    cleanup_existing_processes
    echo -e "${GREEN}✅ Cleanup completed. Exiting.${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup_on_exit INT TERM

echo -e "${BLUE}🚀 Starting FlowCraft Development Environment (Improved)${NC}"
echo "=================================================="

# Ensure we are at repo root before any relative paths
cd "$ROOT_DIR"

# Step 0: Cleanup existing processes
cleanup_existing_processes

# Step 1: Check Docker services
echo -e "${BLUE}📋 Step 1: Checking Docker services...${NC}"
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# Check if PostgreSQL and Redis are running
if ! docker compose -f infrastructure/docker/docker-compose.yml ps | grep -q "flowcraft-postgres.*Up"; then
    echo -e "${YELLOW}⚠️  PostgreSQL not running. Starting Docker services...${NC}"
    docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis
    sleep 5
fi

if ! docker compose -f infrastructure/docker/docker-compose.yml ps | grep -q "flowcraft-redis.*Up"; then
    echo -e "${YELLOW}⚠️  Redis not running. Starting Docker services...${NC}"
    docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis
    sleep 5
fi

echo -e "${GREEN}✅ Docker services are running${NC}"

# Step 2: Install dependencies if needed
echo -e "${BLUE}📋 Step 2: Installing dependencies...${NC}"
cd "$ROOT_DIR"
pnpm install

# Step 3: Start API service
echo -e "${BLUE}📋 Step 3: Starting API service...${NC}"
echo -e "${GREEN}🚀 Starting API service on port 3000...${NC}"
cd "$ROOT_DIR/apps/api"
pnpm run dev > "$ROOT_DIR/logs/api.log" 2>&1 &
API_PID=$!
echo $API_PID > "$ROOT_DIR/.api.pid"
cd "$ROOT_DIR"

# Step 4: Start Web service
echo -e "${BLUE}📋 Step 4: Starting Web service...${NC}"
echo -e "${GREEN}🚀 Starting Web service on port 5173...${NC}"
cd "$ROOT_DIR/apps/web"
pnpm run dev > "$ROOT_DIR/logs/web.log" 2>&1 &
WEB_PID=$!
echo $WEB_PID > "$ROOT_DIR/.web.pid"
cd "$ROOT_DIR"

# Step 5: Start Execution Service
echo -e "${BLUE}📋 Step 5: Starting Execution Service...${NC}"
echo -e "${GREEN}🚀 Starting Execution Service on port 3001...${NC}"
cd "$ROOT_DIR/apps/execution-service"
pnpm run dev > "$ROOT_DIR/logs/execution.log" 2>&1 &
EXEC_PID=$!
echo $EXEC_PID > "$ROOT_DIR/.execution.pid"
cd "$ROOT_DIR"

# Step 6: Start Prisma Studio
echo -e "${BLUE}📋 Step 6: Starting Prisma Studio...${NC}"
echo -e "${GREEN}🚀 Starting Prisma Studio on port 5555...${NC}"
cd "$ROOT_DIR/packages/database"
pnpm studio > "$ROOT_DIR/logs/prisma.log" 2>&1 &
PRISMA_PID=$!
echo $PRISMA_PID > "$ROOT_DIR/.prisma.pid"
cd "$ROOT_DIR"

# Step 7: Wait for services to be ready
echo -e "${BLUE}📋 Step 7: Waiting for services to be ready...${NC}"

# Wait for API
wait_for_service "API" 3000

# Wait for Web
wait_for_service "Web" 5173

# Wait for Execution Service
wait_for_service "Execution Service" 3001

# Wait for Prisma Studio
wait_for_service "Prisma Studio" 5555

# Step 8: Display status
echo -e "${BLUE}📋 Step 8: Service Status${NC}"
echo "=================================================="
echo -e "${GREEN}✅ PostgreSQL: localhost:5432${NC}"
echo -e "${GREEN}✅ Redis: localhost:6379${NC}"

if check_port 3000; then
    echo -e "${GREEN}✅ API: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ API: Not running${NC}"
fi

if check_port 5173; then
    echo -e "${GREEN}✅ Web: http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Web: Not running${NC}"
fi

if check_port 3001; then
    echo -e "${GREEN}✅ Execution Service: http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Execution Service: Not running${NC}"
fi

if check_port 5555; then
    echo -e "${GREEN}✅ Prisma Studio: http://localhost:5555${NC}"
else
    echo -e "${RED}❌ Prisma Studio: Not running${NC}"
fi

echo ""
echo -e "${GREEN}🎉 FlowCraft Development Environment is ready!${NC}"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo "  View logs: tail -f logs/*.log"
echo "  Stop services: ./scripts/stop-dev.sh"
echo "  Restart services: ./scripts/restart-dev.sh"
echo "  Clean restart: ./scripts/start-dev-improved.sh"
echo ""
echo -e "${YELLOW}💡 Tip: Press Ctrl+C to stop all services cleanly${NC}"

# Remove signal handler to allow normal exit
trap - INT TERM
