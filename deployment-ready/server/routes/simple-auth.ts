import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = express.Router();

// المستخدمون الافتراضيون (تجريبي)
const USERS = [
  {
    id: 'admin-001',
    username: 'admin',
    password: '$2b$12$/4VeePRoGuJ96smz7/depu9QUB6mbp5Kypzjjk6ZTMDNP2Yg81FYW', // Admin@2025!
    firstName: 'مدير',
    lastName: 'النظام',
    email: 'admin@banna-yemen.gov.ye',
    role: 'admin',
    name: 'مدير النظام الرئيسي'
  },
  {
    id: 'surveyor-001',
    username: 'surveyor1',
    password: '$2b$12$JioeO5DzuNWi/nayzHvKruFFult7AbpYlXQ0p2yMayXt3TPrEEtfG', // Employee@2025!
    firstName: 'مساح',
    lastName: 'ميداني',
    email: 'surveyor@banna-yemen.gov.ye',
    role: 'surveyor',
    name: 'مساح ميداني أول'
  }
];

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

// تسجيل الدخول المبسط
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Simple login attempt:', req.body?.username);
    
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'بيانات غير صحيحة'
      });
    }

    const { username, password } = validation.data;
    
    // العثور على المستخدم
    const user = USERS.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من كلمة المرور
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // إنشاء التوكن
    const token = jwt.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours
      aud: 'banna-yemen-users',
      iss: 'banna-yemen-gis'
    }, process.env.JWT_SECRET!);

    console.log('✅ Login successful for:', username);

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
        name: user.name
      },
      token
    });

  } catch (error) {
    console.error('Simple login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'خطأ في الخادم'
    });
  }
});

// التحقق من صحة التوكن
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ valid: false });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = USERS.find(u => u.id === payload.sub);
    
    if (!user) {
      return res.status(401).json({ valid: false });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name
      }
    });

  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// تسجيل الخروج
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});

export default router;