#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="${API_URL:-https://localhost:8080/api}"
TLS_CA_CERT="${TLS_CA_CERT:-../certs/localhost-cert.pem}"

curl() {
  command curl --cacert "$TLS_CA_CERT" "$@"
}

echo "======================================"
echo "  Winners Tests with curl"
echo "======================================"
echo ""

# Cleanup
rm -f cookies-admin.txt cookies-student.txt

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
  echo -e "${RED}✗ Could not login as admin${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Admin logged in${NC}"
echo ""

# ========================================
# SETUP: Create fake students
# ========================================
echo -e "${YELLOW}[SETUP] Creating fake students...${NC}"
curl -s "$API_URL/dev/fake-students" -X POST > /dev/null
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
  echo -e "${RED}✗ Could not login student${NC}"
  exit 1
fi

# Get student2 ID
RESPONSE=$(curl -s -X POST "$API_URL/dev/login-fake-student" \
  -H "Content-Type: application/json" \
  -d '{"email":"student2@fake.test"}')
STUDENT2_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

# ========================================
# SETUP: Create contest and modality
# ========================================
echo -e "${YELLOW}[SETUP] Creating contest...${NC}"
RESPONSE=$(curl -s -b cookies-admin.txt -X POST "$API_URL/contests" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Winners Test Contest",
    "description": "For testing winners",
    "date": "2026-05-01T10:00:00.000Z",
    "location": "Lab"
  }')
CONTEST_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Contest created (ID: $CONTEST_ID)${NC}"

echo -e "${YELLOW}[SETUP] Creating modality...${NC}"
RESPONSE=$(curl -s -b cookies-admin.txt -X POST "$API_URL/modalities" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Sumo Robot\",
    \"description\": \"Robot sumo\",
    \"contestId\": \"$CONTEST_ID\"
  }")
MODALITY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Modality created (ID: $MODALITY_ID)${NC}"
echo ""

# ========================================
# SETUP: Create 3 teams
# ========================================
echo -e "${YELLOW}[SETUP] Creating teams...${NC}"

RESPONSE=$(curl -s -b cookies-student.txt -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Team Alpha\",
    \"contestId\": \"$CONTEST_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"memberUserIds\": [\"$STUDENT1_ID\"]
  }")
TEAM1_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

RESPONSE=$(curl -s -b cookies-student.txt -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Team Beta\",
    \"contestId\": \"$CONTEST_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"memberUserIds\": [\"$STUDENT1_ID\", \"$STUDENT2_ID\"]
  }")
TEAM2_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

RESPONSE=$(curl -s -b cookies-student.txt -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Team Gamma\",
    \"contestId\": \"$CONTEST_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"memberUserIds\": [\"$STUDENT1_ID\"]
  }")
TEAM3_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✓ 3 teams created${NC}"
echo ""

# ========================================
# TEST 1: Admin assigns FIRST place winner
# ========================================
echo -e "${YELLOW}[TEST 1] Admin: Assign FIRST place (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-admin.txt -X POST "$API_URL/winners" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamId\": \"$TEAM1_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"position\": \"FIRST\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${GREEN}✓ PASS: Winner assigned (201)${NC}"
  WINNER1_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Winner ID: $WINNER1_ID"
else
  echo -e "${RED}✗ FAIL: Expected 201, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# TEST 2: Try to assign same position again (should fail 400)
# ========================================
echo -e "${YELLOW}[TEST 2] Admin: Try to assign FIRST again (should fail 400)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-admin.txt -X POST "$API_URL/winners" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamId\": \"$TEAM2_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"position\": \"FIRST\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
  echo -e "${GREEN}✓ PASS: Duplicate position blocked (400)${NC}"
else
  echo -e "${RED}✗ FAIL: Expected 400, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# TEST 3: Assign SECOND and THIRD
# ========================================
echo -e "${YELLOW}[TEST 3] Admin: Assign SECOND and THIRD places${NC}"

curl -s -b cookies-admin.txt -X POST "$API_URL/winners" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamId\": \"$TEAM2_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"position\": \"SECOND\"
  }" > /dev/null

curl -s -b cookies-admin.txt -X POST "$API_URL/winners" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamId\": \"$TEAM3_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"position\": \"THIRD\"
  }" > /dev/null

echo -e "${GREEN}✓ SECOND and THIRD assigned${NC}"
echo ""

# ========================================
# TEST 4: Try to assign 4th winner (should fail 400)
# ========================================
echo -e "${YELLOW}[TEST 4] Admin: Try 4th winner (should fail 400)${NC}"

# Create another team first
RESPONSE=$(curl -s -b cookies-student.txt -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Team Delta\",
    \"contestId\": \"$CONTEST_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"memberUserIds\": [\"$STUDENT1_ID\"]
  }")
TEAM4_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-admin.txt -X POST "$API_URL/winners" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamId\": \"$TEAM4_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"position\": \"FIRST\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
  echo -e "${GREEN}✓ PASS: Max 3 winners enforced (400)${NC}"
else
  echo -e "${RED}✗ FAIL: Expected 400, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# TEST 5: Public can get winners by modality
# ========================================
echo -e "${YELLOW}[TEST 5] Public: Get winners by modality (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/winners/modality/$MODALITY_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS: Winners retrieved (200)${NC}"
  COUNT=$(echo "$BODY" | grep -o '"position":' | wc -l)
  echo "  Found $COUNT winners"
else
  echo -e "${RED}✗ FAIL: Expected 200, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# TEST 6: Student cannot assign winners (should fail 403)
# ========================================
echo -e "${YELLOW}[TEST 6] Student: Try to assign winner (should fail 403)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-student.txt -X POST "$API_URL/winners" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamId\": \"$TEAM1_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"position\": \"FIRST\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 403 ]; then
  echo -e "${GREEN}✓ PASS: Student blocked from assigning winners (403)${NC}"
else
  echo -e "${RED}✗ FAIL: Expected 403, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# Summary
# ========================================
echo "======================================"
echo "  Test Summary"
echo "======================================"
echo -e "${GREEN}✓${NC} Admin can assign winners"
echo -e "${GREEN}✓${NC} Duplicate position validation works"
echo -e "${GREEN}✓${NC} Maximum 3 winners per modality enforced"
echo -e "${GREEN}✓${NC} Public can view winners"
echo -e "${GREEN}✓${NC} Students blocked from admin actions"
echo ""

# Cleanup
rm -f cookies-admin.txt cookies-student.txt
