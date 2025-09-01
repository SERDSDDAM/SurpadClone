/**
 * خدمة الذكاء السياقي التلقائي - المرحلة 1
 * تدير تفعيل/إلغاء الصلاحيات تلقائياً حسب المشروع/الموقع/الوقت/حالة الطوارئ
 */

import { db } from '../db';
import { eq, and, or, gte, lte, isNull } from 'drizzle-orm';
import { 
  contextualTriggers, 
  userContextState, 
  contextualEvents,
  conditionalPermissions,
  type ContextualTrigger,
  type UserContextState,
  type ContextualEventInsert,
  type UserContextStateInsert,
  type ConditionalPermissionInsert
} from '../../shared/advanced-rbac-schema';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  district?: string;
  office?: string;
  building?: string;
}

export interface SessionData {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
}

export interface EmergencyActivation {
  level: number; // 1-5
  type: string;
  reason: string;
  activatedBy: string;
}

export class ContextAwareService {
  
  /**
   * تحديث السياق الحالي للمستخدم
   */
  async updateUserContext(userId: string, updates: {
    project?: string;
    location?: LocationData;
    session?: SessionData;
    emergency?: EmergencyActivation;
  }): Promise<void> {
    try {
      const now = new Date();
      
      // البحث عن السياق الحالي أو إنشاء واحد جديد
      const contextRows = await db.select()
        .from(userContextState)
        .where(eq(userContextState.userId, userId));
      
      const contextState = contextRows[0];

      const contextData: Partial<UserContextStateInsert> = {
        userId,
        updatedAt: now,
        lastContextCheck: now,
        contextVersion: (contextState?.contextVersion || 0) + 1,
      };

      if (updates.project) {
        contextData.currentProject = updates.project;
      }

      if (updates.location) {
        contextData.currentLocation = {
          ...updates.location,
          timestamp: now.toISOString()
        };
      }

      if (updates.session) {
        contextData.currentSession = {
          ...updates.session,
          startTime: now.toISOString()
        };
      }

      if (updates.emergency) {
        contextData.emergencyStatus = {
          isActive: true,
          level: updates.emergency.level,
          type: updates.emergency.type,
          activatedAt: now.toISOString(),
          activatedBy: updates.emergency.activatedBy,
          reason: updates.emergency.reason
        };
      }

      if (contextState) {
        // تحديث السياق الموجود
        await db.update(userContextState)
          .set(contextData)
          .where(eq(userContextState.userId, userId));
      } else {
        // إنشاء سياق جديد
        const insertData = {
          ...contextData,
          userId,
          activePermissions: [],
          contextualPermissions: [],
          sessionStats: {
            requestCount: 0,
            lastActivityAt: now.toISOString(),
            riskScore: 1,
            unusualActivity: false
          }
        };
        await db.insert(userContextState).values(insertData as UserContextStateInsert);
      }

      // تحليل وتنفيذ المشغلات المناسبة
      await this.evaluateAndExecuteTriggers(userId, updates);

    } catch (error: any) {
      console.error('خطأ في تحديث السياق للمستخدم:', error);
      throw error;
    }
  }

  /**
   * تقييم وتنفيذ المشغلات السياقية المناسبة
   */
  private async evaluateAndExecuteTriggers(userId: string, contextUpdates: any): Promise<void> {
    // البحث عن المشغلات النشطة للمستخدم
    const activeTriggers = await db.select()
      .from(contextualTriggers)
      .where(and(
        eq(contextualTriggers.userId, userId),
        eq(contextualTriggers.isActive, true)
      ));

    const currentTime = new Date();
    const userContext = await this.getUserContextState(userId);

    for (const trigger of activeTriggers) {
      try {
        const shouldActivate = await this.evaluateTriggerConditions(trigger, contextUpdates, userContext, currentTime);
        
        if (shouldActivate) {
          await this.executeTriggerActions(trigger, userId, contextUpdates);
          
          // تسجيل الحدث
          await this.logContextualEvent(userId, trigger.id, 'trigger_activated', {
            triggerName: trigger.name,
            triggerType: trigger.triggerType,
            contextUpdate: contextUpdates
          });

          // تحديث عدد مرات التفعيل
          await db.update(contextualTriggers)
            .set({
              lastTriggeredAt: currentTime,
              triggerCount: (trigger.triggerCount || 0) + 1
            })
            .where(eq(contextualTriggers.id, trigger.id));
        }
      } catch (error: any) {
        console.error(`خطأ في تقييم المشغل ${trigger.name}:`, error);
        
        await this.logContextualEvent(userId, trigger.id, 'trigger_error', {
          error: error.message,
          triggerName: trigger.name
        }, false, error.message);
      }
    }
  }

