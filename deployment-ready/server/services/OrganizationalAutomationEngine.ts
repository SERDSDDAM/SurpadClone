// محرك أتمتة الهيكل التنظيمي والإداري
// تطوير شامل لإدارة الوزارات والمؤسسات والمنشآت والمستويات الوظيفية

interface OrganizationalLevel {
  id: string;
  name: string;
  nameAr: string;
  level: number; // 1=وزارة، 2=وكالة، 3=إدارة عامة، 4=إدارة، 5=قسم، 6=وحدة
  parentId?: string;
  type: 'ministry' | 'agency' | 'general_directorate' | 'directorate' | 'department' | 'section' | 'unit';
  code: string;
  isActive: boolean;
  responsibilities: Responsibility[];
  jobLevels: JobLevel[];
  organizationalUnits: OrganizationalUnit[];
  keywords: string[];
  location?: string;
  budget?: number;
  employeeCount?: number;
  contactInfo?: ContactInfo;
  establishedDate?: Date;
  regulations?: Regulation[];
}

interface JobLevel {
  id: string;
  title: string;
  titleAr: string;
  grade: number; // 1-15 (درجات الوظائف المدنية)
  category: 'executive' | 'supervisory' | 'technical' | 'administrative' | 'support';
  responsibilities: string[];
  requiredQualifications: string[];
  requiredExperience: number; // بالسنوات
  salary: SalaryRange;
  reportingTo?: string; // job level id
  subordinates?: string[]; // job level ids
  isLeadership: boolean;
  decisionAuthority: DecisionAuthority[];
  workingHours: number;
  benefits: string[];
}

interface OrganizationalUnit {
  id: string;
  name: string;
  nameAr: string;
  type: 'operational' | 'support' | 'strategic' | 'advisory';
  parentLevelId: string;
  objectives: string[];
  functions: OrganizationalFunction[];
  processes: BusinessProcess[];
  kpis: KPI[];
  resources: Resource[];
  isActive: boolean;
}

interface Responsibility {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  type: 'primary' | 'secondary' | 'shared' | 'coordinating';
  taskTypes: string[];
  sectors: string[];
  keywords: string[];
  authority: 'decision' | 'advisory' | 'coordination' | 'implementation';
  legalBasis?: string[];
  relatedRegulations?: string[];
  collaboratingEntities?: string[];
}

interface SalaryRange {
  minimum: number;
  maximum: number;
  currency: string;
  allowances: Allowance[];
}

interface Allowance {
  type: string;
  amount: number;
  isPercentage: boolean;
  conditions?: string[];
}

interface DecisionAuthority {
  type: string;
  description: string;
  financialLimit?: number;
  approvalRequired?: boolean;
  delegatable: boolean;
}

interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  fax?: string;
}

interface Regulation {
  id: string;
  title: string;
  type: string;
  issueDate: Date;
  status: 'active' | 'suspended' | 'cancelled';
  content: string;
}

interface OrganizationalFunction {
  id: string;
  name: string;
  description: string;
  type: 'core' | 'support' | 'regulatory' | 'advisory';
  inputs: string[];
  outputs: string[];
  tools: string[];
  frequency: string;
}

interface BusinessProcess {
  id: string;
  name: string;
  description: string;
  steps: ProcessStep[];
  duration: number;
  owner: string;
  stakeholders: string[];
  inputs: string[];
  outputs: string[];
  tools: string[];
}

interface ProcessStep {
  id: string;
  name: string;
  description: string;
  order: number;
  responsible: string;
  duration: number;
  dependencies: string[];
  deliverables: string[];
}

interface KPI {
  id: string;
  name: string;
  description: string;
  target: number;
  unit: string;
  frequency: string;
  responsible: string;
  formula?: string;
}

interface Resource {
  id: string;
  name: string;
  type: 'human' | 'financial' | 'technical' | 'physical';
  quantity: number;
  unit: string;
  status: 'available' | 'allocated' | 'unavailable';
}

interface TaskData {
  id?: string;
  title: string;
  description: string;
  type: string;
  sector: string;
  location: string;
  keywords: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complexity: 'simple' | 'moderate' | 'complex' | 'critical';
  estimatedTime?: string;
  budget?: number;
  requiredSkills: string[];
  requiredAuthorityLevel: number;
  geographicalScope: 'local' | 'regional' | 'national' | 'international';
  stakeholders: string[];
  legalRequirements?: string[];
  timeFrame: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

interface TaskAssignmentResult {
  assigned: boolean;
  organizationalLevelId?: string;
  organizationalLevelName?: string;
  unitId?: string;
  unitName?: string;
  jobLevelId?: string;
  jobLevelTitle?: string;
  confidence: number;
  message: string;
  nextSteps: NextStep[];
  recommendedActions: string[];
  alternativeOptions?: AssignmentOption[];
  estimatedCompletion?: Date;
  requiredResources?: Resource[];
  riskFactors?: RiskFactor[];
}

interface NextStep {
  step: number;
  title: string;
  description: string;
  estimatedTime: string;
  responsible: string;
  dependencies?: string[];
  deliverables?: string[];
}

interface AssignmentOption {
  organizationalLevelId: string;
  organizationalLevelName: string;
  confidence: number;
  pros: string[];
  cons: string[];
  estimatedTime: string;
}

interface RiskFactor {
  type: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string[];
}

export class OrganizationalAutomationEngine {
  private organizationalLevels: Map<string, OrganizationalLevel> = new Map();
  private jobLevels: Map<string, JobLevel> = new Map();

