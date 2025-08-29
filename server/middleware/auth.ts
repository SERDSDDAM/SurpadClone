import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

// Interface للمستخدم المصادق عليه
export interface AuthenticatedUser {
  id: string;
  username: string;
  role: string;
  email?: string;
}

// Extend Request type لتشمل user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware للتحقق من JWT token
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // البحث عن التوكن في الكوكي أو header
  const token = req.cookies?.authToken || 
                req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'مطلوب تسجيل دخول للوصول لهذا المورد' 
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    req.user = {
      id: payload.sub || payload.id,
      username: payload.username,
      role: payload.role,
      email: payload.email
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid token', 
      message: 'رمز المصادقة غير صحيح أو منتهي الصلاحية' 
    });
  }
}

/**
 * Middleware للتحقق من دور المستخدم
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'مطلوب تسجيل دخول' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `مطلوب صلاحية ${allowedRoles.join(' أو ')} للوصول لهذا المورد` 
      });
    }

    next();
  };
}

/**
 * Middleware للتحقق من أن المستخدم مدير
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}

/**
 * Middleware للتحقق من أن المستخدم مساح أو مدير
 */
export function requireSurveyor(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin', 'surveyor')(req, res, next);
}

/**
 * Rate limiting لتسجيل الدخول
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // حد أقصى 5 محاولات لكل IP
  message: {
    error: 'Too many login attempts',
    message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموحة. حاول مرة أخرى خلال 15 دقيقة',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting عام للـ API
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'تم تجاوز عدد الطلبات المسموحة. حاول مرة أخرى لاحقاً'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Utility function لإنشاء JWT token
 */
export function createAuthToken(user: {
  id: string;
  username: string;
  role: string;
  email?: string;
}): string {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { 
      expiresIn: '8h',
      issuer: 'banna-yemen-gis',
      audience: 'banna-yemen-users'
    }
  );
}

/**
 * Utility function للتحقق من صحة التوكن
 */
export function verifyAuthToken(token: string): AuthenticatedUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: payload.sub || payload.id,
      username: payload.username,
      role: payload.role,
      email: payload.email
    };
  } catch {
    return null;
  }
}