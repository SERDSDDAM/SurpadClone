import { pointInPolygonEngine, PointInPolygonResult, CoordinatePoint } from './point-in-polygon-engine';

export interface EscalationCriteria {
  name: string;
  priority: number; // 1 = highest priority, higher numbers = lower priority
  condition: (analysis: PointInPolygonResult, context: RequestContext) => boolean;
  escalationLevel: number; // 0-6 based on ministerial decree
  targetOffice: 'branch' | 'supervisory' | 'ministerial' | 'specialized';
  reason: string;
}

export interface RequestContext {
  requestType: 'new_construction' | 'modification' | 'demolition' | 'maintenance';
  projectSize: 'small' | 'medium' | 'large' | 'mega';
  projectValue: number; // in YER
  applicantType: 'individual' | 'company' | 'government' | 'international';
  urgency: 'routine' | 'urgent' | 'emergency';
  hasExistingPermits: boolean;
  documentationComplete: boolean;
}

export interface EscalationResult {
  escalationLevel: number;
  targetOffice: string;
  assignedBranch: string;
  supervisoryOffice: string;
  reasoning: string[];
  estimatedProcessingDays: number;
  requiredApprovals: string[];
  additionalDocuments: string[];
  autoApprovalEligible: boolean;
}

export class EscalationEngine {
  private escalationCriteria: EscalationCriteria[] = [];

  constructor() {
    this.initializeEscalationCriteria();
  }

  /**
   * محرك التصعيد الرئيسي - يحلل الطلب ويحدد المسار المناسب
   */
  async analyzeAndEscalate(
    coordinates: CoordinatePoint,
    context: RequestContext
  ): Promise<EscalationResult> {
    try {
      // الخطوة 1: تحليل النقطة الجغرافية
      const gisAnalysis = await pointInPolygonEngine.analyzePoint(coordinates);
      
      // الخطوة 2: تطبيق معايير التصعيد
      const applicableCriteria = this.evaluateEscalationCriteria(gisAnalysis, context);
      
      // الخطوة 3: تحديد أعلى مستوى تصعيد مطلوب
      const highestEscalation = this.determineHighestEscalation(applicableCriteria);
      
      // الخطوة 4: تحديد الفرع والمكتب المناسب
      const assignmentResult = this.assignToOffice(gisAnalysis, highestEscalation);
      
      // الخطوة 5: حساب مدة المعالجة المتوقعة
      const processingTime = this.calculateProcessingTime(highestEscalation, context);
      
      // الخطوة 6: تحديد الموافقات والوثائق المطلوبة
      const requirements = this.determineRequirements(highestEscalation, context);

      return {
        escalationLevel: highestEscalation.escalationLevel,
        targetOffice: assignmentResult.targetOffice,
        assignedBranch: assignmentResult.assignedBranch,
        supervisoryOffice: assignmentResult.supervisoryOffice,
        reasoning: applicableCriteria.map(c => c.reason),
        estimatedProcessingDays: processingTime,
        requiredApprovals: requirements.approvals,
        additionalDocuments: requirements.documents,
        autoApprovalEligible: this.isAutoApprovalEligible(highestEscalation, context)
      };

    } catch (error) {
      console.error('خطأ في محرك التصعيد:', error);
      
      // في حالة الخطأ، نطبق الأسلوب الآمن (التصعيد للمستوى الأعلى)
      return {
        escalationLevel: 3,
        targetOffice: 'supervisory',
        assignedBranch: 'المكتب الإشرافي المركزي',
        supervisoryOffice: 'المكتب الإشرافي المركزي',
        reasoning: ['حدث خطأ تقني - تم التصعيد للمراجعة اليدوية'],
        estimatedProcessingDays: 30,
        requiredApprovals: ['موافقة المكتب الإشرافي'],
        additionalDocuments: ['مراجعة شاملة للطلب'],
        autoApprovalEligible: false
      };
    }
  }

  /**
   * تقييم معايير التصعيد وتحديد المعايير المنطبقة
   */
  private evaluateEscalationCriteria(
    gisAnalysis: PointInPolygonResult,
    context: RequestContext
  ): EscalationCriteria[] {
    const applicableCriteria: EscalationCriteria[] = [];

    for (const criteria of this.escalationCriteria) {
      if (criteria.condition(gisAnalysis, context)) {
        applicableCriteria.push(criteria);
      }
    }

    // ترتيب المعايير حسب الأولوية (الأرقام الأصغر = أولوية أعلى)
    return applicableCriteria.sort((a, b) => a.priority - b.priority);
  }