  constructor() {
    this.initializeDefaultStructure();
  }

  // تهيئة الهيكل التنظيمي الافتراضي لوزارة النقل والأشغال العامة
  private initializeDefaultStructure() {
    // الوزارة (المستوى 1)
    const ministry: OrganizationalLevel = {
      id: 'ministry-transport-public-works',
      name: 'Ministry of Transport and Public Works',
      nameAr: 'وزارة النقل والأشغال العامة',
      level: 1,
      type: 'ministry',
      code: 'MTPW',
      isActive: true,
      responsibilities: [
        {
          id: 'resp-1',
          title: 'Transport Policy Development',
          titleAr: 'وضع سياسات النقل',
          description: 'تطوير وتنفيذ السياسات الوطنية للنقل والمواصلات',
          type: 'primary',
          taskTypes: ['policy_development', 'strategic_planning'],
          sectors: ['transport', 'logistics'],
          keywords: ['نقل', 'مواصلات', 'سياسات', 'استراتيجية'],
          authority: 'decision',
          legalBasis: ['قانون النقل رقم 1 لسنة 2010']
        }
      ],
      jobLevels: [
        {
          id: 'minister',
          title: 'Minister',
          titleAr: 'الوزير',
          grade: 15,
          category: 'executive',
          responsibilities: ['إدارة الوزارة', 'اتخاذ القرارات الاستراتيجية', 'التمثيل السياسي'],
          requiredQualifications: ['درجة جامعية عليا', 'خبرة إدارية واسعة'],
          requiredExperience: 15,
          salary: {
            minimum: 500000,
            maximum: 600000,
            currency: 'YER',
            allowances: [
              { type: 'representation', amount: 100000, isPercentage: false },
              { type: 'transport', amount: 50000, isPercentage: false }
            ]
          },
          isLeadership: true,
          decisionAuthority: [
            {
              type: 'budget_approval',
              description: 'الموافقة على الميزانيات',
              financialLimit: 10000000,
              approvalRequired: false,
              delegatable: true
            }
          ],
          workingHours: 40,
          benefits: ['تأمين صحي شامل', 'سكن رسمي', 'حراسة']
        }
      ],
      organizationalUnits: [],
      keywords: ['وزارة', 'نقل', 'أشغال عامة', 'مواصلات'],
      location: 'صنعاء - اليمن',
      establishedDate: new Date('1962-01-01'),
      contactInfo: {
        phone: '+967-1-123456',
        email: 'info@mtpw.gov.ye',
        address: 'شارع الزبيري، صنعاء، اليمن'
      }
    };

    this.organizationalLevels.set(ministry.id, ministry);

    // وكالة الوزارة (المستوى 2)
    const deputyMinistry: OrganizationalLevel = {
      id: 'deputy-ministry-transport',
      name: 'Deputy Ministry for Transport',
      nameAr: 'وكالة الوزارة لشؤون النقل',
      level: 2,
      type: 'agency',
      code: 'DMT',
      parentId: 'ministry-transport-public-works',
      isActive: true,
      responsibilities: [
        {
          id: 'resp-2',
          title: 'Transport Operations Management',
          titleAr: 'إدارة عمليات النقل',
          description: 'الإشراف على جميع عمليات النقل والمواصلات',
          type: 'primary',
          taskTypes: ['operations_management', 'coordination'],
          sectors: ['transport'],
          keywords: ['عمليات', 'نقل', 'إشراف', 'تنسيق'],
          authority: 'implementation'
        }
      ],
      jobLevels: [
        {
          id: 'deputy-minister',
          title: 'Deputy Minister',
          titleAr: 'وكيل الوزارة',
          grade: 14,
          category: 'executive',
          responsibilities: ['مساعدة الوزير', 'إدارة العمليات اليومية', 'التنسيق بين الإدارات'],
          requiredQualifications: ['درجة جامعية عليا', 'خبرة إدارية متقدمة'],
          requiredExperience: 12,
          salary: {
            minimum: 400000,
            maximum: 450000,
            currency: 'YER',
            allowances: [
              { type: 'representation', amount: 75000, isPercentage: false }
            ]
          },
          reportingTo: 'minister',
          isLeadership: true,
          decisionAuthority: [
            {
              type: 'operational_decisions',
              description: 'القرارات التشغيلية',
              financialLimit: 5000000,
              approvalRequired: false,
              delegatable: true
            }
          ],
          workingHours: 40,
          benefits: ['تأمين صحي', 'بدل نقل']
        }
      ],
      organizationalUnits: [],
      keywords: ['وكالة', 'نقل', 'عمليات'],
      location: 'صنعاء - اليمن'
    };

    this.organizationalLevels.set(deputyMinistry.id, deputyMinistry);

    // الإدارة العامة للطرق (المستوى 3)
    const roadsDirectorate: OrganizationalLevel = {
      id: 'general-directorate-roads',
      name: 'General Directorate of Roads',
      nameAr: 'الإدارة العامة للطرق',
      level: 3,
      type: 'general_directorate',
      code: 'GDR',
      parentId: 'deputy-ministry-transport',
      isActive: true,
      responsibilities: [
        {
          id: 'resp-3',
          title: 'Roads Development and Maintenance',
          titleAr: 'تطوير وصيانة الطرق',
          description: 'التخطيط والتطوير والصيانة لشبكة الطرق الوطنية',
          type: 'primary',
          taskTypes: ['infrastructure_development', 'maintenance', 'planning'],
          sectors: ['roads', 'infrastructure'],
          keywords: ['طرق', 'تطوير', 'صيانة', 'شبكة', 'بنية تحتية'],
          authority: 'implementation',
          legalBasis: ['قانون الطرق رقم 5 لسنة 2008']
        }
      ],
      jobLevels: [
        {
          id: 'general-director-roads',
          title: 'General Director of Roads',
          titleAr: 'المدير العام للطرق',
          grade: 13,
          category: 'executive',
          responsibilities: ['إدارة قطاع الطرق', 'التخطيط الاستراتيجي', 'الإشراف على المشاريع'],
          requiredQualifications: ['هندسة مدنية أو طرق', 'ماجستير أو دكتوراه'],
          requiredExperience: 10,
          salary: {
            minimum: 350000,
            maximum: 400000,
            currency: 'YER',
            allowances: [
              { type: 'technical', amount: 50000, isPercentage: false }
            ]
          },
          reportingTo: 'deputy-minister',
          isLeadership: true,
          decisionAuthority: [
            {
              type: 'project_approval',
              description: 'الموافقة على مشاريع الطرق',
              financialLimit: 2000000,
              approvalRequired: false,
              delegatable: true
            }
          ],
          workingHours: 40,
          benefits: ['تأمين صحي', 'بدل نقل', 'بدل فني']
        }
      ],
      organizationalUnits: [
        {
          id: 'roads-planning-unit',
          name: 'Roads Planning Unit',
          nameAr: 'وحدة تخطيط الطرق',
          type: 'strategic',
          parentLevelId: 'general-directorate-roads',
          objectives: ['التخطيط الاستراتيجي لشبكة الطرق', 'دراسات الجدوى', 'التصميم الهندسي'],
          functions: [
            {
              id: 'func-1',
              name: 'Strategic Planning',
              description: 'التخطيط الاستراتيجي لشبكة الطرق الوطنية',
              type: 'core',
              inputs: ['البيانات المرورية', 'الخرائط', 'الدراسات الاقتصادية'],
              outputs: ['خطط استراتيجية', 'تصاميم هندسية', 'دراسات جدوى'],
              tools: ['CAD', 'GIS', 'Traffic Analysis Software'],
              frequency: 'سنوي'
            }
          ],
          processes: [],
          kpis: [
            {
              id: 'kpi-1',
              name: 'Project Completion Rate',
              description: 'معدل إنجاز مشاريع الطرق',
              target: 85,
              unit: '%',
              frequency: 'ربع سنوي',
              responsible: 'general-director-roads'
            }
          ],
          resources: [
            {
              id: 'res-1',
              name: 'Civil Engineers',
              type: 'human',
              quantity: 15,
              unit: 'person',
              status: 'allocated'
            }
          ],
          isActive: true
        }
      ],
      keywords: ['طرق', 'إدارة عامة', 'تطوير', 'صيانة'],
      location: 'صنعاء - اليمن',
      budget: 50000000,
      employeeCount: 150
    };

    this.organizationalLevels.set(roadsDirectorate.id, roadsDirectorate);
  }

