@echo off
REM ===============================================
REM سكريبت تشغيل نظام بناء اليمن محلياً - Windows
REM ===============================================

echo ===================================
echo   تشغيل نظام بناء اليمن محلياً
echo ===================================
echo.

REM التحقق من وجود Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [خطأ] Docker غير مثبت. يرجى تثبيت Docker أولاً.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [خطأ] Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً.
    pause
    exit /b 1
)

echo [معلومات] Docker متوفر ✓
echo.

REM إنشاء ملف البيئة إذا لم يكن موجوداً
if not exist .env.local (
    echo [تحذير] ملف .env.local غير موجود، سيتم إنشاؤه...
    copy .env.local.example .env.local >nul
    echo [نجح] تم إنشاء ملف .env.local ✓
    echo.
)

REM إنشاء المجلدات المطلوبة
if not exist temp-uploads mkdir temp-uploads
if not exist attached_assets mkdir attached_assets
if not exist logs mkdir logs
if not exist init-sql mkdir init-sql

echo [معلومات] تم إنشاء المجلدات المطلوبة ✓
echo.

REM تنظيف Docker إذا لزم الأمر
echo [معلومات] تنظيف الحاويات القديمة...
docker-compose -f docker-compose.simple.yml down >nul 2>&1
echo.

REM تشغيل الخدمات الأساسية
echo [معلومات] تشغيل الخدمات الأساسية (PostgreSQL, Redis, MinIO)...
docker-compose -f docker-compose.simple.yml up -d

if %errorlevel% neq 0 (
    echo [خطأ] فشل في تشغيل الخدمات
    pause
    exit /b 1
)

echo [نجح] تم تشغيل الخدمات الأساسية ✓
echo.

REM انتظار تهيئة قاعدة البيانات
echo [معلومات] انتظار تهيئة قاعدة البيانات...
timeout /t 15 >nul

REM التحقق من حالة الخدمات
echo [معلومات] حالة الخدمات:
docker-compose -f docker-compose.simple.yml ps
echo.

REM تحقق من وجود node_modules
if not exist node_modules (
    echo [معلومات] تثبيت التبعيات...
    call npm install
    if %errorlevel% neq 0 (
        echo [خطأ] فشل في تثبيت التبعيات
        pause
        exit /b 1
    )
    echo [نجح] تم تثبيت التبعيات ✓
    echo.
)

REM تطبيق تحديثات قاعدة البيانات
echo [معلومات] تطبيق تحديثات قاعدة البيانات...
call npm run db:push
echo.

echo ===================================
echo       النظام جاهز للتشغيل!
echo ===================================
echo.
echo البوابات المتاحة:
echo.
echo 🌐 التطبيق الرئيسي: سيبدأ عند تشغيل npm run dev
echo 🗄️  قاعدة البيانات: localhost:5432
echo 🔴 Redis: localhost:6379  
echo 📦 MinIO Console: http://localhost:9001
echo     المستخدم: minioadmin
echo     كلمة المرور: minioadmin123
echo.
echo الآن قم بتشغيل:
echo   npm run dev
echo.
echo أوامر إضافية:
echo   docker-compose -f docker-compose.simple.yml logs : عرض سجلات الخدمات
echo   docker-compose -f docker-compose.simple.yml down : إيقاف الخدمات
echo   docker-compose -f docker-compose.simple.yml ps   : حالة الخدمات
echo.

pause