@echo off
REM ===============================================
REM إصلاح مشكلة Docker rollup - الحل النهائي
REM ===============================================

echo.
echo ==========================================
echo   🔧 إصلاح مشكلة rollup في Docker
echo ==========================================
echo.

echo [تنظيف] إزالة الحاويات والصور القديمة...
docker-compose -f docker-compose.ultimate.yml down -v --remove-orphans
docker rmi surpadclone-app 2>nul
docker system prune -f --volumes

echo.
echo [إصلاح] بناء Docker مع إصلاح rollup...
docker-compose -f docker-compose.ultimate.yml build --no-cache app

if %errorlevel% equ 0 (
    echo ✅ تم البناء بنجاح!
    
    echo.
    echo [تشغيل] بدء النظام مع الإصلاحات...
    docker-compose -f docker-compose.ultimate.yml up -d
    
    echo.
    echo [انتظار] تهيئة النظام - 45 ثانية...
    timeout /t 45 >nul
    
    echo.
    echo [فحص] حالة النظام بعد الإصلاح...
    docker-compose -f docker-compose.ultimate.yml ps
    
    echo.
    echo [اختبار] فحص التطبيق...
    curl -s http://localhost:3000/api/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ التطبيق يعمل بنجاح بعد الإصلاح!
        echo.
        echo 🎉 تم إصلاح مشكلة rollup بنجاح!
        echo 🌐 التطبيق متاح على: http://localhost:3000
    ) else (
        echo 📋 عرض سجلات التطبيق للمراجعة:
        echo.
        docker logs binaa-app-ultimate --tail=30
    )
    
) else (
    echo ❌ فشل البناء - عرض الأخطاء:
    docker-compose -f docker-compose.ultimate.yml logs app
)

echo.
echo ==========================================
echo       🎯 انتهت عملية الإصلاح
echo ==========================================
echo.
echo 📋 أوامر مفيدة:
echo   عرض السجلات المباشرة: docker logs binaa-app-ultimate -f
echo   إعادة التشغيل: docker-compose -f docker-compose.ultimate.yml restart app
echo   حالة النظام: docker-compose -f docker-compose.ultimate.yml ps
echo   دخول الحاوية: docker exec -it binaa-app-ultimate sh
echo.

pause