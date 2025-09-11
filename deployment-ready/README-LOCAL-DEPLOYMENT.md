# 🚀 بدء التشغيل السريع - بنّاء اليمن المحلي

## تشغيل فوري بأمر واحد:

```bash
# تشغيل النظام كاملاً
./start-local.sh
```

## المتطلبات الأساسية فقط:
- Docker Desktop مُثبت ويعمل
- 4GB RAM متاحة
- 10GB مساحة القرص

## الوصول بعد التشغيل:
- **النظام**: http://localhost:3000
- **قاعدة البيانات**: http://localhost:8080
- **تخزين الملفات**: http://localhost:9001

## أوامر سريعة:

```bash
# إيقاف النظام
./stop-local.sh

# عرض السجلات
docker-compose -f docker-compose.local.yml logs -f

# إعادة تشغيل التطبيق فقط
docker-compose -f docker-compose.local.yml restart app
```

---
📋 **للمزيد من التفاصيل: راجع [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md)**