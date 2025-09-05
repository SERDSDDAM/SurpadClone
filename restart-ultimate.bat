@echo off
REM ===============================================
REM إعادة تشغيل النظام النهائي مع التحديثات
REM ===============================================

echo.
echo ==========================================
echo   🔄 إعادة تشغيل النظام المحدث
echo ==========================================
echo.

echo [تنظيف] إيقاف وإزالة الحاويات القديمة...
docker-compose -f docker-compose.ultimate.yml down -v

echo.
echo [بناء] إعادة بناء مع التحديثات الجديدة...
docker-compose -f docker-compose.ultimate.yml build --no-cache app

echo.
echo [تشغيل] بدء النظام المحدث...
docker-compose -f docker-compose.ultimate.yml up -d

echo.
echo [فحص] التحقق من حالة التطبيق...
timeout /t 20 >nul
docker-compose -f docker-compose.ultimate.yml ps

echo.
echo ==========================================
echo      ✅ تم التحديث بنجاح!
echo ==========================================
echo.
echo 🌐 التطبيق: http://localhost:3000
echo 📦 MinIO: http://localhost:9001
echo.
echo لعرض السجلات: docker-compose -f docker-compose.ultimate.yml logs -f app
echo.

pause