#!/bin/bash

# 🎯 FlowCraft Workflow Testing Script - Sprint 9.5
# Este script automatiza el testing de todas las funcionalidades implementadas

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost:5173"
API_URL="http://localhost:3000"
TEST_DIR="examples/workflows"

echo -e "${BLUE}🎯 FlowCraft Workflow Testing Script - Sprint 9.5${NC}"
echo "=================================================="
echo ""

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC} - $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC} - $message"
    else
        echo -e "${BLUE}ℹ️  INFO${NC} - $message"
    fi
}

# Function to check if service is running
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s --head "$url" > /dev/null; then
        print_status "PASS" "$service_name is running at $url"
        return 0
    else
        print_status "FAIL" "$service_name is not running at $url"
        return 1
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    echo -e "${BLUE}Testing API Endpoints...${NC}"
    
    # Test health endpoint
    if curl -s "$API_URL/health" | grep -q "ok"; then
        print_status "PASS" "Health endpoint is working"
    else
        print_status "FAIL" "Health endpoint is not working"
    fi
    
    # Test i18n endpoint
    if curl -s "$API_URL/api/i18n/translations/en/auth" | grep -q "login"; then
        print_status "PASS" "i18n endpoint is working"
    else
        print_status "FAIL" "i18n endpoint is not working"
    fi
    
    echo ""
}

