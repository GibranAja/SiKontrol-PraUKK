#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"
TOKEN=""

echo -e "${CYAN}========================================"
echo "  TESTING BACKEND API"
echo "========================================${NC}\n"

# Test 1: Login
echo -e "${YELLOW}Testing: Login Admin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo -e "  ${GREEN}✅ Login SUCCESS${NC}"
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
  echo -e "  ${RED}❌ Login FAILED${NC}"
  echo "$LOGIN_RESPONSE"
fi

echo ""
sleep 1

# Test 2: Get All Users
echo -e "${YELLOW}Testing: Get All Users${NC}"
USERS_RESPONSE=$(curl -s -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USERS_RESPONSE" | grep -q "success"; then
  echo -e "  ${GREEN}✅ Get Users SUCCESS${NC}"
else
  echo -e "  ${RED}❌ Get Users FAILED${NC}"
fi

echo ""
sleep 1

# Test 3: Get All Kategori
echo -e "${YELLOW}Testing: Get All Kategori${NC}"
KATEGORI_RESPONSE=$(curl -s -X GET "$BASE_URL/kategori" \
  -H "Authorization: Bearer $TOKEN")

if echo "$KATEGORI_RESPONSE" | grep -q "success"; then
  echo -e "  ${GREEN}✅ Get Kategori SUCCESS${NC}"
else
  echo -e "  ${RED}❌ Get Kategori FAILED${NC}"
fi

echo ""
sleep 1

# Test 4: Get All Alat
echo -e "${YELLOW}Testing: Get All Alat${NC}"
ALAT_RESPONSE=$(curl -s -X GET "$BASE_URL/alat" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ALAT_RESPONSE" | grep -q "success"; then
  echo -e "  ${GREEN}✅ Get Alat SUCCESS${NC}"
else
  echo -e "  ${RED}❌ Get Alat FAILED${NC}"
fi

echo ""
sleep 1

# Test 5: Get All Peminjaman
echo -e "${YELLOW}Testing: Get All Peminjaman${NC}"
PEMINJAMAN_RESPONSE=$(curl -s -X GET "$BASE_URL/peminjaman" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PEMINJAMAN_RESPONSE" | grep -q "success"; then
  echo -e "  ${GREEN}✅ Get Peminjaman SUCCESS${NC}"
else
  echo -e "  ${RED}❌ Get Peminjaman FAILED${NC}"
fi

echo ""
sleep 1

# Test 6: Dashboard Stats
echo -e "${YELLOW}Testing: Get Dashboard Stats${NC}"
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/laporan/dashboard" \
  -H "Authorization: Bearer $TOKEN")

if echo "$DASHBOARD_RESPONSE" | grep -q "success"; then
  echo -e "  ${GREEN}✅ Dashboard SUCCESS${NC}"
else
  echo -e "  ${RED}❌ Dashboard FAILED${NC}"
fi

echo ""
sleep 1

# Test 7: Get Log Aktivitas
echo -e "${YELLOW}Testing: Get Log Aktivitas${NC}"
LOG_RESPONSE=$(curl -s -X GET "$BASE_URL/log-aktivitas" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LOG_RESPONSE" | grep -q "success"; then
  echo -e "  ${GREEN}✅ Log Aktivitas SUCCESS${NC}"
else
  echo -e "  ${RED}❌ Log Aktivitas FAILED${NC}"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  TESTING COMPLETED!${NC}"
echo -e "${CYAN}========================================${NC}\n"
