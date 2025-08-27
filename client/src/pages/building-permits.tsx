import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  Search,
  Calendar,
  MapPin,
  User,
  Home,
  Building,
  Factory,
  Store
} from "lucide-react";

const permitFormSchema = z.object({
  applicantId: z.string().min(1, "يرجى اختيار مقدم الطلب"),
  projectName: z.string().min(1, "اسم المشروع مطلوب"),
  projectType: z.string().min(1, "نوع المشروع مطلوب"),
  buildingType: z.string().min(1, "نوع المبنى مطلوب"),
  plotArea: z.number().min(1, "مساحة الأرض مطلوبة"),
  buildingArea: z.number().min(1, "مساحة البناء مطلوبة"),
  totalFloors: z.number().min(1, "عدد الطوابق مطلوب"),
  basementFloors: z.number().min(0, "عدد الطوابق السفلية"),
  estimatedCost: z.number().optional(),
  location: z.string().min(1, "موقع المشروع مطلوب"),
  district: z.string().min(1, "المنطقة مطلوبة"),
  governorate: z.string().min(1, "المحافظة مطلوبة"),
  engineeringOfficeId: z.string().optional(),
  contractorId: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
});

type PermitFormData = z.infer<typeof permitFormSchema>;

const statusOptions = [
  { value: "submitted", label: "مقدم", color: "bg-blue-500" },
  { value: "under_review", label: "قيد المراجعة", color: "bg-yellow-500" },
  { value: "approved", label: "معتمد", color: "bg-green-500" },
  { value: "rejected", label: "مرفوض", color: "bg-red-500" },
  { value: "expired", label: "منتهي الصلاحية", color: "bg-gray-500" },
];

const projectTypeOptions = [
  { value: "residential", label: "سكني", icon: Home },
  { value: "commercial", label: "تجاري", icon: Store },
  { value: "industrial", label: "صناعي", icon: Factory },
  { value: "mixed", label: "مختلط", icon: Building },
];

const buildingTypeOptions = [
  { value: "house", label: "منزل" },
  { value: "villa", label: "فيلا" },
  { value: "apartment_building", label: "عمارة سكنية" },
  { value: "office", label: "مكتب" },
  { value: "shop", label: "محل تجاري" },
  { value: "warehouse", label: "مخزن" },
];

const priorityOptions = [
  { value: "low", label: "منخفضة", color: "bg-gray-500" },
  { value: "normal", label: "عادية", color: "bg-blue-500" },
  { value: "high", label: "عالية", color: "bg-orange-500" },
  { value: "urgent", label: "عاجلة", color: "bg-red-500" },
];

