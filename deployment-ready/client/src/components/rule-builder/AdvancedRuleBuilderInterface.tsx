// واجهة منشئ القوانين المتقدمة - المرحلة الثالثة المطورة
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  Zap,
  TestTube,
  BookOpen,
  Settings,
  Play,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Target,
  TrendingUp,
  Users,
  FileText,
  Calculator,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface AdvancedRule {
  id?: string;
  ruleName: string;
  description: string;
  category: string;
  conditions: AdvancedCondition[];
  actions: AdvancedAction[];
  priority: number;
  isActive: boolean;
  applicableServices: string[];
  tags: string[];
  version: number;
  createdBy?: string;
  lastModified?: Date;
  testResults?: TestResult[];
  performanceMetrics?: {
    accuracy: number;
    executionTime: number;
    usageCount: number;
  };
}

interface AdvancedCondition {
  id?: string;
  field: string;
  fieldDisplayName: string;
  operator: string;
  value: any;
  valueType: 'number' | 'string' | 'boolean' | 'array' | 'object';
  isRequired: boolean;
  weight: number; // وزن الشرط في التقييم النهائي
  category: string;
  validationRules?: ValidationRule[];
  dynamicValue?: string; // للقيم المحسوبة ديناميكياً
}

interface AdvancedAction {
  id?: string;
  type: 'approve' | 'reject' | 'escalate' | 'request_docs' | 'calculate_fees' | 'send_notification';
  message: string;
  priority: number;
  conditions?: string[]; // شروط تنفيذ الإجراء
  parameters?: Record<string, any>;
  assignedRole?: string;
  estimatedTime?: string;
}

interface ValidationRule {
  type: 'range' | 'format' | 'dependency' | 'custom';
  rule: string;
  errorMessage: string;
}

interface TestResult {
  testId: string;
  input: any;
  expectedOutput: any;
  actualOutput: any;
  passed: boolean;
  executionTime: number;
  confidence: number;
  timestamp: Date;
}