  // تعيين المهام تلقائياً
  async assignTask(taskData: TaskData): Promise<TaskAssignmentResult> {
    // 1. جلب جميع المستويات التنظيمية
    const allLevels = Array.from(this.organizationalLevels.values());
    
    // 2. تحديد أفضل مستوى تنظيمي للمهمة
    const bestMatch = this.findBestOrganizationalLevel(allLevels, taskData);
    
    if (!bestMatch) {
      return {
        assigned: false,
        confidence: 0,
        message: "لم يتم العثور على مستوى تنظيمي مناسب لهذه المهمة",
        nextSteps: [],
        recommendedActions: [
          "مراجعة تعريف المهمة",
          "إضافة مستوى تنظيمي جديد للهيكل",
          "تحديث المسؤوليات والاختصاصات"
        ]
      };
    }

    // 3. تحديد أفضل وحدة تنظيمية
    const bestUnit = this.findBestOrganizationalUnit(bestMatch.organizationalUnits, taskData);
    
    // 4. تحديد المستوى الوظيفي المناسب
    const bestJobLevel = this.findBestJobLevel(bestMatch.jobLevels, taskData);
    
    // 5. حساب درجة الثقة
    const confidence = this.calculateAssignmentConfidence(bestMatch, taskData);
    
    // 6. تحديد الخطوات التالية
    const nextSteps = this.generateNextSteps(bestMatch, bestUnit, bestJobLevel, taskData);
    
    // 7. تحديد المخاطر المحتملة
    const riskFactors = this.assessRiskFactors(taskData, bestMatch);
    
    // 8. تقدير الموارد المطلوبة
    const requiredResources = this.estimateRequiredResources(taskData, bestMatch);

    return {
      assigned: true,
      organizationalLevelId: bestMatch.id,
      organizationalLevelName: bestMatch.nameAr,
      unitId: bestUnit?.id,
      unitName: bestUnit?.nameAr,
      jobLevelId: bestJobLevel?.id,
      jobLevelTitle: bestJobLevel?.titleAr,
      confidence,
      message: `تم تعيين المهمة إلى ${bestMatch.nameAr}${bestUnit ? ` - ${bestUnit.nameAr}` : ''}${bestJobLevel ? ` (المسؤول: ${bestJobLevel.titleAr})` : ''}`,
      nextSteps,
      recommendedActions: this.generateRecommendedActions(taskData, bestMatch),
      alternativeOptions: this.findAlternativeOptions(allLevels, taskData, bestMatch.id),
      estimatedCompletion: this.estimateCompletionDate(taskData, bestMatch),
      requiredResources,
      riskFactors
    };
  }

