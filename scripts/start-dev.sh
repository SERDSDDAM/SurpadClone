#!/bin/bash

# البدء في بيئة التطوير المحلية لمنصة "بنّاء اليمن"

echo "🚀 بدء تشغيل بيئة التطوير لمنصة بنّاء اليمن..."

# التحقق من وجود Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker غير مثبت. يرجى تثبيت Docker أولاً."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً."
    exit 1
fi

# إنشاء ملف البيئة إذا لم يكن موجوداً
if [ ! -f .env ]; then
    echo "📝 إنشاء ملف البيئة..."
    cp .env.phase1.example .env
    echo "✅ تم إنشاء ملف .env من المثال"
    echo "⚠️  يرجى مراجعة وتعديل الإعدادات في ملف .env حسب الحاجة"
fi

# إنشاء المجلدات المطلوبة
echo "📁 إنشاء المجلدات المطلوبة..."
mkdir -p temp-uploads
mkdir -p attached_assets
mkdir -p logs
mkdir -p init-sql

# تشغيل الخدمات الأساسية
echo "🐳 تشغيل الخدمات الأساسية..."
docker-compose -f docker-compose.dev.yml up -d

# انتظار تشغيل قاعدة البيانات
echo "⏳ انتظار تشغيل قاعدة البيانات..."
sleep 10

# تشغيل migration إذا كان متاحاً
if command -v npm &> /dev/null; then
    echo "🔄 تشغيل database migration..."
    npm run db:push
else
    echo "⚠️  npm غير متاح. يرجى تشغيل 'npm run db:push' يدوياً بعد تثبيت dependencies"
fi

# عرض حالة الخدمات
echo "📊 حالة الخدمات:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "✅ تم تشغيل بيئة التطوير بنجاح!"
echo ""
echo "🔗 الروابط المتاحة:"
echo "   📊 PostgreSQL: localhost:5432"
echo "   📦 Redis: localhost:6379"  
echo "   💾 MinIO Console: http://localhost:9001"
echo "   🗃️  MinIO API: http://localhost:9000"
echo ""
echo "🚀 يمكنك الآن تشغيل التطبيق باستخدام:"
echo "   npm run dev"
echo ""
echo "🛑 لإيقاف البيئة:"
echo "   docker-compose -f docker-compose.dev.yml down"