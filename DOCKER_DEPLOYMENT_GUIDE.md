# 🐳 دليل النشر المحلي باستخدام Docker - نظام بنّاء اليمن

## 📋 المتطلبات الأساسية

### البرامج المطلوبة
- Docker Engine (الإصدار 20.0 أو أحدث)
- Docker Compose (الإصدار 2.0 أو أحدث)
- Git
- 4 جيجابايت رام على الأقل
- 10 جيجابايت مساحة تخزين فارغة

### التحقق من التثبيت
```bash
docker --version
docker-compose --version
```

## 🚀 التشغيل السريع

### 1. تحضير البيئة
```bash
# نسخ ملف البيئة
cp .env.local.example .env.local

# تعديل الإعدادات حسب الحاجة
nano .env.local
```

### 2. تشغيل النظام
```bash
# الطريقة الأولى: استخدام السكريبت المبسط
./docker-run.sh start

# الطريقة الثانية: استخدام Docker Compose مباشرة
docker-compose up --build -d
```

### 3. الوصول للنظام
- **التطبيق الرئيسي**: http://localhost:5000
- **قاعدة البيانات**: localhost:5432
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001

## 🔧 إدارة النظام

### السكريبت المساعد `docker-run.sh`
```bash
./docker-run.sh start     # تشغيل النظام
./docker-run.sh stop      # إيقاف النظام
./docker-run.sh restart   # إعادة التشغيل
./docker-run.sh status    # عرض الحالة
./docker-run.sh logs      # عرض السجلات
./docker-run.sh cleanup   # تنظيف النظام
```

### أوامر Docker Compose المباشرة
```bash
# بناء وتشغيل
docker-compose up --build -d

# عرض الحالة
docker-compose ps

# عرض السجلات
docker-compose logs -f app

# إيقاف الخدمات
docker-compose down

# إعادة تشغيل خدمة محددة
docker-compose restart app
```

## ⚙️ التكوين والإعدادات

### متغيرات البيئة الأساسية
```env
# التطبيق
NODE_ENV=development
PORT=5000

# قاعدة البيانات
POSTGRES_DB=binaa_yemen
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# الأمان
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
```

### إعدادات الأداء
- **ذاكرة التطبيق**: 2GB
- **ذاكرة قاعدة البيانات**: 1GB
- **عدد المعالجات**: 2 CPU cores

## 🏗️ هيكل الخدمات

### الخدمات المشغلة
1. **app**: التطبيق الرئيسي (Node.js + React)
2. **postgres**: قاعدة البيانات مع PostGIS
3. **redis**: ذاكرة التخزين المؤقت
4. **minio**: تخزين الملفات
5. **nginx**: العكس البروكسي (اختياري)

### المنافذ المستخدمة
- `5000`: التطبيق الرئيسي
- `5432`: PostgreSQL
- `6379`: Redis
- `9000`: MinIO API
- `9001`: MinIO Console
- `80`: Nginx (اختياري)

## 🔍 مراقبة النظام

### فحص صحة الخدمات
```bash
# فحص جميع الخدمات
docker-compose ps

# فحص التطبيق
curl http://localhost:5000/api/health

# فحص قاعدة البيانات
docker-compose exec postgres pg_isready -U postgres
```

### عرض السجلات
```bash
# جميع الخدمات
docker-compose logs -f

# خدمة محددة
docker-compose logs -f app
docker-compose logs -f postgres
```

### مراقبة الموارد
```bash
# استخدام الذاكرة والمعالج
docker stats

# مساحة التخزين
docker system df
```

## 🗄️ إدارة البيانات

### النسخ الاحتياطي
```bash
# نسخ احتياطي لقاعدة البيانات
docker-compose exec postgres pg_dump -U postgres binaa_yemen > backup.sql

# نسخ احتياطي للملفات
docker cp binaa-minio:/data ./minio-backup
```

### الاستعادة
```bash
# استعادة قاعدة البيانات
docker-compose exec -T postgres psql -U postgres binaa_yemen < backup.sql

# استعادة الملفات
docker cp ./minio-backup binaa-minio:/data
```

### تحديث قاعدة البيانات
```bash
# تطبيق التحديثات
docker-compose exec app npm run db:push
```

## 🔧 استكشاف الأخطاء

### المشاكل الشائعة

#### 1. خطأ في المنفذ
```bash
# التحقق من المنافذ المستخدمة
netstat -tulpn | grep :5000

# تغيير المنفذ في .env.local
PORT=5001
```

#### 2. مشكلة قاعدة البيانات
```bash
# إعادة تشغيل قاعدة البيانات
docker-compose restart postgres

# فحص السجلات
docker-compose logs postgres
```

#### 3. نفاد المساحة
```bash
# تنظيف Docker
docker system prune -a

# حذف البيانات المؤقتة
docker volume prune
```

### سجلات الأخطاء
```bash
# سجلات التطبيق
docker-compose logs app | grep ERROR

# سجلات قاعدة البيانات
docker-compose logs postgres | grep ERROR
```

## 🔄 التحديث والصيانة

### تحديث النظام
```bash
# سحب أحدث التغييرات
git pull origin main

# إعادة بناء الصور
docker-compose build --no-cache

# إعادة التشغيل
docker-compose up -d
```

### الصيانة الدورية
```bash
# تنظيف أسبوعي
docker system prune -f

# فحص مساحة التخزين
df -h

# نسخ احتياطي شهري
./backup-script.sh
```

## 🛡️ الأمان

### أفضل الممارسات
1. تغيير كلمات المرور الافتراضية
2. استخدام HTTPS في الإنتاج
3. تحديث Docker بانتظام
4. مراجعة السجلات دوريًا

### إعدادات الأمان
```env
# كلمات مرور قوية
POSTGRES_PASSWORD=complex_password_123
JWT_SECRET=very_long_random_string
SESSION_SECRET=another_long_random_string
```

## 📞 الدعم والمساعدة

### موارد مفيدة
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### الحصول على المساعدة
1. مراجعة السجلات أولاً
2. البحث في الوثائق
3. التواصل مع فريق التطوير

---

**ملاحظة**: هذا الدليل مخصص للنشر المحلي والتطوير. للنشر في الإنتاج، يرجى مراجعة دليل النشر للإنتاج.