  private findBestOrganizationalLevel(levels: OrganizationalLevel[], taskData: TaskData): OrganizationalLevel | null {
    let bestScore = 0;
    let bestLevel: OrganizationalLevel | null = null;

    for (const level of levels) {
      const score = this.calculateLevelMatchScore(level, taskData);
      
      if (score > bestScore) {
        bestScore = score;
        bestLevel = level;
      }
    }

    return bestLevel;
  }

  private calculateLevelMatchScore(level: OrganizationalLevel, taskData: TaskData): number {
    let score = 0;
    
    // تقييم التطابق مع المسؤوليات
    for (const responsibility of level.responsibilities) {
      if (this.matchesResponsibility(responsibility, taskData)) {
        score += this.getResponsibilityWeight(responsibility.type);
      }
    }
    
    // تقييم التطابق مع الكلمات المفتاحية
    const keywordMatches = taskData.keywords.filter(k => 
      level.keywords.some(lk => lk.includes(k) || k.includes(lk))
    ).length;
    score += keywordMatches * 0.3;
    
    // تقييم التطابق مع المستوى التنظيمي
    score += this.getLevelTypeWeight(level.type, taskData);
    
    // تقييم التطابق مع الموقع الجغرافي
    if (level.location && taskData.location) {
      if (level.location.includes(taskData.location) || taskData.location.includes(level.location)) {
        score += 0.2;
      }
    }
    
    return score;
  }

  private matchesResponsibility(responsibility: Responsibility, taskData: TaskData): boolean {
    // التحقق من أنواع المهام
    if (responsibility.taskTypes.includes(taskData.type)) {
      return true;
    }
    
    // التحقق من القطاعات
    if (responsibility.sectors.includes(taskData.sector)) {
      return true;
    }
    
    // التحقق من الكلمات المفتاحية
    for (const keyword of taskData.keywords) {
      if (responsibility.keywords.some(rk => rk.includes(keyword) || keyword.includes(rk))) {
        return true;
      }
    }
    
    return false;
  }

  private getResponsibilityWeight(type: string): number {
    const weights = {
      'primary': 1.0,
      'secondary': 0.7,
      'shared': 0.5,
      'coordinating': 0.3
    };
    return weights[type] || 0.5;
  }

  private getLevelTypeWeight(type: string, taskData: TaskData): number {
    // وزن المستويات التنظيمية حسب نوع المهمة
    const complexityWeights = {
      'simple': {
        'unit': 0.8,
        'section': 0.6,
        'department': 0.4,
        'directorate': 0.2,
        'general_directorate': 0.1,
        'agency': 0.05,
        'ministry': 0.02
      },
      'moderate': {
        'unit': 0.6,
        'section': 0.8,
        'department': 0.7,
        'directorate': 0.5,
        'general_directorate': 0.3,
        'agency': 0.1,
        'ministry': 0.05
      },
      'complex': {
        'unit': 0.2,
        'section': 0.4,
        'department': 0.6,
        'directorate': 0.8,
        'general_directorate': 0.7,
        'agency': 0.5,
        'ministry': 0.3
      },
      'critical': {
        'unit': 0.1,
        'section': 0.2,
        'department': 0.3,
        'directorate': 0.5,
        'general_directorate': 0.7,
        'agency': 0.8,
        'ministry': 0.9
      }
    };
    
    return complexityWeights[taskData.complexity]?.[type] || 0.3;
  }

