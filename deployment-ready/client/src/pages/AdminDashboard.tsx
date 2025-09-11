import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MapPin, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield,
  Database,
  Upload,
  Map,
  LogOut
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg">جارٍ التحميل...</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-lg text-red-600">غير مصرح لك بالوصول لهذه الصفحة</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-reverse space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم المدير</h1>
                <p className="text-sm text-gray-500">منصة بنّاء اليمن الرقمية</p>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {user?.fullName || user?.username}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-reverse space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>تسجيل خروج</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,284</div>
              <p className="text-xs text-muted-foreground">+5.2% من الشهر الماضي</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الطبقات النشطة</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">35</div>
              <p className="text-xs text-muted-foreground">جاهزة للعرض</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">القرارات المساحية</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">456</div>
              <p className="text-xs text-muted-foreground">هذا الشهر</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نسبة الأداء</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.2%</div>
              <p className="text-xs text-muted-foreground">متاح ومستقر</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <span>إدارة قواعد البيانات</span>
              </CardTitle>
              <CardDescription>
                عرض وإدارة جميع البيانات الجغرافية والمستخدمين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">الدخول إلى قاعدة البيانات</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <span>نظام GIS المتقدم</span>
              </CardTitle>
              <CardDescription>
                إدارة الطبقات الجغرافية وأدوات الرسم التفاعلي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => window.location.href = '/phase2-digitization'}
              >
                فتح منصة GIS
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Upload className="h-5 w-5 text-purple-600" />
                <span>رفع الملفات</span>
              </CardTitle>
              <CardDescription>
                رفع ومعالجة ملفات GeoTIFF و ZIP الجغرافية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => window.location.href = '/phase1-processing'}
              >
                مركز الرفع
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span>إدارة المستخدمين</span>
              </CardTitle>
              <CardDescription>
                إضافة وإدارة حسابات المساحين والموظفين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">إدارة المستخدمين</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <FileText className="h-5 w-5 text-red-600" />
                <span>التقارير والإحصائيات</span>
              </CardTitle>
              <CardDescription>
                عرض التقارير التفصيلية وإحصائيات الاستخدام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">عرض التقارير</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <span>إعدادات النظام</span>
              </CardTitle>
              <CardDescription>
                تكوين النظام والأمان والنسخ الاحتياطي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">الإعدادات</Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
              <CardDescription>الوصول السريع للوظائف الأساسية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant="outline">إضافة مستخدم جديد</Button>
                <Button size="sm" variant="outline">نسخة احتياطية للنظام</Button>
                <Button size="sm" variant="outline">مراجعة السجلات</Button>
                <Button size="sm" variant="outline">تحديث الأذونات</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}