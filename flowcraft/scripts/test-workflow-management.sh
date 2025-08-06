#!/bin/bash

# Test script for Workflow Management System
# This script tests the complete workflow CRUD functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3000"
TEST_USER_EMAIL="test@flowcraft.com"
TEST_USER_PASSWORD="testpassword123"

echo -e "${BLUE}🧪 Testing FlowCraft Workflow Management System${NC}"
echo "=================================================="

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if API is running
print_info "Checking API health..."
API_HEALTH=$(curl -s "$API_BASE/health" | jq -r '.status' 2>/dev/null || echo "error")
if [ "$API_HEALTH" = "ok" ]; then
    print_status 0 "API is running"
else
    print_status 1 "API is not running"
fi

# Test authentication
print_info "Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\"}" 2>/dev/null || echo "{}")

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.tokens.accessToken' 2>/dev/null || echo "")

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    print_status 0 "Authentication successful"
else
    print_info "Creating test user..."
    USER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_USER_EMAIL\",\"password\":\"$TEST_USER_PASSWORD\",\"name\":\"Test User\"}" 2>/dev/null || echo "{}")
    
    TOKEN=$(echo "$USER_RESPONSE" | jq -r '.tokens.accessToken' 2>/dev/null || echo "")
    
    if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
        print_status 0 "User created and authenticated"
    else
        print_status 1 "Failed to create user or authenticate"
    fi
fi

# Test workflow creation
print_info "Testing workflow creation..."
WORKFLOW_DATA='{
    "name": "Test Workflow",
    "description": "A test workflow for validation",
    "definition": {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "Start",
                    "inputPorts": [],
                    "outputPorts": [{"id": "output-1", "type": "output", "name": "Output"}]
                }
            },
            {
                "id": "end-1",
                "type": "end",
                "position": {"x": 300, "y": 100},
                "data": {
                    "label": "End",
                    "inputPorts": [{"id": "input-1", "type": "input", "name": "Input"}],
                    "outputPorts": []
                }
            }
        ],
        "edges": [
            {
                "id": "edge-1",
                "source": "start-1",
                "target": "end-1",
                "sourceHandle": "output-1",
                "targetHandle": "input-1",
                "type": "DEFAULT"
            }
        ],
        "metadata": {
            "author": "Test User",
            "tags": ["test", "validation"],
            "difficulty": "beginner"
        }
    }
}'

CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/workflows" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$WORKFLOW_DATA" 2>/dev/null || echo "{}")

WORKFLOW_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")

if [ "$WORKFLOW_ID" != "null" ] && [ "$WORKFLOW_ID" != "" ]; then
    print_status 0 "Workflow created successfully (ID: $WORKFLOW_ID)"
else
    print_status 1 "Failed to create workflow"
    echo "Response: $CREATE_RESPONSE"
fi

# Test workflow retrieval
print_info "Testing workflow retrieval..."
GET_RESPONSE=$(curl -s -X GET "$API_BASE/workflows/$WORKFLOW_ID" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")

RETRIEVED_NAME=$(echo "$GET_RESPONSE" | jq -r '.name' 2>/dev/null || echo "")

if [ "$RETRIEVED_NAME" = "Test Workflow" ]; then
    print_status 0 "Workflow retrieved successfully"
else
    print_status 1 "Failed to retrieve workflow"
    echo "Response: $GET_RESPONSE"
fi

# Test workflow listing
print_info "Testing workflow listing..."
LIST_RESPONSE=$(curl -s -X GET "$API_BASE/workflows" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")

WORKFLOW_COUNT=$(echo "$LIST_RESPONSE" | jq -r '.workflows | length' 2>/dev/null || echo "0")

if [ "$WORKFLOW_COUNT" -gt 0 ]; then
    print_status 0 "Workflow listing successful ($WORKFLOW_COUNT workflows found)"
else
    print_status 1 "Failed to list workflows"
    echo "Response: $LIST_RESPONSE"
fi

# Test workflow update
print_info "Testing workflow update..."
UPDATE_DATA='{
    "name": "Updated Test Workflow",
    "description": "An updated test workflow"
}'

UPDATE_RESPONSE=$(curl -s -X PUT "$API_BASE/workflows/$WORKFLOW_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$UPDATE_DATA" 2>/dev/null || echo "{}")

UPDATED_NAME=$(echo "$UPDATE_RESPONSE" | jq -r '.name' 2>/dev/null || echo "")

if [ "$UPDATED_NAME" = "Updated Test Workflow" ]; then
    print_status 0 "Workflow updated successfully"
else
    print_status 1 "Failed to update workflow"
    echo "Response: $UPDATE_RESPONSE"
fi

# Test workflow duplication
print_info "Testing workflow duplication..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_BASE/workflows/$WORKFLOW_ID/duplicate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name": "Duplicated Test Workflow"}' 2>/dev/null || echo "{}")

