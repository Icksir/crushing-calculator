#!/bin/bash

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Are you in the project root?"
    exit 1
fi

# Pull latest changes from git
print_status "Pulling latest changes from git..."
if git pull origin main; then
    print_status "Git pull successful"
else
    print_error "Git pull failed"
    exit 1
fi

# Check if there are changes in backend or frontend
BACKEND_CHANGED=$(git diff --name-only HEAD~1 | grep -c "^backend/")
FRONTEND_CHANGED=$(git diff --name-only HEAD~1 | grep -c "^frontend/")

if [ "$BACKEND_CHANGED" -gt 0 ]; then
    print_status "Backend changes detected - will rebuild backend"
    REBUILD_BACKEND=true
else
    print_status "No backend changes detected"
fi

if [ "$FRONTEND_CHANGED" -gt 0 ]; then
    print_status "Frontend changes detected - will rebuild frontend"
    REBUILD_FRONTEND=true
else
    print_status "No frontend changes detected"
fi

# Stop containers
print_status "Stopping containers..."
docker compose down

# Clean up old images (optional but recommended)
print_status "Cleaning up old Docker images..."
docker image prune -f

# Build and start services
if [ "$REBUILD_BACKEND" = true ] && [ "$REBUILD_FRONTEND" = true ]; then
    print_status "Rebuilding backend and frontend..."
    docker compose up -d --build
elif [ "$REBUILD_BACKEND" = true ]; then
    print_status "Rebuilding only backend..."
    docker compose up -d --build backend
elif [ "$REBUILD_FRONTEND" = true ]; then
    print_status "Rebuilding only frontend..."
    docker compose up -d --build frontend
else
    print_status "No rebuilds needed, starting services..."
    docker compose up -d
fi

# Wait a bit for services to start
print_status "Waiting for services to start..."
sleep 10

# Check if services are running
print_status "Checking service status..."
if docker compose ps | grep -q "Up"; then
    print_status "✅ Deployment successful!"
    print_status "Your app should be available at: http://your-domain.com"

    # Show logs if there were any issues
    if docker compose ps | grep -q "Restarting\|Exit"; then
        print_warning "Some services might have issues. Check logs:"
        docker compose logs --tail=20
    fi
else
    print_error "❌ Deployment failed. Check logs:"
    docker compose logs
    exit 1
fi

print_status "🎉 Deployment completed successfully!"
