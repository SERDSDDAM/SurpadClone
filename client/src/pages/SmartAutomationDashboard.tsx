import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Bot,
  Settings,
  BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AutomatedDecision {
  id: string;
  requestId: string;
  decisionType: string;
  decisionResult: 'approve' | 'reject' | 'require_review' | 'escalate';
  confidenceScore: number;
  reasoning: string[];
  createdAt: string;
  executionTimeMs: number;
}

interface PerformanceStats {
  totalDecisions: number;
  successRate: number;
  averageConfidence: number;
  averageExecutionTime: number;
  humanOverrideRate: number;
  activeAutomationRules: number;
  recentRiskAssessments: number;
}

interface AutomationRule {
  id: string;
  ruleName: string;
  ruleCategory: string;
  priority: number;
  successRate: number | null;
  executionCount: number;
  isActive: boolean;
  description: string;
}

export function SmartAutomationDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // جلب إحصائيات الأداء
  const { data: performanceStats, isLoading: statsLoading } = useQuery<{ data: PerformanceStats }>({
    queryKey: ['/api/smart-automation/performance/stats', selectedPeriod],
    queryFn: () => apiRequest(`/api/smart-automation/performance/stats?days=${selectedPeriod}`)
  });

  // جلب القرارات الأخيرة
  const { data: recentDecisions, isLoading: decisionsLoading } = useQuery<{ data: AutomatedDecision[] }>({
    queryKey: ['/api/smart-automation/decisions/recent'],
    queryFn: () => apiRequest('/api/smart-automation/decisions/recent?limit=10')
  });

  // جلب قوانين الأتمتة
  const { data: automationRules, isLoading: rulesLoading } = useQuery<{ data: AutomationRule[] }>({
    queryKey: ['/api/smart-automation/automation-rules'],
    queryFn: () => apiRequest('/api/smart-automation/automation-rules?limit=20')
  });

  // اختبار القرار التلقائي
  const testDecisionMutation = useMutation({
    mutationFn: (testData: any) => 
      apiRequest('/api/smart-automation/decisions/automated', {
        method: 'POST',
        body: JSON.stringify(testData)
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-automation/decisions/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/smart-automation/performance/stats'] });
      toast({
        title: "نجح الاختبار!",
        description: `تم اتخاذ قرار ${data.decision?.decision} بثقة ${(data.decision?.confidence * 100)?.toFixed(0)}%`,
      });
    },
    onError: (error) => {
      toast({
        title: "فشل الاختبار",
        description: "حدث خطأ أثناء اختبار القرار التلقائي",
        variant: "destructive",
      });
    }
  });

  const handleTestDecision = () => {
    const testData = {
      requestType: 'building_permit',
      requestData: {
        id: `test_${Date.now()}`,
        type: 'residential',
        applicantId: 'test_user',
        estimatedCost: Math.floor(Math.random() * 200000) + 50000,
        district: Math.random() > 0.5 ? 'الحديدة' : 'صنعاء',
        floors: Math.floor(Math.random() * 3) + 1
      },
      urgencyLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    };
    
    testDecisionMutation.mutate(testData);
  };

  const getDecisionColor = (result: string) => {
    switch (result) {
      case 'approve': return 'bg-green-500';
      case 'reject': return 'bg-red-500';
      case 'require_review': return 'bg-yellow-500';
      case 'escalate': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getDecisionText = (result: string) => {
    switch (result) {
      case 'approve': return 'موافقة';
      case 'reject': return 'رفض';
      case 'require_review': return 'مراجعة';
      case 'escalate': return 'تصعيد';
      default: return result;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            الأتمتة الذكية - المرحلة الثالثة
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            نظام اتخاذ القرارات التلقائية وتحسين سير العمل
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleTestDecision}
            disabled={testDecisionMutation.isPending}
            data-testid="button-test-decision"
          >
            <Zap className="w-4 h-4 ml-2" />
            {testDecisionMutation.isPending ? 'جاري الاختبار...' : 'اختبار قرار تلقائي'}
          </Button>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-md"
            data-testid="select-period"
          >
            <option value="7">آخر 7 أيام</option>
            <option value="30">آخر 30 يوم</option>
            <option value="90">آخر 3 أشهر</option>
          </select>
        </div>
      </div>

      {/* إحصائيات الأداء */}
      {performanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-total-decisions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي القرارات</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-decisions">
                {performanceStats.data.totalDecisions}
              </div>
              <p className="text-xs text-muted-foreground">
                آخر {selectedPeriod} يوم
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-success-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-success-rate">
                {(performanceStats.data.successRate * 100).toFixed(1)}%
              </div>
              <Progress 
                value={performanceStats.data.successRate * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card data-testid="card-confidence">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط الثقة</CardTitle>
              <Brain className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-confidence">
                {(performanceStats.data.averageConfidence * 100).toFixed(1)}%
              </div>
              <Progress 
                value={performanceStats.data.averageConfidence * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          <Card data-testid="card-automation-rules">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">قوانين الأتمتة النشطة</CardTitle>
              <Settings className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="text-active-rules">
                {performanceStats.data.activeAutomationRules}
              </div>
              <p className="text-xs text-muted-foreground">
                قانون نشط
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* القرارات الأخيرة */}
        <Card data-testid="card-recent-decisions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-600" />
              القرارات التلقائية الأخيرة
            </CardTitle>
            <CardDescription>
              آخر 10 قرارات تم اتخاذها تلقائياً
            </CardDescription>
          </CardHeader>
          <CardContent>
            {decisionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : recentDecisions?.data?.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentDecisions.data.map((decision) => (
                  <div 
                    key={decision.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`decision-${decision.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${getDecisionColor(decision.decisionResult)} text-white`}>
                          {getDecisionText(decision.decisionResult)}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {decision.decisionType}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        طلب: {decision.requestId}
                      </div>
                      <div className="text-xs text-gray-500">
                        ثقة: {(decision.confidenceScore * 100).toFixed(0)}% • 
                        وقت: {decision.executionTimeMs}ms
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(decision.createdAt).toLocaleDateString('ar')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد قرارات تلقائية حتى الآن
              </div>
            )}
          </CardContent>
        </Card>

        {/* قوانين الأتمتة */}
        <Card data-testid="card-automation-rules">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              قوانين الأتمتة
            </CardTitle>
            <CardDescription>
              القوانين النشطة للقرارات التلقائية
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : automationRules?.data?.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {automationRules.data.map((rule) => (
                  <div 
                    key={rule.id}
                    className="p-3 border rounded-lg"
                    data-testid={`rule-${rule.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{rule.ruleName}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'نشط' : 'غير نشط'}
                        </Badge>
                        <Badge variant="outline">
                          أولوية {rule.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {rule.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>تصنيف: {rule.ruleCategory}</span>
                      <span>تنفيذ: {rule.executionCount} مرة</span>
                      {rule.successRate && (
                        <span>نجاح: {(rule.successRate * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                لا توجد قوانين أتمتة محددة
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ملاحظة المرحلة */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            المرحلة الثالثة: الأتمتة الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
            <p>✅ تم إطلاق نظام اتخاذ القرارات التلقائية الذكي</p>
            <p>✅ محرك تقييم المخاطر يعمل بكفاءة عالية</p>
            <p>✅ {performanceStats?.data?.activeAutomationRules || 0} قانون أتمتة نشط</p>
            <p>✅ معدل نجاح: {performanceStats ? (performanceStats.data.successRate * 100).toFixed(1) : 0}%</p>
            <p className="mt-3 font-medium">
              🚀 القادم: المرحلة الرابعة - الذكاء الاصطناعي المتقدم (سبتمبر-نوفمبر 2025)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}