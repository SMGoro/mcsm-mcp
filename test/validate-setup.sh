#!/bin/bash

# MCSManager MCP Server - Setup Validation Script
# Validates that the testing environment is properly configured

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════"
echo "   MCSManager MCP Server - Setup Validation"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}\n"

ERRORS=0
WARNINGS=0

# Function to check requirement
check_requirement() {
    local name=$1
    local command=$2
    local expected=$3
    
    echo -n "Checking $name... "
    
    if command -v $command &> /dev/null; then
        local version=$($command --version 2>&1 | head -n 1)
        echo -e "${GREEN}✓ Found${NC}"
        echo "  Version: $version"
    else
        echo -e "${RED}✗ Not found${NC}"
        ERRORS=$((ERRORS + 1))
        if [ -n "$expected" ]; then
            echo -e "  ${YELLOW}Required: $expected${NC}"
        fi
    fi
}

# Check Node.js
echo -e "${BLUE}📋 Checking System Requirements:${NC}\n"

check_requirement "Node.js" "node" ">=18.0.0"
check_requirement "npm" "npm" ""

echo ""

# Check project structure
echo -e "${BLUE}📁 Checking Project Structure:${NC}\n"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_DIR"

check_file() {
    local file=$1
    local name=$2
    
    echo -n "Checking $name... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ Found${NC}"
    else
        echo -e "${RED}✗ Missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

check_dir() {
    local dir=$1
    local name=$2
    
    echo -n "Checking $name... "
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ Found${NC}"
    else
        echo -e "${RED}✗ Missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

check_file "package.json" "package.json"
check_file "tsconfig.json" "tsconfig.json"
check_dir "src" "src directory"
check_dir "test" "test directory"
check_file "test/stdio-test.js" "STDIO test"
check_file "test/http-test.js" "HTTP test"
check_file "test/integration-test.js" "Integration test"

echo ""

# Check if built
echo -e "${BLUE}🔨 Checking Build Status:${NC}\n"

echo -n "Checking if project is built... "
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    echo -e "${GREEN}✓ Built${NC}"
    echo "  Files: $(ls dist/*.js 2>/dev/null | wc -l) JavaScript files"
else
    echo -e "${YELLOW}⚠ Not built${NC}"
    echo "  Run: npm run build"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Check dependencies
echo -e "${BLUE}📦 Checking Dependencies:${NC}\n"

echo -n "Checking node_modules... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
    echo "  Packages: $(ls node_modules | wc -l)"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Run: npm install"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Check environment variables
echo -e "${BLUE}🔧 Checking Environment Variables:${NC}\n"

check_env() {
    local var=$1
    local required=$2
    
    echo -n "Checking $var... "
    if [ -n "${!var}" ]; then
        if [ "$var" = "MCSM_API_KEY" ]; then
            echo -e "${GREEN}✓ Set${NC} (${!var:0:8}***)"
        else
            echo -e "${GREEN}✓ Set${NC} (${!var})"
        fi
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}✗ Not set (REQUIRED)${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${YELLOW}⚠ Not set (optional)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
}

check_env "MCSM_API_KEY" "required"
check_env "MCSM_API_URL" "optional"
check_env "TEST_PORT" "optional"

echo ""

# Test MCSManager connection
if [ -n "$MCSM_API_KEY" ]; then
    echo -e "${BLUE}🔗 Testing MCSManager Connection:${NC}\n"
    
    API_URL="${MCSM_API_URL:-http://localhost:23333}"
    
    echo "Testing connection to $API_URL..."
    
    # Test basic connectivity
    echo -n "  Checking API endpoint... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/auth/status" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        echo -e "${GREEN}✓ Reachable${NC} (HTTP $HTTP_CODE)"
    else
        echo -e "${RED}✗ Unreachable${NC} (HTTP $HTTP_CODE)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Test API authentication
    echo -n "  Testing API authentication... "
    AUTH_RESPONSE=$(curl -s -H "X-Requested-With: XMLHttpRequest" \
                        -H "Content-Type: application/json" \
                        "$API_URL/api/service/remote_services_list?apikey=$MCSM_API_KEY" 2>/dev/null)
    
    if echo "$AUTH_RESPONSE" | grep -q '"status":200' || echo "$AUTH_RESPONSE" | grep -q 'data'; then
        echo -e "${GREEN}✓ Authenticated${NC}"
    else
        echo -e "${RED}✗ Authentication failed${NC}"
        echo "    Response: $(echo $AUTH_RESPONSE | head -c 100)..."
        WARNINGS=$((WARNINGS + 1))
    fi
    
    echo ""
fi

# Summary
echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════"
echo "   Validation Summary"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}\n"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo -e "${GREEN}You are ready to run tests.${NC}\n"
    echo "Run tests with:"
    echo "  npm test              # Run all tests"
    echo "  npm run test:stdio    # Run STDIO test only"
    echo "  npm run test:http     # Run HTTP test only"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation completed with $WARNINGS warning(s)${NC}"
    echo "You can proceed but some features may not work correctly."
    exit 0
else
    echo -e "${RED}❌ Validation failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before running tests."
    echo ""
    echo "Common fixes:"
    echo "  1. Install dependencies: npm install"
    echo "  2. Build project: npm run build"
    echo "  3. Set API key: export MCSM_API_KEY='your_key'"
    echo "  4. Set API URL: export MCSM_API_URL='http://your-server:23333'"
    exit 1
fi





