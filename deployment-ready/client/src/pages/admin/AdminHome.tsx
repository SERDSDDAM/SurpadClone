import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Layers, 
  FileCheck, 
  Activity,
  Plus,
  Upload,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Play
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';

interface AdminStats {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    change_percent: number;
  };
  layers: {
    total: number;
    processed: number;
    pending: number;
    change_percent: number;
  };
  decisions: {
    total: number;
    approved: number;
    pending: number;
    change_percent: number;
  };
  performance: {
    uptime: number;
    response_time: number;
    success_rate: number;
  };
  recent_activities: Array<{
    id: string;
    type: string;
    description: string;
    user: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
}

const quickActions = [
  {
    id: 'create-user',
    title: 'إنشاء مستخدم جديد',
    description: 'إضافة مستخدم جديد للنظام',
    icon: <Plus className="w-6 h-6" />,
    color: 'bg-blue-500',
    link: '/admin/users?action=create'
  },
  {
    id: 'upload-layer',
    title: 'رفع طبقة جديدة',
    description: 'رفع وإعداد طبقة GIS',
    icon: <Upload className="w-6 h-6" />,
    color: 'bg-green-500',
    link: '/admin/uploads'
  },
  {
    id: 'run-analysis',
    title: 'تشغيل تحليل',
    description: 'تشغيل مهمة تحليل جديدة',
    icon: <Play className="w-6 h-6" />,
    color: 'bg-purple-500',
    link: '/admin/analytics?action=run'
  },
  {
    id: 'system-settings',
    title: 'إعدادات النظام',
    description: 'تكوين إعدادات المنصة',
    icon: <Settings className="w-6 h-6" />,
    color: 'bg-orange-500',
    link: '/admin/settings'
  }
];

export default function AdminHome() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: () => apiRequest('/api/admin/stats'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created': return <Users className="w-4 h-4" />;
      case 'layer_uploaded': return <Layers className="w-4 h-4" />;
      case 'decision_approved': return <CheckCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">مرحباً بك في لوحة التحكم</h2>
        <p className="text-red-100">إدارة شاملة لمنصة بنّاء اليمن الرقمية</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.users.total || 0)}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>نشط: {formatNumber(stats?.users.active || 0)}</span>
              {stats?.users.change_percent !== undefined && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(stats.users.change_percent)}
                  <span>{Math.abs(stats.users.change_percent)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Layers Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطبقات</CardTitle>
            <Layers className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.layers.total || 0)}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>معالجة: {formatNumber(stats?.layers.processed || 0)}</span>
              {stats?.layers.change_percent !== undefined && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(stats.layers.change_percent)}
                  <span>{Math.abs(stats.layers.change_percent)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Decisions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">القرارات المساحية</CardTitle>
            <FileCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.decisions.total || 0)}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>معتمد: {formatNumber(stats?.decisions.approved || 0)}</span>
              {stats?.decisions.change_percent !== undefined && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(stats.decisions.change_percent)}
                  <span>{Math.abs(stats.decisions.change_percent)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أداء النظام</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.performance.uptime || 99.9}%</div>
            <div className="text-xs text-muted-foreground">
              <div>الاستجابة: {stats?.performance.response_time || 120}ms</div>
              <div>معدل النجاح: {stats?.performance.success_rate || 99.5}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>الإجراءات السريعة</CardTitle>
          <CardDescription>العمليات الأكثر استخداماً في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.id} to={action.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{action.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>النشاطات الأخيرة</CardTitle>
            <CardDescription>آخر العمليات في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_activities?.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-gray-100">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {activity.user}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString('ar-SA')}
                      </span>
                      <Badge 
                        variant={getActivityBadgeVariant(activity.status)}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-4">
                  لا توجد نشاطات حالياً
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link to="/admin/activity">
                <Button variant="outline" size="sm" className="w-full">
                  عرض جميع النشاطات
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>حالة النظام</CardTitle>
            <CardDescription>مراقبة أداء الخدمات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">خادم التطبيقات</span>
                  <Badge variant="default">
                    <CheckCircle className="w-3 h-3 ml-1" />
                    يعمل
                  </Badge>
                </div>
                <Progress value={95} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">قاعدة البيانات</span>
                  <Badge variant="default">
                    <CheckCircle className="w-3 h-3 ml-1" />
                    يعمل
                  </Badge>
                </div>
                <Progress value={88} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">خدمة المعالجة</span>
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 ml-1" />
                    انتظار
                  </Badge>
                </div>
                <Progress value={65} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">التخزين السحابي</span>
                  <Badge variant="default">
                    <CheckCircle className="w-3 h-3 ml-1" />
                    يعمل
                  </Badge>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Link to="/admin/settings?tab=system">
                <Button variant="outline" size="sm" className="w-full">
                  إعدادات النظام
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}