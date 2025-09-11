#!/bin/bash

# ===============================================
# سكريپت إيقاف النظام المحلي
# نظام بنّاء اليمن - البيئة المحلية
# ===============================================

set -e

echo "🛑 إيقاف نظام بنّاء اليمن - البيئة المحلية"
echo "============================================="

# ألوان للنصوص
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# إيقاف الخدمات
print_status "إيقاف خدمات النظام..."

if docker-compose -f docker-compose.local.yml down --remove-orphans; then
    print_success "تم إيقاف جميع الخدمات بنجاح"
else
    print_warning "حدث خطأ أثناء الإيقاف أو لم تكن الخدمات تعمل"
fi

# عرض حالة الخدمات
print_status "التحقق من حالة الخدمات..."
if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "binaa-local"; then
    print_warning "بعض خدمات بنّاء اليمن ما زالت تعمل"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep "binaa-local"
else
    print_success "تم إيقاف جميع خدمات بنّاء اليمن"
fi

echo ""
print_success "تم إيقاف النظام المحلي"
echo ""
echo "💡 لإعادة التشغيل: ./start-local.sh"
echo "🗑️  لحذف جميع البيانات: docker-compose -f docker-compose.local.yml down -v"
echo "============================================="