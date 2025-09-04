#!/bin/bash

# ===============================================
# سكريبت تشغيل نظام بنّاء اليمن بـ Docker
# ===============================================

set -e

# ألوان للتنسيق
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دالة الطباعة مع التنسيق
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# التحقق من وجود Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker غير مثبت. يرجى تثبيت Docker أولاً."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً."
        exit 1
    fi
}

# إنشاء ملف البيئة إذا لم يكن موجوداً
setup_env() {
    if [ ! -f .env.local ]; then
        print_warning "ملف .env.local غير موجود، سيتم إنشاؤه من المثال..."
        cp .env.local.example .env.local
        print_success "تم إنشاء ملف .env.local"
        print_warning "يرجى مراجعة إعدادات .env.local قبل المتابعة"
    fi
}

# إنشاء المجلدات المطلوبة
create_directories() {
    print_status "إنشاء المجلدات المطلوبة..."
    mkdir -p temp-uploads
    mkdir -p attached_assets
    mkdir -p logs
    mkdir -p init-sql
    mkdir -p nginx/ssl
    print_success "تم إنشاء المجلدات"
}

# تشغيل النظام
start_system() {
    print_status "بدء تشغيل نظام بنّاء اليمن..."
    
    # إيقاف أي حاويات قديمة
    docker-compose down 2>/dev/null || true
    
    # بناء وتشغيل الحاويات
    docker-compose up --build -d
    
    print_success "تم بدء تشغيل النظام"
    print_status "جاري انتظار تهيئة الخدمات..."
    
    # انتظار تهيئة قاعدة البيانات
    echo "انتظار قاعدة البيانات..."
    until docker-compose exec -T postgres pg_isready -U postgres -d binaa_yemen; do
        sleep 2
    done
    
    print_success "قاعدة البيانات جاهزة"
    
    # تشغيل migration
    print_status "تطبيق تحديثات قاعدة البيانات..."
    docker-compose exec app npm run db:push
    
    print_success "تم تطبيق تحديثات قاعدة البيانات"
}

# عرض حالة النظام
show_status() {
    print_status "حالة الخدمات:"
    docker-compose ps
    
    echo ""
    print_success "النظام جاهز!"
    echo ""
    echo "🌐 التطبيق الرئيسي: http://localhost:5000"
    echo "🗄️  قاعدة البيانات: localhost:5432"
    echo "🔴 Redis: localhost:6379"
    echo "📦 MinIO: http://localhost:9001 (admin: minioadmin/minioadmin123)"
    echo ""
    echo "📋 لعرض السجلات: docker-compose logs -f"
    echo "⏹️  لإيقاف النظام: docker-compose down"
    echo "🔄 لإعادة التشغيل: docker-compose restart"
}

# عرض السجلات
show_logs() {
    print_status "عرض سجلات النظام..."
    docker-compose logs -f
}

# إيقاف النظام
stop_system() {
    print_status "إيقاف نظام بنّاء اليمن..."
    docker-compose down
    print_success "تم إيقاف النظام"
}

# تنظيف النظام
cleanup_system() {
    print_warning "هذا سيحذف جميع البيانات! هل أنت متأكد؟ (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "تنظيف النظام..."
        docker-compose down -v --rmi all
        docker system prune -f
        print_success "تم تنظيف النظام"
    else
        print_status "تم إلغاء التنظيف"
    fi
}

# عرض المساعدة
show_help() {
    echo "استخدام: $0 [COMMAND]"
    echo ""
    echo "الأوامر المتاحة:"
    echo "  start     - تشغيل النظام"
    echo "  stop      - إيقاف النظام"
    echo "  restart   - إعادة تشغيل النظام"
    echo "  status    - عرض حالة النظام"
    echo "  logs      - عرض سجلات النظام"
    echo "  cleanup   - تنظيف النظام وحذف البيانات"
    echo "  help      - عرض هذه المساعدة"
    echo ""
}

# المعاملات
case "${1:-start}" in
    start)
        check_docker
        setup_env
        create_directories
        start_system
        show_status
        ;;
    stop)
        stop_system
        ;;
    restart)
        check_docker
        print_status "إعادة تشغيل النظام..."
        docker-compose restart
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    cleanup)
        cleanup_system
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "أمر غير مدعوم: $1"
        show_help
        exit 1
        ;;
esac