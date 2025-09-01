import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { eq, and, or, sql, desc, asc, count, gte, lte } from 'drizzle-orm';
import { authenticateToken } from './working-auth';
import { AdvancedRBACService } from '../services/AdvancedRBACService-fixed';
import {
  conditionalPermissions,
  temporaryPermissions,
  roleHierarchy,
  contextualRoles,
  smartWorkflowTasks,
  smartDelegations,
  permissionMonitoring,
  smartAlerts,
  ConditionalPermissionInsertSchema,
  TemporaryPermissionInsertSchema,
  RoleHierarchyInsertSchema,
  ContextualRoleInsertSchema,
  SmartWorkflowTaskInsertSchema,
  SmartDelegationInsertSchema,
} from '../../shared/advanced-rbac-schema';

const router = Router();
const rbacService = new AdvancedRBACService();

// Middleware للتوثيق
router.use(authenticateToken);

// مخططات التحقق من البيانات
const PermissionCheckSchema = z.object({
  permissionCode: z.string(),
  resource: z.string(),
  action: z.string(),
  amount: z.number().optional(),
  context: z.object({
    location: z.object({
      district: z.string().optional(),
      office: z.string().optional(),
      building: z.string().optional(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      }).optional()
    }).optional(),
    metadata: z.any().optional()
  }).optional()
});

/**
 * فحص الصلاحيات المتقدم
 */
router.post('/check-permission', async (req: any, res) => {
  try {
    const validation = PermissionCheckSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'بيانات الطلب غير صحيحة',
        details: validation.error.issues
      });
    }

    const { permissionCode, resource, action, amount, context } = validation.data;
    const userId = req.user.sub;

    const userContext = {
      userId,
      currentTime: new Date(),
      location: context?.location,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionId
    };

    const result = await rbacService.checkAdvancedPermission(
      userId,
      permissionCode,
      resource,
      action,
      userContext,
      amount
    );

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error checking advanced permission:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في فحص الصلاحيات',
      message: error.message
    });
  }
});

/**
 * إدارة الصلاحيات المشروطة
 */

// جلب الصلاحيات المشروطة
router.get('/conditional-permissions', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    const isActive = req.query.isActive as string;

    let query = db.select().from(conditionalPermissions);
    
    const conditions = [];
    if (userId) {
      conditions.push(eq(conditionalPermissions.userId, userId));
    }
    if (isActive !== undefined) {
      conditions.push(eq(conditionalPermissions.isActive, isActive === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(conditionalPermissions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const totalResult = await db
      .select({ count: count() })
      .from(conditionalPermissions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      success: true,
      conditionalPermissions: results,
      pagination: {
        page,
        limit,
        total: totalResult[0].count
      }
    });

  } catch (error) {
    console.error('Error fetching conditional permissions:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب الصلاحيات المشروطة'
    });
  }
});

// إنشاء صلاحية مشروطة
router.post('/conditional-permissions', async (req: any, res) => {
  try {
    const validation = ConditionalPermissionInsertSchema.safeParse({
      ...req.body,
      createdBy: req.user.sub
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'بيانات غير صحيحة',
        details: validation.error.issues
      });
    }

    const result = await db
      .insert(conditionalPermissions)
      .values(validation.data)
      .returning();

    res.status(201).json({
      success: true,
      conditionalPermission: result[0],
      message: 'تم إنشاء الصلاحية المشروطة بنجاح'
    });

  } catch (error) {
    console.error('Error creating conditional permission:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء الصلاحية المشروطة'
    });
  }
});

// تحديث صلاحية مشروطة
router.put('/conditional-permissions/:id', async (req: any, res) => {
  try {
    const id = req.params.id;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    const result = await db
      .update(conditionalPermissions)
      .set(updateData)
      .where(eq(conditionalPermissions.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'الصلاحية المشروطة غير موجودة'
      });
    }

    res.json({
      success: true,
      conditionalPermission: result[0],
      message: 'تم تحديث الصلاحية المشروطة بنجاح'
    });

  } catch (error) {
    console.error('Error updating conditional permission:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في تحديث الصلاحية المشروطة'
    });
  }
});

/**
 * إدارة الصلاحيات المؤقتة
 */

