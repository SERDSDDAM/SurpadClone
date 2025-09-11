# 🚀 تعليمات النشر السريع - بنّاء اليمن

## المتطلبات:
- Docker Desktop مُثبت ويعمل
- 4GB RAM متاحة
- 10GB مساحة القرص

## خطوات التشغيل:

### 1. تشغيل فوري بأمر واحد:
```bash
./start-local.sh
```

### 2. الوصول للنظام:
- **التطبيق**: http://localhost:3000
- **قاعدة البيانات**: http://localhost:8080 
- **تخزين الملفات**: http://localhost:9001

### 3. بيانات الاتصال:
**PostgreSQL:**
- المستخدم: `postgres`
- كلمة المرور: `postgres123`
- قاعدة البيانات: `binaa_local_db`

**MinIO:**
- المستخدم: `minioadmin`
- كلمة المرور: `minioadmin123`

### 4. أوامر إضافية:
```bash
# إيقاف النظام
./stop-local.sh

# إعادة تشغيل سريعة
./quick-restart.sh

# عرض السجلات
docker-compose -f docker-compose.local.yml logs -f
```

---
✅ **النظام جاهز للتشغيل!**