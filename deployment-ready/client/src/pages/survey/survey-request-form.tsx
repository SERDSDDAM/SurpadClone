import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSurveyRequestSchema, type InsertSurveyRequest } from "@shared/survey-schema";
import { 
  MapPin, 
  User, 
  FileText, 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Home,
  Phone,
  Mail,
  IdCard,
  Building2,
  Target
} from "lucide-react";

const STEPS = [
  { id: 1, title: "بيانات المالك", description: "المعلومات الشخصية" },
  { id: 2, title: "بيانات العقار", description: "موقع ووصف العقار" },
  { id: 3, title: "تفاصيل الطلب", description: "الغرض والمستندات" },
  { id: 4, title: "المراجعة", description: "تأكيد البيانات" }
];

const GOVERNORATES = [
  "صنعاء", "عدن", "تعز", "الحديدة", "إب", "ذمار", "حجة", "المحويت", 
  "صعدة", "عمران", "البيضاء", "أبين", "لحج", "شبوة", "مأرب", 
  "الجوف", "حضرموت", "المهرة", "سقطرى"
];

const OWNERSHIP_TYPES = [
  { value: "صك_شرعي", label: "صك شرعي" },
  { value: "عقد_بيع", label: "عقد بيع" },
  { value: "حيازة", label: "حيازة" },
  { value: "وراثة", label: "وراثة" },
  { value: "هبة", label: "هبة" },
  { value: "وقف", label: "وقف" }
];

const PURPOSES = [
  { value: "رخصة_بناء", label: "إصدار رخصة بناء" },
  { value: "تقسيم_أرض", label: "تقسيم أرض" },
  { value: "تسوية_نزاع", label: "تسوية نزاع" },
  { value: "بيع_عقار", label: "بيع عقار" },
  { value: "تحديد_حدود", label: "تحديد حدود" },
  { value: "توثيق_ملكية", label: "توثيق ملكية" }
];

