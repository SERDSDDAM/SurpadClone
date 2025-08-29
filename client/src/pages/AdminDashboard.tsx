import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  MapPin, 
  BarChart3, 
  Settings, 
  LogOut,
  Activity,
  Database,
  Layers,
  CheckCircle,
  AlertTriangle,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "غير مخول",
        description: "يجب تسجيل دخول كمدير للوصول لهذه الصفحة",
        variant: "destructive"
      });
      setLocation('/employee-login');
    }
  }, [isAuthenticated, isLoading, user, toast, setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
        variant: "default"
      });
      
      setLocation('/employee-login');
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated or not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const systemStats = [
    {
      title: "إجمالي الطبقات",
      value: "35",
      description: "طبقة نشطة في النظام",
      icon: Layers,
      status: "success"
    },
    {
      title: "المستخدمين النشطين",
      value: "2",
      description: "مدير ومساح",
      icon: Users,
      status: "success"
    },
    {
      title: "حالة النظام",
      value: "عاملة",
      description: "جميع الخدمات تعمل بشكل طبيعي",
      icon: Activity,
      status: "success"
    },
    {
      title: "قاعدة البيانات",
      value: "متصلة",
      description: "PostgreSQL جاهز",
      icon: Database,
      status: "success"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      action: "تم إنشاء مستخدم admin",
      timestamp: "منذ دقائق",
      status: "success"
    },
    {
      id: 2,
      action: "تم إنشاء مستخدم surveyor1",
      timestamp: "منذ دقائق", 
      status: "success"
    },
    {
      id: 3,
      action: "تم تفعيل نظام المصادقة",
      timestamp: "الآن",
      status: "success"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-primary/10 p-2 rounded-full">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  لوحة تحكم المدير
                </h1>
                <p className="text-sm text-muted-foreground">
                  منصة بنّاء اليمن - إدارة النظام
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse bg-muted px-3 py-2 rounded-lg">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {user.fullName || user.username}
                </span>
                <Badge variant="secondary">مدير</Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Alert */}
        <Alert className="mb-8 border-primary/20 bg-primary/5">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            مرحباً بك في لوحة تحكم المدير! تم تفعيل نظام المصادقة بنجاح وجميع الميزات جاهزة للاستخدام.
          </AlertDescription>
        </Alert>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${
                    stat.status === 'success' ? 'bg-green-100 text-green-600' : 
                    stat.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
            <TabsTrigger value="system">حالة النظام</TabsTrigger>
            <TabsTrigger value="logs">سجل النشاط</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 ml-2" />
                    النشاط الأخير
                  </CardTitle>
                  <CardDescription>
                    آخر العمليات في النظام
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.status === 'success' ? 'bg-green-500' : 
                            activity.status === 'warning' ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`} />
                          <span className="text-sm">{activity.action}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {activity.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 ml-2" />
                    الوصول السريع
                  </CardTitle>
                  <CardDescription>
                    الوصول لأدوات النظام الرئيسية
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => setLocation('/phase2-digitization')}
                  >
                    <Layers className="w-4 h-4 ml-2" />
                    أدوات الرقمنة المتقدمة
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/phase1-processing')}
                  >
                    <Database className="w-4 h-4 ml-2" />
                    معالجة البيانات الجغرافية
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setLocation('/gis-management')}
                  >
                    <MapPin className="w-4 h-4 ml-2" />
                    إدارة البيانات الجغرافية
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المستخدمين</CardTitle>
                <CardDescription>
                  قائمة المستخدمين المسجلين في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="bg-red-100 p-2 rounded-full">
                        <Shield className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">admin</p>
                        <p className="text-sm text-muted-foreground">admin@banna-yemen.gov.ye</p>
                      </div>
                    </div>
                    <Badge>مدير النظام</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">surveyor1</p>
                        <p className="text-sm text-muted-foreground">surveyor1@banna-yemen.gov.ye</p>
                      </div>
                    </div>
                    <Badge variant="secondary">مساح</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>حالة النظام</CardTitle>
                <CardDescription>
                  معلومات حول حالة مكونات النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">خادم التطبيق</h4>
                      <Badge className="bg-green-100 text-green-800">يعمل</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Express.js على المنفذ 5000
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">قاعدة البيانات</h4>
                      <Badge className="bg-green-100 text-green-800">متصلة</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      PostgreSQL مع Neon
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">نظام المصادقة</h4>
                      <Badge className="bg-green-100 text-green-800">نشط</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      JWT مع bcrypt للأمان
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">ملفات GIS</h4>
                      <Badge className="bg-green-100 text-green-800">35 طبقة</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      طبقات جغرافية جاهزة للاستخدام
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>سجل النشاط</CardTitle>
                <CardDescription>
                  سجل مفصل لعمليات النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">تم تسجيل دخول المدير admin بنجاح</span>
                    </div>
                    <span className="text-xs text-muted-foreground">الآن</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Settings className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">تم تهيئة نظام المصادقة</span>
                    </div>
                    <span className="text-xs text-muted-foreground">منذ دقائق</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Database className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">تم إنشاء جدول المستخدمين</span>
                    </div>
                    <span className="text-xs text-muted-foreground">منذ دقائق</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}