export default function BuildingPermits() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PermitFormData>({
    resolver: zodResolver(permitFormSchema),
    defaultValues: {
      basementFloors: 0,
      totalFloors: 1,
    }
  });

  // Fetch building permits
  const { data: permits = [], isLoading } = useQuery({
    queryKey: ["/api/building-permits"],
  });

  // Fetch citizens for dropdown
  const { data: citizens = [] } = useQuery({
    queryKey: ["/api/citizens"],
  });

  // Fetch engineering offices for dropdown
  const { data: engineeringOffices = [] } = useQuery({
    queryKey: ["/api/engineering-offices"],
  });

  // Fetch contractors for dropdown
  const { data: contractors = [] } = useQuery({
    queryKey: ["/api/contractors"],
  });

  // Create permit mutation
  const createPermitMutation = useMutation({
    mutationFn: async (data: PermitFormData) => {
      await apiRequest("/api/building-permits", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/building-permits"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "تم إنشاء الطلب بنجاح",
        description: "تم تقديم طلب رخصة البناء الجديد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إنشاء الطلب",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PermitFormData) => {
    createPermitMutation.mutate(data);
  };

  // Filter permits based on status and search
  const filteredPermits = permits.filter((permit: any) => {
    const matchesStatus = selectedStatus === "all" || permit.status === selectedStatus;
    const matchesSearch = !searchTerm || 
      permit.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.permitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: permits.length,
    submitted: permits.filter((p: any) => p.status === "submitted").length,
    underReview: permits.filter((p: any) => p.status === "under_review").length,
    approved: permits.filter((p: any) => p.status === "approved").length,
    rejected: permits.filter((p: any) => p.status === "rejected").length,
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return (
      <Badge className={`${statusOption?.color} text-white`}>
        {statusOption?.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    return (
      <Badge variant="outline" className={`${priorityOption?.color} text-white border-0`}>
        {priorityOption?.label}
      </Badge>
    );
  };

  const getProjectTypeIcon = (type: string) => {
    const typeOption = projectTypeOptions.find(opt => opt.value === type);
    const Icon = typeOption?.icon || Building2;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جارٍ تحميل رخص البناء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">رخص البناء</h1>
          <p className="text-muted-foreground">إدارة طلبات رخص البناء والإنشاء</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-permit">
              <Plus className="ml-2 h-4 w-4" />
              طلب رخصة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>طلب رخصة بناء جديدة</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* مقدم الطلب */}
                  <FormField
                    control={form.control}
                    name="applicantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مقدم الطلب</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-applicant">
                              <SelectValue placeholder="اختر مقدم الطلب" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {citizens.map((citizen: any) => (
                              <SelectItem key={citizen.id} value={citizen.id}>
                                {citizen.firstName} {citizen.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* اسم المشروع */}
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المشروع</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم المشروع" {...field} data-testid="input-project-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* نوع المشروع */}
                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع المشروع</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-type">
                              <SelectValue placeholder="اختر نوع المشروع" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center">
                                  <option.icon className="ml-2 h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* نوع المبنى */}
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
                            {buildingTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* مساحة الأرض */}
                  <FormField
                    control={form.control}
                    name="plotArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مساحة الأرض (م²)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="مساحة الأرض" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-plot-area"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* مساحة البناء */}
                  <FormField
                    control={form.control}
                    name="buildingArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مساحة البناء (م²)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="مساحة البناء" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-building-area"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* عدد الطوابق */}
                  <FormField
                    control={form.control}
                    name="totalFloors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عدد الطوابق</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="عدد الطوابق" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-total-floors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* الطوابق السفلية */}
                  <FormField
                    control={form.control}
                    name="basementFloors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الطوابق السفلية</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="الطوابق السفلية" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-basement-floors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* التكلفة التقديرية */}
                <FormField
                  control={form.control}
                  name="estimatedCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التكلفة التقديرية (ريال يمني)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="التكلفة التقديرية" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          data-testid="input-estimated-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* الموقع */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>موقع المشروع</FormLabel>
                        <FormControl>
                          <Input placeholder="العنوان التفصيلي" {...field} data-testid="input-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* المنطقة */}
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المنطقة</FormLabel>
                        <FormControl>
                          <Input placeholder="المنطقة" {...field} data-testid="input-district" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* المحافظة */}
                  <FormField
                    control={form.control}
                    name="governorate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المحافظة</FormLabel>
                        <FormControl>
                          <Input placeholder="المحافظة" {...field} data-testid="input-governorate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* المكتب الهندسي */}
                  <FormField
                    control={form.control}
                    name="engineeringOfficeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المكتب الهندسي (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-engineering-office">
                              <SelectValue placeholder="اختر المكتب الهندسي" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {engineeringOffices.map((office: any) => (
                              <SelectItem key={office.id} value={office.id}>
                                {office.officeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* المقاول */}
                  <FormField
                    control={form.control}
                    name="contractorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المقاول (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-contractor">
                              <SelectValue placeholder="اختر المقاول" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contractors.map((contractor: any) => (
                              <SelectItem key={contractor.id} value={contractor.id}>
                                {contractor.contractorName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPermitMutation.isPending}
                    data-testid="button-submit-permit"
                  >
                    {createPermitMutation.isPending ? "جارٍ الإرسال..." : "تقديم الطلب"}
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
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-2xl font-bold" data-testid="text-total-permits">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">طلبات جديدة</p>
                <p className="text-2xl font-bold" data-testid="text-submitted-permits">{stats.submitted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">قيد المراجعة</p>
                <p className="text-2xl font-bold" data-testid="text-review-permits">{stats.underReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">معتمدة</p>
                <p className="text-2xl font-bold" data-testid="text-approved-permits">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="mr-4">
                <p className="text-sm font-medium text-muted-foreground">مرفوضة</p>
                <p className="text-2xl font-bold" data-testid="text-rejected-permits">{stats.rejected}</p>
              </div>
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
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث برقم الرخصة أو اسم المشروع أو الموقع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  data-testid="input-search-permits"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Permits List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة رخص البناء</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPermits.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد رخص بناء</h3>
              <p className="mt-1 text-sm text-gray-500">
                {permits.length === 0 ? "لم يتم تقديم أي طلبات رخص بناء بعد" : "لا توجد نتائج تطابق البحث"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPermits.map((permit: any) => (
                <Card key={permit.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 space-x-reverse mb-2">
                          <h3 className="font-semibold text-lg" data-testid={`text-permit-name-${permit.id}`}>
                            {permit.projectName}
                          </h3>
                          {getStatusBadge(permit.status)}
                          {getPriorityBadge(permit.priority)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 ml-1" />
                            <span data-testid={`text-permit-number-${permit.id}`}>{permit.permitNumber}</span>
                          </div>
                          <div className="flex items-center">
                            {getProjectTypeIcon(permit.projectType)}
                            <span className="mr-1">
                              {projectTypeOptions.find(opt => opt.value === permit.projectType)?.label}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 ml-1" />
                            <span>{permit.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 ml-1" />
                            <span>
                              {new Date(permit.submitDate).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">مساحة الأرض: </span>
                            <span>{permit.plotArea} م²</span>
                          </div>
                          <div>
                            <span className="font-medium">مساحة البناء: </span>
                            <span>{permit.buildingArea} م²</span>
                          </div>
                          <div>
                            <span className="font-medium">عدد الطوابق: </span>
                            <span>{permit.totalFloors}</span>
                          </div>
                          {permit.estimatedCost && (
                            <div>
                              <span className="font-medium">التكلفة: </span>
                              <span>{permit.estimatedCost.toLocaleString()} ريال</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}