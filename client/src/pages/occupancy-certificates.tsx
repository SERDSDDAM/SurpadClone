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
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Eye, 
  Filter, 
  Building2,
  Calendar,
  MapPin,
  User,
  FileCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  Send
} from "lucide-react";
import { insertOccupancyCertificateSchema, type OccupancyCertificate, type BuildingPermit } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

export default function OccupancyCertificates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<OccupancyCertificate | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: certificates = [], isLoading } = useQuery<OccupancyCertificate[]>({
    queryKey: ["/api/occupancy-certificates"],
  });

  const { data: buildingPermits = [] } = useQuery<BuildingPermit[]>({
    queryKey: ["/api/building-permits"],
  });

  // Form for creating new certificates
  const form = useForm<z.infer<typeof insertOccupancyCertificateSchema>>({
    resolver: zodResolver(insertOccupancyCertificateSchema),
    defaultValues: {
      certificateNumber: "",
      buildingPermitId: "",
      applicantName: "",
      projectName: "",
      location: "",
      district: "",
      governorate: "أمانة العاصمة",
      buildingType: "residential",
      totalFloors: 1,
      totalUnits: 1,
      buildingArea: 0,
      plotArea: 0,
      completionDate: "",
      inspectionDate: "",
      inspectorName: "",
      inspectionNotes: "",
      complianceStatus: "compliant",
      status: "pending",
      priority: "normal",
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertOccupancyCertificateSchema>) => {
      return apiRequest("/api/occupancy-certificates", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء شهادة الإشغال بنجاح",
        description: "تم إضافة شهادة الإشغال الجديدة للنظام",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/occupancy-certificates"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء شهادة الإشغال",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/occupancy-certificates/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة شهادة الإشغال بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/occupancy-certificates"] });
    },
  });

  // Filter certificates
  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = certificate.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || certificate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: certificates.length,
    pending: certificates.filter(c => c.status === "pending").length,
    approved: certificates.filter(c => c.status === "approved").length,
    rejected: certificates.filter(c => c.status === "rejected").length,
    underInspection: certificates.filter(c => c.status === "under_inspection").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">قيد المراجعة</Badge>;
      case "under_inspection": return <Badge variant="secondary" className="bg-blue-100 text-blue-800">تحت التفتيش</Badge>;
      case "approved": return <Badge variant="secondary" className="bg-green-100 text-green-800">معتمدة</Badge>;
      case "rejected": return <Badge variant="destructive">مرفوضة</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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

  const onSubmit = (data: z.infer<typeof insertOccupancyCertificateSchema>) => {
    createMutation.mutate(data);
  };

  const handleStatusUpdate = (certificateId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: certificateId, status: newStatus });
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
            <FileCheck className="ml-2 h-8 w-8 text-primary" />
            شهادات الإشغال والتفتيش
          </h1>
          <p className="text-gray-600 mt-1">إدارة شهادات إشغال المباني والوحدات السكنية والتجارية</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-add-certificate">
              <Plus className="ml-2 h-4 w-4" />
              شهادة إشغال جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إصدار شهادة إشغال جديدة</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="certificateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم شهادة الإشغال</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="OC-2025-XXXX" data-testid="input-certificate-number" />
                        </FormControl>
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
                    name="applicantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم مقدم الطلب</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="الاسم الكامل" data-testid="input-applicant-name" />
                        </FormControl>
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
                          <Input {...field} placeholder="وصف المشروع" data-testid="input-project-name" />
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
                          <Input {...field} placeholder="عنوان المشروع" data-testid="input-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المديرية</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="اسم المديرية" data-testid="input-district" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buildingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع المبنى</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-building-type">
                              <SelectValue placeholder="اختر نوع المبنى" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="residential">سكني</SelectItem>
                            <SelectItem value="commercial">تجاري</SelectItem>
                            <SelectItem value="industrial">صناعي</SelectItem>
                            <SelectItem value="mixed">مختلط</SelectItem>
                            <SelectItem value="governmental">حكومي</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalFloors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عدد الطوابق</FormLabel>
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
                    name="totalUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عدد الوحدات</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))} 
                            data-testid="input-total-units"
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

                  <FormField
                    control={form.control}
                    name="completionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاريخ اكتمال البناء</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-completion-date"
                          />
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
                    name="inspectorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المفتش</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="اسم المهندس المفتش" data-testid="input-inspector-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complianceStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حالة الامتثال</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-compliance-status">
                              <SelectValue placeholder="اختر حالة الامتثال" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="compliant">مطابق</SelectItem>
                            <SelectItem value="minor_violations">مخالفات بسيطة</SelectItem>
                            <SelectItem value="major_violations">مخالفات كبيرة</SelectItem>
                            <SelectItem value="non_compliant">غير مطابق</SelectItem>
                          </SelectContent>
                        </Select>
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

                <FormField
                  control={form.control}
                  name="inspectionNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات التفتيش</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="ملاحظات ونتائج التفتيش الميداني" 
                          className="min-h-[100px]"
                          data-testid="textarea-inspection-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createMutation.isPending ? "جاري الحفظ..." : "إصدار شهادة الإشغال"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الشهادات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileCheck className="h-8 w-8 text-primary" />
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تحت التفتيش</p>
                <p className="text-2xl font-bold text-blue-600">{stats.underInspection}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معتمدة</p>
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
                <p className="text-sm text-gray-600">مرفوضة</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في الشهادات..."
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
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="under_inspection">تحت التفتيش</SelectItem>
                <SelectItem value="approved">معتمدة</SelectItem>
                <SelectItem value="rejected">مرفوضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCertificates.map((certificate) => (
          <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{certificate.projectName}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{certificate.certificateNumber}</p>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  {getStatusBadge(certificate.status)}
                  {getPriorityBadge(certificate.priority)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="ml-2 h-4 w-4" />
                  <span>{certificate.applicantName}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="ml-2 h-4 w-4" />
                  <span>{certificate.location} - {certificate.district}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="ml-2 h-4 w-4" />
                  <span>{certificate.totalFloors} طوابق - {certificate.totalUnits} وحدة</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="ml-2 h-4 w-4" />
                  <span>تاريخ التفتيش: {new Date(certificate.inspectionDate || '').toLocaleDateString('ar-YE')}</span>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCertificate(certificate);
                    setIsDetailsDialogOpen(true);
                  }}
                  data-testid={`button-view-details-${certificate.id}`}
                >
                  <Eye className="ml-1 h-3 w-3" />
                  التفاصيل
                </Button>

                <div className="flex space-x-1 space-x-reverse">
                  {certificate.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(certificate.id, "under_inspection")}
                      disabled={updateStatusMutation.isPending}
                      data-testid={`button-start-inspection-${certificate.id}`}
                    >
                      بدء التفتيش
                    </Button>
                  )}
                  
                  {certificate.status === "under_inspection" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(certificate.id, "approved")}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-approve-${certificate.id}`}
                      >
                        اعتماد
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(certificate.id, "rejected")}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-reject-${certificate.id}`}
                      >
                        رفض
                      </Button>
                    </>
                  )}
                  
                  {certificate.status === "approved" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-download-${certificate.id}`}
                      >
                        <Download className="ml-1 h-3 w-3" />
                        تحميل
                      </Button>
                      <Button
                        size="sm"
                        data-testid={`button-send-utilities-${certificate.id}`}
                      >
                        <Send className="ml-1 h-3 w-3" />
                        إرسال للخدمات
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCertificates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد شهادات إشغال</h3>
            <p className="text-gray-600">لم يتم العثور على شهادات إشغال مطابقة لمعايير البحث</p>
          </CardContent>
        </Card>
      )}

      {/* Certificate Details Modal */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل شهادة الإشغال</DialogTitle>
          </DialogHeader>
          
          {selectedCertificate && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">رقم الشهادة</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.certificateNumber}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">اسم المشروع</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.projectName}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">مقدم الطلب</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.applicantName}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">الموقع</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.location}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">نوع المبنى</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.buildingType}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المساحة</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.buildingArea} م²</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">عدد الطوابق</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.totalFloors} طوابق</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">عدد الوحدات</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.totalUnits} وحدة</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">تاريخ اكتمال البناء</Label>
                  <p className="text-sm text-gray-600">
                    {selectedCertificate.completionDate ? new Date(selectedCertificate.completionDate).toLocaleDateString('ar-YE') : 'غير محدد'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">تاريخ التفتيش</Label>
                  <p className="text-sm text-gray-600">
                    {selectedCertificate.inspectionDate ? new Date(selectedCertificate.inspectionDate).toLocaleDateString('ar-YE') : 'غير محدد'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">المفتش</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.inspectorName || 'غير محدد'}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">حالة الامتثال</Label>
                  <p className="text-sm text-gray-600">{selectedCertificate.complianceStatus}</p>
                </div>
              </div>
              
              {selectedCertificate.inspectionNotes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ملاحظات التفتيش</Label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedCertificate.inspectionNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}