import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Play, Upload, Download, RotateCcw, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  inputData: Record<string, any>;
  expectedDecision: string;
  expectedConfidence?: number;
  actualDecision?: string;
  actualConfidence?: number;
  actualReasoning?: string[];
  status: 'pending' | 'passed' | 'failed' | 'running';
  executionTime?: number;
  riskLevel?: string;
}

interface SimulationBatch {
  id: string;
  name: string;
  scenarios: TestScenario[];
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  averageConfidence: number;
  averageExecutionTime: number;
  overallAccuracy: number;
}

const PREDEFINED_SCENARIOS: Partial<TestScenario>[] = [
  {
    name: 'مبنى سكني صغير - توقع موافقة',
    description: 'مبنى سكني صغير يجب أن يحصل على موافقة تلقائية',
    inputData: {
      buildingType: 'residential',
      area_sqm: 150,
      floors: 1,
      estimatedCost: 80000,
      district: 'صنعاء',
      urgencyLevel: 'medium'
    },
    expectedDecision: 'approve',
    expectedConfidence: 0.9
  },
  {
    name: 'مشروع تجاري كبير - توقع مراجعة',
    description: 'مشروع تجاري كبير يتطلب مراجعة إضافية',
    inputData: {
      buildingType: 'commercial',
      area_sqm: 2000,
      floors: 6,
      estimatedCost: 2500000,
      district: 'العاصمة',
      urgencyLevel: 'high'
    },
    expectedDecision: 'require_review',
    expectedConfidence: 0.8
  },
  {
    name: 'منطقة تراثية - توقع تصعيد',
    description: 'مبنى في منطقة تراثية يجب تصعيده للجنة التراث',
    inputData: {
      buildingType: 'residential',
      area_sqm: 300,
      floors: 2,
      estimatedCost: 200000,
      district: 'المنطقة التاريخية',
      location: 'البلدة القديمة',
      urgencyLevel: 'low'
    },
    expectedDecision: 'escalate',
    expectedConfidence: 0.95
  },
  {
    name: 'طوارئ - توقع مسار سريع',
    description: 'طلب طوارئ يجب معالجته بشكل عاجل',
    inputData: {
      buildingType: 'repair',
      projectType: 'humanitarian',
      urgencyLevel: 'emergency',
      estimatedCost: 50000,
      district: 'صنعاء'
    },
    expectedDecision: 'fast_track',
    expectedConfidence: 0.9
  }
];

