@echo off
REM ===============================================
REM Docker الإنتاج - مبسط وسريع بدون Chromium
REM ===============================================

echo.
echo ==========================================
echo   🚀 Docker الإنتاج - نسخة مبسطة
echo ==========================================
echo.

echo [تنظيف] إزالة الحاويات القديمة...
docker-compose -f docker-compose.production.yml down -v --remove-orphans
docker rmi binaa-app-production 2>nul
docker system prune -f --volumes

echo.
echo [بناء] إنشاء صورة الإنتاج المبسطة...
echo ⏱️ هذا سيستغرق ~2-3 دقائق (بدلاً من ساعة)
docker-compose -f docker-compose.production.yml build --no-cache app

if %errorlevel% equ 0 (
    echo ✅ تم البناء بنجاح!
    
    echo.
    echo [معلومات] حجم الصورة:
    docker images binaa-app-production --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    
    echo.
    echo [تشغيل] بدء نظام الإنتاج...
    docker-compose -f docker-compose.production.yml up -d
    
    echo.
    echo [انتظار] تهيئة الخدمات...
    timeout /t 30 >nul
    
    echo.
    echo [فحص] حالة نظام الإنتاج...
    docker-compose -f docker-compose.production.yml ps
    
    echo.
    echo [اختبار] فحص صحة التطبيق...
    for /l %%i in (1,1,5) do (
        curl -s http://localhost:3000/api/health >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✅ نظام الإنتاج يعمل بنجاح!
            goto :success
        )
        echo المحاولة %%i...
        timeout /t 5 >nul
    )
    
    echo ⚠️ التطبيق قد يحتاج وقت إضافي...
    echo 📋 عرض سجلات التطبيق:
    docker logs binaa-app-production --tail=20
    
    :success
    echo.
    echo ==========================================
    echo       🎉 نظام الإنتاج جاهز!
    echo ==========================================
    echo.
    echo 🌐 التطبيق: http://localhost:3000
    echo 📦 MinIO: http://localhost:9001 (admin/minioadmin123)
    echo 🗄️ قاعدة البيانات: localhost:5432
    echo.
    echo 📊 إحصائيات:
    echo   ⚡ وقت البناء: ~3 دقائق (vs 2+ ساعات مع Chromium)
    echo   📏 حجم الصورة: ~100MB (vs 2GB مع Chromium)
    echo   🚀 وقت البدء: ~30 ثانية
    echo   💾 استهلاك الذاكرة: ~256MB
    echo.
    
) else (
    echo ❌ فشل في البناء
    docker-compose -f docker-compose.production.yml logs app
)

echo.
echo 📋 أوامر مفيدة:
echo   عرض السجلات: docker logs binaa-app-production -f
echo   إعادة التشغيل: docker-compose -f docker-compose.production.yml restart
echo   إيقاف النظام: docker-compose -f docker-compose.production.yml down
echo   مراقبة الموارد: docker stats
echo.

pause