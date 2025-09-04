import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StreetStatusDecision } from '../../shared/survey-schema';

interface DashboardStats {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  escalated: number;
}

interface PriorityCardProps {
  decision: StreetStatusDecision;
  onAction: (actionType: string, decision: StreetStatusDecision) => void;
}

function PriorityCard({ decision, onAction }: PriorityCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'normal': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'normal': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'under_review': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'escalated': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ar-YE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={`transition-all hover:shadow-md ${getPriorityColor(decision.priority)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {decision.streetName}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {decision.neighborhood}، {decision.governorate}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Badge variant={getPriorityBadgeColor(decision.priority)}>
              {decision.priority === 'high' ? 'عاجل' : decision.priority === 'medium' ? 'متوسط' : 'عادي'}
            </Badge>
            {getStatusIcon(decision.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">رقم القرار:</span>
            <span className="font-medium">{decision.decisionNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">نوع القرار:</span>
            <span className="font-medium">{decision.decisionType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">تاريخ الإرسال:</span>
            <span className="font-medium">
              {decision.submittedAt ? formatDate(decision.submittedAt) : 'غير محدد'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">الفرع المختص:</span>
            <span className="font-medium">{decision.branchOffice}</span>
          </div>
          
          <Separator className="my-3" />
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 space-x-reverse">
              <Button
                size="sm"
                onClick={() => onAction('approve', decision)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="ml-2 h-4 w-4" />
                اعتماد
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('escalate', decision)}
                className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
              >
                <AlertTriangle className="ml-2 h-4 w-4" />
                تصعيد
              </Button>
            </div>
            <Button variant="ghost" className="text-gray-600" onClick={() => onAction('view', decision)}>
              <Eye className="ml-2 h-4 w-4" />
              عرض التفاصيل
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BranchReviewerDashboard() {
  console.log("🔥 BranchReviewerDashboard component is loading...");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // جلب قائمة الطلبات الجديدة من الخادم
  const { data: decisions = [], isLoading } = useQuery<StreetStatusDecision[]>({
    queryKey: ['/api/street-survey/street-decisions'],
    queryFn: async (): Promise<StreetStatusDecision[]> => {
      console.log("🔥 جاري جلب بيانات القرارات...");
      try {
        const response = await fetch('/api/street-survey/street-decisions');
        if (!response.ok) {
          console.log("⚠️ API خطأ، استخدام البيانات التجريبية...");
          throw new Error('API failed');
        }
        const result = await response.json();
        console.log("✅ تم جلب البيانات من الخادم:", result);
        return result.data || [];
      } catch (error) {
        console.log("🔄 فشل في جلب البيانات:", error);
        // في حالة فشل API، إرجاع قائمة فارغة
        return [];
      }
    },
    staleTime: 1000 * 60 * 5
  });

  const [selectedDecision, setSelectedDecision] = useState<StreetStatusDecision | null>(null);

  // حساب الإحصائيات
  const stats: DashboardStats = {
    total: decisions.length,
    pending: decisions.filter(d => d.status === 'pending').length,
    underReview: decisions.filter(d => d.status === 'under_review').length,
    approved: decisions.filter(d => d.status === 'approved').length,
    escalated: decisions.filter(d => d.status === 'escalated').length,
  };

  // اعتماد وإصدار القرار
  const approveMutation = useMutation({
    mutationFn: async (decisionId: string) => {
      const response = await fetch(`/api/street-survey/street-decisions/${decisionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'approved',
          reviewNotes: 'تم الاعتماد تلقائياً من قبل النظام الذكي'
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الاعتماد بنجاح",
        description: "تم اعتماد القرار المساحي وإصدار الوثيقة",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/street-survey/street-decisions'] });
      setSelectedDecision(null);
    },
    onError: () => {
      toast({
        title: "خطأ في الاعتماد",
        description: "حدث خطأ أثناء اعتماد القرار",
        variant: "destructive",
      });
    },
  });

  // تصعيد القرار
  const escalateMutation = useMutation({
    mutationFn: async ({ decisionId, reason }: { decisionId: string; reason: string }) => {
      const response = await fetch(`/api/street-survey/street-decisions/${decisionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'escalated',
          escalationReason: reason,
          escalationLevel: 1
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التصعيد بنجاح",
        description: "تم تصعيد القرار للمستوى التالي",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/street-survey/street-decisions'] });
    },
    onError: () => {
      toast({
        title: "خطأ في التصعيد",
        description: "حدث خطأ أثناء تصعيد القرار",
        variant: "destructive",
      });
    },
  });

  const handleAction = (actionType: string, decision: StreetStatusDecision) => {
    switch (actionType) {
      case 'approve':
        approveMutation.mutate(decision.id);
        break;
      case 'escalate':
        escalateMutation.mutate({ 
          decisionId: decision.id, 
          reason: 'يحتاج إلى مراجعة إضافية من المستوى الأعلى' 
        });
        break;
      case 'view':
        setSelectedDecision(decision);
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">جاري تحميل لوحة المراجعة الذكية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            لوحة المراجعة الذكية - فرع صنعاء
          </h1>
          <p className="text-gray-600">
            نظام المراجعة التلقائية للقرارات المساحية مع الذكاء الاصطناعي
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">إجمالي الطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">في الانتظار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">تحت المراجعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">تم الاعتماد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">تم التصعيد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.escalated}</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Decisions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              القرارات النشطة ({decisions.length})
            </h2>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" size="sm">
                تحديث البيانات
              </Button>
              <Button size="sm">
                قرار جديد
              </Button>
            </div>
          </div>

          {decisions.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 mb-4">
                  <Clock className="h-16 w-16" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد قرارات متاحة حالياً
                </h3>
                <p className="text-gray-600 text-center max-w-md">
                  سيتم عرض القرارات المساحية الجديدة هنا عند وصولها من النظام.
                  تأكد من اتصالك بالخادم وحاول تحديث الصفحة.
                </p>
                <Button className="mt-4" onClick={() => window.location.reload()}>
                  تحديث الصفحة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {decisions.map((decision) => (
                <PriorityCard
                  key={decision.id}
                  decision={decision}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}