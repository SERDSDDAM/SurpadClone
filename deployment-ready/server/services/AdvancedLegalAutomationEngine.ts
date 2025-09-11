// محرك الأتمتة القانونية المتقدم - المرحلة الثالثة المطورة
// يشمل إدارة الإدارة والقوانين النافذة مع أتمتة شاملة

// تعريف الأنواع المطلوبة محلياً
interface LegalRule {
  ruleName: string;
  description: string;
  category: string;
  conditions: LegalCondition[];
  actions: LegalAction[];
  priority: number;
  isActive: boolean;
  applicableServices: string[];
  // إضافات جديدة لإدارة الإدارة
  administrativeLevel?: 'federal' | 'regional' | 'local' | 'municipal';
  governingAuthority?: string;
  legalSource?: string;
  effectiveDate?: string;
  expiryDate?: string;
  amendments?: Amendment[];
}

interface Amendment {
  id: string;
  date: string;
  description: string;
  amendedBy: string;
  status: 'draft' | 'approved' | 'implemented';
}

interface LegalCondition {
  field: string;
  fieldDisplayName?: string;
  operator: string;
  value: any;
  valueType?: 'number' | 'string' | 'boolean' | 'array' | 'object';
  isRequired?: boolean;
}

interface LegalAction {
  type: string;
  message: string;
  priority: number;
}

export interface ServiceRequest {
  serviceId: string;
  serviceType: 'building_permit' | 'demolition_permit' | 'fencing_permit' | 'occupancy_certificate';
  projectData: {
    area_sqm?: number;
    height_m?: number;
    floors?: number;
    location?: string;
    building_type?: 'residential' | 'commercial' | 'industrial' | 'mixed';
    has_survey?: boolean;
    has_structural_report?: boolean;
    parking_spaces?: number;
    setback_front?: number;
    setback_sides?: number;
    owner_type?: 'individual' | 'company' | 'government';
    project_value?: number;
    contractor_license?: string;
    architect_license?: string;
    urgency_level?: 'normal' | 'urgent' | 'emergency';
    documents_submitted?: string[];
    environmental_clearance?: boolean;
    utilities_approval?: boolean;
  };
  applicantData: {
    nationality?: 'yemeni' | 'foreign';
    id_type?: 'national_id' | 'passport' | 'residence_permit';
    previous_violations?: boolean;
    outstanding_fees?: number;
  };
  locationData: {
    district?: string;
    zone_type?: 'residential' | 'commercial' | 'industrial' | 'mixed' | 'heritage';
    flood_risk_zone?: boolean;
    archaeological_area?: boolean;
    infrastructure_availability?: {
      electricity?: boolean;
      water?: boolean;
      sewage?: boolean;
      roads?: boolean;
    };
  };
}

export interface EvaluationResult {
  requirementId: string;
  requirementName: string;
  passed: boolean;
  message: string;
  value?: any;
  expectedValue?: any;
  confidence: number;
  category: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface AutomationResult {
  approved: boolean;
  decision: 'approve' | 'reject' | 'escalate' | 'request_additional_info';
  confidence: number;
  evaluations: EvaluationResult[];
  recommendedActions: string[];
  nextSteps: NextStep[];
  estimatedProcessingTime: string;
  fees: {
    base: number;
    additional: number;
    total: number;
    breakdown: Array<{ item: string; amount: number; }>;
  };
  reasoning: string[];
  riskLevel: 'low' | 'medium' | 'high';
  complianceScore: number;
  warnings: string[];
}

export interface NextStep {
  step: number;
  title: string;
  description: string;
  estimatedTime: string;
  required: boolean;
  dependencies: string[];
  assignedTo?: 'applicant' | 'reviewer' | 'inspector' | 'system';
}

export class AdvancedLegalAutomationEngine {
  private activatedRules: LegalRule[] = [];
  private administrativeHierarchy: Map<string, string[]> = new Map();
  private legalRegistry: Map<string, LegalRule> = new Map();

  constructor() {
    console.log('🏛️ تهيئة محرك الأتمتة القانونية المتقدم مع إدارة الإدارة');
    this.initializeAdministrativeHierarchy();
    this.loadActiveRulesFromRegistry();
    this.initializeLegalRegistry();
  }

