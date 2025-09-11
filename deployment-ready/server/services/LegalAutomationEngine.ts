import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { 
  buildingPermits, 
  automationRules, 
  automatedDecisions,
  serviceRequirements,
  requirements 
} from '../../shared/schema';

export interface ServiceRequest {
  serviceId: string;
  requestData: Record<string, any>;
  userId?: string;
  location?: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'emergency';
}

export interface RequirementEvaluation {
  requirementId: string;
  requirementName: string;
  passed: boolean;
  message: string;
  value?: any;
  expectedValue?: any;
}

export interface AutomationResult {
  approved: boolean;
  decision: 'approve' | 'reject' | 'require_review' | 'escalate';
  confidence: number;
  evaluations: RequirementEvaluation[];
  recommendedActions: string[];
  reasoning: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedProcessingTime?: number;
  requiredDocuments?: string[];
}

export interface LegalRule {
  id: string;
  ruleName: string;
  serviceTypes: string[];
  conditions: Record<string, any>;
  action: Record<string, any>;
  priority: number;
  isActive: boolean;
}

export class LegalAutomationEngine {
  constructor() {}

  /**
   * تقييم طلب خدمة وإصدار قرار تلقائي
   */
  async evaluateServiceRequest(request: ServiceRequest): Promise<AutomationResult> {
    try {
      console.log(`🏛️ بدء تقييم طلب الخدمة: ${request.serviceId}`);
      
      // 1. جلب القوانين النشطة المطبقة على هذه الخدمة
      const applicableRules = await this.getApplicableRules(request);
      console.log(`📋 عدد القوانين المطبقة: ${applicableRules.length}`);

      // 2. تقييم كل قانون
      const evaluations: RequirementEvaluation[] = [];
      let overallDecision: 'approve' | 'reject' | 'require_review' | 'escalate' = 'approve';
      const reasoning: string[] = [];
      const recommendedActions: string[] = [];
      let confidence = 1.0;
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

      // 3. تطبيق القوانين حسب الأولوية
      for (const rule of applicableRules.sort((a, b) => b.priority - a.priority)) {
        const ruleResult = await this.evaluateRule(rule, request);
        evaluations.push(...ruleResult.evaluations);
        
        // تحديث القرار بناءً على أولوية القانون
        if (ruleResult.decision !== 'approve') {
          overallDecision = ruleResult.decision;
          confidence = Math.min(confidence, ruleResult.confidence);
          reasoning.push(...ruleResult.reasoning);
          recommendedActions.push(...ruleResult.recommendedActions);
          
          if (ruleResult.riskLevel === 'critical' || ruleResult.riskLevel === 'high') {
            riskLevel = ruleResult.riskLevel;
          }
        }
      }

      // 4. تقييم المخاطر الإضافية
      const riskAssessment = await this.assessRisks(request);
      if (riskAssessment.level === 'high' || riskAssessment.level === 'critical') {
        riskLevel = riskAssessment.level;
        if (overallDecision === 'approve') {
          overallDecision = 'require_review';
          reasoning.push('تم تحويل للمراجعة بسبب تقييم المخاطر العالي');
        }
      }

      // 5. حساب وقت المعالجة المتوقع
      const estimatedTime = this.calculateProcessingTime(overallDecision, evaluations.length);

      // 6. تحديد المستندات المطلوبة
      const requiredDocuments = await this.getRequiredDocuments(request, overallDecision);

      const result: AutomationResult = {
        approved: overallDecision === 'approve',
        decision: overallDecision,
        confidence,
        evaluations,
        recommendedActions: [...new Set(recommendedActions)], // إزالة التكرار
        reasoning: [...new Set(reasoning)],
        riskLevel,
        estimatedProcessingTime: estimatedTime,
        requiredDocuments
      };

      // 7. حفظ القرار في قاعدة البيانات
      await this.saveAutomatedDecision(request, result);

      console.log(`✅ تم تقييم الطلب: ${result.decision} بثقة ${(result.confidence * 100).toFixed(1)}%`);
      return result;

    } catch (error) {
      console.error('❌ خطأ في تقييم الطلب:', error);
      throw new Error(`فشل في تقييم طلب الخدمة: ${error.message}`);
    }
  }

