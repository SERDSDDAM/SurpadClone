import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MapPin,
  Clock, 
  User,
  CheckCircle,
  AlertTriangle,
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Target,
  Map,
  Download,
  Upload
} from "lucide-react";

const STATUS_COLORS = {
  submitted: "bg-blue-100 text-blue-800",
  assigned_to_surveyor: "bg-yellow-100 text-yellow-800",
  field_survey_in_progress: "bg-orange-100 text-orange-800",
  survey_completed: "bg-green-100 text-green-800",
  under_technical_review: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  issued: "bg-emerald-100 text-emerald-800"
};

const STATUS_LABELS = {
  submitted: "مقدم",
  assigned_to_surveyor: "مُسند للمساح",
  field_survey_in_progress: "قيد الرفع الميداني", 
  survey_completed: "مكتمل الرفع",
  under_technical_review: "قيد المراجعة الفنية",
  approved: "معتمد",
  rejected: "مرفوض",
  issued: "صادر"
};

export default function SurveyDashboard() {
  const { toast } = useToast();

  // Fetch survey requests
  const { data: surveyRequests = [], isLoading } = useQuery({
    queryKey: ['/api/survey-requests'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Statistics
  const stats = {
    total: surveyRequests.length,
    inProgress: surveyRequests.filter((r: any) => 
      ['assigned_to_surveyor', 'field_survey_in_progress'].includes(r.status)
    ).length,
    completed: surveyRequests.filter((r: any) => r.status === 'issued').length,
    pending: surveyRequests.filter((r: any) => r.status === 'submitted').length
  };

  const assignSurveyorMutation = useMutation({
    mutationFn: async ({ requestId, surveyorId }: { requestId: string; surveyorId: string }) => {
      return await apiRequest(`/api/survey-requests/${requestId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ surveyorId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/survey-requests'] });
      toast({ title: "تم تعيين المساح بنجاح" });
    },
    onError: () => {
      toast({ 
        title: "خطأ في التعيين", 
        variant: "destructive" 
      });
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم القرارات المساحية</h1>
          <p className="text-gray-600 mt-1">إدارة ومتابعة طلبات القرارات المساحية</p>
        </div>
        
        <div className="flex gap-3">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            طلب جديد
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
                <p className="text-sm text-gray-600">قيد التنفيذ</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-gray-600">مكتملة</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">في الانتظار</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="البحث في الطلبات..."
                className="border border-gray-300 rounded px-3 py-2 min-w-[250px]"
              />
            </div>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              تصفية
            </Button>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              التاريخ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Survey Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة طلبات القرارات المساحية</CardTitle>
          <CardDescription>
            جميع الطلبات المقدمة مع حالتها الحالية
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {surveyRequests.map((request: any) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {request.requestNumber}
                      </h3>
                      <Badge className={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}>
                        {STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                      {request.priority === 'high' && (
                        <Badge variant="destructive">عاجل</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{request.ownerName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{request.governorate} - {request.directorate}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>مقدم في: {formatDate(request.submittedAt)}</span>
                      </div>
                    </div>

                    {request.assignedSurveyorId && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <Target className="h-4 w-4" />
                        <span>مُسند للمساح: {request.assignedSurveyorId}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      <Map className="h-3 w-3" />
                      عرض
                    </Button>
                    
                    {request.status === 'submitted' && (
                      <Button 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          // This would open a modal to select surveyor
                          assignSurveyorMutation.mutate({ 
                            requestId: request.id, 
                            surveyorId: 'temp-surveyor-id' // Would come from selection
                          });
                        }}
                      >
                        <User className="h-3 w-3" />
                        تعيين مساح
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Progress bar for ongoing requests */}
                {['assigned_to_surveyor', 'field_survey_in_progress', 'under_technical_review'].includes(request.status) && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                      <span>تقدم الطلب</span>
                      <span>{request.completionPercentage || 0}%</span>
                    </div>
                    <Progress value={request.completionPercentage || 0} className="h-2" />
                  </div>
                )}
              </div>
            ))}
            
            {surveyRequests.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات</h3>
                <p className="text-gray-600">لم يتم تقديم أي طلبات قرار مساحي بعد</p>
                <Button className="mt-4 flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  إضافة طلب جديد
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}