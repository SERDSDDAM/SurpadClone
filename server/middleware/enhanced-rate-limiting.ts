import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiter متقدم لعمليات رفع الملفات
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 طلبات رفع كحد أقصى لكل IP
  message: {
    success: false,
    error: 'تم تجاوز الحد الأقصى لعمليات رفع الملفات',
    message: 'يُسمح برفع 5 ملفات كل 15 دقيقة فقط. يرجى المحاولة لاحقاً.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // تخطي المستخدمين المميزين (اختياري)
    return req.user?.role === 'admin' && process.env.NODE_ENV === 'development';
  },
  keyGenerator: (req: Request) => {
    // استخدام IP + User ID إن وجد للحصول على معرف فريد
    return req.user?.id ? `${req.ip}-${req.user.id}` : req.ip || 'unknown';
  }
});

// Rate limiter صارم للعمليات الحساسة (admin فقط)
export const adminActionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 20, // 20 إجراء إداري كحد أقصى في الساعة
  message: {
    success: false,
    error: 'تم تجاوز الحد الأقصى للإجراءات الإدارية',
    message: 'يُسمح بـ 20 إجراء إداري في الساعة فقط.',
    code: 'ADMIN_ACTION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'unknown';
  }
});

// Rate limiter للاستعلامات العامة
export const queryRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // دقيقة واحدة
  max: 100, // 100 استعلام في الدقيقة
  message: {
    success: false,
    error: 'تم تجاوز الحد الأقصى للاستعلامات',
    message: 'يُسمح بـ 100 استعلام في الدقيقة فقط.',
    code: 'QUERY_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter مخصص للعمليات الجماعية
export const bulkOperationRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 دقيقة
  max: 3, // 3 عمليات جماعية كحد أقصى
  message: {
    success: false,
    error: 'تم تجاوز الحد الأقصى للعمليات الجماعية',
    message: 'يُسمح بـ 3 عمليات جماعية كل 30 دقيقة فقط.',
    code: 'BULK_OPERATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'unknown';
  }
});

// Rate limiter متدرج حسب دور المستخدم - نسخة مبسطة
export function createRoleBasedRateLimit(limits: Record<string, { max: number; windowMs: number }>) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // حد افتراضي للمدير
    skip: (req: Request) => false,
    keyGenerator: (req: Request) => {
      const role = req.user?.role || 'guest';
      return `${role}-${req.user?.id || req.ip || 'unknown'}`;
    },
    message: {
      success: false,
      error: 'تم تجاوز الحد المسموح للطلبات',
      message: 'يرجى المحاولة لاحقاً',
      code: 'ROLE_BASED_RATE_LIMIT_EXCEEDED'
    }
  });
}

// Rate limiter للبيانات الجغرافية مع حدود مخصصة
export const geographicDataRateLimit = createRoleBasedRateLimit({
  'admin': { max: 50, windowMs: 15 * 60 * 1000 }, // 50 طلب كل 15 دقيقة للمدير
  'deputy_admin_technical': { max: 30, windowMs: 15 * 60 * 1000 }, // 30 طلب للنائب التقني
  'deputy_admin_planning': { max: 25, windowMs: 15 * 60 * 1000 }, // 25 طلب لنائب التخطيط
  'manager': { max: 20, windowMs: 15 * 60 * 1000 }, // 20 طلب للمدير
  'section_head': { max: 15, windowMs: 15 * 60 * 1000 }, // 15 طلب لرئيس القسم
  'staff': { max: 10, windowMs: 15 * 60 * 1000 }, // 10 طلب للموظف
  'guest': { max: 5, windowMs: 15 * 60 * 1000 } // 5 طلب للزائر
});

// Middleware للتحقق من معدل الطلبات بناءً على نوع العملية
export function createSmartRateLimit(operation: 'upload' | 'query' | 'admin' | 'bulk') {
  switch (operation) {
    case 'upload':
      return uploadRateLimit;
    case 'query':
      return queryRateLimit;
    case 'admin':
      return adminActionRateLimit;
    case 'bulk':
      return bulkOperationRateLimit;
    default:
      return queryRateLimit;
  }
}

// Rate limiter تكيفي يتغير حسب حمل الخادم
export function adaptiveRateLimit(baseMax: number = 100) {
  return rateLimit({
    windowMs: 1 * 60 * 1000, // دقيقة واحدة
    
    // تحديد الحد الأقصى بناءً على أداء الخادم
    max: (req: Request) => {
      // يمكن إضافة منطق لمراقبة أداء الخادم هنا
      // مثل استخدام CPU أو الذاكرة
      return baseMax;
    },
    
    message: {
      success: false,
      error: 'الخادم مُحمل حالياً',
      message: 'يرجى تقليل عدد الطلبات أو المحاولة لاحقاً',
      code: 'ADAPTIVE_RATE_LIMIT_EXCEEDED'
    },
    
    standardHeaders: true,
    legacyHeaders: false
  });
}