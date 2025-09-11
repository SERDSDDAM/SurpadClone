import { db } from '../db';
import { eq, and, or, sql, gte, lte, inArray, isNull, isNotNull } from 'drizzle-orm';
import {
  conditionalPermissions,
  temporaryPermissions,
  roleHierarchy,
  contextualRoles,
  smartWorkflowTasks,
  smartDelegations,
  permissionMonitoring,
  smartAlerts,
  type ConditionalPermission,
  type TemporaryPermission,
  type RoleHierarchy,
  type ContextualRole,
  type SmartWorkflowTask,
  type SmartDelegation,
  type PermissionMonitoring,
  type SmartAlert,
} from '../../shared/advanced-rbac-schema';

interface UserContext {
  userId: string;
  currentTime: Date;
  location?: {
    district?: string;
    office?: string;
    building?: string;
    coordinates?: { lat: number; lng: number };
  };
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

interface PermissionCheckResult {
  granted: boolean;
  reason: string;
  conditions?: any;
  riskScore: number;
  usedPermission?: string;
  requiresApproval?: boolean;
  approvalFrom?: string[];
}

export class AdvancedRBACService {
  
  /**
   * فحص الصلاحيات المتقدم مع جميع الشروط والسياقات
   */
  async checkAdvancedPermission(
    userId: string,
    permissionCode: string,
    resource: string,
    action: string,
    context: UserContext,
    amount?: number
  ): Promise<PermissionCheckResult> {
    
    const startTime = Date.now();
    let riskScore = 1;
    const riskFactors: any = {};
    
    try {
      // 1. فحص الصلاحيات المشروطة
      const conditionalResult = await this.checkConditionalPermissions(
        userId, permissionCode, context, amount
      );
      
      if (!conditionalResult.granted) {
        await this.logPermissionAttempt(userId, action, resource, 'denied', context, {
          reason: conditionalResult.reason,
          duration: Date.now() - startTime,
          riskScore: conditionalResult.riskScore
        });
        return conditionalResult;
      }
      
      // 2. فحص الصلاحيات المؤقتة والطوارئ
      const temporaryResult = await this.checkTemporaryPermissions(
        userId, permissionCode, context
      );
      
      // 3. فحص الأدوار السياقية
      const contextualResult = await this.checkContextualRoles(
        userId, permissionCode, context
      );
      
      // 4. فحص التفويضات النشطة
      const delegationResult = await this.checkActiveDelegations(
        userId, permissionCode, context
      );
      
      // 5. حساب درجة المخاطر الإجمالية
      riskScore = await this.calculateRiskScore(userId, action, resource, context);
      
      // 6. تحديد الصلاحية المستخدمة والشروط
      const finalResult = this.consolidatePermissionResults([
        conditionalResult,
        temporaryResult,
        contextualResult,
        delegationResult
      ]);
      
      // 7. تسجيل محاولة الوصول
      await this.logPermissionAttempt(userId, action, resource, 
        finalResult.granted ? 'granted' : 'denied', context, {
        permissionUsed: finalResult.usedPermission,
        duration: Date.now() - startTime,
        riskScore,
        conditions: finalResult.conditions
      });
      
      // 8. إنشاء تنبيهات إذا لزم الأمر
      if (riskScore >= 7 || !finalResult.granted) {
        await this.generateSecurityAlert(userId, action, resource, finalResult, riskScore, context);
      }
      
      return {
        ...finalResult,
        riskScore
      };
      
    } catch (error) {
      console.error('Error in advanced permission check:', error);
      
      await this.logPermissionAttempt(userId, action, resource, 'denied', context, {
        reason: 'System error during permission check',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        riskScore: 10
      });
      
      return {
        granted: false,
        reason: 'نظام فحص الصلاحيات غير متاح حالياً',
        riskScore: 10
      };
    }
  }
  