  private findBestOrganizationalUnit(units: OrganizationalUnit[], taskData: TaskData): OrganizationalUnit | null {
    if (!units || units.length === 0) {
      return null;
    }
    
    let bestScore = 0;
    let bestUnit: OrganizationalUnit | null = null;

    for (const unit of units) {
      const score = this.calculateUnitMatchScore(unit, taskData);
      
      if (score > bestScore) {
        bestScore = score;
        bestUnit = unit;
      }
    }

    return bestUnit;
  }

  private calculateUnitMatchScore(unit: OrganizationalUnit, taskData: TaskData): number {
    let score = 0;
    
    // تقييم التطابق مع أهداف الوحدة
    for (const objective of unit.objectives) {
      const objectiveKeywords = objective.split(' ');
      const matches = taskData.keywords.filter(k => 
        objectiveKeywords.some(ok => ok.includes(k) || k.includes(ok))
      ).length;
      score += matches * 0.2;
    }
    
    // تقييم التطابق مع نوع الوحدة
    const typeWeight = this.getUnitTypeWeight(unit.type, taskData);
    score += typeWeight;
    
    return score;
  }

  private getUnitTypeWeight(type: string, taskData: TaskData): number {
    const weights = {
      'operational': taskData.type.includes('implementation') ? 0.8 : 0.4,
      'support': taskData.type.includes('support') ? 0.8 : 0.3,
      'strategic': taskData.type.includes('planning') ? 0.8 : 0.2,
      'advisory': taskData.type.includes('consultation') ? 0.8 : 0.1
    };
    return weights[type] || 0.3;
  }

  private findBestJobLevel(jobLevels: JobLevel[], taskData: TaskData): JobLevel | null {
    if (!jobLevels || jobLevels.length === 0) {
      return null;
    }
    
    let bestScore = 0;
    let bestJobLevel: JobLevel | null = null;

    for (const jobLevel of jobLevels) {
      const score = this.calculateJobLevelMatchScore(jobLevel, taskData);
      
      if (score > bestScore) {
        bestScore = score;
        bestJobLevel = jobLevel;
      }
    }

    return bestJobLevel;
  }

  private calculateJobLevelMatchScore(jobLevel: JobLevel, taskData: TaskData): number {
    let score = 0;
    
    // تقييم مستوى السلطة المطلوب
    if (taskData.requiredAuthorityLevel <= jobLevel.grade) {
      score += 0.5;
    }
    
    // تقييم القدرة على اتخاذ القرارات
    if (jobLevel.isLeadership && (taskData.priority === 'high' || taskData.priority === 'urgent')) {
      score += 0.3;
    }
    
    // تقييم الصلاحيات المالية
    if (taskData.budget && jobLevel.decisionAuthority.some(da => 
      da.financialLimit && da.financialLimit >= taskData.budget
    )) {
      score += 0.4;
    }
    
    return score;
  }

  private calculateAssignmentConfidence(level: OrganizationalLevel, taskData: TaskData): number {
    const maxScore = level.responsibilities.length + level.keywords.length * 0.3 + 1;
    const actualScore = this.calculateLevelMatchScore(level, taskData);
    return Math.min(actualScore / maxScore, 1);
  }

  private generateNextSteps(
    level: OrganizationalLevel, 
    unit: OrganizationalUnit | null, 
    jobLevel: JobLevel | null, 
    taskData: TaskData
  ): NextStep[] {
    const steps: NextStep[] = [];
    
    // الخطوة 1: إرسال المهمة
    steps.push({
      step: 1,
      title: "إرسال وتسجيل المهمة",
      description: `تم إرسال المهمة إلى ${level.nameAr}${unit ? ` - ${unit.nameAr}` : ''}`,
      estimatedTime: "فوري",
      responsible: "النظام الآلي",
      deliverables: ["تأكيد الاستلام", "رقم المرجع"]
    });

    // الخطوة 2: تعيين المسؤول
    if (jobLevel) {
      steps.push({
        step: 2,
        title: "تعيين المسؤول المباشر",
        description: `سيتم تعيين ${jobLevel.titleAr} للإشراف على تنفيذ المهمة`,
        estimatedTime: "4 ساعات عمل",
        responsible: level.nameAr,
        deliverables: ["قرار التعيين", "خطة العمل الأولية"]
      });
    }

    // الخطوة 3: تحليل المتطلبات
    steps.push({
      step: 3,
      title: "تحليل المتطلبات والموارد",
      description: "دراسة تفصيلية للمتطلبات وتحديد الموارد اللازمة",
      estimatedTime: this.getAnalysisTime(taskData.complexity),
      responsible: jobLevel?.titleAr || "رئيس الوحدة المختصة",
      deliverables: ["تقرير تحليل المتطلبات", "قائمة الموارد المطلوبة"]
    });

    // الخطوة 4: وضع خطة التنفيذ
    steps.push({
      step: 4,
      title: "وضع خطة التنفيذ التفصيلية",
      description: "إعداد خطة تنفيذ شاملة مع الجدول الزمني والمعالم",
      estimatedTime: this.getPlanningTime(taskData.complexity),
      responsible: jobLevel?.titleAr || "فريق التخطيط",
      deliverables: ["خطة التنفيذ", "الجدول الزمني", "مخطط المخاطر"]
    });

    // الخطوة 5: بدء التنفيذ
    steps.push({
      step: 5,
      title: "بدء التنفيذ",
      description: "البدء في تنفيذ المهمة وفقاً للخطة المعتمدة",
      estimatedTime: taskData.estimatedTime || this.getExecutionTime(taskData.complexity),
      responsible: "فريق التنفيذ",
      deliverables: ["تقارير دورية", "تحديثات الوضع"]
    });

    return steps;
  }

