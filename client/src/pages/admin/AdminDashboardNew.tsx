import { useSimpleAuth } from "@/hooks/useSimpleAuth";
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
  LogOut,
  Building2,
  UserCheck,
  Globe,
  Layers
} from "lucide-react";

export default function AdminDashboardNew() {
  const { user, isLoading, isAuthenticated } = useSimpleAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🚫 Not authenticated, redirecting to login');
      window.location.href = '/auth/employee-login';
    }
  }, [isAuthenticated, isLoading]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/auth/employee-login';
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

  const adminCards = [
    {
      title: "إدارة المستخدمين",
      description: "إدارة حسابات المستخدمين والصلاحيات",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-500"
    },
    {
      title: "التحليلات والتقارير",
      description: "عرض الإحصائيات والتقارير التفصيلية",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-green-500"
    },
    {
      title: "البيانات الجغرافية",
      description: "إدارة الطبقات والخرائط الجغرافية",
      icon: Map,
      href: "/admin/gis",
      color: "bg-purple-500"
    },
    {
      title: "إدارة الأدوار",
      description: "تحديد الأدوار والصلاحيات",
      icon: Shield,
      href: "/admin/roles",
      color: "bg-orange-500"
    },
    {
      title: "قاعدة البيانات",
      description: "إدارة وصيانة قاعدة البيانات",
      icon: Database,
      href: "/admin/database",
      color: "bg-red-500"
    },
    {
      title: "رفع الملفات",
      description: "إدارة رفع ومعالجة الملفات",
      icon: Upload,
      href: "/phase1-processing",
      color: "bg-indigo-500"
    },
    {
      title: "أدوات الرقمنة",
      description: "أدوات متقدمة لرقمنة المخططات",
      icon: Layers,
      href: "/phase2-digitization",
      color: "bg-teal-500"
    },
    {
      title: "المشاريع الحكومية",
      description: "إدارة مشاريع البناء والتطوير",
      icon: Building2,
      href: "/admin/projects",
      color: "bg-cyan-500"
    }
  ];

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
                <p className="text-sm text-gray-500">منصة بنّاء اليمن الرقمية - نظام إدارة متقدم</p>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {user?.name || `${user?.firstName} ${user?.lastName}` || user?.username}
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            مرحباً {user?.firstName || user?.username}
          </h2>
          <p className="text-lg text-gray-600">
            إدارة شاملة لمنصة بنّاء اليمن الرقمية
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-gray-600">المستخدمون</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">567</p>
                  <p className="text-gray-600">الطلبات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Map className="h-8 w-8 text-purple-600" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-gray-600">الطبقات الجغرافية</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-orange-600" />
                <div className="mr-4">
                  <p className="text-2xl font-bold">45</p>
                  <p className="text-gray-600">المشاريع النشطة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Functions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = card.href}
                  >
                    الانتقال
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}