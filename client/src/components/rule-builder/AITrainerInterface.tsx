import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  RefreshCw, 
  MessageSquare,
  Target,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TrainingCase {
  id: string;
  inputData: Record<string, any>;
  systemDecision: string;
  systemConfidence: number;
  humanDecision: string;
  humanFeedback: string;
  correctionDate: string;
  category: string;
  status: 'pending' | 'trained' | 'verified';
  impactScore?: number;
}

interface ModelMetrics {
  totalCases: number;
  trainedCases: number;
  accuracy: number;
  lastTraining: string;
  modelVersion: string;
  averageConfidence: number;
  improvementRate: number;
}

const DECISION_OPTIONS = [
  { value: 'approve', label: 'موافقة', color: 'green' },
  { value: 'reject', label: 'رفض', color: 'red' },
  { value: 'require_review', label: 'يتطلب مراجعة', color: 'blue' },
  { value: 'escalate', label: 'تصعيد', color: 'yellow' },
  { value: 'fast_track', label: 'مسار سريع', color: 'purple' },
];

export function AITrainerInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCase, setSelectedCase] = useState<TrainingCase | null>(null);
  const [humanDecision, setHumanDecision] = useState('');
  const [humanFeedback, setHumanFeedback] = useState('');
  const [isTraining, setIsTraining] = useState(false);

  // جلب حالات التدريب
  const { data: trainingCases, isLoading } = useQuery({
    queryKey: ['/api/smart-automation/training/cases'],
    enabled: true,
  });

  // جلب مقاييس النموذج
  const { data: modelMetrics } = useQuery({
    queryKey: ['/api/smart-automation/training/metrics'],
    enabled: true,
  });

  // إضافة تصحيح بشري
  const correctDecisionMutation = useMutation({
    mutationFn: async (correction: {
      caseId: string;
      humanDecision: string;
      humanFeedback: string;
    }) => {
      return apiRequest('/api/smart-automation/training/correct', {
        method: 'POST',
        body: JSON.stringify(correction),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-automation/training/cases'] });
      setSelectedCase(null);
      setHumanDecision('');
      setHumanFeedback('');
      toast({
        title: "تم الحفظ",
        description: "تم حفظ التصحيح البشري بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ التصحيح",
        variant: "destructive",
      });
    }
  });

  // إعادة تدريب النموذج
  const retrainModelMutation = useMutation({
    mutationFn: async () => {
      setIsTraining(true);
      return apiRequest('/api/smart-automation/training/retrain', {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-automation/training/metrics'] });
      setIsTraining(false);
      toast({
        title: "تم التدريب",
        description: `تم إعادة تدريب النموذج. دقة جديدة: ${(data.newAccuracy * 100).toFixed(1)}%`,
      });
    },
    onError: (error: any) => {
      setIsTraining(false);
      toast({
        title: "خطأ في التدريب",
        description: error.message || "فشل في إعادة تدريب النموذج",
        variant: "destructive",
      });
    }
  });

  const cases: TrainingCase[] = (trainingCases as any)?.data || [];
  const metrics: ModelMetrics = (modelMetrics as any)?.data || {
    totalCases: 0,
    trainedCases: 0,
    accuracy: 0,
    lastTraining: '',
    modelVersion: '1.0.0',
    averageConfidence: 0,
    improvementRate: 0
  };

  const handleCorrectDecision = () => {
    if (!selectedCase || !humanDecision || !humanFeedback.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إكمال جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    correctDecisionMutation.mutate({
      caseId: selectedCase.id,
      humanDecision,
      humanFeedback,
    });
  };

  const getDecisionColor = (decision: string) => {
    const option = DECISION_OPTIONS.find(opt => opt.value === decision);
    return option?.color || 'gray';
  };

  const getDecisionLabel = (decision: string) => {
    const option = DECISION_OPTIONS.find(opt => opt.value === decision);
    return option?.label || decision;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري تحميل بيانات التدريب...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* مقاييس النموذج */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.accuracy.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">دقة النموذج</p>
            <div className="mt-2">
              <Progress value={metrics.accuracy} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.trainedCases}</div>
            <p className="text-sm text-muted-foreground">حالات مُدربة</p>
            <div className="text-xs text-muted-foreground mt-1">
              من أصل {metrics.totalCases}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{metrics.averageConfidence.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">متوسط الثقة</p>
            <div className="flex items-center justify-center mt-2">
              {metrics.improvementRate > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : null}
              <span className="text-xs text-muted-foreground ml-1">
                {metrics.improvementRate > 0 && `+${metrics.improvementRate.toFixed(1)}%`}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-lg font-bold text-gray-700">{metrics.modelVersion}</div>
            <p className="text-sm text-muted-foreground">إصدار النموذج</p>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.lastTraining ? 
                new Date(metrics.lastTraining).toLocaleDateString('ar-YE') : 
                'لم يتم التدريب بعد'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أزرار التحكم */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            مدرب الذكاء الاصطناعي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => retrainModelMutation.mutate()}
              disabled={isTraining || cases.length === 0}
              size="lg"
              data-testid="button-retrain-model"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTraining ? 'animate-spin' : ''}`} />
              {isTraining ? 'جاري إعادة التدريب...' : 'إعادة تدريب النموذج'}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>عدد الحالات المتاحة للتدريب: {cases.filter(c => c.status === 'pending').length}</p>
              <p>آخر تدريب: {metrics.lastTraining ? 
                new Date(metrics.lastTraining).toLocaleString('ar-YE') : 
                'لم يتم التدريب بعد'
              }</p>
            </div>
          </div>
          
          {metrics.accuracy < 80 && (
            <Alert className="mt-4">
              <Target className="h-4 w-4" />
              <AlertDescription>
                دقة النموذج أقل من 80%. يُنصح بإضافة المزيد من التصحيحات البشرية وإعادة التدريب.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* جدول حالات التدريب */}
      <Card>
        <CardHeader>
          <CardTitle>حالات التدريب والتصحيح</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الحالة</TableHead>
                <TableHead>البيانات</TableHead>
                <TableHead>قرار النظام</TableHead>
                <TableHead>القرار الصحيح</TableHead>
                <TableHead>مستوى التأثير</TableHead>
                <TableHead>تاريخ التصحيح</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((case_) => (
                <TableRow key={case_.id}>
                  <TableCell>
                    <Badge variant={
                      case_.status === 'trained' ? 'default' :
                      case_.status === 'verified' ? 'secondary' : 'outline'
                    }>
                      {case_.status === 'trained' ? 'مُدرب' :
                       case_.status === 'verified' ? 'مُؤكد' : 'في الانتظار'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-xs">
                      <details className="cursor-pointer">
                        <summary className="text-sm font-medium">عرض البيانات</summary>
                        <pre className="text-xs mt-2 p-2 bg-gray-100 rounded">
                          {JSON.stringify(case_.inputData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`bg-${getDecisionColor(case_.systemDecision)}-100`}>
                        {getDecisionLabel(case_.systemDecision)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ثقة: {(case_.systemConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {case_.humanDecision ? (
                      <div>
                        <Badge variant="outline" className={`bg-${getDecisionColor(case_.humanDecision)}-100`}>
                          {getDecisionLabel(case_.humanDecision)}
                        </Badge>
                        {case_.humanFeedback && (
                          <details className="mt-1 cursor-pointer">
                            <summary className="text-xs text-muted-foreground">عرض التعليق</summary>
                            <p className="text-xs mt-1 p-2 bg-blue-50 rounded">
                              {case_.humanFeedback}
                            </p>
                          </details>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {case_.impactScore ? (
                      <div className="flex items-center gap-1">
                        <Progress value={case_.impactScore * 20} className="w-12 h-2" />
                        <span className="text-xs">{case_.impactScore}/5</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {case_.correctionDate ? 
                      new Date(case_.correctionDate).toLocaleDateString('ar-YE') : 
                      '-'
                    }
                  </TableCell>
                  
                  <TableCell>
                    {!case_.humanDecision && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCase(case_)}
                        data-testid={`button-correct-${case_.id}`}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        تصحيح
                      </Button>
                    )}
                    {case_.humanDecision && case_.status === 'pending' && (
                      <Badge variant="secondary" className="text-xs">
                        جاهز للتدريب
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {cases.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد حالات تدريب متاحة حالياً</p>
              <p className="text-sm text-muted-foreground mt-2">
                ستظهر هنا الحالات التي يتخذ فيها النظام قرارات خاطئة لإعادة تدريبه
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نموذج التصحيح */}
      {selectedCase && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              تصحيح قرار النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm mb-2">بيانات الحالة:</h4>
                <pre className="text-xs p-3 bg-gray-100 rounded max-h-32 overflow-y-auto">
                  {JSON.stringify(selectedCase.inputData, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">قرار النظام الحالي:</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`bg-${getDecisionColor(selectedCase.systemDecision)}-100`}>
                    {getDecisionLabel(selectedCase.systemDecision)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ثقة: {(selectedCase.systemConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">القرار الصحيح:</label>
                <select
                  value={humanDecision}
                  onChange={(e) => setHumanDecision(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  data-testid="select-human-decision"
                >
                  <option value="">اختر القرار الصحيح</option>
                  {DECISION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">سبب التصحيح:</label>
                <Textarea
                  placeholder="اشرح لماذا هذا القرار صحيح وما الذي أخطأ فيه النظام..."
                  value={humanFeedback}
                  onChange={(e) => setHumanFeedback(e.target.value)}
                  rows={3}
                  data-testid="textarea-human-feedback"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCorrectDecision}
                disabled={correctDecisionMutation.isPending || !humanDecision || !humanFeedback.trim()}
                data-testid="button-save-correction"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {correctDecisionMutation.isPending ? 'جاري الحفظ...' : 'حفظ التصحيح'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCase(null);
                  setHumanDecision('');
                  setHumanFeedback('');
                }}
                data-testid="button-cancel-correction"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نصائح التدريب */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Lightbulb className="h-5 w-5" />
            نصائح لتحسين أداء النموذج
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">🎯 تصحيحات فعّالة:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>اشرح السبب بوضوح في تعليقك</li>
                <li>ركز على الحالات الأكثر تكراراً</li>
                <li>صحح القرارات ذات التأثير العالي أولاً</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📈 تحسين مستمر:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>أعد تدريب النموذج كل 20-30 تصحيح</li>
                <li>راقب اتجاه تحسن الدقة بعد التدريب</li>
                <li>تحقق من النتائج على حالات جديدة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}