  /**
   * فحص الصلاحيات المشروطة
   */
  private async checkConditionalPermissions(
    userId: string,
    permissionCode: string,
    context: UserContext,
    amount?: number
  ): Promise<PermissionCheckResult> {
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const conditionalPerms = await db
      .select()
      .from(conditionalPermissions)
      .where(
        and(
          eq(conditionalPermissions.userId, userId),
          eq(conditionalPermissions.permissionCode, permissionCode),
          eq(conditionalPermissions.isActive, true),
          or(
            isNull(conditionalPermissions.expiresAt),
            gte(conditionalPermissions.expiresAt, now)
          )
        )
      );
    
    if (conditionalPerms.length === 0) {
      return {
        granted: false,
        reason: 'لا توجد صلاحيات مشروطة صالحة لهذا الإجراء',
        riskScore: 5
      };
    }
    
    for (const perm of conditionalPerms) {
      // فحص شروط الوقت
      if (perm.timeStart && perm.timeEnd) {
        if (currentTime < perm.timeStart || currentTime > perm.timeEnd) {
          continue;
        }
      }
      
      // فحص أيام الأسبوع
      if (perm.validDays && perm.validDays.length > 0) {
        if (!perm.validDays.includes(currentDay)) {
          continue;
        }
      }
      
      // فحص المكان
      if (perm.allowedDistricts && perm.allowedDistricts.length > 0) {
        if (!context.location?.district || 
            !perm.allowedDistricts.includes(context.location.district)) {
          continue;
        }
      }
      
      if (perm.allowedOffices && perm.allowedOffices.length > 0) {
        if (!context.location?.office || 
            !perm.allowedOffices.includes(context.location.office)) {
          continue;
        }
      }
      
      // فحص الحدود المالية
      if (amount && perm.maxAmount) {
        if (amount > parseFloat(perm.maxAmount)) {
          continue;
        }
      }
      
      // فحص عدد المعاملات اليومية
      if (perm.maxTransactionsPerDay) {
        const todayCount = await this.getUserDailyTransactionCount(userId, permissionCode);
        if (todayCount >= perm.maxTransactionsPerDay) {
          continue;
        }
      }
      
      // تحديث عداد الاستخدام
      await db
        .update(conditionalPermissions)
        .set({
          usageCount: sql`${conditionalPermissions.usageCount} + 1`,
          lastUsedAt: now
        })
        .where(eq(conditionalPermissions.id, perm.id));
      
      return {
        granted: true,
        reason: 'تم منح الصلاحية وفقاً للشروط المحددة',
        riskScore: perm.riskScore || 1,
        usedPermission: `conditional:${perm.id}`,
        requiresApproval: perm.requiresApprovalFrom && perm.requiresApprovalFrom.length > 0,
        approvalFrom: perm.requiresApprovalFrom || [],
        conditions: {
          maxAmount: perm.maxAmount,
          timeRestriction: perm.timeStart && perm.timeEnd,
          locationRestriction: perm.allowedDistricts || perm.allowedOffices,
          dataScope: perm.dataScope
        }
      };
    }
    
    return {
      granted: false,
      reason: 'لا تتوفر الشروط المطلوبة لاستخدام هذه الصلاحية',
      riskScore: 6
    };
  }
  
  /**
   * فحص الصلاحيات المؤقتة
   */
  private async checkTemporaryPermissions(
    userId: string,
    permissionCode: string,
    context: UserContext
  ): Promise<PermissionCheckResult> {
    
    const now = new Date();
    
    const tempPerms = await db
      .select()
      .from(temporaryPermissions)
      .where(
        and(
          eq(temporaryPermissions.userId, userId),
          eq(temporaryPermissions.permissionCode, permissionCode),
          eq(temporaryPermissions.isActive, true),
          eq(temporaryPermissions.isRevoked, false),
          lte(temporaryPermissions.validFrom, now),
          gte(temporaryPermissions.validUntil, now)
        )
      );
    
    if (tempPerms.length === 0) {
      return {
        granted: false,
        reason: 'لا توجد صلاحيات مؤقتة صالحة',
        riskScore: 3
      };
    }
    
    for (const perm of tempPerms) {
      // فحص حد الاستخدام
      if (perm.maxUsage && perm.currentUsage >= perm.maxUsage) {
        continue;
      }
      
      // تحديث عداد الاستخدام
      await db
        .update(temporaryPermissions)
        .set({
          currentUsage: sql`${temporaryPermissions.currentUsage} + 1`,
          lastUsedAt: now,
          usageLog: sql`${temporaryPermissions.usageLog} || ${JSON.stringify([{
            timestamp: now.toISOString(),
            context: context,
            ipAddress: context.ipAddress
          }])}`
        })
        .where(eq(temporaryPermissions.id, perm.id));
      
      // إرسال تنبيه إذا كان مطلوباً
      if (perm.alertOnUsage && perm.alertRecipients) {
        await this.generateUsageAlert(perm, context);
      }
      
      return {
        granted: true,
        reason: perm.isEmergency ? 'صلاحية طوارئ مؤقتة' : 'صلاحية مؤقتة صالحة',
        riskScore: perm.isEmergency ? (perm.emergencyLevel || 5) : 2,
        usedPermission: `temporary:${perm.id}`,
        conditions: {
          temporary: true,
          emergency: perm.isEmergency,
          validUntil: perm.validUntil,
          remainingUsage: perm.maxUsage ? perm.maxUsage - perm.currentUsage : undefined
        }
      };
    }
    
    return {
      granted: false,
      reason: 'تم استنفاد الصلاحيات المؤقتة المتاحة',
      riskScore: 4
    };
  }
  
