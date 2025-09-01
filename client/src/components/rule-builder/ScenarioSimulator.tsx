import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Play } from "lucide-react";

interface SimulationResult {
  approved: boolean;
  decision: string;
  confidence: number;
  evaluations: Array<{
    requirementId: string;
    requirementName: string;
    passed: boolean;
    message: string;
    value?: any;
    expectedValue?: any;
  }>;
  recommendedActions: string[];
  reasoning: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export function ScenarioSimulator() {
  const [service, setService] = useState('');
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const services = [
    { id: 'building-permit', name: 'ترخيص بناء جديد' },
    { id: 'land-subdivision', name: 'اعتماد مخطط تقسيم أراضي' },
    { id: 'land-use-change', name: 'تعديل استخدام أرض' },
    { id: 'occupancy-certificate', name: 'شهادة إشغال' },
    { id: 'renovation-permit', name: 'ترخيص ترميم وتجديد' }
  ];

  const locations = [
    { code: 'SA-HAMDAN', name: 'همدان - صنعاء' },
    { code: 'AD-CRAITER', name: 'كريتر - عدن' },
    { code: 'TA-SALH', name: 'صالة - تعز' },
    { code: 'HD-CITY', name: 'مدينة الحديدة' },
    { code: 'IB-CITY', name: 'مدينة إب' }
  ];

  const buildingTypes = [
    { value: 'residential', label: 'سكني' },
    { value: 'commercial', label: 'تجاري' },
    { value: 'industrial', label: 'صناعي' },
    { value: 'mixed-use', label: 'مختلط الاستخدام' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setTestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const runSimulation = async () => {
    if (!service) {
      alert('يرجى اختيار الخدمة');
      return;
    }

    setIsLoading(true);
    try {
      // محاكاة القانون المُنشأ مسبقاً
      const mockRule = {
        ruleName: 'قانون المساحة الدنيا للمباني السكنية',
        conditions: [
          { field: 'buildingArea', operator: '>=', value: 120, fieldDisplayName: 'مساحة المبنى' },
          { field: 'height', operator: '<=', value: 20, fieldDisplayName: 'ارتفاع المبنى' }
        ],
        actions: [{ type: 'approve', message: 'تمت الموافقة تلقائياً' }]
      };

      const response = await fetch('/api/smart-automation/test-legal-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule: mockRule,
          testData: testData
        })
      });

      if (!response.ok) throw new Error('فشل في تشغيل المحاكاة');
      
      const simulationResult = await response.json();
      setResult(simulationResult);
    } catch (error: any) {
      console.error('خطأ في المحاكاة:', error);
      alert('حدث خطأ أثناء تشغيل المحاكاة');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSimulator = () => {
    setTestData({});
    setResult(null);
    setService('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Play className="h-5 w-5" />
          محاكي السيناريوهات المتقدم
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* اختيار الخدمة */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-right">الخدمة:</label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الخدمة" />
            </SelectTrigger>
            <SelectContent>
              {services.map((svc) => (
                <SelectItem key={svc.id} value={svc.id}>
                  {svc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* بيانات المحاكاة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-right">مساحة البناء (م²):</label>
            <Input
              type="number"
              placeholder="150"
              value={testData.buildingArea || ''}
              onChange={(e) => handleInputChange('buildingArea', parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-right">الارتفاع (م):</label>
            <Input
              type="number"
              placeholder="15"
              value={testData.height || ''}
              onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-right">الموقع:</label>
            <Select value={testData.location || ''} onValueChange={(value) => handleInputChange('location', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الموقع" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.code} value={loc.code}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-right">نوع المبنى:</label>
            <Select value={testData.buildingType || ''} onValueChange={(value) => handleInputChange('buildingType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المبنى" />
              </SelectTrigger>
              <SelectContent>
                {buildingTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-right">عدد الطوابق:</label>
            <Input
              type="number"
              placeholder="2"
              value={testData.floors || ''}
              onChange={(e) => handleInputChange('floors', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-right">مساحة القطعة (م²):</label>
            <Input
              type="number"
              placeholder="300"
              value={testData.lotArea || ''}
              onChange={(e) => handleInputChange('lotArea', parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={resetSimulator}>
            إعادة تعيين
          </Button>
          <Button onClick={runSimulation} disabled={isLoading || !service}>
            {isLoading ? 'جاري المحاكاة...' : 'تشغيل المحاكاة'}
          </Button>
        </div>

        {/* نتائج المحاكاة */}
        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                {result.approved ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                نتيجة المحاكاة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* القرار العام */}
              <div className="flex items-center justify-between">
                <Badge variant={result.approved ? "default" : "destructive"}>
                  {result.approved ? 'موافقة' : 'رفض'}
                </Badge>
                <div className="text-right">
                  <span className="text-sm text-gray-600">مستوى الثقة: </span>
                  <span className="font-bold">{(result.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* مستوى المخاطر */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant={
                    result.riskLevel === 'low' ? 'default' : 
                    result.riskLevel === 'medium' ? 'secondary' : 
                    'destructive'
                  }
                >
                  مخاطر {result.riskLevel === 'low' ? 'منخفضة' : result.riskLevel === 'medium' ? 'متوسطة' : 'عالية'}
                </Badge>
              </div>

              {/* تفاصيل التقييم */}
              <div className="space-y-2">
                <h4 className="font-medium text-right">تفاصيل التقييم:</h4>
                <div className="space-y-2">
                  {result.evaluations.map((evaluation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {evaluation.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">{evaluation.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* الإجراءات المقترحة */}
              {result.recommendedActions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-right flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    الإجراءات المقترحة:
                  </h4>
                  <ul className="space-y-1">
                    {result.recommendedActions.map((action, index) => (
                      <li key={index} className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                        • {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* الأسباب */}
              {result.reasoning.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-right">الأسباب:</h4>
                  <ul className="space-y-1">
                    {result.reasoning.map((reason, index) => (
                      <li key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}