import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  automatedDecisions,
  automationRules,
  riskAssessments,
  aiLearningData,
  type DecisionContext,
  type AutomatedDecisionResult,
  type RiskAssessmentResult,
  type InsertAutomatedDecision,
  type InsertRiskAssessment,
  type InsertAILearningData,
} from '@shared/schema';

/**
 * محرك القرارات الذكي - المرحلة الثالثة
 * Smart Decision Engine - Phase 3
 * 
 * يدير اتخاذ القرارات التلقائية الذكية بناءً على:
 * - السياق والبيانات التاريخية
 * - تقييم المخاطر
 * - قوانين الأتمتة المحددة
 * - التعلم من القرارات السابقة
 */
export class SmartDecisionEngine {
  
  /**
   * اتخاذ قرار تلقائي ذكي
   */
  async makeAutomatedDecision(context: DecisionContext): Promise<AutomatedDecisionResult> {
    const startTime = Date.now();
    
    try {
      // 1. تحليل السياق والمعطيات
      const contextAnalysis = await this.analyzeContext(context);
      
      // 2. تقييم المخاطر
      const riskAssessment = await this.assessRisk(context);
      
      // 3. البحث عن قوانين أتمتة مطابقة
      const applicableRules = await this.findApplicableRules(context);
      
      // 4. اتخاذ القرار بناءً على التحليل
      const decision = await this.generateDecision(
        contextAnalysis,
        riskAssessment,
        applicableRules,
        context
      );
      
      // 5. حفظ القرار في قاعدة البيانات
      const executionTime = Date.now() - startTime;
      await this.logDecision(context, decision, executionTime);
      
      // 6. تحديث بيانات التعلم الآلي
      await this.updateLearningData(context, decision);
      
      return decision;
      
    } catch (error) {
      console.error('خطأ في اتخاذ القرار التلقائي:', error);
      
      // في حالة الخطأ، إرجاع قرار محافظ يتطلب مراجعة بشرية
      return {
        decision: 'require_review',
        confidence: 0.1,
        reasoning: ['حدث خطأ تقني أثناء التحليل - يتطلب مراجعة بشرية'],
        riskAssessment: {
          level: 'high',
          factors: ['فشل النظام التلقائي'],
          mitigation: ['مراجعة يدوية فورية']
        }
      };
    }
  }

  /**
   * تقييم المخاطر التلقائي
   */
  async assessRisk(context: DecisionContext): Promise<RiskAssessmentResult> {
    const riskFactors: string[] = [];
    let riskScore = 0.0;
    
    // تحليل مستوى الإلحاح
    if (context.urgencyLevel === 'critical') {
      riskScore += 0.4;
      riskFactors.push('مستوى إلحاح حرج');
    } else if (context.urgencyLevel === 'high') {
      riskScore += 0.2;
      riskFactors.push('مستوى إلحاح عالي');
    }
    
    // تحليل نوع الطلب
    if (context.requestType === 'building_permit') {
      // فحص قيمة المشروع
      const projectValue = context.requestData?.estimatedCost || 0;
      if (projectValue > 1000000) { // مليون ريال
        riskScore += 0.3;
        riskFactors.push('قيمة مشروع عالية');
      }
      
      // فحص المنطقة
      const sensitiveAreas = ['العاصمة', 'المنطقة التاريخية', 'منطقة سياحية'];
      if (sensitiveAreas.some(area => 
        context.requestData?.location?.includes(area) ||
        context.requestData?.district?.includes(area)
      )) {
        riskScore += 0.2;
        riskFactors.push('منطقة حساسة');
      }
    }
    
    // فحص البيانات التاريخية
    if (context.historicalData) {
      const previousViolations = context.historicalData.violations || 0;
      if (previousViolations > 0) {
        riskScore += Math.min(previousViolations * 0.1, 0.3);
        riskFactors.push(`${previousViolations} مخالفة سابقة`);
      }
    }
    
    // تحديد مستوى المخاطر
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 0.8) riskLevel = 'critical';
    else if (riskScore >= 0.6) riskLevel = 'high';
    else if (riskScore >= 0.3) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // استراتيجيات التخفيف
    const mitigationStrategies = this.generateMitigationStrategies(riskLevel, riskFactors);
    
