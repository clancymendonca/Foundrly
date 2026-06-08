#!/bin/bash

# Docker Development Script for Foundrly
# This script provides convenient commands for managing the Docker development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       - Start development environment"
    echo "  stop        - Stop development environment"
    echo "  restart     - Restart development environment"
    echo "  build       - Build development image"
    echo "  rebuild     - Rebuild development image (no cache)"
    echo "  logs        - Show application logs"
    echo "  shell       - Access container shell"
    echo "  clean       - Clean up containers and volumes"
    echo "  status      - Show container status"
    echo "  db-start    - Start with PostgreSQL database"
    echo "  db-stop     - Stop database services"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs -f"
    echo "  $0 shell"
}

# Function to start development environment
start_dev() {
    print_header "Starting Foundrly Development Environment"
    check_docker
    
    print_status "Building development image..."
    docker-compose -f docker-compose.dev.yml build
    
    print_status "Starting services..."
    docker-compose -f docker-compose.dev.yml up -d
    
    print_status "Development environment started!"
    print_status "Access your application at: http://localhost:3000"
    print_status "View logs with: $0 logs"
}

# Function to stop development environment
stop_dev() {
    print_header "Stopping Foundrly Development Environment"
    check_docker
    
    print_status "Stopping services..."
    docker-compose -f docker-compose.dev.yml down
    
    print_status "Development environment stopped!"
}

# Function to restart development environment
restart_dev() {
    print_header "Restarting Foundrly Development Environment"
    stop_dev
    start_dev
}

# Function to build development image
build_dev() {
    print_header "Building Foundrly Development Image"
    check_docker
    
    print_status "Building image..."
    docker-compose -f docker-compose.dev.yml build
    
    print_status "Build completed!"
}

# Function to rebuild development image
rebuild_dev() {
    print_header "Rebuilding Foundrly Development Image (No Cache)"
    check_docker
    
    print_status "Rebuilding image (no cache)..."
    docker-compose -f docker-compose.dev.yml build --no-cache
    
    print_status "Rebuild completed!"
}

# Function to show logs
show_logs() {
    print_header "Foundrly Application Logs"
    check_docker
    
    docker-compose -f docker-compose.dev.yml logs "$@"
}

# Function to access container shell
access_shell() {
    print_header "Accessing Foundrly Container Shell"
    check_docker
    
    print_status "Opening shell in foundrly-app-dev container..."
    docker exec -it foundrly-app-dev sh
}

# Function to clean up
clean_up() {
    print_header "Cleaning Up Docker Resources"
    check_docker
    
    print_warning "This will remove all containers, networks, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping and removing containers..."
        docker-compose -f docker-compose.dev.yml down -v
        
        print_status "Removing unused Docker resources..."
        docker system prune -f
        
        print_status "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show status
show_status() {
    print_header "Foundrly Container Status"
    check_docker
    
    docker-compose -f docker-compose.dev.yml ps
    echo ""
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to start with database
start_with_db() {
    print_header "Starting Foundrly with PostgreSQL Database"
    check_docker
    
    print_status "Starting app and database services..."
    docker-compose -f docker-compose.yml --profile database up -d
    
    print_status "Services started!"
    print_status "Application: http://localhost:3000"
    print_status "pgAdmin: http://localhost:8080 (admin@foundrly.com / admin123)"
    print_status "Database: postgresql://foundrly_user:foundrly_password@localhost:5432/foundrly"
}

# Function to stop database services
stop_db() {
    print_header "Stopping Database Services"
    check_docker
    
    print_status "Stopping database services..."
    docker-compose -f docker-compose.yml --profile database down
    
    print_status "Database services stopped!"
}

# Main script logic
case "${1:-help}" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    build)
        build_dev
        ;;
    rebuild)
        rebuild_dev
        ;;
    logs)
        shift
        show_logs "$@"
        ;;
    shell)
        access_shell
        ;;
    clean)
        clean_up
        ;;
    status)
        show_status
        ;;
    db-start)
        start_with_db
        ;;
    db-stop)
        stop_db
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