  /**
   * تحديد أعلى مستوى تصعيد من المعايير المنطبقة
   */
  private determineHighestEscalation(criteria: EscalationCriteria[]): EscalationCriteria {
    if (criteria.length === 0) {
      // إذا لم تنطبق أي معايير تصعيد، استخدم المعالجة العادية على مستوى الفرع
      return {
        name: 'معالجة عادية',
        priority: 100,
        escalationLevel: 0,
        targetOffice: 'branch',
        reason: 'طلب عادي بدون معايير تصعيد',
        condition: () => true
      };
    }

    // إرجاع المعيار ذو أعلى مستوى تصعيد
    return criteria.reduce((highest, current) => 
      current.escalationLevel > highest.escalationLevel ? current : highest
    );
  }

  /**
   * تعيين الطلب للفرع والمكتب المناسب
   */
  private assignToOffice(
    gisAnalysis: PointInPolygonResult,
    escalation: EscalationCriteria
  ) {
    const governorate = gisAnalysis.governorate || 'صنعاء';
    const directorate = gisAnalysis.directorate || 'أمانة العاصمة';

    // خريطة المكاتب الإشرافية
    const supervisoryOffices: { [key: string]: string } = {
      'صنعاء': 'المكتب الإشرافي لأمانة العاصمة',
      'حضرموت': 'المكتب الإشرافي لحضرموت',
      'عدن': 'المكتب الإشرافي للمحافظات الجنوبية',
      'تعز': 'المكتب الإشرافي للمحافظات الوسطى',
      'إب': 'المكتب الإشرافي للمحافظات الوسطى',
      'الحديدة': 'المكتب الإشرافي للمحافظات الغربية'
    };

    // خريطة الفروع التنفيذية
    const executiveBranches: { [key: string]: string } = {
      'أمانة العاصمة': 'فرع أمانة العاصمة التنفيذي',
      'شبام': 'فرع حضرموت - مكتب شبام',
      'المكلا': 'فرع حضرموت - مكتب المكلا',
      'كريتر': 'فرع عدن - مكتب كريتر',
      'المعلا': 'فرع عدن - مكتب المعلا'
    };

    const supervisoryOffice = supervisoryOffices[governorate] || 'المكتب الإشرافي المركزي';
    const assignedBranch = executiveBranches[directorate] || `فرع ${governorate} التنفيذي`;

    let targetOffice = 'branch';
    if (escalation.escalationLevel >= 4) {
      targetOffice = 'ministerial';
    } else if (escalation.escalationLevel >= 2) {
      targetOffice = 'supervisory';
    } else if (escalation.escalationLevel >= 1) {
      targetOffice = 'specialized';
    }

    return {
      targetOffice,
      assignedBranch,
      supervisoryOffice
    };
  }

  /**
   * حساب مدة المعالجة المتوقعة
   */
  private calculateProcessingTime(
    escalation: EscalationCriteria,
    context: RequestContext
  ): number {
    let baseDays = 15; // مدة المعالجة الأساسية

    // تعديل حسب مستوى التصعيد
    switch (escalation.escalationLevel) {
      case 0: baseDays = 7; break;   // معالجة سريعة على مستوى الفرع
      case 1: baseDays = 15; break;  // معالجة عادية
      case 2: baseDays = 21; break;  // مراجعة إشرافية
      case 3: baseDays = 30; break;  // مراجعة متخصصة
      case 4: baseDays = 45; break;  // مراجعة وزارية
      case 5: baseDays = 60; break;  // مراجعة وزارية متقدمة
      case 6: baseDays = 90; break;  // مراجعة وزارية شاملة
    }

    // تعديل حسب حجم المشروع
    switch (context.projectSize) {
      case 'small': baseDays *= 1; break;
      case 'medium': baseDays *= 1.2; break;
      case 'large': baseDays *= 1.5; break;
      case 'mega': baseDays *= 2; break;
    }

    // تعديل حسب الأولوية
    switch (context.urgency) {
      case 'emergency': baseDays *= 0.5; break;
      case 'urgent': baseDays *= 0.7; break;
      case 'routine': baseDays *= 1; break;
    }

    // تعديل حسب اكتمال الوثائق
    if (!context.documentationComplete) {
      baseDays += 7;
    }

    return Math.ceil(baseDays);
  }

  /**
   * تحديد الموافقات والوثائق المطلوبة
   */
  private determineRequirements(
    escalation: EscalationCriteria,
    context: RequestContext
  ) {
    const approvals: string[] = [];
    const documents: string[] = [];

    // موافقات حسب مستوى التصعيد
    if (escalation.escalationLevel >= 1) {
      approvals.push('موافقة الفرع التنفيذي');
    }
    if (escalation.escalationLevel >= 2) {
      approvals.push('موافقة المكتب الإشرافي');
    }
    if (escalation.escalationLevel >= 4) {
      approvals.push('موافقة وزارية');
    }

    // وثائق حسب نوع المشروع
    switch (context.requestType) {
      case 'new_construction':
        documents.push('مخططات معمارية', 'دراسة جدوى', 'تقرير بيئي');
        break;
      case 'modification':
        documents.push('مخططات التعديل', 'تقرير هندسي');
        break;
      case 'demolition':
        documents.push('خطة الهدم', 'تقرير سلامة');
        break;
      case 'maintenance':
        documents.push('تقرير حالة المبنى');
        break;
    }

    return { approvals, documents };
  }

