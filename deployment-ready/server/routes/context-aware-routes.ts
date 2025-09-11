/**
 * مسارات API للذكاء السياقي التلقائي - المرحلة 1
 */

import { Router } from 'express';
import { contextAwareService } from '../services/ContextAwareService-fixed';
import { requireAuth, requireRole } from '../middleware/auth';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { 
  contextualTriggers, 
  userContextState, 
  contextualEvents,
  type ContextualTriggerInsert 
} from '../../shared/advanced-rbac-schema';
import { z } from 'zod';

const router = Router();

// التحقق من الهوية والدور الإداري
router.use(requireAuth);
router.use(requireRole('admin'));

// Schema للتحقق من البيانات
const UpdateContextSchema = z.object({
  project: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    district: z.string().optional(),
    office: z.string().optional(),
    building: z.string().optional(),
  }).optional(),
  session: z.object({
    sessionId: z.string(),
    ipAddress: z.string(),
    userAgent: z.string(),
    deviceFingerprint: z.string(),
  }).optional(),
  emergency: z.object({
    level: z.number().min(1).max(5),
    type: z.string(),
    reason: z.string(),
    activatedBy: z.string(),
  }).optional(),
});

const CreateTriggerSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  triggerType: z.enum(['project', 'location', 'time', 'emergency', 'amount']),
  projectTriggers: z.object({
    projectIds: z.array(z.string()).optional(),
    projectTypes: z.array(z.string()).optional(),
    autoActivateOnOpen: z.boolean().optional(),
    autoDeactivateOnClose: z.boolean().optional(),
  }).optional(),
  locationTriggers: z.object({
    allowedBounds: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
    allowedDistricts: z.array(z.string()).optional(),
    allowedOffices: z.array(z.string()).optional(),
    allowedBuildings: z.array(z.string()).optional(),
    radius: z.number().optional(),
    centerPoint: z.tuple([z.number(), z.number()]).optional(),
    strictMode: z.boolean().optional(),
  }).optional(),
  timeTriggers: z.object({
    workingHours: z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
    }).optional(),
    allowedDays: z.array(z.string()).optional(),
    timeZone: z.string().optional(),
    holidayRestrictions: z.boolean().optional(),
    emergencyOverride: z.boolean().optional(),
  }).optional(),
  emergencyTriggers: z.object({
    autoActivateOnLevel: z.number().min(1).max(5).optional(),
    emergencyTypes: z.array(z.string()).optional(),
    escalationMinutes: z.number().optional(),
    notificationChannels: z.array(z.string()).optional(),
    overrideAllRestrictions: z.boolean().optional(),
  }).optional(),
  amountTriggers: z.object({
    maxAmount: z.number().optional(),
    dailyLimit: z.number().optional(),
    monthlyLimit: z.number().optional(),
    requiresApprovalAbove: z.number().optional(),
    escalateAbove: z.number().optional(),
  }).optional(),
  affectedPermissions: z.array(z.string()).min(1),
  actions: z.object({
    activatePermissions: z.array(z.string()).optional(),
    deactivatePermissions: z.array(z.string()).optional(),
    sendNotification: z.boolean().optional(),
    logActivity: z.boolean().optional(),
    requireConfirmation: z.boolean().optional(),
    temporaryDuration: z.number().optional(),
  }).optional(),
  priority: z.number().min(1).max(10).default(5),
  notes: z.string().optional(),
});

/**
 * تحديث السياق الحالي للمستخدم
 * POST /api/context-aware/update-context
 */
router.post('/update-context', async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'معرف المستخدم مطلوب' });
    }

    const validatedData = UpdateContextSchema.parse(req.body);
    
    await contextAwareService.updateUserContext(userId, validatedData);
    
    res.json({ 
      success: true, 
      message: 'تم تحديث السياق بنجاح',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('خطأ في تحديث السياق:', error);
    res.status(500).json({ 
      error: 'فشل في تحديث السياق',
      details: error.message
    });
  }
});

/**
 * الحصول على حالة السياق الحالية للمستخدم
 * GET /api/context-aware/context-state
 */
router.get('/context-state', async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'معرف المستخدم مطلوب' });
    }

    const contextState = await contextAwareService.getUserContextState(userId);
    
    res.json({
      success: true,
      data: contextState,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('خطأ في جلب حالة السياق:', error);
    res.status(500).json({ 
      error: 'فشل في جلب حالة السياق',
      details: error.message
    });
  }
});

