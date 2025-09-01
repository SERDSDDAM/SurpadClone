import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  BarChart3,
  Target,
  Lightbulb,
  Database
} from "lucide-react";

interface LearningMetrics {
  accuracy: number;
  processed_cases: number;
  improvement_rate: number;
  confidence_score: number;
  last_training: string;
}

interface TrainingCase {
  id: string;
  input_data: any;
  expected_decision: string;
  actual_decision: string;
  confidence: number;
  feedback_provided: boolean;
  learning_impact: 'high' | 'medium' | 'low';
}

interface AIInsight {
  type: 'pattern' | 'recommendation' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action_needed: boolean;
}

export function AITrainerInterface() {
  const [metrics, setMetrics] = useState<LearningMetrics>({
    accuracy: 0.92,
    processed_cases: 847,
    improvement_rate: 0.15,
    confidence_score: 0.88,
    last_training: '2024-01-20T10:30:00Z'
  });

  const [trainingCases, setTrainingCases] = useState<TrainingCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<TrainingCase | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    // محاكاة بيانات التدريب
    const mockCases: TrainingCase[] = [
      {
        id: 'case-001',
        input_data: { buildingArea: 180, height: 15, buildingType: 'residential' },
        expected_decision: 'approve',
        actual_decision: 'approve',
        confidence: 0.95,
        feedback_provided: true,
        learning_impact: 'medium'
      },
      {
        id: 'case-002',
        input_data: { buildingArea: 90, height: 25, buildingType: 'commercial' },
        expected_decision: 'reject',
        actual_decision: 'approve',
        confidence: 0.72,
        feedback_provided: false,
        learning_impact: 'high'
      },
      {
        id: 'case-003',
        input_data: { buildingArea: 250, height: 18, buildingType: 'mixed-use' },
        expected_decision: 'conditional',
        actual_decision: 'conditional',
        confidence: 0.88,
        feedback_provided: true,
        learning_impact: 'low'
      }
    ];

    const mockInsights: AIInsight[] = [
      {
        type: 'pattern',
        title: 'نمط في المساحات الصغيرة',
        description: 'النظام يميل لرفض المباني السكنية أقل من 100م² حتى لو كانت تحقق الشروط الأخرى',
        impact: 'medium',
        action_needed: true
      },
      {
        type: 'recommendation',
        title: 'تحسين دقة المباني التجارية',
        description: 'يُنصح بإضافة المزيد من حالات التدريب للمباني التجارية لتحسين الدقة',
        impact: 'high',
        action_needed: true
      },
      {
        type: 'warning',
        title: 'انخفاض في الثقة',
        description: 'مستوى الثقة في القرارات المتعلقة بالمباني المختلطة منخفض نسبياً',
        impact: 'medium',
        action_needed: false
      }
    ];

    setTrainingCases(mockCases);
    setInsights(mockInsights);
  }, []);

  const provideFeedback = async (caseId: string, feedback: string, correctDecision: string) => {
    setIsTraining(true);
    
    // محاكاة عملية التدريب
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // تحديث الحالة
    setTrainingCases(prev => 
      prev.map(c => 
        c.id === caseId 
          ? { ...c, feedback_provided: true, expected_decision: correctDecision }
          : c
      )
    );

    // تحسين المقاييس
    setMetrics(prev => ({
      ...prev,
      accuracy: Math.min(prev.accuracy + 0.02, 1.0),
      processed_cases: prev.processed_cases + 1,
      improvement_rate: 0.18
    }));

    setIsTraining(false);
    setFeedback('');
    setSelectedCase(null);
  };

  const startBatchTraining = async () => {
    setIsTraining(true);
    
    // محاكاة التدريب المجمع
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      // تحديث شريط التقدم سيتم هنا
    }

    // تحديث المقاييس بعد التدريب
    setMetrics(prev => ({
      ...prev,
      accuracy: Math.min(prev.accuracy + 0.05, 1.0),
      confidence_score: Math.min(prev.confidence_score + 0.03, 1.0),
      last_training: new Date().toISOString()
    }));

    setIsTraining(false);
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approve': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reject': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'conditional': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <BarChart3 className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Brain className="h-5 w-5" />
          واجهة تدريب الذكاء الاصطناعي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">المقاييس</TabsTrigger>
            <TabsTrigger value="training">التدريب</TabsTrigger>
            <TabsTrigger value="insights">الرؤى</TabsTrigger>
            <TabsTrigger value="history">السجل</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">الدقة</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(metrics.accuracy * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">الحالات المعالجة</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {metrics.processed_cases.toLocaleString()}
                      </p>
                    </div>
                    <Database className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">معدل التحسن</p>
                      <p className="text-2xl font-bold text-purple-600">
                        +{(metrics.improvement_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">مستوى الثقة</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {(metrics.confidence_score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Brain className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-4 text-right">تقدم الدقة عبر الوقت</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">الهدف: 95%</span>
                    <span className="text-sm font-medium">{(metrics.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.accuracy * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button 
                onClick={startBatchTraining} 
                disabled={isTraining}
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                {isTraining ? 'جاري التدريب...' : 'بدء التدريب المجمع'}
              </Button>
              <Badge variant="outline">
                {trainingCases.filter(c => !c.feedback_provided).length} حالة تحتاج تغذية راجعة
              </Badge>
            </div>

            <div className="space-y-4">
              {trainingCases.map((trainingCase) => (
                <Card key={trainingCase.id} className={!trainingCase.feedback_provided ? 'border-yellow-200 bg-yellow-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 mb-2">
                          {getDecisionIcon(trainingCase.actual_decision)}
                          <span className="text-sm font-medium">
                            القرار: {trainingCase.actual_decision}
                          </span>
                          <Badge variant="outline">
                            ثقة: {(trainingCase.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          البيانات: مساحة {trainingCase.input_data.buildingArea}م²، 
                          ارتفاع {trainingCase.input_data.height}م، 
                          نوع: {trainingCase.input_data.buildingType}
                        </div>

                        {trainingCase.expected_decision !== trainingCase.actual_decision && (
                          <div className="text-sm text-red-600 mb-2">
                            ⚠️ القرار المتوقع: {trainingCase.expected_decision}
                          </div>
                        )}
                      </div>

                      {!trainingCase.feedback_provided && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCase(trainingCase)}
                        >
                          تقديم تغذية راجعة
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedCase && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4 text-right">تغذية راجعة للحالة {selectedCase.id}</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block text-right">القرار الصحيح:</label>
                      <Select defaultValue={selectedCase.expected_decision}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر القرار الصحيح" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">موافقة</SelectItem>
                          <SelectItem value="reject">رفض</SelectItem>
                          <SelectItem value="conditional">مشروط</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-right">ملاحظات إضافية:</label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="اشرح سبب القرار الصحيح..."
                        className="text-right"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setSelectedCase(null)}>
                        إلغاء
                      </Button>
                      <Button 
                        onClick={() => provideFeedback(selectedCase.id, feedback, 'approve')}
                        disabled={isTraining}
                      >
                        حفظ التغذية الراجعة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {insights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant={
                          insight.impact === 'high' ? 'destructive' : 
                          insight.impact === 'medium' ? 'secondary' : 
                          'outline'
                        }>
                          {insight.impact === 'high' ? 'عالي' : insight.impact === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      {insight.action_needed && (
                        <Button size="sm" variant="outline">
                          اتخاذ إجراء
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-4 text-right">سجل جلسات التدريب</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="text-right">
                      <p className="text-sm font-medium">جلسة التدريب #847</p>
                      <p className="text-xs text-gray-600">2024-01-20 10:30 صباحاً</p>
                    </div>
                    <Badge variant="outline">+2.5% دقة</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="text-right">
                      <p className="text-sm font-medium">جلسة التدريب #846</p>
                      <p className="text-xs text-gray-600">2024-01-19 02:15 مساءً</p>
                    </div>
                    <Badge variant="outline">+1.8% دقة</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="text-right">
                      <p className="text-sm font-medium">جلسة التدريب #845</p>
                      <p className="text-xs text-gray-600">2024-01-18 09:45 صباحاً</p>
                    </div>
                    <Badge variant="outline">+3.1% دقة</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}