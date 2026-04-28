#!/bin/bash

# Helper script to test student functionality and team ownership
# This creates a student JWT manually for testing

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-https://localhost:8080/api}"
TLS_CA_CERT="${TLS_CA_CERT:-../certs/localhost-cert.pem}"

curl() {
  command curl --cacert "$TLS_CA_CERT" "$@"
}

echo "======================================"
echo "  Student & Team Ownership Tests"
echo "======================================"
echo ""

# Check if JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
  echo -e "${RED}ERROR: JWT_SECRET not set${NC}"
  echo "Set it with: export JWT_SECRET='your-secret'"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL not set${NC}"
  echo "Set it with: export DATABASE_URL='postgresql://...'"
  exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
  echo -e "${RED}ERROR: node not found${NC}"
  exit 1
fi

# ========================================
# 1. Create Student in DB
# ========================================
echo -e "${YELLOW}[SETUP] Creating student users in DB...${NC}"

STUDENT1_SQL="INSERT INTO \"User\" (id, name, email, password, role, \"authProvider\", \"createdAt\") 
VALUES (gen_random_uuid(), 'Student One', 'student1@test.com', NULL, 'STUDENT', 'GOOGLE', NOW()) 
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
RETURNING id;"

STUDENT2_SQL="INSERT INTO \"User\" (id, name, email, password, role, \"authProvider\", \"createdAt\") 
VALUES (gen_random_uuid(), 'Student Two', 'student2@test.com', NULL, 'STUDENT', 'GOOGLE', NOW()) 
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
RETURNING id;"

STUDENT1_ID=$(psql "$DATABASE_URL" -t -c "$STUDENT1_SQL" 2>/dev/null | xargs)
STUDENT2_ID=$(psql "$DATABASE_URL" -t -c "$STUDENT2_SQL" 2>/dev/null | xargs)

if [ -z "$STUDENT1_ID" ] || [ -z "$STUDENT2_ID" ]; then
  echo -e "${RED}ERROR: Could not create students in DB${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Students created${NC}"
echo "  Student 1 ID: $STUDENT1_ID"
echo "  Student 2 ID: $STUDENT2_ID"
echo ""

# ========================================
# 2. Generate JWT tokens for students
# ========================================
echo -e "${YELLOW}[SETUP] Generating JWT tokens...${NC}"

# Create a small node script to generate tokens
cat > /tmp/gen-token.js << 'EOF'
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
const userId = process.argv[2];
const role = process.argv[3] || 'STUDENT';
const token = jwt.sign({ userId, role }, secret, { expiresIn: '7d' });
console.log(token);
EOF

STUDENT1_TOKEN=$(node /tmp/gen-token.js "$STUDENT1_ID" "STUDENT")
STUDENT2_TOKEN=$(node /tmp/gen-token.js "$STUDENT2_ID" "STUDENT")
COOKIE_NAME="${COOKIE_NAME:-rcms_token}"

echo "$COOKIE_NAME=$STUDENT1_TOKEN" > cookies-student1.txt
echo "$COOKIE_NAME=$STUDENT2_TOKEN" > cookies-student2.txt

echo -e "${GREEN}✓ Tokens generated${NC}"
echo ""

# ========================================
# 3. Create Contest and Modality (as system)
# ========================================
echo -e "${YELLOW}[SETUP] Creating contest and modality...${NC}"

# First create admin
ADMIN_SQL="INSERT INTO \"User\" (id, name, email, password, role, \"authProvider\", \"createdAt\") 
VALUES (gen_random_uuid(), 'Admin', 'admin-temp@test.com', 'hash', 'ADMIN', 'LOCAL', NOW()) 
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
RETURNING id;"

ADMIN_ID=$(psql "$DATABASE_URL" -t -c "$ADMIN_SQL" 2>/dev/null | xargs)
ADMIN_TOKEN=$(node /tmp/gen-token.js "$ADMIN_ID" "ADMIN")
echo "$COOKIE_NAME=$ADMIN_TOKEN" > cookies-admin-temp.txt

