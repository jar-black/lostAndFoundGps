#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"
TOKEN=""
USER_ID=""
THING_ID=""

echo -e "${YELLOW}=== Lost and Found API Test Suite ===${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 2: Register User
echo -e "${YELLOW}Test 2: Register User${NC}"
RANDOM_EMAIL="test$(date +%s)@example.com"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"password123\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ User registration passed${NC}"
    TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Email: $RANDOM_EMAIL"
    echo "Token: ${TOKEN:0:20}..."
    echo "User ID: $USER_ID"
else
    echo -e "${RED}✗ User registration failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Login User
echo -e "${YELLOW}Test 3: Login User${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"password123\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ User login passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ User login failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 4: Create Thing (Lost/Found Item)
echo -e "${YELLOW}Test 4: Create Lost/Found Item${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/things" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "headline": "Lost Blue Backpack",
    "description": "Blue backpack with laptop inside, lost near Central Park",
    "latitude": 40.785091,
    "longitude": -73.968285
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Create item passed${NC}"
    THING_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Thing ID: $THING_ID"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Create item failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 5: Get Nearby Items
echo -e "${YELLOW}Test 5: Get Nearby Items${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/things/nearby?lat=40.785091&lng=-73.968285&radius=1000" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Get nearby items passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Get nearby items failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 6: Get Item by ID
echo -e "${YELLOW}Test 6: Get Item by ID${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/things/$THING_ID" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Get item by ID passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Get item by ID failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 7: Get My Things
echo -e "${YELLOW}Test 7: Get My Things${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/things/my-things" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Get my things passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Get my things failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 8: Update Item
echo -e "${YELLOW}Test 8: Update Item${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/api/things/$THING_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "headline": "Lost Blue Backpack - FOUND!",
    "status": "resolved"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Update item passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Update item failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 9: Contact Owner (Note: This will fail without email config)
echo -e "${YELLOW}Test 9: Contact Owner${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/things/$THING_ID/contact" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Hi, I think I found your backpack!"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Contact owner passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${YELLOW}⚠ Contact owner may fail without email configuration (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 10: Rate Limiting
echo -e "${YELLOW}Test 10: Rate Limiting (Create 5 more items)${NC}"
for i in {1..5}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/things" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"headline\": \"Test Item $i\",
        \"description\": \"Test description $i\",
        \"latitude\": 40.785091,
        \"longitude\": -73.968285
      }")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "201" ]; then
        echo -e "${GREEN}✓ Item $i created${NC}"
    elif [ "$HTTP_CODE" = "429" ]; then
        echo -e "${GREEN}✓ Rate limit working! (HTTP 429 after creating multiple items)${NC}"
        break
    else
        echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
    fi
done
echo ""

# Test 11: Delete Item
echo -e "${YELLOW}Test 11: Delete Item${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/api/things/$THING_ID" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Delete item passed${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Delete item failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

echo -e "${YELLOW}=== Test Suite Complete ===${NC}"
