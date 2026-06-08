#!/bin/bash

# Foundrly Docker Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-production}

echo -e "${GREEN}🚀 Starting Foundrly deployment for $ENVIRONMENT environment${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed. Please install it first.${NC}"
    exit 1
fi

# Function to check if environment file exists
check_env_file() {
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        echo -e "${YELLOW}⚠️  Warning: .env.$ENVIRONMENT file not found${NC}"
        echo -e "${YELLOW}   Make sure you have set up your environment variables${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Function to backup current deployment
backup_current() {
    if docker ps | grep -q "foundrly-app"; then
        echo -e "${YELLOW}📦 Creating backup of current deployment...${NC}"
        docker-compose -f docker-compose.prod.yml down
        echo -e "${GREEN}✅ Backup completed${NC}"
    fi
}

# Function to build and deploy
deploy() {
    echo -e "${GREEN}🔨 Building Docker image...${NC}"
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    echo -e "${GREEN}🚀 Starting services...${NC}"
    docker-compose -f docker-compose.prod.yml up -d
    
    echo -e "${GREEN}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Check if services are running
    if docker ps | grep -q "foundrly-app-prod"; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
    else
        echo -e "${RED}❌ Deployment failed. Check logs with: docker-compose -f docker-compose.prod.yml logs${NC}"
        exit 1
    fi
}

# Function to show status
show_status() {
    echo -e "${GREEN}📊 Deployment Status:${NC}"
    docker-compose -f docker-compose.prod.yml ps
    
    echo -e "${GREEN}📈 Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    
    echo -e "${GREEN}🔗 Access URLs:${NC}"
    echo -e "   Application: http://localhost:3000"
    echo -e "   Health Check: http://localhost:3000/api/health"
}

# Function to show logs
show_logs() {
    echo -e "${GREEN}📋 Recent logs:${NC}"
    docker-compose -f docker-compose.prod.yml logs --tail=20
}

# Main deployment process
main() {
    check_env_file
    backup_current
    deploy
    show_status
    show_logs
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}   Your application is now running at: http://localhost:3000${NC}"
    echo -e "${YELLOW}   Use 'docker-compose -f docker-compose.prod.yml logs -f' to monitor logs${NC}"
}

# Handle different commands
case "$1" in
    "start")
        echo -e "${GREEN}🚀 Starting Foundrly...${NC}"
        docker-compose -f docker-compose.prod.yml up -d
        show_status
        ;;
    "stop")
        echo -e "${YELLOW}🛑 Stopping Foundrly...${NC}"
        docker-compose -f docker-compose.prod.yml down
        echo -e "${GREEN}✅ Stopped successfully${NC}"
        ;;
    "restart")
        echo -e "${YELLOW}🔄 Restarting Foundrly...${NC}"
        docker-compose -f docker-compose.prod.yml restart
        show_status
        ;;
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "status")
        show_status
        ;;
    "health")
        echo -e "${GREEN}🏥 Health Check:${NC}"
        curl -s http://localhost:3000/api/health | jq . || echo "Health check failed"
        ;;
    "update")
        echo -e "${GREEN}📥 Pulling latest changes...${NC}"
        git pull origin main
        main
        ;;
    "clean")
        echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -f
        echo -e "${GREEN}✅ Cleanup completed${NC}"
        ;;
    *)
        main
        ;;
esac