export default function SurveyRequestForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  
  const form = useForm<InsertSurveyRequest>({
    resolver: zodResolver(insertSurveyRequestSchema),
    defaultValues: {
      ownerName: "",
      ownerNationalId: "",
      ownerPhone: "",
      ownerEmail: "",
      ownerAddress: "",
      governorate: "",
      directorate: "",
      area: "",
      plotNumber: "",
      blockNumber: "",
      purpose: "",
      ownershipType: "",
      notes: ""
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertSurveyRequest) => {
      return await apiRequest('/api/survey-requests', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response) => {
      toast({
        title: "تم تقديم الطلب بنجاح",
        description: `رقم الطلب: ${response.requestNumber}`,
      });
      // إعادة توجيه لصفحة متابعة الطلب
      window.location.href = `/survey-requests/${response.id}`;
    },
    onError: (error: any) => {
      toast({
        title: "حدث خطأ",
        description: error.message || "فشل في تقديم الطلب",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: InsertSurveyRequest) => {
    submitMutation.mutate(data);
  };

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fields);
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof InsertSurveyRequest)[] => {
    switch (step) {
      case 1:
        return ["ownerName", "ownerNationalId", "ownerPhone"];
      case 2:
        return ["governorate", "directorate", "area"];
      case 3:
        return ["purpose", "ownershipType"];
      default:
        return [];
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">طلب إصدار قرار مساحي</h1>
        <p className="text-gray-600">يرجى تعبئة النموذج بالمعلومات المطلوبة بدقة</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                step.id <= currentStep 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {step.id < currentStep ? <CheckCircle className="h-5 w-5" /> : step.id}
              </div>
              <div className="text-center mt-2">
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Step 1: Owner Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  بيانات المالك
                </CardTitle>
                <CardDescription>
                  يرجى إدخال المعلومات الشخصية للمالك بدقة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          اسم المالك الكامل *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل الاسم الكامل" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerNationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <IdCard className="h-4 w-4" />
                          رقم الهوية الوطنية *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل رقم الهوية" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          رقم الهاتف *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="777-123-456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          البريد الإلكتروني
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="example@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ownerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        عنوان السكن
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أدخل العنوان الكامل"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Property Information */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  بيانات العقار
                </CardTitle>
                <CardDescription>
                  حدد موقع العقار بدقة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="governorate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المحافظة *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المحافظة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GOVERNORATES.map((gov) => (
                              <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="directorate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المديرية *</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل المديرية" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المنطقة/الحي *</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل المنطقة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plotNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم القطعة</FormLabel>
                        <FormControl>
                          <Input placeholder="إن وجد" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="blockNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم المربع</FormLabel>
                        <FormControl>
                          <Input placeholder="إن وجد" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Interactive Map Placeholder */}
                <div className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    تحديد الموقع على الخريطة (اختياري)
                  </FormLabel>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center space-y-2">
                      <MapPin className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-gray-500">سيتم تفعيل الخريطة التفاعلية قريباً</p>
                      <p className="text-sm text-gray-400">لتحديد موقع العقار بدقة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Request Details */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  تفاصيل الطلب
                </CardTitle>
                <CardDescription>
                  حدد الغرض من القرار المساحي ونوع الملكية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الغرض من القرار المساحي *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الغرض" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PURPOSES.map((purpose) => (
                              <SelectItem key={purpose.value} value={purpose.value}>
                                {purpose.label}
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
                    name="ownershipType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الملكية *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع الملكية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OWNERSHIP_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        ملاحظات إضافية
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أي معلومات إضافية تساعد في تحديد العقار"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Document Upload Section */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    المستندات المطلوبة
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">وثيقة الملكية *</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">اضغط لرفع الملف أو اسحبه هنا</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG - حتى 5MB</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">صورة الهوية الوطنية *</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">اضغط لرفع الملف أو اسحبه هنا</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG - حتى 5MB</p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      يرجى التأكد من وضوح المستندات المرفوعة لتسريع عملية المراجعة
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  مراجعة البيانات
                </CardTitle>
                <CardDescription>
                  يرجى مراجعة جميع البيانات قبل التقديم
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Owner Info Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">بيانات المالك</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">الاسم:</span> {form.getValues("ownerName")}</p>
                    <p><span className="font-medium">رقم الهوية:</span> {form.getValues("ownerNationalId")}</p>
                    <p><span className="font-medium">الهاتف:</span> {form.getValues("ownerPhone")}</p>
                    {form.getValues("ownerEmail") && (
                      <p><span className="font-medium">البريد الإلكتروني:</span> {form.getValues("ownerEmail")}</p>
                    )}
                  </div>
                </div>

                {/* Property Info Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">بيانات العقار</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">الموقع:</span> {form.getValues("governorate")} - {form.getValues("directorate")} - {form.getValues("area")}</p>
                    {form.getValues("plotNumber") && (
                      <p><span className="font-medium">رقم القطعة:</span> {form.getValues("plotNumber")}</p>
                    )}
                    {form.getValues("blockNumber") && (
                      <p><span className="font-medium">رقم المربع:</span> {form.getValues("blockNumber")}</p>
                    )}
                  </div>
                </div>

                {/* Request Details Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">تفاصيل الطلب</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">الغرض:</span> {PURPOSES.find(p => p.value === form.getValues("purpose"))?.label}</p>
                    <p><span className="font-medium">نوع الملكية:</span> {OWNERSHIP_TYPES.find(t => t.value === form.getValues("ownershipType"))?.label}</p>
                    {form.getValues("notes") && (
                      <p><span className="font-medium">الملاحظات:</span> {form.getValues("notes")}</p>
                    )}
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    بالضغط على "تقديم الطلب"، أؤكد أن جميع البيانات المدخلة صحيحة ودقيقة
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              السابق
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                التالي
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {submitMutation.isPending ? "جاري التقديم..." : "تقديم الطلب"}
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}