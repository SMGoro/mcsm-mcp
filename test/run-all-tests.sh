#!/bin/bash

# MCSManager MCP Server - Comprehensive Test Runner
# Runs all test suites with detailed reporting

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Banner
echo -e "${MAGENTA}"
echo "═══════════════════════════════════════════════════════════"
echo "   MCSManager MCP Server - Comprehensive Test Suite"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check environment variables
if [ -z "$MCSM_API_KEY" ]; then
    echo -e "${RED}❌ Error: MCSM_API_KEY environment variable is required${NC}"
    echo ""
    echo "Usage:"
    echo "  export MCSM_API_KEY='your_api_key_here'"
    echo "  export MCSM_API_URL='http://192.168.9.121:23333'  # Optional"
    echo "  ./test/run-all-tests.sh"
    echo ""
    echo "Get API Key from: MCSManager Panel → User Settings → API Key"
    exit 1
fi

# Display configuration
echo -e "${CYAN}📋 Test Configuration:${NC}"
echo "  API URL: ${MCSM_API_URL:-http://localhost:23333}"
echo "  API Key: ${MCSM_API_KEY:0:8}***"
echo "  Node Version: $(node --version)"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_DIR"

# Check if project is built
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    echo -e "${YELLOW}⚠️  Project not built, building now...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Build completed${NC}"
    echo ""
fi

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
START_TIME=$(date +%s)

# Function to run a test
run_test() {
    local test_name=$1
    local test_script=$2
    
    echo -e "${CYAN}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Running: $test_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Run test and capture output
    if node "$test_script"; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Run tests
echo -e "${BLUE}🚀 Starting Test Suite...${NC}"
echo ""

# Test 1: STDIO Mode
run_test "STDIO Mode Test" "test/stdio-test.js" || true

echo ""

# Test 2: HTTP/SSE Mode
run_test "HTTP/SSE Mode Test" "test/http-test.js" || true

echo ""

# Test 3: Integration Test
run_test "Integration Test" "test/integration-test.js" || true

echo ""

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Print summary
echo -e "${MAGENTA}"
echo "═══════════════════════════════════════════════════════════"
echo "   TEST SUITE SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"
echo ""
echo -e "${CYAN}📊 Results:${NC}"
echo "  Total Test Suites: $TOTAL_TESTS"
echo -e "  Passed: ${GREEN}$PASSED_TESTS ✅${NC}"
echo -e "  Failed: ${RED}$FAILED_TESTS ❌${NC}"
echo "  Duration: ${DURATION}s"
echo ""

# Success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    if [ $SUCCESS_RATE -eq 100 ]; then
        echo -e "${GREEN}🎉 All tests passed! (100%)${NC}"
    elif [ $SUCCESS_RATE -ge 66 ]; then
        echo -e "${YELLOW}⚠️  Success rate: ${SUCCESS_RATE}%${NC}"
    else
        echo -e "${RED}❌ Success rate: ${SUCCESS_RATE}%${NC}"
    fi
fi

echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed successfully!${NC}"
    exit 0
fi





