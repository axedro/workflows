#!/bin/bash

# Quick Frontend HTTP Connector Test Script
echo "=== FlowCraft Frontend HTTP Connector Test ==="
echo "Testing HTTP connector from frontend workflow execution"
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if service is running
check_service() {
    local service_name=$1
    local port=$2
    
    echo -n "Checking $service_name on port $port..."
    
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e " ${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e " ${RED}✗ Not running${NC}"
        return 1
    fi
}

echo "1. Checking required services..."

# Check if API service is running
if ! check_service "API Service" 3000; then
    echo -e "${YELLOW}Starting API service...${NC}"
    cd /Users/alejandromedina/dev/FC/workflows/workflows/flowcraft/apps/api
    npm run dev &
    API_PID=$!
    echo "Waiting for API service to start..."
    sleep 10
fi

# Check if Execution service is running  
if ! check_service "Execution Service" 3001; then
    echo -e "${YELLOW}Starting Execution service...${NC}"
    cd /Users/alejandromedina/dev/FC/workflows/workflows/flowcraft/apps/execution-service
    npm run dev &
    EXEC_PID=$!
    echo "Waiting for Execution service to start..."
    sleep 10
fi

# Check if Frontend is running
if ! curl -s "http://localhost:5173" > /dev/null 2>&1; then
    echo -e "${YELLOW}Starting Frontend service...${NC}"
    cd /Users/alejandromedina/dev/FC/workflows/workflows/flowcraft/apps/web
    npm run dev &
    WEB_PID=$!
    echo "Waiting for Frontend to start..."
    sleep 15
fi

echo
echo "2. Services Status:"
check_service "API Service" 3000
check_service "Execution Service" 3001
echo -n "Checking Frontend on port 5173..."
if curl -s "http://localhost:5173" > /dev/null 2>&1; then
    echo -e " ${GREEN}✓ Running${NC}"
else
    echo -e " ${RED}✗ Not running${NC}"
fi

echo
echo -e "${BLUE}3. Frontend Testing Instructions:${NC}"
echo
echo "🌐 Open your browser and go to:"
echo -e "   ${GREEN}http://localhost:5173/test${NC}"
echo
echo "📝 Or manually test by:"
echo "   1. Go to http://localhost:5173"
echo "   2. Create a new workflow"
echo "   3. Add these nodes:"
echo "      - Start node"
echo "      - HTTP Request node with:"
echo "        • URL: https://httpbin.org/json"
echo "        • Method: GET"
echo "      - End node"
echo "   4. Connect the nodes"
echo "   5. Save the workflow"
echo "   6. Click 'Execute' button"
echo
echo -e "${YELLOW}4. Expected Results:${NC}"
echo "   ✅ Workflow execution starts"
echo "   ✅ HTTP request is made to httpbin.org"
echo "   ✅ JSON response is received"
echo "   ✅ Execution completes successfully"
echo "   ✅ Response data is displayed"
echo
echo -e "${BLUE}5. Advanced Testing:${NC}"
echo "   • Test POST requests with JSON body"
echo "   • Test authentication headers"
echo "   • Test query parameters"
echo "   • Test error handling (404 responses)"
echo
echo -e "${GREEN}Ready for frontend testing! 🚀${NC}"

# Cleanup function
cleanup() {
    echo
    echo "Cleaning up background processes..."
    if [ ! -z "$API_PID" ]; then kill $API_PID 2>/dev/null || true; fi
    if [ ! -z "$EXEC_PID" ]; then kill $EXEC_PID 2>/dev/null || true; fi
    if [ ! -z "$WEB_PID" ]; then kill $WEB_PID 2>/dev/null || true; fi
}

# Set up cleanup trap
trap cleanup EXIT

echo
echo "Press Ctrl+C to stop all services and exit"
echo "Keeping services running for testing..."

# Keep script running
while true; do
    sleep 10
done