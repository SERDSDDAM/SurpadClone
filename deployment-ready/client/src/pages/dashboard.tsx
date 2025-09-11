import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp,
  Shield,
  Settings,
  LogOut,
  Bell,
  Activity,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Phone
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  role: string;
  isVerified: boolean;
  lastLogin?: string;
  preferences: {
    language: string;
    theme: string;
    notifications: {
      email: boolean;
      sms: boolean;
      system: boolean;
    };
  };
}

interface DashboardStats {
  newRequests: number;
  inProgress: number;
  underReview: number;
  completed: number;
  totalCitizens: number;
  activeBuildingPermits: number;
  pendingPermits: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      window.location.href = "/auth/login";
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
  }, []);

  // Fetch user profile
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!localStorage.getItem("auth_token"),
    retry: false,
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      await apiRequest("/api/auth/logout", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "تم تسجيل خروجك من النظام بأمان",
      });
      window.location.href = "/auth/login";
    },
    onError: () => {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const roleDisplayNames = {
    citizen: "مواطن",
    inspector: "مفتش",
    admin: "مدير النظام",
    surveyor: "مساح",
    engineer: "مهندس",
    contractor: "مقاول",
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">بنّاء اليمن</h1>
                <p className="text-xs text-gray-600">لوحة التحكم</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {roleDisplayNames[user.role as keyof typeof roleDisplayNames]}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 ml-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  مرحباً، {user.firstName} {user.lastName}
                </h2>
                <p className="text-blue-100">
                  مرحباً بك في منصة الخدمات الحكومية الرقمية
                </p>
              </div>
              <div className="flex items-center gap-4">
                {user.isVerified ? (
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">حساب موثق</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">في انتظار التوثيق</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Alert */}
        {!user.isVerified && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <Shield className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>مطلوب توثيق الحساب:</strong> يرجى مراجعة أقرب مكتب حكومي لتوثيق هويتك وتفعيل جميع الخدمات
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">طلبات جديدة</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.newRequests}</div>
                <p className="text-xs text-muted-foreground">في انتظار المعالجة</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">جاري العمل عليها</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">منجزة</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">تم إنجازها بنجاح</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.totalCitizens.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">مستخدم نشط</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                الخدمات المتاحة
              </CardTitle>
              <CardDescription>
                الوصول السريع لجميع الخدمات الحكومية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = "/building-permits"}
                  data-testid="button-building-permits"
                >
                  <Building2 className="h-6 w-6" />
                  <span className="text-sm">رخص البناء</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = "/occupancy-certificates"}
                  data-testid="button-occupancy-certificates"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">شهادات الإشغال</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = "/survey-requests"}
                  data-testid="button-survey-requests"
                >
                  <MapPin className="h-6 w-6" />
                  <span className="text-sm">طلبات المساحة</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.href = "/inspection-management"}
                  data-testid="button-inspections"
                >
                  <Shield className="h-6 w-6" />
                  <span className="text-sm">التفتيش</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                معلومات الحساب
              </CardTitle>
              <CardDescription>
                بياناتك الشخصية وحالة الحساب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">الرقم الوطني</span>
                  <span className="font-medium">{user.nationalId}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">رقم الهاتف</span>
                  <span className="font-medium">{user.phone}</span>
                </div>
                
                {user.email && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">البريد الإلكتروني</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">نوع الحساب</span>
                  <Badge variant="outline">
                    {roleDisplayNames[user.role as keyof typeof roleDisplayNames]}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">حالة التوثيق</span>
                  <Badge variant={user.isVerified ? "default" : "secondary"}>
                    {user.isVerified ? "موثق" : "غير موثق"}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = "/profile/settings"}
                  data-testid="button-settings"
                >
                  <Settings className="h-4 w-4 ml-2" />
                  إعدادات الحساب
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <div className="mt-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    هل تحتاج مساعدة؟
                  </h3>
                  <p className="text-gray-600">
                    فريق الدعم الفني متاح 24/7 لمساعدتك
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <Phone className="h-6 w-6 text-primary mx-auto mb-1" />
                    <p className="text-sm font-medium">967-1-123456</p>
                    <p className="text-xs text-gray-500">دعم فني</p>
                  </div>
                  <Button variant="outline">
                    اتصل بنا
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}