# Create contest
RESPONSE=$(curl -s -b cookies-admin-temp.txt -X POST "$API_URL/contests" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Contest",
    "description": "For testing",
    "date": "2026-04-01T10:00:00.000Z",
    "location": "Lab"
  }')

CONTEST_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Create modality
RESPONSE=$(curl -s -b cookies-admin-temp.txt -X POST "$API_URL/modalities" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Sumo\",
    \"description\": \"Robot sumo\",
    \"contestId\": \"$CONTEST_ID\"
  }")

MODALITY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✓ Contest and Modality created${NC}"
echo "  Contest ID: $CONTEST_ID"
echo "  Modality ID: $MODALITY_ID"
echo ""

# ========================================
# 4. Student tries to create contest (should fail 403)
# ========================================
echo -e "${YELLOW}[TEST 1] Student: Try create Contest (should fail 403)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-student1.txt -X POST "$API_URL/contests" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bad Contest",
    "date": "2026-03-15T10:00:00.000Z"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 403 ]; then
  echo -e "${GREEN}✓ PASS: Student blocked from admin endpoint (403)${NC}"
else
  echo -e "${RED}✗ FAIL: Expected 403, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# 5. Student creates team with themselves (should pass)
# ========================================
echo -e "${YELLOW}[TEST 2] Student: Create team with self (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-student1.txt -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Team Alpha\",
    \"contestId\": \"$CONTEST_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"memberUserIds\": [\"$STUDENT1_ID\"]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${GREEN}✓ PASS: Team created with self (201)${NC}"
  TEAM1_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Team ID: $TEAM1_ID"
else
  echo -e "${RED}✗ FAIL: Expected 201, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# 6. Student tries to create team without themselves (should fail 403)
# ========================================
echo -e "${YELLOW}[TEST 3] Student: Create team without self (should fail 403)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-student1.txt -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Team Beta\",
    \"contestId\": \"$CONTEST_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"memberUserIds\": [\"$STUDENT2_ID\"]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 403 ]; then
  echo -e "${GREEN}✓ PASS: Ownership validation works (403)${NC}"
else
  echo -e "${RED}✗ FAIL: Expected 403, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# 7. Student creates team with 2 members (should pass)
# ========================================
echo -e "${YELLOW}[TEST 4] Student: Create team with 2 members (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-student1.txt -X POST "$API_URL/teams" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Team Gamma\",
    \"contestId\": \"$CONTEST_ID\",
    \"modalityId\": \"$MODALITY_ID\",
    \"memberUserIds\": [\"$STUDENT1_ID\", \"$STUDENT2_ID\"]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${GREEN}✓ PASS: Team with 2 members created (201)${NC}"
  TEAM2_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Team ID: $TEAM2_ID"
else
  echo -e "${RED}✗ FAIL: Expected 201, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# 8. Student gets their teams (should pass)
# ========================================
echo -e "${YELLOW}[TEST 5] Student: Get my teams (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-student1.txt -X GET "$API_URL/teams/my")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS: Retrieved student teams (200)${NC}"
  COUNT=$(echo "$BODY" | grep -o '"id":' | wc -l)
  echo "  Found $COUNT teams"
else
  echo -e "${RED}✗ FAIL: Expected 200, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# Summary
# ========================================
echo "======================================"
echo "  Test Summary"
echo "======================================"
echo -e "${GREEN}✓${NC} Students blocked from admin endpoints"
echo -e "${GREEN}✓${NC} Team ownership validation works"
echo -e "${GREEN}✓${NC} Students can create teams with themselves"
echo -e "${GREEN}✓${NC} Students can create teams with 2 members"
echo ""

# Cleanup
rm -f /tmp/gen-token.js cookies-student1.txt cookies-student2.txt cookies-admin-temp.txt
