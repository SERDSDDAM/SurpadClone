import { Router } from 'express';
import { authenticateToken } from '../routes/working-auth';
import { smartDecisionEngine } from '../services/SmartDecisionEngine';
import { db } from '../db';
import { 
  automatedDecisions,
  automationRules,
  riskAssessments,
  workflowOptimizations,
  smartAssistantSessions,
  aiLearningData,
  type DecisionContext,
  type InsertAutomationRule,
  type InsertWorkflowOptimization,
  type InsertSmartAssistantSession
} from '@shared/schema';
import { eq, desc, and, gte, sql, count } from 'drizzle-orm';

const router = Router();

/**
 * اتخاذ قرار تلقائي ذكي
 */
router.post('/decisions/automated', authenticateToken, async (req: any, res) => {
  try {
    const { requestType, requestData, urgencyLevel, riskFactors } = req.body;
    
    if (!requestType || !requestData) {
      return res.status(400).json({ 
        error: 'معاملات مفقودة',
        details: 'requestType و requestData مطلوبان'
      });
    }

    const context: DecisionContext = {
      requestType,
      requestData,
      userContext: {
        userId: req.user?.sub || req.user?.id,
        role: req.user?.role,
        department: req.user?.department
      },
      urgencyLevel: urgencyLevel || 'medium',
      riskFactors: riskFactors || []
    };

    const decision = await smartDecisionEngine.makeAutomatedDecision(context);
    
    res.json({
      success: true,
      decision,
      timestamp: new Date().toISOString(),
      message: 'تم اتخاذ القرار بنجاح'
    });
  } catch (error) {
    console.error('خطأ في اتخاذ القرار التلقائي:', error);
    res.status(500).json({ 
      error: 'فشل في اتخاذ القرار التلقائي',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * تقييم المخاطر لطلب معين
 */
router.post('/risk-assessment', authenticateToken, async (req: any, res) => {
  try {
    const { requestType, requestData, urgencyLevel } = req.body;
    
    const context: DecisionContext = {
      requestType,
      requestData,
      userContext: { userId: req.user?.sub || req.user?.id },
      urgencyLevel: urgencyLevel || 'medium'
    };

    const riskAssessment = await smartDecisionEngine.assessRisk(context);
    
    res.json({
      success: true,
      riskAssessment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('خطأ في تقييم المخاطر:', error);
    res.status(500).json({ 
      error: 'فشل في تقييم المخاطر',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * الحصول على قوانين الأتمتة
 */
router.get('/automation-rules', authenticateToken, async (req: any, res) => {
  try {
    const { category, isActive = true, limit = 50 } = req.query;
    
    let query = db.select().from(automationRules);
    
    if (category) {
      query = query.where(eq(automationRules.ruleCategory, category as string));
    }
    
    if (isActive === 'true') {
      query = query.where(eq(automationRules.isActive, true));
    }
    
    const rules = await query
      .orderBy(desc(automationRules.priority), desc(automationRules.createdAt))
      .limit(parseInt(limit as string));
    
    res.json({
      success: true,
      data: rules,
      total: rules.length
    });
  } catch (error) {
    console.error('خطأ في جلب قوانين الأتمتة:', error);
    res.status(500).json({ 
      error: 'فشل في جلب قوانين الأتمتة'
    });
  }
});

/**
 * إنشاء قانون أتمتة جديد
 */
router.post('/automation-rules', authenticateToken, async (req: any, res) => {
  try {
    // التحقق من صلاحية الإدارة
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      return res.status(403).json({ 
        error: 'غير مصرح',
        message: 'يتطلب صلاحيات إدارية لإنشاء قوانين الأتمتة'
      });
    }

    const {
      ruleName,
      ruleCategory,
      conditions,
      actions,
      priority = 5,
      description,
      targetProcesses
    } = req.body;

    if (!ruleName || !ruleCategory || !conditions || !actions) {
      return res.status(400).json({ 
        error: 'معاملات مفقودة',
        details: 'ruleName, ruleCategory, conditions, actions مطلوبة'
      });
    }

    const newRule: InsertAutomationRule = {
      ruleName,
      ruleCategory,
      conditions,
      actions,
      priority,
      description,
      targetProcesses,
      createdBy: req.user?.sub || req.user?.id,
      isActive: true
    };

    const [rule] = await db.insert(automationRules).values(newRule).returning();
    
    res.status(201).json({
      success: true,
      data: rule,
      message: 'تم إنشاء قانون الأتمتة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إنشاء قانون الأتمتة:', error);
    res.status(500).json({ 
      error: 'فشل في إنشاء قانون الأتمتة'
    });
  }
});

/**
 * تحديث قانون أتمتة
 */
router.put('/automation-rules/:ruleId', authenticateToken, async (req: any, res) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      return res.status(403).json({ 
        error: 'غير مصرح',
        message: 'يتطلب صلاحيات إدارية'
      });
    }

    const { ruleId } = req.params;
    const updateData = req.body;
    
    // إزالة المعرف والتواريخ المحمية
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;
    
    updateData.updatedAt = new Date();

    const [updatedRule] = await db
      .update(automationRules)
      .set(updateData)
      .where(eq(automationRules.id, ruleId))
      .returning();

    if (!updatedRule) {
      return res.status(404).json({ 
        error: 'قانون الأتمتة غير موجود'
      });
    }

    res.json({
      success: true,
      data: updatedRule,
      message: 'تم تحديث قانون الأتمتة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تحديث قانون الأتمتة:', error);
    res.status(500).json({ 
      error: 'فشل في تحديث قانون الأتمتة'
    });
  }
});

/**
 * الحصول على القرارات المؤتمتة الأخيرة
 */
router.get('/decisions/recent', authenticateToken, async (req: any, res) => {
  try {
    const { limit = 20, decisionType, decisionResult } = req.query;
    
    let query = db.select().from(automatedDecisions);
    
    if (decisionType) {
      query = query.where(eq(automatedDecisions.decisionType, decisionType as string));
    }
    
    if (decisionResult) {
      query = query.where(eq(automatedDecisions.decisionResult, decisionResult as string));
    }
    
    const decisions = await query
      .orderBy(desc(automatedDecisions.createdAt))
      .limit(parseInt(limit as string));
    
    res.json({
      success: true,
      data: decisions,
      total: decisions.length
    });
  } catch (error) {
    console.error('خطأ في جلب القرارات الأخيرة:', error);
    res.status(500).json({ 
      error: 'فشل في جلب القرارات الأخيرة'
    });
  }
});

/**
 * إحصائيات الأداء للنظام الذكي
 */
router.get('/performance/stats', authenticateToken, async (req: any, res) => {
  try {
    const { days = 30 } = req.query;
    
    const metrics = await smartDecisionEngine.getPerformanceMetrics(parseInt(days as string));
    
    // إحصائيات إضافية من قاعدة البيانات
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string));
    
    // عدد القوانين النشطة
    const [activeRules] = await db
      .select({ count: count() })
      .from(automationRules)
      .where(eq(automationRules.isActive, true));
    
    // تقييمات المخاطر الأخيرة
    const [recentRiskAssessments] = await db
      .select({ count: count() })
      .from(riskAssessments)
      .where(gte(riskAssessments.createdAt, since));
    
    res.json({
      success: true,
      data: {
        ...metrics,
        activeAutomationRules: activeRules.count,
        recentRiskAssessments: recentRiskAssessments.count,
        period: `${days} أيام`
      }
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الأداء:', error);
    res.status(500).json({ 
      error: 'فشل في جلب إحصائيات الأداء'
    });
  }
});

/**
 * إنشاء تحسين سير عمل
 */
router.post('/workflow-optimization', authenticateToken, async (req: any, res) => {
  try {
    const {
      workflowId,
      workflowName,
      currentSteps,
      optimizedSteps,
      eliminatedSteps,
      estimatedTimeSaving
    } = req.body;

    if (!workflowId || !workflowName || !currentSteps || !optimizedSteps) {
      return res.status(400).json({ 
        error: 'معاملات مفقودة',
        details: 'workflowId, workflowName, currentSteps, optimizedSteps مطلوبة'
      });
    }

    const optimization: InsertWorkflowOptimization = {
      workflowId,
      workflowName,
      currentSteps,
      optimizedSteps,
      eliminatedSteps,
      estimatedTimeSaving,
      confidenceScore: 0.8, // يمكن حسابها بناءً على خوارزمية معقدة
      optimizationAlgorithm: 'smart_workflow_optimizer_v1'
    };

    const [result] = await db.insert(workflowOptimizations).values(optimization).returning();
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'تم إنشاء تحسين سير العمل بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إنشاء تحسين سير العمل:', error);
    res.status(500).json({ 
      error: 'فشل في إنشاء تحسين سير العمل'
    });
  }
});

/**
 * المساعد الذكي - الإجابة على الاستفسارات
 */
router.post('/smart-assistant/query', authenticateToken, async (req: any, res) => {
  try {
    const { query, context, sessionType = 'general_inquiry' } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'الاستفسار مطلوب'
      });
    }

    const startTime = Date.now();
    
    // محاكاة المساعد الذكي (يمكن استبدالها بـ AI فعلي)
    const response = await this.processSmartAssistantQuery(query, context);
    
    const responseTime = Date.now() - startTime;

    // حفظ الجلسة
    const session: InsertSmartAssistantSession = {
      userId: req.user?.sub || req.user?.id,
      sessionType,
      query,
      context,
      response,
      responseTime,
      assistantModel: 'smart_assistant_v1'
    };

    await db.insert(smartAssistantSessions).values(session);
    
    res.json({
      success: true,
      response,
      responseTime,
      message: 'تم معالجة الاستفسار بنجاح'
    });
  } catch (error) {
    console.error('خطأ في المساعد الذكي:', error);
    res.status(500).json({ 
      error: 'فشل في معالجة الاستفسار'
    });
  }
});

/**
 * الحصول على تحسينات سير العمل
 */
router.get('/workflow-optimizations', authenticateToken, async (req: any, res) => {
  try {
    const { workflowId, status, limit = 20 } = req.query;
    
    let query = db.select().from(workflowOptimizations);
    
    if (workflowId) {
      query = query.where(eq(workflowOptimizations.workflowId, workflowId as string));
    }
    
    if (status) {
      query = query.where(eq(workflowOptimizations.implementationStatus, status as string));
    }
    
    const optimizations = await query
      .orderBy(desc(workflowOptimizations.createdAt))
      .limit(parseInt(limit as string));
    
    res.json({
      success: true,
      data: optimizations,
      total: optimizations.length
    });
  } catch (error) {
    console.error('خطأ في جلب تحسينات سير العمل:', error);
    res.status(500).json({ 
      error: 'فشل في جلب تحسينات سير العمل'
    });
  }
});

/**
 * تطبيق تحسين سير عمل
 */
router.put('/workflow-optimizations/:optimizationId/implement', authenticateToken, async (req: any, res) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      return res.status(403).json({ 
        error: 'غير مصرح',
        message: 'يتطلب صلاحيات إدارية'
      });
    }

    const { optimizationId } = req.params;
    
    const [updated] = await db
      .update(workflowOptimizations)
      .set({
        implementationStatus: 'implemented',
        implementedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(workflowOptimizations.id, optimizationId))
      .returning();

    if (!updated) {
      return res.status(404).json({ 
        error: 'تحسين سير العمل غير موجود'
      });
    }

    res.json({
      success: true,
      data: updated,
      message: 'تم تطبيق تحسين سير العمل بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تطبيق تحسين سير العمل:', error);
    res.status(500).json({ 
      error: 'فشل في تطبيق تحسين سير العمل'
    });
  }
});

/**
 * لوحة تحكم الأتمتة الذكية
 */
router.get('/dashboard/:userId', authenticateToken, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // التحقق من صلاحية الوصول
    if (req.user?.role !== 'admin' && req.user?.sub !== userId && req.user?.id !== userId) {
      return res.status(403).json({ 
        error: 'غير مصرح',
        message: 'غير مصرح بالوصول لهذه البيانات'
      });
    }

    const since = new Date();
    since.setDate(since.getDate() - 7); // آخر أسبوع
    
    // القرارات الأخيرة للمستخدم
    const recentDecisions = await db
      .select()
      .from(automatedDecisions)
      .where(
        and(
          eq(automatedDecisions.userId, userId),
          gte(automatedDecisions.createdAt, since)
        )
      )
      .orderBy(desc(automatedDecisions.createdAt))
      .limit(10);
    
    // تقييمات المخاطر الأخيرة
    const recentRiskAssessments = await db
      .select()
      .from(riskAssessments)
      .where(gte(riskAssessments.createdAt, since))
      .orderBy(desc(riskAssessments.createdAt))
      .limit(5);
    
    // جلسات المساعد الذكي
    const assistantSessions = await db
      .select()
      .from(smartAssistantSessions)
      .where(
        and(
          eq(smartAssistantSessions.userId, userId),
          gte(smartAssistantSessions.createdAt, since)
        )
      )
      .orderBy(desc(smartAssistantSessions.createdAt))
      .limit(5);
    
    // إحصائيات عامة
    const performance = await smartDecisionEngine.getPerformanceMetrics(7);
    
    const dashboard = {
      userId,
      period: 'آخر 7 أيام',
      recentDecisions,
      recentRiskAssessments,
      assistantSessions,
      performance,
      summary: {
        totalDecisions: recentDecisions.length,
        approvedDecisions: recentDecisions.filter(d => d.decisionResult === 'approve').length,
        averageConfidence: recentDecisions.length > 0 ? 
          recentDecisions.reduce((sum, d) => sum + parseFloat(d.confidenceScore.toString()), 0) / recentDecisions.length : 0,
        assistantQueries: assistantSessions.length
      }
    };
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('خطأ في لوحة تحكم الأتمتة الذكية:', error);
    res.status(500).json({ 
      error: 'فشل في جلب لوحة تحكم الأتمتة الذكية'
    });
  }
});

// دالة معالجة استفسارات المساعد الذكي (محاكاة)
async function processSmartAssistantQuery(query: string, context: any) {
  // محاكاة بسيطة للمساعد الذكي
  // في التطبيق الحقيقي، يمكن استخدام ChatGPT أو أي AI آخر
  
  const lowerQuery = query.toLowerCase();
  let answer = '';
  let suggestions: string[] = [];
  let requiresEscalation = false;
  
  if (lowerQuery.includes('رخصة بناء') || lowerQuery.includes('building permit')) {
    answer = 'لإصدار رخصة بناء، تحتاج إلى تقديم المستندات التالية: مخطط الموقع، تصاميم البناء المعتمدة، شهادة ملكية الأرض، وموافقة الدفاع المدني. يتم مراجعة الطلب خلال 5-10 أيام عمل.';
    suggestions = [
      'ما هي رسوم رخصة البناء؟',
      'كيفية تتبع حالة الطلب؟',
      'ما هي مدة صلاحية الرخصة؟'
    ];
  } else if (lowerQuery.includes('مخالفة') || lowerQuery.includes('violation')) {
    answer = 'بخصوص المخالفات، يمكنك الاطلاع على تفاصيل المخالفة وسداد الغرامة من خلال النظام. في حالة الاعتراض، يمكن تقديم طلب إعادة نظر خلال 30 يوماً من تاريخ المخالفة.';
    suggestions = [
      'كيفية سداد الغرامة؟',
      'إجراءات الاعتراض على المخالفة',
      'مواعيد لجنة المخالفات'
    ];
  } else if (lowerQuery.includes('مساح') || lowerQuery.includes('survey')) {
    answer = 'خدمات المساحة تشمل مسح الأراضي، تحديد الحدود، وإعداد المخططات المساحية. يتم تعيين مساح مؤهل لكل طلب ويتم إنجاز العمل خلال 3-7 أيام حسب حجم الأرض.';
    suggestions = [
      'تكلفة خدمات المساحة',
      'مواعيد المساحين المتاحة',
      'مدة صلاحية التقرير المساحي'
    ];
  } else {
    answer = 'شكراً لاستفسارك. يمكنني مساعدتك في الاستفسارات المتعلقة بخدمات البناء والتراخيص. يرجى تحديد نوع الخدمة التي تحتاج معلومات عنها.';
    suggestions = [
      'رخص البناء',
      'خدمات المساحة',
      'شهادات الإشغال',
      'المخالفات والغرامات'
    ];
    requiresEscalation = true;
  }
  
  return {
    answer,
    suggestions,
    confidence: requiresEscalation ? 0.3 : 0.8,
    requiresEscalation,
    timestamp: new Date().toISOString()
  };
}

export default router;