  /**
   * جلب القوانين المطبقة على طلب معين
   */
  private async getApplicableRules(request: ServiceRequest): Promise<LegalRule[]> {
    const rules = await db.select()
      .from(automationRules)
      .where(and(
        eq(automationRules.isActive, true),
        eq(automationRules.ruleCategory, request.serviceId)
      ));

    return rules.map(rule => ({
      id: rule.id,
      ruleName: rule.ruleName,
      serviceTypes: rule.targetProcesses || [request.serviceId],
      conditions: rule.conditions as Record<string, any>,
      action: rule.actions as Record<string, any>,
      priority: rule.priority,
      isActive: rule.isActive
    }));
  }

  /**
   * تقييم قانون واحد
   */
  private async evaluateRule(rule: LegalRule, request: ServiceRequest): Promise<AutomationResult> {
    const evaluations: RequirementEvaluation[] = [];
    const reasoning: string[] = [];
    const recommendedActions: string[] = [];
    let confidence = 0.9;
    let decision: 'approve' | 'reject' | 'require_review' | 'escalate' = 'approve';

    // تقييم الشروط
    for (const [field, condition] of Object.entries(rule.conditions)) {
      const evaluation = this.evaluateCondition(
        field,
        condition,
        request.requestData[field],
        rule.ruleName
      );
      
      evaluations.push(evaluation);
      
      if (!evaluation.passed) {
        decision = this.getDecisionFromAction(rule.action);
        confidence *= 0.8;
        reasoning.push(`فشل في شرط: ${evaluation.message}`);
        
        if (rule.action.recommendAction) {
          recommendedActions.push(rule.action.recommendAction);
        }
      }
    }

    // تقييم خاص للمباني السكنية
    if (request.serviceId === 'building_permit' && request.requestData.buildingType === 'residential') {
      const residentialEval = this.evaluateResidentialBuilding(request.requestData);
      evaluations.push(...residentialEval.evaluations);
      if (!residentialEval.passed) {
        decision = 'require_review';
        reasoning.push(...residentialEval.reasons);
      }
    }

    // تقييم خاص للمباني التجارية
    if (request.serviceId === 'building_permit' && request.requestData.buildingType === 'commercial') {
      const commercialEval = this.evaluateCommercialBuilding(request.requestData);
      evaluations.push(...commercialEval.evaluations);
      if (!commercialEval.passed) {
        decision = 'escalate';
        reasoning.push(...commercialEval.reasons);
      }
    }

    return {
      approved: decision === 'approve',
      decision,
      confidence,
      evaluations,
      recommendedActions,
      reasoning,
      riskLevel: this.calculateRiskLevel(evaluations)
    };
  }