/**
 * إنشاء مشغل سياقي جديد
 * POST /api/context-aware/triggers
 */
router.post('/triggers', async (req: any, res) => {
  try {
    const validatedData = CreateTriggerSchema.parse(req.body);
    const createdBy = req.user?.id || req.user?.claims?.sub;

    const triggerData: ContextualTriggerInsert = {
      ...validatedData,
      userId: req.body.userId || createdBy,
      createdBy,
      isActive: true
    };

    const [newTrigger] = await db.insert(contextualTriggers)
      .values([triggerData])
      .returning();

    res.status(201).json({
      success: true,
      data: newTrigger,
      message: 'تم إنشاء المشغل السياقي بنجاح'
    });

  } catch (error: any) {
    console.error('خطأ في إنشاء المشغل السياقي:', error);
    res.status(500).json({ 
      error: 'فشل في إنشاء المشغل السياقي',
      details: error.message
    });
  }
});

/**
 * الحصول على قائمة المشغلات السياقية للمستخدم
 * GET /api/context-aware/triggers
 */
router.get('/triggers', async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    const targetUserId = req.query.userId || userId;
    
    // التحقق من صلاحية عرض مشغلات مستخدمين آخرين
    if (targetUserId !== userId) {
      // يتطلب صلاحية إدارية
      if (!req.user?.permissions?.includes('admin.rbac.view')) {
        return res.status(403).json({ error: 'غير مصرح بعرض مشغلات مستخدمين آخرين' });
      }
    }

    const triggers = await db.select()
      .from(contextualTriggers)
      .where(eq(contextualTriggers.userId, targetUserId))
      .orderBy(desc(contextualTriggers.createdAt));

    res.json({
      success: true,
      data: triggers,
      count: triggers.length
    });

  } catch (error: any) {
    console.error('خطأ في جلب المشغلات السياقية:', error);
    res.status(500).json({ 
      error: 'فشل في جلب المشغلات السياقية',
      details: error.message
    });
  }
});

/**
 * تحديث مشغل سياقي
 * PUT /api/context-aware/triggers/:triggerId
 */
router.put('/triggers/:triggerId', async (req: any, res) => {
  try {
    const { triggerId } = req.params;
    const validatedData = CreateTriggerSchema.partial().parse(req.body);

    const [updatedTrigger] = await db.update(contextualTriggers)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(contextualTriggers.id, triggerId))
      .returning();

    if (!updatedTrigger) {
      return res.status(404).json({ error: 'المشغل السياقي غير موجود' });
    }

    res.json({
      success: true,
      data: updatedTrigger,
      message: 'تم تحديث المشغل السياقي بنجاح'
    });

  } catch (error: any) {
    console.error('خطأ في تحديث المشغل السياقي:', error);
    res.status(500).json({ 
      error: 'فشل في تحديث المشغل السياقي',
      details: error.message
    });
  }
});

/**
 * حذف مشغل سياقي
 * DELETE /api/context-aware/triggers/:triggerId
 */
router.delete('/triggers/:triggerId', async (req: any, res) => {
  try {
    const { triggerId } = req.params;

    const [deletedTrigger] = await db.delete(contextualTriggers)
      .where(eq(contextualTriggers.id, triggerId))
      .returning();

    if (!deletedTrigger) {
      return res.status(404).json({ error: 'المشغل السياقي غير موجود' });
    }

    res.json({
      success: true,
      message: 'تم حذف المشغل السياقي بنجاح'
    });

  } catch (error: any) {
    console.error('خطأ في حذف المشغل السياقي:', error);
    res.status(500).json({ 
      error: 'فشل في حذف المشغل السياقي',
      details: error.message
    });
  }
});

/**
 * تفعيل/إلغاء تفعيل مشغل سياقي
 * PATCH /api/context-aware/triggers/:triggerId/toggle
 */
router.patch('/triggers/:triggerId/toggle', async (req: any, res) => {
  try {
    const { triggerId } = req.params;
    const { isActive } = req.body;

    const [updatedTrigger] = await db.update(contextualTriggers)
      .set({
        isActive: Boolean(isActive),
        updatedAt: new Date()
      })
      .where(eq(contextualTriggers.id, triggerId))
      .returning();

    if (!updatedTrigger) {
      return res.status(404).json({ error: 'المشغل السياقي غير موجود' });
    }

    res.json({
      success: true,
      data: updatedTrigger,
      message: `تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} المشغل السياقي بنجاح`
    });

  } catch (error: any) {
    console.error('خطأ في تغيير حالة المشغل السياقي:', error);
    res.status(500).json({ 
      error: 'فشل في تغيير حالة المشغل السياقي',
      details: error.message
    });
  }
});

