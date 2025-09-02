#!/usr/bin/env bash

# Phase 1 Smoke Tests - Test all standardized API endpoints
echo "🔥 Phase 1 Smoke Tests - Testing all APIs"
echo "=========================================="

BASE_URL="http://localhost:5000"
FAILED_TESTS=0
TOTAL_TESTS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $name... "
    
    response=$(curl -sS "$BASE_URL$endpoint" 2>/dev/null)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        # Check if response looks like JSON (starts with { or [)
        if [[ "$response" =~ ^[[:space:]]*[\{\[] ]]; then
            if [[ -n "$expected_pattern" ]] && ! echo "$response" | grep -q "$expected_pattern"; then
                echo -e "${RED}FAIL${NC} - Invalid response content"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            else
                echo -e "${GREEN}PASS${NC}"
                # Show JSON response (first 200 chars)
                echo "   → $(echo "$response" | head -c 200)..."
            fi
        else
            echo -e "${RED}FAIL${NC} - Not JSON response"
            echo "   → Response: $(echo "$response" | head -c 100)..."
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}FAIL${NC} - HTTP request failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Test POST endpoint
test_post_endpoint() {
    local name="$1"
    local endpoint="$2"
    local data="$3"
    local expected_pattern="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $name (POST)... "
    
    response=$(curl -fsS -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint" 2>/dev/null)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        # Check if response looks like JSON (starts with { or [)
        if [[ "$response" =~ ^[[:space:]]*[\{\[] ]]; then
            if [[ -n "$expected_pattern" ]] && ! echo "$response" | grep -q "$expected_pattern"; then
                echo -e "${RED}FAIL${NC} - Invalid response content"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            else
                echo -e "${GREEN}PASS${NC}"
                echo "   → $(echo "$response" | head -c 200)..."
            fi
        else
            echo -e "${RED}FAIL${NC} - Not JSON response"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}FAIL${NC} - HTTP request failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo ""
echo "Phase 1 Core APIs:"
echo "------------------"

# Test core status
test_endpoint "API Status" "/api/status" "success"

# Test survey APIs
test_endpoint "Survey Requests (GET)" "/api/survey/requests" "Survey Requests"
test_post_endpoint "Survey Requests (POST)" "/api/survey/requests" '{"ownerName":"Test Owner","governorate":"صنعاء","purpose":"Test Purpose"}' "created successfully"

# Test surveyors API
test_endpoint "Surveyors List" "/api/surveyors" "surveyor"

# Test GIS APIs  
test_endpoint "GIS Layers All" "/api/gis/layers/all" "Phase 1 GIS Layers"
test_endpoint "GIS Features (masterplan)" "/api/gis/features?layerId=masterplan" "FeatureCollection"
test_endpoint "GIS Features (no layerId)" "/api/gis/features" "layerId"

# Test predictive APIs
test_endpoint "Predictive Status" "/api/predictive/status" "Predictive Intelligence"

# Test automation APIs
test_endpoint "Smart Automation Status" "/api/smart-automation/status" "Smart Automation"
test_endpoint "Organizational Automation" "/api/organizational-automation" "Organizational Automation"

echo ""
echo "Additional APIs:"
echo "----------------"

# Test other important endpoints
test_endpoint "GIS Statistics" "/api/gis/statistics" "total"
test_endpoint "GIS Governorates" "/api/gis/governorates" "governorates"

echo ""
echo "=========================================="
echo "Smoke Tests Summary:"
echo "   Total Tests: $TOTAL_TESTS"
echo "   Passed: $((TOTAL_TESTS - FAILED_TESTS))"
echo "   Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests passed!${NC}"
    echo "Phase 1 APIs are working correctly"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS test(s) failed${NC}"
    echo "Please fix failing endpoints before proceeding"
    exit 1
fi