import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Shield, 
  FileText,
  Zap,
  ArrowUp,
  Eye,
  CheckSquare
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { StreetStatusDecision } from "@shared/schema";

interface SmartDecisionCardProps {
  decision: StreetStatusDecision;
  onApprove: () => void;
  onEscalate: (reason: string) => void;
  isProcessing?: boolean;
}

function SmartDecisionCard({ decision, onApprove, onEscalate, isProcessing }: SmartDecisionCardProps) {
  const [escalationReason, setEscalationReason] = useState("");
  const [showEscalationDialog, setShowEscalationDialog] = useState(false);

  // محاكاة التحليل الذكي (في التطبيق الحقيقي سيأتي من API)
  const smartAnalysis = {
    locationVerified: true,
    administrativeLocation: "صنعاء > مديرية سنحان > الربع الغربي",
    planningStatus: "داخل حدود المخطط",
    riskLevel: "منخفض",
    heritageRisk: false,
    floodRisk: false,
    systemRecommendation: "طلب روتيني - يمكن اعتماده في الفرع",
    escalationLevel: 1,
    canAutoApprove: decision.escalationLevel === 0
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-right">
            بطاقة القرار الذكية - {decision.decisionNumber}
          </CardTitle>
          <Badge variant={smartAnalysis.canAutoApprove ? "default" : "secondary"}>
            {smartAnalysis.canAutoApprove ? "جاهز للاعتماد" : "يتطلب مراجعة"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* معلومات الطلب الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">معلومات الطلب</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">اسم الشارع:</span> {decision.streetName}</p>
              <p><span className="font-medium">الحي:</span> {decision.neighborhood}</p>
              <p><span className="font-medium">مقدم الطلب:</span> {decision.requestedBy}</p>
              <p><span className="font-medium">نوع القرار:</span> {decision.decisionType}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">الحالة الحالية</h3>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{decision.status}</Badge>
                <span className="text-gray-600">منذ {new Date(decision.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
              <p><span className="font-medium">الأولوية:</span> {decision.priority}</p>
              <p><span className="font-medium">الأيام المقدرة:</span> {decision.estimatedProcessingDays} يوم</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* التحقق التلقائي من الموقع */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">التحقق التلقائي من الموقع</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">الحالة:</span>
                <span className="text-green-700">تم التحقق بنجاح ✅</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="font-medium">الموقع الإداري:</span>
                <span>{smartAnalysis.administrativeLocation}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">الحالة التخطيطية:</span>
                <span className="text-green-700">{smartAnalysis.planningStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="font-medium">مستوى المخاطر:</span>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {smartAnalysis.riskLevel}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* تحليل المخاطر الأولي */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">تحليل المخاطر الأولي</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${!smartAnalysis.heritageRisk ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">طبقة التراث:</span>
              <span className={!smartAnalysis.heritageRisk ? 'text-green-700' : 'text-red-700'}>
                {!smartAnalysis.heritageRisk ? 'بعيد عن المنطقة التراثية' : 'قريب من منطقة تراثية'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${!smartAnalysis.floodRisk ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className="font-medium">طبقة الفيضانات:</span>
              <span className={!smartAnalysis.floodRisk ? 'text-green-700' : 'text-orange-700'}>
                {!smartAnalysis.floodRisk ? 'خارج نطاق مخاطر الفيضانات' : 'داخل منطقة خطر فيضان'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="font-medium">الحالة العامة:</span>
              <span className="text-green-700">لا توجد مخاطر عالية ⚠️</span>
            </div>
          </div>
        </div>

        {/* التوصية التلقائية للنظام */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">التوصية التلقائية للنظام</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-500" />
              <span className="font-medium">الإجراء الموصى به:</span>
              <span className="text-green-700">{smartAnalysis.systemRecommendation}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-blue-500" />
              <span className="font-medium">مستوى التصعيد المقترح:</span>
              <Badge variant="outline">المستوى {smartAnalysis.escalationLevel} (مراجعة الفرع)</Badge>
            </div>
            
            {smartAnalysis.canAutoApprove && (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-green-700 font-medium">✨ مؤهل للاعتماد التلقائي</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* أزرار الإجراءات الذكية */}
        <div className="flex gap-4 justify-end">
          {smartAnalysis.canAutoApprove && (
            <Button
              onClick={onApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="approve-decision-button"
            >
              <CheckCircle className="ml-2 h-4 w-4" />
              اعتماد وإصدار
            </Button>
          )}
          
          <Dialog open={showEscalationDialog} onOpenChange={setShowEscalationDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                data-testid="escalate-decision-button"
              >
                <ArrowUp className="ml-2 h-4 w-4" />
                تصعيد يدوي للمكتب (إشكال شارع)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-right">تصعيد يدوي للمكتب الإشرافي</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-right">
                    سبب التصعيد اليدوي
                  </label>
                  <Textarea
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="اذكر سبب التصعيد اليدوي..."
                    className="text-right"
                    data-testid="escalation-reason-input"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowEscalationDialog(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => {
                      onEscalate(escalationReason);
                      setShowEscalationDialog(false);
                      setEscalationReason("");
                    }}
                    disabled={!escalationReason.trim() || isProcessing}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    تصعيد
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="ghost" className="text-gray-600">
            <Eye className="ml-2 h-4 w-4" />
            عرض التفاصيل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BranchReviewerDashboard() {
  console.log("🔥 BranchReviewerDashboard component is loading...");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // جلب قائمة الطلبات الجديدة + بيانات وهمية للاختبار
  const { data: decisions = [], isLoading } = useQuery<StreetStatusDecision[]>({
    queryKey: ['/api/street-survey/street-decisions'],
    queryFn: async (): Promise<StreetStatusDecision[]> => {
      // بيانات وهمية لـ UAT - السيناريوهات الخمسة
      return [
        {
          id: "test-001",
          decisionNumber: "SD-2025-001",
          streetName: "شارع الربيع الجنوبي",
          streetCode: null,
          neighborhood: "حي السبعين",
          governorate: "أمانة العاصمة",
          directorate: "مديرية السبعين",
          coordinates: { latitude: 15.369, longitude: 44.191 },
          requestedBy: "أحمد محمد الحميدي",
          requestedByPhone: null,
          requestedByEmail: null,
          requestedByNationalId: null,
          requestedByAddress: null,
          decisionType: "تحديد حالة شارع",
          status: "under_review",
          statusReason: null,
          priority: "normal",
          escalationLevel: 0,
          estimatedProcessingDays: 3,
          actualProcessingDays: null,
          branchOffice: "فرع صنعاء الشرقي",
          supervisoryOffice: null,
          assignedReviewer: null,
          assignedSurveyor: null,
          reviewerComments: null,
          attachments: [],
          isUrgent: false,
          urgencyReason: null,
          legalReference: null,
          technicalSpecifications: null,
          environmentalImpact: "none",
          environmentalNotes: null,
          publicConsultationRequired: false,
          publicConsultationStatus: null,
          publicConsultationResults: null,
          fieldSurveyRequired: false,
          fieldSurveyCompleted: false,
          fieldSurveyResults: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          submittedAt: new Date(),
          reviewStartedAt: null,
          reviewCompletedAt: null,
          implementationDeadline: null
        },
        {
          id: "test-002",
          decisionNumber: "SD-2025-002",
          streetName: "زقاق الصالح التراثي",
          streetCode: null,
          neighborhood: "حي صنعاء القديمة",
          governorate: "أمانة العاصمة",
          directorate: "مديرية الصافية",
          coordinates: { latitude: 15.354, longitude: 44.215 },
          requestedBy: "فاطمة عبدالله الأهدل",
          requestedByPhone: null,
          requestedByEmail: null,
          requestedByNationalId: null,
          requestedByAddress: null,
          decisionType: "تحديد حالة شارع تراثي",
          status: "under_review",
          statusReason: null,
          priority: "high",
          escalationLevel: 1,
          estimatedProcessingDays: 14,
          actualProcessingDays: null,
          branchOffice: "فرع صنعاء المركزي",
          supervisoryOffice: null,
          assignedReviewer: null,
          assignedSurveyor: null,
          reviewerComments: null,
          attachments: [],
          isUrgent: false,
          urgencyReason: null,
          legalReference: null,
          technicalSpecifications: null,
          environmentalImpact: "none",
          environmentalNotes: null,
          publicConsultationRequired: false,
          publicConsultationStatus: null,
          publicConsultationResults: null,
          fieldSurveyRequired: false,
          fieldSurveyCompleted: false,
          fieldSurveyResults: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          submittedAt: new Date(),
          reviewStartedAt: null,
          reviewCompletedAt: null,
          implementationDeadline: null
        },
        {
          id: "test-003",
          decisionNumber: "SD-2025-003",
          streetName: "طريق وادي ضهر",
          streetCode: null,
          neighborhood: "حي ضهر",
          governorate: "أمانة العاصمة",
          directorate: "مديرية ضهر",
          coordinates: { latitude: 15.425, longitude: 44.168 },
          requestedBy: "علي حسن المؤيد",
          requestedByPhone: null,
          requestedByEmail: null,
          requestedByNationalId: null,
          requestedByAddress: null,
          decisionType: "تحديد حالة شارع معرض للفيضانات",
          status: "under_review",
          statusReason: null,
          priority: "high",
          escalationLevel: 2,
          estimatedProcessingDays: 21,
          actualProcessingDays: null,
          branchOffice: "فرع صنعاء الشمالي",
          supervisoryOffice: null,
          assignedReviewer: null,
          assignedSurveyor: null,
          reviewerComments: null,
          attachments: [],
          isUrgent: false,
          urgencyReason: null,
          legalReference: null,
          technicalSpecifications: null,
          environmentalImpact: "none",
          environmentalNotes: null,
          publicConsultationRequired: false,
          publicConsultationStatus: null,
          publicConsultationResults: null,
          fieldSurveyRequired: false,
          fieldSurveyCompleted: false,
          fieldSurveyResults: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          submittedAt: new Date(),
          reviewStartedAt: null,
          reviewCompletedAt: null,
          implementationDeadline: null
        }
      ];
    },
    staleTime: 1000 * 60 * 5
  });

  const [selectedDecision, setSelectedDecision] = useState<StreetStatusDecision | null>(null);

  // اعتماد وإصدار القرار
  const approveMutation = useMutation({
    mutationFn: async (decisionId: string) => {
      // API call لاعتماد القرار
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
          escalationLevel: 2,
          escalationReason: reason,
          lastEscalatedAt: new Date().toISOString()
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التصعيد بنجاح",
        description: "تم تصعيد القرار إلى المكتب الإشرافي",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/street-survey/street-decisions'] });
      setSelectedDecision(null);
    },
    onError: () => {
      toast({
        title: "خطأ في التصعيد",
        description: "حدث خطأ أثناء تصعيد القرار",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* رأس الصفحة */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-right">
            🧠 لوحة المراجعة الذكية - المراجع الفني
          </h1>
          <p className="mt-2 text-gray-600 text-right">
            مراجعة وإدارة طلبات القرارات المساحية مع التحليل الذكي التلقائي
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{decisions.length}</div>
              <div className="text-sm text-gray-600">إجمالي الطلبات</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {decisions.filter((d: StreetStatusDecision) => d.status === 'under_review').length}
              </div>
              <div className="text-sm text-gray-600">قيد المراجعة</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {decisions.filter((d: StreetStatusDecision) => d.escalationLevel === 0).length}
              </div>
              <div className="text-sm text-gray-600">جاهز للاعتماد</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <ArrowUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {decisions.filter((d: StreetStatusDecision) => d.escalationLevel > 0).length}
              </div>
              <div className="text-sm text-gray-600">مصعّد</div>
            </CardContent>
          </Card>
        </div>

        {/* جدول الطلبات أو بطاقة القرار الذكية */}
        {selectedDecision ? (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedDecision(null)}
              className="mb-4"
            >
              ← العودة إلى قائمة الطلبات
            </Button>
            
            <SmartDecisionCard
              decision={selectedDecision}
              onApprove={() => approveMutation.mutate(selectedDecision.id)}
              onEscalate={(reason) => escalateMutation.mutate({ 
                decisionId: selectedDecision.id, 
                reason 
              })}
              isProcessing={approveMutation.isPending || escalateMutation.isPending}
            />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-right">طلبات القرارات المساحية الجديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-4">رقم القرار</th>
                      <th className="text-right p-4">اسم الشارع</th>
                      <th className="text-right p-4">مقدم الطلب</th>
                      <th className="text-right p-4">الحالة</th>
                      <th className="text-right p-4">مستوى التصعيد</th>
                      <th className="text-right p-4">تاريخ الإنشاء</th>
                      <th className="text-right p-4">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.map((decision: StreetStatusDecision) => (
                      <tr key={decision.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{decision.decisionNumber}</td>
                        <td className="p-4">{decision.streetName}</td>
                        <td className="p-4">{decision.requestedBy}</td>
                        <td className="p-4">
                          <Badge variant={decision.status === 'under_review' ? 'default' : 'secondary'}>
                            {decision.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={decision.escalationLevel === 0 ? 'default' : 'destructive'}>
                            المستوى {decision.escalationLevel}
                          </Badge>
                        </td>
                        <td className="p-4">{new Date(decision.createdAt).toLocaleDateString('ar-SA')}</td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            onClick={() => setSelectedDecision(decision)}
                            data-testid={`view-decision-${decision.id}`}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            مراجعة ذكية
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {decisions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد طلبات جديدة للمراجعة</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}