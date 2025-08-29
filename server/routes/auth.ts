import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { createAuthToken, loginRateLimit } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Schema للتحقق من بيانات تسجيل الدخول
const loginSchema = z.object({
  username: z.string().min(3, 'اسم المستخدم مطلوب'),
  password: z.string().min(6, 'كلمة المرور مطلوبة')
});

/**
 * POST /api/auth/login
 * تسجيل دخول المستخدم
 */
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    console.log('📨 Raw request body:', req.body);
    console.log('📋 Request content-type:', req.headers['content-type']);
    
    // التحقق من صحة البيانات المدخلة
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.errors);
      return res.status(400).json({
        error: 'Validation error',
        message: 'بيانات غير صحيحة',
        details: validationResult.error.errors
      });
    }

    const { username, password } = validationResult.data;

    console.log('🔍 Login attempt for username:', username);

    // البحث عن المستخدم في قاعدة البيانات
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password, // هذا password_hash في الجدول
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        loginAttempts: users.loginAttempts,
        lockedUntil: users.lockedUntil
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    console.log('👤 User found:', user ? `${user.username} (${user.role})` : 'Not found');
    console.log('🔐 Has password:', !!user?.password);
    console.log('✅ Is active:', user?.isActive);
    console.log('🔒 Login attempts:', user?.loginAttempts);
    console.log('⏰ Locked until:', user?.lockedUntil);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من أن المستخدم نشط
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'تم إيقاف هذا الحساب. يرجى التواصل مع الإدارة'
      });
    }

    // التحقق من القفل المؤقت
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const unlockTime = new Date(user.lockedUntil).toLocaleString('ar-SA');
      return res.status(423).json({
        error: 'Account locked',
        message: `الحساب مقفل حتى ${unlockTime} بسبب محاولات دخول خاطئة متكررة`
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = user.password && await bcrypt.compare(password, user.password);
    console.log('🔑 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      // زيادة عدد المحاولات الخاطئة
      const newAttempts = (user.loginAttempts || 0) + 1;
      let updateData: any = {
        loginAttempts: newAttempts,
        updatedAt: new Date()
      };

      // قفل الحساب بعد 5 محاولات خاطئة لمدة 30 دقيقة
      if (newAttempts >= 5) {
        const lockTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        updateData.lockedUntil = lockTime;
      }

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, user.id));

      return res.status(401).json({
        error: 'Invalid credentials',
        message: newAttempts >= 5 
          ? 'تم قفل الحساب لمدة 30 دقيقة بسبب محاولات دخول خاطئة متكررة'
          : 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // تسجيل الدخول الناجح - إعادة تعيين المحاولات وتحديث آخر دخول
    await db.update(users)
      .set({
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // إنشاء JWT token
    const token = createAuthToken({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email || undefined
    });

    // حفظ التوكن في httpOnly cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      path: '/'
    });

    // إرجاع بيانات المستخدم (بدون كلمة المرور)
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
      },
      token // يمكن حذف هذا في الإنتاج إذا كنت تعتمد على cookies فقط
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'خطأ في الخادم. يرجى المحاولة مرة أخرى'
    });
  }
});

/**
 * POST /api/auth/logout
 * تسجيل خروج المستخدم
 */
router.post('/logout', (req, res) => {
  // مسح الكوكي
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});

/**
 * GET /api/auth/me
 * الحصول على بيانات المستخدم الحالي
 */
router.get('/me', async (req, res) => {
  const token = req.cookies?.authToken;
  
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'غير مسجل دخول'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET) as any;

    // جلب بيانات المستخدم المحدثة من قاعدة البيانات
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        lastLogin: users.lastLogin
      })
      .from(users)
      .where(and(
        eq(users.id, payload.sub || payload.id),
        eq(users.isActive, true)
      ))
      .limit(1);

    if (!user) {
      // مسح الكوكي إذا كان المستخدم غير موجود أو معطل
      res.clearCookie('authToken');
      return res.status(401).json({
        error: 'User not found',
        message: 'المستخدم غير موجود أو معطل'
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.clearCookie('authToken');
    res.status(401).json({
      error: 'Invalid token',
      message: 'رمز المصادقة غير صحيح'
    });
  }
});

/**
 * GET /api/auth/check
 * فحص سريع لحالة المصادقة
 */
router.get('/check', (req, res) => {
  const token = req.cookies?.authToken;
  
  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.clearCookie('authToken');
    res.json({ authenticated: false });
  }
});

export default router;