  /**
   * تحديد الأهلية للموافقة التلقائية
   */
  private isAutoApprovalEligible(
    escalation: EscalationCriteria,
    context: RequestContext
  ): boolean {
    // الموافقة التلقائية متاحة فقط للمشاريع البسيطة بدون مخاطر
    return escalation.escalationLevel === 0 &&
           context.projectSize === 'small' &&
           context.documentationComplete &&
           context.applicantType !== 'international';
  }

  /**
   * تهيئة معايير التصعيد حسب القوانين والقرارات الوزارية
   */
  private initializeEscalationCriteria() {
    this.escalationCriteria = [
      // معايير المناطق التراثية والأثرية (أولوية عليا)
      {
        name: 'مناطق التراث والآثار',
        priority: 1,
        escalationLevel: 6,
        targetOffice: 'ministerial',
        reason: 'الموقع ضمن منطقة تراثية - يتطلب موافقة وزارية ومراجعة لجنة التراث',
        condition: (analysis) => analysis.riskLayers.heritage
      },

      // معايير المناطق العسكرية والأمنية
      {
        name: 'المناطق العسكرية والأمنية',
        priority: 2,
        escalationLevel: 5,
        targetOffice: 'ministerial',
        reason: 'الموقع ضمن منطقة أمنية حساسة - يتطلب موافقات أمنية ووزارية',
        condition: (analysis) => analysis.riskLayers.military
      },

      // معايير المحميات الطبيعية والبيئة
      {
        name: 'المحميات الطبيعية والبيئية',
        priority: 3,
        escalationLevel: 4,
        targetOffice: 'ministerial',
        reason: 'الموقع ضمن محمية طبيعية - يتطلب دراسة تأثير بيئي وموافقة وزارة البيئة',
        condition: (analysis) => analysis.riskLayers.environmental
      },

      // معايير مناطق مخاطر الفيضانات
      {
        name: 'مناطق مخاطر الفيضانات',
        priority: 4,
        escalationLevel: 3,
        targetOffice: 'supervisory',
        reason: 'الموقع ضمن منطقة معرضة للفيضانات - يتطلب دراسة هيدرولوجية ومراجعة إشرافية',
        condition: (analysis) => analysis.riskLayers.flood
      },

      // معايير المشاريع الكبيرة (حسب القيمة)
      {
        name: 'المشاريع عالية القيمة',
        priority: 5,
        escalationLevel: 3,
        targetOffice: 'supervisory',
        reason: 'مشروع عالي القيمة - يتطلب مراجعة إشرافية متخصصة',
        condition: (analysis, context) => context.projectValue > 50_000_000 // 50 مليون ريال
      },

      // معايير المشاريع الضخمة (حسب الحجم)
      {
        name: 'المشاريع الضخمة',
        priority: 6,
        escalationLevel: 4,
        targetOffice: 'ministerial',
        reason: 'مشروع ضخم - يتطلب موافقة وزارية ولجان متخصصة',
        condition: (analysis, context) => context.projectSize === 'mega'
      },

      // معايير المشاريع الدولية
      {
        name: 'المشاريع الدولية',
        priority: 7,
        escalationLevel: 4,
        targetOffice: 'ministerial',
        reason: 'مشروع من جهة دولية - يتطلب موافقة وزارية ومراجعة قانونية',
        condition: (analysis, context) => context.applicantType === 'international'
      },

      // معايير المشاريع الحكومية
      {
        name: 'المشاريع الحكومية',
        priority: 8,
        escalationLevel: 2,
        targetOffice: 'supervisory',
        reason: 'مشروع حكومي - يتطلب مراجعة إشرافية للتنسيق بين الجهات',
        condition: (analysis, context) => context.applicantType === 'government'
      },

      // معايير الطوارئ
      {
        name: 'حالات الطوارئ',
        priority: 9,
        escalationLevel: 1,
        targetOffice: 'specialized',
        reason: 'حالة طوارئ - معالجة سريعة مع مراجعة متخصصة',
        condition: (analysis, context) => context.urgency === 'emergency'
      },

      // معايير المناطق غير المحددة إدارياً
      {
        name: 'مناطق غير محددة إدارياً',
        priority: 10,
        escalationLevel: 2,
        targetOffice: 'supervisory',
        reason: 'الموقع غير محدد إدارياً بوضوح - يتطلب مراجعة إشرافية لتحديد الاختصاص',
        condition: (analysis) => !analysis.isWithinBoundary || !analysis.governorate
      }
    ];
  }
}

export const escalationEngine = new EscalationEngine();