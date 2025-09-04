# ===============================================
# سكريپت PowerShell لتشغيل نظام بنّاء اليمن محلياً
# ===============================================

Write-Host "===================================" -ForegroundColor Blue
Write-Host "   تشغيل نظام بنّاء اليمن محلياً" -ForegroundColor Blue  
Write-Host "===================================" -ForegroundColor Blue
Write-Host ""

# التحقق من وجود Docker
try {
    $dockerVersion = docker --version
    $composeVersion = docker-compose --version
    Write-Host "[معلومات] Docker متوفر ✓" -ForegroundColor Green
    Write-Host "           $dockerVersion" -ForegroundColor Gray
    Write-Host "           $composeVersion" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[خطأ] Docker غير مثبت. يرجى تثبيت Docker أولاً." -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

# إنشاء ملف البيئة إذا لم يكن موجوداً
if (-not (Test-Path ".env.local")) {
    Write-Host "[تحذير] ملف .env.local غير موجود، سيتم إنشاؤه..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "[نجح] تم إنشاء ملف .env.local ✓" -ForegroundColor Green
    Write-Host ""
}

# إنشاء المجلدات المطلوبة
$folders = @("temp-uploads", "attached_assets", "logs", "init-sql")
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
    }
}
Write-Host "[معلومات] تم إنشاء المجلدات المطلوبة ✓" -ForegroundColor Green
Write-Host ""

# تنظيف Docker إذا لزم الأمر
Write-Host "[معلومات] تنظيف الحاويات القديمة..." -ForegroundColor Cyan
docker-compose -f docker-compose.simple.yml down 2>$null
Write-Host ""

# تشغيل الخدمات الأساسية
Write-Host "[معلومات] تشغيل الخدمات الأساسية (PostgreSQL, Redis, MinIO)..." -ForegroundColor Cyan
$result = docker-compose -f docker-compose.simple.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[خطأ] فشل في تشغيل الخدمات" -ForegroundColor Red
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host "[نجح] تم تشغيل الخدمات الأساسية ✓" -ForegroundColor Green
Write-Host ""

# انتظار تهيئة قاعدة البيانات  
Write-Host "[معلومات] انتظار تهيئة قاعدة البيانات..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# التحقق من حالة الخدمات
Write-Host "[معلومات] حالة الخدمات:" -ForegroundColor Cyan
docker-compose -f docker-compose.simple.yml ps
Write-Host ""

# تحقق من وجود node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[معلومات] تثبيت التبعيات..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[خطأ] فشل في تثبيت التبعيات" -ForegroundColor Red
        Read-Host "اضغط Enter للخروج"
        exit 1
    }
    Write-Host "[نجح] تم تثبيت التبعيات ✓" -ForegroundColor Green
    Write-Host ""
}

# تطبيق تحديثات قاعدة البيانات
Write-Host "[معلومات] تطبيق تحديثات قاعدة البيانات..." -ForegroundColor Cyan
npm run db:push
Write-Host ""

Write-Host "===================================" -ForegroundColor Blue
Write-Host "       النظام جاهز للتشغيل!" -ForegroundColor Blue
Write-Host "===================================" -ForegroundColor Blue
Write-Host ""
Write-Host "البوابات المتاحة:" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 التطبيق الرئيسي: سيبدأ عند تشغيل npm run dev" -ForegroundColor White
Write-Host "🗄️  قاعدة البيانات: localhost:5432" -ForegroundColor White
Write-Host "🔴 Redis: localhost:6379" -ForegroundColor White  
Write-Host "📦 MinIO Console: http://localhost:9001" -ForegroundColor White
Write-Host "     المستخدم: minioadmin" -ForegroundColor Gray
Write-Host "     كلمة المرور: minioadmin123" -ForegroundColor Gray
Write-Host ""
Write-Host "الآن قم بتشغيل:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "أوامر إضافية:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.simple.yml logs : عرض سجلات الخدمات" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.simple.yml down : إيقاف الخدمات" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.simple.yml ps   : حالة الخدمات" -ForegroundColor Gray
Write-Host ""

Read-Host "اضغط Enter لإنهاء"