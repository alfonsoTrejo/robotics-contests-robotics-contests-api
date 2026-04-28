#!/bin/bash

# Quick test to verify API is running

API_URL="${API_URL:-https://localhost:8080}"
TLS_CA_CERT="${TLS_CA_CERT:-../certs/localhost-cert.pem}"

curl() {
  command curl --cacert "$TLS_CA_CERT" "$@"
}

echo "Testing API connection..."
echo "URL: $API_URL"
echo ""

# Check health endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✓ API is running and healthy"
  echo "  Response: $BODY"
  echo ""
  echo "You can now run:"
  echo "  ./test-rbac.sh       # Test RBAC permissions"
  echo "  ./test-student.sh    # Test student ownership"
  exit 0
else
  echo "✗ API is not responding correctly"
  echo "  Expected: 200, Got: $HTTP_CODE"
  echo "  Response: $BODY"
  echo ""
  echo "Make sure the API is running:"
  echo "  npm run dev"
  exit 1
fi
