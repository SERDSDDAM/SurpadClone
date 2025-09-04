import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  Clock, 
  Shield, 
  FileText,
  ArrowUp,
  Eye,
  CheckSquare,
  Scale,
  MapPin,
  Calendar,
  User,
  Building,
  Zap,
  History,
  Target
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { StreetStatusDecision } from "@shared/schema";

interface IntegratedCaseFileProps {
  decision: StreetStatusDecision;
  onMakeDecision: (decisionType: string, notes: string) => void;
  isProcessing?: boolean;
}

function IntegratedCaseFile({ decision, onMakeDecision, isProcessing }: IntegratedCaseFileProps) {
  const [decisionNotes, setDecisionNotes] = useState("");
  const [selectedDecisionType, setSelectedDecisionType] = useState("");

  // محاكاة بيانات التصعيد والتحليل (في التطبيق الحقيقي ستأتي من API)
  const escalationData = {
    escalationReason: "تصعيد تلقائي - تداخل مع منطقة تراثية",
    appliedRule: "Rule-H01: Heritage Site Proximity",
    level: decision.escalationLevel || 6,
    requiresMinisterialApproval: (decision.escalationLevel || 0) >= 6,
    estimatedProcessingDays: decision.estimatedProcessingDays || 45,
    riskFactors: [
      "قرب من منطقة تراثية (50 متر)",
      "يتطلب موافقة وزارة التراث",
      "مراجعة تقييم الأثر البيئي"
    ]
  };

  const auditTrail = [
    {
      timestamp: decision.createdAt,
      action: "إنشاء الطلب",
      actor: decision.requestedBy,
      details: `تم إنشاء طلب القرار المساحي رقم ${decision.decisionNumber}`
    },
    {
      timestamp: decision.submittedAt || decision.createdAt,
      action: "تسليم الطلب",
      actor: "النظام التلقائي",
      details: "تم تسليم الطلب للمراجعة الأولى"
    },
    {
      timestamp: decision.lastEscalatedAt || decision.createdAt,
      action: "تصعيد تلقائي",
      actor: "محرك التصعيد الذكي",
      details: escalationData.escalationReason
    }
  ];

  return (
    <div className="space-y-6">
      {/* رأس ملف القضية */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-right flex items-center gap-2">
              <Scale className="h-6 w-6 text-red-600" />
              ملف القضية المتكامل - {decision.decisionNumber}
            </CardTitle>
            <Badge variant="destructive" className="px-3 py-1">
              مستوى التصعيد: {escalationData.level}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* ملخص التصعيد */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <ArrowUp className="h-5 w-5 text-orange-600" />
            ملخص التصعيد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
                <div>
                  <span className="font-medium text-sm">سبب التصعيد:</span>
                  <p className="text-sm text-gray-700">{escalationData.escalationReason}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-500 mt-1" />
                <div>
                  <span className="font-medium text-sm">القاعدة المطبقة:</span>
                  <p className="text-sm text-gray-700">{escalationData.appliedRule}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-purple-500 mt-1" />
                <div>
                  <span className="font-medium text-sm">الوقت المقدر للمعالجة:</span>
                  <p className="text-sm text-gray-700">{escalationData.estimatedProcessingDays} يوم</p>
                </div>
              </div>
              
              {escalationData.requiresMinisterialApproval && (
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 text-red-500 mt-1" />
                  <div>
                    <span className="font-medium text-sm text-red-700">يتطلب موافقة وزارية</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* عوامل المخاطر */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              عوامل المخاطر المحددة:
            </h4>
            <ul className="space-y-1">
              {escalationData.riskFactors.map((factor, index) => (
                <li key={index} className="text-sm text-red-700 flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* التحليل الجغرافي التفاعلي */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            التحليل الجغرافي التفاعلي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="font-medium text-blue-800 mb-2">خريطة تفاعلية للموقع</h3>
            <p className="text-sm text-blue-700 mb-4">
              عرض قطعة الأرض مع تظليل واضح للمنطقة التراثية المتداخلة
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-800">الإحداثيات</div>
                <div className="text-gray-600">
                  {decision.coordinates && typeof decision.coordinates === 'object' ? 
                    `${(decision.coordinates as any).latitude}, ${(decision.coordinates as any).longitude}` : 
                    'غير محدد'
                  }
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-800">المسافة للتراث</div>
                <div className="text-red-600 font-medium">50 متر</div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-800">نوع التداخل</div>
                <div className="text-orange-600">منطقة حماية</div>
              </div>
            </div>
            
            <Button variant="outline" className="mt-4">
              <Eye className="ml-2 h-4 w-4" />
              فتح الخريطة التفاعلية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* سجل الإجراءات الكامل */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <History className="h-5 w-5 text-gray-600" />
            سجل الإجراءات الكامل (Audit Trail)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditTrail.map((entry, index) => (
              <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="h-3 w-3 bg-blue-500 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{entry.action}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString('ar-SA')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">بواسطة: {entry.actor}</div>
                  <div className="text-sm text-gray-700">{entry.details}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* نموذج القرار الاستراتيجي */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Scale className="h-5 w-5 text-green-600" />
            نموذج القرار الاستراتيجي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-700 mb-4">
            كمدير مكتب إشرافي، يمكنك إصدار قرار وضع شارع أو قرار معالجة حالة تراثية
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setSelectedDecisionType("heritage_approval")}
              variant={selectedDecisionType === "heritage_approval" ? "default" : "outline"}
              className="h-20 flex-col"
              data-testid="heritage-approval-button"
            >
              <Building className="h-6 w-6 mb-2" />
              <span>موافقة تراثية مشروطة</span>
            </Button>
            
            <Button
              onClick={() => setSelectedDecisionType("heritage_rejection")}
              variant={selectedDecisionType === "heritage_rejection" ? "destructive" : "outline"}
              className="h-20 flex-col"
              data-testid="heritage-rejection-button"
            >
              <AlertTriangle className="h-6 w-6 mb-2" />
              <span>رفض - تعارض تراثي</span>
            </Button>
          </div>
          
          {selectedDecisionType && (
            <div className="space-y-4 p-4 border rounded-lg bg-white">
              <div>
                <label className="text-sm font-medium mb-2 block text-right">
                  ملاحظات القرار والتوجيهات
                </label>
                <Textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={
                    selectedDecisionType === "heritage_approval" 
                      ? "اذكر الشروط والتوجيهات للموافقة..."
                      : "اذكر أسباب الرفض والتوصيات..."
                  }
                  className="text-right"
                  rows={4}
                  data-testid="decision-notes-input"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDecisionType("");
                    setDecisionNotes("");
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => onMakeDecision(selectedDecisionType, decisionNotes)}
                  disabled={!decisionNotes.trim() || isProcessing}
                  className={selectedDecisionType === "heritage_approval" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                  data-testid="submit-decision-button"
                >
                  <CheckSquare className="ml-2 h-4 w-4" />
                  إصدار القرار
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SupervisorDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // جلب الطلبات المصعّدة فقط
  const { data: escalatedDecisions = [], isLoading } = useQuery<StreetStatusDecision[]>({
    queryKey: ['/api/street-survey/street-decisions', { escalated: true }],
    queryFn: () => 
      fetch('/api/street-survey/street-decisions?escalated=true')
        .then(res => res.json())
        .then(data => data.data || [])
  });

  const [selectedDecision, setSelectedDecision] = useState<StreetStatusDecision | null>(null);

  // إصدار القرار الاستراتيجي
  const decisionMutation = useMutation({
    mutationFn: async ({ decisionId, decisionType, notes }: { 
      decisionId: string; 
      decisionType: string; 
      notes: string; 
    }) => {
      const response = await fetch(`/api/street-survey/street-decisions/${decisionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: decisionType === 'heritage_approval' ? 'conditionally_approved' : 'rejected',
          reviewNotes: notes,
          decisionMadeAt: new Date().toISOString(),
          supervisoryDecision: decisionType
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إصدار القرار بنجاح",
        description: "تم إصدار القرار الاستراتيجي وإرسال التوجيهات للفرع",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/street-survey/street-decisions'] });
      setSelectedDecision(null);
    },
    onError: () => {
      toast({
        title: "خطأ في إصدار القرار",
        description: "حدث خطأ أثناء إصدار القرار",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل القضايا المصعّدة...</p>
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
            🎯 مركز القرارات الحرجة - المكتب الإشرافي
          </h1>
          <p className="mt-2 text-gray-600 text-right">
            إدارة ومراجعة القضايا المصعّدة واتخاذ القرارات الاستراتيجية
          </p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <ArrowUp className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{escalatedDecisions.length}</div>
              <div className="text-sm text-gray-600">إجمالي المصعّد</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {escalatedDecisions.filter((d: StreetStatusDecision) => (d.escalationLevel || 0) >= 6).length}
              </div>
              <div className="text-sm text-gray-600">يتطلب موافقة وزارية</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {escalatedDecisions.filter((d: StreetStatusDecision) => d.status === 'under_review').length}
              </div>
              <div className="text-sm text-gray-600">قيد المراجعة</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(escalatedDecisions.reduce((acc, d) => acc + (d.estimatedProcessingDays || 0), 0) / Math.max(escalatedDecisions.length, 1))}
              </div>
              <div className="text-sm text-gray-600">متوسط أيام المعالجة</div>
            </CardContent>
          </Card>
        </div>

        {/* محتوى الصفحة الرئيسي */}
        {selectedDecision ? (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedDecision(null)}
              className="mb-4"
            >
              ← العودة إلى قائمة القضايا المصعّدة
            </Button>
            
            <IntegratedCaseFile
              decision={selectedDecision}
              onMakeDecision={(decisionType, notes) => 
                decisionMutation.mutate({ 
                  decisionId: selectedDecision.id, 
                  decisionType, 
                  notes 
                })
              }
              isProcessing={decisionMutation.isPending}
            />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-right">القضايا المصعّدة للمراجعة الإشرافية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-4">رقم القرار</th>
                      <th className="text-right p-4">اسم الشارع</th>
                      <th className="text-right p-4">مقدم الطلب</th>
                      <th className="text-right p-4">مستوى التصعيد</th>
                      <th className="text-right p-4">سبب التصعيد</th>
                      <th className="text-right p-4">تاريخ التصعيد</th>
                      <th className="text-right p-4">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escalatedDecisions.map((decision: StreetStatusDecision) => (
                      <tr key={decision.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{decision.decisionNumber}</td>
                        <td className="p-4">{decision.streetName}</td>
                        <td className="p-4">{decision.requestedBy}</td>
                        <td className="p-4">
                          <Badge variant={(decision.escalationLevel || 0) >= 6 ? 'destructive' : 'secondary'}>
                            المستوى {decision.escalationLevel || 0}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">
                          {decision.escalationReason || "تصعيد تلقائي"}
                        </td>
                        <td className="p-4">
                          {decision.lastEscalatedAt ? 
                            new Date(decision.lastEscalatedAt).toLocaleDateString('ar-SA') :
                            new Date(decision.createdAt).toLocaleDateString('ar-SA')
                          }
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            onClick={() => setSelectedDecision(decision)}
                            className="bg-red-600 hover:bg-red-700"
                            data-testid={`review-case-${decision.id}`}
                          >
                            <Scale className="h-4 w-4 ml-1" />
                            مراجعة القضية
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {escalatedDecisions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Scale className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد قضايا مصعّدة حالياً</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}