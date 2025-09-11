import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Pause, 
  Play,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RulePerformance {
  id: string;
  ruleName: string;
  ruleCategory: string;
  isActive: boolean;
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecuted: string | null;
  confidence: number;
  errorCount: number;
  humanOverrideRate: number;
  recentPerformance: Array<{
    date: string;
    executions: number;
    successRate: number;
    avgTime: number;
  }>;
  status: 'excellent' | 'good' | 'needs_review' | 'poor';
}

interface PerformanceAlerts {
  lowPerformanceRules: string[];
  highErrorRates: string[];
  slowExecutionTimes: string[];
  frequentOverrides: string[];
}

export function RulePerformanceMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // جلب أداء القواعد
  const { data: rulesPerformance, isLoading, refetch } = useQuery({
    queryKey: ['/api/smart-automation/rules/performance', selectedTimeRange],
    enabled: true,
  });

  // جلب التنبيهات
  const { data: alerts } = useQuery({
    queryKey: ['/api/smart-automation/alerts/performance'],
    enabled: true,
  });

  // تبديل حالة القاعدة (تفعيل/إيقاف)
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      return apiRequest(`/api/smart-automation/automation-rules/${ruleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/smart-automation/rules/performance'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة القاعدة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث القاعدة",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'green';
      case 'good': return 'blue';
      case 'needs_review': return 'yellow';
      case 'poor': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'needs_review': return 'يحتاج مراجعة';
      case 'poor': return 'ضعيف';
      default: return 'غير محدد';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'لم ينفذ بعد';
    return new Date(dateString).toLocaleDateString('ar-YE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري تحميل بيانات الأداء...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rules: RulePerformance[] = (rulesPerformance as any)?.data || [];

  return (
    <div className="space-y-6">
      {/* ملخص الأداء العام */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{rules.filter(r => r.isActive).length}</div>
            <p className="text-sm text-muted-foreground">قواعد نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {rules.length > 0 ? (rules.reduce((sum, r) => sum + r.successRate, 0) / rules.length).toFixed(1) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">متوسط معدل النجاح</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {rules.reduce((sum, r) => sum + r.executionCount, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">إجمالي التنفيذات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {rules.length > 0 ? formatTime(rules.reduce((sum, r) => sum + r.averageExecutionTime, 0) / rules.length) : '0ms'}
            </div>
            <p className="text-sm text-muted-foreground">متوسط وقت التنفيذ</p>
          </CardContent>
        </Card>
      </div>

      {/* التنبيهات */}
      {alerts && (
        <div className="space-y-4">
          {(alerts as any)?.lowPerformanceRules?.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>قواعد منخفضة الأداء:</strong> {(alerts as any).lowPerformanceRules.join(', ')}
              </AlertDescription>
            </Alert>
          )}
          
          {(alerts as any)?.highErrorRates?.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>معدلات خطأ عالية:</strong> {(alerts as any).highErrorRates.join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* جدول أداء القواعد */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              مراقبة أداء القواعد
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="24h">آخر 24 ساعة</option>
                <option value="7d">آخر 7 أيام</option>
                <option value="30d">آخر 30 يوم</option>
                <option value="90d">آخر 3 أشهر</option>
              </select>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                تحديث
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الحالة</TableHead>
                <TableHead>اسم القاعدة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>معدل النجاح</TableHead>
                <TableHead>عدد التنفيذات</TableHead>
                <TableHead>متوسط الوقت</TableHead>
                <TableHead>آخر تنفيذ</TableHead>
                <TableHead>الأداء</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => 
                          toggleRuleMutation.mutate({ ruleId: rule.id, isActive: checked })
                        }
                        disabled={toggleRuleMutation.isPending}
                        data-testid={`switch-rule-${rule.id}`}
                      />
                      <span className="text-sm">
                        {rule.isActive ? (
                          <Play className="h-4 w-4 text-green-600" />
                        ) : (
                          <Pause className="h-4 w-4 text-gray-400" />
                        )}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">{rule.ruleName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {rule.id.substring(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">{rule.ruleCategory}</Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={rule.successRate} 
                        className="w-16 h-2"
                      />
                      <span className="text-sm font-medium">
                        {rule.successRate.toFixed(1)}%
                      </span>
                      {rule.successRate >= 90 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : rule.successRate < 70 ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : null}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{rule.executionCount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {rule.errorCount > 0 && `${rule.errorCount} خطأ`}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{formatTime(rule.averageExecutionTime)}</div>
                      <div className="text-xs text-muted-foreground">
                        {rule.averageExecutionTime > 2000 && (
                          <span className="text-yellow-600">بطيء</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {formatDate(rule.lastExecuted)}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`bg-${getStatusColor(rule.status)}-100 text-${getStatusColor(rule.status)}-800`}
                    >
                      {getStatusText(rule.status)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" data-testid={`button-configure-${rule.id}`}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      
                      {rule.humanOverrideRate > 20 && (
                        <Badge variant="destructive" className="text-xs">
                          تدخل بشري {rule.humanOverrideRate.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {rules.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد قواعد مُنشأة بعد</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href="/rule-builder">إنشاء قاعدة جديدة</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* رسم بياني للأداء (مبسط) */}
      {rules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>اتجاهات الأداء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* أفضل القواعد أداءً */}
              <div>
                <h4 className="font-medium mb-3 text-green-700">أفضل القواعد أداءً</h4>
                <div className="space-y-2">
                  {rules
                    .filter(r => r.isActive)
                    .sort((a, b) => b.successRate - a.successRate)
                    .slice(0, 3)
                    .map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{rule.ruleName}</div>
                          <div className="text-xs text-muted-foreground">
                            {rule.executionCount} تنفيذ
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{rule.successRate.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">{formatTime(rule.averageExecutionTime)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* القواعد التي تحتاج تحسين */}
              <div>
                <h4 className="font-medium mb-3 text-red-700">تحتاج تحسين</h4>
                <div className="space-y-2">
                  {rules
                    .filter(r => r.isActive && r.successRate < 80)
                    .sort((a, b) => a.successRate - b.successRate)
                    .slice(0, 3)
                    .map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{rule.ruleName}</div>
                          <div className="text-xs text-muted-foreground">
                            {rule.errorCount} خطأ
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">{rule.successRate.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">
                            تدخل بشري {rule.humanOverrideRate.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}