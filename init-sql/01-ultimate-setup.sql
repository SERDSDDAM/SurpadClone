-- ===============================================
-- إعداد قاعدة البيانات النهائي - بنّاء اليمن
-- ===============================================

-- إعداد امتدادات PostGIS والتوابع المساعدة
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- إعداد إذونات كاملة للمستخدم postgres
GRANT ALL PRIVILEGES ON DATABASE binaa_yemen TO postgres;
ALTER USER postgres WITH SUPERUSER;

-- إعداد Schema الأساسي
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- إعداد إذونات للجداول المستقبلية
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;

-- تحسين الأداء
ALTER SYSTEM SET shared_preload_libraries = 'postgis-3, pg_stat_statements';
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = '100';

-- إعداد المنطقة الزمنية لليمن
ALTER SYSTEM SET timezone = 'Asia/Aden';

-- تأكيد نجاح الإعداد
SELECT 'PostgreSQL setup completed successfully for Binaa Al-Yemen!' as status;