  private getAnalysisTime(complexity: string): string {
    const times = {
      'simple': '1 يوم عمل',
      'moderate': '3 أيام عمل',
      'complex': '1 أسبوع',
      'critical': '2 أسبوع'
    };
    return times[complexity] || '3 أيام عمل';
  }

  private getPlanningTime(complexity: string): string {
    const times = {
      'simple': '2 أيام عمل',
      'moderate': '1 أسبوع',
      'complex': '2 أسبوع',
      'critical': '1 شهر'
    };
    return times[complexity] || '1 أسبوع';
  }

  private getExecutionTime(complexity: string): string {
    const times = {
      'simple': '1-2 أسبوع',
      'moderate': '1-2 شهر',
      'complex': '3-6 أشهر',
      'critical': '6-12 شهر'
    };
    return times[complexity] || '1-2 شهر';
  }

  private generateRecommendedActions(taskData: TaskData, level: OrganizationalLevel): string[] {
    const actions: string[] = [];
    
    // توصيات حسب الأولوية
    if (taskData.priority === 'urgent') {
      actions.push("تشكيل فريق طوارئ للتنفيذ السريع");
      actions.push("تخصيص موارد إضافية");
      actions.push("إعداد تقارير يومية");
    }
    
    // توصيات حسب التعقيد
    if (taskData.complexity === 'complex' || taskData.complexity === 'critical') {
      actions.push("تشكيل لجنة توجيهية عليا");
      actions.push("تقسيم المهمة إلى مراحل");
      actions.push("إشراك خبراء استشاريين");
    }
    
    // توصيات حسب الميزانية
    if (taskData.budget && taskData.budget > 1000000) {
      actions.push("إعداد دراسة جدوى اقتصادية");
      actions.push("الحصول على موافقات مالية");
      actions.push("وضع آلية مراقبة الإنفاق");
    }
    
    return actions;
  }

  private findAlternativeOptions(
    levels: OrganizationalLevel[], 
    taskData: TaskData, 
    excludeId: string
  ): AssignmentOption[] {
    const alternatives: AssignmentOption[] = [];
    
    for (const level of levels) {
      if (level.id === excludeId) continue;
      
      const score = this.calculateLevelMatchScore(level, taskData);
      if (score > 0.3) {
        alternatives.push({
          organizationalLevelId: level.id,
          organizationalLevelName: level.nameAr,
          confidence: score,
          pros: this.getAlternativePros(level, taskData),
          cons: this.getAlternativeCons(level, taskData),
          estimatedTime: this.getExecutionTime(taskData.complexity)
        });
      }
    }
    
    return alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  private getAlternativePros(level: OrganizationalLevel, taskData: TaskData): string[] {
    const pros: string[] = [];
    
    if (level.level < 3) {
      pros.push("سلطة قرار أعلى");
    }
    
    if (level.employeeCount && level.employeeCount > 100) {
      pros.push("موارد بشرية أكبر");
    }
    
    if (level.budget && level.budget > 10000000) {
      pros.push("إمكانيات مالية أكبر");
    }
    
    return pros;
  }

  private getAlternativeCons(level: OrganizationalLevel, taskData: TaskData): string[] {
    const cons: string[] = [];
    
    if (level.level < 3) {
      cons.push("قد تكون أكثر تعقيداً إدارياً");
    }
    
    if (!level.responsibilities.some(r => r.taskTypes.includes(taskData.type))) {
      cons.push("ليس من الاختصاص المباشر");
    }
    
    return cons;
  }

  private assessRiskFactors(taskData: TaskData, level: OrganizationalLevel): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    // مخاطر الميزانية
    if (taskData.budget && (!level.budget || taskData.budget > level.budget * 0.5)) {
      risks.push({
        type: "مالي",
        description: "الميزانية المطلوبة كبيرة نسبياً",
        probability: "medium",
        impact: "high",
        mitigation: ["تقسيم التمويل على مراحل", "البحث عن مصادر تمويل إضافية"]
      });
    }
    
    // مخاطر الوقت
    if (taskData.timeFrame === 'immediate') {
      risks.push({
        type: "زمني",
        description: "الإطار الزمني ضيق جداً",
        probability: "high",
        impact: "medium",
        mitigation: ["تشكيل فريق طوارئ", "العمل بنظام الورديات", "تأجيل المهام غير العاجلة"]
      });
    }
    
    // مخاطر التعقيد
    if (taskData.complexity === 'critical') {
      risks.push({
        type: "تقني",
        description: "المهمة معقدة جداً وتتطلب خبرات متخصصة",
        probability: "medium",
        impact: "high",
        mitigation: ["إشراك خبراء استشاريين", "التدريب المتقدم للفريق", "وضع خطط بديلة"]
      });
    }
    
    return risks;
  }

