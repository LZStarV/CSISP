@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%~dp0\..\..\..

if exist "%ROOT_DIR%\.env" (
  for /f "usebackq tokens=*" %%a in (`type "%ROOT_DIR%\.env"`) do (
    for /f "tokens=1,2 delims==" %%i in ("%%a") do (
      if not "%%i"=="" set %%i=%%j
    )
  )
)

echo [INFO] 启动数据库服务
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" --env-file "%ROOT_DIR%\.env" up -d postgres redis

echo [INFO] 等待数据库就绪
set /a counter=0
:wait_db
set /a counter+=1
if !counter! gtr 30 (
  echo [ERROR] 数据库启动超时
  exit /b 1
)
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres pg_isready >nul 2>&1
if errorlevel 1 (
  timeout /t 2 /nobreak >nul
  goto wait_db
)

echo [INFO] 创建应用用户与数据库
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %POSTGRES_USER% -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%' CREATEDB;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %POSTGRES_USER% -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %POSTGRES_USER% -d %DB_NAME% -c "GRANT ALL ON SCHEMA public TO %DB_USER%;" >nul 2>&1

echo [SUCCESS] 初始化完成
endlocal