  /**
   * تقييم شرط واحد
   */
  private evaluateCondition(
    field: string,
    condition: any,
    actualValue: any,
    ruleName: string
  ): RequirementEvaluation {
    const evaluation: RequirementEvaluation = {
      requirementId: `${ruleName}_${field}`,
      requirementName: this.getFieldDisplayName(field),
      passed: false,
      message: '',
      value: actualValue,
      expectedValue: condition
    };

    if (actualValue === undefined || actualValue === null) {
      evaluation.message = `${evaluation.requirementName} غير محدد`;
      return evaluation;
    }

    // تقييم حسب نوع الشرط
    if (typeof condition === 'object') {
      if (condition.operator && condition.value !== undefined) {
        evaluation.passed = this.evaluateOperator(condition.operator, actualValue, condition.value);
        evaluation.expectedValue = `${condition.operator} ${condition.value}`;
        evaluation.message = evaluation.passed 
          ? `${evaluation.requirementName}: ${actualValue} ✓`
          : `${evaluation.requirementName}: ${actualValue} لا يحقق الشرط ${condition.operator} ${condition.value}`;
      } else if (condition.in) {
        evaluation.passed = condition.in.includes(actualValue);
        evaluation.message = evaluation.passed 
          ? `${evaluation.requirementName}: ${actualValue} ✓`
          : `${evaluation.requirementName}: ${actualValue} غير مسموح (المسموح: ${condition.in.join(', ')})`;
      }
    } else {
      // مقارنة مباشرة
      evaluation.passed = actualValue === condition;
      evaluation.message = evaluation.passed 
        ? `${evaluation.requirementName}: ${actualValue} ✓`
        : `${evaluation.requirementName}: متوقع ${condition}، وجد ${actualValue}`;
    }

    return evaluation;
  }

  /**
   * تقييم عمليات المقارنة
   */
  private evaluateOperator(operator: string, actualValue: any, expectedValue: any): boolean {
    const actual = Number(actualValue);
    const expected = Number(expectedValue);

    if (isNaN(actual) || isNaN(expected)) {
      // للنصوص
      switch (operator) {
        case '==': return actualValue === expectedValue;
        case '!=': return actualValue !== expectedValue;
        case 'contains': return String(actualValue).includes(String(expectedValue));
        case 'startsWith': return String(actualValue).startsWith(String(expectedValue));
        default: return false;
      }
    }

    // للأرقام
    switch (operator) {
      case '<': return actual < expected;
      case '<=': return actual <= expected;
      case '>': return actual > expected;
      case '>=': return actual >= expected;
      case '==': return actual === expected;
      case '!=': return actual !== expected;
      default: return false;
    }
  }

  /**
   * تقييم خاص للمباني السكنية
   */
  private evaluateResidentialBuilding(data: Record<string, any>): {
    passed: boolean;
    evaluations: RequirementEvaluation[];
    reasons: string[];
  } {
    const evaluations: RequirementEvaluation[] = [];
    const reasons: string[] = [];
    let passed = true;

    // فحص المساحة
    if (data.area_sqm) {
      const areaEval: RequirementEvaluation = {
        requirementId: 'residential_area',
        requirementName: 'مساحة البناء السكني',
        passed: data.area_sqm >= 60 && data.area_sqm <= 500,
        message: '',
        value: data.area_sqm
      };

      if (data.area_sqm < 60) {
        areaEval.message = 'المساحة أقل من الحد الأدنى (60 م²)';
        passed = false;
        reasons.push('المساحة لا تحقق الحد الأدنى للمباني السكنية');
      } else if (data.area_sqm > 500) {
        areaEval.message = 'المساحة تتطلب مراجعة خاصة (أكبر من 500 م²)';
        passed = false;
        reasons.push('المباني السكنية الكبيرة تتطلب مراجعة هندسية');
      } else {
        areaEval.message = `المساحة مناسبة: ${data.area_sqm} م²`;
      }

      evaluations.push(areaEval);
    }

    // فحص عدد الطوابق
    if (data.floors) {
      const floorsEval: RequirementEvaluation = {
        requirementId: 'residential_floors',
        requirementName: 'عدد الطوابق',
        passed: data.floors <= 3,
        message: '',
        value: data.floors
      };

      if (data.floors > 3) {
        floorsEval.message = 'عدد الطوابق يتجاوز المسموح للمباني السكنية العادية (3 طوابق)';
        passed = false;
        reasons.push('المباني السكنية أكثر من 3 طوابق تتطلب دراسة خاصة');
      } else {
        floorsEval.message = `عدد الطوابق مناسب: ${data.floors}`;
      }

      evaluations.push(floorsEval);
    }

    return { passed, evaluations, reasons };
  }

