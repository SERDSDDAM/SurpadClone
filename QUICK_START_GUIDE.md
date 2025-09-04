# 🚀 دليل التشغيل السريع - نظام بنّاء اليمن

## 🎯 التشغيل السريع على Windows

### الطريقة الأولى: باستخدام Batch Script
```cmd
start-local.bat
```

### الطريقة الثانية: باستخدام PowerShell
```powershell
PowerShell -ExecutionPolicy Bypass -File start-local.ps1
```

### الطريقة الثالثة: خطوة بخطوة يدوياً

#### 1. تشغيل الخدمات الأساسية
```bash
docker-compose -f docker-compose.simple.yml up -d
```

#### 2. تثبيت التبعيات
```bash
npm install
```

#### 3. إعداد قاعدة البيانات
```bash
npm run db:push
```

#### 4. تشغيل التطبيق
```bash
npm run dev
```

## 🌐 الروابط المتاحة

- **التطبيق الرئيسي**: http://localhost:5000
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)
- **قاعدة البيانات**: localhost:5432
- **Redis**: localhost:6379

## ⚙️ أوامر إدارة الخدمات

```bash
# عرض حالة الخدمات
docker-compose -f docker-compose.simple.yml ps

# عرض السجلات
docker-compose -f docker-compose.simple.yml logs

# إيقاف الخدمات
docker-compose -f docker-compose.simple.yml down

# إعادة تشغيل الخدمات
docker-compose -f docker-compose.simple.yml restart

# تنظيف كامل
docker-compose -f docker-compose.simple.yml down -v
```

## 🔧 استكشاف الأخطاء

### مشكلة في المنفذ
```bash
# تحقق من المنافذ المستخدمة
netstat -an | findstr :5000
netstat -an | findstr :5432
```

### مشكلة في قاعدة البيانات
```bash
# إعادة تشغيل PostgreSQL
docker-compose -f docker-compose.simple.yml restart postgres

# الاتصال بقاعدة البيانات
docker-compose -f docker-compose.simple.yml exec postgres psql -U postgres -d binaa_yemen
```

### تنظيف Docker
```bash
# تنظيف الحاويات والصور
docker system prune -a

# حذف البيانات
docker-compose -f docker-compose.simple.yml down -v
```

---
**ملاحظة**: هذا الدليل مصمم للتطوير المحلي على Windows ويتجنب المشاكل الشائعة مع Docker.