import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scale, 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  BookOpen,
  Gavel,
  CheckCircle,
  AlertTriangle,
  Building,
  Home,
  Store,
  Factory
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScenarioSimulator } from './ScenarioSimulator';
import { SmartTemplatesLibrary } from './SmartTemplatesLibrary';
import { AITrainerInterface } from './AITrainerInterface';

interface LegalRule {
  id?: string;
  ruleName: string;
  description: string;
  category: string;
  conditions: LegalCondition[];
  actions: LegalAction[];
  priority: number;
  isActive: boolean;
  applicableServices: string[];
}

interface LegalCondition {
  field: string;
  fieldDisplayName: string;
  operator: string;
  value: any;
  valueType: 'number' | 'string' | 'boolean' | 'array';
  isRequired: boolean;
}

interface LegalAction {
  type: 'approve' | 'reject' | 'require_review' | 'escalate' | 'request_documents';
  message: string;
  additionalData?: Record<string, any>;
}

const BUILDING_TYPES = [
  { value: 'residential', label: 'سكني', icon: Home },
  { value: 'commercial', label: 'تجاري', icon: Store },
  { value: 'industrial', label: 'صناعي', icon: Factory },
  { value: 'mixed', label: 'مختلط', icon: Building },
];

const SERVICE_TYPES = [
  { value: 'building_permit', label: 'رخصة البناء' },
  { value: 'occupancy_certificate', label: 'شهادة الإشغال' },
  { value: 'renovation_permit', label: 'ترخيص التجديد' },
  { value: 'demolition_permit', label: 'ترخيص الهدم' },
];

const CONDITION_FIELDS = [
  { value: 'area_sqm', label: 'المساحة (م²)', type: 'number' },
  { value: 'floors', label: 'عدد الطوابق', type: 'number' },
  { value: 'height_m', label: 'الارتفاع (م)', type: 'number' },
  { value: 'buildingType', label: 'نوع المبنى', type: 'string' },
  { value: 'location', label: 'الموقع', type: 'string' },
  { value: 'district', label: 'المنطقة', type: 'string' },
  { value: 'hasParkingSpace', label: 'موقف السيارات', type: 'boolean' },
  { value: 'hasDisabilityAccess', label: 'تسهيلات المعاقين', type: 'boolean' },
  { value: 'estimatedCost', label: 'التكلفة المقدرة', type: 'number' },
  { value: 'urgencyLevel', label: 'مستوى الإلحاح', type: 'string' },
];

const OPERATORS = [
  { value: '<', label: 'أصغر من' },
  { value: '<=', label: 'أصغر من أو يساوي' },
  { value: '>', label: 'أكبر من' },
  { value: '>=', label: 'أكبر من أو يساوي' },
  { value: '==', label: 'يساوي' },
  { value: '!=', label: 'لا يساوي' },
  { value: 'in', label: 'ضمن القائمة' },
  { value: 'contains', label: 'يحتوي على' },
];

