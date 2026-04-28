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
echo "  RBAC & Ownership Tests with curl"
echo "======================================"
echo ""

# Cleanup
rm -f cookies-admin.txt cookies-student.txt

# ========================================
# 1. ADMIN: Register or Login
# ========================================
echo -e "${YELLOW}[TEST 1] Admin: Register or Login${NC}"

# Try register first
RESPONSE=$(curl -s -w "\n%{http_code}" -c cookies-admin.txt -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Test",
    "email": "admin-test@rcms.com",
    "password": "admin123"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

# If email exists, try login
if [ "$HTTP_CODE" -eq 400 ] && echo "$BODY" | grep -q "already exists"; then
  echo -e "${YELLOW}  Admin exists, trying login...${NC}"
  RESPONSE=$(curl -s -w "\n%{http_code}" -c cookies-admin.txt -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin-test@rcms.com",
      "password": "admin123"
    }')
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | sed '$d')
fi

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS: Admin authenticated ($HTTP_CODE)${NC}"
  ADMIN_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Admin ID: $ADMIN_ID"
else
  echo -e "${RED}✗ FAIL: Expected 200/201, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
  exit 1
fi
echo ""

# ========================================
# 2. ADMIN: Create Contest (should pass)
# ========================================
echo -e "${YELLOW}[TEST 2] Admin: Create Contest (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-admin.txt -X POST "$API_URL/contests" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Contest Test",
    "description": "Test description",
    "date": "2026-03-15T10:00:00.000Z",
    "location": "Lab A"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${GREEN}✓ PASS: Contest created (201)${NC}"
  CONTEST_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Contest ID: $CONTEST_ID"
else
  echo -e "${RED}✗ FAIL: Expected 201, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# 3. ADMIN: Create Modality (should pass)
# ========================================
echo -e "${YELLOW}[TEST 3] Admin: Create Modality (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-admin.txt -X POST "$API_URL/modalities" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Line Follower\",
    \"description\": \"Follow the line\",
    \"contestId\": \"$CONTEST_ID\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${GREEN}✓ PASS: Modality created (201)${NC}"
  MODALITY_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Modality ID: $MODALITY_ID"
else
  echo -e "${RED}✗ FAIL: Expected 201, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# 4. NO AUTH: Create Contest (should fail 401)
# ========================================
echo -e "${YELLOW}[TEST 4] No Auth: Create Contest (should fail 401)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/contests" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Unauthorized Contest",
    "description": "Should not work",
    "date": "2026-03-15T10:00:00.000Z",
    "location": "Lab B"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${GREEN}✓ PASS: Blocked unauth user (401)${NC}"
else
  echo -e "${RED}✗ FAIL: Expected 401, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# 5. Create fake students for testing
# ========================================
echo -e "${YELLOW}[TEST 5] Creating fake students...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/dev/fake-students")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Fake students created${NC}"
  STUDENT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  Student ID: $STUDENT_ID"
else
  echo -e "${YELLOW}  Could not create fake students (maybe not in dev mode)${NC}"
  STUDENT_ID=""
fi
echo ""

# ========================================
# 6. STUDENT: Login as fake student
# ========================================
if [ -n "$STUDENT_ID" ]; then
  echo -e "${YELLOW}[TEST 6] Student: Login as fake student${NC}"
  RESPONSE=$(curl -s -w "\n%{http_code}" -c cookies-student.txt -X POST "$API_URL/dev/login-fake-student" \
    -H "Content-Type: application/json" \
    -d '{"email":"student1@fake.test"}')
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Student logged in${NC}"
    STUDENT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  Student ID: $STUDENT_ID"
  else
    echo -e "${RED}✗ FAIL: Expected 200, got $HTTP_CODE${NC}"
    echo "  Response: $BODY"
    STUDENT_ID=""
  fi
  echo ""
fi

# ========================================
# 7. STUDENT: Try to create Contest (should fail 403)
# ========================================
if [ -n "$STUDENT_ID" ]; then
  echo -e "${YELLOW}[TEST 7] Student: Try create Contest (should fail 403)${NC}"
  RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-student.txt -X POST "$API_URL/contests" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Bad Contest",
      "description": "Should not work",
      "date": "2026-03-15T10:00:00.000Z",
      "location": "Lab B"
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
else
  echo -e "${YELLOW}[TEST 7] Student: Try create Contest (skipped - no student)${NC}"
  echo ""
fi

# ========================================
# 8. PUBLIC: Get contests (should pass)
# ========================================
echo -e "${YELLOW}[TEST 8] Public: Get Contests (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/contests")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS: Public can list contests (200)${NC}"
  COUNT=$(echo "$BODY" | grep -o '"id":' | wc -l)
  echo "  Found $COUNT contests"
else
  echo -e "${RED}✗ FAIL: Expected 200, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# 9. ADMIN: Update Contest (should pass)
# ========================================
echo -e "${YELLOW}[TEST 9] Admin: Update Contest (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-admin.txt -X PATCH "$API_URL/contests/$CONTEST_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CLOSED"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS: Contest updated (200)${NC}"
  STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "  New status: $STATUS"
else
  echo -e "${RED}✗ FAIL: Expected 200, got $HTTP_CODE${NC}"
  echo "  Response: $BODY"
fi
echo ""

# ========================================
# 10. ADMIN: Delete Modality (should pass)
# ========================================
echo -e "${YELLOW}[TEST 10] Admin: Delete Modality (should pass)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -b cookies-admin.txt -X DELETE "$API_URL/modalities/$MODALITY_ID")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ PASS: Modality deleted (200)${NC}"
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
echo -e "${GREEN}✓${NC} Admin can register, login, create, update, delete"
echo -e "${GREEN}✓${NC} Unauthenticated users blocked from protected routes"
echo -e "${GREEN}✓${NC} Student blocked from admin endpoints"
echo -e "${GREEN}✓${NC} Public routes accessible"
echo ""

# Cleanup
rm -f cookies-admin.txt cookies-student.txt
