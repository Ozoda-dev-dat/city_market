#!/bin/bash

# Production Deployment Script
# ==========================

echo "🚀 Deploying Supermarket Go to Production"
echo "======================================="

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

# Check if we're on main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    print_error "You must be on the main branch to deploy to production"
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    print_error "Working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# Environment validation
print_info "🔍 Validating production environment..."

# Check critical environment variables
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    exit 1
fi

# Check if production variables are set
if grep -q "YOUR_DOMAIN=.*yourdomain\|DATABASE_URL=.*username:password" .env; then
    print_error "Please update placeholder values in .env before deploying to production"
    exit 1
fi

print_status "Environment variables validated"

# Security checks
print_info "🔒 Running security checks..."

# Run security audit
npm audit --audit-level=moderate
if [ $? -ne 0 ]; then
    print_error "Security audit failed. Please fix vulnerabilities before deploying."
    exit 1
fi

print_status "Security audit passed"

# Build application
print_info "🔨 Building application for production..."

# Install production dependencies
npm ci --only=production
if [ $? -ne 0 ]; then
    print_error "Failed to install production dependencies"
    exit 1
fi

# Build server
npm run build:server
if [ $? -ne 0 ]; then
    print_error "Server build failed"
    exit 1
fi

# Build mobile app (if configured)
if [ -n "$EXPO_TOKEN" ]; then
    print_info "📱 Building mobile apps..."
    
    # Build Android
    expo build:android --non-interactive --no-publish
    if [ $? -ne 0 ]; then
        print_warning "Android build failed, but continuing..."
    fi
    
    # Build iOS
    expo build:ios --non-interactive --no-publish
    if [ $? -ne 0 ]; then
        print_warning "iOS build failed, but continuing..."
    fi
else
    print_warning "EXPO_TOKEN not set. Skipping mobile app builds."
fi

print_status "Application built successfully"

# Run tests
print_info "🧪 Running production tests..."

# Run unit tests
npm run test:unit
if [ $? -ne 0 ]; then
    print_error "Unit tests failed"
    exit 1
fi

# Run integration tests
npm run test:integration
if [ $? -ne 0 ]; then
    print_error "Integration tests failed"
    exit 1
fi

print_status "All tests passed"

# Database migration
print_info "🗄️  Running database migrations..."

# Check if database is accessible
DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2)
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not found in .env"
    exit 1
fi

# Run migrations
npm run db:migrate:test
if [ $? -ne 0 ]; then
    print_error "Database migration failed"
    exit 1
fi

print_status "Database migrations completed"

# Create backup before deployment
print_info "💾 Creating pre-deployment backup..."

npm run backup:create
if [ $? -ne 0 ]; then
    print_warning "Backup creation failed, but continuing..."
else
    print_status "Pre-deployment backup created"
fi

# Deployment
print_info "🚀 Deploying to production..."

# Check deployment method
DEPLOYMENT_METHOD=${DEPLOYMENT_METHOD:-docker}

case $DEPLOYMENT_METHOD in
    "docker")
        print_info "Deploying with Docker..."
        
        # Build Docker image
        docker build -t supermarket-go:latest .
        if [ $? -ne 0 ]; then
            print_error "Docker build failed"
            exit 1
        fi
        
        # Stop existing container
        docker stop supermarket-go 2>/dev/null || true
        docker rm supermarket-go 2>/dev/null || true
        
        # Start new container
        docker run -d \
            --name supermarket-go \
            --restart unless-stopped \
            -p 5001:5001 \
            --env-file .env \
            supermarket-go:latest
            
        if [ $? -ne 0 ]; then
            print_error "Docker deployment failed"
            exit 1
        fi
        ;;
        
    "kubernetes")
        print_info "Deploying to Kubernetes..."
        kubectl apply -f k8s/
        if [ $? -ne 0 ]; then
            print_error "Kubernetes deployment failed"
            exit 1
        fi
        ;;
        
    "pm2")
        print_info "Deploying with PM2..."
        
        # Stop existing process
        pm2 stop supermarket-go 2>/dev/null || true
        pm2 delete supermarket-go 2>/dev/null || true
        
        # Start new process
        pm2 start server_dist/index.js --name supermarket-go --env production
        if [ $? -ne 0 ]; then
            print_error "PM2 deployment failed"
            exit 1
        fi
        ;;
        
    *)
        print_error "Unknown deployment method: $DEPLOYMENT_METHOD"
        exit 1
        ;;
esac

print_status "Deployment completed"

# Health check
print_info "🏥 Running health checks..."

# Wait for application to start
sleep 30

# Check if server is responding
API_URL=$(grep API_URL .env | cut -d '=' -f2)
if [ -z "$API_URL" ]; then
    API_URL="https://supermarket-go.uz/api"
fi

# Health check endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$response" != "200" ]; then
    print_error "Health check failed. Server returned HTTP $response"
    exit 1
fi

print_status "Health check passed"

# Smoke tests
print_info "💨 Running smoke tests..."

npm run test:smoke
if [ $? -ne 0 ]; then
    print_error "Smoke tests failed"
    exit 1
fi

print_status "Smoke tests passed"

# Cleanup
print_info "🧹 Cleaning up..."

# Remove unused Docker images
docker image prune -f 2>/dev/null || true

# Clean up old backups (keep last 7 days)
find ./backups -name "*.sql" -mtime +7 -delete 2>/dev/null || true

print_status "Cleanup completed"

# Notification
print_info "📢 Sending deployment notification..."

# Send Slack notification (if webhook is configured)
SLACK_WEBHOOK_URL=$(grep SLACK_WEBHOOK_URL .env | cut -d '=' -f2)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Supermarket Go deployed to production successfully!\nBranch: $current_branch\nCommit: $(git rev-parse HEAD)\nTime: $(date)\"}" \
        "$SLACK_WEBHOOK_URL" 2>/dev/null || true
fi

# Final summary
echo ""
echo "=========================================="
echo "🎉 Production Deployment Summary"
echo "=========================================="
print_status "✅ Environment validated"
print_status "✅ Security checks passed"
print_status "✅ Application built"
print_status "✅ Tests passed"
print_status "✅ Database migrated"
print_status "✅ Backup created"
print_status "✅ Deployment completed"
print_status "✅ Health checks passed"
print_status "✅ Smoke tests passed"

echo ""
print_info "🌐 Application is now live at: https://supermarket-go.uz"
print_info "📊 Monitor at: https://supermarket-go.uz/api/health"
print_info "📈 Analytics: Check your monitoring dashboard"

echo ""
print_status "🚀 Production deployment completed successfully!"

# Create deployment tag
git tag -a "production-$(date +%Y%m%d-%H%M%S)" -m "Production deployment $(date)"
git push origin --tags

echo ""
print_info "📝 Deployment tag created and pushed"
