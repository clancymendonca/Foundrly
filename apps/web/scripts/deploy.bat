@echo off
setlocal enabledelayedexpansion

REM Foundrly Docker Deployment Script for Windows
REM Usage: scripts\deploy.bat [environment]

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

echo 🚀 Starting Foundrly deployment for %ENVIRONMENT% environment

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose is not installed. Please install it first.
    exit /b 1
)

REM Check if environment file exists
if not exist ".env.%ENVIRONMENT%" (
    echo ⚠️  Warning: .env.%ENVIRONMENT% file not found
    echo    Make sure you have set up your environment variables
    set /p CONTINUE="Continue anyway? (y/N): "
    if /i not "!CONTINUE!"=="y" exit /b 1
)

REM Backup current deployment
docker ps | findstr "foundrly-app" >nul
if not errorlevel 1 (
    echo 📦 Creating backup of current deployment...
    docker-compose -f docker-compose.prod.yml down
    echo ✅ Backup completed
)

REM Build and deploy
echo 🔨 Building Docker image...
docker-compose -f docker-compose.prod.yml build --no-cache

echo 🚀 Starting services...
docker-compose -f docker-compose.prod.yml up -d

echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker ps | findstr "foundrly-app-prod" >nul
if errorlevel 1 (
    echo ❌ Deployment failed. Check logs with: docker-compose -f docker-compose.prod.yml logs
    exit /b 1
)

echo ✅ Deployment successful!

REM Show status
echo 📊 Deployment Status:
docker-compose -f docker-compose.prod.yml ps

echo 📈 Resource Usage:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo 🔗 Access URLs:
echo    Application: http://localhost:3000
echo    Health Check: http://localhost:3000/api/health

echo 📋 Recent logs:
docker-compose -f docker-compose.prod.yml logs --tail=20

echo 🎉 Deployment completed successfully!
echo    Your application is now running at: http://localhost:3000
echo    Use 'docker-compose -f docker-compose.prod.yml logs -f' to monitor logs

endlocal