  /**
   * فحص الأدوار السياقية
   */
  private async checkContextualRoles(
    userId: string,
    permissionCode: string,
    context: UserContext
  ): Promise<PermissionCheckResult> {
    
    const now = new Date();
    
    const contextualRolesList = await db
      .select()
      .from(contextualRoles)
      .where(
        and(
          eq(contextualRoles.userId, userId),
          eq(contextualRoles.isActive, true),
          or(
            isNull(contextualRoles.validUntil),
            gte(contextualRoles.validUntil, now)
          )
        )
      );
    
    for (const role of contextualRolesList) {
      // فحص السياق
      const contextMatches = await this.checkContextMatch(role, context);
      
      if (contextMatches) {
        // تفعيل الدور السياقي إذا لم يكن مفعلاً
        if (!role.isCurrentlyActive) {
          await db
            .update(contextualRoles)
            .set({
              isCurrentlyActive: true,
              lastActivatedAt: now,
              activationCount: sql`${contextualRoles.activationCount} + 1`
            })
            .where(eq(contextualRoles.id, role.id));
        }
        
        // فحص الصلاحية في الدور الإضافي
        const hasPermission = await this.checkRolePermission(role.additionalRoleId, permissionCode);
        
        if (hasPermission) {
          return {
            granted: true,
            reason: `صلاحية من الدور السياقي: ${role.additionalRoleId}`,
            riskScore: 2,
            usedPermission: `contextual:${role.id}`,
            conditions: {
              contextual: true,
              contextType: role.contextType,
              contextValue: role.contextValue,
              priority: role.rolePriority
            }
          };
        }
      }
    }
    
    return {
      granted: false,
      reason: 'لا يوجد دور سياقي مناسب لهذا الإجراء',
      riskScore: 3
    };
  }
  
  /**
   * فحص التفويضات النشطة
   */
  private async checkActiveDelegations(
    userId: string,
    permissionCode: string,
    context: UserContext
  ): Promise<PermissionCheckResult> {
    
    const now = new Date();
    
    const activeDelegations = await db
      .select()
      .from(smartDelegations)
      .where(
        and(
          eq(smartDelegations.toUserId, userId),
          eq(smartDelegations.isActive, true),
          eq(smartDelegations.isCurrentlyEffective, true),
          or(
            isNull(smartDelegations.validUntil),
            gte(smartDelegations.validUntil, now)
          )
        )
      );
    
    for (const delegation of activeDelegations) {
      if (delegation.delegatedPermissions.includes(permissionCode)) {
        // فحص الشروط الإضافية
        const conditionsOk = await this.checkDelegationConditions(delegation, context);
        
        if (conditionsOk) {
          // تحديث سجل الاستخدام
          await db
            .update(smartDelegations)
            .set({
              usageCount: sql`${smartDelegations.usageCount} + 1`,
              lastUsedAt: now,
              usageLog: sql`${smartDelegations.usageLog} || ${JSON.stringify([{
                timestamp: now.toISOString(),
                permission: permissionCode,
                context: context
              }])}`
            })
            .where(eq(smartDelegations.id, delegation.id));
          
          return {
            granted: true,
            reason: `صلاحية مفوضة من: ${delegation.fromUserId}`,
            riskScore: 3,
            usedPermission: `delegation:${delegation.id}`,
            requiresApproval: delegation.conditions?.requiresApproval,
            conditions: {
              delegated: true,
              fromUser: delegation.fromUserId,
              delegationType: delegation.delegationType,
              conditions: delegation.conditions
            }
          };
        }
      }
    }
    
    return {
      granted: false,
      reason: 'لا توجد تفويضات صالحة لهذه الصلاحية',
      riskScore: 4
    };
  }
  