  private estimateRequiredResources(taskData: TaskData, level: OrganizationalLevel): Resource[] {
    const resources: Resource[] = [];
    
    // موارد بشرية
    const humanResourcesCount = this.estimateHumanResources(taskData.complexity);
    resources.push({
      id: 'human-resources',
      name: 'موارد بشرية',
      type: 'human',
      quantity: humanResourcesCount,
      unit: 'شخص',
      status: 'available'
    });
    
    // موارد مالية
    if (taskData.budget) {
      resources.push({
        id: 'financial-resources',
        name: 'موارد مالية',
        type: 'financial',
        quantity: taskData.budget,
        unit: 'ريال',
        status: 'available'
      });
    }
    
    // موارد تقنية
    if (taskData.requiredSkills.some(skill => skill.includes('تقني'))) {
      resources.push({
        id: 'technical-resources',
        name: 'معدات ومعدات تقنية',
        type: 'technical',
        quantity: 1,
        unit: 'مجموعة',
        status: 'available'
      });
    }
    
    return resources;
  }

  private estimateHumanResources(complexity: string): number {
    const estimates = {
      'simple': 2,
      'moderate': 5,
      'complex': 10,
      'critical': 20
    };
    return estimates[complexity] || 5;
  }

  private estimateCompletionDate(taskData: TaskData, level: OrganizationalLevel): Date {
    const now = new Date();
    const daysToAdd = this.getEstimatedDays(taskData.complexity, taskData.timeFrame);
    
    const completionDate = new Date(now);
    completionDate.setDate(now.getDate() + daysToAdd);
    
    return completionDate;
  }

  private getEstimatedDays(complexity: string, timeFrame: string): number {
    const baseDays = {
      'simple': 7,
      'moderate': 30,
      'complex': 90,
      'critical': 180
    };
    
    const timeFrameMultiplier = {
      'immediate': 0.5,
      'short_term': 0.7,
      'medium_term': 1.0,
      'long_term': 1.5
    };
    
    return Math.ceil((baseDays[complexity] || 30) * (timeFrameMultiplier[timeFrame] || 1.0));
  }

