@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0\..\..\.."

echo [INFO] Starting database services
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" up -d postgres redis mongo
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

if "%DB_HOST%"=="" (
    echo [ERROR] Missing required environment variables (e.g., DB_HOST). Please run 'infisical login' and start via 'infisical run'.
    exit /b 1
)

echo [INFO] Creating application user and database
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U "%POSTGRES_USER%" -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%' CREATEDB;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U "%POSTGRES_USER%" -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U "%POSTGRES_USER%" -c "CREATE DATABASE csisp_dev OWNER %DB_USER%;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U "%POSTGRES_USER%" -d "%DB_NAME%" -c "GRANT ALL ON SCHEMA public TO %DB_USER%;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U "%POSTGRES_USER%" -d "csisp_dev" -c "GRANT ALL ON SCHEMA public TO %DB_USER%;" >nul 2>&1

echo [INFO] Checking database initialization state
set "HAS_USER_TABLE="
set "HAS_MFA_TABLE="
set "HAS_RESET_TABLE="
for /f "usebackq delims=" %%A in (`docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U "%DB_USER%" -d "%DB_NAME%" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user';" 2^>nul`) do set "HAS_USER_TABLE=%%A"
for /f "usebackq delims=" %%A in (`docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U "%DB_USER%" -d "%DB_NAME%" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mfa_settings';" 2^>nul`) do set "HAS_MFA_TABLE=%%A"
for /f "usebackq delims=" %%A in (`docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U "%DB_USER%" -d "%DB_NAME%" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_resets';" 2^>nul`) do set "HAS_RESET_TABLE=%%A"

if "%HAS_USER_TABLE%"=="1" if "%HAS_MFA_TABLE%"=="1" if "%HAS_RESET_TABLE%"=="1" (
    echo [INFO] Core tables detected (user/mfa_settings/password_resets), skipping migration
) else (
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
)

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
