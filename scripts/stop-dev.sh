#!/bin/bash

# إيقاف بيئة التطوير المحلية

echo "🛑 إيقاف بيئة التطوير..."

# إيقاف الخدمات
docker-compose -f docker-compose.dev.yml down

echo "✅ تم إيقاف جميع الخدمات"

# خيار لحذف البيانات
read -p "🗑️  هل تريد حذف جميع البيانات؟ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  حذف البيانات..."
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    echo "✅ تم حذف جميع البيانات"
fi