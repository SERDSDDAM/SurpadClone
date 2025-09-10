#!/bin/bash

# ===============================================
# سكريبت التشغيل السريع للبيئة المحلية
# نظام بنّاء اليمن - النشر المحلي
# ===============================================

set -e

echo "🏗️ بدء تشغيل نظام بنّاء اليمن - البيئة المحلية"
echo "================================================"

# ألوان للنصوص
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# دالة لطباعة الرسائل الملونة
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# التحقق من وجود Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker غير مثبت. يرجى تثبيت Docker أولاً."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً."
    exit 1
fi

print_success "تم العثور على Docker و Docker Compose"

# إنشاء المجلدات اللازمة
print_status "إنشاء المجلدات المطلوبة..."
mkdir -p temp-uploads
mkdir -p attached_assets
mkdir -p logs
mkdir -p init-sql

print_success "تم إنشاء المجلدات المطلوبة"

# نسخ ملف البيئة إذا لم يكن موجوداً
if [ ! -f .env ]; then
    print_status "إنشاء ملف البيئة المحلية..."
    cp .env.local .env
    print_success "تم إنشاء ملف .env من .env.local"
else
    print_warning "ملف .env موجود بالفعل - سيتم استخدامه"
fi

# إيقاف الخدمات السابقة إن وجدت
print_status "إيقاف الخدمات السابقة إن وجدت..."
docker-compose -f docker-compose.local.yml down --remove-orphans 2>/dev/null || true

# بناء وتشغيل الخدمات
print_status "بناء وتشغيل خدمات النظام..."
docker-compose -f docker-compose.local.yml up --build -d

print_status "انتظار بدء تشغيل الخدمات..."
sleep 10

# التحقق من حالة الخدمات
print_status "فحص حالة الخدمات..."

services=("binaa-local-postgres" "binaa-local-redis" "binaa-local-minio" "binaa-local-app")
all_healthy=true

for service in "${services[@]}"; do
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$service.*Up"; then
        print_success "الخدمة $service تعمل بنجاح"
    else
        print_error "الخدمة $service لا تعمل"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    print_success "جميع الخدمات تعمل بنجاح!"
    echo ""
    echo "🎉 تم تشغيل نظام بنّاء اليمن بنجاح في البيئة المحلية"
    echo ""
    echo "📋 روابط الوصول:"
    echo "   🌐 التطبيق الرئيسي: http://localhost:3000"
    echo "   🗄️  إدارة قاعدة البيانات: http://localhost:8080"
    echo "   💾 واجهة MinIO: http://localhost:9001"
    echo ""
    echo "🔧 بيانات الاتصال بقاعدة البيانات:"
    echo "   الخادم: localhost:5432"
    echo "   قاعدة البيانات: binaa_local_db"
    echo "   المستخدم: binaa_user"
    echo "   كلمة المرور: binaa_local_2024"
    echo ""
    echo "💡 أوامر مفيدة:"
    echo "   📊 عرض سجلات النظام: docker-compose -f docker-compose.local.yml logs -f"
    echo "   🔄 إعادة تشغيل التطبيق: docker-compose -f docker-compose.local.yml restart app"
    echo "   🛑 إيقاف النظام: docker-compose -f docker-compose.local.yml down"
    echo ""
    print_warning "ملاحظة: هذا الإعداد مخصص للتطوير المحلي فقط وليس للإنتاج"
else
    print_error "فشل في تشغيل بعض الخدمات. يرجى التحقق من السجلات:"
    echo "docker-compose -f docker-compose.local.yml logs"
fi

echo "================================================"