// جلب الصلاحيات المؤقتة
router.get('/temporary-permissions', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    const isActive = req.query.isActive as string;
    const isEmergency = req.query.isEmergency as string;

    let query = db.select().from(temporaryPermissions);
    
    const conditions = [];
    if (userId) {
      conditions.push(eq(temporaryPermissions.userId, userId));
    }
    if (isActive !== undefined) {
      conditions.push(eq(temporaryPermissions.isActive, isActive === 'true'));
    }
    if (isEmergency !== undefined) {
      conditions.push(eq(temporaryPermissions.isEmergency, isEmergency === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(temporaryPermissions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      success: true,
      temporaryPermissions: results
    });

  } catch (error) {
    console.error('Error fetching temporary permissions:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب الصلاحيات المؤقتة'
    });
  }
});

// إنشاء صلاحية مؤقتة
router.post('/temporary-permissions', async (req: any, res) => {
  try {
    const validation = TemporaryPermissionInsertSchema.safeParse({
      ...req.body,
      grantedBy: req.user.sub
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'بيانات غير صحيحة',
        details: validation.error.issues
      });
    }

    const result = await db
      .insert(temporaryPermissions)
      .values(validation.data)
      .returning();

    res.status(201).json({
      success: true,
      temporaryPermission: result[0],
      message: 'تم إنشاء الصلاحية المؤقتة بنجاح'
    });

  } catch (error) {
    console.error('Error creating temporary permission:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء الصلاحية المؤقتة'
    });
  }
});

// إلغاء صلاحية مؤقتة
router.patch('/temporary-permissions/:id/revoke', async (req: any, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;

    const result = await db
      .update(temporaryPermissions)
      .set({
        isRevoked: true,
        isActive: false,
        revokedAt: new Date(),
        revokedBy: req.user.sub,
        revokeReason: reason
      })
      .where(eq(temporaryPermissions.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'الصلاحية المؤقتة غير موجودة'
      });
    }

    res.json({
      success: true,
      message: 'تم إلغاء الصلاحية المؤقتة بنجاح'
    });

  } catch (error) {
    console.error('Error revoking temporary permission:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إلغاء الصلاحية المؤقتة'
    });
  }
});

/**
 * إدارة التدرج الهرمي للأدوار
 */

// جلب الهيكل الهرمي للأدوار
router.get('/role-hierarchy', async (req: any, res) => {
  try {
    const hierarchy = await db
      .select()
      .from(roleHierarchy)
      .where(eq(roleHierarchy.isActive, true))
      .orderBy(asc(roleHierarchy.priority));

    res.json({
      success: true,
      roleHierarchy: hierarchy
    });

  } catch (error) {
    console.error('Error fetching role hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب الهيكل الهرمي للأدوار'
    });
  }
});

// إنشاء علاقة هرمية جديدة
router.post('/role-hierarchy', async (req: any, res) => {
  try {
    const validation = RoleHierarchyInsertSchema.safeParse({
      ...req.body,
      createdBy: req.user.sub
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'بيانات غير صحيحة',
        details: validation.error.issues
      });
    }

    const result = await db
      .insert(roleHierarchy)
      .values(validation.data)
      .returning();

    res.status(201).json({
      success: true,
      roleHierarchy: result[0],
      message: 'تم إنشاء العلاقة الهرمية بنجاح'
    });

  } catch (error) {
    console.error('Error creating role hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء العلاقة الهرمية'
    });
  }
});

/**
 * إدارة الأدوار السياقية
 */

// جلب الأدوار السياقية
router.get('/contextual-roles', async (req: any, res) => {
  try {
    const userId = req.query.userId as string;
    const contextType = req.query.contextType as string;

    let query = db.select().from(contextualRoles);
    
    const conditions = [];
    if (userId) {
      conditions.push(eq(contextualRoles.userId, userId));
    }
    if (contextType) {
      conditions.push(eq(contextualRoles.contextType, contextType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(contextualRoles.createdAt));

    res.json({
      success: true,
      contextualRoles: results
    });

  } catch (error) {
    console.error('Error fetching contextual roles:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب الأدوار السياقية'
    });
  }
});

// إنشاء دور سياقي
router.post('/contextual-roles', async (req: any, res) => {
  try {
    const validation = ContextualRoleInsertSchema.safeParse({
      ...req.body,
      createdBy: req.user.sub
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'بيانات غير صحيحة',
        details: validation.error.issues
      });
    }

    const result = await db
      .insert(contextualRoles)
      .values(validation.data)
      .returning();

    res.status(201).json({
      success: true,
      contextualRole: result[0],
      message: 'تم إنشاء الدور السياقي بنجاح'
    });

  } catch (error) {
    console.error('Error creating contextual role:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء الدور السياقي'
    });
  }
});

/**
 * إدارة المهام الذكية
 */