  /**
   * تقييم شروط المشغل السياقي
   */
  private async evaluateTriggerConditions(
    trigger: ContextualTrigger,
    contextUpdates: any,
    userContext: UserContextState | null,
    currentTime: Date
  ): Promise<boolean> {
    
    switch (trigger.triggerType) {
      case 'project':
        return this.evaluateProjectTrigger(trigger, contextUpdates);
      
      case 'location':
        return this.evaluateLocationTrigger(trigger, contextUpdates);
      
      case 'time':
        return this.evaluateTimeTrigger(trigger, currentTime);
      
      case 'emergency':
        return this.evaluateEmergencyTrigger(trigger, contextUpdates);
      
      case 'amount':
        return this.evaluateAmountTrigger(trigger, contextUpdates);
      
      default:
        return false;
    }
  }

  /**
   * تقييم مشغلات المشاريع
   */
  private evaluateProjectTrigger(trigger: ContextualTrigger, contextUpdates: any): boolean {
    if (!trigger.projectTriggers || !contextUpdates.project) {
      return false;
    }

    const projectTriggers = trigger.projectTriggers as any;
    const { projectIds, autoActivateOnOpen } = projectTriggers;
    const currentProject = contextUpdates.project;

    if (projectIds && Array.isArray(projectIds) && projectIds.includes(currentProject)) {
      return autoActivateOnOpen || false;
    }

    return false;
  }

  /**
   * تقييم مشغلات الموقع الجغرافي
   */
  private evaluateLocationTrigger(trigger: ContextualTrigger, contextUpdates: any): boolean {
    if (!trigger.locationTriggers || !contextUpdates.location) {
      return false;
    }

    const locationTriggers = trigger.locationTriggers as any;
    const { allowedBounds, allowedDistricts, radius, centerPoint } = locationTriggers;
    const location = contextUpdates.location;

    // التحقق من الحدود الجغرافية
    if (allowedBounds && Array.isArray(allowedBounds) && allowedBounds.length === 4) {
      const [minLat, minLng, maxLat, maxLng] = allowedBounds;
      if (location.latitude < minLat || location.latitude > maxLat ||
          location.longitude < minLng || location.longitude > maxLng) {
        return false;
      }
    }

    // التحقق من المناطق المسموحة
    if (allowedDistricts && Array.isArray(allowedDistricts) && location.district) {
      if (!allowedDistricts.includes(location.district)) {
        return false;
      }
    }

    // التحقق من المسافة من نقطة مركزية
    if (typeof radius === 'number' && centerPoint && Array.isArray(centerPoint) && centerPoint.length === 2) {
      const distance = this.calculateDistance(
        location.latitude, location.longitude,
        centerPoint[0], centerPoint[1]
      );
      if (distance > radius) {
        return false;
      }
    }

    return true;
  }

  /**
   * تقييم مشغلات الوقت
   */
  private evaluateTimeTrigger(trigger: ContextualTrigger, currentTime: Date): boolean {
    if (!trigger.timeTriggers) {
      return false;
    }

    const timeTriggers = trigger.timeTriggers as any;
    const { workingHours, allowedDays, emergencyOverride } = timeTriggers;
    
    // التحقق من أيام الأسبوع
    if (allowedDays && Array.isArray(allowedDays)) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[currentTime.getDay()];
      if (!allowedDays.includes(currentDay)) {
        return false;
      }
    }

    // التحقق من ساعات العمل
    if (workingHours && typeof workingHours.start === 'string' && typeof workingHours.end === 'string') {
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      const [endHour, endMinute] = workingHours.end.split(':').map(Number);
      
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      if (currentTimeInMinutes < startTimeInMinutes || currentTimeInMinutes > endTimeInMinutes) {
        return emergencyOverride || false;
      }
    }

