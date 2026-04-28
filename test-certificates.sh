#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-https://localhost:8080/api}"
OUTPUT_FILE="${OUTPUT_FILE:-certificado.pdf}"
TLS_CA_CERT="${TLS_CA_CERT:-../certs/localhost-cert.pem}"

curl() {
  command curl --cacert "$TLS_CA_CERT" "$@"
}

echo "======================================"
echo "  Certificates Tests with curl"
echo "======================================"
echo ""

rm -f cookies-admin.txt cookies-student.txt "$OUTPUT_FILE"

# ========================================
# SETUP: Login admin
# ========================================
echo -e "${YELLOW}[SETUP] Login as admin...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -c cookies-admin.txt -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin-test@rcms.com",
    "password": "admin123"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo -e "${RED}✗ Could not login as admin (status $HTTP_CODE)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Admin logged in${NC}"
echo ""

# ========================================
# SETUP: Create fake students
# ========================================
echo -e "${YELLOW}[SETUP] Creating fake students...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/dev/fake-students")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo -e "${RED}✗ Could not create fake students (status $HTTP_CODE)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Fake students created${NC}"
echo ""

# ========================================
# SETUP: Login student
# ========================================
echo -e "${YELLOW}[SETUP] Login as student...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -c cookies-student.txt -X POST "$API_URL/dev/login-fake-student" \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@fake.test"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  STUDENT1_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✓ Student1 logged in (ID: $STUDENT1_ID)${NC}"
else
  echo -e "${RED}✗ Could not login student (status $HTTP_CODE)${NC}"
  exit 1
fi

echo ""

# ========================================
# SETUP: Create contest and modality
# ========================================
echo -e "${YELLOW}[SETUP] Creating contest...${NC}"
RESPONSE=$(curl -s -b cookies-admin.txt -X POST "$API_URL/contests" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Certificates Test Contest",
    "description": "For testing certificates",
    "date": "2026-05-01T10:00:00.000Z",
    "location": "Lab"
  }')
CONTEST_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$CONTEST_ID" ]; then
  echo -e "${RED}✗ Could not create contest${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Contest created (ID: $CONTEST_ID)${NC}"

echo -e "${YELLOW}[SETUP] Creating modality...${NC}"
RESPONSE=$(curl -s -b cookies-admin.txt -X POST "$API_URL/modalities" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Line Follower\",
    \"description\": \"Robot follows line\",
    \"contestId\": \"$CONTEST_ID\"
  }")
MODALITY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$MODALITY_ID" ]; then
  echo -e "${RED}✗ Could not create modality${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Modality created (ID: $MODALITY_ID)${NC}"
echo ""

# ========================================
# SETUP: Create team
# ========================================
echo -e "${YELLOW}[SETUP] Creating team...${NC}"
RESPONSE=$(curl -s -b cookies-student.txt -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Team Certificate\",
    \"contestId\": \"$CONTEST_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"memberUserIds\": [\"$STUDENT1_ID\"]
  }")
TEAM_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TEAM_ID" ]; then
  echo -e "${RED}✗ Could not create team${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Team created (ID: $TEAM_ID)${NC}"
echo ""

# ========================================
# SETUP: Create winner
# ========================================
echo -e "${YELLOW}[SETUP] Creating winner...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-admin.txt -X POST "$API_URL/winners" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamId\": \"$TEAM_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"position\": \"FIRST\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')
WINNER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ "$HTTP_CODE" -ne 201 ] || [ -z "$WINNER_ID" ]; then
  echo -e "${RED}✗ Could not create winner (status $HTTP_CODE)${NC}"
  echo "  Response: $BODY"
  exit 1
fi

echo -e "${GREEN}✓ Winner created (ID: $WINNER_ID)${NC}"
echo ""

# ========================================
# TEST: Download certificate
# ========================================
echo -e "${YELLOW}[TEST] Download certificate...${NC}"
curl -s -b cookies-admin.txt \
  "$API_URL/certificates/winner/$WINNER_ID" \
  -o "$OUTPUT_FILE"

if [ -f "$OUTPUT_FILE" ]; then
  SIZE=$(wc -c < "$OUTPUT_FILE")
  if [ "$SIZE" -gt 1000 ]; then
    echo -e "${GREEN}✓ Certificate downloaded ($OUTPUT_FILE, $SIZE bytes)${NC}"
  else
    echo -e "${RED}✗ Certificate seems too small ($SIZE bytes)${NC}"
  fi
else
  echo -e "${RED}✗ Certificate file not found${NC}"
  exit 1
fi

echo ""

echo "======================================"
echo "  Certificate Test Completed"
echo "======================================"

# Cleanup cookies
rm -f cookies-admin.txt cookies-student.txt