/**
 * التحقق من صلاحية سياقية محددة
 * GET /api/context-aware/check-permission/:permission
 */
router.get('/check-permission/:permission', async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    const { permission } = req.params;

    const hasPermission = await contextAwareService.checkContextualPermission(userId, permission);

    res.json({
      success: true,
      data: {
        userId,
        permission,
        hasPermission,
        checkedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('خطأ في التحقق من الصلاحية السياقية:', error);
    res.status(500).json({ 
      error: 'فشل في التحقق من الصلاحية السياقية',
      details: error.message
    });
  }
});

/**
 * تفعيل وضع الطوارئ
 * POST /api/context-aware/emergency/activate
 */
router.post('/emergency/activate', async (req: any, res) => {
  try {
    const userId = req.body.userId || req.user?.id || req.user?.claims?.sub;
    const activatedBy = req.user?.id || req.user?.claims?.sub;
    
    const emergencyData = {
      level: req.body.level || 3,
      type: req.body.type || 'general',
      reason: req.body.reason || 'تفعيل طوارئ عام',
      activatedBy
    };

    await contextAwareService.activateEmergencyMode(userId, emergencyData);

    res.json({
      success: true,
      message: 'تم تفعيل وضع الطوارئ بنجاح',
      data: emergencyData
    });

  } catch (error: any) {
    console.error('خطأ في تفعيل وضع الطوارئ:', error);
    res.status(500).json({ 
      error: 'فشل في تفعيل وضع الطوارئ',
      details: error.message
    });
  }
});

/**
 * إلغاء وضع الطوارئ
 * POST /api/context-aware/emergency/deactivate
 */
router.post('/emergency/deactivate', async (req: any, res) => {
  try {
    const userId = req.body.userId || req.user?.id || req.user?.claims?.sub;
    const reason = req.body.reason || 'انتهاء حالة الطوارئ';

    await contextAwareService.deactivateEmergencyMode(userId, reason);

    res.json({
      success: true,
      message: 'تم إلغاء وضع الطوارئ بنجاح',
      data: { reason, deactivatedAt: new Date().toISOString() }
    });

  } catch (error: any) {
    console.error('خطأ في إلغاء وضع الطوارئ:', error);
    res.status(500).json({ 
      error: 'فشل في إلغاء وضع الطوارئ',
      details: error.message
    });
  }
});

/**
 * الحصول على سجل الأحداث السياقية
 * GET /api/context-aware/events
 */
router.get('/events', async (req: any, res) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    const targetUserId = req.query.userId || userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    // التحقق من صلاحية عرض أحداث مستخدمين آخرين
    if (targetUserId !== userId) {
      if (!req.user?.permissions?.includes('admin.rbac.view')) {
        return res.status(403).json({ error: 'غير مصرح بعرض أحداث مستخدمين آخرين' });
      }
    }

    const events = await db.select()
      .from(contextualEvents)
      .where(eq(contextualEvents.userId, targetUserId))
      .orderBy(desc(contextualEvents.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: events,
      count: events.length,
      pagination: {
        limit,
        offset,
        hasMore: events.length === limit
      }
    });

  } catch (error: any) {
    console.error('خطأ في جلب سجل الأحداث السياقية:', error);
    res.status(500).json({ 
      error: 'فشل في جلب سجل الأحداث السياقية',
      details: error.message
    });
  }
});

/**
 * تنظيف الصلاحيات المنتهية الصلاحية
 * POST /api/context-aware/cleanup-expired
 */
router.post('/cleanup-expired', async (req: any, res) => {
  try {
    await contextAwareService.cleanupExpiredPermissions();

    res.json({
      success: true,
      message: 'تم تنظيف الصلاحيات المنتهية الصلاحية بنجاح',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('خطأ في تنظيف الصلاحيات:', error);
    res.status(500).json({ 
      error: 'فشل في تنظيف الصلاحيات',
      details: error.message
    });
  }
});

export default router;