# 🏗️ دليل النشر المحلي - نظام بنّاء اليمن

## 📋 نظرة عامة

هذا الدليل يوضح كيفية تشغيل نظام "بنّاء اليمن" على البيئة المحلية للتطوير والاختبار. النظام مُعد بالكامل ليعمل بـ Docker مع جميع الخدمات المطلوبة.

---

## ⚙️ المتطلبات المسبقة

### المتطلبات الأساسية:
- **Docker**: النسخة 20.10 أو أحدث
- **Docker Compose**: النسخة 2.0 أو أحدث
- **Git**: لاستنساخ المشروع
- **الذاكرة**: 4GB RAM كحد أدنى
- **التخزين**: 10GB مساحة فارغة

### فحص المتطلبات:
```bash
# فحص إصدار Docker
docker --version

# فحص إصدار Docker Compose
docker-compose --version

# فحص الذاكرة المتاحة
free -h
```

---

## 🚀 التشغيل السريع

### الطريقة الأولى: باستخدام السكريبت التلقائي
```bash
# تشغيل السكريبت التلقائي
./start-local.sh
```

### الطريقة الثانية: الأوامر اليدوية
```bash
# 1. إنشاء المجلدات المطلوبة
mkdir -p temp-uploads attached_assets logs init-sql

# 2. نسخ ملف البيئة
cp .env.local .env

# 3. بناء وتشغيل الخدمات
docker-compose -f docker-compose.local.yml up --build -d

# 4. مراقبة السجلات
docker-compose -f docker-compose.local.yml logs -f
```

---

## 🌐 الوصول للخدمات

بعد التشغيل الناجح، ستكون الخدمات متاحة على:

| الخدمة | الرابط | الوصف |
|--------|---------|--------|
| **التطبيق الرئيسي** | http://localhost:3000 | واجهة النظام الكاملة |
| **إدارة قاعدة البيانات** | http://localhost:8080 | Adminer لإدارة PostgreSQL |
| **واجهة MinIO** | http://localhost:9001 | إدارة تخزين الملفات |
| **Redis Commander** | غير مُفعل | إدارة Redis (يمكن إضافته) |

### بيانات الاتصال:

#### قاعدة البيانات PostgreSQL:
- **الخادم**: localhost:5432
- **قاعدة البيانات**: binaa_local_db
- **المستخدم**: binaa_user
- **كلمة المرور**: binaa_local_2024

#### MinIO:
- **المستخدم**: minioadmin
- **كلمة المرور**: minioadmin123

---

## 🔧 أوامر الإدارة

### التحكم في الخدمات:
```bash
# عرض حالة الخدمات
docker-compose -f docker-compose.local.yml ps

# إعادة تشغيل خدمة واحدة
docker-compose -f docker-compose.local.yml restart app

# إعادة تشغيل جميع الخدمات
docker-compose -f docker-compose.local.yml restart

# إيقاف النظام
docker-compose -f docker-compose.local.yml down

# إيقاف النظام مع حذف البيانات
docker-compose -f docker-compose.local.yml down -v
```

### مراقبة السجلات:
```bash
# سجلات جميع الخدمات
docker-compose -f docker-compose.local.yml logs -f

# سجلات التطبيق فقط
docker-compose -f docker-compose.local.yml logs -f app

# سجلات قاعدة البيانات فقط
docker-compose -f docker-compose.local.yml logs -f postgres
```

### إدارة قاعدة البيانات:
```bash
# تطبيق تغييرات قاعدة البيانات
npm run db:push

# الوصول لسطر أوامر PostgreSQL
docker exec -it binaa-local-postgres psql -U binaa_user -d binaa_local_db

# عمل نسخة احتياطية
docker exec binaa-local-postgres pg_dump -U binaa_user binaa_local_db > backup.sql

# استعادة نسخة احتياطية
docker exec -i binaa-local-postgres psql -U binaa_user -d binaa_local_db < backup.sql
```

---

## 📁 هيكل الملفات

