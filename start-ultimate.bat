@echo off
REM ===============================================
REM الحل النهائي لتشغيل نظام بنّاء اليمن - Windows
REM ===============================================

echo.
echo =============================================
echo   🚀 الحل النهائي - نظام بنّاء اليمن  
echo =============================================
echo.

REM إعداد الألوان
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"
set "GREEN=%ESC%[32m"
set "RED=%ESC%[31m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "RESET=%ESC%[0m"

echo %BLUE%[معلومات] بدء الحل النهائي...%RESET%
echo.

REM التحقق من متطلبات النظام
echo %BLUE%[فحص] التحقق من متطلبات النظام...%RESET%

REM فحص Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[خطأ فادح] Docker غير مثبت!%RESET%
    echo %YELLOW%يجب تثبيت Docker Desktop أولاً من: https://www.docker.com/products/docker-desktop/%RESET%
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[خطأ فادح] Docker Compose غير مثبت!%RESET%
    pause
    exit /b 1
)

echo %GREEN%✓ Docker متوفر ومجهز%RESET%
echo.

REM تنظيف شامل قبل البدء
echo %BLUE%[تنظيف] إزالة الحاويات والشبكات القديمة...%RESET%
docker-compose -f docker-compose.ultimate.yml down -v --remove-orphans >nul 2>&1
docker-compose -f docker-compose.simple.yml down -v --remove-orphans >nul 2>&1
docker-compose down -v --remove-orphans >nul 2>&1

REM تنظيف الصور القديمة
echo %BLUE%[تنظيف] إزالة الصور القديمة...%RESET%
docker system prune -f >nul 2>&1

echo %GREEN%✓ تم التنظيف بنجاح%RESET%
echo.

REM إنشاء المجلدات المطلوبة
echo %BLUE%[إعداد] إنشاء المجلدات المطلوبة...%RESET%
if not exist temp-uploads mkdir temp-uploads
if not exist attached_assets mkdir attached_assets
if not exist logs mkdir logs
if not exist init-sql mkdir init-sql

echo %GREEN%✓ تم إنشاء المجلدات%RESET%
echo.

REM إنشاء ملف إعداد قاعدة البيانات
echo %BLUE%[إعداد] تحضير قاعدة البيانات...%RESET%
echo -- إعداد قاعدة البيانات بنّاء اليمن > init-sql\01-ultimate-setup.sql
echo CREATE EXTENSION IF NOT EXISTS postgis; >> init-sql\01-ultimate-setup.sql
echo CREATE EXTENSION IF NOT EXISTS postgis_topology; >> init-sql\01-ultimate-setup.sql
echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; >> init-sql\01-ultimate-setup.sql
echo GRANT ALL PRIVILEGES ON DATABASE binaa_yemen TO postgres; >> init-sql\01-ultimate-setup.sql
echo ALTER USER postgres WITH SUPERUSER; >> init-sql\01-ultimate-setup.sql

echo %GREEN%✓ تم إعداد قاعدة البيانات%RESET%
echo.

REM إنشاء ملف البيئة النهائي
echo %BLUE%[إعداد] تحضير متغيرات البيئة...%RESET%
echo # ملف البيئة النهائي - نظام بنّاء اليمن > .env.ultimate
echo NODE_ENV=development >> .env.ultimate
echo PORT=3000 >> .env.ultimate
echo DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/binaa_yemen >> .env.ultimate
echo REDIS_URL=redis://localhost:6379 >> .env.ultimate
echo JWT_SECRET=ultimate-jwt-secret-key-2025-binaa-yemen >> .env.ultimate
echo SESSION_SECRET=ultimate-session-secret-2025-binaa-yemen >> .env.ultimate

echo %GREEN%✓ تم إعداد متغيرات البيئة%RESET%
echo.

REM بدء النظام
echo %BLUE%[تشغيل] بناء وتشغيل النظام الكامل...%RESET%
echo %YELLOW%هذا قد يستغرق بضع دقائق في المرة الأولى...%RESET%
echo.

docker-compose -f docker-compose.ultimate.yml up --build -d

if %errorlevel% neq 0 (
    echo.
    echo %RED%[خطأ] فشل في تشغيل النظام!%RESET%
    echo %YELLOW%جاري عرض سجل الأخطاء...%RESET%
    docker-compose -f docker-compose.ultimate.yml logs
    pause
    exit /b 1
)

REM انتظار تهيئة الخدمات
echo %BLUE%[انتظار] تهيئة الخدمات...%RESET%
timeout /t 30 >nul

echo.
echo %GREEN%✓ تم تشغيل النظام بنجاح!%RESET%
echo.

REM فحص حالة الخدمات
echo %BLUE%[فحص] التحقق من حالة الخدمات...%RESET%
docker-compose -f docker-compose.ultimate.yml ps

echo.
echo =============================================
echo       🎉 النظام جاهز للاستخدام!
echo =============================================
echo.
echo %GREEN%🌐 التطبيق الرئيسي:%RESET%     http://localhost:3000
echo %GREEN%🗄️  قاعدة البيانات:%RESET%      localhost:5432
echo %GREEN%🔴 Redis:%RESET%               localhost:6379  
echo %GREEN%📦 MinIO Console:%RESET%       http://localhost:9001
echo    %YELLOW%المستخدم:%RESET% minioadmin
echo    %YELLOW%كلمة المرور:%RESET% minioadmin123
echo.
echo %BLUE%أوامر الإدارة:%RESET%
echo   docker-compose -f docker-compose.ultimate.yml logs -f    : متابعة السجلات
echo   docker-compose -f docker-compose.ultimate.yml down       : إيقاف النظام
echo   docker-compose -f docker-compose.ultimate.yml restart    : إعادة تشغيل
echo.
echo %GREEN%🚀 النظام يعمل الآن بكامل قدرته!%RESET%
echo.

pause