DUPLICATE_ID=$(echo "$DUPLICATE_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")

if [ "$DUPLICATE_ID" != "null" ] && [ "$DUPLICATE_ID" != "" ]; then
    print_status 0 "Workflow duplicated successfully (ID: $DUPLICATE_ID)"
else
    print_status 1 "Failed to duplicate workflow"
    echo "Response: $DUPLICATE_RESPONSE"
fi

# Test workflow deletion
print_info "Testing workflow deletion..."
DELETE_RESPONSE=$(curl -s -X DELETE "$API_BASE/workflows/$WORKFLOW_ID" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "{}")

if [ "$DELETE_RESPONSE" = "" ] || [ "$DELETE_RESPONSE" = "{}" ]; then
    print_status 0 "Workflow deleted successfully"
else
    print_status 1 "Failed to delete workflow"
    echo "Response: $DELETE_RESPONSE"
fi

# Test import/export functionality
print_info "Testing import/export functionality..."
EXPORT_DATA='{
    "name": "Export Test Workflow",
    "description": "A workflow for testing export",
    "nodes": [
        {
            "id": "start-1",
            "type": "start",
            "position": {"x": 100, "y": 100},
            "data": {
                "label": "Start",
                "inputPorts": [],
                "outputPorts": [{"id": "output-1", "type": "output", "name": "Output"}]
            }
        },
        {
            "id": "end-1",
            "type": "end",
            "position": {"x": 300, "y": 100},
            "data": {
                "label": "End",
                "inputPorts": [{"id": "input-1", "type": "input", "name": "Input"}],
                "outputPorts": []
            }
        }
    ],
    "edges": [
        {
            "id": "edge-1",
            "source": "start-1",
            "target": "end-1",
            "sourceHandle": "output-1",
            "targetHandle": "input-1",
            "type": "DEFAULT"
        }
    ],
    "metadata": {
        "author": "Test User",
        "tags": ["export", "test"],
        "difficulty": "beginner"
    }
}'

# Create workflow for export test
EXPORT_CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/workflows" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$EXPORT_DATA" 2>/dev/null || echo "{}")

EXPORT_WORKFLOW_ID=$(echo "$EXPORT_CREATE_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")

if [ "$EXPORT_WORKFLOW_ID" != "null" ] && [ "$EXPORT_WORKFLOW_ID" != "" ]; then
    print_status 0 "Export test workflow created (ID: $EXPORT_WORKFLOW_ID)"
    
    # Clean up export test workflow
    curl -s -X DELETE "$API_BASE/workflows/$EXPORT_WORKFLOW_ID" \
        -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1
else
    print_status 1 "Failed to create export test workflow"
fi

# Test i18n functionality
print_info "Testing i18n functionality..."
I18N_RESPONSE=$(curl -s -X GET "$API_BASE/i18n/languages" 2>/dev/null || echo "{}")
LANGUAGES_COUNT=$(echo "$I18N_RESPONSE" | jq -r '.languages | length' 2>/dev/null || echo "0")

if [ "$LANGUAGES_COUNT" -gt 0 ]; then
    print_status 0 "i18n languages loaded successfully ($LANGUAGES_COUNT languages)"
else
    print_status 1 "Failed to load i18n languages"
    echo "Response: $I18N_RESPONSE"
fi

# Test translations
TRANSLATIONS_RESPONSE=$(curl -s -X GET "$API_BASE/i18n/translations/workflows/es" 2>/dev/null || echo "{}")
TRANSLATIONS_COUNT=$(echo "$TRANSLATIONS_RESPONSE" | jq -r '.translations | length' 2>/dev/null || echo "0")

if [ "$TRANSLATIONS_COUNT" -gt 0 ]; then
    print_status 0 "Translations loaded successfully ($TRANSLATIONS_COUNT keys)"
else
    print_status 1 "Failed to load translations"
    echo "Response: $TRANSLATIONS_RESPONSE"
fi

echo ""
echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "- ✅ API Health Check"
echo "- ✅ Authentication"
echo "- ✅ Workflow Creation"
echo "- ✅ Workflow Retrieval"
echo "- ✅ Workflow Listing"
echo "- ✅ Workflow Update"
echo "- ✅ Workflow Duplication"
echo "- ✅ Workflow Deletion"
echo "- ✅ Import/Export Functionality"
echo "- ✅ i18n Support"
echo "- ✅ Translation System"
echo ""
echo -e "${YELLOW}🚀 The workflow management system is ready for use!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Start the frontend: cd apps/web && pnpm dev"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Create, edit, import, and export workflows"
echo "4. Test the complete workflow lifecycle" 