// جلب المهام
router.get('/smart-tasks', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const assignedToUserId = req.query.assignedToUserId as string;

    let query = db.select().from(smartWorkflowTasks);
    
    const conditions = [];
    if (status) {
      conditions.push(eq(smartWorkflowTasks.status, status));
    }
    if (priority) {
      conditions.push(eq(smartWorkflowTasks.priority, priority));
    }
    if (assignedToUserId) {
      conditions.push(eq(smartWorkflowTasks.assignedToUserId, assignedToUserId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(smartWorkflowTasks.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      success: true,
      smartTasks: results
    });

  } catch (error) {
    console.error('Error fetching smart tasks:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب المهام الذكية'
    });
  }
});

// إنشاء مهمة ذكية
router.post('/smart-tasks', async (req: any, res) => {
  try {
    const validation = SmartWorkflowTaskInsertSchema.safeParse({
      ...req.body,
      createdBy: req.user.sub
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'بيانات غير صحيحة',
        details: validation.error.issues
      });
    }

    const result = await db
      .insert(smartWorkflowTasks)
      .values(validation.data)
      .returning();

    res.status(201).json({
      success: true,
      smartTask: result[0],
      message: 'تم إنشاء المهمة الذكية بنجاح'
    });

  } catch (error) {
    console.error('Error creating smart task:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء المهمة الذكية'
    });
  }
});

// تحديث حالة المهمة
router.patch('/smart-tasks/:id/status', async (req: any, res) => {
  try {
    const id = req.params.id;
    const { status, progress, result, decision } = req.body;

    const updateData: any = {
      lastModifiedAt: new Date()
    };

    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (result) updateData.result = result;
    if (decision) updateData.decision = decision;

    if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'in_progress' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }

    const resultData = await db
      .update(smartWorkflowTasks)
      .set(updateData)
      .where(eq(smartWorkflowTasks.id, id))
      .returning();

    if (resultData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'المهمة غير موجودة'
      });
    }

    res.json({
      success: true,
      smartTask: resultData[0],
      message: 'تم تحديث حالة المهمة بنجاح'
    });

  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في تحديث حالة المهمة'
    });
  }
});

/**
 * إدارة التفويضات الذكية
 */

// جلب التفويضات
router.get('/smart-delegations', async (req: any, res) => {
  try {
    const fromUserId = req.query.fromUserId as string;
    const toUserId = req.query.toUserId as string;
    const delegationType = req.query.delegationType as string;
    const isActive = req.query.isActive as string;

    let query = db.select().from(smartDelegations);
    
    const conditions = [];
    if (fromUserId) {
      conditions.push(eq(smartDelegations.fromUserId, fromUserId));
    }
    if (toUserId) {
      conditions.push(eq(smartDelegations.toUserId, toUserId));
    }
    if (delegationType) {
      conditions.push(eq(smartDelegations.delegationType, delegationType));
    }
    if (isActive !== undefined) {
      conditions.push(eq(smartDelegations.isActive, isActive === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(smartDelegations.createdAt));

    res.json({
      success: true,
      smartDelegations: results
    });

  } catch (error) {
    console.error('Error fetching smart delegations:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب التفويضات الذكية'
    });
  }
});

// إنشاء تفويض ذكي
router.post('/smart-delegations', async (req: any, res) => {
  try {
    const validation = SmartDelegationInsertSchema.safeParse({
      ...req.body,
      createdBy: req.user.sub
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'بيانات غير صحيحة',
        details: validation.error.issues
      });
    }

    const result = await db
      .insert(smartDelegations)
      .values(validation.data)
      .returning();

    res.status(201).json({
      success: true,
      smartDelegation: result[0],
      message: 'تم إنشاء التفويض الذكي بنجاح'
    });

  } catch (error) {
    console.error('Error creating smart delegation:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء التفويض الذكي'
    });
  }
});

/**
 * مراقبة الصلاحيات والتقارير
 */

// جلب سجل مراقبة الصلاحيات
router.get('/permission-monitoring', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId as string;
    const action = req.query.action as string;
    const result = req.query.result as string;
    const minRiskScore = parseInt(req.query.minRiskScore as string) || 0;

    let query = db.select().from(permissionMonitoring);
    
    const conditions = [];
    if (userId) {
      conditions.push(eq(permissionMonitoring.userId, userId));
    }
    if (action) {
      conditions.push(eq(permissionMonitoring.action, action));
    }
    if (result) {
      conditions.push(eq(permissionMonitoring.result, result));
    }
    if (minRiskScore > 0) {
      conditions.push(gte(permissionMonitoring.riskScore, minRiskScore));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(permissionMonitoring.timestamp))
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      success: true,
      permissionMonitoring: results
    });

  } catch (error) {
    console.error('Error fetching permission monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب سجل مراقبة الصلاحيات'
    });
  }
});