# Function to test workflow files
test_workflow_files() {
    echo -e "${BLUE}Testing Workflow Files...${NC}"
    
    if [ ! -d "$TEST_DIR" ]; then
        print_status "FAIL" "Test directory $TEST_DIR not found"
        return 1
    fi
    
    local file_count=0
    local valid_count=0
    
    for file in "$TEST_DIR"/*.json; do
        if [ -f "$file" ]; then
            file_count=$((file_count + 1))
            
            # Check if file is valid JSON
            if jq empty "$file" 2>/dev/null; then
                print_status "PASS" "Valid JSON: $(basename "$file")"
                valid_count=$((valid_count + 1))
                
                # Check required fields
                if jq -e '.id' "$file" >/dev/null 2>&1 && \
                   jq -e '.name' "$file" >/dev/null 2>&1 && \
                   jq -e '.nodes' "$file" >/dev/null 2>&1 && \
                   jq -e '.edges' "$file" >/dev/null 2>&1; then
                    print_status "PASS" "Required fields present: $(basename "$file")"
                else
                    print_status "FAIL" "Missing required fields: $(basename "$file")"
                fi
            else
                print_status "FAIL" "Invalid JSON: $(basename "$file")"
            fi
        fi
    done
    
    print_status "INFO" "Found $file_count workflow files, $valid_count valid"
    echo ""
}

# Function to test TypeScript compilation
test_typescript_compilation() {
    echo -e "${BLUE}Testing TypeScript Compilation...${NC}"
    
    cd apps/web
    
    if npm run build >/dev/null 2>&1; then
        print_status "PASS" "TypeScript compilation successful"
    else
        print_status "FAIL" "TypeScript compilation failed"
        echo "Running build with verbose output:"
        npm run build
        return 1
    fi
    
    cd ../..
    echo ""
}

# Function to test connector validation service
test_connector_validation() {
    echo -e "${BLUE}Testing Connector Validation Service...${NC}"
    
    # Test if the service file exists
    if [ -f "apps/web/src/services/connectorValidation.service.ts" ]; then
        print_status "PASS" "Connector validation service file exists"
    else
        print_status "FAIL" "Connector validation service file not found"
        return 1
    fi
    
    # Test if the service can be imported (basic syntax check)
    if npx tsc --noEmit apps/web/src/services/connectorValidation.service.ts >/dev/null 2>&1; then
        print_status "PASS" "Connector validation service compiles correctly"
    else
        print_status "FAIL" "Connector validation service has compilation errors"
    fi
    
    echo ""
}

# Function to test data config panel
test_data_config_panel() {
    echo -e "${BLUE}Testing Data Config Panel...${NC}"
    
    # Test if the panel file exists
    if [ -f "apps/web/src/components/workflow-editor/panels/DataConfigPanel.tsx" ]; then
        print_status "PASS" "Data config panel file exists"
    else
        print_status "FAIL" "Data config panel file not found"
        return 1
    fi
    
    # Test if the panel can be imported (basic syntax check)
    if npx tsc --noEmit apps/web/src/components/workflow-editor/panels/DataConfigPanel.tsx >/dev/null 2>&1; then
        print_status "PASS" "Data config panel compiles correctly"
    else
        print_status "FAIL" "Data config panel has compilation errors"
    fi
    
    echo ""
}

# Function to test node schemas
test_node_schemas() {
    echo -e "${BLUE}Testing Node Schemas...${NC}"
    
    # Test if the schemas file exists
    if [ -f "packages/shared-types/src/node-schemas.ts" ]; then
        print_status "PASS" "Node schemas file exists"
    else
        print_status "FAIL" "Node schemas file not found"
        return 1
    fi
    
    # Test if the schemas can be compiled
    if npx tsc --noEmit packages/shared-types/src/node-schemas.ts >/dev/null 2>&1; then
        print_status "PASS" "Node schemas compile correctly"
    else
        print_status "FAIL" "Node schemas have compilation errors"
    fi
    
    # Check if all connector types are defined
    local connector_types=("HTTP_REQUEST" "EMAIL" "SLACK" "TIMER" "DATA_TRANSFORM" "WEBHOOK")
    for connector_type in "${connector_types[@]}"; do
        if grep -q "$connector_type" "packages/shared-types/src/node-schemas.ts"; then
            print_status "PASS" "Connector type $connector_type is defined"
        else
            print_status "FAIL" "Connector type $connector_type is missing"
        fi
    done
    
    echo ""
}

# Function to test condition node
test_condition_node() {
    echo -e "${BLUE}Testing Condition Node...${NC}"
    
    # Test if the condition node file exists
    if [ -f "apps/web/src/components/workflow-editor/nodes/ConditionNode.tsx" ]; then
        print_status "PASS" "Condition node file exists"
    else
        print_status "FAIL" "Condition node file not found"
        return 1
    fi
    
    # Test if the condition editor exists
    if [ -f "apps/web/src/components/workflow-editor/panels/ConditionEditor.tsx" ]; then
        print_status "PASS" "Condition editor file exists"
    else
        print_status "FAIL" "Condition editor file not found"
    fi
    
    # Test if they compile correctly
    if npx tsc --noEmit apps/web/src/components/workflow-editor/nodes/ConditionNode.tsx >/dev/null 2>&1; then
        print_status "PASS" "Condition node compiles correctly"
    else
        print_status "FAIL" "Condition node has compilation errors"
    fi
    
    if npx tsc --noEmit apps/web/src/components/workflow-editor/panels/ConditionEditor.tsx >/dev/null 2>&1; then
        print_status "PASS" "Condition editor compiles correctly"
    else
        print_status "FAIL" "Condition editor has compilation errors"
    fi
    
    echo ""
}

# Function to test data flow types
test_data_flow_types() {
    echo -e "${BLUE}Testing Data Flow Types...${NC}"
    
    # Test if the data flow types file exists
    if [ -f "packages/shared-types/src/data-flow.ts" ]; then
        print_status "PASS" "Data flow types file exists"
    else
        print_status "FAIL" "Data flow types file not found"
        return 1
    fi
    
    # Test if the types can be compiled
    if npx tsc --noEmit packages/shared-types/src/data-flow.ts >/dev/null 2>&1; then
        print_status "PASS" "Data flow types compile correctly"
    else
        print_status "FAIL" "Data flow types have compilation errors"
    fi
    
    # Check for key interfaces
    local interfaces=("DataField" "DataSchema" "DataPort" "FieldMapping" "DataTransformation" "DataFlow")
    for interface in "${interfaces[@]}"; do
        if grep -q "interface $interface" "packages/shared-types/src/data-flow.ts"; then
            print_status "PASS" "Interface $interface is defined"
        else
            print_status "FAIL" "Interface $interface is missing"
        fi
    done
    
    echo ""
}

# Function to run all tests
run_all_tests() {
    echo -e "${BLUE}🚀 Starting FlowCraft Workflow Testing...${NC}"
    echo ""
    
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    
    # Test 1: Check services
    total_tests=$((total_tests + 2))
    if check_service "$FRONTEND_URL" "Frontend"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    if check_service "$API_URL" "API"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 2: API endpoints
    test_api_endpoints
    
    # Test 3: TypeScript compilation
    total_tests=$((total_tests + 1))
    if test_typescript_compilation; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 4: Workflow files
    test_workflow_files
    
    # Test 5: Connector validation service
    test_connector_validation
    
    # Test 6: Data config panel
    test_data_config_panel
    
    # Test 7: Node schemas
    test_node_schemas
    
    # Test 8: Condition node
    test_condition_node
    
    # Test 9: Data flow types
    test_data_flow_types
    
    # Summary
    echo -e "${BLUE}📊 Test Summary${NC}"
    echo "=================="
    echo -e "Total Tests: $total_tests"
    echo -e "${GREEN}Passed: $passed_tests${NC}"
    echo -e "${RED}Failed: $failed_tests${NC}"
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! FlowCraft Sprint 9.5 is ready for testing.${NC}"
        return 0
    else
        echo -e "${RED}❌ Some tests failed. Please check the errors above.${NC}"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --services     Test only service availability"
    echo "  --api          Test only API endpoints"
    echo "  --compile      Test only TypeScript compilation"
    echo "  --workflows    Test only workflow files"
    echo "  --all          Run all tests (default)"
    echo ""
    echo "Examples:"
    echo "  $0              # Run all tests"
    echo "  $0 --services   # Test only services"
    echo "  $0 --compile    # Test only compilation"
}

# Main script logic
case "${1:---all}" in
    --help|-h)
        show_usage
        exit 0
        ;;
    --services)
        check_service "$FRONTEND_URL" "Frontend"
        check_service "$API_URL" "API"
        ;;
    --api)
        test_api_endpoints
        ;;
    --compile)
        test_typescript_compilation
        ;;
    --workflows)
        test_workflow_files
        ;;
    --all)
        run_all_tests
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        show_usage
        exit 1
        ;;
esac 