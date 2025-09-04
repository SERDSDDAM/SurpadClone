@echo off
REM ===============================================
REM تشغيل سريع للنظام النهائي - Windows
REM ===============================================

echo.
echo ========================================
echo   🚀 تشغيل سريع - النظام النهائي
echo ========================================
echo.

REM التحقق السريع من Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [خطأ] Docker غير متوفر!
    echo جرب تشغيل: start-ultimate.bat للإعداد الكامل
    pause
    exit /b 1
)

echo [معلومات] بدء التشغيل السريع...

REM تشغيل النظام مباشرة
docker-compose -f docker-compose.ultimate.yml up -d

echo.
echo ========================================
echo      🎉 النظام جاهز!
echo ========================================
echo.
echo 🌐 التطبيق: http://localhost:3000
echo 📦 MinIO: http://localhost:9001
echo.
echo لعرض السجلات: docker-compose -f docker-compose.ultimate.yml logs -f
echo للإيقاف: docker-compose -f docker-compose.ultimate.yml down
echo.

pause