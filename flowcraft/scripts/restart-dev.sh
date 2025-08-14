#!/bin/bash

# FlowCraft Development Restart Script
# This script restarts all development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Restarting FlowCraft Development Environment${NC}"
echo "=================================================="

# Stop all services first
echo -e "${YELLOW}🛑 Stopping all services...${NC}"
./scripts/stop-dev.sh

# Wait a moment
echo -e "${YELLOW}⏳ Waiting for services to stop...${NC}"
sleep 3

# Start all services
echo -e "${YELLOW}🚀 Starting all services...${NC}"
./scripts/start-dev.sh

echo -e "${GREEN}✅ FlowCraft Development Environment restarted successfully!${NC}"
