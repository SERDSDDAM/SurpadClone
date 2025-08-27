import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Upload,
  Download,
  Save,
  Send,
  Home,
  Building2,
  Zap,
  Droplets,
  Flame,
  Shield,
  Eye,
  Navigation,
  Wifi,
  WifiOff,
  Battery,
  Signal
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Get report ID from URL parameters
function getReportIdFromUrl(): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('reportId') || "report-001";
}

interface InspectionChecklist {
  structural: boolean;
  fire: boolean;
  electrical: boolean;
  plumbing: boolean;
  accessibility: boolean;
}

interface ViolationItem {
  type: string;
  severity: "minor" | "major" | "critical";
  description: string;
  location: string;
  photoUrl?: string;
  recommendedAction: string;
}

export default function InspectorFieldApp() {
  const [, navigate] = useLocation();
  const reportId = getReportIdFromUrl();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Field app state
  const [currentLocation, setCurrentLocation] = useState({ lat: 15.3694, lng: 44.1910 });
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [signalStrength, setSignalStrength] = useState(4);
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "offline">("synced");

  // Inspection state
  const [inspectionProgress, setInspectionProgress] = useState(0);
  const [checklist, setChecklist] = useState<InspectionChecklist>({
    structural: false,
    fire: false,
    electrical: false,
    plumbing: false,
    accessibility: false,
  });
  const [violations, setViolations] = useState<ViolationItem[]>([]);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  // Fetch current inspection report
  const { data: report, isLoading } = useQuery<any>({
    queryKey: ["/api/inspection-reports", reportId],
    enabled: !!reportId,
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/inspection-reports/${reportId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حفظ التقرير",
        description: "تم حفظ بيانات التفتيش بنجاح",
      });
      setSyncStatus("synced");
      queryClient.invalidateQueries({ queryKey: ["/api/inspection-reports", reportId] });
    },
    onError: () => {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ التقرير",
        variant: "destructive",
      });
      setSyncStatus("pending");
    },
  });

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/inspection-reports/${reportId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "submitted",
          overallCompliance: violations.length === 0 ? "compliant" : 
                           violations.some(v => v.severity === "critical") ? "critical_violations" :
                           violations.some(v => v.severity === "major") ? "major_violations" : "minor_violations",
          structuralSafety: checklist.structural ? "safe" : "concerns",
          fireSafety: checklist.fire ? "compliant" : "non_compliant",
          electricalSafety: checklist.electrical ? "safe" : "unsafe",
          plumbingSafety: checklist.plumbing ? "compliant" : "non_compliant",
          accessibilitySafety: checklist.accessibility ? "compliant" : "non_compliant",
          violationsFound: violations,
          inspectionFindings: notes,
          attachments: photos.map((photo, index) => ({
            name: `تفتيش_صورة_${index + 1}.jpg`,
            type: "photo",
            url: photo
          })),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم تقديم التقرير",
        description: "تم تقديم تقرير التفتيش للمراجعة",
      });
      navigate("/inspection-management");
    },
    onError: () => {
      toast({
        title: "خطأ في التقديم",
        description: "حدث خطأ أثناء تقديم التقرير",
        variant: "destructive",
      });
    },
  });

  // Update checklist and calculate progress
  const updateChecklist = (item: keyof InspectionChecklist, value: boolean) => {
    const newChecklist = { ...checklist, [item]: value };
    setChecklist(newChecklist);
    
    const completed = Object.values(newChecklist).filter(Boolean).length;
    const total = Object.keys(newChecklist).length;
    setInspectionProgress((completed / total) * 100);
  };

  // Add violation
  const addViolation = () => {
    const newViolation: ViolationItem = {
      type: "structural",
      severity: "minor",
      description: "",
      location: "",
      recommendedAction: "",
    };
    setViolations([...violations, newViolation]);
  };

  // Update violation
  const updateViolation = (index: number, field: keyof ViolationItem, value: any) => {
    const updatedViolations = violations.map((violation, i) =>
      i === index ? { ...violation, [field]: value } : violation
    );
    setViolations(updatedViolations);
  };

  // Remove violation
  const removeViolation = (index: number) => {
    setViolations(violations.filter((_, i) => i !== index));
  };

  // Simulate photo capture
  const capturePhoto = () => {
    setIsCapturingPhoto(true);
    setTimeout(() => {
      const photoUrl = `photo_${Date.now()}.jpg`;
      setPhotos([...photos, photoUrl]);
      setIsCapturingPhoto(false);
      toast({
        title: "تم التقاط الصورة",
        description: "تم حفظ الصورة في التقرير",
      });
    }, 1000);
  };

  // Auto-save draft
  useEffect(() => {
    const interval = setInterval(() => {
      if (notes || violations.length > 0 || Object.values(checklist).some(Boolean)) {
        setSyncStatus("pending");
        updateReportMutation.mutate({
          inspectionFindings: notes,
          violationsFound: violations,
          structuralSafety: checklist.structural ? "safe" : "concerns",
          fireSafety: checklist.fire ? "compliant" : "non_compliant",
          electricalSafety: checklist.electrical ? "safe" : "unsafe",
          plumbingSafety: checklist.plumbing ? "compliant" : "non_compliant",
          accessibilitySafety: checklist.accessibility ? "compliant" : "non_compliant",
        });
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [notes, violations, checklist]);

  // Simulate network status changes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.1); // 90% online
      setBatteryLevel(prev => Math.max(0, prev - Math.random() * 2));
      setSignalStrength(Math.floor(Math.random() * 5));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  if (!report) {
    return <div className="text-center p-8">تقرير التفتيش غير موجود</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with status */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">تطبيق المفتش الميداني</h1>
            <p className="text-sm text-gray-600">{report.reportNumber} - {report.projectName}</p>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Connection Status */}
            <div className="flex items-center">
              {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
              <span className="text-xs ml-1">{isOnline ? "متصل" : "غير متصل"}</span>
            </div>
            
            {/* Signal Strength */}
            <div className="flex items-center">
              <Signal className="h-4 w-4 text-gray-600" />
              <span className="text-xs ml-1">{signalStrength}/4</span>
            </div>
            
            {/* Battery */}
            <div className="flex items-center">
              <Battery className="h-4 w-4 text-gray-600" />
              <span className="text-xs ml-1">{batteryLevel}%</span>
            </div>
            
            {/* Sync Status */}
            <Badge variant={syncStatus === "synced" ? "secondary" : syncStatus === "pending" ? "outline" : "destructive"}>
              {syncStatus === "synced" ? "محفوظ" : syncStatus === "pending" ? "في الانتظار" : "غير متصل"}
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>تقدم التفتيش</span>
            <span>{Math.round(inspectionProgress)}%</span>
          </div>
          <Progress value={inspectionProgress} className="h-2" />
        </div>
      </div>

      <div className="container mx-auto p-4 space-y-6">
        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="ml-2 h-5 w-5" />
              معلومات المشروع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-medium">اسم المشروع:</Label>
                <p>{report.projectName}</p>
              </div>
              <div>
                <Label className="font-medium">المالك:</Label>
                <p>{report.ownerName}</p>
              </div>
              <div>
                <Label className="font-medium">الموقع:</Label>
                <p>{report.location}</p>
              </div>
              <div>
                <Label className="font-medium">نوع التفتيش:</Label>
                <p>{report.inspectionType}</p>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 pt-2 border-t">
              <MapPin className="ml-2 h-4 w-4" />
              <span>الموقع الحالي: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Inspection Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="ml-2 h-5 w-5" />
              قائمة فحص التفتيش
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "structural", label: "الفحص الإنشائي", icon: Building2 },
              { key: "fire", label: "السلامة من الحرائق", icon: Flame },
              { key: "electrical", label: "النظام الكهربائي", icon: Zap },
              { key: "plumbing", label: "نظام السباكة", icon: Droplets },
              { key: "accessibility", label: "سهولة الوصول", icon: Shield },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Icon className="ml-3 h-5 w-5 text-gray-600" />
                  <span className="font-medium">{label}</span>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    size="sm"
                    variant={checklist[key as keyof InspectionChecklist] ? "default" : "outline"}
                    onClick={() => updateChecklist(key as keyof InspectionChecklist, true)}
                    data-testid={`button-pass-${key}`}
                  >
                    <CheckCircle className="ml-1 h-3 w-3" />
                    مطابق
                  </Button>
                  <Button
                    size="sm"
                    variant={!checklist[key as keyof InspectionChecklist] ? "destructive" : "outline"}
                    onClick={() => updateChecklist(key as keyof InspectionChecklist, false)}
                    data-testid={`button-fail-${key}`}
                  >
                    <XCircle className="ml-1 h-3 w-3" />
                    غير مطابق
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Violations */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <AlertTriangle className="ml-2 h-5 w-5" />
                المخالفات ({violations.length})
              </CardTitle>
              <Button onClick={addViolation} size="sm" data-testid="button-add-violation">
                إضافة مخالفة
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {violations.map((violation, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">مخالفة #{index + 1}</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeViolation(index)}
                    data-testid={`button-remove-violation-${index}`}
                  >
                    حذف
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>نوع المخالفة</Label>
                    <Select 
                      value={violation.type} 
                      onValueChange={(value) => updateViolation(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="structural">إنشائية</SelectItem>
                        <SelectItem value="fire">حرائق</SelectItem>
                        <SelectItem value="electrical">كهربائية</SelectItem>
                        <SelectItem value="plumbing">سباكة</SelectItem>
                        <SelectItem value="accessibility">وصول</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>درجة الخطورة</Label>
                    <Select 
                      value={violation.severity} 
                      onValueChange={(value) => updateViolation(index, 'severity', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">بسيطة</SelectItem>
                        <SelectItem value="major">كبيرة</SelectItem>
                        <SelectItem value="critical">خطيرة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>وصف المخالفة</Label>
                  <Textarea
                    value={violation.description}
                    onChange={(e) => updateViolation(index, 'description', e.target.value)}
                    placeholder="اكتب وصف المخالفة..."
                    data-testid={`textarea-violation-description-${index}`}
                  />
                </div>
                
                <div>
                  <Label>الموقع</Label>
                  <Input
                    value={violation.location}
                    onChange={(e) => updateViolation(index, 'location', e.target.value)}
                    placeholder="حدد موقع المخالفة..."
                    data-testid={`input-violation-location-${index}`}
                  />
                </div>
                
                <div>
                  <Label>الإجراء المطلوب</Label>
                  <Textarea
                    value={violation.recommendedAction}
                    onChange={(e) => updateViolation(index, 'recommendedAction', e.target.value)}
                    placeholder="اكتب الإجراء المطلوب لحل المخالفة..."
                    data-testid={`textarea-violation-action-${index}`}
                  />
                </div>
              </div>
            ))}
            
            {violations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                <p>لا توجد مخالفات مسجلة</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Camera className="ml-2 h-5 w-5" />
                صور التفتيش ({photos.length})
              </CardTitle>
              <Button 
                onClick={capturePhoto} 
                disabled={isCapturingPhoto}
                data-testid="button-capture-photo"
              >
                <Camera className="ml-2 h-4 w-4" />
                {isCapturingPhoto ? "جاري التقاط الصورة..." : "التقاط صورة"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-xs text-center mt-2 text-gray-600">{photo}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Camera className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                <p>لم يتم التقاط صور بعد</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="ml-2 h-5 w-5" />
              ملاحظات التفتيش
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك حول التفتيش هنا..."
              className="min-h-[120px]"
              data-testid="textarea-inspection-notes"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/inspection-management")}
            className="flex-1"
            data-testid="button-back"
          >
            <Home className="ml-2 h-4 w-4" />
            العودة للقائمة
          </Button>
          
          <Button
            variant="outline"
            onClick={() => updateReportMutation.mutate({
              inspectionFindings: notes,
              violationsFound: violations,
            })}
            disabled={updateReportMutation.isPending}
            className="flex-1"
            data-testid="button-save-draft"
          >
            <Save className="ml-2 h-4 w-4" />
            {updateReportMutation.isPending ? "جاري الحفظ..." : "حفظ مسودة"}
          </Button>
          
          <Button
            onClick={() => submitReportMutation.mutate()}
            disabled={submitReportMutation.isPending || inspectionProgress < 100}
            className="flex-1"
            data-testid="button-submit-report"
          >
            <Send className="ml-2 h-4 w-4" />
            {submitReportMutation.isPending ? "جاري التقديم..." : "تقديم التقرير"}
          </Button>
        </div>

        {inspectionProgress < 100 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 ml-2" />
                <p className="text-sm text-yellow-800">
                  يجب إكمال جميع بنود الفحص قبل تقديم التقرير
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}