// جلب التنبيهات الذكية
router.get('/smart-alerts', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const severity = req.query.severity as string;
    const status = req.query.status as string;

    let query = db.select().from(smartAlerts);
    
    const conditions = [];
    if (type) {
      conditions.push(eq(smartAlerts.type, type));
    }
    if (severity) {
      conditions.push(eq(smartAlerts.severity, severity));
    }
    if (status) {
      conditions.push(eq(smartAlerts.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(smartAlerts.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    res.json({
      success: true,
      smartAlerts: results
    });

  } catch (error) {
    console.error('Error fetching smart alerts:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب التنبيهات الذكية'
    });
  }
});

// تأكيد التنبيه
router.patch('/smart-alerts/:id/acknowledge', async (req: any, res) => {
  try {
    const id = req.params.id;

    const result = await db
      .update(smartAlerts)
      .set({
        status: 'acknowledged',
        acknowledgedBy: req.user.sub,
        acknowledgedAt: new Date()
      })
      .where(eq(smartAlerts.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'التنبيه غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تأكيد التنبيه بنجاح'
    });

  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في تأكيد التنبيه'
    });
  }
});

/**
 * تقارير الأداء والإحصائيات
 */

// تقرير إحصائيات الصلاحيات
router.get('/reports/permission-stats', async (req: any, res) => {
  try {
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();

    // إحصائيات عامة
    const totalRequests = await db
      .select({ count: count() })
      .from(permissionMonitoring)
      .where(
        and(
          gte(permissionMonitoring.timestamp, fromDate),
          lte(permissionMonitoring.timestamp, toDate)
        )
      );

    const grantedRequests = await db
      .select({ count: count() })
      .from(permissionMonitoring)
      .where(
        and(
          gte(permissionMonitoring.timestamp, fromDate),
          lte(permissionMonitoring.timestamp, toDate),
          eq(permissionMonitoring.result, 'granted')
        )
      );

    const deniedRequests = await db
      .select({ count: count() })
      .from(permissionMonitoring)
      .where(
        and(
          gte(permissionMonitoring.timestamp, fromDate),
          lte(permissionMonitoring.timestamp, toDate),
          eq(permissionMonitoring.result, 'denied')
        )
      );

    const highRiskRequests = await db
      .select({ count: count() })
      .from(permissionMonitoring)
      .where(
        and(
          gte(permissionMonitoring.timestamp, fromDate),
          lte(permissionMonitoring.timestamp, toDate),
          gte(permissionMonitoring.riskScore, 7)
        )
      );

    // أكثر الصلاحيات استخداماً
    const topPermissions = await db
      .select({
        permission: permissionMonitoring.permissionUsed,
        count: count()
      })
      .from(permissionMonitoring)
      .where(
        and(
          gte(permissionMonitoring.timestamp, fromDate),
          lte(permissionMonitoring.timestamp, toDate),
          eq(permissionMonitoring.result, 'granted')
        )
      )
      .groupBy(permissionMonitoring.permissionUsed)
      .orderBy(desc(count()))
      .limit(10);

    // أكثر المستخدمين نشاطاً
    const topUsers = await db
      .select({
        userId: permissionMonitoring.userId,
        count: count()
      })
      .from(permissionMonitoring)
      .where(
        and(
          gte(permissionMonitoring.timestamp, fromDate),
          lte(permissionMonitoring.timestamp, toDate)
        )
      )
      .groupBy(permissionMonitoring.userId)
      .orderBy(desc(count()))
      .limit(10);

    res.json({
      success: true,
      stats: {
        period: { fromDate, toDate },
        summary: {
          totalRequests: totalRequests[0].count,
          grantedRequests: grantedRequests[0].count,
          deniedRequests: deniedRequests[0].count,
          highRiskRequests: highRiskRequests[0].count,
          successRate: totalRequests[0].count > 0 
            ? ((grantedRequests[0].count / totalRequests[0].count) * 100).toFixed(2) 
            : '0'
        },
        topPermissions,
        topUsers
      }
    });

  } catch (error) {
    console.error('Error generating permission stats:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء تقرير إحصائيات الصلاحيات'
    });
  }
});

export default router;