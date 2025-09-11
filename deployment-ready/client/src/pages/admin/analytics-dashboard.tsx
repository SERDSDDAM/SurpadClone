import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  FileText, 
  MapPin,
  Server,
  Database,
  Clock,
  Activity,
  Shield,
  Settings,
  Download,
  Eye,
  Filter,
  Search,
  Bell,
  LogOut,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Globe,
  Calendar,
  Target
} from "lucide-react";
import { useState } from "react";

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data للتحليلات - في التطبيق الحقيقي ستأتي من API
  const systemStats = {
    totalRequests: 15847,
    activeUsers: 3421,
    completedRequests: 12356,
    pendingRequests: 2891,
    systemUptime: 99.8,
    avgResponseTime: 245,
    dataStorage: 85.2,
    cpuUsage: 67.3
  };

  const regionData = [
    { name: "صنعاء", requests: 4523, growth: 12.5, color: "bg-blue-500" },
    { name: "عدن", requests: 3214, growth: 8.3, color: "bg-green-500" },
    { name: "تعز", requests: 2187, growth: 15.2, color: "bg-purple-500" },
    { name: "الحديدة", requests: 1876, growth: 6.1, color: "bg-orange-500" },
    { name: "إب", requests: 1543, growth: 9.7, color: "bg-red-500" },
    { name: "أخرى", requests: 2504, growth: 4.2, color: "bg-gray-500" }
  ];

  const serviceUsage = [
    { service: "رخص البناء", count: 8543, percentage: 54.2, trend: "up" },
    { service: "شهادات الإشغال", count: 3421, percentage: 21.7, trend: "up" },
    { service: "التفتيش الميداني", count: 2187, percentage: 13.9, trend: "down" },
    { service: "المخالفات", count: 1165, percentage: 7.4, trend: "stable" },
    { service: "أخرى", count: 531, percentage: 2.8, trend: "up" }
  ];

  const userActivity = [
    { userType: "مواطنين", count: 12543, percentage: 73.2, color: "bg-blue-500" },
    { userType: "مهنيين", count: 3421, percentage: 20.0, color: "bg-green-500" },
    { userType: "موظفين", count: 1165, percentage: 6.8, color: "bg-purple-500" }
  ];

  const systemHealth = [
    { metric: "الخوادم", status: "جيد", value: "5/5 نشطة", color: "text-green-600" },
    { metric: "قاعدة البيانات", status: "ممتاز", value: "< 100ms", color: "text-green-600" },
    { metric: "التخزين", status: "تحذير", value: "85.2% مستخدم", color: "text-orange-600" },
    { metric: "الشبكة", status: "جيد", value: "245ms متوسط", color: "text-green-600" }
  ];

  const recentActivity = [
    {
      id: 1,
      action: "تسجيل دخول إدارية",
      user: "أحمد محمد",
      timestamp: "منذ 5 دقائق",
      ip: "192.168.1.100",
      status: "نجح"
    },
    {
      id: 2,
      action: "تحديث إعدادات النظام",
      user: "سارة أحمد",
      timestamp: "منذ 12 دقيقة",
      ip: "192.168.1.105",
      status: "نجح"
    },
    {
      id: 3,
      action: "محاولة دخول فاشلة",
      user: "غير معروف",
      timestamp: "منذ 20 دقيقة",
      ip: "203.123.45.67",
      status: "فشل"
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "نجح": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "فشل": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">لوحة التحكم التحليلية</h1>
                <p className="text-sm text-gray-600">مدير النظام - تحليلات شاملة</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {["7d", "30d", "90d", "1y"].map((period) => (
                  <Button
                    key={period}
                    variant={timeRange === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(period)}
                  >
                    {period}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalRequests.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.activeUsers.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">المستخدمين النشطين</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.completedRequests.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">طلبات مكتملة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.systemUptime}%</p>
                  <p className="text-sm text-gray-600">معدل التشغيل</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="geography">التوزيع الجغرافي</TabsTrigger>
            <TabsTrigger value="services">استخدام الخدمات</TabsTrigger>
            <TabsTrigger value="system">أداء النظام</TabsTrigger>
            <TabsTrigger value="security">الأمان والمراجعة</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    توزيع المستخدمين
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userActivity.map((user) => (
                    <div key={user.userType} className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${user.color}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{user.userType}</span>
                          <span className="text-sm text-gray-600">{user.count.toLocaleString()}</span>
                        </div>
                        <Progress value={user.percentage} className="h-2" />
                      </div>
                      <span className="text-sm text-gray-500">{user.percentage}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Service Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    الخدمات الأكثر استخداماً
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {serviceUsage.map((service) => (
                    <div key={service.service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(service.trend)}
                        <div>
                          <p className="font-medium text-gray-900">{service.service}</p>
                          <p className="text-sm text-gray-600">{service.count.toLocaleString()} طلب</p>
                        </div>
                      </div>
                      <Badge variant="outline">{service.percentage}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geography" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  الخريطة الحرارية للطلبات
                </CardTitle>
                <CardDescription>
                  توزيع الطلبات حسب المحافظات ومعدلات النمو
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regionData.map((region) => (
                    <Card key={region.name} className="border-l-4" style={{ borderLeftColor: region.color.replace('bg-', '') === 'blue-500' ? '#3b82f6' : 
                      region.color.replace('bg-', '') === 'green-500' ? '#10b981' :
                      region.color.replace('bg-', '') === 'purple-500' ? '#8b5cf6' :
                      region.color.replace('bg-', '') === 'orange-500' ? '#f59e0b' :
                      region.color.replace('bg-', '') === 'red-500' ? '#ef4444' : '#6b7280' }}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{region.name}</h3>
                          <Badge variant={region.growth > 10 ? "default" : "secondary"} className="text-xs">
                            {region.growth > 0 ? '+' : ''}{region.growth}%
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{region.requests.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                        <div className="mt-2">
                          <Progress value={(region.requests / Math.max(...regionData.map(r => r.requests))) * 100} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل استخدام الخدمات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {serviceUsage.map((service) => (
                    <div key={service.service} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{service.service}</h4>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(service.trend)}
                          <span className="text-sm font-medium">{service.count.toLocaleString()}</span>
                        </div>
                      </div>
                      <Progress value={service.percentage} className="h-3" />
                      <p className="text-xs text-gray-600 mt-1">{service.percentage}% من إجمالي الطلبات</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات الوقت</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">متوسط وقت المعالجة</span>
                      <span className="text-lg font-bold text-blue-900">3.2 يوم</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">الطلبات المكتملة في الوقت</span>
                      <span className="text-lg font-bold text-green-900">87%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">الطلبات المتأخرة</span>
                      <span className="text-lg font-bold text-orange-900">156</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-600" />
                    صحة النظام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemHealth.map((item) => (
                    <div key={item.metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.metric}</p>
                        <p className="text-sm text-gray-600">{item.value}</p>
                      </div>
                      <Badge variant="outline" className={item.color}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-600" />
                    مؤشرات الأداء
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">استخدام وحدة المعالجة</span>
                      <span className="text-sm text-gray-600">{systemStats.cpuUsage}%</span>
                    </div>
                    <Progress value={systemStats.cpuUsage} className="h-3" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">استخدام التخزين</span>
                      <span className="text-sm text-gray-600">{systemStats.dataStorage}%</span>
                    </div>
                    <Progress value={systemStats.dataStorage} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-900">{systemStats.avgResponseTime}ms</p>
                      <p className="text-xs text-blue-700">متوسط الاستجابة</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-900">{systemStats.systemUptime}%</p>
                      <p className="text-xs text-green-700">معدل التشغيل</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  سجل الأنشطة الأمنية
                </CardTitle>
                <CardDescription>
                  آخر الأنشطة الأمنية والإدارية في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      {getStatusIcon(activity.status)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">المستخدم: {activity.user} • IP: {activity.ip}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-gray-500">{activity.timestamp}</p>
                        <Badge variant={activity.status === "نجح" ? "default" : "destructive"} className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}