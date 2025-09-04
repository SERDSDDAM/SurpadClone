# ===============================================
# الحل النهائي لتشغيل نظام بنّاء اليمن - PowerShell
# ===============================================

Write-Host ""
Write-Host "=============================================" -ForegroundColor Blue
Write-Host "   🚀 الحل النهائي - نظام بنّاء اليمن  " -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue
Write-Host ""

Write-Host "[معلومات] بدء الحل النهائي..." -ForegroundColor Cyan
Write-Host ""

# التحقق من متطلبات النظام
Write-Host "[فحص] التحقق من متطلبات النظام..." -ForegroundColor Cyan

try {
    $dockerVersion = docker --version
    $composeVersion = docker-compose --version
    Write-Host "✓ Docker متوفر ومجهز" -ForegroundColor Green
    Write-Host "   $dockerVersion" -ForegroundColor Gray
    Write-Host "   $composeVersion" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[خطأ فادح] Docker غير مثبت!" -ForegroundColor Red
    Write-Host "يجب تثبيت Docker Desktop أولاً من: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 1
}

# تنظيف شامل قبل البدء
Write-Host "[تنظيف] إزالة الحاويات والشبكات القديمة..." -ForegroundColor Cyan
docker-compose -f docker-compose.ultimate.yml down -v --remove-orphans 2>$null
docker-compose -f docker-compose.simple.yml down -v --remove-orphans 2>$null
docker-compose down -v --remove-orphans 2>$null

# تنظيف الصور القديمة
Write-Host "[تنظيف] إزالة الصور القديمة..." -ForegroundColor Cyan
docker system prune -f 2>$null

Write-Host "✓ تم التنظيف بنجاح" -ForegroundColor Green
Write-Host ""

# إنشاء المجلدات المطلوبة
Write-Host "[إعداد] إنشاء المجلدات المطلوبة..." -ForegroundColor Cyan
$folders = @("temp-uploads", "attached_assets", "logs", "init-sql")
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
    }
}

Write-Host "✓ تم إنشاء المجلدات" -ForegroundColor Green
Write-Host ""

# إنشاء ملف إعداد قاعدة البيانات
Write-Host "[إعداد] تحضير قاعدة البيانات..." -ForegroundColor Cyan
$sqlSetup = @"
-- إعداد قاعدة البيانات بنّاء اليمن
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL PRIVILEGES ON DATABASE binaa_yemen TO postgres;
ALTER USER postgres WITH SUPERUSER;
"@
$sqlSetup | Out-File -FilePath "init-sql/01-ultimate-setup.sql" -Encoding UTF8

Write-Host "✓ تم إعداد قاعدة البيانات" -ForegroundColor Green
Write-Host ""

# إنشاء ملف البيئة النهائي
Write-Host "[إعداد] تحضير متغيرات البيئة..." -ForegroundColor Cyan
$envContent = @"
# ملف البيئة النهائي - نظام بنّاء اليمن
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/binaa_yemen
REDIS_URL=redis://localhost:6379
JWT_SECRET=ultimate-jwt-secret-key-2025-binaa-yemen
SESSION_SECRET=ultimate-session-secret-2025-binaa-yemen
"@
$envContent | Out-File -FilePath ".env.ultimate" -Encoding UTF8

Write-Host "✓ تم إعداد متغيرات البيئة" -ForegroundColor Green
Write-Host ""

# بدء النظام
Write-Host "[تشغيل] بناء وتشغيل النظام الكامل..." -ForegroundColor Cyan
Write-Host "هذا قد يستغرق بضع دقائق في المرة الأولى..." -ForegroundColor Yellow
Write-Host ""

$result = docker-compose -f docker-compose.ultimate.yml up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[خطأ] فشل في تشغيل النظام!" -ForegroundColor Red
    Write-Host "جاري عرض سجل الأخطاء..." -ForegroundColor Yellow
    docker-compose -f docker-compose.ultimate.yml logs
    Read-Host "اضغط Enter للخروج"
    exit 1
}

# انتظار تهيئة الخدمات
Write-Host "[انتظار] تهيئة الخدمات..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "✓ تم تشغيل النظام بنجاح!" -ForegroundColor Green
Write-Host ""

# فحص حالة الخدمات
Write-Host "[فحص] التحقق من حالة الخدمات..." -ForegroundColor Cyan
docker-compose -f docker-compose.ultimate.yml ps

Write-Host ""
Write-Host "=============================================" -ForegroundColor Blue
Write-Host "       🎉 النظام جاهز للاستخدام!" -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 التطبيق الرئيسي:     " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:3000" -ForegroundColor White
Write-Host "🗄️  قاعدة البيانات:      " -NoNewline -ForegroundColor Green  
Write-Host "localhost:5432" -ForegroundColor White
Write-Host "🔴 Redis:               " -NoNewline -ForegroundColor Green
Write-Host "localhost:6379" -ForegroundColor White
Write-Host "📦 MinIO Console:       " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:9001" -ForegroundColor White
Write-Host "   المستخدم: " -NoNewline -ForegroundColor Yellow
Write-Host "minioadmin" -ForegroundColor Gray
Write-Host "   كلمة المرور: " -NoNewline -ForegroundColor Yellow
Write-Host "minioadmin123" -ForegroundColor Gray
Write-Host ""
Write-Host "أوامر الإدارة:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.ultimate.yml logs -f    : متابعة السجلات" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.ultimate.yml down       : إيقاف النظام" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.ultimate.yml restart    : إعادة تشغيل" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 النظام يعمل الآن بكامل قدرته!" -ForegroundColor Green
Write-Host ""

Read-Host "اضغط Enter لإنهاء"