  /**
   * تهيئة الهيكل الإداري لليمن
   */
  private initializeAdministrativeHierarchy(): void {
    // المستوى الاتحادي
    this.administrativeHierarchy.set('federal', [
      'وزارة الأشغال العامة والطرق',
      'وزارة التخطيط والتعاون الدولي',
      'هيئة المساحة العامة',
      'الهيئة العامة للمواصفات والمقاييس'
    ]);

    // المستوى الإقليمي
    this.administrativeHierarchy.set('regional', [
      'محافظة صنعاء',
      'محافظة عدن',
      'محافظة تعز',
      'محافظة الحديدة',
      'محافظة إب',
      'محافظة ذمار'
    ]);

    // المستوى المحلي
    this.administrativeHierarchy.set('local', [
      'مديرية الأزبكية',
      'مديرية شعوب',
      'مديرية معين',
      'مديرية الوحدة',
      'مديرية السبعين'
    ]);

    // المستوى البلدي
    this.administrativeHierarchy.set('municipal', [
      'أمانة العاصمة',
      'مجلس بلدي عدن',
      'مجلس بلدي تعز',
      'مجلس بلدي الحديدة'
    ]);

    console.log('📋 تم تهيئة الهيكل الإداري:', this.administrativeHierarchy.size, 'مستويات');
  }

  /**
   * تهيئة سجل القوانين النافذة
   */
  private initializeLegalRegistry(): void {
    const effectiveRules: LegalRule[] = [
      {
        ruleName: 'قانون البناء الموحد رقم 5 لسنة 2007',
        description: 'القانون الأساسي لتنظيم أعمال البناء والتشييد في الجمهورية اليمنية',
        category: 'building_permit',
        conditions: [],
        actions: [],
        priority: 1,
        isActive: true,
        applicableServices: ['building_permit', 'demolition_permit'],
        administrativeLevel: 'federal',
        governingAuthority: 'وزارة الأشغال العامة والطرق',
        legalSource: 'الجريدة الرسمية - العدد 15 لسنة 2007',
        effectiveDate: '2007-08-15',
        amendments: [
          {
            id: 'amend_2015_01',
            date: '2015-03-10',
            description: 'تعديل المادة 25 بشأن ارتفاع المباني',
            amendedBy: 'قرار وزاري رقم 45 لسنة 2015',
            status: 'implemented'
          }
        ]
      },
      {
        ruleName: 'لائحة السلامة الإنشائية رقم 12 لسنة 2010',
        description: 'تنظيم متطلبات السلامة الإنشائية للمباني والمنشآت',
        category: 'safety_compliance',
        conditions: [],
        actions: [],
        priority: 2,
        isActive: true,
        applicableServices: ['building_permit', 'occupancy_certificate'],
        administrativeLevel: 'federal',
        governingAuthority: 'الهيئة العامة للمواصفات والمقاييس',
        legalSource: 'قرار مجلس الوزراء رقم 123 لسنة 2010',
        effectiveDate: '2010-12-01'
      },
      {
        ruleName: 'قانون المحافظة على التراث العمراني رقم 8 لسنة 2013',
        description: 'حماية المناطق التراثية والمباني ذات القيمة التاريخية',
        category: 'heritage_protection',
        conditions: [],
        actions: [],
        priority: 3,
        isActive: true,
        applicableServices: ['building_permit', 'demolition_permit'],
        administrativeLevel: 'federal',
        governingAuthority: 'الهيئة العامة للآثار والمتاحف',
        legalSource: 'قانون رقم 8 لسنة 2013',
        effectiveDate: '2013-06-20'
      }
    ];

    effectiveRules.forEach(rule => {
      this.legalRegistry.set(rule.ruleName, rule);
    });

    console.log('⚖️ تم تهيئة سجل القوانين:', this.legalRegistry.size, 'قانون نافذ');
  }