  /**
   * حساب درجة المخاطر
   */
  private async calculateRiskScore(
    userId: string,
    action: string,
    resource: string,
    context: UserContext
  ): Promise<number> {
    
    let riskScore = 1;
    
    // فحص الوقت غير المعتاد
    const hour = context.currentTime.getHours();
    if (hour < 7 || hour > 18) {
      riskScore += 2;
    }
    
    // فحص المكان غير المعتاد
    const usualLocations = await this.getUserUsualLocations(userId);
    if (context.location && !this.isUsualLocation(context.location, usualLocations)) {
      riskScore += 3;
    }
    
    // فحص الأنشطة المشبوهة الحديثة
    const recentSuspiciousActivity = await this.getRecentSuspiciousActivity(userId);
    if (recentSuspiciousActivity > 0) {
      riskScore += recentSuspiciousActivity;
    }
    
    // فحص محاولات الوصول المتعددة
    const recentAttempts = await this.getRecentAccessAttempts(userId, action, resource);
    if (recentAttempts > 5) {
      riskScore += 3;
    }
    
    // فحص الصلاحيات العالية
    const isElevatedPermission = await this.isElevatedPermission(action);
    if (isElevatedPermission) {
      riskScore += 2;
    }
    
    return Math.min(riskScore, 10);
  }
  
  /**
   * دمج نتائج فحص الصلاحيات المختلفة
   */
  private consolidatePermissionResults(results: PermissionCheckResult[]): PermissionCheckResult {
    const grantedResults = results.filter(r => r.granted);
    
    if (grantedResults.length === 0) {
      return {
        granted: false,
        reason: 'لا توجد صلاحيات صالحة لهذا الإجراء',
        riskScore: Math.max(...results.map(r => r.riskScore))
      };
    }
    
    // اختيار أفضل نتيجة (أقل مخاطر)
    const bestResult = grantedResults.sort((a, b) => a.riskScore - b.riskScore)[0];
    
    return bestResult;
  }
  
  /**
   * تسجيل محاولة الوصول
   */
  private async logPermissionAttempt(
    userId: string,
    action: string,
    resource: string,
    result: 'granted' | 'denied' | 'escalated',
    context: UserContext,
    details: any
  ): Promise<void> {
    
    await db.insert(permissionMonitoring).values({
      userId,
      action,
      resource,
      result,
      permissionUsed: details.permissionUsed,
      timestamp: context.currentTime,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      location: context.location,
      riskScore: details.riskScore,
      duration: details.duration,
      requestData: details.conditions,
      riskFactors: details.riskFactors || {}
    });
  }
  
  /**
   * إنشاء تنبيه أمني
   */
  private async generateSecurityAlert(
    userId: string,
    action: string,
    resource: string,
    result: PermissionCheckResult,
    riskScore: number,
    context: UserContext
  ): Promise<void> {
    
    if (riskScore < 7 && result.granted) return;
    
    const severity = riskScore >= 9 ? 'critical' : riskScore >= 7 ? 'warning' : 'info';
    const type = result.granted ? 'security' : 'compliance';
    
    const title = result.granted 
      ? `نشاط عالي المخاطر: ${action}`
      : `محاولة وصول مرفوضة: ${action}`;
    
    const message = `المستخدم ${userId} حاول ${action} على ${resource}. درجة المخاطر: ${riskScore}`;
    
    await db.insert(smartAlerts).values({
      type,
      severity,
      title,
      message,
      triggeredBy: {
        userId,
        action,
        condition: `رقم المخاطر: ${riskScore}`
      },
      recipients: await this.getSecurityTeamRecipients(),
      relatedData: {
        context,
        result,
        riskScore
      },
      autoActions: riskScore >= 9 ? {
        notifyManager: true,
        escalateToAdmin: true,
        requireReauth: !result.granted
      } : undefined
    });
  }
  