  /**
   * تقييم خاص للمباني التجارية
   */
  private evaluateCommercialBuilding(data: Record<string, any>): {
    passed: boolean;
    evaluations: RequirementEvaluation[];
    reasons: string[];
  } {
    const evaluations: RequirementEvaluation[] = [];
    const reasons: string[] = [];
    let passed = true;

    // فحص موقف السيارات
    if (data.area_sqm && data.area_sqm > 100) {
      const parkingEval: RequirementEvaluation = {
        requirementId: 'commercial_parking',
        requirementName: 'موقف السيارات',
        passed: data.hasParkingSpace === true,
        message: '',
        value: data.hasParkingSpace
      };

      if (!data.hasParkingSpace) {
        parkingEval.message = 'المباني التجارية تتطلب توفير موقف سيارات';
        passed = false;
        reasons.push('عدم توفير موقف سيارات للمبنى التجاري');
      } else {
        parkingEval.message = 'موقف السيارات متوفر';
      }

      evaluations.push(parkingEval);
    }

    // فحص الوصول للمعاقين
    const accessibilityEval: RequirementEvaluation = {
      requirementId: 'commercial_accessibility',
      requirementName: 'سهولة الوصول للمعاقين',
      passed: data.hasDisabilityAccess === true,
      message: '',
      value: data.hasDisabilityAccess
    };

    if (!data.hasDisabilityAccess) {
      accessibilityEval.message = 'المباني التجارية تتطلب تسهيلات للمعاقين';
      passed = false;
      reasons.push('عدم توفير تسهيلات الوصول للمعاقين');
    } else {
      accessibilityEval.message = 'تسهيلات المعاقين متوفرة';
    }

    evaluations.push(accessibilityEval);

    return { passed, evaluations, reasons };
  }

  /**
   * تقييم المخاطر
   */
  private async assessRisks(request: ServiceRequest): Promise<{ level: 'low' | 'medium' | 'high' | 'critical'; reasons: string[] }> {
    const risks: string[] = [];
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // مخاطر الموقع
    if (request.location) {
      if (request.location.includes('تاريخي') || request.location.includes('تراثي')) {
        risks.push('موقع في منطقة تراثية');
        level = 'high';
      }
    }

    // مخاطر حجم المشروع
    if (request.requestData.estimatedCost && request.requestData.estimatedCost > 1000000) {
      risks.push('مشروع عالي القيمة');
      level = level === 'critical' ? 'critical' : 'high';
    }

    // مخاطر الإلحاح
    if (request.urgencyLevel === 'emergency') {
      risks.push('طلب طارئ يتطلب معالجة سريعة');
      level = 'high';
    }

    return { level, reasons: risks };
  }

  /**
   * حساب مستوى المخاطر
   */
  private calculateRiskLevel(evaluations: RequirementEvaluation[]): 'low' | 'medium' | 'high' | 'critical' {
    const failedCount = evaluations.filter(e => !e.passed).length;
    const totalCount = evaluations.length;
    const failureRate = totalCount > 0 ? failedCount / totalCount : 0;

    if (failureRate > 0.7) return 'critical';
    if (failureRate > 0.4) return 'high';
    if (failureRate > 0.2) return 'medium';
    return 'low';
  }

  /**
   * تحديد القرار من الإجراء
   */
  private getDecisionFromAction(action: Record<string, any>): 'approve' | 'reject' | 'require_review' | 'escalate' {
    if (action.autoApprove) return 'approve';
    if (action.autoReject) return 'reject';
    if (action.escalate) return 'escalate';
    return 'require_review';
  }

  /**
   * حساب وقت المعالجة المتوقع
   */
  private calculateProcessingTime(decision: string, evaluationsCount: number): number {
    const baseTime = 60; // ثانية واحدة أساسية
    const complexityFactor = evaluationsCount * 10;
    
    switch (decision) {
      case 'approve': return baseTime + complexityFactor;
      case 'reject': return baseTime + complexityFactor;
      case 'require_review': return baseTime + complexityFactor * 2;
      case 'escalate': return baseTime + complexityFactor * 3;
      default: return baseTime;
    }
  }