export function LegalCodeBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('builder');
  const [rule, setRule] = useState<LegalRule>({
    ruleName: '',
    description: '',
    category: 'building_permit',
    conditions: [],
    actions: [],
    priority: 5,
    isActive: true,
    applicableServices: ['building_permit']
  });

  const [testData, setTestData] = useState({
    area_sqm: 150,
    floors: 2,
    height_m: 8,
    buildingType: 'residential',
    location: 'صنعاء - همدان',
    district: 'همدان',
    hasParkingSpace: true,
    hasDisabilityAccess: true,
    estimatedCost: 500000,
    urgencyLevel: 'normal'
  });

  const [testResult, setTestResult] = useState<any>(null);

  // حفظ القانون
  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData: LegalRule) => {
      return apiRequest('/api/smart-automation/legal-rules', {
        method: 'POST',
        body: JSON.stringify(ruleData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-automation/automation-rules'] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ القانون بنجاح",
      });
      // إعادة تعيين النموذج
      setRule({
        ruleName: '',
        description: '',
        category: 'building_permit',
        conditions: [],
        actions: [],
        priority: 5,
        isActive: true,
        applicableServices: ['building_permit']
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ القانون",
        variant: "destructive",
      });
    }
  });

  // اختبار القانون
  const testRuleMutation = useMutation({
    mutationFn: async (data: { rule: LegalRule; testData: any }) => {
      return apiRequest('/api/smart-automation/test-legal-rule', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result) => {
      setTestResult(result);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الاختبار",
        description: error.message || "فشل في اختبار القانون",
        variant: "destructive",
      });
    }
  });

  const addCondition = () => {
    setRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, {
        field: 'area_sqm',
        fieldDisplayName: 'المساحة (م²)',
        operator: '>',
        value: 0,
        valueType: 'number',
        isRequired: true
      }]
    }));
  };

  const removeCondition = (index: number) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, updates: Partial<LegalCondition>) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) => 
        i === index ? { ...cond, ...updates } : cond
      )
    }));
  };

  const addAction = () => {
    setRule(prev => ({
      ...prev,
      actions: [...prev.actions, {
        type: 'approve',
        message: 'تمت الموافقة تلقائياً'
      }]
    }));
  };

  const removeAction = (index: number) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const updateAction = (index: number, updates: Partial<LegalAction>) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, ...updates } : action
      )
    }));
  };

  const handleTestRule = () => {
    if (rule.conditions.length === 0) {
      toast({
        title: "تحذير",
        description: "يجب إضافة شرط واحد على الأقل لاختبار القانون",
        variant: "destructive",
      });
      return;
    }

    testRuleMutation.mutate({ rule, testData });
  };

  const handleSaveRule = () => {
    if (!rule.ruleName.trim()) {
      toast({
        title: "خطأ",
        description: "يجب إدخال اسم القانون",
        variant: "destructive",
      });
      return;
    }

    if (rule.conditions.length === 0) {
      toast({
        title: "خطأ",
        description: "يجب إضافة شرط واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (rule.actions.length === 0) {
      toast({
        title: "خطأ",
        description: "يجب إضافة إجراء واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    saveRuleMutation.mutate(rule);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Scale className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">مولد قوانين البناء والاشتراطات</h2>
          <p className="text-sm text-muted-foreground">
            أنشئ قوانين تلقائية لتطبيق اشتراطات البناء والتراخيص
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="builder">إنشاء القانون</TabsTrigger>
          <TabsTrigger value="templates">القوالب الذكية</TabsTrigger>
          <TabsTrigger value="test">اختبار القانون</TabsTrigger>
          <TabsTrigger value="simulator">محاكي السيناريوهات</TabsTrigger>
          <TabsTrigger value="ai-trainer">مدرب الذكاء الاصطناعي</TabsTrigger>
          <TabsTrigger value="history">السجل</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          {/* معلومات أساسية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اسم القانون *</label>
                  <Input
                    placeholder="مثال: موافقة تلقائية للمباني السكنية الصغيرة"
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
                    {SERVICE_TYPES.map(service => (
                      <option key={service.value} value={service.value}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الأولوية</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={rule.priority}
                    onChange={(e) => setRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                    data-testid="input-rule-priority"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={rule.isActive}
                    onChange={(e) => setRule(prev => ({ ...prev, isActive: e.target.checked }))}
                    data-testid="checkbox-rule-active"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    قانون نشط
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الوصف</label>
                <Textarea
                  placeholder="اشرح ما يفعله هذا القانون وفي أي حالات يُطبق..."
                  value={rule.description}
                  onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  data-testid="textarea-rule-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* الشروط */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  الشروط والاشتراطات
                </CardTitle>
                <Button onClick={addCondition} size="sm" data-testid="button-add-condition">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة شرط
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rule.conditions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم إضافة أي شروط بعد</p>
                  <p className="text-sm">اضغط "إضافة شرط" لتحديد الاشتراطات</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rule.conditions.map((condition, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div>
                          <label className="block text-sm font-medium mb-1">الحقل</label>
                          <select
                            value={condition.field}
                            onChange={(e) => {
                              const field = CONDITION_FIELDS.find(f => f.value === e.target.value);
                              updateCondition(index, {
                                field: e.target.value,
                                fieldDisplayName: field?.label || e.target.value,
                                valueType: field?.type as any || 'string'
                              });
                            }}
                            className="w-full px-3 py-2 border rounded text-sm"
                            data-testid={`select-condition-field-${index}`}
                          >
                            {CONDITION_FIELDS.map(field => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">العملية</label>
                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(index, { operator: e.target.value })}
                            className="w-full px-3 py-2 border rounded text-sm"
                            data-testid={`select-condition-operator-${index}`}
                          >
                            {OPERATORS.map(op => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">القيمة</label>
                          {condition.valueType === 'boolean' ? (
                            <select
                              value={condition.value?.toString()}
                              onChange={(e) => updateCondition(index, { value: e.target.value === 'true' })}
                              className="w-full px-3 py-2 border rounded text-sm"
                              data-testid={`select-condition-value-${index}`}
                            >
                              <option value="true">نعم</option>
                              <option value="false">لا</option>
                            </select>
                          ) : condition.valueType === 'number' ? (
                            <Input
                              type="number"
                              value={condition.value}
                              onChange={(e) => updateCondition(index, { value: parseFloat(e.target.value) || 0 })}
                              className="text-sm"
                              data-testid={`input-condition-value-${index}`}
                            />
                          ) : (
                            <Input
                              value={condition.value}
                              onChange={(e) => updateCondition(index, { value: e.target.value })}
                              className="text-sm"
                              data-testid={`input-condition-value-${index}`}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeCondition(index)}
                            data-testid={`button-remove-condition-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* الإجراءات */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  الإجراءات المطلوبة
                </CardTitle>
                <Button onClick={addAction} size="sm" data-testid="button-add-action">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة إجراء
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rule.actions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لم يتم إضافة أي إجراءات بعد</p>
                  <p className="text-sm">حدد ما يجب فعله عند استيفاء الشروط</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rule.actions.map((action, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-sm font-medium mb-1">نوع الإجراء</label>
                          <select
                            value={action.type}
                            onChange={(e) => updateAction(index, { type: e.target.value as any })}
                            className="w-full px-3 py-2 border rounded text-sm"
                            data-testid={`select-action-type-${index}`}
                          >
                            <option value="approve">موافقة تلقائية</option>
                            <option value="reject">رفض تلقائي</option>
                            <option value="require_review">تتطلب مراجعة</option>
                            <option value="escalate">تصعيد للإدارة</option>
                            <option value="request_documents">طلب مستندات إضافية</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">الرسالة</label>
                          <Input
                            value={action.message}
                            onChange={(e) => updateAction(index, { message: e.target.value })}
                            placeholder="رسالة توضيحية للمواطن..."
                            className="text-sm"
                            data-testid={`input-action-message-${index}`}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeAction(index)}
                            data-testid={`button-remove-action-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* أزرار التحكم */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSaveRule}
              disabled={saveRuleMutation.isPending}
              size="lg"
              data-testid="button-save-rule"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveRuleMutation.isPending ? 'جاري الحفظ...' : 'حفظ القانون'}
            </Button>

            <Button
              variant="outline"
              onClick={handleTestRule}
              disabled={testRuleMutation.isPending}
              data-testid="button-test-rule"
            >
              <Play className="h-4 w-4 mr-2" />
              اختبار القانون
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اختبار القانون</CardTitle>
              <p className="text-sm text-muted-foreground">
                أدخل بيانات تجريبية لاختبار القانون المُنشأ
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="number"
                  placeholder="المساحة (م²)"
                  value={testData.area_sqm}
                  onChange={(e) => setTestData(prev => ({ ...prev, area_sqm: parseInt(e.target.value) || 0 }))}
                  data-testid="input-test-area"
                />
                <Input
                  type="number"
                  placeholder="عدد الطوابق"
                  value={testData.floors}
                  onChange={(e) => setTestData(prev => ({ ...prev, floors: parseInt(e.target.value) || 0 }))}
                  data-testid="input-test-floors"
                />
                <Input
                  type="number"
                  placeholder="الارتفاع (م)"
                  value={testData.height_m}
                  onChange={(e) => setTestData(prev => ({ ...prev, height_m: parseInt(e.target.value) || 0 }))}
                  data-testid="input-test-height"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={testData.buildingType}
                  onChange={(e) => setTestData(prev => ({ ...prev, buildingType: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  data-testid="select-test-building-type"
                >
                  {BUILDING_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <Input
                  placeholder="الموقع"
                  value={testData.location}
                  onChange={(e) => setTestData(prev => ({ ...prev, location: e.target.value }))}
                  data-testid="input-test-location"
                />
              </div>

              <Button
                onClick={handleTestRule}
                disabled={testRuleMutation.isPending || rule.conditions.length === 0}
                className="w-full"
                data-testid="button-run-test"
              >
                <Play className="h-4 w-4 mr-2" />
                {testRuleMutation.isPending ? 'جاري الاختبار...' : 'تشغيل الاختبار'}
              </Button>

              {testResult && (
                <Alert className={testResult.approved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <div className="flex items-center gap-2">
                    {testResult.approved ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <strong>
                      النتيجة: {testResult.approved ? 'موافقة' : 'رفض'}
                    </strong>
                  </div>
                  <AlertDescription className="mt-2">
                    <div className="space-y-2">
                      <p>مستوى الثقة: {(testResult.confidence * 100).toFixed(1)}%</p>
                      <p>القرار: {testResult.decision}</p>
                      {testResult.reasoning?.length > 0 && (
                        <div>
                          <strong>الأسباب:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {testResult.reasoning.map((reason: string, index: number) => (
                              <li key={index} className="text-sm">{reason}</li>
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

        <TabsContent value="templates" className="space-y-6">
          <SmartTemplatesLibrary onApplyTemplate={(template) => {
            // تطبيق القالب المحدد
            setRule({
              ...rule,
              ruleName: template.name,
              description: template.description,
              category: template.category,
              conditions: template.conditions,
              actions: template.actions
            });
            setActiveTab('builder');
            toast({
              title: "تم تطبيق القالب",
              description: `تم تطبيق قالب "${template.name}" بنجاح`,
            });
          }} />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <ScenarioSimulator />
        </TabsContent>

        <TabsContent value="ai-trainer" className="space-y-6">
          <AITrainerInterface />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                سجل القوانين المنشأة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-right">
                    <h4 className="font-medium">قانون المساحة الدنيا للمباني السكنية</h4>
                    <p className="text-sm text-gray-600">تم الإنشاء: 2024-01-20 15:30</p>
                  </div>
                  <Badge variant="outline">نشط</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-right">
                    <h4 className="font-medium">قانون ارتفاع المباني التجارية</h4>
                    <p className="text-sm text-gray-600">تم الإنشاء: 2024-01-19 11:15</p>
                  </div>
                  <Badge variant="outline">نشط</Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-right">
                    <h4 className="font-medium">قانون المباني الصناعية - المسافات الآمنة</h4>
                    <p className="text-sm text-gray-600">تم الإنشاء: 2024-01-18 09:45</p>
                  </div>
                  <Badge variant="secondary">متوقف</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}