export function AdvancedRuleBuilderInterface() {
  const [activeTab, setActiveTab] = useState('builder');
  const [rule, setRule] = useState<AdvancedRule>({
    ruleName: '',
    description: '',
    category: 'building_permit',
    conditions: [],
    actions: [],
    priority: 5,
    isActive: true,
    applicableServices: ['building_permit'],
    tags: [],
    version: 1
  });

  const [testData, setTestData] = useState<any>({
    area_sqm: 150,
    height_m: 12,
    floors: 3,
    building_type: 'residential',
    location: 'صنعاء',
    has_survey: true,
    has_structural_report: true,
    parking_spaces: 2,
    setback_front: 3,
    setback_sides: 2
  });

  const [testResult, setTestResult] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [ruleComplexity, setRuleComplexity] = useState<'simple' | 'intermediate' | 'advanced'>('simple');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب القوالب المتاحة
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/advanced-automation/templates'],
    retry: false,
  });

  // جلب القوانين الموجودة
  const { data: existingRules = [] } = useQuery({
    queryKey: ['/api/advanced-automation/rules'],
    retry: false,
  });

  // حفظ القانون
  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData: AdvancedRule) => {
      return apiRequest('/api/advanced-automation/rules', {
        method: 'POST',
        body: JSON.stringify(ruleData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation-rules'] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ القانون الجديد وتفعيله",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحفظ",
        description: error.message || "فشل في حفظ القانون",
        variant: "destructive",
      });
    }
  });

  // اختبار القانون
  const testRuleMutation = useMutation({
    mutationFn: async (data: { rule: AdvancedRule; testData: any }) => {
      return apiRequest('/api/advanced-automation/test-rule', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result) => {
      setTestResult(result);
      toast({
        title: "تم اختبار القانون",
        description: `النتيجة: ${result.approved ? 'موافق' : 'مرفوض'} بثقة ${Math.round(result.confidence * 100)}%`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الاختبار",
        description: error.message || "فشل في اختبار القانون",
        variant: "destructive",
      });
    }
  });

  // إضافة شرط جديد
  const addCondition = () => {
    const newCondition: AdvancedCondition = {
      field: 'area_sqm',
      fieldDisplayName: 'مساحة البناء (م²)',
      operator: '>=',
      value: 0,
      valueType: 'number',
      isRequired: true,
      weight: 1,
      category: 'technical_specs'
    };
    setRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  // إضافة إجراء جديد
  const addAction = () => {
    const newAction: AdvancedAction = {
      type: 'approve',
      message: 'تمت الموافقة على الطلب',
      priority: 1
    };
    setRule(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  // تطبيق قالب
  const applyTemplate = (templateId: string) => {
    const template = templates?.find((t: any) => t.id === templateId);
    if (template) {
      setRule({
        ...rule,
        ruleName: template.name,
        description: template.description,
        conditions: template.conditions || [],
        actions: template.actions || []
      });
      toast({
        title: "تم تطبيق القالب",
        description: `تم تطبيق قالب "${template.name}" بنجاح`,
      });
    }
  };

  // حفظ القانون
  const handleSaveRule = () => {
    if (!rule.ruleName.trim()) {
      toast({
        title: "خطأ في الإدخال",
        description: "يجب إدخال اسم القانون",
        variant: "destructive",
      });
      return;
    }

    if (rule.conditions.length === 0) {
      toast({
        title: "خطأ في الإدخال", 
        description: "يجب إضافة شرط واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    saveRuleMutation.mutate(rule);
  };

  // تشغيل الاختبار
  const handleTestRule = () => {
    if (rule.conditions.length === 0) {
      toast({
        title: "لا يمكن الاختبار",
        description: "يجب إضافة شروط قبل الاختبار",
        variant: "destructive",
      });
      return;
    }

    testRuleMutation.mutate({ rule, testData });
  };

  // حساب تعقيد القانون
  const calculateComplexity = (rule: AdvancedRule): number => {
    let complexity = 0;
    complexity += rule.conditions.length * 2;
    complexity += rule.actions.length;
    complexity += rule.conditions.filter(c => c.valueType === 'object').length * 3;
    return complexity;
  };

  useEffect(() => {
    const complexity = calculateComplexity(rule);
    if (complexity <= 5) setRuleComplexity('simple');
    else if (complexity <= 15) setRuleComplexity('intermediate');
    else setRuleComplexity('advanced');
  }, [rule]);

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">منشئ القوانين المتقدم</h2>
            <p className="text-sm text-muted-foreground">
              إنشاء وإدارة قوانين الأتمتة الذكية للخدمات الحكومية
            </p>
          </div>
        </div>

        {/* مؤشرات الأداء */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{existingRules?.length || 0}</div>
            <div className="text-xs text-gray-500">قانون نشط</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">94%</div>
            <div className="text-xs text-gray-500">دقة النظام</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {ruleComplexity === 'simple' ? 'بسيط' : ruleComplexity === 'intermediate' ? 'متوسط' : 'متقدم'}
            </div>
            <div className="text-xs text-gray-500">تعقيد القانون</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            منشئ القانون
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            القوالب الذكية
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            اختبار القانون
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            محاكي السيناريوهات
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            تحليل الأداء
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            إدارة القوانين
          </TabsTrigger>
        </TabsList>

        {/* تبويب منشئ القانون */}
        <TabsContent value="builder" className="space-y-6">
          {/* معلومات أساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اسم القانون *</label>
                  <Input
                    placeholder="مثال: قانون المساحة الدنيا للمباني السكنية"
                    value={rule.ruleName}
                    onChange={(e) => setRule(prev => ({ ...prev, ruleName: e.target.value }))}
                    data-testid="input-rule-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">فئة الخدمة</label>
                  <select
                    value={rule.category}
                    onChange={(e) => setRule(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    data-testid="select-rule-category"
                  >
                    <option value="building_permit">تراخيص البناء</option>
                    <option value="demolition_permit">تراخيص الهدم</option>
                    <option value="fencing_permit">تراخيص التسوير</option>
                    <option value="occupancy_certificate">شهادات الإشغال</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الأولوية (1-10)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={rule.priority}
                    onChange={(e) => setRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                    data-testid="input-rule-priority"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={(e) => setRule(prev => ({ ...prev, isActive: e.target.checked }))}
                      data-testid="checkbox-rule-active"
                    />
                    <span className="text-sm font-medium">قانون نشط</span>
                  </label>

                  <Badge variant={ruleComplexity === 'simple' ? 'outline' : ruleComplexity === 'intermediate' ? 'secondary' : 'destructive'}>
                    {ruleComplexity === 'simple' ? 'بسيط' : ruleComplexity === 'intermediate' ? 'متوسط' : 'معقد'}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">وصف القانون</label>
                <Textarea
                  placeholder="اشرح الغرض من هذا القانون والحالات التي يطبق فيها..."
                  value={rule.description}
                  onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  data-testid="textarea-rule-description"
                />
              </div>

              {/* العلامات */}
              <div>
                <label className="block text-sm font-medium mb-2">العلامات (اختيارية)</label>
                <Input
                  placeholder="مثال: سكني، تجاري، آمن (افصل بفواصل)"
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                    setRule(prev => ({ ...prev, tags }));
                  }}
                  data-testid="input-rule-tags"
                />
                <div className="flex gap-2 mt-2">
                  {rule.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الشروط المتقدمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  الشروط والمعايير ({rule.conditions.length})
                </div>
                <Button onClick={addCondition} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة شرط
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rule.conditions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم إضافة أي شروط بعد</p>
                  <p className="text-sm">ابدأ بإضافة الشروط التي يجب تحققها لتطبيق هذا القانون</p>
                </div>
              ) : (
                rule.conditions.map((condition, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">الحقل</label>
                        <select
                          value={condition.field}
                          onChange={(e) => {
                            const newConditions = [...rule.conditions];
                            newConditions[index] = { ...condition, field: e.target.value };
                            setRule(prev => ({ ...prev, conditions: newConditions }));
                          }}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          <option value="area_sqm">مساحة البناء (م²)</option>
                          <option value="height_m">ارتفاع المبنى (م)</option>
                          <option value="floors">عدد الطوابق</option>
                          <option value="building_type">نوع المبنى</option>
                          <option value="setback_front">الارتداد الأمامي</option>
                          <option value="setback_sides">الارتداد الجانبي</option>
                          <option value="parking_spaces">مواقف السيارات</option>
                          <option value="has_survey">تقرير المساحة</option>
                          <option value="has_structural_report">التقرير الإنشائي</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">المقارنة</label>
                        <select
                          value={condition.operator}
                          onChange={(e) => {
                            const newConditions = [...rule.conditions];
                            newConditions[index] = { ...condition, operator: e.target.value };
                            setRule(prev => ({ ...prev, conditions: newConditions }));
                          }}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          <option value=">">أكبر من</option>
                          <option value=">=">أكبر من أو يساوي</option>
                          <option value="<">أصغر من</option>
                          <option value="<=">أصغر من أو يساوي</option>
                          <option value="==">يساوي</option>
                          <option value="!=">لا يساوي</option>
                          <option value="contains">يحتوي على</option>
                          <option value="exists">موجود</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">القيمة</label>
                        <Input
                          type={condition.valueType === 'number' ? 'number' : 'text'}
                          value={condition.value}
                          onChange={(e) => {
                            const newConditions = [...rule.conditions];
                            newConditions[index] = { ...condition, value: e.target.value };
                            setRule(prev => ({ ...prev, conditions: newConditions }));
                          }}
                          className="text-sm"
                          placeholder="القيمة المطلوبة"
                        />
                      </div>

                      <div className="flex items-end gap-2">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={condition.isRequired}
                            onChange={(e) => {
                              const newConditions = [...rule.conditions];
                              newConditions[index] = { ...condition, isRequired: e.target.checked };
                              setRule(prev => ({ ...prev, conditions: newConditions }));
                            }}
                            className="scale-75"
                          />
                          إلزامي
                        </label>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const newConditions = rule.conditions.filter((_, i) => i !== index);
                            setRule(prev => ({ ...prev, conditions: newConditions }));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* وزن الشرط */}
                    <div className="mt-3 pt-3 border-t">
                      <label className="block text-xs font-medium mb-2">
                        وزن الشرط في التقييم: {condition.weight}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={condition.weight}
                        onChange={(e) => {
                          const newConditions = [...rule.conditions];
                          newConditions[index] = { ...condition, weight: parseFloat(e.target.value) };
                          setRule(prev => ({ ...prev, conditions: newConditions }));
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* الإجراءات المتقدمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  الإجراءات والنتائج ({rule.actions.length})
                </div>
                <Button onClick={addAction} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة إجراء
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rule.actions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم إضافة أي إجراءات بعد</p>
                  <p className="text-sm">حدد ما يجب أن يحدث عند تحقق الشروط</p>
                </div>
              ) : (
                rule.actions.map((action, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">نوع الإجراء</label>
                        <select
                          value={action.type}
                          onChange={(e) => {
                            const newActions = [...rule.actions];
                            newActions[index] = { ...action, type: e.target.value as any };
                            setRule(prev => ({ ...prev, actions: newActions }));
                          }}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          <option value="approve">موافقة تلقائية</option>
                          <option value="reject">رفض تلقائي</option>
                          <option value="escalate">تصعيد للمراجعة</option>
                          <option value="request_docs">طلب مستندات إضافية</option>
                          <option value="calculate_fees">حساب الرسوم</option>
                          <option value="send_notification">إرسال إشعار</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">الأولوية</label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={action.priority}
                          onChange={(e) => {
                            const newActions = [...rule.actions];
                            newActions[index] = { ...action, priority: parseInt(e.target.value) || 1 };
                            setRule(prev => ({ ...prev, actions: newActions }));
                          }}
                          className="text-sm"
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const newActions = rule.actions.filter((_, i) => i !== index);
                            setRule(prev => ({ ...prev, actions: newActions }));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium mb-1">رسالة الإجراء</label>
                      <Input
                        value={action.message}
                        onChange={(e) => {
                          const newActions = [...rule.actions];
                          newActions[index] = { ...action, message: e.target.value };
                          setRule(prev => ({ ...prev, actions: newActions }));
                        }}
                        placeholder="الرسالة التي ستظهر للمستخدم"
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* أزرار الحفظ والاختبار */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <Button onClick={handleTestRule} variant="outline" disabled={testRuleMutation.isPending}>
                <Play className="h-4 w-4 mr-2" />
                {testRuleMutation.isPending ? 'جاري الاختبار...' : 'اختبار القانون'}
              </Button>
            </div>
            
            <Button onClick={handleSaveRule} disabled={saveRuleMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveRuleMutation.isPending ? 'جاري الحفظ...' : 'حفظ القانون'}
            </Button>
          </div>
        </TabsContent>

        {/* تبويب القوالب الذكية */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مكتبة القوالب الذكية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* قوالب جاهزة */}
                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium">موافقة تلقائية - مباني سكنية صغيرة</h4>
                    <Badge variant="outline">مُوصى</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    للمباني السكنية أقل من 200 م² وطابقين فقط
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">سكني</Badge>
                    <Badge variant="secondary" className="text-xs">بسيط</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => applyTemplate('residential_small')}>
                    استخدام القالب
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h4 className="font-medium mb-2">مراجعة - مباني تجارية</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    تتطلب مراجعة للمباني التجارية بدون موقف سيارات
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">تجاري</Badge>
                    <Badge variant="secondary" className="text-xs">متوسط</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => applyTemplate('commercial_review')}>
                    استخدام القالب
                  </Button>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <h4 className="font-medium mb-2">تصعيد - مباني عالية</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    تصعيد للإدارة للمباني أكثر من 5 طوابق
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">عالي</Badge>
                    <Badge variant="destructive" className="text-xs">معقد</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => applyTemplate('high_rise')}>
                    استخدام القالب
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الاختبار */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                اختبار القانون المباشر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* بيانات الاختبار */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">مساحة البناء (م²)</label>
                  <Input
                    type="number"
                    value={testData.area_sqm}
                    onChange={(e) => setTestData(prev => ({ ...prev, area_sqm: Number(e.target.value) }))}
                    placeholder="150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ارتفاع المبنى (م)</label>
                  <Input
                    type="number"
                    value={testData.height_m}
                    onChange={(e) => setTestData(prev => ({ ...prev, height_m: Number(e.target.value) }))}
                    placeholder="12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">عدد الطوابق</label>
                  <Input
                    type="number"
                    value={testData.floors}
                    onChange={(e) => setTestData(prev => ({ ...prev, floors: Number(e.target.value) }))}
                    placeholder="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">نوع المبنى</label>
                  <select
                    value={testData.building_type}
                    onChange={(e) => setTestData(prev => ({ ...prev, building_type: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="residential">سكني</option>
                    <option value="commercial">تجاري</option>
                    <option value="industrial">صناعي</option>
                    <option value="mixed">مختلط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الموقع</label>
                  <Input
                    value={testData.location}
                    onChange={(e) => setTestData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="صنعاء"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={testData.has_survey}
                      onChange={(e) => setTestData(prev => ({ ...prev, has_survey: e.target.checked }))}
                    />
                    يوجد تقرير مساحة
                  </label>
                </div>
              </div>

              {/* زر الاختبار */}
              <Button 
                onClick={handleTestRule} 
                disabled={testRuleMutation.isPending}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {testRuleMutation.isPending ? 'جاري الاختبار...' : 'تشغيل محاكاة الاختبار'}
              </Button>

              {/* عرض النتائج */}
              {testResult && (
                <Alert className={`${testResult.approved ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">
                          نتيجة الاختبار: {testResult.approved ? '✅ موافق' : '❌ مرفوض'}
                        </h4>
                        <Badge variant={testResult.approved ? 'outline' : 'destructive'}>
                          ثقة: {Math.round(testResult.confidence * 100)}%
                        </Badge>
                      </div>

                      {testResult.evaluations && testResult.evaluations.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2">تفاصيل التقييم:</h5>
                          <div className="space-y-2">
                            {testResult.evaluations.map((evaluation: any, index: number) => (
                              <div
                                key={index}
                                className={`p-3 rounded-lg ${
                                  evaluation.passed ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{evaluation.requirementName}</span>
                                  {evaluation.passed ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <p className="text-sm mt-1">{evaluation.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {testResult.recommendedActions && testResult.recommendedActions.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2">التوصيات:</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {testResult.recommendedActions.map((action: string, index: number) => (
                              <li key={index}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* محاكي السيناريوهات */}
        <TabsContent value="simulator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                محاكي السيناريوهات المتقدم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">محاكي السيناريوهات المتقدم</h3>
                <p className="text-gray-600 mb-4">اختبر قوانينك مع سيناريوهات متنوعة وحالات حقيقية</p>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  قريباً - تحت التطوير
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تحليل الأداء */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                تحليل أداء القوانين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">94.2%</div>
                  <div className="text-sm text-gray-600">معدل الدقة الإجمالي</div>
                  <Progress value={94.2} className="mt-2" />
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
                  <div className="text-sm text-gray-600">طلب تمت معالجته تلقائياً</div>
                  <Progress value={87} className="mt-2" />
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">2.4s</div>
                  <div className="text-sm text-gray-600">متوسط وقت المعالجة</div>
                  <Progress value={92} className="mt-2" />
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-semibold mb-4">أداء القوانين الأكثر استخداماً</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">قانون المساحة الدنيا للمباني السكنية</div>
                      <div className="text-sm text-gray-600">استخدم 847 مرة</div>
                    </div>
                    <Badge variant="outline">96% دقة</Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">قانون ارتفاع المباني التجارية</div>
                      <div className="text-sm text-gray-600">استخدم 623 مرة</div>
                    </div>
                    <Badge variant="outline">91% دقة</Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">قانون المباني الصناعية - المسافات الآمنة</div>
                      <div className="text-sm text-gray-600">استخدم 234 مرة</div>
                    </div>
                    <Badge variant="outline">99% دقة</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إدارة القوانين */}
        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                إدارة القوانين النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {existingRules && existingRules.length > 0 ? (
                  existingRules.map((existingRule: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{existingRule.ruleName || 'قانون غير مسمى'}</h4>
                        <p className="text-sm text-gray-600">{existingRule.description || 'لا يوجد وصف'}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{existingRule.category}</Badge>
                          <Badge variant={existingRule.isActive ? 'outline' : 'secondary'}>
                            {existingRule.isActive ? 'نشط' : 'متوقف'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">تعديل</Button>
                        <Button size="sm" variant="destructive">حذف</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد قوانين منشأة بعد</p>
                    <p className="text-sm">ابدأ بإنشاء قانونك الأول من تبويب "منشئ القانون"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}