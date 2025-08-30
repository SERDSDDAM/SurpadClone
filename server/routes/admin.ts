import express from 'express';
import { db } from '../db';
import { users, surveyRequests } from '../../shared/schema';
import { count, eq, sql, and, gte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authMiddleware);

// Additional admin role check
const requireAdminRole = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'صلاحية المدير مطلوبة'
    });
  }
  next();
};

router.use(requireAdminRole);

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Calculate date for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get current stats
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalLayers,
      totalDecisions,
      approvedDecisions,
      pendingDecisions
    ] = await Promise.all([
      // Total users
      db.select({ count: count() }).from(users),
      
      // Active users (logged in within last 30 days)
      db.select({ count: count() }).from(users).where(
        and(
          eq(users.isActive, true),
          gte(users.lastLogin, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      ),
      
      // New users this month
      db.select({ count: count() }).from(users).where(
        gte(users.createdAt, startOfMonth)
      ),
      
      // Total layers (mock data based on existing system)
      Promise.resolve([{ count: 35 }]),
      
      // Total survey decisions
      db.select({ count: count() }).from(surveyRequests),
      
      // Approved decisions
      db.select({ count: count() }).from(surveyRequests).where(
        eq(surveyRequests.status, 'approved')
      ),
      
      // Pending decisions
      db.select({ count: count() }).from(surveyRequests).where(
        eq(surveyRequests.status, 'submitted')
      )
    ]);

    // Calculate change percentages (mock for now)
    const userChangePercent = Math.random() > 0.5 ? Math.floor(Math.random() * 20) : -Math.floor(Math.random() * 10);
    const layerChangePercent = Math.random() > 0.5 ? Math.floor(Math.random() * 15) : -Math.floor(Math.random() * 5);
    const decisionChangePercent = Math.random() > 0.5 ? Math.floor(Math.random() * 25) : -Math.floor(Math.random() * 8);

    // Mock recent activities
    const recentActivities = [
      {
        id: '1',
        type: 'user_created',
        description: 'تم إنشاء مستخدم جديد: أحمد محمد',
        user: 'admin',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '2',
        type: 'layer_uploaded',
        description: 'تم رفع طبقة جديدة: المباني السكنية - صنعاء',
        user: 'surveyor1',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '3',
        type: 'decision_approved',
        description: 'تم اعتماد قرار مساحي رقم: 2024-1234',
        user: 'admin',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '4',
        type: 'system_backup',
        description: 'تم إنشاء نسخة احتياطية للنظام',
        user: 'system',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '5',
        type: 'permission_changed',
        description: 'تم تعديل صلاحيات المستخدم: فاطمة علي',
        user: 'admin',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: 'warning'
      }
    ];

    const stats = {
      users: {
        total: totalUsers[0]?.count || 0,
        active: activeUsers[0]?.count || 0,
        new_this_month: newUsersThisMonth[0]?.count || 0,
        change_percent: userChangePercent
      },
      layers: {
        total: totalLayers[0]?.count || 35,
        processed: Math.floor((totalLayers[0]?.count || 35) * 0.85),
        pending: Math.floor((totalLayers[0]?.count || 35) * 0.15),
        change_percent: layerChangePercent
      },
      decisions: {
        total: totalDecisions[0]?.count || 0,
        approved: approvedDecisions[0]?.count || 0,
        pending: pendingDecisions[0]?.count || 0,
        change_percent: decisionChangePercent
      },
      performance: {
        uptime: 99.2,
        response_time: 145,
        success_rate: 99.8
      },
      recent_activities: recentActivities
    };

    res.json(stats);

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'خطأ في جلب الإحصائيات'
    });
  }
});

/**
 * GET /api/admin/users
 * Get paginated list of users
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    
    const offset = (page - 1) * limit;

    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        sql`(${users.username} ILIKE ${`%${search}%`} OR ${users.firstName} ILIKE ${`%${search}%`} OR ${users.lastName} ILIKE ${`%${search}%`})`
      );
    }
    
    if (role) {
      whereConditions.push(eq(users.role, role));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [usersList, totalCount] = await Promise.all([
      db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt
      })
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${users.createdAt} DESC`),
      
      db.select({ count: count() }).from(users).where(whereClause)
    ]);

    res.json({
      users: usersList,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'خطأ في جلب المستخدمين'
    });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', async (req, res) => {
  try {
    const { nationalId, username, email, phone, firstName, lastName, role, password } = req.body;

    // Validate required fields
    if (!nationalId || !username || !firstName || !lastName || !role || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'جميع الحقول المطلوبة يجب أن تكون محددة'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      nationalId,
      username,
      email,
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isActive: true,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      user: newUser
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'User already exists',
        message: 'المستخدم موجود بالفعل'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'خطأ في إنشاء المستخدم'
    });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update existing user
 */
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, firstName, lastName, role, isActive } = req.body;

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (existingUser.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'المستخدم غير موجود'
      });
    }

    // Prevent admin from deactivating themselves
    if (existingUser[0].id === req.user?.id && isActive === false) {
      return res.status(400).json({
        error: 'Cannot deactivate self',
        message: 'لا يمكن إلغاء تفعيل حسابك الخاص'
      });
    }

    // Update user
    const [updatedUser] = await db.update(users)
      .set({
        username: username || existingUser[0].username,
        email: email !== undefined ? email : existingUser[0].email,
        phone: phone !== undefined ? phone : existingUser[0].phone,
        firstName: firstName || existingUser[0].firstName,
        lastName: lastName || existingUser[0].lastName,
        role: role || existingUser[0].role,
        isActive: isActive !== undefined ? isActive : existingUser[0].isActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        updatedAt: users.updatedAt
      });

    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'اسم المستخدم موجود بالفعل'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'خطأ في تحديث المستخدم'
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Soft delete user (deactivate)
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (existingUser.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'المستخدم غير موجود'
      });
    }

    // Prevent admin from deleting themselves
    if (existingUser[0].id === req.user?.id) {
      return res.status(400).json({
        error: 'Cannot delete self',
        message: 'لا يمكن حذف حسابك الخاص'
      });
    }

    // Soft delete - just deactivate
    await db.update(users)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));

    res.json({
      success: true,
      message: 'تم إلغاء تفعيل المستخدم بنجاح'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'خطأ في حذف المستخدم'
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get single user details
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.select({
      id: users.id,
      nationalId: users.nationalId,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      isVerified: users.isVerified,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users).where(eq(users.id, id)).limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      user: user[0]
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'خطأ في جلب بيانات المستخدم'
    });
  }
});

/**
 * PATCH /api/admin/users/:id/password
 * Reset user password
 */
router.patch('/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
      });
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
    
    if (existingUser.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'المستخدم غير موجود'
      });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, id));

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'خطأ في تغيير كلمة المرور'
    });
  }
});

export default router;