    // حفظ التقييم
    const riskAssessment: InsertRiskAssessment = {
      entityId: context.requestData?.id?.toString() || 'unknown',
      entityType: context.requestType,
      riskLevel,
      riskScore: parseFloat(riskScore.toFixed(2)),
      riskFactors: riskFactors,
      mitigationStrategies: mitigationStrategies,
      requiresHumanApproval: riskScore >= 0.6,
      assessmentAlgorithm: 'smart_decision_v1',
      confidenceLevel: 0.85,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // أسبوع
    };
    
    await db.insert(riskAssessments).values(riskAssessment);
    
    return {
      riskLevel,
      riskFactors,
      mitigationStrategies,
      requiresHumanApproval: riskScore >= 0.6,
      confidenceLevel: 0.85
    };
  }

  /**
   * تحليل السياق
   */
  private async analyzeContext(context: DecisionContext) {
    const analysis = {
      requestComplexity: this.calculateComplexity(context),
      dataCompleteness: this.assessDataCompleteness(context),
      urgencyScore: this.getUrgencyScore(context.urgencyLevel),
      historicalPattern: await this.analyzeHistoricalPattern(context)
    };
    
    return analysis;
  }

  /**
   * البحث عن قوانين الأتمتة المطابقة
   */
  private async findApplicableRules(context: DecisionContext) {
    try {
      const rules = await db
        .select()
        .from(automationRules)
        .where(
          and(
            eq(automationRules.isActive, true),
            eq(automationRules.ruleCategory, context.requestType)
          )
        )
        .orderBy(desc(automationRules.priority));
      
      return rules.filter(rule => {
        // فحص الشروط
        const conditions = rule.conditions as any;
        return this.evaluateConditions(conditions, context);
      });
    } catch (error) {
      console.error('خطأ في البحث عن قوانين الأتمتة:', error);
      return [];
    }
  }

  /**
   * توليد القرار النهائي
   */
  private async generateDecision(
    contextAnalysis: any,
    riskAssessment: RiskAssessmentResult,
    applicableRules: any[],
    context: DecisionContext
  ): Promise<AutomatedDecisionResult> {
    
    let decision: 'approve' | 'reject' | 'require_review' | 'escalate' = 'require_review';
    let confidence = 0.5;
    const reasoning: string[] = [];
    
    // القرار بناءً على مستوى المخاطر
    if (riskAssessment.riskLevel === 'critical') {
      decision = 'escalate';
      confidence = 0.9;
      reasoning.push('مستوى مخاطر حرج - يتطلب تصعيد فوري');
    } else if (riskAssessment.riskLevel === 'high') {
      decision = 'require_review';
      confidence = 0.8;
      reasoning.push('مستوى مخاطر عالي - يتطلب مراجعة بشرية');
    } else if (riskAssessment.riskLevel === 'low' && contextAnalysis.dataCompleteness > 0.8) {
      // القرار بناءً على القوانين
      if (applicableRules.length > 0) {
        const bestRule = applicableRules[0];
        const actions = bestRule.actions as any;
        
        if (actions.autoApprove && actions.autoApprove === true) {
          decision = 'approve';
          confidence = Math.min(0.9, (bestRule.successRate || 0.7) + 0.1);
          reasoning.push(`موافقة تلقائية بناءً على القانون: ${bestRule.ruleName}`);
        }
      }
    }
    
    // تعديل الثقة بناءً على تحليل السياق
    confidence = Math.min(0.95, confidence * contextAnalysis.dataCompleteness);
    
    if (contextAnalysis.requestComplexity > 0.7) {
      confidence *= 0.8;
      reasoning.push('طلب معقد - ثقة منخفضة');
    }
    
    return {
      decision,
      confidence: parseFloat(confidence.toFixed(2)),
      reasoning,
      alternativeOptions: this.generateAlternativeOptions(decision, context),
      recommendedActions: this.generateRecommendedActions(decision, riskAssessment),
      riskAssessment: {
        level: riskAssessment.riskLevel,
        factors: riskAssessment.riskFactors,
        mitigation: riskAssessment.mitigationStrategies
      }
    };
  }

  /**
   * حفظ القرار في قاعدة البيانات
   */
  private async logDecision(
    context: DecisionContext,
    decision: AutomatedDecisionResult,
    executionTime: number
  ) {
    const decisionLog: InsertAutomatedDecision = {
      requestId: context.requestData?.id?.toString() || `auto_${Date.now()}`,
      decisionType: context.requestType,
      decisionResult: decision.decision,
      confidenceScore: decision.confidence,
      reasoning: decision.reasoning,
      inputParameters: context,
      userId: context.userContext?.userId?.toString(),
      executionTimeMs: executionTime,
    };
    
    await db.insert(automatedDecisions).values(decisionLog);
  }

  /**
   * تحديث بيانات التعلم الآلي
   */
  private async updateLearningData(context: DecisionContext, decision: AutomatedDecisionResult) {
    const learningData: InsertAILearningData = {
      modelType: 'smart_decision_engine',
      inputData: {
        context: context,
        timestamp: new Date().toISOString()
      },
      expectedOutput: null, // سيتم تحديثه لاحقاً بناءً على النتائج الفعلية
      actualOutput: decision,
      dataSource: 'automated_decision',
      trainingPhase: 'production',
      learningSession: `session_${Date.now()}`
    };
    
    await db.insert(aiLearningData).values(learningData);
  }

  // دوال مساعدة
  private calculateComplexity(context: DecisionContext): number {
    let complexity = 0.1;
    
    if (context.requestData) {
      const dataFields = Object.keys(context.requestData).length;
      complexity += Math.min(dataFields / 20, 0.5);
    }
    
    if (context.riskFactors && context.riskFactors.length > 0) {
      complexity += Math.min(context.riskFactors.length / 10, 0.3);
    }
    
    return Math.min(complexity, 1.0);
  }

  private assessDataCompleteness(context: DecisionContext): number {
    const requiredFields = ['requestType', 'requestData', 'userContext'];
    const availableFields = requiredFields.filter(field => context[field as keyof DecisionContext]);
    
    let completeness = availableFields.length / requiredFields.length;
    
    if (context.requestData) {
      const dataKeys = Object.keys(context.requestData);
      const expectedKeys = ['id', 'type', 'applicantId'];
      const availableDataKeys = expectedKeys.filter(key => context.requestData[key]);
      completeness = (completeness + (availableDataKeys.length / expectedKeys.length)) / 2;
    }
    
    return completeness;
  }

  private getUrgencyScore(urgencyLevel?: string): number {
    const scores: Record<string, number> = {
      'low': 0.2,
      'medium': 0.5,
      'high': 0.8,
      'critical': 1.0
    };
    return scores[urgencyLevel || 'medium'] || 0.5;
  }

  private async analyzeHistoricalPattern(context: DecisionContext) {
    try {
      // تحليل القرارات السابقة للمستخدم
      const userId = context.userContext?.userId;
      if (!userId) return { similarity: 0, successRate: 0.5 };
      
      const recentDecisions = await db
        .select()
        .from(automatedDecisions)
        .where(eq(automatedDecisions.userId, userId))
        .orderBy(desc(automatedDecisions.createdAt))
        .limit(10);
      
      if (recentDecisions.length === 0) {
        return { similarity: 0, successRate: 0.5 };
      }
      
      const successCount = recentDecisions.filter(d => 
        d.finalOutcome === 'success' || 
        (d.decisionResult === 'approve' && !d.humanOverride)
      ).length;
      
      return {
        similarity: 0.7, // مبسط للآن
        successRate: successCount / recentDecisions.length
      };
    } catch (error) {
      console.error('خطأ في تحليل الأنماط التاريخية:', error);
      return { similarity: 0, successRate: 0.5 };
    }
  }

  private evaluateConditions(conditions: any, context: DecisionContext): boolean {
    if (!conditions || typeof conditions !== 'object') return false;
    
    try {
      // فحص شروط نوع الطلب
      if (conditions.requestType && conditions.requestType !== context.requestType) {
        return false;
      }
      
      // فحص شروط المبلغ
      if (conditions.maxAmount && context.requestData?.estimatedCost > conditions.maxAmount) {
        return false;
      }
      
      // فحص شروط المنطقة
      if (conditions.allowedRegions && 
          !conditions.allowedRegions.includes(context.requestData?.district)) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('خطأ في تقييم الشروط:', error);
      return false;
    }
  }

  private generateMitigationStrategies(riskLevel: string, riskFactors: string[]): string[] {
    const strategies: string[] = [];
    
    if (riskLevel === 'high' || riskLevel === 'critical') {
      strategies.push('مراجعة مدير القسم');
      strategies.push('تدقيق إضافي للوثائق');
    }
    
    if (riskFactors.includes('قيمة مشروع عالية')) {
      strategies.push('موافقة اللجنة المالية');
    }
    
    if (riskFactors.includes('منطقة حساسة')) {
      strategies.push('موافقة إدارة التخطيط العمراني');
    }
    
    return strategies;
  }

  private generateAlternativeOptions(decision: string, context: DecisionContext): string[] {
    const options: string[] = [];
    
    if (decision === 'require_review') {
      options.push('موافقة مشروطة');
      options.push('طلب وثائق إضافية');
    }
    
    if (decision === 'reject') {
      options.push('رفض مؤقت مع إمكانية إعادة التقديم');
      options.push('تحويل لنوع طلب آخر');
    }
    
    return options;
  }

  private generateRecommendedActions(decision: string, riskAssessment: RiskAssessmentResult): string[] {
    const actions: string[] = [];
    
    if (decision === 'approve') {
      actions.push('إصدار الرخصة فوراً');
      actions.push('إرسال إشعار للمواطن');
    }
    
    if (riskAssessment.requiresHumanApproval) {
      actions.push('تحديد موعد للمراجعة');
      actions.push('تجهيز ملف المراجعة');
    }
    
    return actions;
  }

  /**
   * الحصول على إحصائيات الأداء
   */
  async getPerformanceMetrics(days: number = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      
      const decisions = await db
        .select()
        .from(automatedDecisions)
        .where(sql`${automatedDecisions.createdAt} >= ${since}`);
      
      const totalDecisions = decisions.length;
      const successfulDecisions = decisions.filter(d => 
        d.finalOutcome === 'success' || 
        (d.decisionResult === 'approve' && !d.humanOverride)
      ).length;
      
      const averageConfidence = decisions.reduce((sum, d) => 
        sum + parseFloat(d.confidenceScore.toString()), 0) / totalDecisions;
      
      const averageExecutionTime = decisions.reduce((sum, d) => 
        sum + (d.executionTimeMs || 0), 0) / totalDecisions;
      
      return {
        totalDecisions,
        successRate: totalDecisions > 0 ? successfulDecisions / totalDecisions : 0,
        averageConfidence,
        averageExecutionTime,
        humanOverrideRate: decisions.filter(d => d.humanOverride).length / totalDecisions
      };
    } catch (error) {
      console.error('خطأ في حساب مؤشرات الأداء:', error);
      return {
        totalDecisions: 0,
        successRate: 0,
        averageConfidence: 0,
        averageExecutionTime: 0,
        humanOverrideRate: 0
      };
    }
  }
}

export const smartDecisionEngine = new SmartDecisionEngine();