# 🐳 دليل إعداد Docker لمنصة "بنّاء اليمن"

## نظرة عامة
هذا الدليل يوضح كيفية إعداد وتشغيل منصة "بنّاء اليمن" باستخدام Docker للتطوير المحلي.

## المتطلبات الأساسية

### 1. تثبيت Docker
```bash
# على Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# على macOS (باستخدام Homebrew)
brew install docker docker-compose

# على Windows
# تحميل Docker Desktop من: https://www.docker.com/products/docker-desktop
```

### 2. التحقق من التثبيت
```bash
docker --version
docker-compose --version
```

## بنية Docker للمشروع

### الملفات الرئيسية:
- `Dockerfile` - صورة التطبيق الرئيسي
- `docker-compose.dev.yml` - بيئة التطوير المبسطة
- `docker-compose.phase1.yml` - بيئة التطوير الكاملة
- `.env.phase1.example` - مثال على متغيرات البيئة

### الخدمات المتاحة:

#### بيئة التطوير المبسطة (`docker-compose.dev.yml`):
- **PostgreSQL** (المنفذ 5432) - قاعدة البيانات الرئيسية
- **Redis** (المنفذ 6379) - التخزين المؤقت
- **MinIO** (المنافذ 9000, 9001) - تخزين الملفات

#### بيئة التطوير الكاملة (`docker-compose.phase1.yml`):
- جميع خدمات البيئة المبسطة +
- **API Server** (المنفذ 5000) - خادم التطبيق
- **Dispatcher** (المنفذ 8001) - معالج المهام
- **Worker** - معالج الملفات
- **Flower** (المنفذ 5555) - مراقب المهام

## إعداد البيئة

### 1. نسخ ملف البيئة
```bash
cp .env.phase1.example .env
```

### 2. تعديل إعدادات البيئة (اختياري)
```bash
nano .env
```

### الإعدادات الأساسية:
```env
POSTGRES_PASSWORD=postgres123
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

## طرق التشغيل

### الطريقة الأولى: التشغيل التلقائي (الأسهل)
```bash
# تشغيل البيئة الأساسية
./scripts/start-dev.sh

# إيقاف البيئة
./scripts/stop-dev.sh
```

### الطريقة الثانية: التشغيل اليدوي

#### أ) بيئة التطوير المبسطة:
```bash
# تشغيل الخدمات الأساسية فقط
docker-compose -f docker-compose.dev.yml up -d

# تشغيل التطبيق محلياً
npm install
npm run db:push
npm run dev
```

#### ب) بيئة التطوير الكاملة:
```bash
# تشغيل البيئة الكاملة
docker-compose -f docker-compose.phase1.yml up -d

# مراقبة اللوجات
docker-compose -f docker-compose.phase1.yml logs -f
```

## الوصول للخدمات

### التطبيق الرئيسي:
- **Frontend**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin
- **API Docs**: http://localhost:5000/api/docs

### الخدمات المساعدة:
- **PostgreSQL**: localhost:5432
  - Database: `binaa_yemen`
  - Username: `postgres`
  - Password: `postgres123`

- **Redis**: localhost:6379

- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin123`

- **Flower (Monitor)**: http://localhost:5555

## أوامر مفيدة

### إدارة Docker:
```bash
# عرض الحاويات النشطة
docker ps

# عرض اللوجات لحاوية معينة
docker logs binaa-dev-postgres

# الدخول إلى حاوية
docker exec -it binaa-dev-postgres bash

# إعادة تشغيل خدمة
docker-compose -f docker-compose.dev.yml restart postgres
```

### إدارة قاعدة البيانات:
```bash
# تشغيل migration
npm run db:push

# الاتصال بقاعدة البيانات
docker exec -it binaa-dev-postgres psql -U postgres -d binaa_yemen

# نسخ احتياطية
docker exec binaa-dev-postgres pg_dump -U postgres binaa_yemen > backup.sql
```

### تنظيف البيئة:
```bash
# إيقاف وحذف الحاويات
docker-compose -f docker-compose.dev.yml down

# حذف البيانات أيضاً
docker-compose -f docker-compose.dev.yml down -v

# تنظيف النظام
docker system prune -af
```

## استكشاف الأخطاء

### مشاكل شائعة:

#### 1. فشل في تشغيل PostgreSQL:
```bash
# التحقق من المنفذ
sudo netstat -tulpn | grep :5432

# إيقاف PostgreSQL المحلي إذا كان يعمل
sudo systemctl stop postgresql
```

#### 2. مشاكل الصلاحيات:
```bash
# إضافة المستخدم لمجموعة docker
sudo usermod -aG docker $USER

# إعادة تسجيل الدخول أو
newgrp docker
```

#### 3. مشاكل المساحة:
```bash
# تنظيف الصور القديمة
docker image prune -a

# تنظيف الملفات المؤقتة
docker volume prune
```

#### 4. مشاكل البناء:
```bash
# إعادة بناء الصور
docker-compose -f docker-compose.dev.yml build --no-cache

# حذف الصور وإعادة البناء
docker-compose -f docker-compose.dev.yml down --rmi all
docker-compose -f docker-compose.dev.yml up --build
```

## نصائح للتطوير

### 1. تطوير فعال:
```bash
# مراقبة التغييرات في الملفات
docker-compose -f docker-compose.dev.yml logs -f api

# إعادة تشغيل سريعة للتطبيق فقط
docker-compose -f docker-compose.dev.yml restart api
```

### 2. اختبار الأداء:
```bash
# مراقبة استخدام الموارد
docker stats

# فحص صحة الخدمات
docker-compose -f docker-compose.dev.yml ps
```

### 3. التطوير المتوازي:
```bash
# تشغيل الخدمات الأساسية فقط
docker-compose -f docker-compose.dev.yml up postgres redis minio -d

# تشغيل التطبيق محلياً للتطوير السريع
npm run dev
```

## إعداد الإنتاج

### متغيرات البيئة للإنتاج:
```env
NODE_ENV=production
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<strong-secret>
SESSION_SECRET=<strong-session-secret>
MINIO_ACCESS_KEY=<production-key>
MINIO_SECRET_KEY=<production-secret>
```

### نصائح الأمان:
- تغيير جميع كلمات المرور الافتراضية
- استخدام شهادات SSL
- تقييد الوصول للمنافذ
- تفعيل firewall

## الدعم والمساعدة

### سجلات مفيدة:
```bash
# لوجات التطبيق
docker-compose logs api

# لوجات قاعدة البيانات
docker-compose logs postgres

# لوجات جميع الخدمات
docker-compose logs
```

### المراقبة:
- استخدم Flower لمراقبة مهام المعالجة
- راقب استخدام الذاكرة والمعالج
- تحقق من سجلات الأخطاء بانتظام

هذا الدليل يوفر أساساً قوياً لتشغيل منصة "بنّاء اليمن" في بيئة تطوير محلية آمنة ومستقرة.