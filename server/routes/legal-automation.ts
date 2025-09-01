import { Router } from 'express';
import { LegalAutomationEngine, type ServiceRequest, type AutomationResult } from '../services/LegalAutomationEngine';
import { db } from '../db';
import { automationRules } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();
const legalEngine = new LegalAutomationEngine();

// إنشاء قانون جديد
router.post('/legal-rules', async (req, res) => {
  try {
    const { ruleName, description, category, conditions, actions, priority, isActive, applicableServices } = req.body;

    if (!ruleName || !conditions || !actions) {
      return res.status(400).json({ 
        error: 'البيانات المطلوبة غير مكتملة' 
      });
    }

    const ruleId = await legalEngine.createAutomationRule({
      ruleName,
      description: description || '',
      ruleCategory: category || 'building_permit',
      conditions: conditions,
      actions: actions.length > 0 ? actions[0] : { type: 'approve', message: 'تمت الموافقة' },
      priority: priority || 5,
      isActive: isActive !== false
    });

    res.json({ 
      success: true, 
      ruleId,
      message: 'تم إنشاء القانون بنجاح'
    });
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء القانون:', error);
    res.status(500).json({ 
      error: error.message || 'فشل في إنشاء القانون' 
    });
  }
});

// اختبار قانون على بيانات تجريبية
router.post('/test-legal-rule', async (req, res) => {
  try {
    const { rule, testData } = req.body;

    if (!rule || !testData) {
      return res.status(400).json({ 
        error: 'يجب توفير القانون والبيانات التجريبية' 
      });
    }

    // إنشاء طلب خدمة تجريبي
    const serviceRequest: ServiceRequest = {
      serviceId: rule.category || 'building_permit',
      requestData: testData,
      userId: 'test_user',
      location: testData.location,
      urgencyLevel: testData.urgencyLevel || 'normal'
    };

    // محاكاة تقييم القانون
    const result = await simulateRuleEvaluation(rule, serviceRequest);

    res.json(result);
  } catch (error: any) {
    console.error('❌ خطأ في اختبار القانون:', error);
    res.status(500).json({ 
      error: error.message || 'فشل في اختبار القانون' 
    });
  }
});

// الحصول على جميع القوانين النشطة
router.get('/legal-rules', async (req, res) => {
  try {
    const rules = await db.select().from(automationRules).where(eq(automationRules.isActive, true));
    
    res.json({ 
      success: true, 
      data: rules.map(rule => ({
        id: rule.id,
        ruleName: rule.ruleName,
        description: rule.description,
        category: rule.ruleCategory,
        priority: rule.priority,
        conditions: rule.conditions,
        actions: rule.actions,
        isActive: rule.isActive,
        createdAt: rule.createdAt
      }))
    });
  } catch (error: any) {
    console.error('❌ خطأ في جلب القوانين:', error);
    res.status(500).json({ 
      error: error.message || 'فشل في جلب القوانين' 
    });
  }
});

// تحديث قانون موجود
router.put('/legal-rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    await legalEngine.updateAutomationRule(ruleId, updates);

    res.json({ 
      success: true, 
      message: 'تم تحديث القانون بنجاح' 
    });
  } catch (error: any) {
    console.error('❌ خطأ في تحديث القانون:', error);
    res.status(500).json({ 
      error: error.message || 'فشل في تحديث القانون' 
    });
  }
});

// حذف قانون
router.delete('/legal-rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;

    await legalEngine.updateAutomationRule(ruleId, { isActive: false });

    res.json({ 
      success: true, 
      message: 'تم حذف القانون بنجاح' 
    });
  } catch (error: any) {
    console.error('❌ خطأ في حذف القانون:', error);
    res.status(500).json({ 
      error: error.message || 'فشل في حذف القانون' 
    });
  }
});

// تقييم طلب خدمة فعلي
router.post('/evaluate-service-request', async (req, res) => {
  try {
    const serviceRequest: ServiceRequest = req.body;

    if (!serviceRequest.serviceId || !serviceRequest.requestData) {
      return res.status(400).json({ 
        error: 'بيانات طلب الخدمة غير مكتملة' 
      });
    }

    const result = await legalEngine.evaluateServiceRequest(serviceRequest);

    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    console.error('❌ خطأ في تقييم طلب الخدمة:', error);
    res.status(500).json({ 
      error: error.message || 'فشل في تقييم طلب الخدمة' 
    });
  }
});

// محاكاة تقييم قانون (للاختبار)
async function simulateRuleEvaluation(rule: any, request: ServiceRequest): Promise<AutomationResult> {
  const evaluations = [];
  let approved = true;
  const reasoning = [];
  const recommendedActions = [];
  let confidence = 0.9;

  // تقييم كل شرط
  for (const condition of rule.conditions) {
    const actualValue = request.requestData[condition.field];
    const conditionPassed = evaluateCondition(condition, actualValue);
    
    evaluations.push({
      requirementId: `${rule.ruleName}_${condition.field}`,
      requirementName: condition.fieldDisplayName || condition.field,
      passed: conditionPassed,
      message: conditionPassed 
        ? `${condition.fieldDisplayName}: ${actualValue} ✓`
        : `${condition.fieldDisplayName}: ${actualValue} لا يحقق الشرط ${condition.operator} ${condition.value}`,
      value: actualValue,
      expectedValue: condition.value
    });

    if (!conditionPassed) {
      approved = false;
      confidence *= 0.7;
      reasoning.push(`فشل في شرط: ${condition.fieldDisplayName}`);
    }
  }

  // تحديد الإجراء بناءً على النتيجة
  let decision: 'approve' | 'reject' | 'require_review' | 'escalate' = 'approve';
  
  if (!approved && rule.actions.length > 0) {
    decision = rule.actions[0].type;
    recommendedActions.push(rule.actions[0].message);
  }

  return {
    approved,
    decision,
    confidence,
    evaluations,
    recommendedActions,
    reasoning,
    riskLevel: approved ? 'low' : 'medium',
    estimatedProcessingTime: 60,
    requiredDocuments: approved ? [] : ['مستندات إضافية مطلوبة']
  };
}

// تقييم شرط واحد
function evaluateCondition(condition: any, actualValue: any): boolean {
  if (actualValue === undefined || actualValue === null) {
    return false;
  }

  switch (condition.operator) {
    case '<':
      return Number(actualValue) < Number(condition.value);
    case '<=':
      return Number(actualValue) <= Number(condition.value);
    case '>':
      return Number(actualValue) > Number(condition.value);
    case '>=':
      return Number(actualValue) >= Number(condition.value);
    case '==':
      return actualValue == condition.value;
    case '!=':
      return actualValue != condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(actualValue);
    case 'contains':
      return String(actualValue).includes(String(condition.value));
    default:
      return false;
  }
}

export default router;