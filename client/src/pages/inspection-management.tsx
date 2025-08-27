import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Eye, 
  Calendar,
  MapPin,
  User,
  ClipboardCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
  Camera,
  FileText,
  UserCheck,
  Settings,
  Filter
} from "lucide-react";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// Inspection Report Schema
const inspectionReportSchema = z.object({
  reportNumber: z.string().min(1, "رقم التقرير مطلوب"),
  buildingPermitId: z.string().optional(),
  occupancyCertificateId: z.string().optional(),
  inspectionType: z.enum(["initial", "periodic", "complaint_based", "final"]),
  inspectorId: z.string().min(1, "المفتش مطلوب"),
  inspectorName: z.string().min(1, "اسم المفتش مطلوب"),
  inspectionDate: z.string().min(1, "تاريخ التفتيش مطلوب"),
  location: z.string().min(1, "الموقع مطلوب"),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  district: z.string().min(1, "المديرية مطلوبة"),
  governorate: z.string().min(1, "المحافظة مطلوبة"),
  projectName: z.string().min(1, "اسم المشروع مطلوب"),
  ownerName: z.string().min(1, "اسم المالك مطلوب"),
  contractorName: z.string().optional(),
  engineeringOfficeName: z.string().optional(),
  buildingType: z.string().min(1, "نوع المبنى مطلوب"),
  totalFloors: z.number().min(1),
  inspectedFloors: z.number().min(1),
  buildingArea: z.number().min(1),
  constructionProgress: z.number().min(0).max(100),
  overallCompliance: z.enum(["compliant", "minor_violations", "major_violations", "critical_violations"]),
  structuralSafety: z.enum(["safe", "concerns", "unsafe"]),
  fireSafety: z.enum(["compliant", "non_compliant"]),
  electricalSafety: z.enum(["safe", "unsafe"]),
  plumbingSafety: z.enum(["compliant", "non_compliant"]),
  accessibilitySafety: z.enum(["compliant", "non_compliant"]),
  inspectionFindings: z.string().min(10, "نتائج التفتيش مطلوبة"),
  recommendations: z.string().optional(),
  nextInspectionDate: z.string().optional(),
  status: z.enum(["draft", "submitted", "approved", "rejected"]),
  priority: z.enum(["urgent", "high", "normal", "low"]),
});

type InspectionReportForm = z.infer<typeof inspectionReportSchema>;

// Mock data for inspectors
const inspectors = [
  { id: "inspector-001", name: "م. سالم أحمد المفتش", specialization: "هندسة مدنية", license: "ENG-001" },
  { id: "inspector-002", name: "م. فاطمة محمد الزهراني", specialization: "هندسة معمارية", license: "ENG-002" },
  { id: "inspector-003", name: "م. علي حسن القرشي", specialization: "السلامة والحرائق", license: "ENG-003" },
  { id: "inspector-004", name: "م. نورا عبدالله الصالح", specialization: "كهرباء ومياه", license: "ENG-004" },
];

