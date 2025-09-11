import { useSurveyWizard } from "@/features/survey/wizard/SurveyWizardContext";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ApplicantStep() {
  const { state, setState } = useSurveyWizard();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({ 
    defaultValues: state.applicant 
  });

  const documentType = watch("documentType");

  const onSubmit = (values: any) => {
    setState(s => ({ ...s, applicant: values, step: 'location' }));
  };

  const goBack = () => {
    setState(s => ({ ...s, step: 'choose-path' }));
  };

  return (
    <div className="space-y-6" data-testid="applicant-step">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>بيانات مقدم الطلب</span>
            {state.mode && (
              <span className={`text-sm px-2 py-1 rounded ${state.mode === 'shapefile' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                {state.mode === 'shapefile' ? 'مسار Shapefile' : 'مسار GNSS'}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل *</Label>
                <Input 
                  id="fullName"
                  placeholder="أدخل الاسم الكامل" 
                  {...register("fullName", { required: "الاسم مطلوب" })}
                  data-testid="fullName-input"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600" data-testid="fullName-error">
                    {errors.fullName.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalId">رقم الهوية *</Label>
                <Input 
                  id="nationalId"
                  placeholder="أدخل رقم الهوية" 
                  {...register("nationalId", { 
                    required: "رقم الهوية مطلوب",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "يجب أن يكون رقم الهوية 10 أرقام"
                    }
                  })}
                  data-testid="nationalId-input"
                />
                {errors.nationalId && (
                  <p className="text-sm text-red-600" data-testid="nationalId-error">
                    {errors.nationalId.message as string}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input 
                  id="phone"
                  placeholder="77xxxxxxx" 
                  {...register("phone", {
                    pattern: {
                      value: /^7[0-9]{8}$/,
                      message: "رقم الجوال يجب أن يبدأ بـ 7 ويحتوي على 9 أرقام"
                    }
                  })}
                  data-testid="phone-input"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">صفة مقدم الطلب</Label>
                <Select onValueChange={(value) => setValue("role", value)} defaultValue={state.applicant.role}>
                  <SelectTrigger data-testid="role-select">
                    <SelectValue placeholder="اختر الصفة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">مالك القطعة</SelectItem>
                    <SelectItem value="agent">وكيل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">بيانات القطعة</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">نوع الوثيقة *</Label>
                  <Select onValueChange={(value) => setValue("documentType", value)} defaultValue={state.applicant.documentType}>
                    <SelectTrigger data-testid="documentType-select">
                      <SelectValue placeholder="اختر نوع الوثيقة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deed">صك ملكية</SelectItem>
                      <SelectItem value="basira">بصيرة</SelectItem>
                      <SelectItem value="other">وثيقة أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaFromDoc">المساحة حسب الوثيقة (م²)</Label>
                  <Input 
                    id="areaFromDoc"
                    type="number" 
                    step="0.01" 
                    placeholder="مثال: 500.50" 
                    {...register("areaFromDoc", {
                      valueAsNumber: true,
                      min: { value: 1, message: "المساحة يجب أن تكون أكبر من 1" }
                    })}
                    data-testid="areaFromDoc-input"
                  />
                  {errors.areaFromDoc && (
                    <p className="text-sm text-red-600">{errors.areaFromDoc.message as string}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="purpose">الغرض من القرار المساحي *</Label>
                <Textarea 
                  id="purpose"
                  placeholder="مثال: بناء منزل سكني، تقسيم، بيع، إلخ..." 
                  rows={3}
                  {...register("purpose", { required: "الغرض مطلوب" })}
                  data-testid="purpose-textarea"
                />
                {errors.purpose && (
                  <p className="text-sm text-red-600">{errors.purpose.message as string}</p>
                )}
              </div>
            </div>

            {/* Path-specific Information */}
            {state.mode === 'shapefile' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-900 mb-2">متطلبات مسار Shapefile</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• ملف ZIP يحتوي على (shp, shx, dbf, prj)</li>
                  <li>• نظام الإحداثيات: WGS84 أو UTM Zone 38N</li>
                  <li>• التأكد من صحة البيانات الهندسية</li>
                </ul>
              </div>
            )}

            {state.mode === 'gnss' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">متطلبات مسار GNSS</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• سيتم تحديد موعد للمسح الميداني</li>
                  <li>• يتطلب وجود مالك القطعة أو وكيله</li>
                  <li>• المدة المتوقعة: 2-4 ساعات</li>
                </ul>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={goBack}
                data-testid="back-btn"
              >
                رجوع
              </Button>
              <Button 
                type="submit"
                data-testid="next-btn"
              >
                التالي
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}