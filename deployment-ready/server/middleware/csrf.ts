import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// تمديد نوع Request ليشمل csrfToken
declare module 'express-session' {
  interface SessionData {
    csrfSecret?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
    }
  }
}

// إنشاء رمز CSRF آمن
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// إنشاء رمز سري لـ CSRF
function generateCsrfSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

// التحقق من صحة رمز CSRF
function validateCsrfToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  
  try {
    // إنشاء hash متوقع من الرمز السري
    const expectedHash = crypto.createHmac('sha256', secret)
      .update(token.substring(0, 32))
      .digest('hex');
    
    // مقارنة آمنة للـ hash
    const actualHash = token.substring(32);
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(actualHash, 'hex')
    );
  } catch (error) {
    return false;
  }
}

// إنشاء رمز CSRF مع التوقيع
function createSignedCsrfToken(secret: string): string {
  const token = crypto.randomBytes(16).toString('hex');
  const signature = crypto.createHmac('sha256', secret)
    .update(token)
    .digest('hex');
  
  return token + signature;
}

// Middleware لحماية CSRF
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // تخطي GET و HEAD requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // توليد رمز CSRF جديد للـ session
    if (!req.session?.csrfSecret) {
      req.session!.csrfSecret = generateCsrfSecret();
    }
    
    // إضافة دالة توليد الرمز للـ request
    req.csrfToken = () => {
      return createSignedCsrfToken(req.session!.csrfSecret!);
    };
    
    return next();
  }

  // التحقق من رمز CSRF للطلبات المتغيرة
  const csrfToken = req.headers['x-csrf-token'] as string || 
                   req.body._csrf || 
                   req.query._csrf as string;

  const csrfSecret = req.session?.csrfSecret;

  if (!csrfToken || !csrfSecret) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      message: 'رمز الحماية مطلوب لهذا الإجراء',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  // التحقق من صحة الرمز
  if (!validateCsrfToken(csrfToken, csrfSecret)) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token invalid',
      message: 'رمز الحماية غير صالح',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  // إضافة دالة توليد رمز جديد
  req.csrfToken = () => {
    return createSignedCsrfToken(req.session!.csrfSecret!);
  };

  next();
}

// Middleware مبسط لنقاط النهاية الحساسة
export function strictCsrfProtection(req: Request, res: Response, next: NextFunction) {
  // فرض التحقق من CSRF لجميع الطلبات
  const csrfToken = req.headers['x-csrf-token'] as string;
  const csrfSecret = req.session?.csrfSecret;

  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token required',
      message: 'رمز الحماية CSRF مطلوب في الـ header',
      code: 'CSRF_TOKEN_REQUIRED'
    });
  }

  if (!csrfSecret) {
    return res.status(403).json({
      success: false,
      error: 'CSRF session invalid',
      message: 'جلسة العمل غير صالحة',
      code: 'CSRF_SESSION_INVALID'
    });
  }

  if (!validateCsrfToken(csrfToken, csrfSecret)) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token validation failed',
      message: 'فشل في التحقق من رمز الحماية',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }

  next();
}

// إنشاء نقطة نهاية للحصول على رمز CSRF
export function csrfTokenEndpoint(req: Request, res: Response) {
  // إنشاء رمز سري جديد إذا لم يكن موجود
  if (!req.session?.csrfSecret) {
    req.session!.csrfSecret = generateCsrfSecret();
  }

  const token = createSignedCsrfToken(req.session.csrfSecret);

  res.json({
    success: true,
    data: {
      csrfToken: token,
      expiresIn: '1h'
    },
    message: 'رمز الحماية CSRF تم إنشاؤه بنجاح'
  });
}