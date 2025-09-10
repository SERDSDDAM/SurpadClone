import session from 'express-session';
import ConnectPgSimple from 'connect-pg-simple';
import pg from 'pg';

const { Pool } = pg;

// إنشاء مخزن الجلسات باستخدام PostgreSQL
const pgStore = ConnectPgSimple(session);

// إعداد اتصال قاعدة البيانات للجلسات
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// إعداد middleware الجلسات
export const sessionMiddleware = session({
  store: new pgStore({
    pool: pgPool,
    tableName: 'user_sessions', // جدول الجلسات في قاعدة البيانات
    createTableIfMissing: true, // إنشاء الجدول تلقائياً إذا لم يكن موجود
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // اسم الكوكي
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS فقط في الإنتاج
    httpOnly: true, // منع الوصول من JavaScript
    maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
    sameSite: 'strict' // حماية من CSRF
  },
  rolling: true // تجديد انتهاء صلاحية الكوكي مع كل طلب
});

// إعداد محسن للإنتاج
export const productionSessionMiddleware = session({
  store: new pgStore({
    pool: pgPool,
    tableName: 'user_sessions',
    createTableIfMissing: false, // لا ننشئ الجدول في الإنتاج
    pruneSessionInterval: 60 * 15, // تنظيف الجلسات المنتهية كل 15 دقيقة
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  name: 'ssid', // اسم مختصر للكوكي
  cookie: {
    secure: true, // HTTPS مطلوب
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000, // ساعتين فقط في الإنتاج
    sameSite: 'strict',
    domain: process.env.COOKIE_DOMAIN, // نطاق الكوكي
  },
  rolling: false // لا نجدد تلقائياً في الإنتاج
});

// دالة لتنظيف الجلسات القديمة
export async function cleanupOldSessions() {
  try {
    const result = await pgPool.query(
      'DELETE FROM user_sessions WHERE expire < NOW()'
    );
    console.log(`🧹 تم حذف ${result.rowCount} جلسة منتهية الصلاحية`);
  } catch (error) {
    console.error('❌ خطأ في تنظيف الجلسات:', error);
  }
}

// تشغيل تنظيف الجلسات كل ساعة
setInterval(cleanupOldSessions, 60 * 60 * 1000);

export default process.env.NODE_ENV === 'production' 
  ? productionSessionMiddleware 
  : sessionMiddleware;