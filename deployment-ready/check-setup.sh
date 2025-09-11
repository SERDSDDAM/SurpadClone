#!/bin/bash

# ===============================================
# فحص الإعداد والتحقق من الملفات المطلوبة
# ===============================================

echo "🔍 فحص إعداد النشر المحلي لنظام بنّاء اليمن..."
echo "============================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ موجود: $1${NC}"
        return 0
    else
        echo -e "${RED}❌ مفقود: $1${NC}"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ مجلد موجود: $1${NC}"
        return 0
    else
        echo -e "${RED}❌ مجلد مفقود: $1${NC}"
        return 1
    fi
}

echo ""
echo "📁 فحص الملفات الأساسية:"
check_file "docker-compose.local.yml"
check_file ".env.local"
check_file "Dockerfile.production"
check_file "package.json"
check_file ".dockerignore"

echo ""
echo "🔧 فحص سكريپتات التشغيل:"
check_file "start-local.sh"
check_file "stop-local.sh"
check_file "quick-restart.sh"

echo ""
echo "📚 فحص التوثيق:"
check_file "LOCAL_DEPLOYMENT_GUIDE.md"
check_file "README-LOCAL-DEPLOYMENT.md"
check_file "DEPLOYMENT_INSTRUCTIONS.md"

echo ""
echo "📂 فحص مجلدات الكود:"
check_dir "server"
check_dir "client" 
check_dir "shared"

echo ""
echo "💾 فحص مجلدات البيانات:"
check_dir "temp-uploads"
check_dir "attached_assets"
check_dir "logs"
check_dir "init-sql"

echo ""
echo "🐳 فحص Docker:"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker مُثبت${NC}"
    if docker info &> /dev/null; then
        echo -e "${GREEN}✅ Docker يعمل${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker مُثبت لكن لا يعمل${NC}"
    fi
else
    echo -e "${RED}❌ Docker غير مُثبت${NC}"
fi

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose مُثبت${NC}"
else
    echo -e "${RED}❌ Docker Compose غير مُثبت${NC}"
fi

echo ""
echo "🔍 فحص إعدادات قاعدة البيانات:"
if grep -q "POSTGRES_USER=postgres" .env.local; then
    echo -e "${GREEN}✅ المستخدم: postgres${NC}"
else
    echo -e "${RED}❌ المستخدم غير صحيح في .env.local${NC}"
fi

if grep -q "POSTGRES_USER: postgres" docker-compose.local.yml; then
    echo -e "${GREEN}✅ المستخدم متطابق في docker-compose${NC}"
else
    echo -e "${RED}❌ المستخدم غير متطابق في docker-compose${NC}"
fi

echo ""
echo "============================================="
echo -e "${GREEN}✅ انتهى الفحص!${NC}"
echo ""
echo "🚀 للتشغيل: ./start-local.sh"