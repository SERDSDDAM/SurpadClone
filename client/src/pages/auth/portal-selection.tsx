import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  Users, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Info
} from "lucide-react";

export default function PortalSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-orange-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">بنّاء اليمن</h1>
              <p className="text-lg text-gray-600">منصة الخدمات الحكومية الرقمية</p>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">اختر نوع دخولك</h2>
            <p className="text-gray-600">يرجى اختيار البوابة المناسبة لنوع حسابك</p>
          </div>
        </div>

        {/* Portal Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Citizen Portal */}
          <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">بوابة المواطنين</CardTitle>
              <CardDescription className="text-gray-600">
                للمواطنين العاديين للحصول على الخدمات الحكومية
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>تقديم طلبات رخص البناء</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>متابعة حالة الطلبات</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>الحصول على الشهادات</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>دفع الرسوم الحكومية</span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-semibold"
                  onClick={() => window.location.href = "/auth/citizen-login"}
                  data-testid="button-citizen-portal"
                >
                  دخول المواطنين
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = "/auth/citizen-register"}
                  data-testid="button-citizen-register"
                >
                  إنشاء حساب مواطن
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Professional Portal */}
          <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">بوابة المهنيين</CardTitle>
              <CardDescription className="text-gray-600">
                للمكاتب الهندسية والمقاولين المرخصين
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>إدارة المشاريع الهندسية</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>تقديم المخططات والتصاميم</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>إدارة فريق العمل</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>متابعة العقود والمناقصات</span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg font-semibold"
                  onClick={() => window.location.href = "/auth/professional-login"}
                  data-testid="button-professional-portal"
                >
                  دخول المهنيين
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = "/auth/professional-register"}
                  data-testid="button-professional-register"
                >
                  طلب ترخيص مهني
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Employee Portal */}
          <Card className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">نظام الموظفين</CardTitle>
              <CardDescription className="text-gray-600">
                للموظفين والمسؤولين الحكوميين
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>مراجعة وموافقة الطلبات</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>إجراء التفتيش الميداني</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>إدارة النظام والمستخدمين</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>تقارير وإحصائيات شاملة</span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-lg font-semibold"
                  onClick={() => window.location.href = "/auth/employee-login"}
                  data-testid="button-employee-portal"
                >
                  دخول الموظفين
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Notice */}
        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>نظام الصلاحيات المتقدم:</strong> يدعم النظام أدواراً متعددة مع صلاحيات مخصصة لكل مستخدم. 
              أصحاب المكاتب الهندسية يمكنهم إدارة صلاحيات موظفيهم بأنفسهم.
            </AlertDescription>
          </Alert>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>التحضير للمستقبل:</strong> النظام مُصمم للتكامل مع نظام الهوية الرقمية الوطني اليمني المستقبلي، 
              على غرار تكامل "بلدي" مع "نفاذ" في السعودية.
            </AlertDescription>
          </Alert>

          <Alert className="border-orange-200 bg-orange-50">
            <Shield className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>أمان المعلومات:</strong> جميع البيانات محمية بتشفير متقدم ومطابقة للمعايير الدولية. 
              نظام المصادقة الثنائية متوفر لحماية إضافية.
            </AlertDescription>
          </Alert>
        </div>

        {/* Government Notice */}
        <div className="text-center">
          <Alert className="border-gray-200 bg-gray-50">
            <Building2 className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-800">
              منصة حكومية رسمية معتمدة من قبل الحكومة اليمنية - جميع الخدمات مُصدقة ومُعترف بها قانونياً
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}