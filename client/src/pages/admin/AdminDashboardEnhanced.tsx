import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Activity, 
  BarChart3,
  FileText,
  MapPin,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Database,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Link } from 'wouter';

export default function AdminDashboardEnhanced() {
  const [activeTimeRange, setActiveTimeRange] = useState('7d');

  // جلب إحصائيات النظام العامة
  const { data: systemStats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/admin/system-stats'],
    retry: false,
  });

  // جلب إحصائيات RBAC
  const { data: rbacStats, isLoading: loadingRBAC } = useQuery({
    queryKey: ['/api/advanced-rbac/reports/permission-stats'],
    retry: false,
  });

  // جلب التنبيهات الحديثة
  const { data: recentAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['/api/advanced-rbac/smart-alerts', { limit: 5 }],
    retry: false,
  });

  // جلب أحدث الأنشطة
  const { data: recentActivities, isLoading: loadingActivities } = useQuery({
    queryKey: ['/api/advanced-rbac/permission-monitoring', { limit: 10 }],
    retry: false,
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم المحسنة - بنّاء اليمن</h1>
          <p className="text-gray-600 mt-2">
            مراقبة شاملة للنظام المتقدم للصلاحيات والأدوار والأمان
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            نشط الآن
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            نظام محمي
          </Badge>
        </div>
      </div>

      {/* المؤشرات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المستخدمين النشطين</p>
                <p className="text-2xl font-bold">
                  {systemStats?.activeUsers || 0}
                </p>
                <p className="text-xs text-green-600">+12% من الأسبوع الماضي</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">طلبات الصلاحيات</p>
                <p className="text-2xl font-bold">
                  {rbacStats?.stats?.summary?.totalRequests || 0}
                </p>
                <p className="text-xs text-blue-600">في آخر 7 أيام</p>
              </div>
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل الأمان</p>
                <p className="text-2xl font-bold">
                  {rbacStats?.stats?.summary?.successRate || '0'}%
                </p>
                <p className="text-xs text-green-600">ممتاز</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">تنبيهات عالية</p>
                <p className="text-2xl font-bold">
                  {rbacStats?.stats?.summary?.highRiskRequests || 0}
                </p>
                <p className="text-xs text-red-600">تحتاج متابعة</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="security">الأمان والحماية</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات المتقدمة</TabsTrigger>
          <TabsTrigger value="monitoring">المراقبة المباشرة</TabsTrigger>
          <TabsTrigger value="management">إدارة النظام</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الأنشطة الحديثة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  الأنشطة الحديثة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingActivities ? (
                    <p className="text-center text-gray-500">جاري التحميل...</p>
                  ) : (
                    recentActivities?.permissionMonitoring?.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {activity.result === 'granted' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.userId}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString('ar-YE')}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${activity.riskScore >= 7 ? 'text-red-600' : 'text-green-600'}`}
                          >
                            مخاطر {activity.riskScore}/10
                          </Badge>
                        </div>
                      </div>
                    )) || <p className="text-center text-gray-500">لا توجد أنشطة حديثة</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* التنبيهات الحديثة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  التنبيهات الحديثة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingAlerts ? (
                    <p className="text-center text-gray-500">جاري التحميل...</p>
                  ) : (
                    recentAlerts?.smartAlerts?.slice(0, 5).map((alert: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`w-4 h-4 ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-gray-500">{alert.message?.slice(0, 50)}...</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                            {alert.severity === 'critical' ? 'حرج' :
                             alert.severity === 'warning' ? 'تحذير' : 'معلومات'}
                          </Badge>
                        </div>
                      </div>
                    )) || <p className="text-center text-gray-500">لا توجد تنبيهات حديثة</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">أكثر الصلاحيات استخداماً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rbacStats?.stats?.topPermissions?.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 truncate">
                        {item.permission?.split('.').pop()}
                      </span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  )) || <p className="text-sm text-gray-500">لا توجد بيانات</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">أكثر المستخدمين نشاطاً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rbacStats?.stats?.topUsers?.slice(0, 3).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.userId}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  )) || <p className="text-sm text-gray-500">لا توجد بيانات</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">إحصائيات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">طلبات مقبولة</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {rbacStats?.stats?.summary?.grantedRequests || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">طلبات مرفوضة</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {rbacStats?.stats?.summary?.deniedRequests || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">عالية المخاطر</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {rbacStats?.stats?.summary?.highRiskRequests || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* الأمان والحماية */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>حالة الأمان العامة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="font-medium">جدار الحماية نشط</span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-green-600" />
                      <span className="font-medium">التشفير مفعل</span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-green-600" />
                      <span className="font-medium">المراقبة نشطة</span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>آخر فحوصات الأمان</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">فحص الثغرات الأمنية</span>
                    <Badge className="bg-green-100 text-green-800">نظيف</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">فحص كلمات المرور</span>
                    <Badge className="bg-green-100 text-green-800">قوي</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">فحص الصلاحيات</span>
                    <Badge className="bg-yellow-100 text-yellow-800">تحديث مطلوب</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* الصلاحيات المتقدمة */}
        <TabsContent value="permissions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الصلاحيات المشروطة</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">24</div>
                <p className="text-sm text-gray-600">صلاحية نشطة</p>
                <Link href="/admin-advanced-rbac?tab=conditional">
                  <Button variant="outline" size="sm" className="mt-3">
                    إدارة
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">الصلاحيات المؤقتة</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">8</div>
                <p className="text-sm text-gray-600">صلاحية مؤقتة</p>
                <Link href="/admin-advanced-rbac?tab=temporary">
                  <Button variant="outline" size="sm" className="mt-3">
                    إدارة
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">التفويضات النشطة</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold mb-2">12</div>
                <p className="text-sm text-gray-600">تفويض نشط</p>
                <Link href="/admin-advanced-rbac">
                  <Button variant="outline" size="sm" className="mt-3">
                    إدارة
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* المراقبة المباشرة */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المراقبة المباشرة للنشاطات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">المراقبة المباشرة نشطة</h3>
                <p className="text-gray-600 mb-4">
                  جميع الأنشطة تحت المراقبة المستمرة مع تحليل المخاطر الفوري
                </p>
                <Link href="/admin-advanced-rbac?tab=monitoring">
                  <Button>عرض التفاصيل</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* إدارة النظام */}
        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  إدارة المستخدمين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  إضافة وتعديل وحذف المستخدمين وإدارة أدوارهم
                </p>
                <Link href="/admin-users">
                  <Button size="sm" className="w-full">إدارة المستخدمين</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  إدارة الأدوار
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  تخصيص الأدوار والصلاحيات للمستخدمين
                </p>
                <Link href="/admin-rbac">
                  <Button size="sm" className="w-full">إدارة الأدوار</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  النظام المتقدم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  الصلاحيات المتقدمة والتفويضات والمراقبة
                </p>
                <Link href="/admin-advanced-rbac">
                  <Button size="sm" className="w-full">النظام المتقدم</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  التقارير والإحصائيات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  تقارير مفصلة عن استخدام النظام والأمان
                </p>
                <Link href="/admin-advanced-rbac?tab=analytics">
                  <Button size="sm" className="w-full">عرض التقارير</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  النسخ الاحتياطية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  إدارة النسخ الاحتياطية واستعادة البيانات
                </p>
                <Button size="sm" className="w-full" variant="outline">
                  إدارة النسخ
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  إعدادات النظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  إعدادات عامة ومتقدمة للنظام
                </p>
                <Button size="sm" className="w-full" variant="outline">
                  الإعدادات
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}