export function ScenarioSimulator() {
  const { toast } = useToast();
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [newScenario, setNewScenario] = useState<Partial<TestScenario>>({
    name: '',
    description: '',
    inputData: {},
    expectedDecision: '',
    expectedConfidence: 0.8
  });
  const [jsonInput, setJsonInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<SimulationBatch | null>(null);

  const addPredefinedScenarios = () => {
    const newScenarios = PREDEFINED_SCENARIOS.map((scenario, index) => ({
      id: `pred_${Date.now()}_${index}`,
      name: scenario.name || '',
      description: scenario.description || '',
      inputData: scenario.inputData || {},
      expectedDecision: scenario.expectedDecision || '',
      expectedConfidence: scenario.expectedConfidence || 0.8,
      status: 'pending' as const
    }));
    
    setScenarios(prev => [...prev, ...newScenarios]);
    toast({
      title: "تمت الإضافة",
      description: `تم إضافة ${newScenarios.length} سيناريو جاهز`,
    });
  };

  const addScenarioFromJson = () => {
    if (!jsonInput.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بيانات JSON صحيحة",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = JSON.parse(jsonInput);
      const scenario: TestScenario = {
        id: `custom_${Date.now()}`,
        name: newScenario.name || `سيناريو مخصص ${scenarios.length + 1}`,
        description: newScenario.description || 'سيناريو اختبار مخصص',
        inputData: data,
        expectedDecision: newScenario.expectedDecision || 'require_review',
        expectedConfidence: newScenario.expectedConfidence || 0.8,
        status: 'pending'
      };

      setScenarios(prev => [...prev, scenario]);
      setJsonInput('');
      setNewScenario({
        name: '',
        description: '',
        inputData: {},
        expectedDecision: '',
        expectedConfidence: 0.8
      });

      toast({
        title: "تم إضافة السيناريو",
        description: scenario.name,
      });
    } catch (error) {
      toast({
        title: "خطأ في JSON",
        description: "تأكد من صحة تنسيق البيانات",
        variant: "destructive",
      });
    }
  };

  const runSingleScenario = async (scenario: TestScenario) => {
    try {
      setScenarios(prev => prev.map(s => 
        s.id === scenario.id 
          ? { ...s, status: 'running' }
          : s
      ));

      const startTime = Date.now();
      
      const response = await apiRequest('/api/smart-automation/decisions/automated', {
        method: 'POST',
        body: JSON.stringify({
          requestType: 'building_permit',
          requestData: scenario.inputData,
          urgencyLevel: scenario.inputData.urgencyLevel || 'medium'
        })
      });

      const executionTime = Date.now() - startTime;
      const decision = response.decision;

      const updatedScenario: TestScenario = {
        ...scenario,
        actualDecision: decision.decision,
        actualConfidence: decision.confidence,
        actualReasoning: decision.reasoning || [],
        executionTime,
        riskLevel: decision.riskAssessment?.level,
        status: decision.decision === scenario.expectedDecision ? 'passed' : 'failed'
      };

      setScenarios(prev => prev.map(s => 
        s.id === scenario.id ? updatedScenario : s
      ));

      return updatedScenario;
    } catch (error: any) {
      const failedScenario: TestScenario = {
        ...scenario,
        status: 'failed',
        actualReasoning: [`خطأ في التنفيذ: ${error.message}`]
      };

      setScenarios(prev => prev.map(s => 
        s.id === scenario.id ? failedScenario : s
      ));

      return failedScenario;
    }
  };

  const runAllScenarios = async () => {
    if (scenarios.length === 0) {
      toast({
        title: "لا توجد سيناريوهات",
        description: "أضف سيناريوهات أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    
    try {
      const batchId = `batch_${Date.now()}`;
      const results: TestScenario[] = [];

      // تشغيل السيناريوهات بالتتابع
      for (const scenario of scenarios) {
        if (scenario.status === 'pending') {
          const result = await runSingleScenario(scenario);
          results.push(result);
        } else {
          results.push(scenario);
        }
      }

      // حساب الإحصائيات
      const passedCount = results.filter(r => r.status === 'passed').length;
      const failedCount = results.filter(r => r.status === 'failed').length;
      const totalConfidence = results
        .filter(r => r.actualConfidence !== undefined)
        .reduce((sum, r) => sum + (r.actualConfidence || 0), 0);
      const totalExecutionTime = results
        .filter(r => r.executionTime !== undefined)
        .reduce((sum, r) => sum + (r.executionTime || 0), 0);

      const batch: SimulationBatch = {
        id: batchId,
        name: `محاكاة ${new Date().toLocaleString('ar-YE')}`,
        scenarios: results,
        totalScenarios: results.length,
        passedScenarios: passedCount,
        failedScenarios: failedCount,
        averageConfidence: totalConfidence / results.length,
        averageExecutionTime: totalExecutionTime / results.length,
        overallAccuracy: (passedCount / results.length) * 100
      };

      setCurrentBatch(batch);

      toast({
        title: "انتهت المحاكاة",
        description: `نجح ${passedCount} من ${results.length} سيناريو (${batch.overallAccuracy.toFixed(1)}%)`,
      });

    } catch (error: any) {
      toast({
        title: "خطأ في المحاكاة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const clearScenarios = () => {
    setScenarios([]);
    setCurrentBatch(null);
    toast({
      title: "تم المسح",
      description: "تم مسح جميع السيناريوهات",
    });
  };

  const exportResults = () => {
    if (!currentBatch) {
      toast({
        title: "لا توجد نتائج",
        description: "قم بتشغيل المحاكاة أولاً",
        variant: "destructive",
      });
      return;
    }

    const dataStr = JSON.stringify(currentBatch, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `simulation_results_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "تم التصدير",
      description: "تم تصدير نتائج المحاكاة",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <div className="h-4 w-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* إضافة سيناريوهات */}
      <Card>
        <CardHeader>
          <CardTitle>إضافة سيناريوهات اختبار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={addPredefinedScenarios}
              data-testid="button-add-predefined-scenarios"
            >
              <Upload className="h-4 w-4 mr-2" />
              إضافة سيناريوهات جاهزة ({PREDEFINED_SCENARIOS.length})
            </Button>
            
            <Button
              variant="outline"
              onClick={clearScenarios}
              disabled={scenarios.length === 0}
              data-testid="button-clear-scenarios"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              مسح الكل
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scenarioName">اسم السيناريو</Label>
              <Input
                id="scenarioName"
                placeholder="سيناريو اختبار مخصص"
                value={newScenario.name}
                onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-scenario-name"
              />
            </div>
            
            <div>
              <Label htmlFor="expectedDecision">القرار المتوقع</Label>
              <Input
                id="expectedDecision"
                placeholder="approve, reject, require_review"
                value={newScenario.expectedDecision}
                onChange={(e) => setNewScenario(prev => ({ ...prev, expectedDecision: e.target.value }))}
                data-testid="input-expected-decision"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="scenarioDescription">وصف السيناريو</Label>
            <Input
              id="scenarioDescription"
              placeholder="وصف مختصر للسيناريو"
              value={newScenario.description}
              onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
              data-testid="input-scenario-description"
            />
          </div>

          <div>
            <Label htmlFor="jsonInput">بيانات الإدخال (JSON)</Label>
            <Textarea
              id="jsonInput"
              placeholder={`{
  "buildingType": "residential",
  "area_sqm": 150,
  "floors": 2,
  "estimatedCost": 75000,
  "district": "صنعاء"
}`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={6}
              data-testid="textarea-json-input"
            />
          </div>

          <Button
            onClick={addScenarioFromJson}
            disabled={!jsonInput.trim()}
            data-testid="button-add-custom-scenario"
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة سيناريو مخصص
          </Button>
        </CardContent>
      </Card>

      {/* قائمة السيناريوهات */}
      {scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>السيناريوهات ({scenarios.length})</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={runAllScenarios}
                  disabled={isRunning}
                  data-testid="button-run-all-scenarios"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? 'جاري التشغيل...' : 'تشغيل جميع السيناريوهات'}
                </Button>
                
                {currentBatch && (
                  <Button
                    variant="outline"
                    onClick={exportResults}
                    data-testid="button-export-results"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تصدير النتائج
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحالة</TableHead>
                  <TableHead>السيناريو</TableHead>
                  <TableHead>متوقع</TableHead>
                  <TableHead>فعلي</TableHead>
                  <TableHead>الثقة</TableHead>
                  <TableHead>الوقت</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((scenario) => (
                  <TableRow key={scenario.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(scenario.status)}
                        <Badge variant={scenario.status === 'passed' ? 'default' : scenario.status === 'failed' ? 'destructive' : 'secondary'}>
                          {scenario.status === 'passed' ? 'نجح' :
                           scenario.status === 'failed' ? 'فشل' :
                           scenario.status === 'running' ? 'جاري...' : 'في الانتظار'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{scenario.name}</div>
                        <div className="text-sm text-muted-foreground">{scenario.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{scenario.expectedDecision}</Badge>
                    </TableCell>
                    <TableCell>
                      {scenario.actualDecision ? (
                        <Badge variant={scenario.actualDecision === scenario.expectedDecision ? 'default' : 'destructive'}>
                          {scenario.actualDecision}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {scenario.actualConfidence !== undefined ? (
                        <div className="flex items-center gap-2">
                          <Progress value={scenario.actualConfidence * 100} className="w-16 h-2" />
                          <span className="text-sm">{(scenario.actualConfidence * 100).toFixed(0)}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {scenario.executionTime ? `${scenario.executionTime}ms` : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runSingleScenario(scenario)}
                        disabled={isRunning}
                        data-testid={`button-run-scenario-${scenario.id}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* نتائج المحاكاة */}
      {currentBatch && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج المحاكاة: {currentBatch.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentBatch.passedScenarios}</div>
                <div className="text-sm text-muted-foreground">سيناريوهات ناجحة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{currentBatch.failedScenarios}</div>
                <div className="text-sm text-muted-foreground">سيناريوهات فاشلة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{currentBatch.overallAccuracy.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">دقة النظام</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{currentBatch.averageExecutionTime.toFixed(0)}ms</div>
                <div className="text-sm text-muted-foreground">متوسط وقت التنفيذ</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>دقة النظام الإجمالية</Label>
                  <span>{currentBatch.overallAccuracy.toFixed(1)}%</span>
                </div>
                <Progress value={currentBatch.overallAccuracy} className="h-3" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>متوسط مستوى الثقة</Label>
                  <span>{(currentBatch.averageConfidence * 100).toFixed(1)}%</span>
                </div>
                <Progress value={currentBatch.averageConfidence * 100} className="h-3" />
              </div>
            </div>

            {currentBatch.overallAccuracy < 80 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  تحذير: دقة النظام أقل من 80%. قد تحتاج لمراجعة قوانين الأتمتة أو تدريب النموذج.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}