export default function InspectionManagement() {
  const [activeTab, setActiveTab] = useState("reports");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inspection reports
  const { data: reports = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/inspection-reports"],
  });

  // Fetch building permits
  const { data: buildingPermits = [] } = useQuery<any[]>({
    queryKey: ["/api/building-permits"],
  });

  // Fetch occupancy certificates
  const { data: occupancyCertificates = [] } = useQuery<any[]>({
    queryKey: ["/api/occupancy-certificates"],
  });

  const form = useForm<InspectionReportForm>({
    resolver: zodResolver(inspectionReportSchema),
    defaultValues: {
      reportNumber: "",
      inspectionType: "initial",
      inspectorId: "",
      inspectorName: "",
      inspectionDate: "",
      location: "",
      district: "",
      governorate: "أمانة العاصمة",
      projectName: "",
      ownerName: "",
      buildingType: "residential",
      totalFloors: 1,
      inspectedFloors: 1,
      buildingArea: 0,
      constructionProgress: 0,
      overallCompliance: "compliant",
      structuralSafety: "safe",
      fireSafety: "compliant",
      electricalSafety: "safe",
      plumbingSafety: "compliant",
      accessibilitySafety: "compliant",
      inspectionFindings: "",
      status: "draft",
      priority: "normal",
    },
  });

  // Create inspection report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: InspectionReportForm) => {
      return apiRequest("/api/inspection-reports", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء تقرير التفتيش بنجاح",
        description: "تم إضافة تقرير التفتيش الجديد للنظام",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inspection-reports"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء تقرير التفتيش",
        variant: "destructive",
      });
    },
  });

  // Update report status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/inspection-reports/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة تقرير التفتيش بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inspection-reports"] });
    },
  });

  // Assign inspector mutation
  const assignInspectorMutation = useMutation({
    mutationFn: async ({ reportId, inspectorId, inspectorName }: { reportId: string; inspectorId: string; inspectorName: string }) => {
      return apiRequest(`/api/inspection-reports/${reportId}/assign`, {
        method: "PUT",
        body: JSON.stringify({ inspectorId, inspectorName }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم تعيين المفتش",
        description: "تم تعيين المفتش لتقرير التفتيش بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inspection-reports"] });
      setIsAssignDialogOpen(false);
    },
  });

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesType = typeFilter === "all" || report.inspectionType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const stats = {
    total: reports.length,
    draft: reports.filter(r => r.status === "draft").length,
    submitted: reports.filter(r => r.status === "submitted").length,
    approved: reports.filter(r => r.status === "approved").length,
    rejected: reports.filter(r => r.status === "rejected").length,
    pending: reports.filter(r => ["draft", "submitted"].includes(r.status)).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="secondary" className="bg-gray-100 text-gray-800">مسودة</Badge>;
      case "submitted": return <Badge variant="secondary" className="bg-blue-100 text-blue-800">مقدم</Badge>;
      case "approved": return <Badge variant="secondary" className="bg-green-100 text-green-800">معتمد</Badge>;
      case "rejected": return <Badge variant="destructive">مرفوض</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getComplianceBadge = (compliance: string) => {
    switch (compliance) {
      case "compliant": return <Badge variant="secondary" className="bg-green-100 text-green-800">مطابق</Badge>;
      case "minor_violations": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">مخالفات بسيطة</Badge>;
      case "major_violations": return <Badge variant="secondary" className="bg-orange-100 text-orange-800">مخالفات كبيرة</Badge>;
      case "critical_violations": return <Badge variant="destructive">مخالفات خطيرة</Badge>;
      default: return <Badge variant="outline">{compliance}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge variant="destructive">عاجل</Badge>;
      case "high": return <Badge variant="secondary" className="bg-orange-100 text-orange-800">عالي</Badge>;
      case "normal": return <Badge variant="outline">عادي</Badge>;
      case "low": return <Badge variant="secondary" className="bg-gray-100 text-gray-800">منخفض</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const onSubmit = (data: InspectionReportForm) => {
    createReportMutation.mutate(data);
  };

  const handleStatusUpdate = (reportId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: reportId, status: newStatus });
  };

  const handleAssignInspector = (inspectorId: string, inspectorName: string) => {
    if (selectedReport) {
      assignInspectorMutation.mutate({ 
        reportId: selectedReport.id, 
        inspectorId, 
        inspectorName 
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ClipboardCheck className="ml-2 h-8 w-8 text-primary" />
            نظام إدارة التفتيش
          </h1>
          <p className="text-gray-600 mt-1">إدارة تقارير التفتيش وتعيين المفتشين والمتابعة الميدانية</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-report">
              <Plus className="ml-2 h-4 w-4" />
              تقرير تفتيش جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء تقرير تفتيش جديد</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
                    <TabsTrigger value="inspection">التفتيش</TabsTrigger>
                    <TabsTrigger value="compliance">المطابقة</TabsTrigger>
                    <TabsTrigger value="findings">النتائج</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="reportNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم التقرير</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="REP-2025-XXXX" data-testid="input-report-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inspectionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نوع التفتيش</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-inspection-type">
                                  <SelectValue placeholder="اختر نوع التفتيش" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="initial">تفتيش أولي</SelectItem>
                                <SelectItem value="periodic">تفتيش دوري</SelectItem>
                                <SelectItem value="complaint_based">تفتيش شكوى</SelectItem>
                                <SelectItem value="final">تفتيش نهائي</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="buildingPermitId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رخصة البناء المرتبطة</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-building-permit">
                                  <SelectValue placeholder="اختر رخصة البناء" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {buildingPermits.map((permit) => (
                                  <SelectItem key={permit.id} value={permit.id}>
                                    {permit.permitNumber} - {permit.projectName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="projectName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المشروع</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="اسم المشروع" data-testid="input-project-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المالك</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="اسم المالك" data-testid="input-owner-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الموقع</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="عنوان الموقع" data-testid="input-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="inspection" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="inspectorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المفتش</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="اسم المفتش" data-testid="input-inspector-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inspectionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ التفتيش</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                data-testid="input-inspection-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="totalFloors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>إجمالي الطوابق</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))} 
                                data-testid="input-total-floors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="inspectedFloors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الطوابق المفتشة</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))} 
                                data-testid="input-inspected-floors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="constructionProgress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نسبة اكتمال البناء (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value))} 
                                data-testid="input-construction-progress"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="buildingArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مساحة البناء (م²)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                                data-testid="input-building-area"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="compliance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="overallCompliance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المطابقة العامة</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-overall-compliance">
                                  <SelectValue placeholder="اختر المطابقة العامة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="compliant">مطابق</SelectItem>
                                <SelectItem value="minor_violations">مخالفات بسيطة</SelectItem>
                                <SelectItem value="major_violations">مخالفات كبيرة</SelectItem>
                                <SelectItem value="critical_violations">مخالفات خطيرة</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="structuralSafety"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>السلامة الإنشائية</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-structural-safety">
                                  <SelectValue placeholder="اختر السلامة الإنشائية" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="safe">آمن</SelectItem>
                                <SelectItem value="concerns">مخاوف</SelectItem>
                                <SelectItem value="unsafe">غير آمن</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fireSafety"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>السلامة من الحرائق</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-fire-safety">
                                  <SelectValue placeholder="اختر السلامة من الحرائق" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="compliant">مطابق</SelectItem>
                                <SelectItem value="non_compliant">غير مطابق</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="electricalSafety"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>السلامة الكهربائية</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-electrical-safety">
                                  <SelectValue placeholder="اختر السلامة الكهربائية" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="safe">آمن</SelectItem>
                                <SelectItem value="unsafe">غير آمن</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="plumbingSafety"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>سلامة السباكة</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-plumbing-safety">
                                  <SelectValue placeholder="اختر سلامة السباكة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="compliant">مطابق</SelectItem>
                                <SelectItem value="non_compliant">غير مطابق</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accessibilitySafety"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>سلامة الوصول</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-accessibility-safety">
                                  <SelectValue placeholder="اختر سلامة الوصول" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="compliant">مطابق</SelectItem>
                                <SelectItem value="non_compliant">غير مطابق</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="findings" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="inspectionFindings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نتائج التفتيش</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="اكتب نتائج التفتيش التفصيلية هنا..." 
                              className="min-h-[120px]"
                              data-testid="textarea-inspection-findings"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recommendations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>التوصيات</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="اكتب التوصيات والإجراءات المطلوبة..." 
                              className="min-h-[100px]"
                              data-testid="textarea-recommendations"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nextInspectionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تاريخ التفتيش القادم</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                data-testid="input-next-inspection-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الأولوية</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-priority">
                                  <SelectValue placeholder="اختر الأولوية" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="urgent">عاجل</SelectItem>
                                <SelectItem value="high">عالي</SelectItem>
                                <SelectItem value="normal">عادي</SelectItem>
                                <SelectItem value="low">منخفض</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createReportMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createReportMutation.isPending ? "جاري الحفظ..." : "إنشاء التقرير"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي التقارير</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مسودة</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مقدم</p>
                <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
              </div>
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معتمد</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مرفوض</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">قيد المراجعة</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">تقارير التفتيش</TabsTrigger>
          <TabsTrigger value="inspectors">المفتشون</TabsTrigger>
          <TabsTrigger value="schedule">جدولة التفتيش</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث في التقارير..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="تصفية بالحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="submitted">مقدم</SelectItem>
                    <SelectItem value="approved">معتمد</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-type-filter">
                    <SelectValue placeholder="تصفية بالنوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="initial">تفتيش أولي</SelectItem>
                    <SelectItem value="periodic">تفتيش دوري</SelectItem>
                    <SelectItem value="complaint_based">تفتيش شكوى</SelectItem>
                    <SelectItem value="final">تفتيش نهائي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{report.projectName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{report.reportNumber}</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      {getStatusBadge(report.status)}
                      {getPriorityBadge(report.priority)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="ml-2 h-4 w-4" />
                      <span>{report.ownerName}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="ml-2 h-4 w-4" />
                      <span>{report.location}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <UserCheck className="ml-2 h-4 w-4" />
                      <span>{report.inspectorName || 'لم يتم التعيين'}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="ml-2 h-4 w-4" />
                      <span>
                        {report.inspectionDate ? 
                          new Date(report.inspectionDate).toLocaleDateString('ar-YE') : 
                          'لم يتم تحديد التاريخ'
                        }
                      </span>
                    </div>

                    {report.overallCompliance && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 ml-2">المطابقة:</span>
                        {getComplianceBadge(report.overallCompliance)}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-view-details-${report.id}`}
                    >
                      <Eye className="ml-1 h-3 w-3" />
                      التفاصيل
                    </Button>

                    <div className="flex space-x-1 space-x-reverse">
                      {!report.inspectorName && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsAssignDialogOpen(true);
                          }}
                          data-testid={`button-assign-inspector-${report.id}`}
                        >
                          <UserCheck className="ml-1 h-3 w-3" />
                          تعيين مفتش
                        </Button>
                      )}
                      
                      {report.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(report.id, "submitted")}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`button-submit-${report.id}`}
                        >
                          تقديم
                        </Button>
                      )}
                      
                      {report.status === "submitted" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(report.id, "approved")}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-approve-${report.id}`}
                          >
                            اعتماد
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(report.id, "rejected")}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-reject-${report.id}`}
                          >
                            رفض
                          </Button>
                        </>
                      )}
                      
                      {report.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-download-${report.id}`}
                        >
                          <Download className="ml-1 h-3 w-3" />
                          تحميل
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد تقارير تفتيش</h3>
                <p className="text-gray-600">لم يتم العثور على تقارير تفتيش مطابقة لمعايير البحث</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inspectors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inspectors.map((inspector) => (
              <Card key={inspector.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{inspector.name}</CardTitle>
                  <p className="text-sm text-gray-600">{inspector.specialization}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <UserCheck className="ml-2 h-4 w-4" />
                      <span>رخصة: {inspector.license}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <ClipboardCheck className="ml-2 h-4 w-4" />
                      <span>تقارير نشطة: {reports.filter(r => r.inspectorId === inspector.id && r.status !== 'approved').length}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      data-testid={`button-view-inspector-${inspector.id}`}
                    >
                      <Eye className="ml-1 h-3 w-3" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">جدولة التفتيش</h3>
              <p className="text-gray-600">سيتم تطوير نظام جدولة التفتيش قريباً</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Inspector Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعيين مفتش للتقرير</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              اختر المفتش المناسب لتقرير: {selectedReport?.reportNumber}
            </p>
            
            <div className="space-y-2">
              {inspectors.map((inspector) => (
                <Card key={inspector.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleAssignInspector(inspector.id, inspector.name)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{inspector.name}</p>
                        <p className="text-sm text-gray-600">{inspector.specialization}</p>
                      </div>
                      <Badge variant="outline">{inspector.license}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}