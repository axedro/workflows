#!/bin/bash

# FlowCraft Development Stop Script
# This script stops all development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping FlowCraft Development Environment${NC}"
echo "=================================================="

# Function to kill process by PID file
kill_service() {
    local service=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}🛑 Stopping $service (PID: $pid)...${NC}"
            kill $pid
            rm -f "$pid_file"
            echo -e "${GREEN}✅ $service stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service process not found, removing PID file${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service${NC}"
    fi
}

# Stop API service
kill_service "API" ".api.pid"

# Stop Web service
kill_service "Web" ".web.pid"

# Stop Execution Service
kill_service "Execution Service" ".execution.pid"

# Stop Prisma Studio
kill_service "Prisma Studio" ".prisma.pid"

# Kill any remaining processes on our ports
echo -e "${BLUE}🔍 Checking for remaining processes...${NC}"

# Kill processes on port 3000 (API)
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}🛑 Killing process on port 3000...${NC}"
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
fi

# Kill processes on port 5173 (Web)
if lsof -i :5173 >/dev/null 2>&1; then
    echo -e "${YELLOW}🛑 Killing process on port 5173...${NC}"
    lsof -ti :5173 | xargs kill -9 2>/dev/null || true
fi

# Kill processes on port 3001 (Execution Service)
if lsof -i :3001 >/dev/null 2>&1; then
    echo -e "${YELLOW}🛑 Killing process on port 3001...${NC}"
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
fi

# Kill processes on port 5555 (Prisma Studio)
if lsof -i :5555 >/dev/null 2>&1; then
    echo -e "${YELLOW}🛑 Killing process on port 5555...${NC}"
    lsof -ti :5555 | xargs kill -9 2>/dev/null || true
fi

echo -e "${GREEN}✅ All development services stopped${NC}"
echo ""
echo -e "${BLUE}📝 Note: Docker services (PostgreSQL, Redis) are still running${NC}"
echo "  To stop Docker services: pnpm run docker:down"