```
بنّاء-اليمن/
├── docker-compose.local.yml    # إعدادات Docker المحلية
├── .env.local                  # متغيرات البيئة المحلية
├── start-local.sh              # سكريپت التشغيل التلقائي
├── Dockerfile.production       # Docker image definition
├── temp-uploads/              # مجلد الملفات المؤقتة
├── attached_assets/           # مجلد المرفقات
├── logs/                      # سجلات النظام
├── init-sql/                  # أوامر SQL الأولية
├── client/                    # كود الواجهة الأمامية
├── server/                    # كود الخادم
├── shared/                    # الكود المشترك
└── docs/                      # التوثيق
```

---

## 🐛 حل المشاكل الشائعة

### المشكلة: فشل في بناء Docker Image
**الحل:**
```bash
# حذف الـ cache وإعادة البناء
docker system prune -f
docker-compose -f docker-compose.local.yml build --no-cache
```

### المشكلة: المنافذ مُستخدمة بواسطة خدمات أخرى
**الحل:**
```bash
# فحص المنافذ المستخدمة
netstat -tulpn | grep -E ':(3000|5432|6379|9000|9001)'

# إيقاف الخدمات المتضاربة أو تغيير المنافذ في docker-compose.local.yml
```

### المشكلة: نفاد مساحة القرص
**الحل:**
```bash
# حذف البيانات والصور غير المستخدمة
docker system prune -af --volumes
```

### المشكلة: قاعدة البيانات لا تقبل الاتصالات
**الحل:**
```bash
# إعادة تشغيل PostgreSQL
docker-compose -f docker-compose.local.yml restart postgres

# فحص سجلات قاعدة البيانات
docker-compose -f docker-compose.local.yml logs postgres
```

---

## 🔄 تحديث النظام

```bash
# سحب أحدث التحديثات من Git
git pull origin main

# إعادة بناء وتشغيل الخدمات
docker-compose -f docker-compose.local.yml up --build -d

# تطبيق تحديثات قاعدة البيانات
npm run db:push
```

---

## 📊 مراقبة الأداء

### استخدام الموارد:
```bash
# مراقبة استخدام الموارد
docker stats

# مراقبة مستمرة لخدمة واحدة
docker stats binaa-local-app
```

### فحص صحة الخدمات:
```bash
# فحص صحة جميع الخدمات
docker-compose -f docker-compose.local.yml ps

# فحص تفصيلي لخدمة واحدة
docker inspect binaa-local-app
```

---

## 🔐 الأمان والملاحظات الهامة

### ⚠️ تحذيرات مهمة:
- **هذا الإعداد مخصص للتطوير المحلي فقط**
- **لا تستخدم كلمات المرور الافتراضية في الإنتاج**
- **قم بتغيير جميع المفاتيح السرية قبل النشر الإنتاجي**

### 🔒 إعدادات الأمان الموصى بها للإنتاج:
- تغيير كلمات مرور قاعدة البيانات
- تغيير مفاتيح JWT و Session
- تفعيل HTTPS
- تقييد الوصول للمنافذ
- استخدام secrets management

---

## 📞 الدعم والمساعدة

### في حالة وجود مشاكل:
1. تحقق من سجلات النظام
2. تأكد من توفر الموارد المطلوبة
3. راجع قسم حل المشاكل
4. تواصل مع فريق التطوير

### معلومات المطور:
- **النسخة**: 2.0-local
- **تاريخ التحديث**: 10 سبتمبر 2025
- **البيئة**: التطوير المحلي

---

## 🎯 الخطوات التالية

بعد التشغيل الناجح:
1. ✅ تصفح النظام على http://localhost:3000
2. ✅ اختبر المكونات المختلفة
3. ✅ راجع التوثيق التقني في مجلد `/docs`
4. ✅ ابدأ التطوير والتخصيص حسب الحاجة

**مبروك! 🎉 نظام بنّاء اليمن يعمل الآن على بيئتك المحلية**