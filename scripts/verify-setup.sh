#!/bin/bash
#
# GameView Platform - Setup Verification Script
#
# Verifies that all required services and configuration are in place
# for the full production pipeline to work.
#
# Usage: ./scripts/verify-setup.sh
#

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  GameView Platform - Setup Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0
warnings=0

check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((passed++))
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((failed++))
}

check_warn() {
    echo -e "  ${YELLOW}!${NC} $1"
    ((warnings++))
}

# ============================================
# 1. Check Node.js version
# ============================================
echo "1. Node.js Environment"
echo "───────────────────────────────────────────────────────────"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$MAJOR_VERSION" -ge 20 ]; then
        check_pass "Node.js $NODE_VERSION (required: >=20)"
    else
        check_fail "Node.js $NODE_VERSION (required: >=20)"
    fi
else
    check_fail "Node.js not found"
fi

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    check_pass "pnpm $PNPM_VERSION"
else
    check_fail "pnpm not found (run: npm install -g pnpm)"
fi

echo ""

# ============================================
# 2. Check environment files
# ============================================
echo "2. Environment Files"
echo "───────────────────────────────────────────────────────────"

if [ -f ".env" ]; then
    check_pass ".env file exists"
elif [ -f ".env.local" ]; then
    check_pass ".env.local file exists"
else
    check_fail "No .env or .env.local file found"
    echo "       Copy .env.example to .env and fill in values"
fi

if [ -f "apps/studio/.env.local" ]; then
    check_pass "apps/studio/.env.local exists"
else
    check_warn "apps/studio/.env.local not found (using root .env)"
fi

echo ""

# ============================================
# 3. Check required environment variables
# ============================================
echo "3. Required Environment Variables"
echo "───────────────────────────────────────────────────────────"

# Source .env files if they exist
[ -f ".env" ] && export $(grep -v '^#' .env | xargs)
[ -f ".env.local" ] && export $(grep -v '^#' .env.local | xargs)

check_env() {
    if [ -n "${!1}" ]; then
        # Mask the value for display
        VALUE="${!1}"
        MASKED="${VALUE:0:10}..."
        check_pass "$1 = $MASKED"
    else
        check_fail "$1 not set"
    fi
}

check_env_optional() {
    if [ -n "${!1}" ]; then
        VALUE="${!1}"
        MASKED="${VALUE:0:10}..."
        check_pass "$1 = $MASKED"
    else
        check_warn "$1 not set (optional)"
    fi
}

check_env DATABASE_URL
check_env NEXT_PUBLIC_SUPABASE_URL
check_env NEXT_PUBLIC_SUPABASE_ANON_KEY
check_env_optional SUPABASE_SERVICE_ROLE_KEY
check_env_optional MODAL_ENDPOINT_URL
check_env_optional REDIS_URL

echo ""

# ============================================
# 4. Check dependencies
# ============================================
echo "4. Dependencies"
echo "───────────────────────────────────────────────────────────"

if [ -d "node_modules" ]; then
    check_pass "node_modules exists"
else
    check_fail "node_modules not found (run: pnpm install)"
fi

if [ -f "packages/database/generated/client/index.js" ]; then
    check_pass "Prisma client generated"
else
    check_warn "Prisma client not generated (run: pnpm postinstall)"
fi

echo ""

# ============================================
# 5. Check Modal worker
# ============================================
echo "5. Modal Worker"
echo "───────────────────────────────────────────────────────────"

if [ -f "packages/processing/modal_worker.py" ]; then
    check_pass "Static Modal worker exists"
else
    check_fail "Static Modal worker not found"
fi

if [ -f "packages/processing/modal_worker_4d.py" ]; then
    check_pass "4D Motion Modal worker exists"
else
    check_warn "4D Motion Modal worker not found"
fi

if [ -n "$MODAL_ENDPOINT_URL" ]; then
    check_pass "Modal endpoint configured"
else
    check_warn "Modal endpoint not configured (jobs will be marked pending)"
fi

echo ""

# ============================================
# 6. Check Supabase buckets
# ============================================
echo "6. Supabase Storage Buckets"
echo "───────────────────────────────────────────────────────────"

echo "  Required buckets (create in Supabase dashboard):"
echo "    - production-videos (private)"
echo "    - production-outputs (public)"
echo "    - production-metadata (public)"
check_warn "Verify buckets exist in Supabase dashboard"

echo ""

# ============================================
# Summary
# ============================================
echo "═══════════════════════════════════════════════════════════"
echo "  VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo -e "  ${GREEN}Passed:${NC}   $passed"
echo -e "  ${RED}Failed:${NC}   $failed"
echo -e "  ${YELLOW}Warnings:${NC} $warnings"
echo "═══════════════════════════════════════════════════════════"

if [ $failed -gt 0 ]; then
    echo ""
    echo -e "${RED}Setup incomplete. Fix the issues above before testing.${NC}"
    echo ""
    echo "Quick setup commands:"
    echo "  1. cp .env.example .env"
    echo "  2. Edit .env with your credentials"
    echo "  3. pnpm install"
    echo "  4. pnpm dev"
    exit 1
else
    echo ""
    echo -e "${GREEN}Setup looks good! Run 'pnpm dev' to start the server.${NC}"
    echo ""
    echo "Then visit: http://localhost:3000/test-pipeline"
fi