  /**
   * إنشاء تنبيه استخدام الصلاحية المؤقتة
   */
  private async generateUsageAlert(
    permission: TemporaryPermission,
    context: UserContext
  ): Promise<void> {
    
    await db.insert(smartAlerts).values({
      type: 'workflow',
      severity: permission.isEmergency ? 'warning' : 'info',
      title: 'استخدام صلاحية مؤقتة',
      message: `تم استخدام الصلاحية المؤقتة ${permission.permissionCode} من قبل ${permission.userId}`,
      triggeredBy: {
        userId: permission.userId,
        condition: 'استخدام صلاحية مؤقتة'
      },
      recipients: permission.alertRecipients || [],
      relatedData: {
        permission,
        context
      }
    });
  }
  
  // دوال مساعدة
  private async getUserDailyTransactionCount(userId: string, permissionCode: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(permissionMonitoring)
      .where(
        and(
          eq(permissionMonitoring.userId, userId),
          eq(permissionMonitoring.action, permissionCode),
          eq(permissionMonitoring.result, 'granted'),
          gte(permissionMonitoring.timestamp, today)
        )
      );
    
    return parseInt(result[0]?.count as string) || 0;
  }
  
  private async checkContextMatch(role: ContextualRole, context: UserContext): Promise<boolean> {
    switch (role.contextType) {
      case 'location':
        return context.location?.district === role.contextValue ||
               context.location?.office === role.contextValue;
      case 'time':
        const currentHour = context.currentTime.getHours();
        const timeRange = role.contextValue.split('-');
        return currentHour >= parseInt(timeRange[0]) && currentHour <= parseInt(timeRange[1]);
      case 'project':
        // يحتاج فحص السياق من النظام
        return await this.checkProjectContext(role.contextValue, context);
      default:
        return false;
    }
  }
  
  private async checkRolePermission(roleId: string, permissionCode: string): Promise<boolean> {
    // فحص الصلاحيات في الأدوار الأساسية
    // سيتم تطوير هذا مع نظام الأدوار الموجود
    return true; // مؤقت
  }
  
  private async checkDelegationConditions(delegation: SmartDelegation, context: UserContext): Promise<boolean> {
    if (!delegation.conditions) return true;
    
    const conditions = delegation.conditions;
    
    // فحص ساعات العمل
    if (conditions.workingHours) {
      const currentTime = context.currentTime.toTimeString().slice(0, 5);
      if (currentTime < conditions.workingHours.start || currentTime > conditions.workingHours.end) {
        return false;
      }
    }
    
    // فحص أيام العمل
    if (conditions.workingDays) {
      const currentDay = context.currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (!conditions.workingDays.includes(currentDay)) {
        return false;
      }
    }
    
    return true;
  }
  
  private async getUserUsualLocations(userId: string): Promise<any[]> {
    // تحليل المواقع المعتادة للمستخدم
    return [];
  }
  
  private isUsualLocation(current: any, usual: any[]): boolean {
    // مقارنة الموقع الحالي مع المواقع المعتادة
    return true; // مؤقت
  }
  
  private async getRecentSuspiciousActivity(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(permissionMonitoring)
      .where(
        and(
          eq(permissionMonitoring.userId, userId),
          gte(permissionMonitoring.riskScore, 7),
          gte(permissionMonitoring.timestamp, sql`now() - interval '24 hours'`)
        )
      );
    
    return parseInt(result[0]?.count as string) || 0;
  }
  
  private async getRecentAccessAttempts(userId: string, action: string, resource: string): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(permissionMonitoring)
      .where(
        and(
          eq(permissionMonitoring.userId, userId),
          eq(permissionMonitoring.action, action),
          eq(permissionMonitoring.resource, resource),
          gte(permissionMonitoring.timestamp, sql`now() - interval '1 hour'`)
        )
      );
    
    return parseInt(result[0]?.count as string) || 0;
  }
  
  private async isElevatedPermission(action: string): Promise<boolean> {
    const elevatedActions = [
      'admin', 'delete', 'approve_high_value', 'system_config', 'user_management'
    ];
    return elevatedActions.some(elevated => action.includes(elevated));
  }
  
  private async checkProjectContext(projectId: string, context: UserContext): Promise<boolean> {
    // فحص سياق المشروع
    return true; // مؤقت
  }
  
  private async getSecurityTeamRecipients(): Promise<string[]> {
    // جلب قائمة فريق الأمان
    return ['security_admin', 'system_admin'];
  }
}