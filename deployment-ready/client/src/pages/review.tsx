import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ClipboardCheck, Check, Edit, X, FileText, Download } from "lucide-react";
import { formatArea, exportFormats } from "@/lib/survey-utils";
import { SurveyRequest, SurveyPoint, SurveyLine, SurveyPolygon, ReviewComment } from "@shared/schema";

// For demo purposes, using a sample request ID
const SAMPLE_REQUEST_ID = "sample-request-001";

export default function Review() {
  const [reviewComment, setReviewComment] = useState("");
  const queryClient = useQueryClient();

  // Query review data
  const { data: request } = useQuery<SurveyRequest>({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID],
  });

  const { data: surveyPoints = [] } = useQuery<SurveyPoint[]>({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "points"],
  });

  const { data: surveyLines = [] } = useQuery<SurveyLine[]>({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "lines"],
  });

  const { data: surveyPolygons = [] } = useQuery<SurveyPolygon[]>({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "polygons"],
  });

  const { data: comments = [] } = useQuery<ReviewComment[]>({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "comments"],
  });

  // Mutations
  const createCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      return apiRequest("POST", `/api/survey-requests/${SAMPLE_REQUEST_ID}/comments`, commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "comments"] });
      setReviewComment("");
      toast({
        title: "تم إضافة التعليق",
        description: "تم حفظ تعليق المراجعة بنجاح",
      });
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async (updateData: any) => {
      return apiRequest("PATCH", `/api/survey-requests/${SAMPLE_REQUEST_ID}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID] });
    },
  });

  // Calculate total area
  const totalArea = surveyPolygons.reduce((total, polygon) => total + (polygon.area || 0), 0);

  // Technical validation checks
  const validationChecks = [
    { text: "دقة الإحداثيات متوافقة مع المعايير", status: "success" },
    { text: "المضلعات مغلقة بشكل صحيح", status: "success" },
    { text: "التكويد مطابق للمعايير", status: "success" },
    { text: "يحتاج مراجعة الحدود الشمالية", status: "warning" },
  ];

  const handleApprove = async () => {
    if (!reviewComment.trim()) {
      toast({
        title: "تعليق مطلوب",
        description: "يرجى إضافة تعليق قبل الموافقة",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        reviewerName: "مراجع النظام",
        comment: reviewComment,
        commentType: "approval",
      });

      await updateRequestMutation.mutateAsync({
        status: "approved",
      });

      toast({
        title: "تمت الموافقة",
        description: "تم اعتماد القرار المساحي بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في معالجة الموافقة",
        variant: "destructive",
      });
    }
  };

  const handleRevisionRequest = async () => {
    if (!reviewComment.trim()) {
      toast({
        title: "تعليق مطلوب",
        description: "يرجى إضافة تعليق لطلب التعديل",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        reviewerName: "مراجع النظام",
        comment: reviewComment,
        commentType: "revision_request",
      });

      await updateRequestMutation.mutateAsync({
        status: "under_review",
      });

      toast({
        title: "تم طلب التعديل",
        description: "تم إرسال طلب التعديل للمساح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إرسال طلب التعديل",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!reviewComment.trim()) {
      toast({
        title: "تعليق مطلوب",
        description: "يرجى إضافة سبب الرفض",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        reviewerName: "مراجع النظام",
        comment: reviewComment,
        commentType: "rejection",
      });

      await updateRequestMutation.mutateAsync({
        status: "rejected",
      });

      toast({
        title: "تم الرفض",
        description: "تم رفض القرار المساحي",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في معالجة الرفض",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/survey-requests/${SAMPLE_REQUEST_ID}/export/${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `survey_${SAMPLE_REQUEST_ID}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "تم التصدير",
        description: `تم تصدير البيانات بتنسيق ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جارٍ تحميل بيانات المراجعة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <ClipboardCheck className="mr-3 h-8 w-8 text-orange-500" />
          مراجعة وموافقة القرارات المساحية
        </h1>
        <p className="text-gray-600">مراجعة البيانات المساحية واتخاذ القرار النهائي</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Survey Data Review */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات المساحة المرفوعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">رقم الطلب:</span>
                  <span className="text-primary font-mono" data-testid="request-number">
                    {request.requestNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">المساح:</span>
                  <span data-testid="surveyor-name">{request.assignedSurveyor || "غير محدد"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">تاريخ المساحة:</span>
                  <span data-testid="survey-date">
                    {request.createdAt ? new Date(request.createdAt).toLocaleDateString('ar-SA') : "غير محدد"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">إجمالي المساحة:</span>
                  <span className="font-bold text-green-600" data-testid="total-area">
                    {formatArea(totalArea)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">دقة القياس:</span>
                  <span className="text-green-600" data-testid="measurement-accuracy">±2 سم</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">عدد النقاط:</span>
                  <span data-testid="points-count">{surveyPoints.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">عدد الخطوط:</span>
                  <span data-testid="lines-count">{surveyLines.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">عدد المضلعات:</span>
                  <span data-testid="polygons-count">{surveyPolygons.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Validation */}
          <Card>
            <CardHeader>
              <CardTitle>التحقق التقني</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationChecks.map((check, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center ${
                      check.status === 'success' ? 'text-green-600' : 'text-yellow-600'
                    }`}
                    data-testid={`validation-check-${index}`}
                  >
                    {check.status === 'success' ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    <span>{check.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إجراءات المراجعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comments Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات المراجع
                </label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="أدخل ملاحظاتك هنا..."
                  className="w-full"
                  data-testid="review-comment-textarea"
                />
              </div>

              {/* Decision Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  data-testid="approve-button"
                >
                  <Check className="mr-2 h-4 w-4" />
                  الموافقة على القرار المساحي
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  onClick={handleRevisionRequest}
                  data-testid="revision-button"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  طلب تعديل
                </Button>
                
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleReject}
                  data-testid="reject-button"
                >
                  <X className="mr-2 h-4 w-4" />
                  رفض القرار
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                تصدير البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {exportFormats.map((format) => (
                  <Button
                    key={format.format}
                    variant="outline"
                    className="bg-gray-600 text-white hover:bg-gray-700 border-gray-600"
                    onClick={() => handleExport(format.format)}
                    data-testid={`export-${format.format}-button`}
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    {format.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Previous Comments */}
          {comments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>التعليقات السابقة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-l-4 border-primary pl-4">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{comment.reviewerName}</span>
                        <Badge variant="outline">
                          {comment.commentType === 'approval' && 'موافقة'}
                          {comment.commentType === 'revision_request' && 'طلب تعديل'}
                          {comment.commentType === 'rejection' && 'رفض'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{comment.comment}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString('ar-SA')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