    return true;
  }

  /**
   * تقييم مشغلات الطوارئ
   */
  private evaluateEmergencyTrigger(trigger: ContextualTrigger, contextUpdates: any): boolean {
    if (!trigger.emergencyTriggers || !contextUpdates.emergency) {
      return false;
    }

    const emergencyTriggers = trigger.emergencyTriggers as any;
    const { autoActivateOnLevel, emergencyTypes } = emergencyTriggers;
    const emergency = contextUpdates.emergency;

    if (typeof autoActivateOnLevel === 'number' && emergency.level >= autoActivateOnLevel) {
      return true;
    }

    if (emergencyTypes && Array.isArray(emergencyTypes) && emergencyTypes.includes(emergency.type)) {
      return true;
    }

    return false;
  }

  /**
   * تقييم مشغلات المبالغ المالية
   */
  private evaluateAmountTrigger(trigger: ContextualTrigger, contextUpdates: any): boolean {
    if (!trigger.amountTriggers || !contextUpdates.amount) {
      return false;
    }

    const amountTriggers = trigger.amountTriggers as any;
    const { maxAmount, requiresApprovalAbove } = amountTriggers;
    const amount = contextUpdates.amount;

    if (typeof maxAmount === 'number' && amount > maxAmount) {
      return false;
    }

    if (typeof requiresApprovalAbove === 'number' && amount > requiresApprovalAbove) {
      return true;
    }

    return false;
  }

  /**
   * تنفيذ الإجراءات المطلوبة عند تفعيل المشغل
   */
  private async executeTriggerActions(trigger: ContextualTrigger, userId: string, contextData: any): Promise<void> {
    if (!trigger.actions) return;

    const actions = trigger.actions as any;
    const {
      activatePermissions,
      deactivatePermissions,
      sendNotification,
      logActivity,
      temporaryDuration
    } = actions;

    const actionsPerformed: any = {};

    // تفعيل الصلاحيات
    if (activatePermissions && Array.isArray(activatePermissions) && activatePermissions.length > 0) {
      await this.activatePermissions(userId, activatePermissions, temporaryDuration);
      actionsPerformed.permissionsActivated = activatePermissions;
    }

    // إلغاء الصلاحيات
    if (deactivatePermissions && Array.isArray(deactivatePermissions) && deactivatePermissions.length > 0) {
      await this.deactivatePermissions(userId, deactivatePermissions);
      actionsPerformed.permissionsDeactivated = deactivatePermissions;
    }

    // إرسال الإشعارات
    if (sendNotification) {
      await this.sendContextualNotification(userId, trigger, contextData);
      actionsPerformed.notificationsSent = ['contextual_trigger'];
    }

    // تسجيل الأنشطة
    if (logActivity) {
      await this.logContextualEvent(userId, trigger.id, 'actions_executed', {
        triggerName: trigger.name,
        actionsPerformed,
        contextData
      });
    }
  }

  /**
   * تفعيل صلاحيات للمستخدم
   */
  private async activatePermissions(userId: string, permissions: string[], duration?: number): Promise<void> {
    const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : null;

    for (const permission of permissions) {
      // البحث عن صلاحية مشروطة موجودة
      const existingRows = await db.select()
        .from(conditionalPermissions)
        .where(and(
          eq(conditionalPermissions.userId, userId),
          eq(conditionalPermissions.permissionCode, permission)
        ));
      
      const existingPermission = existingRows[0];

      if (!existingPermission) {
        // إنشاء صلاحية مشروطة جديدة
        const newPermission: ConditionalPermissionInsert = {
          userId,
          permissionCode: permission,
          dataScope: 'personal',
          isActive: true,
          expiresAt,
          reason: 'تفعيل تلقائي بواسطة الذكاء السياقي',
          createdBy: 'system:context-aware'
        };
        await db.insert(conditionalPermissions).values(newPermission);
      } else if (!existingPermission.isActive) {
        // تفعيل الصلاحية الموجودة
        await db.update(conditionalPermissions)
          .set({
            isActive: true,
            expiresAt,
            updatedAt: new Date()
          })
          .where(eq(conditionalPermissions.id, existingPermission.id));
      }
    }

    // تحديث حالة السياق
    await this.updateContextualPermissions(userId, permissions, 'activate');
  }

  /**
   * إلغاء صلاحيات للمستخدم
   */
  private async deactivatePermissions(userId: string, permissions: string[]): Promise<void> {
    for (const permission of permissions) {
      await db.update(conditionalPermissions)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(conditionalPermissions.userId, userId),
          eq(conditionalPermissions.permissionCode, permission)
        ));
    }

    // تحديث حالة السياق
    await this.updateContextualPermissions(userId, permissions, 'deactivate');
  }

  /**
   * تحديث الصلاحيات السياقية في حالة المستخدم
   */
  private async updateContextualPermissions(userId: string, permissions: string[], action: 'activate' | 'deactivate'): Promise<void> {
    const contextState = await this.getUserContextState(userId);
    if (!contextState) return;

    let contextualPermissions = contextState.contextualPermissions || [];

    if (action === 'activate') {
      // إضافة الصلاحيات الجديدة
      contextualPermissions = [...new Set([...contextualPermissions, ...permissions])];
    } else {
      // إزالة الصلاحيات
      contextualPermissions = contextualPermissions.filter(p => !permissions.includes(p));
    }

    await db.update(userContextState)
      .set({
        contextualPermissions,
        updatedAt: new Date()
      })
      .where(eq(userContextState.userId, userId));
  }

  /**
   * إرسال إشعار سياقي للمستخدم
   */
  private async sendContextualNotification(userId: string, trigger: ContextualTrigger, contextData: any): Promise<void> {
    console.log(`🔔 إشعار سياقي للمستخدم ${userId}: تم تفعيل المشغل "${trigger.name}"`);
  }

  /**
   * تسجيل حدث سياقي
   */
  private async logContextualEvent(
    userId: string,
    triggerId: string | null,
    eventType: string,
    eventData: any,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const contextState = await this.getUserContextState(userId);
    
    const eventRecord: ContextualEventInsert = {
      userId,
      triggerId,
      eventType,
      eventData,
      contextSnapshot: {
        project: contextState?.currentProject,
        location: contextState?.currentLocation,
        timeOfDay: new Date().toTimeString().split(' ')[0],
        emergencyLevel: (contextState?.emergencyStatus as any)?.level
      },
      success,
      errorMessage,
      severity: success ? 'info' : 'error',
      category: 'automation'
    };

    await db.insert(contextualEvents).values(eventRecord);
  }

  /**
   * الحصول على حالة السياق الحالية للمستخدم
   */
  async getUserContextState(userId: string): Promise<UserContextState | null> {
    const contextRows = await db.select()
      .from(userContextState)
      .where(eq(userContextState.userId, userId));

    return contextRows[0] || null;
  }

  /**
   * التحقق من صلاحية المستخدم في السياق الحالي
   */
  async checkContextualPermission(userId: string, permission: string): Promise<boolean> {
    const contextState = await this.getUserContextState(userId);
    if (!contextState) return false;

    // التحقق من الصلاحيات السياقية النشطة
    const contextualPermissions = contextState.contextualPermissions || [];
    if (contextualPermissions.includes(permission)) {
      return true;
    }

    // التحقق من الصلاحيات المشروطة النشطة
    const activePermissions = await db.select()
      .from(conditionalPermissions)
      .where(and(
        eq(conditionalPermissions.userId, userId),
        eq(conditionalPermissions.permissionCode, permission),
        eq(conditionalPermissions.isActive, true),
        or(
          isNull(conditionalPermissions.expiresAt),
          gte(conditionalPermissions.expiresAt, new Date())
        )
      ));

    return activePermissions.length > 0;
  }

  /**
   * حساب المسافة بين نقطتين جغرافيتين (بالمتر)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * تنظيف الصلاحيات المنتهية الصلاحية
   */
  async cleanupExpiredPermissions(): Promise<void> {
    const now = new Date();
    
    await db.update(conditionalPermissions)
      .set({
        isActive: false,
        updatedAt: now
      })
      .where(and(
        eq(conditionalPermissions.isActive, true),
        lte(conditionalPermissions.expiresAt, now)
      ));

    console.log('🧹 تم تنظيف الصلاحيات المنتهية الصلاحية');
  }

  /**
   * تفعيل وضع الطوارئ للمستخدم
   */
  async activateEmergencyMode(userId: string, emergencyData: EmergencyActivation): Promise<void> {
    await this.updateUserContext(userId, { emergency: emergencyData });
    
    // تفعيل جميع المشغلات المناسبة للطوارئ
    const emergencyTriggers = await db.select()
      .from(contextualTriggers)
      .where(and(
        eq(contextualTriggers.userId, userId),
        eq(contextualTriggers.triggerType, 'emergency'),
        eq(contextualTriggers.isActive, true)
      ));

    for (const trigger of emergencyTriggers) {
      const emergencyTriggersData = trigger.emergencyTriggers as any;
      if (emergencyTriggersData?.overrideAllRestrictions) {
        await this.activatePermissions(userId, trigger.affectedPermissions || []);
      }
    }

    await this.logContextualEvent(userId, null, 'emergency_activated', emergencyData);
  }

  /**
   * إلغاء وضع الطوارئ
   */
  async deactivateEmergencyMode(userId: string, reason: string): Promise<void> {
    const contextState = await this.getUserContextState(userId);
    if (!contextState?.emergencyStatus) {
      return;
    }

    const emergencyStatus = contextState.emergencyStatus as any;
    if (!emergencyStatus.isActive) {
      return;
    }

    // تحديث حالة الطوارئ
    await db.update(userContextState)
      .set({
        emergencyStatus: {
          ...emergencyStatus,
          isActive: false
        },
        updatedAt: new Date()
      })
      .where(eq(userContextState.userId, userId));

    await this.logContextualEvent(userId, null, 'emergency_deactivated', { reason });
  }
}

export const contextAwareService = new ContextAwareService();