@echo off
REM ===============================================
REM اختبار الحل النهائي - فحص شامل
REM ===============================================

echo.
echo =======================================
echo   🔍 اختبار الحل النهائي
echo =======================================
echo.

REM فحص الخدمات
echo [فحص] التحقق من حالة الخدمات...
docker-compose -f docker-compose.ultimate.yml ps

echo.
echo [فحص] اختبار التطبيق الرئيسي...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ التطبيق يعمل بنجاح
) else (
    echo ✗ التطبيق لا يستجيب
)

echo.
echo [فحص] اختبار قاعدة البيانات...
docker-compose -f docker-compose.ultimate.yml exec -T postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ قاعدة البيانات تعمل بنجاح
) else (
    echo ✗ قاعدة البيانات لا تستجيب
)

echo.
echo [فحص] اختبار MinIO...
curl -s http://localhost:9001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ MinIO يعمل بنجاح
) else (
    echo ✗ MinIO لا يستجيب
)

echo.
echo =======================================
echo    📊 تقرير الاختبار
echo =======================================
echo.
echo الروابط المتاحة:
echo 🌐 التطبيق: http://localhost:3000
echo 📦 MinIO: http://localhost:9001
echo.

pause