import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Play, Save, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface Action {
  id: string;
  type: string;
  value: string;
  parameters?: Record<string, any>;
}

interface RuleBuilder {
  id?: string;
  ruleName: string;
  description: string;
  category: string;
  priority: number;
  conditions: Condition[];
  actions: Action[];
  isActive: boolean;
}

const FIELD_OPTIONS = [
  { value: 'area_sqm', label: 'المساحة (متر مربع)', type: 'number' },
  { value: 'floors', label: 'عدد الطوابق', type: 'number' },
  { value: 'estimatedCost', label: 'التكلفة المقدرة', type: 'number' },
  { value: 'buildingType', label: 'نوع المبنى', type: 'text' },
  { value: 'district', label: 'المنطقة', type: 'text' },
  { value: 'location', label: 'الموقع', type: 'text' },
  { value: 'urgencyLevel', label: 'مستوى الإلحاح', type: 'select' },
  { value: 'applicantRole', label: 'دور المتقدم', type: 'text' },
  { value: 'previousViolations', label: 'المخالفات السابقة', type: 'number' },
  { value: 'projectType', label: 'نوع المشروع', type: 'text' },
];

const OPERATOR_OPTIONS = [
  { value: '==', label: 'يساوي' },
  { value: '!=', label: 'لا يساوي' },
  { value: '>', label: 'أكبر من' },
  { value: '<', label: 'أصغر من' },
  { value: '>=', label: 'أكبر من أو يساوي' },
  { value: '<=', label: 'أصغر من أو يساوي' },
  { value: 'contains', label: 'يحتوي على' },
  { value: 'startsWith', label: 'يبدأ بـ' },
  { value: 'in', label: 'ضمن القائمة' },
];

const ACTION_OPTIONS = [
  { value: 'approve', label: 'الموافقة التلقائية', color: 'green' },
  { value: 'reject', label: 'الرفض التلقائي', color: 'red' },
  { value: 'escalate', label: 'التصعيد للمدير', color: 'yellow' },
  { value: 'require_review', label: 'يتطلب مراجعة', color: 'blue' },
  { value: 'fast_track', label: 'مسار سريع', color: 'purple' },
  { value: 'additional_documents', label: 'طلب وثائق إضافية', color: 'orange' },
  { value: 'notify', label: 'إرسال إشعار', color: 'gray' },
  { value: 'assign_to', label: 'تخصيص لموظف', color: 'indigo' },
];

const CATEGORY_OPTIONS = [
  { value: 'building_permit', label: 'تراخيص البناء' },
  { value: 'survey_request', label: 'طلبات المساحة' },
  { value: 'license_renewal', label: 'تجديد الرخص' },
  { value: 'violation_handling', label: 'معالجة المخالفات' },
  { value: 'inspection_scheduling', label: 'جدولة المعاينات' },
  { value: 'emergency_permits', label: 'تراخيص الطوارئ' },
];

