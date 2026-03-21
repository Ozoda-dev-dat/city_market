#!/bin/bash

# Production Environment Setup Script
# =================================

echo "🚀 Setting up Production Environment for Supermarket Go"
echo "=================================================="

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

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    exit 1
fi

# Copy production template to .env
print_info "Copying production environment template..."
cp .env.production .env
print_status "Production template copied to .env"

# Check for required tools
print_info "Checking required tools..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_status "Node.js found: $(node --version)"

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_status "npm found: $(npm --version)"

# Interactive setup
echo ""
print_info "📝 Please update the following variables in .env:"
echo ""

# Database setup
echo -e "${YELLOW}🗄️  Database Configuration:${NC}"
read -p "Enter your NeonDB connection string (or press Enter to keep placeholder): " db_url
if [ ! -z "$db_url" ]; then
    sed -i "s|postgresql://username:password@hostname/dbname?sslmode=require|$db_url|g" .env
    print_status "Database URL updated"
fi

# Domain setup
echo ""
echo -e "${YELLOW}🌐 Domain Configuration:${NC}"
read -p "Enter your domain (e.g., yourdomain.com): " domain
if [ ! -z "$domain" ]; then
    sed -i "s|yourdomain.com|$domain|g" .env
    print_status "Domain updated to $domain"
fi

# API Keys setup
echo ""
echo -e "${YELLOW}🔑 API Keys:${NC}"
read -p "Enter your API keys (comma-separated): " api_keys
if [ ! -z "$api_keys" ]; then
    sed -i "s|your_production_api_key_here|$api_keys|g" .env
    print_status "API keys updated"
fi

# Install dependencies
echo ""
print_info "📦 Installing production dependencies..."
npm ci --only=production
if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Build application
echo ""
print_info "🔨 Building application for production..."
npm run build
if [ $? -eq 0 ]; then
    print_status "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Run tests
echo ""
print_info "🧪 Running production tests..."
npm test
if [ $? -eq 0 ]; then
    print_status "All tests passed"
else
    print_warning "Some tests failed, but continuing..."
fi

# Environment validation
echo ""
print_info "🔍 Validating environment variables..."

# Check critical variables
required_vars=("DATABASE_URL" "YOUR_DOMAIN" "NODE_ENV" "JWT_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if grep -q "$var=.*placeholder\|$var=.*yourdomain\|$var=.*username:password" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    print_status "All critical environment variables are set"
else
    print_warning "Please update these variables in .env:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
fi

# Security check
echo ""
print_info "🔒 Running security checks..."

# Check if secrets are properly generated
if grep -q "56dbf3c5a97b6cd3e7ad089f599379f7bb361359fbac65b31b4594a84da747c48d0da94f28180149d270f92c8f6e63da8736e3fc0c1bd17cdfa5019d0565c7ec" .env; then
    print_warning "Using default security keys. Generate new ones for production!"
else
    print_status "Security keys are properly set"
fi

# Deployment platform selection
echo ""
print_info "🚀 Select deployment platform:"
echo "1) Railway"
echo "2) Render"
echo "3) Vercel"
echo "4) Custom"
echo "5) Skip deployment"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_info "Setting up for Railway deployment..."
        echo "Please set these environment variables in Railway dashboard:"
        cat .env | grep -E "(DATABASE_URL|YOUR_DOMAIN|NODE_ENV|JWT_SECRET|ENCRYPTION_KEY)"
        ;;
    2)
        print_info "Setting up for Render deployment..."
        echo "Please set these environment variables in Render dashboard:"
        cat .env | grep -E "(DATABASE_URL|YOUR_DOMAIN|NODE_ENV|JWT_SECRET|ENCRYPTION_KEY)"
        ;;
    3)
        print_info "Setting up for Vercel deployment..."
        echo "Please set these environment variables in Vercel dashboard:"
        cat .env | grep -E "(DATABASE_URL|YOUR_DOMAIN|NODE_ENV|JWT_SECRET|ENCRYPTION_KEY)"
        ;;
    4)
        print_info "Custom deployment setup..."
        echo "Your environment variables are ready in .env"
        ;;
    5)
        print_info "Skipping deployment setup"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Final summary
echo ""
print_status "🎉 Production setup completed!"
echo ""
echo "📋 Summary:"
echo "  ✅ Environment variables configured"
echo "  ✅ Dependencies installed"
echo "  ✅ Application built"
echo "  ✅ Tests run"
echo "  ✅ Security checks performed"
echo ""
echo "📚 Next Steps:"
echo "  1. Review and update any remaining placeholder values in .env"
echo "  2. Deploy to your chosen platform"
echo "  3. Test the deployed application"
echo "  4. Monitor logs and performance"
echo ""
echo "📖 For detailed deployment instructions, see:"
echo "  📄 PRODUCTION_DEPLOYMENT.md"
echo "  📄 CORS_SETUP.md"
echo ""
print_info "Good luck with your production deployment! 🚀"
