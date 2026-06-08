@echo off
setlocal enabledelayedexpansion

REM Docker Development Script for Foundrly (Windows)
REM This script provides convenient commands for managing the Docker development environment

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."

REM Colors for output (Windows Command Prompt)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %GREEN%[INFO]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

:print_header
echo %BLUE%=== %~1 ===%NC%
goto :eof

REM Function to check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker Desktop."
    exit /b 1
)
goto :eof

REM Function to show usage
:show_usage
echo Usage: %~nx0 [COMMAND]
echo.
echo Commands:
echo   start       - Start development environment
echo   stop        - Stop development environment
echo   restart     - Restart development environment
echo   build       - Build development image
echo   rebuild     - Rebuild development image (no cache)
echo   logs        - Show application logs
echo   shell       - Access container shell
echo   clean       - Clean up containers and volumes
echo   status      - Show container status
echo   db-start    - Start with PostgreSQL database
echo   db-stop     - Stop database services
echo   help        - Show this help message
echo.
echo Examples:
echo   %~nx0 start
echo   %~nx0 logs -f
echo   %~nx0 shell
goto :eof

REM Function to start development environment
:start_dev
call :print_header "Starting Foundrly Development Environment"
call :check_docker
if errorlevel 1 exit /b 1

call :print_status "Building development image..."
cd /d "%PROJECT_DIR%"
docker-compose -f docker-compose.dev.yml build
if errorlevel 1 (
    call :print_error "Failed to build image"
    exit /b 1
)

call :print_status "Starting services..."
docker-compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
    call :print_error "Failed to start services"
    exit /b 1
)

call :print_status "Development environment started!"
call :print_status "Access your application at: http://localhost:3000"
call :print_status "View logs with: %~nx0 logs"
goto :eof

REM Function to stop development environment
:stop_dev
call :print_header "Stopping Foundrly Development Environment"
call :check_docker
if errorlevel 1 exit /b 1

call :print_status "Stopping services..."
cd /d "%PROJECT_DIR%"
docker-compose -f docker-compose.dev.yml down

call :print_status "Development environment stopped!"
goto :eof

REM Function to restart development environment
:restart_dev
call :print_header "Restarting Foundrly Development Environment"
call :stop_dev
call :start_dev
goto :eof

REM Function to build development image
:build_dev
call :print_header "Building Foundrly Development Image"
call :check_docker
if errorlevel 1 exit /b 1

call :print_status "Building image..."
cd /d "%PROJECT_DIR%"
docker-compose -f docker-compose.dev.yml build

call :print_status "Build completed!"
goto :eof

REM Function to rebuild development image
:rebuild_dev
call :print_header "Rebuilding Foundrly Development Image (No Cache)"
call :check_docker
if errorlevel 1 exit /b 1

call :print_status "Rebuilding image (no cache)..."
cd /d "%PROJECT_DIR%"
docker-compose -f docker-compose.dev.yml build --no-cache

call :print_status "Rebuild completed!"
goto :eof

REM Function to show logs
:show_logs
call :print_header "Foundrly Application Logs"
call :check_docker
if errorlevel 1 exit /b 1

cd /d "%PROJECT_DIR%"
docker-compose -f docker-compose.dev.yml logs %*
goto :eof

REM Function to access container shell
:access_shell
call :print_header "Accessing Foundrly Container Shell"
call :check_docker
if errorlevel 1 exit /b 1

call :print_status "Opening shell in foundrly-app-dev container..."
docker exec -it foundrly-app-dev sh
goto :eof

REM Function to clean up
:clean_up
call :print_header "Cleaning Up Docker Resources"
call :check_docker
if errorlevel 1 exit /b 1

call :print_warning "This will remove all containers, networks, and volumes!"
set /p "confirm=Are you sure? (y/N): "
if /i "!confirm!"=="y" (
    call :print_status "Stopping and removing containers..."
    cd /d "%PROJECT_DIR%"
    docker-compose -f docker-compose.dev.yml down -v
    
    call :print_status "Removing unused Docker resources..."
    docker system prune -f
    
    call :print_status "Cleanup completed!"
) else (
    call :print_status "Cleanup cancelled."
)
goto :eof

REM Function to show status
:show_status
call :print_header "Foundrly Container Status"
call :check_docker
if errorlevel 1 exit /b 1

cd /d "%PROJECT_DIR%"
docker-compose -f docker-compose.dev.yml ps
echo.
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
goto :eof

REM Function to start with database
:start_with_db
call :print_header "Starting Foundrly with PostgreSQL Database"
call :check_docker
if errorlevel 1 exit /b 1

call :print_status "Starting app and database services..."
cd /d "%PROJECT_DIR%"
docker-compose -f docker-compose.yml --profile database up -d

call :print_status "Services started!"
call :print_status "Application: http://localhost:3000"
call :print_status "pgAdmin: http://localhost:8080 (admin@foundrly.com / admin123)"
call :print_status "Database: postgresql://foundrly_user:foundrly_password@localhost:5432/foundrly"
goto :eof

REM Function to stop database services
:stop_db
call :print_header "Stopping Database Services"
call :check_docker
if errorlevel 1 exit /b 1

call :print_status "Stopping database services..."
cd /d "%PROJECT_DIR%"
docker-compose -f docker-compose.yml --profile database down

call :print_status "Database services stopped!"
goto :eof

REM Main script logic
if "%1"=="" goto :show_usage

if "%1"=="start" goto :start_dev
if "%1"=="stop" goto :stop_dev
if "%1"=="restart" goto :restart_dev
if "%1"=="build" goto :build_dev
if "%1"=="rebuild" goto :rebuild_dev
if "%1"=="logs" (
    shift
    goto :show_logs
)
if "%1"=="shell" goto :access_shell
if "%1"=="clean" goto :clean_up
if "%1"=="status" goto :show_status
if "%1"=="db-start" goto :start_with_db
if "%1"=="db-stop" goto :stop_db
if "%1"=="help" goto :show_usage
if "%1"=="--help" goto :show_usage
if "%1"=="-h" goto :show_usage

call :print_error "Unknown command: %1"
echo.
call :show_usage
exit /b 1