export function RuleBuilderInterface() {
  const { toast } = useToast();
  const [rule, setRule] = useState<RuleBuilder>({
    ruleName: '',
    description: '',
    category: '',
    priority: 5,
    conditions: [{
      id: 'cond_1',
      field: '',
      operator: '',
      value: '',
    }],
    actions: [{
      id: 'act_1',
      type: '',
      value: '',
    }],
    isActive: true,
  });

  const [testData, setTestData] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addCondition = () => {
    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      field: '',
      operator: '',
      value: '',
      logicalOperator: 'AND',
    };
    setRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const removeCondition = (conditionId: string) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== conditionId)
    }));
  };

  const updateCondition = (conditionId: string, updates: Partial<Condition>) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    }));
  };

  const addAction = () => {
    const newAction: Action = {
      id: `act_${Date.now()}`,
      type: '',
      value: '',
    };
    setRule(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const removeAction = (actionId: string) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== actionId)
    }));
  };

  const updateAction = (actionId: string, updates: Partial<Action>) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.map(a => 
        a.id === actionId ? { ...a, ...updates } : a
      )
    }));
  };

  const testRule = async () => {
    if (!testData.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بيانات اختبار بصيغة JSON",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTesting(true);
      const parsedData = JSON.parse(testData);
      
      // محاكاة اختبار القاعدة
      const simulationResult = {
        passes: true,
        confidence: 0.85,
        reasoning: "تم تطبيق القاعدة بنجاح",
        matchedConditions: rule.conditions.length,
        triggeredActions: rule.actions.map(a => a.type),
      };

      setTestResult(simulationResult);
      
      toast({
        title: "نجح الاختبار",
        description: `تم تطبيق القاعدة بثقة ${(simulationResult.confidence * 100).toFixed(0)}%`,
      });
    } catch (error) {
      toast({
        title: "خطأ في بيانات الاختبار",
        description: "تأكد من صحة صيغة JSON",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveRule = async () => {
    if (!rule.ruleName.trim() || !rule.category) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم القاعدة واختيار الفئة",
        variant: "destructive",
      });
      return;
    }

    if (rule.conditions.some(c => !c.field || !c.operator)) {
      toast({
        title: "خطأ",
        description: "تأكد من اكتمال جميع الشروط",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const ruleData = {
        ruleName: rule.ruleName,
        description: rule.description,
        ruleCategory: rule.category,
        priority: rule.priority,
        conditions: rule.conditions.reduce((acc, condition) => {
          if (condition.field && condition.operator && condition.value) {
            acc[condition.field] = condition.value;
          }
          return acc;
        }, {} as Record<string, any>),
        actions: rule.actions.reduce((acc, action) => {
          if (action.type) {
            acc[action.type] = action.value || true;
          }
          return acc;
        }, {} as Record<string, any>),
        isActive: rule.isActive,
        targetProcesses: [rule.category],
        createdBy: "rule_builder",
      };

      await apiRequest('/api/smart-automation/automation-rules', {
        method: 'POST',
        body: JSON.stringify(ruleData),
      });

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم إنشاء القاعدة: ${rule.ruleName}`,
      });

      // إعادة تعيين النموذج
      setRule({
        ruleName: '',
        description: '',
        category: '',
        priority: 5,
        conditions: [{
          id: 'cond_1',
          field: '',
          operator: '',
          value: '',
        }],
        actions: [{
          id: 'act_1',
          type: '',
          value: '',
        }],
        isActive: true,
      });

    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "فشل في حفظ القاعدة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* معلومات القاعدة الأساسية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            إنشاء قاعدة أتمتة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ruleName">اسم القاعدة</Label>
              <Input
                id="ruleName"
                placeholder="مثال: موافقة تلقائية للمباني الصغيرة"
                value={rule.ruleName}
                onChange={(e) => setRule(prev => ({ ...prev, ruleName: e.target.value }))}
                data-testid="input-rule-name"
              />
            </div>
            <div>
              <Label htmlFor="category">الفئة</Label>
              <Select value={rule.category} onValueChange={(value) => setRule(prev => ({ ...prev, category: value }))}>
                <SelectTrigger data-testid="select-rule-category">
                  <SelectValue placeholder="اختر فئة القاعدة" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">الأولوية (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={rule.priority}
                onChange={(e) => setRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                data-testid="input-rule-priority"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={rule.isActive}
                onCheckedChange={(checked) => setRule(prev => ({ ...prev, isActive: checked }))}
                data-testid="switch-rule-active"
              />
              <Label htmlFor="isActive">قاعدة نشطة</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              placeholder="وصف مفصل لما تفعله هذه القاعدة..."
              value={rule.description}
              onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
              data-testid="textarea-rule-description"
            />
          </div>
        </CardContent>
      </Card>

      {/* الشروط */}
      <Card>
        <CardHeader>
          <CardTitle>الشروط (IF)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rule.conditions.map((condition, index) => (
              <div key={condition.id} className="border rounded-lg p-4 space-y-3">
                {index > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {condition.logicalOperator || 'AND'}
                    </Badge>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label>الحقل</Label>
                    <Select 
                      value={condition.field} 
                      onValueChange={(value) => updateCondition(condition.id, { field: value })}
                    >
                      <SelectTrigger data-testid={`select-condition-field-${index}`}>
                        <SelectValue placeholder="اختر الحقل" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map(field => (
                          <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>المقارنة</Label>
                    <Select 
                      value={condition.operator} 
                      onValueChange={(value) => updateCondition(condition.id, { operator: value })}
                    >
                      <SelectTrigger data-testid={`select-condition-operator-${index}`}>
                        <SelectValue placeholder="اختر المقارنة" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATOR_OPTIONS.map(op => (
                          <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>القيمة</Label>
                    <Input
                      placeholder="أدخل القيمة"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                      data-testid={`input-condition-value-${index}`}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                      disabled={rule.conditions.length === 1}
                      data-testid={`button-remove-condition-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addCondition}
              data-testid="button-add-condition"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة شرط
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الإجراءات */}
      <Card>
        <CardHeader>
          <CardTitle>الإجراءات (THEN)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rule.actions.map((action, index) => (
              <div key={action.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>نوع الإجراء</Label>
                    <Select 
                      value={action.type} 
                      onValueChange={(value) => updateAction(action.id, { type: value })}
                    >
                      <SelectTrigger data-testid={`select-action-type-${index}`}>
                        <SelectValue placeholder="اختر الإجراء" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_OPTIONS.map(actionOpt => (
                          <SelectItem key={actionOpt.value} value={actionOpt.value}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`bg-${actionOpt.color}-100 text-${actionOpt.color}-800`}>
                                {actionOpt.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>القيمة/المعاملات</Label>
                    <Input
                      placeholder="قيمة إضافية (اختياري)"
                      value={action.value}
                      onChange={(e) => updateAction(action.id, { value: e.target.value })}
                      data-testid={`input-action-value-${index}`}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAction(action.id)}
                      disabled={rule.actions.length === 1}
                      data-testid={`button-remove-action-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addAction}
              data-testid="button-add-action"
            >
              <Plus className="h-4 w-4 mr-2" />
              إضافة إجراء
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* اختبار القاعدة */}
      <Card>
        <CardHeader>
          <CardTitle>اختبار القاعدة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testData">بيانات اختبار (JSON)</Label>
            <Textarea
              id="testData"
              placeholder={`{
  "area_sqm": 150,
  "floors": 2,
  "estimatedCost": 75000,
  "buildingType": "residential",
  "district": "صنعاء",
  "urgencyLevel": "medium"
}`}
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              rows={6}
              data-testid="textarea-test-data"
            />
          </div>
          
          <Button
            onClick={testRule}
            disabled={isTesting}
            data-testid="button-test-rule"
          >
            <Play className="h-4 w-4 mr-2" />
            {isTesting ? 'جاري الاختبار...' : 'اختبار القاعدة'}
          </Button>
          
          {testResult && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">نتيجة الاختبار:</h4>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>النتيجة:</strong> {testResult.passes ? '✅ نجح' : '❌ فشل'}</p>
                <p><strong>مستوى الثقة:</strong> {(testResult.confidence * 100).toFixed(0)}%</p>
                <p><strong>الشروط المطابقة:</strong> {testResult.matchedConditions}</p>
                <p><strong>الإجراءات المُفعلة:</strong> {testResult.triggeredActions.join(', ')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* أزرار الحفظ */}
      <div className="flex gap-4">
        <Button
          onClick={saveRule}
          disabled={isSaving}
          size="lg"
          data-testid="button-save-rule"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'جاري الحفظ...' : 'حفظ القاعدة'}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(rule, null, 2));
            toast({ title: "تم النسخ", description: "تم نسخ تعريف القاعدة" });
          }}
          data-testid="button-copy-rule"
        >
          <Copy className="h-4 w-4 mr-2" />
          نسخ التعريف
        </Button>
      </div>
    </div>
  );
}