  // إضافة مستوى تنظيمي جديد
  async addOrganizationalLevel(levelData: Partial<OrganizationalLevel>): Promise<{success: boolean, message: string, level?: OrganizationalLevel}> {
    try {
      // التحقق من صحة البيانات
      if (!levelData.name || !levelData.nameAr || !levelData.type) {
        return {
          success: false,
          message: "البيانات الأساسية مطلوبة (الاسم، النوع)"
        };
      }

      // إنشاء ID فريد
      const id = this.generateUniqueId(levelData.type, levelData.name);
      
      // تحديد المستوى التلقائي بناءً على النوع والوالد
      const level = this.determineLevel(levelData.type, levelData.parentId);
      
      const newLevel: OrganizationalLevel = {
        id,
        name: levelData.name!,
        nameAr: levelData.nameAr!,
        level,
        type: levelData.type!,
        code: levelData.code || this.generateCode(levelData.nameAr!),
        parentId: levelData.parentId,
        isActive: levelData.isActive ?? true,
        responsibilities: levelData.responsibilities || [],
        jobLevels: levelData.jobLevels || [],
        organizationalUnits: levelData.organizationalUnits || [],
        keywords: levelData.keywords || [],
        location: levelData.location,
        budget: levelData.budget,
        employeeCount: levelData.employeeCount,
        contactInfo: levelData.contactInfo,
        establishedDate: levelData.establishedDate || new Date(),
        regulations: levelData.regulations || []
      };

      // حفظ في قاعدة البيانات (محاكاة)
      this.organizationalLevels.set(id, newLevel);

      return {
        success: true,
        message: `تم إضافة ${newLevel.nameAr} بنجاح`,
        level: newLevel
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ في إضافة المستوى التنظيمي: ${error.message}`
      };
    }
  }

  private generateUniqueId(type: string, name: string): string {
    const timestamp = Date.now();
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '-');
    return `${type}-${sanitizedName}-${timestamp}`;
  }

  private determineLevel(type: string, parentId?: string): number {
    const typeLevels = {
      'ministry': 1,
      'agency': 2,
      'general_directorate': 3,
      'directorate': 4,
      'department': 5,
      'section': 6,
      'unit': 7
    };
    
    if (parentId) {
      const parent = this.organizationalLevels.get(parentId);
      if (parent) {
        return parent.level + 1;
      }
    }
    
    return typeLevels[type] || 5;
  }

  private generateCode(nameAr: string): string {
    // استخراج أول حرف من كل كلمة
    const words = nameAr.split(' ');
    return words.map(word => word.charAt(0)).join('').toUpperCase();
  }

  // الحصول على جميع المستويات التنظيمية
  async getAllOrganizationalLevels(): Promise<OrganizationalLevel[]> {
    return Array.from(this.organizationalLevels.values());
  }

  // الحصول على الهيكل التنظيمي الهرمي
  async getOrganizationalHierarchy(): Promise<{hierarchy: any, totalLevels: number, totalEntities: number}> {
    const allLevels = Array.from(this.organizationalLevels.values());
    const hierarchy = this.buildHierarchy(allLevels);
    
    return {
      hierarchy,
      totalLevels: this.getMaxLevel(allLevels),
      totalEntities: allLevels.length
    };
  }

  private buildHierarchy(levels: OrganizationalLevel[]): any {
    const hierarchy = {};
    
    // تجميع حسب النوع
    for (const level of levels) {
      if (!hierarchy[level.type]) {
        hierarchy[level.type] = [];
      }
      hierarchy[level.type].push({
        id: level.id,
        name: level.nameAr,
        code: level.code,
        level: level.level,
        parentId: level.parentId,
        isActive: level.isActive,
        employeeCount: level.employeeCount,
        budget: level.budget
      });
    }
    
    return hierarchy;
  }

  private getMaxLevel(levels: OrganizationalLevel[]): number {
    return Math.max(...levels.map(l => l.level));
  }

  // إضافة مستوى وظيفي جديد
  async addJobLevel(levelId: string, jobLevelData: Partial<JobLevel>): Promise<{success: boolean, message: string, jobLevel?: JobLevel}> {
    try {
      const organizationalLevel = this.organizationalLevels.get(levelId);
      if (!organizationalLevel) {
        return {
          success: false,
          message: "المستوى التنظيمي غير موجود"
        };
      }

      const jobLevel: JobLevel = {
        id: this.generateUniqueId('job', jobLevelData.title || 'position'),
        title: jobLevelData.title || '',
        titleAr: jobLevelData.titleAr || '',
        grade: jobLevelData.grade || 1,
        category: jobLevelData.category || 'administrative',
        responsibilities: jobLevelData.responsibilities || [],
        requiredQualifications: jobLevelData.requiredQualifications || [],
        requiredExperience: jobLevelData.requiredExperience || 0,
        salary: jobLevelData.salary || {
          minimum: 100000,
          maximum: 150000,
          currency: 'YER',
          allowances: []
        },
        reportingTo: jobLevelData.reportingTo,
        subordinates: jobLevelData.subordinates || [],
        isLeadership: jobLevelData.isLeadership || false,
        decisionAuthority: jobLevelData.decisionAuthority || [],
        workingHours: jobLevelData.workingHours || 40,
        benefits: jobLevelData.benefits || []
      };

      organizationalLevel.jobLevels.push(jobLevel);
      this.organizationalLevels.set(levelId, organizationalLevel);

      return {
        success: true,
        message: `تم إضافة المستوى الوظيفي ${jobLevel.titleAr} بنجاح`,
        jobLevel
      };
    } catch (error) {
      return {
        success: false,
        message: `خطأ في إضافة المستوى الوظيفي: ${error.message}`
      };
    }
  }

  // البحث في الهيكل التنظيمي
  async searchOrganizationalStructure(query: string): Promise<{
    levels: OrganizationalLevel[],
    jobLevels: JobLevel[],
    units: OrganizationalUnit[],
    totalResults: number
  }> {
    const allLevels = Array.from(this.organizationalLevels.values());
    const searchTerm = query.toLowerCase();
    
    const matchingLevels = allLevels.filter(level => 
      level.name.toLowerCase().includes(searchTerm) ||
      level.nameAr.includes(searchTerm) ||
      level.keywords.some(k => k.includes(searchTerm))
    );
    
    const matchingJobLevels: JobLevel[] = [];
    const matchingUnits: OrganizationalUnit[] = [];
    
    for (const level of allLevels) {
      // البحث في المستويات الوظيفية
      const jobLevels = level.jobLevels.filter(jl =>
        jl.title.toLowerCase().includes(searchTerm) ||
        jl.titleAr.includes(searchTerm) ||
        jl.responsibilities.some(r => r.includes(searchTerm))
      );
      matchingJobLevels.push(...jobLevels);
      
      // البحث في الوحدات التنظيمية
      const units = level.organizationalUnits.filter(unit =>
        unit.name.toLowerCase().includes(searchTerm) ||
        unit.nameAr.includes(searchTerm) ||
        unit.objectives.some(obj => obj.includes(searchTerm))
      );
      matchingUnits.push(...units);
    }
    
    return {
      levels: matchingLevels,
      jobLevels: matchingJobLevels,
      units: matchingUnits,
      totalResults: matchingLevels.length + matchingJobLevels.length + matchingUnits.length
    };
  }
}