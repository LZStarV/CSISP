@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0\..\..\.."

echo [INFO] Starting database services
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" --env-file "%ROOT_DIR%\.env" up -d postgres redis mongo
if errorlevel 1 (
    echo [ERROR] Failed to start database services
    exit /b 1
)

echo [INFO] Waiting for PostgreSQL to be ready
set /a counter=0
:wait_db
set /a counter+=1
if !counter! gtr 30 (
    echo [ERROR] PostgreSQL startup timeout
    exit /b 1
)
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres pg_isready >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_db
)
echo [SUCCESS] PostgreSQL is ready

echo [INFO] Waiting for MongoDB to be ready
set /a counter=0
:wait_mongo
set /a counter+=1
if !counter! gtr 30 (
    echo [ERROR] MongoDB startup timeout
    exit /b 1
)
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T mongo mongosh --eval "db.runCommand({ ping: 1 })" >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_mongo
)
echo [SUCCESS] MongoDB is ready

echo [INFO] Running database migration
where pnpm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pnpm not detected, please install pnpm first
    exit /b 1
)

pushd "%ROOT_DIR%"
pnpm -F @csisp/infra-database atlas:migrate:apply
if errorlevel 1 (
    echo [ERROR] Database migration failed, please check logs
    popd
    exit /b 1
)
popd

echo [INFO] Creating application user and database
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U postgres -c "CREATE USER csisp WITH PASSWORD 'csisp123' CREATEDB;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U postgres -c "CREATE DATABASE csisp OWNER csisp;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U postgres -c "CREATE DATABASE csisp_dev OWNER csisp;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U postgres -d csisp -c "GRANT ALL ON SCHEMA public TO csisp;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U postgres -d csisp_dev -c "GRANT ALL ON SCHEMA public TO csisp;" >nul 2>&1

echo [INFO] Running seed data
where pnpm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pnpm not detected, please install pnpm first
    exit /b 1
)
pushd "%ROOT_DIR%"
pnpm -F @csisp/infra-database db:seed
if errorlevel 1 (
    echo [ERROR] Seed data execution failed, please check logs
    popd
    exit /b 1
)
popd

echo [SUCCESS] Initialization completed!
endlocal
