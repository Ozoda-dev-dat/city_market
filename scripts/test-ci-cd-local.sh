#!/bin/bash

# Local CI/CD Pipeline Test Script
# ====================================

echo "🚀 Testing CI/CD Pipeline Locally"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to run a step and check result
run_step() {
    local step_name="$1"
    local command="$2"
    
    print_info "Running: $step_name"
    echo "$command"
    
    if eval "$command"; then
        print_status "$step_name passed"
        return 0
    else
        print_error "$step_name failed"
        return 1
    fi
}

# Counter for failed steps
failed_steps=0

echo ""
print_info "🔍 Step 1: Lint and Format Check"
echo "=========================================="

run_step "ESLint Check" "npm run lint" || ((failed_steps++))
run_step "Prettier Check" "npm run format:check" || ((failed_steps++))
run_step "TypeScript Check" "npm run type-check" || ((failed_steps++))

echo ""
print_info "🔒 Step 2: Security Audit"
echo "==============================="

run_step "Security Audit" "npm audit --audit-level=moderate" || ((failed_steps++))
run_step "Dependency Check" "npm run dep:check" || ((failed_steps++))

echo ""
print_info "🧪 Step 3: Unit Tests"
echo "==========================="

run_step "Unit Tests" "npm run test:unit" || ((failed_steps++))
run_step "Test Coverage" "npm run test:coverage" || ((failed_steps++))

echo ""
print_info "🔗 Step 4: Integration Tests"
echo "================================"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 -U postgres 2>/dev/null; then
    print_warning "PostgreSQL is not running. Starting test database..."
    
    # Start PostgreSQL using Docker if available
    if command -v docker &> /dev/null; then
        print_info "Starting PostgreSQL container..."
        docker run -d --name postgres-test \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=supermarket_go_test \
            -p 5432:5432 \
            postgres:15
        
        # Wait for PostgreSQL to be ready
        print_info "Waiting for PostgreSQL to be ready..."
        for i in {1..30}; do
            if pg_isready -h localhost -p 5432 -U postgres 2>/dev/null; then
                print_status "PostgreSQL is ready"
                break
            fi
            sleep 2
        done
    else
        print_error "Docker not found. Please start PostgreSQL manually."
        ((failed_steps++))
    fi
fi

# Setup test database
print_info "Setting up test database..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/supermarket_go_test" \
JWT_SECRET="test-secret-key" \
JWT_REFRESH_SECRET="test-refresh-secret-key" \
run_step "Database Migration" "npm run db:migrate:test" || ((failed_steps++))

run_step "Database Seeding" "npm run db:seed:test" || ((failed_steps++))
run_step "Integration Tests" "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supermarket_go_test JWT_SECRET=test-secret-key JWT_REFRESH_SECRET=test-refresh-secret-key npm run test:integration" || ((failed_steps++))

echo ""
print_info "🌐 Step 5: E2E Tests"
echo "========================="

# Start Expo server in background
print_info "Starting Expo server..."
EXPO_DEBUG=true expo start --web --non-interactive &
EXPO_PID=$!

# Wait for Expo server to start
print_info "Waiting for Expo server to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:19006 > /dev/null; then
        print_status "Expo server is ready"
        break
    fi
    sleep 2
done

run_step "E2E Tests" "npm run test:e2e" || ((failed_steps++))

# Clean up Expo server
print_info "Stopping Expo server..."
kill $EXPO_PID 2>/dev/null || true

echo ""
print_info "🔨 Step 6: Build Tests"
echo "========================"

run_step "Build Server" "npm run build:server" || ((failed_steps++))
run_step "Server Tests" "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supermarket_go_test JWT_SECRET=test-secret-key JWT_REFRESH_SECRET=test-refresh-secret-key npm run test:server" || ((failed_steps++))

echo ""
print_info "📱 Step 7: Mobile App Build"
echo "=============================="

run_step "Build iOS App" "expo build:ios --non-interactive --no-publish" || ((failed_steps++))
run_step "Build Android App" "expo build:android --non-interactive --no-publish" || ((failed_steps++))

echo ""
print_info "⚡ Step 8: Performance Tests"
echo "================================"

# Start server in background
print_info "Starting server for performance tests..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/supermarket_go_test" \
JWT_SECRET="test-secret-key" \
JWT_REFRESH_SECRET="test-refresh-secret-key" \
npm run start:server &
SERVER_PID=$!

# Wait for server to be ready
print_info "Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null; then
        print_status "Server is ready"
        break
    fi
    sleep 2
done

run_step "Performance Tests" "npm run test:performance" || ((failed_steps++))
run_step "Load Tests" "npm run test:load" || ((failed_steps++))

# Clean up server
print_info "Stopping server..."
kill $SERVER_PID 2>/dev/null || true

echo ""
print_info "🗄️ Step 9: Database Optimization"
echo "=================================="

run_step "Database Optimization" "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supermarket_go_test npm run db:optimize" || ((failed_steps++))
run_step "Database Performance Tests" "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supermarket_go_test npm run test:database" || ((failed_steps++))
run_step "Database Report" "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supermarket_go_test npm run db:report" || ((failed_steps++))

echo ""
print_info "🔍 Step 10: Security Scans"
echo "============================"

# Run Trivy if available
if command -v trivy &> /dev/null; then
    run_step "Trivy Security Scan" "trivy fs --format sarif --output trivy-results.sarif ." || ((failed_steps++))
else
    print_warning "Trivy not found. Install with: brew install trivy or apt-get install trivy"
fi

# Run CodeQL if available
if command -v codeql &> /dev/null; then
    run_step "CodeQL Analysis" "codeql database analyze . --format=sarif --output=codeql-results.sarif" || ((failed_steps++))
else
    print_warning "CodeQL not found. Install with GitHub CLI"
fi

echo ""
print_info "📚 Step 11: Documentation"
echo "==========================="

run_step "Generate Documentation" "npm run docs:generate" || ((failed_steps++))

echo ""
print_info "🧹 Step 12: Cleanup"
echo "======================"

# Clean up Docker containers
if command -v docker &> /dev/null; then
    print_info "Cleaning up Docker containers..."
    docker stop postgres-test 2>/dev/null || true
    docker rm postgres-test 2>/dev/null || true
fi

# Clean up any remaining processes
pkill -f "expo start" 2>/dev/null || true
pkill -f "node server_dist" 2>/dev/null || true

# Final summary
echo ""
echo "=========================================="
echo "🏁 CI/CD Pipeline Test Summary"
echo "=========================================="

if [ $failed_steps -eq 0 ]; then
    print_status "🎉 All CI/CD steps passed successfully!"
    echo ""
    echo "✅ Lint and formatting: PASSED"
    echo "✅ Security audit: PASSED"
    echo "✅ Unit tests: PASSED"
    echo "✅ Integration tests: PASSED"
    echo "✅ E2E tests: PASSED"
    echo "✅ Build tests: PASSED"
    echo "✅ Performance tests: PASSED"
    echo "✅ Database optimization: PASSED"
    echo "✅ Security scans: PASSED"
    echo "✅ Documentation: PASSED"
    echo ""
    print_status "Your code is ready for production deployment! 🚀"
    exit 0
else
    print_error "❌ $failed_steps CI/CD step(s) failed"
    echo ""
    echo "Failed steps need to be fixed before deployment."
    echo "Check the logs above for details."
    exit 1
fi
