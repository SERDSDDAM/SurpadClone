import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq, like, desc } from 'drizzle-orm';
import { db } from '../db';
import { authUsers, insertAuthUserSchema, ROLE_NAMES_AR, ROLE_HIERARCHY } from '@shared/auth-schema';
import { requireAuth, requireRole, requireMinLevel } from '../middleware/auth';

const router = Router();

// الحصول على جميع المستخدمين (للمديرين فقط)
router.get('/', requireAuth, requireMinLevel(2), async (req: Request, res: Response) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    let query = db.select({
      id: authUsers.id,
      username: authUsers.username,
      email: authUsers.email,
      firstName: authUsers.firstName,
      lastName: authUsers.lastName,
      role: authUsers.role,
      isActive: authUsers.isActive,
      lastLoginAt: authUsers.lastLoginAt,
      createdAt: authUsers.createdAt,
    }).from(authUsers);

    // تصفية البحث
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        like(authUsers.username, searchTerm)
      );
    }

    // تصفية الدور
    if (role && typeof role === 'string') {
      query = query.where(eq(authUsers.role, role));
    }

    // ترتيب وحد الصفحات
    const offset = (Number(page) - 1) * Number(limit);
    const users = await query
      .orderBy(desc(authUsers.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // تحويل أسماء الأدوار للعربية
    const usersWithRoleNames = users.map(user => ({
      ...user,
      roleNameAr: ROLE_NAMES_AR[user.role as keyof typeof ROLE_NAMES_AR] || user.role,
      roleLevel: ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0,
    }));

    res.json({ 
      users: usersWithRoleNames,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: users.length // TODO: إضافة العد الكامل
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المستخدمين' });
  }
});

// الحصول على مستخدم محدد
router.get('/:id', requireAuth, requireMinLevel(2), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
        createdAt: authUsers.createdAt,
        loginAttempts: authUsers.loginAttempts,
      })
      .from(authUsers)
      .where(eq(authUsers.id, id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const userWithRoleName = {
      ...user,
      roleNameAr: ROLE_NAMES_AR[user.role as keyof typeof ROLE_NAMES_AR] || user.role,
      roleLevel: ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0,
    };

    res.json({ user: userWithRoleName });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب بيانات المستخدم' });
  }
});

// إنشاء مستخدم جديد
router.post('/', requireAuth, requireRole('admin', 'deputy_admin_first'), async (req: Request, res: Response) => {
  try {
    const userData = insertAuthUserSchema.parse(req.body);
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // التحقق من عدم وجود مستخدم بنفس اسم المستخدم أو الإيميل
    const [existingUser] = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.username, userData.username))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    }

    if (userData.email) {
      const [existingEmail] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.email, userData.email))
        .limit(1);

      if (existingEmail) {
        return res.status(400).json({ error: 'الإيميل موجود بالفعل' });
      }
    }

    // إنشاء المستخدم
    const [newUser] = await db
      .insert(authUsers)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning({
        id: authUsers.id,
        username: authUsers.username,
        email: authUsers.email,
        firstName: authUsers.firstName,
        lastName: authUsers.lastName,
        role: authUsers.role,
        isActive: authUsers.isActive,
        createdAt: authUsers.createdAt,
      });

    const userWithRoleName = {
      ...newUser,
      roleNameAr: ROLE_NAMES_AR[newUser.role as keyof typeof ROLE_NAMES_AR] || newUser.role,
    };

    res.status(201).json({ 
      message: 'تم إنشاء المستخدم بنجاح',
      user: userWithRoleName 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء المستخدم' });
  }
});

// تحديث مستخدم
router.put('/:id', requireAuth, requireRole('admin', 'deputy_admin_first'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // إزالة الحقول التي لا يجب تحديثها مباشرة
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.password; // يتم تحديث كلمة المرور من endpoint منفصل

    const [updatedUser] = await db
      .update(authUsers)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, id))
      .returning({
        id: authUsers.id,
        username: authUsers.username,
        email: authUsers.email,
        firstName: authUsers.firstName,
        lastName: authUsers.lastName,
        role: authUsers.role,
        isActive: authUsers.isActive,
        updatedAt: authUsers.updatedAt,
      });

    if (!updatedUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const userWithRoleName = {
      ...updatedUser,
      roleNameAr: ROLE_NAMES_AR[updatedUser.role as keyof typeof ROLE_NAMES_AR] || updatedUser.role,
    };

    res.json({ 
      message: 'تم تحديث المستخدم بنجاح',
      user: userWithRoleName 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث المستخدم' });
  }
});

// حذف مستخدم (إلغاء تفعيل)
router.delete('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // التحقق من أن المستخدم لا يحذف نفسه
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });
    }

    const [deactivatedUser] = await db
      .update(authUsers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, id))
      .returning({
        id: authUsers.id,
        username: authUsers.username,
        isActive: authUsers.isActive,
      });

    if (!deactivatedUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({ message: 'تم إلغاء تفعيل المستخدم بنجاح' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إلغاء تفعيل المستخدم' });
  }
});

// إعادة تعيين كلمة المرور
router.post('/:id/reset-password', requireAuth, requireRole('admin', 'deputy_admin_first'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [updatedUser] = await db
      .update(authUsers)
      .set({
        password: hashedPassword,
        loginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(authUsers.id, id))
      .returning({
        id: authUsers.id,
        username: authUsers.username,
      });

    if (!updatedUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' });
  }
});

// الحصول على الأدوار المتاحة
router.get('/meta/roles', requireAuth, requireMinLevel(2), async (req: Request, res: Response) => {
  const roles = Object.entries(ROLE_NAMES_AR).map(([code, nameAr]) => ({
    code,
    nameAr,
    level: ROLE_HIERARCHY[code as keyof typeof ROLE_HIERARCHY] || 0,
  }));

  res.json({ roles });
});

export default router;