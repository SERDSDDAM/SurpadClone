// مؤقت: خدمة API لأتمتة قانون البناء
export class LegalAutomationAPI {
  static async createLegalRule(ruleData: any): Promise<{ success: boolean; ruleId: string; message: string }> {
    // محاكاة إنشاء قانون
    console.log('🏛️ إنشاء قانون جديد:', ruleData.ruleName);
    
    return {
      success: true,
      ruleId: 'legal_' + Date.now(),
      message: 'تم إنشاء القانون بنجاح'
    };
  }

  static async testLegalRule(rule: any, testData: any): Promise<any> {
    // محاكاة اختبار القانون
    const evaluations = [];
    let approved = true;
    const reasoning = [];

    for (const condition of rule.conditions) {
      const actualValue = testData[condition.field];
      const conditionPassed = this.evaluateCondition(condition, actualValue);
      
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
        reasoning.push(`فشل في شرط: ${condition.fieldDisplayName}`);
      }
    }

    const result = {
      approved,
      decision: approved ? 'approve' : (rule.actions[0]?.type || 'reject'),
      confidence: approved ? 0.9 : 0.6,
      evaluations,
      recommendedActions: approved ? [] : [rule.actions[0]?.message || 'يتطلب مراجعة'],
      reasoning,
      riskLevel: approved ? 'low' : 'medium'
    };

    console.log('🧪 اختبار قانون:', rule.ruleName, '- النتيجة:', result.decision);
    return result;
  }

  private static evaluateCondition(condition: any, actualValue: any): boolean {
    if (actualValue === undefined || actualValue === null) return false;

    switch (condition.operator) {
      case '<': return Number(actualValue) < Number(condition.value);
      case '<=': return Number(actualValue) <= Number(condition.value);
      case '>': return Number(actualValue) > Number(condition.value);
      case '>=': return Number(actualValue) >= Number(condition.value);
      case '==': return actualValue == condition.value;
      case '!=': return actualValue != condition.value;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(actualValue);
      case 'contains': return String(actualValue).includes(String(condition.value));
      default: return false;
    }
  }
}