@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0\..\..\.."

if exist "%ROOT_DIR%\.env" (
    for /f "usebackq tokens=*" %%a in ("%ROOT_DIR%\.env") do (
        set "line=%%a"
        if not "!line:~0,1!"=="#" if not "!line!"=="" (
            for /f "tokens=1,2 delims==" %%i in ("!line!") do (
                if not "%%i"=="" set "%%i=%%j"
            )
        )
    )
)

echo [INFO] 启动数据库服务
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" --env-file "%ROOT_DIR%\.env" up -d postgres redis mongo

echo [INFO] 等待 PostgreSQL 数据库就绪
set /a counter=0
:wait_db
set /a counter+=1
if !counter! gtr 30 (
  echo [ERROR] PostgreSQL 数据库启动超时
  exit /b 1
)
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres pg_isready >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_db
)

echo [INFO] 等待 MongoDB 就绪
set /a counter=0
:wait_mongo
set /a counter+=1
if !counter! gtr 30 (
  echo [ERROR] MongoDB 启动超时
  exit /b 1
)
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T mongo mongosh --eval "db.runCommand({ ping: 1 })" >nul 2>&1
if errorlevel 1 (
  timeout /t 2 /nobreak >nul
  goto wait_mongo
)

echo [INFO] 创建应用用户与数据库
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %POSTGRES_USER% -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%' CREATEDB;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %POSTGRES_USER% -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %POSTGRES_USER% -c "CREATE DATABASE csisp_dev OWNER %DB_USER%;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %POSTGRES_USER% -d %DB_NAME% -c "GRANT ALL ON SCHEMA public TO %DB_USER%;" >nul 2>&1
docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %POSTGRES_USER% -d csisp_dev -c "GRANT ALL ON SCHEMA public TO %DB_USER%;" >nul 2>&1

echo [INFO] 检查数据库是否已初始化
for /f "usebackq tokens=*" %%r in (`docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %DB_USER% -d %DB_NAME% -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user';" 2^>nul`) do set "HAS_USER_TABLE=%%r"
for /f "usebackq tokens=*" %%r in (`docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %DB_USER% -d %DB_NAME% -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mfa_settings';" 2^>nul`) do set "HAS_MFA_TABLE=%%r"
for /f "usebackq tokens=*" %%r in (`docker compose -f "%ROOT_DIR%\infra\database\docker-compose.db.yml" exec -T postgres psql -U %DB_USER% -d %DB_NAME% -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_resets';" 2^>nul`) do set "HAS_RESET_TABLE=%%r"

if "%HAS_USER_TABLE%"=="1" if "%HAS_MFA_TABLE%"=="1" if "%HAS_RESET_TABLE%"=="1" (
  echo [INFO] 检测到核心表已存在（user/mfa_settings/password_resets），跳过迁移步骤
) else (
  echo [INFO] 执行数据库迁移（Atlas migrate apply）
  where pnpm >nul 2>&1
  if errorlevel 1 (
    echo [ERROR] 未检测到 pnpm，请先安装 pnpm 后再重试
    exit /b 1
  )

  pushd "%ROOT_DIR%"
  pnpm -F @csisp/infra-database atlas:migrate:apply
  if errorlevel 1 (
    echo [ERROR] 数据库迁移执行失败，请检查日志
    popd
    exit /b 1
  )
  popd
)

echo [INFO] 执行统一种子（@csisp/infra-database db:seed）
where pnpm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] 未检测到 pnpm，请先安装 pnpm 后再重试
  exit /b 1
)
pushd "%ROOT_DIR%"
pnpm -F @csisp/infra-database db:seed
if errorlevel 1 (
  echo [ERROR] 统一种子执行失败，请检查日志
  popd
  exit /b 1
)
popd

echo [SUCCESS] Initialization completed!
endlocal
