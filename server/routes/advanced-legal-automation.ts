// API routes للمحرك المتقدم للأتمتة القانونية
import { Router } from 'express';
import { AdvancedLegalAutomationEngine, ServiceRequest } from '../services/AdvancedLegalAutomationEngine';
import { z } from 'zod';

const router = Router();
const automationEngine = new AdvancedLegalAutomationEngine();

// تحديد schema للتحقق من صحة البيانات
const ServiceRequestSchema = z.object({
  serviceId: z.string(),
  serviceType: z.enum(['building_permit', 'demolition_permit', 'fencing_permit', 'occupancy_certificate']),
  projectData: z.object({
    area_sqm: z.number().optional(),
    height_m: z.number().optional(),
    floors: z.number().optional(),
    location: z.string().optional(),
    building_type: z.enum(['residential', 'commercial', 'industrial', 'mixed']).optional(),
    has_survey: z.boolean().optional(),
    has_structural_report: z.boolean().optional(),
    parking_spaces: z.number().optional(),
    setback_front: z.number().optional(),
    setback_sides: z.number().optional(),
    owner_type: z.enum(['individual', 'company', 'government']).optional(),
    project_value: z.number().optional(),
    contractor_license: z.string().optional(),
    architect_license: z.string().optional(),
    urgency_level: z.enum(['normal', 'urgent', 'emergency']).optional(),
    documents_submitted: z.array(z.string()).optional(),
    environmental_clearance: z.boolean().optional(),
    utilities_approval: z.boolean().optional(),
  }).optional(),
  applicantData: z.object({
    nationality: z.enum(['yemeni', 'foreign']).optional(),
    id_type: z.enum(['national_id', 'passport', 'residence_permit']).optional(),
    previous_violations: z.boolean().optional(),
    outstanding_fees: z.number().optional(),
  }).optional(),
  locationData: z.object({
    district: z.string().optional(),
    zone_type: z.enum(['residential', 'commercial', 'industrial', 'mixed', 'heritage']).optional(),
    flood_risk_zone: z.boolean().optional(),
    archaeological_area: z.boolean().optional(),
    infrastructure_availability: z.object({
      electricity: z.boolean().optional(),
      water: z.boolean().optional(),
      sewage: z.boolean().optional(),
      roads: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

const TestRuleSchema = z.object({
  rule: z.object({
    ruleName: z.string(),
    description: z.string().optional(),
    category: z.string(),
    conditions: z.array(z.object({
      field: z.string(),
      fieldDisplayName: z.string().optional(),
      operator: z.string(),
      value: z.any(),
      valueType: z.enum(['number', 'string', 'boolean', 'array', 'object']).optional(),
      isRequired: z.boolean().optional(),
    })),
    actions: z.array(z.object({
      type: z.string(),
      message: z.string(),
      priority: z.number().optional(),
    })),
    priority: z.number().optional(),
    isActive: z.boolean().optional(),
    applicableServices: z.array(z.string()).optional(),
  }),
  testData: z.record(z.any())
});

/**
 * تقييم طلب خدمة شامل
 * POST /api/advanced-automation/evaluate
 */
router.post('/evaluate', async (req, res) => {
  try {
    console.log('🔍 تلقي طلب تقييم خدمة متقدم');

    // التحقق من صحة البيانات
    const validationResult = ServiceRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'بيانات غير صحيحة',
        details: validationResult.error.errors,
      });
    }

    const serviceRequest = validationResult.data as ServiceRequest;

    // تقييم الطلب باستخدام المحرك المتقدم
    const result = await automationEngine.evaluateServiceRequest(serviceRequest);

    console.log('✅ تم تقييم الطلب بنجاح:', {
      decision: result.decision,
      confidence: result.confidence,
      evaluationsCount: result.evaluations.length
    });

    res.json(result);

  } catch (error) {
    console.error('❌ خطأ في تقييم الطلب:', error);
    res.status(500).json({
      error: 'خطأ داخلي في الخادم',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * اختبار قانون محدد
 * POST /api/advanced-automation/test-rule
 */
router.post('/test-rule', async (req, res) => {
  try {
    console.log('🧪 تلقي طلب اختبار قانون');

    // التحقق من صحة البيانات
    const validationResult = TestRuleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'بيانات الاختبار غير صحيحة',
        details: validationResult.error.errors,
      });
    }

    const { rule, testData } = validationResult.data;

    // إنشاء طلب خدمة وهمي للاختبار
    const mockServiceRequest: ServiceRequest = {
      serviceId: 'test-service',
      serviceType: rule.category as any || 'building_permit',
      projectData: {
        area_sqm: testData.area_sqm,
        height_m: testData.height_m,
        floors: testData.floors,
        building_type: testData.building_type,
        location: testData.location,
        has_survey: testData.has_survey,
        has_structural_report: testData.has_structural_report,
        parking_spaces: testData.parking_spaces,
        setback_front: testData.setback_front,
        setback_sides: testData.setback_sides,
        urgency_level: testData.urgency_level || 'normal',
      },
      applicantData: {
        nationality: testData.nationality || 'yemeni',
        previous_violations: testData.previous_violations || false,
        outstanding_fees: testData.outstanding_fees || 0,
      },
      locationData: {
        district: testData.district || 'صنعاء',
        zone_type: testData.zone_type || 'residential',
        flood_risk_zone: testData.flood_risk_zone || false,
        archaeological_area: testData.archaeological_area || false,
      }
    };

    // محاكاة تقييم القانون المحدد
    const evaluations = [];
    let totalScore = 0;
    let passedCount = 0;

    for (const condition of rule.conditions) {
      const fieldValue = getFieldValue(condition.field, mockServiceRequest);
      let passed = false;

      // تقييم الشرط
      switch (condition.operator) {
        case '>':
          passed = Number(fieldValue) > Number(condition.value);
          break;
        case '>=':
          passed = Number(fieldValue) >= Number(condition.value);
          break;
        case '<':
          passed = Number(fieldValue) < Number(condition.value);
          break;
        case '<=':
          passed = Number(fieldValue) <= Number(condition.value);
          break;
        case '==':
          passed = fieldValue == condition.value;
          break;
        case '!=':
          passed = fieldValue != condition.value;
          break;
        case 'exists':
          passed = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
          break;
      }

      evaluations.push({
        requirementId: `${rule.ruleName}_${condition.field}`,
        requirementName: condition.fieldDisplayName || condition.field,
        passed,
        message: passed 
          ? `${condition.fieldDisplayName || condition.field}: ${fieldValue} ✓`
          : `${condition.fieldDisplayName || condition.field}: ${fieldValue} ${condition.operator} ${condition.value} ✗`,
        value: fieldValue,
        expectedValue: condition.value,
        confidence: 0.9,
      });

      if (passed) {
        passedCount++;
        totalScore += 1;
      }
    }

    // حساب النتيجة النهائية
    const passRate = rule.conditions.length > 0 ? passedCount / rule.conditions.length : 1;
    const confidence = rule.conditions.length > 0 ? totalScore / rule.conditions.length : 1;
    
    const result = {
      approved: passRate >= 0.8,
      decision: passRate >= 0.8 ? 'approve' : 'reject',
      confidence: Math.round(confidence * 100) / 100,
      evaluations,
      recommendedActions: passRate < 0.8 ? ['مراجعة المتطلبات غير المستوفاة'] : [],
      reasoning: passRate >= 0.8 ? ['جميع الشروط مستوفاة'] : ['بعض الشروط غير مستوفاة'],
      riskLevel: passRate >= 0.8 ? 'low' : 'medium'
    };

    console.log('✅ تم اختبار القانون بنجاح:', {
      ruleName: rule.ruleName,
      approved: result.approved,
      confidence: result.confidence
    });

    res.json(result);

  } catch (error) {
    console.error('❌ خطأ في اختبار القانون:', error);
    res.status(500).json({
      error: 'خطأ في اختبار القانون',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * الحصول على القوالب المتاحة
 * GET /api/advanced-automation/templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'residential_small',
        name: 'موافقة تلقائية - مباني سكنية صغيرة',
        description: 'للمباني السكنية أقل من 200 م² وطابقين فقط',
        category: 'building_permit',
        complexity: 'simple',
        conditions: [
          {
            field: 'area_sqm',
            fieldDisplayName: 'مساحة البناء (م²)',
            operator: '<=',
            value: 200,
            valueType: 'number',
            isRequired: true
          },
          {
            field: 'floors',
            fieldDisplayName: 'عدد الطوابق',
            operator: '<=',
            value: 2,
            valueType: 'number',
            isRequired: true
          },
          {
            field: 'building_type',
            fieldDisplayName: 'نوع المبنى',
            operator: '==',
            value: 'residential',
            valueType: 'string',
            isRequired: true
          }
        ],
        actions: [
          {
            type: 'approve',
            message: 'تمت الموافقة تلقائياً - مبنى سكني صغير',
            priority: 1
          }
        ]
      },
      {
        id: 'commercial_review',
        name: 'مراجعة - مباني تجارية',
        description: 'تتطلب مراجعة للمباني التجارية بدون موقف سيارات',
        category: 'building_permit',
        complexity: 'intermediate',
        conditions: [
          {
            field: 'building_type',
            fieldDisplayName: 'نوع المبنى',
            operator: '==',
            value: 'commercial',
            valueType: 'string',
            isRequired: true
          },
          {
            field: 'parking_spaces',
            fieldDisplayName: 'مواقف السيارات',
            operator: '<',
            value: 1,
            valueType: 'number',
            isRequired: true
          }
        ],
        actions: [
          {
            type: 'escalate',
            message: 'يتطلب مراجعة - مبنى تجاري بدون مواقف سيارات كافية',
            priority: 2
          }
        ]
      },
      {
        id: 'high_rise',
        name: 'تصعيد - مباني عالية',
        description: 'تصعيد للإدارة للمباني أكثر من 5 طوابق',
        category: 'building_permit',
        complexity: 'advanced',
        conditions: [
          {
            field: 'floors',
            fieldDisplayName: 'عدد الطوابق',
            operator: '>',
            value: 5,
            valueType: 'number',
            isRequired: true
          }
        ],
        actions: [
          {
            type: 'escalate',
            message: 'يتطلب موافقة إدارية - مبنى عالي',
            priority: 3
          }
        ]
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('❌ خطأ في جلب القوالب:', error);
    res.status(500).json({
      error: 'خطأ في جلب القوالب',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * حفظ قانون جديد
 * POST /api/advanced-automation/rules
 */
router.post('/rules', async (req, res) => {
  try {
    console.log('💾 تلقي طلب حفظ قانون جديد');

    const ruleData = req.body;

    // التحقق من البيانات الأساسية
    if (!ruleData.ruleName || !ruleData.conditions || !ruleData.actions) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'يجب تقديم اسم القانون والشروط والإجراءات'
      });
    }

    // محاكاة حفظ القانون (في التطبيق الحقيقي سيتم حفظه في قاعدة البيانات)
    const savedRule = {
      id: `rule_${Date.now()}`,
      ...ruleData,
      createdAt: new Date(),
      version: 1,
      isActive: true
    };

    console.log('✅ تم حفظ القانون بنجاح:', savedRule.ruleName);

    res.status(201).json({
      message: 'تم حفظ القانون بنجاح',
      rule: savedRule
    });

  } catch (error) {
    console.error('❌ خطأ في حفظ القانون:', error);
    res.status(500).json({
      error: 'خطأ في حفظ القانون',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * دالة مساعدة للحصول على قيمة حقل من طلب الخدمة
 */
function getFieldValue(field: string, serviceRequest: ServiceRequest): any {
  if (serviceRequest.projectData && field in serviceRequest.projectData) {
    return serviceRequest.projectData[field as keyof typeof serviceRequest.projectData];
  }
  if (serviceRequest.applicantData && field in serviceRequest.applicantData) {
    return serviceRequest.applicantData[field as keyof typeof serviceRequest.applicantData];
  }
  if (serviceRequest.locationData && field in serviceRequest.locationData) {
    return serviceRequest.locationData[field as keyof typeof serviceRequest.locationData];
  }
  return null;
}

export default router;