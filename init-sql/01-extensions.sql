-- ===============================================
-- إعداد الامتدادات المطلوبة لنظام بنّاء اليمن
-- ===============================================

-- إنشاء امتداد PostGIS للبيانات المكانية
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- إنشاء امتداد UUID للمعرفات الفريدة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- إنشاء امتداد Hstore للبيانات المفاتيح-القيم
CREATE EXTENSION IF NOT EXISTS hstore;

-- إنشاء امتداد pg_trgm للبحث النصي المحسن
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- إنشاء امتداد btree_gin للفهرسة المحسنة
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- إنشاء امتداد btree_gist للفهرسة المكانية
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- التحقق من الامتدادات المثبتة
SELECT name, default_version, installed_version 
FROM pg_available_extensions 
WHERE installed_version IS NOT NULL
ORDER BY name;