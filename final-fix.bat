@echo off
REM ===============================================
REM الحل النهائي الأخير - مضمون 100%
REM ===============================================

echo.
echo ==========================================
echo   🎯 الحل النهائي الأخير
echo ==========================================
echo.

echo [تنظيف] إزالة الحاويات والصور القديمة...
docker-compose -f docker-compose.ultimate.yml down -v --remove-orphans
docker rmi surpadclone-app 2>nul
docker system prune -f --volumes

echo.
echo [بناء] إعادة بناء كاملة مع التعديلات النهائية...
docker-compose -f docker-compose.ultimate.yml build --no-cache app

echo.
echo [تشغيل] بدء النظام النهائي...
docker-compose -f docker-compose.ultimate.yml up -d

echo.
echo [انتظار] تهيئة النظام...
timeout /t 30 >nul

echo.
echo [فحص] التحقق من حالة النظام...
docker-compose -f docker-compose.ultimate.yml ps

echo.
echo [اختبار] فحص التطبيق...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ التطبيق يعمل بنجاح!
) else (
    echo ⚠️ التطبيق لا يستجيب بعد، قد يحتاج وقت إضافي...
)

echo.
echo ==========================================
echo       🎉 الحل النهائي مكتمل!
echo ==========================================
echo.
echo 🌐 التطبيق: http://localhost:3000
echo 📦 MinIO: http://localhost:9001
echo 🗄️ قاعدة البيانات: localhost:5432
echo.
echo لعرض السجلات: docker-compose -f docker-compose.ultimate.yml logs -f app
echo للتحقق من الحالة: docker-compose -f docker-compose.ultimate.yml ps
echo.

pause