  /**
   * تحديد المستندات المطلوبة
   */
  private async getRequiredDocuments(request: ServiceRequest, decision: string): Promise<string[]> {
    const documents: string[] = [];

    if (request.serviceId === 'building_permit') {
      documents.push('المخططات المعمارية');
      documents.push('صكّ الملكية');
      documents.push('الهوية الشخصية');

      if (decision === 'require_review') {
        documents.push('تقرير فني مفصل');
        documents.push('دراسة الأثر البيئي');
      }

      if (request.requestData.buildingType === 'commercial') {
        documents.push('ترخيص النشاط التجاري');
        documents.push('مخطط موقف السيارات');
      }
    }

    return documents;
  }

  /**
   * حفظ القرار التلقائي
   */
  private async saveAutomatedDecision(request: ServiceRequest, result: AutomationResult): Promise<void> {
    try {
      await db.insert(automatedDecisions).values({
        serviceRequestId: `${request.serviceId}_${Date.now()}`,
        decisionResult: result.decision,
        confidenceScore: result.confidence,
        evaluations: result.evaluations,
        riskAssessment: {
          level: result.riskLevel,
          reasoning: result.reasoning
        },
        processingTimeMs: result.estimatedProcessingTime || 0,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('❌ خطأ في حفظ القرار:', error);
    }
  }

  /**
   * تحويل اسم الحقل لاسم مفهوم
   */
  private getFieldDisplayName(field: string): string {
    const fieldNames: Record<string, string> = {
      'area_sqm': 'المساحة (م²)',
      'floors': 'عدد الطوابق',
      'height_m': 'الارتفاع (م)',
      'buildingType': 'نوع المبنى',
      'estimatedCost': 'التكلفة المقدرة',
      'location': 'الموقع',
      'district': 'المنطقة',
      'hasParkingSpace': 'موقف السيارات',
      'hasDisabilityAccess': 'تسهيلات المعاقين',
      'urgencyLevel': 'مستوى الإلحاح'
    };

    return fieldNames[field] || field;
  }

  /**
   * إنشاء قانون جديد
   */
  async createAutomationRule(ruleData: {
    ruleName: string;
    ruleCategory: string;
    conditions: Record<string, any>;
    actions: Record<string, any>;
    priority: number;
    isActive: boolean;
    description?: string;
  }): Promise<string> {
    try {
      const [rule] = await db.insert(automationRules).values({
        ruleName: ruleData.ruleName,
        description: ruleData.description || '',
        ruleCategory: ruleData.ruleCategory,
        priority: ruleData.priority,
        conditions: ruleData.conditions,
        actions: ruleData.actions,
        isActive: ruleData.isActive,
        targetProcesses: [ruleData.ruleCategory],
        createdBy: 'system',
        createdAt: new Date()
      }).returning();

      console.log(`✅ تم إنشاء قانون جديد: ${rule.ruleName}`);
      return rule.id;
    } catch (error) {
      console.error('❌ خطأ في إنشاء القانون:', error);
      throw new Error(`فشل في إنشاء القانون: ${error.message}`);
    }
  }

  /**
   * تحديث قانون موجود
   */
  async updateAutomationRule(ruleId: string, updates: Partial<{
    ruleName: string;
    conditions: Record<string, any>;
    actions: Record<string, any>;
    priority: number;
    isActive: boolean;
    description: string;
  }>): Promise<void> {
    try {
      await db.update(automationRules)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(automationRules.id, ruleId));

      console.log(`✅ تم تحديث القانون: ${ruleId}`);
    } catch (error) {
      console.error('❌ خطأ في تحديث القانون:', error);
      throw new Error(`فشل في تحديث القانون: ${error.message}`);
    }
  }
}