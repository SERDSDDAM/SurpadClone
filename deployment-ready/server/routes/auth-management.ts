import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { authUsers, authSessions, DEFAULT_USERS } from '@shared/auth-schema';

// دالة لإنشاء المستخدمين الافتراضيين
async function ensureDefaultUsers() {
  try {
    // التحقق من وجود المدير
    const [existingAdmin] = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.username, 'admin'))
      .limit(1);
    
    if (!existingAdmin) {
      // إنشاء المستخدمين الافتراضيين
      const defaultUsers = [
        {
          username: 'admin',
          password: await bcrypt.hash('Admin@2025!', 10),
          email: 'admin@banna-yemen.gov.ye',
          firstName: 'مدير',
          lastName: 'النظام',
          role: 'admin',
          isActive: true,
        },
        {
          username: 'surveyor1',
          password: await bcrypt.hash('Employee@2025!', 10),
          email: 'surveyor1@banna-yemen.gov.ye',
          firstName: 'أحمد',
          lastName: 'المساح',
          role: 'staff',
          isActive: true,
        },
        {
          username: 'deputy_technical',
          password: await bcrypt.hash('Deputy@2025!', 10),
          email: 'deputy.technical@banna-yemen.gov.ye',
          firstName: 'محمد',
          lastName: 'الهندسي',
          role: 'deputy_admin_technical',
          isActive: true,
        }
      ];

      for (const user of defaultUsers) {
        await db.insert(authUsers).values(user);
      }
      console.log('✅ Default users created successfully');
    }
  } catch (error) {
    console.log('ℹ️  Default users might already exist:', error.message);
  }
}

const router = express.Router();

// تسجيل الدخول
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // إنشاء المستخدمين الافتراضيين إذا لم يكونوا موجودين
    await ensureDefaultUsers();

    // البحث عن المستخدم
    const [user] = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.username, username))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // التحقق من حالة المستخدم
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // إنشاء JWT
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // تحديث آخر دخول
    await db
      .update(authUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(authUsers.id, user.id));

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      }
    });
  } catch (error) {
    console.error('🔴 Auth Management Login error:', error.message || error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// الحصول على معلومات المستخدم الحالي
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const [user] = await db
      .select({
        id: authUsers.id,
        username: authUsers.username,
        email: authUsers.email,
        firstName: authUsers.firstName,
        lastName: authUsers.lastName,
        role: authUsers.role,
        isActive: authUsers.isActive,
        lastLoginAt: authUsers.lastLoginAt,
      })
      .from(authUsers)
      .where(eq(authUsers.id, decoded.sub))
      .limit(1);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// إنشاء المستخدمين الافتراضيين (للتطوير)
router.post('/seed-users', async (req, res) => {
  try {
    console.log('🌱 إنشاء المستخدمين الافتراضيين...');
    
    for (const defaultUser of DEFAULT_USERS) {
      // التحقق من عدم وجود المستخدم
      const [existingUser] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.username, defaultUser.username))
        .limit(1);

      if (!existingUser) {
        // تشفير كلمة المرور الصحيحة
        let hashedPassword;
        if (defaultUser.username === 'admin') {
          hashedPassword = await bcrypt.hash('Admin@2025!', 10);
        } else if (defaultUser.username === 'surveyor1') {
          hashedPassword = await bcrypt.hash('Employee@2025!', 10);
        } else {
          hashedPassword = await bcrypt.hash('Deputy@2025!', 10);
        }

        await db
          .insert(authUsers)
          .values({
            ...defaultUser,
            password: hashedPassword,
          });

        console.log(`✅ تم إنشاء المستخدم: ${defaultUser.username}`);
      } else {
        console.log(`ℹ️ المستخدم موجود بالفعل: ${defaultUser.username}`);
      }
    }

    res.json({ message: 'Default users created successfully' });
  } catch (error) {
    console.error('Seed users error:', error);
    res.status(500).json({ error: 'Failed to create default users' });
  }
});

export default router;