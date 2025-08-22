#!/bin/bash

# ATS Scoring API Test Script
# This script tests the basic functionality of the API endpoints

echo "🚀 Testing ATS Scoring API"
echo "=========================="

# Base URL
BASE_URL="http://localhost:8000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test health endpoint
echo -e "\n${YELLOW}Testing Health Endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/health")
if [[ $HEALTH_RESPONSE == *"status"* ]]; then
    echo -e "${GREEN}✓ Health endpoint working${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Health endpoint failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
fi

# Test versions endpoint
echo -e "\n${YELLOW}Testing Versions Endpoint...${NC}"
VERSIONS_RESPONSE=$(curl -s "${BASE_URL}/api/v1/ats/versions")
if [[ $VERSIONS_RESPONSE == *"service"* ]]; then
    echo -e "${GREEN}✓ Versions endpoint working${NC}"
    echo "Response: $VERSIONS_RESPONSE"
else
    echo -e "${RED}✗ Versions endpoint failed${NC}"
    echo "Response: $VERSIONS_RESPONSE"
fi

# Test scoring endpoint (without file - should fail)
echo -e "\n${YELLOW}Testing Scoring Endpoint (should fail without file)...${NC}"
SCORING_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/ats/score")
if [[ $SCORING_RESPONSE == *"error"* ]]; then
    echo -e "${GREEN}✓ Scoring endpoint properly validates input${NC}"
    echo "Response: $SCORING_RESPONSE"
else
    echo -e "${YELLOW}⚠ Unexpected response from scoring endpoint${NC}"
    echo "Response: $SCORING_RESPONSE"
fi

echo -e "\n${GREEN}API Test Complete!${NC}"
echo -e "\nService Ports:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - ML Service: http://localhost:8001"
echo "  - PostgreSQL: localhost:5433 (changed from 5432 to avoid conflicts)"
echo "  - Redis: localhost:6380 (changed from 6379 to avoid conflicts)"
echo -e "\nTo test with actual files, use:"
echo "curl -X POST \"${BASE_URL}/api/v1/ats/score\" \\"
echo "  -F \"resume=@/path/to/resume.pdf\" \\"
echo "  -F \"jd_text=Senior Software Engineer with React experience...\""