  /**
   * الحصول على القوانين المطبقة حسب المستوى الإداري
   */
  async getRulesByAdministrativeLevel(level: string): Promise<LegalRule[]> {
    const rules: LegalRule[] = [];
    
    this.legalRegistry.forEach((rule, _) => {
      if (rule.administrativeLevel === level && rule.isActive) {
        // التحقق من صلاحية القانون
        if (this.isRuleEffective(rule)) {
          rules.push(rule);
        }
      }
    });

    return rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * التحقق من فعالية القانون (ساري المفعول)
   */
  private isRuleEffective(rule: LegalRule): boolean {
    const now = new Date();
    
    // التحقق من تاريخ البدء
    if (rule.effectiveDate) {
      const effectiveDate = new Date(rule.effectiveDate);
      if (now < effectiveDate) {
        return false;
      }
    }

    // التحقق من تاريخ الانتهاء
    if (rule.expiryDate) {
      const expiryDate = new Date(rule.expiryDate);
      if (now > expiryDate) {
        return false;
      }
    }

    return true;
  }

  /**
   * إضافة قانون جديد إلى السجل
   */
  async addLegalRule(rule: LegalRule): Promise<{ success: boolean; message: string }> {
    try {
      // التحقق من صحة البيانات
      if (!rule.ruleName || !rule.description || !rule.category) {
        return {
          success: false,
          message: 'بيانات القانون غير مكتملة'
        };
      }

      // التحقق من عدم وجود القانون مسبقاً
      if (this.legalRegistry.has(rule.ruleName)) {
        return {
          success: false,
          message: 'القانون موجود مسبقاً في السجل'
        };
      }

      // إضافة القانون
      this.legalRegistry.set(rule.ruleName, rule);
      
      // إضافة للقوانين النشطة إذا كان فعال
      if (rule.isActive && this.isRuleEffective(rule)) {
        this.activatedRules.push(rule);
      }

      console.log('✅ تم إضافة قانون جديد:', rule.ruleName);
      
      return {
        success: true,
        message: 'تم إضافة القانون بنجاح'
      };
    } catch (error) {
      console.error('❌ خطأ في إضافة القانون:', error);
      return {
        success: false,
        message: 'حدث خطأ في إضافة القانون'
      };
    }
  }

  /**
   * تحديث قانون موجود
   */
  async updateLegalRule(ruleName: string, updates: Partial<LegalRule>): Promise<{ success: boolean; message: string }> {
    try {
      const existingRule = this.legalRegistry.get(ruleName);
      if (!existingRule) {
        return {
          success: false,
          message: 'القانون غير موجود في السجل'
        };
      }

      // دمج التحديثات مع القانون الموجود
      const updatedRule = { ...existingRule, ...updates };
      
      // إضافة معلومات التعديل
      if (updates.description || updates.conditions || updates.actions) {
        const amendment: Amendment = {
          id: `amend_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: 'تحديث القانون عبر النظام المتقدم',
          amendedBy: 'نظام الأتمتة القانونية',
          status: 'implemented'
        };
        
        updatedRule.amendments = [...(existingRule.amendments || []), amendment];
      }

      // تحديث السجل
      this.legalRegistry.set(ruleName, updatedRule);
      
      // تحديث القوانين النشطة
      const activeIndex = this.activatedRules.findIndex(r => r.ruleName === ruleName);
      if (activeIndex !== -1) {
        if (updatedRule.isActive && this.isRuleEffective(updatedRule)) {
          this.activatedRules[activeIndex] = updatedRule;
        } else {
          this.activatedRules.splice(activeIndex, 1);
        }
      } else if (updatedRule.isActive && this.isRuleEffective(updatedRule)) {
        this.activatedRules.push(updatedRule);
      }

      console.log('✅ تم تحديث القانون:', ruleName);
      
      return {
        success: true,
        message: 'تم تحديث القانون بنجاح'
      };
    } catch (error) {
      console.error('❌ خطأ في تحديث القانون:', error);
      return {
        success: false,
        message: 'حدث خطأ في تحديث القانون'
      };
    }
  }

  /**
   * الحصول على تقرير شامل للقوانين النافذة
   */
  async getLegalComplianceReport(): Promise<{
    totalRules: number;
    activeRules: number;
    rulesByLevel: Record<string, number>;
    recentAmendments: Amendment[];
    effectiveRules: LegalRule[];
  }> {
    const rulesByLevel: Record<string, number> = {
      federal: 0,
      regional: 0,
      local: 0,
      municipal: 0
    };

    const recentAmendments: Amendment[] = [];
    const effectiveRules: LegalRule[] = [];

    this.legalRegistry.forEach((rule, _) => {
      // تصنيف حسب المستوى الإداري
      if (rule.administrativeLevel) {
        rulesByLevel[rule.administrativeLevel]++;
      }

      // جمع التعديلات الحديثة
      if (rule.amendments) {
        recentAmendments.push(...rule.amendments.filter((a: Amendment) => {
          const amendDate = new Date(a.date);
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return amendDate > sixMonthsAgo;
        }));
      }

      // القوانين الفعالة
      if (rule.isActive && this.isRuleEffective(rule)) {
        effectiveRules.push(rule);
      }
    });

    // ترتيب التعديلات حسب التاريخ
    recentAmendments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      totalRules: this.legalRegistry.size,
      activeRules: effectiveRules.length,
      rulesByLevel,
      recentAmendments: recentAmendments.slice(0, 10), // آخر 10 تعديلات
      effectiveRules: effectiveRules.sort((a, b) => a.priority - b.priority)
    };
  }

  /**
   * تحميل القوانين النشطة من السجل
   */
  private loadActiveRulesFromRegistry(): void {
    this.activatedRules = [];
    this.legalRegistry.forEach((rule, _) => {
      if (rule.isActive && this.isRuleEffective(rule)) {
        this.activatedRules.push(rule);
      }
    });
    console.log('📋 تم تحميل القوانين النشطة:', this.activatedRules.length);
  }

  /**
   * تقييم طلب خدمة شامل مع تحليل متقدم
   */
  async evaluateServiceRequest(requestData: ServiceRequest): Promise<AutomationResult> {
    console.log('🔍 بدء تقييم الطلب:', requestData.serviceType);

    // 1. جلب القوانين المطبقة على هذه الخدمة
    const applicableRules = await this.getApplicableRules(requestData);
    
    // 2. تقييم كل قانون
    const evaluations: EvaluationResult[] = [];
    let totalScore = 0;
    let criticalFailures = 0;
    
    for (const rule of applicableRules) {
      const ruleEvaluation = await this.evaluateRule(rule, requestData);
      evaluations.push(...ruleEvaluation);
      
      // حساب النقاط والأخطاء الحرجة
      for (const evaluation of ruleEvaluation) {
        if (evaluation.passed) {
          totalScore += evaluation.confidence;
        } else if (evaluation.criticality === 'critical') {
          criticalFailures++;
        }
      }
    }

    // 3. حساب النتيجة الإجمالية
    const complianceScore = totalScore / Math.max(evaluations.length, 1);
    const hasRejectionCriteria = criticalFailures > 0;
    const hasMinorIssues = evaluations.some(e => !e.passed && e.criticality !== 'critical');

    // 4. اتخاذ القرار الذكي
    let decision: 'approve' | 'reject' | 'escalate' | 'request_additional_info' = 'approve';
    let approved = true;
    let confidence = complianceScore;

    if (hasRejectionCriteria) {
      decision = 'reject';
      approved = false;
      confidence = Math.min(confidence, 0.3);
    } else if (complianceScore < 0.6) {
      decision = 'request_additional_info';
      approved = false;
      confidence = Math.min(confidence, 0.5);
    } else if (complianceScore < 0.8 || hasMinorIssues) {
      decision = 'escalate';
      approved = false;
      confidence = Math.min(confidence, 0.7);
    }

    // 5. حساب الرسوم
    const fees = await this.calculateFees(requestData, evaluations);

    // 6. إنشاء خطة العمل
    const nextSteps = await this.generateActionPlan(requestData, evaluations, decision);

    // 7. تحليل المخاطر
    const riskLevel = this.assessRiskLevel(requestData, evaluations);

    // 8. توليد التوصيات
    const recommendedActions = this.generateRecommendations(evaluations);
    const reasoning = this.generateReasoning(evaluations, decision);
    const warnings = this.generateWarnings(requestData, evaluations);

    return {
      approved,
      decision,
      confidence: Math.round(confidence * 100) / 100,
      evaluations,
      recommendedActions,
      nextSteps,
      estimatedProcessingTime: this.estimateProcessingTime(decision, nextSteps),
      fees,
      reasoning,
      riskLevel,
      complianceScore: Math.round(complianceScore * 100) / 100,
      warnings
    };
  }

  /**
   * جلب القوانين المطبقة على الطلب
   */
  private async getApplicableRules(requestData: ServiceRequest): Promise<LegalRule[]> {
    // هنا نجلب القوانين من قاعدة البيانات أو من ذاكرة النظام
    return this.getBuiltInRules(requestData.serviceType);
  }

  /**
   * تقييم قانون واحد
   */
  private async evaluateRule(rule: LegalRule, requestData: ServiceRequest): Promise<EvaluationResult[]> {
    const evaluations: EvaluationResult[] = [];

    for (const condition of rule.conditions) {
      const evaluation = await this.evaluateCondition(condition, requestData);
      evaluations.push(evaluation);
    }

    return evaluations;
  }

  /**
   * تقييم شرط واحد
   */
  private async evaluateCondition(condition: LegalCondition, requestData: ServiceRequest): Promise<EvaluationResult> {
    const value = this.getFieldValue(condition.field, requestData);
    let passed = false;
    let confidence = 0.9;

    switch (condition.operator) {
      case '>':
        passed = Number(value) > Number(condition.value);
        break;
      case '<':
        passed = Number(value) < Number(condition.value);
        break;
      case '>=':
        passed = Number(value) >= Number(condition.value);
        break;
      case '<=':
        passed = Number(value) <= Number(condition.value);
        break;
      case '==':
        passed = value == condition.value;
        break;
      case '!=':
        passed = value != condition.value;
        break;
      case 'contains':
        passed = String(value).toLowerCase().includes(String(condition.value).toLowerCase());
        break;
      case 'exists':
        passed = value !== null && value !== undefined && value !== '';
        break;
    }

    // تحديد مستوى الأهمية
    let criticality: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (condition.isRequired && !passed) {
      criticality = 'critical';
    } else if (condition.field.includes('safety') || condition.field.includes('structural')) {
      criticality = 'high';
    }

    return {
      requirementId: `${condition.field}_${condition.operator}_${condition.value}`,
      requirementName: condition.fieldDisplayName || condition.field,
      passed,
      message: this.generateEvaluationMessage(condition, value, passed),
      value,
      expectedValue: condition.value,
      confidence,
      category: this.categorizeField(condition.field),
      criticality
    };
  }

  /**
   * الحصول على قيمة حقل من بيانات الطلب
   */
  private getFieldValue(field: string, requestData: ServiceRequest): any {
    // البحث في البيانات المختلفة
    if (requestData.projectData && field in requestData.projectData) {
      return requestData.projectData[field as keyof typeof requestData.projectData];
    }
    if (requestData.applicantData && field in requestData.applicantData) {
      return requestData.applicantData[field as keyof typeof requestData.applicantData];
    }
    if (requestData.locationData && field in requestData.locationData) {
      return requestData.locationData[field as keyof typeof requestData.locationData];
    }
    return null;
  }

  /**
   * إنشاء رسالة التقييم
   */
  private generateEvaluationMessage(condition: LegalCondition, actualValue: any, passed: boolean): string {
    const fieldName = condition.fieldDisplayName || condition.field;
    
    if (passed) {
      return `✅ ${fieldName}: ${actualValue} (مستوفى)`;
    } else {
      return `❌ ${fieldName}: ${actualValue} ${condition.operator} ${condition.value} (غير مستوفى)`;
    }
  }

  /**
   * تصنيف الحقول
   */
  private categorizeField(field: string): string {
    if (field.includes('area') || field.includes('height') || field.includes('floors')) {
      return 'المواصفات الفنية';
    }
    if (field.includes('document') || field.includes('license') || field.includes('certificate')) {
      return 'الوثائق';
    }
    if (field.includes('location') || field.includes('zone') || field.includes('setback')) {
      return 'الموقع والتخطيط';
    }
    if (field.includes('safety') || field.includes('structural') || field.includes('fire')) {
      return 'السلامة';
    }
    return 'عام';
  }

  /**
   * حساب الرسوم
   */
  private async calculateFees(requestData: ServiceRequest, evaluations: EvaluationResult[]): Promise<any> {
    const baseFee = this.getBaseFee(requestData.serviceType);
    let additionalFee = 0;

    // رسوم إضافية حسب المساحة
    if (requestData.projectData.area_sqm) {
      if (requestData.projectData.area_sqm > 500) {
        additionalFee += 1000;
      } else if (requestData.projectData.area_sqm > 200) {
        additionalFee += 500;
      }
    }

    // رسوم إضافية للخدمات الطارئة
    if (requestData.projectData.urgency_level === 'urgent') {
      additionalFee += baseFee * 0.5;
    } else if (requestData.projectData.urgency_level === 'emergency') {
      additionalFee += baseFee * 1.0;
    }

    const breakdown = [
      { item: 'الرسوم الأساسية', amount: baseFee },
      { item: 'رسوم إضافية', amount: additionalFee }
    ];

    return {
      base: baseFee,
      additional: additionalFee,
      total: baseFee + additionalFee,
      breakdown
    };
  }

  private getBaseFee(serviceType: string): number {
    const feeTable = {
      'building_permit': 2000,
      'demolition_permit': 1000,
      'fencing_permit': 500,
      'occupancy_certificate': 1500
    };
    return feeTable[serviceType as keyof typeof feeTable] || 1000;
  }

  /**
   * تقدير الوقت المطلوب
   */
  private estimateProcessingTime(decision: string, nextSteps: NextStep[]): string {
    if (decision === 'approve') {
      return '1-2 أيام عمل';
    } else if (decision === 'request_additional_info') {
      return '5-7 أيام عمل';
    } else if (decision === 'escalate') {
      return '7-14 يوم عمل';
    } else {
      return '3-5 أيام عمل';
    }
  }

  /**
   * تحليل مستوى المخاطر
   */
  private assessRiskLevel(requestData: ServiceRequest, evaluations: EvaluationResult[]): 'low' | 'medium' | 'high' {
    const criticalFailures = evaluations.filter(e => !e.passed && e.criticality === 'critical').length;
    const highRiskFactors = [
      requestData.locationData.flood_risk_zone,
      requestData.locationData.archaeological_area,
      requestData.projectData.height_m && requestData.projectData.height_m > 20,
      requestData.applicantData.previous_violations
    ].filter(Boolean).length;

    if (criticalFailures > 0 || highRiskFactors > 2) {
      return 'high';
    } else if (highRiskFactors > 0) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * توليد التوصيات
   */
  private generateRecommendations(evaluations: EvaluationResult[]): string[] {
    const recommendations: string[] = [];
    
    evaluations.forEach(evaluation => {
      if (!evaluation.passed) {
        if (evaluation.category === 'الوثائق') {
          recommendations.push(`تقديم الوثائق المطلوبة: ${evaluation.requirementName}`);
        } else if (evaluation.category === 'المواصفات الفنية') {
          recommendations.push(`مراجعة المواصفات الفنية: ${evaluation.requirementName}`);
        } else if (evaluation.category === 'السلامة') {
          recommendations.push(`إجراء تقييم السلامة: ${evaluation.requirementName}`);
        }
      }
    });

    return recommendations;
  }

  /**
   * توليد الأسباب
   */
  private generateReasoning(evaluations: EvaluationResult[], decision: string): string[] {
    const reasoning: string[] = [];

    if (decision === 'approve') {
      reasoning.push('جميع المتطلبات الأساسية مستوفاة');
      reasoning.push('لا توجد مخاطر أمنية أو فنية');
    } else if (decision === 'reject') {
      const criticalFailures = evaluations.filter(e => !e.passed && e.criticality === 'critical');
      reasoning.push(`وجود ${criticalFailures.length} متطلب حرج غير مستوفى`);
    } else if (decision === 'escalate') {
      reasoning.push('يتطلب مراجعة فنية متخصصة');
      reasoning.push('وجود عوامل تتطلب تقييماً إضافياً');
    }

    return reasoning;
  }

  /**
   * توليد التحذيرات
   */
  private generateWarnings(requestData: ServiceRequest, evaluations: EvaluationResult[]): string[] {
    const warnings: string[] = [];

    if (requestData.locationData.flood_risk_zone) {
      warnings.push('⚠️ الموقع في منطقة معرضة للفيضانات - يتطلب تقييم إضافي');
    }

    if (requestData.locationData.archaeological_area) {
      warnings.push('⚠️ الموقع في منطقة أثرية - يتطلب موافقة من الهيئة العامة للآثار');
    }

    if (requestData.projectData.height_m && requestData.projectData.height_m > 15) {
      warnings.push('⚠️ مبنى عالي - يتطلب دراسة هندسية متخصصة');
    }

    return warnings;
  }

  /**
   * إنشاء خطة العمل
   */
  private async generateActionPlan(requestData: ServiceRequest, evaluations: EvaluationResult[], decision: string): Promise<NextStep[]> {
    const steps: NextStep[] = [];
    let stepCounter = 1;

    // خطوات حسب القرار
    if (decision === 'request_additional_info') {
      const missingDocs = evaluations.filter(e => !e.passed && e.category === 'الوثائق');
      if (missingDocs.length > 0) {
        steps.push({
          step: stepCounter++,
          title: 'تقديم الوثائق الناقصة',
          description: `المطلوب: ${missingDocs.map(d => d.requirementName).join(', ')}`,
          estimatedTime: '2-3 أيام عمل',
          required: true,
          dependencies: [],
          assignedTo: 'applicant'
        });
      }

      const technicalIssues = evaluations.filter(e => !e.passed && e.category === 'المواصفات الفنية');
      if (technicalIssues.length > 0) {
        steps.push({
          step: stepCounter++,
          title: 'تعديل المواصفات الفنية',
          description: `يجب تعديل: ${technicalIssues.map(t => t.requirementName).join(', ')}`,
          estimatedTime: '3-5 أيام عمل',
          required: true,
          dependencies: ['تقديم الوثائق الناقصة'],
          assignedTo: 'applicant'
        });
      }
    } else if (decision === 'escalate') {
      steps.push({
        step: stepCounter++,
        title: 'المراجعة الفنية المتخصصة',
        description: 'إحالة الطلب للجنة الفنية للمراجعة والتقييم',
        estimatedTime: '5-7 أيام عمل',
        required: true,
        dependencies: [],
        assignedTo: 'reviewer'
      });
    } else if (decision === 'approve') {
      steps.push({
        step: stepCounter++,
        title: 'دفع الرسوم',
        description: `المبلغ المطلوب: ${(await this.calculateFees(requestData, evaluations)).total} ريال`,
        estimatedTime: 'فوري',
        required: true,
        dependencies: [],
        assignedTo: 'applicant'
      });

      steps.push({
        step: stepCounter++,
        title: 'إصدار الترخيص',
        description: 'طباعة وتسليم الترخيص النهائي',
        estimatedTime: '1-2 أيام عمل',
        required: true,
        dependencies: ['دفع الرسوم'],
        assignedTo: 'system'
      });
    }

    return steps;
  }

  /**
   * القوانين المدمجة في النظام
   */
  private getBuiltInRules(serviceType: string): LegalRule[] {
    const baseRules: Record<string, LegalRule[]> = {
      building_permit: [
        {
          ruleName: 'المساحة الدنيا للمباني السكنية',
          description: 'يجب أن تكون مساحة المبنى السكني لا تقل عن 100 متر مربع',
          category: 'building_permit',
          conditions: [
            {
              field: 'area_sqm',
              fieldDisplayName: 'مساحة البناء (م²)',
              operator: '>=',
              value: 100,
              valueType: 'number',
              isRequired: true
            }
          ],
          actions: [
            {
              type: 'approve',
              message: 'المساحة مطابقة للحد الأدنى المطلوب',
              priority: 1
            }
          ],
          priority: 5,
          isActive: true,
          applicableServices: ['building_permit']
        },
        {
          ruleName: 'ارتفاع المباني في المناطق السكنية',
          description: 'الحد الأقصى لارتفاع المباني في المناطق السكنية 15 متر',
          category: 'building_permit',
          conditions: [
            {
              field: 'height_m',
              fieldDisplayName: 'ارتفاع المبنى (م)',
              operator: '<=',
              value: 15,
              valueType: 'number',
              isRequired: true
            }
          ],
          actions: [
            {
              type: 'approve',
              message: 'الارتفاع ضمن الحدود المسموحة',
              priority: 1
            }
          ],
          priority: 8,
          isActive: true,
          applicableServices: ['building_permit']
        }
      ],
      demolition_permit: [
        {
          ruleName: 'تقرير السلامة الإنشائية للهدم',
          description: 'يتطلب تقرير سلامة إنشائية من مهندس معتمد قبل الهدم',
          category: 'demolition_permit',
          conditions: [
            {
              field: 'has_structural_report',
              fieldDisplayName: 'تقرير السلامة الإنشائية',
              operator: '==',
              value: true,
              valueType: 'boolean',
              isRequired: true
            }
          ],
          actions: [
            {
              type: 'approve',
              message: 'تم تقديم تقرير السلامة الإنشائية',
              priority: 1
            }
          ],
          priority: 9,
          isActive: true,
          applicableServices: ['demolition_permit']
        }
      ]
    };

    return baseRules[serviceType] || [];
  }
}