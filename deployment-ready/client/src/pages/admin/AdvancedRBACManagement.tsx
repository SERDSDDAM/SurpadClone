import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  TrendingUp,
  Users,
  Lock,
  Unlock,
  Calendar,
  Globe,
  Activity,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConditionalPermission {
  id: string;
  userId: string;
  permissionCode: string;
  timeStart?: string;
  timeEnd?: string;
  validDays?: string[];
  allowedDistricts?: string[];
  allowedOffices?: string[];
  dataScope: string;
  maxAmount?: number;
  maxTransactionsPerDay?: number;
  requiresApprovalFrom?: string[];
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string;
  riskScore: number;
  expiresAt?: string;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

interface TemporaryPermission {
  id: string;
  userId: string;
  permissionCode: string;
  validFrom: string;
  validUntil: string;
  grantedBy: string;
  reason: string;
  isEmergency: boolean;
  emergencyLevel?: number;
  maxUsage?: number;
  currentUsage: number;
  isActive: boolean;
  isRevoked: boolean;
  createdAt: string;
}

interface SmartAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  triggeredBy?: any;
}

interface PermissionStats {
  period: { fromDate: string; toDate: string };
  summary: {
    totalRequests: number;
    grantedRequests: number;
    deniedRequests: number;
    highRiskRequests: number;
    successRate: string;
  };
  topPermissions: { permission: string; count: number }[];
  topUsers: { userId: string; count: number }[];
}

export default function AdvancedRBACManagement() {
  const [activeTab, setActiveTab] = useState('conditional');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب الصلاحيات المشروطة
  const { data: conditionalPermissions, isLoading: loadingConditional } = useQuery({
    queryKey: ['/api/advanced-rbac/conditional-permissions'],
    retry: false,
  });

  // جلب الصلاحيات المؤقتة
  const { data: temporaryPermissions, isLoading: loadingTemporary } = useQuery({
    queryKey: ['/api/advanced-rbac/temporary-permissions'],
    retry: false,
  });

  // جلب التنبيهات الذكية
  const { data: smartAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['/api/advanced-rbac/smart-alerts'],
    retry: false,
  });

  // جلب إحصائيات الصلاحيات
  const { data: permissionStats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/advanced-rbac/reports/permission-stats'],
    retry: false,
  });

  // إنشاء صلاحية مشروطة
  const createConditionalPermissionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/advanced-rbac/conditional-permissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-rbac/conditional-permissions'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'نجح الإنشاء',
        description: 'تم إنشاء الصلاحية المشروطة بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الإنشاء',
        description: error.message || 'حدث خطأ أثناء إنشاء الصلاحية المشروطة',
        variant: 'destructive',
      });
    },
  });

  // إنشاء صلاحية مؤقتة
  const createTemporaryPermissionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/advanced-rbac/temporary-permissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-rbac/temporary-permissions'] });
      toast({
        title: 'نجح الإنشاء',
        description: 'تم إنشاء الصلاحية المؤقتة بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الإنشاء',
        description: error.message || 'حدث خطأ أثناء إنشاء الصلاحية المؤقتة',
        variant: 'destructive',
      });
    },
  });

  // إلغاء صلاحية مؤقتة
  const revokeTemporaryPermissionMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest(`/api/advanced-rbac/temporary-permissions/${id}/revoke`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-rbac/temporary-permissions'] });
      toast({
        title: 'تم الإلغاء',
        description: 'تم إلغاء الصلاحية المؤقتة بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الإلغاء',
        description: error.message || 'حدث خطأ أثناء إلغاء الصلاحية المؤقتة',
        variant: 'destructive',
      });
    },
  });

  // تأكيد التنبيه
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/advanced-rbac/smart-alerts/${id}/acknowledge`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advanced-rbac/smart-alerts'] });
      toast({
        title: 'تم التأكيد',
        description: 'تم تأكيد التنبيه بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في التأكيد',
        description: error.message || 'حدث خطأ أثناء تأكيد التنبيه',
        variant: 'destructive',
      });
    },
  });

  const filteredConditionalPermissions = conditionalPermissions?.conditionalPermissions?.filter((perm: ConditionalPermission) =>
    perm.permissionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perm.userId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredTemporaryPermissions = temporaryPermissions?.temporaryPermissions?.filter((perm: TemporaryPermission) =>
    perm.permissionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perm.userId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredAlerts = smartAlerts?.smartAlerts?.filter((alert: SmartAlert) =>
    (selectedSeverity === 'all' || alert.severity === selectedSeverity) &&
    (searchTerm === '' || alert.title.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 8) return 'bg-red-100 text-red-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    if (score >= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة النظام المتقدم للصلاحيات والأدوار</h1>
          <p className="text-gray-600 mt-2">
            نظام ذكي متقدم لإدارة الصلاحيات المشروطة والمؤقتة والمراقبة الأمنية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            نظام محمي متقدم
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            مراقبة مباشرة
          </Badge>
        </div>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="البحث في الصلاحيات والمستخدمين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Button
          onClick={() => {
            queryClient.invalidateQueries();
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث البيانات
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="conditional">
            الصلاحيات المشروطة ({filteredConditionalPermissions.length})
          </TabsTrigger>
          <TabsTrigger value="temporary">
            الصلاحيات المؤقتة ({filteredTemporaryPermissions.length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            التنبيهات الذكية ({filteredAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            المراقبة المباشرة
          </TabsTrigger>
          <TabsTrigger value="analytics">
            التحليلات والإحصائيات
          </TabsTrigger>
        </TabsList>

        {/* الصلاحيات المشروطة */}
        <TabsContent value="conditional">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  الصلاحيات المشروطة
                </CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة صلاحية مشروطة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>إنشاء صلاحية مشروطة جديدة</DialogTitle>
                      <DialogDescription>
                        إضافة صلاحية بشروط محددة للوقت والمكان والحدود المالية
                      </DialogDescription>
                    </DialogHeader>
                    <ConditionalPermissionForm 
                      onSubmit={(data) => createConditionalPermissionMutation.mutate(data)}
                      isLoading={createConditionalPermissionMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingConditional ? (
                <div className="text-center py-8">جاري تحميل الصلاحيات المشروطة...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الصلاحية</TableHead>
                      <TableHead>الشروط</TableHead>
                      <TableHead>الاستخدام</TableHead>
                      <TableHead>المخاطر</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConditionalPermissions.map((permission: ConditionalPermission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">{permission.userId}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {permission.permissionCode}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {permission.timeStart && permission.timeEnd && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 ml-1" />
                                {permission.timeStart}-{permission.timeEnd}
                              </Badge>
                            )}
                            {permission.allowedDistricts && permission.allowedDistricts.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="w-3 h-3 ml-1" />
                                {permission.allowedDistricts.length} منطقة
                              </Badge>
                            )}
                            {permission.maxAmount && (
                              <Badge variant="outline" className="text-xs">
                                {permission.maxAmount} ريال
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>استخدم {permission.usageCount} مرة</div>
                            {permission.lastUsedAt && (
                              <div className="text-xs text-gray-500">
                                آخر استخدام: {new Date(permission.lastUsedAt).toLocaleDateString('ar-YE')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRiskScoreColor(permission.riskScore)}>
                            {permission.riskScore}/10
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {permission.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الصلاحيات المؤقتة */}
        <TabsContent value="temporary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                الصلاحيات المؤقتة والطوارئ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTemporary ? (
                <div className="text-center py-8">جاري تحميل الصلاحيات المؤقتة...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الصلاحية</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الفترة</TableHead>
                      <TableHead>الاستخدام</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemporaryPermissions.map((permission: TemporaryPermission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">{permission.userId}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {permission.permissionCode}
                          </code>
                        </TableCell>
                        <TableCell>
                          {permission.isEmergency ? (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 ml-1" />
                              طوارئ (مستوى {permission.emergencyLevel})
                            </Badge>
                          ) : (
                            <Badge variant="outline">مؤقتة</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>من: {new Date(permission.validFrom).toLocaleDateString('ar-YE')}</div>
                            <div>إلى: {new Date(permission.validUntil).toLocaleDateString('ar-YE')}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{permission.currentUsage}/{permission.maxUsage || '∞'}</div>
                            <div className="text-xs text-gray-500">استخدام</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {permission.isRevoked ? (
                              <XCircle className="w-4 h-4 text-red-600" />
                            ) : permission.isActive ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-600" />
                            )}
                            {permission.isRevoked && <span className="text-xs text-red-600">ملغية</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!permission.isRevoked && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => {
                                  const reason = prompt('سبب الإلغاء:');
                                  if (reason) {
                                    revokeTemporaryPermissionMutation.mutate({
                                      id: permission.id,
                                      reason
                                    });
                                  }
                                }}
                              >
                                <Lock className="w-3 h-3" />
                                إلغاء
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* التنبيهات الذكية */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  التنبيهات الذكية والأمنية
                </CardTitle>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="critical">حرج</SelectItem>
                    <SelectItem value="warning">تحذير</SelectItem>
                    <SelectItem value="info">معلومات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAlerts ? (
                <div className="text-center py-8">جاري تحميل التنبيهات...</div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert: SmartAlert) => (
                    <Card key={alert.id} className="border-r-4 border-r-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getSeverityIcon(alert.severity)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{alert.title}</h4>
                                <Badge className={getSeverityColor(alert.severity)}>
                                  {alert.severity === 'critical' ? 'حرج' :
                                   alert.severity === 'warning' ? 'تحذير' : 'معلومات'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {alert.type === 'security' ? 'أمني' :
                                   alert.type === 'workflow' ? 'سير عمل' : 'امتثال'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                              <div className="text-xs text-gray-500">
                                {new Date(alert.createdAt).toLocaleString('ar-YE')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {alert.status === 'active' ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                              >
                                <CheckCircle className="w-3 h-3 ml-1" />
                                تأكيد
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {alert.status === 'acknowledged' ? 'مؤكد' : 'محلول'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* المراقبة المباشرة */}
        <TabsContent value="monitoring">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">الطلبات النشطة</div>
                    <div className="text-2xl font-bold">
                      {permissionStats?.stats?.summary?.totalRequests || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">معدل النجاح</div>
                    <div className="text-2xl font-bold">
                      {permissionStats?.stats?.summary?.successRate || '0'}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <div>
                    <div className="text-sm font-medium">مخاطر عالية</div>
                    <div className="text-2xl font-bold">
                      {permissionStats?.stats?.summary?.highRiskRequests || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium">طلبات مرفوضة</div>
                    <div className="text-2xl font-bold">
                      {permissionStats?.stats?.summary?.deniedRequests || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>المراقبة المباشرة للأنشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  نظام المراقبة المباشرة يعمل على مدار الساعة لرصد جميع الأنشطة المشبوهة وتحليل المخاطر
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التحليلات والإحصائيات */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  التحليلات والإحصائيات المتقدمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="text-center py-8">جاري تحميل الإحصائيات...</div>
                ) : (
                  <div className="space-y-6">
                    {/* أكثر الصلاحيات استخداماً */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">أكثر الصلاحيات استخداماً</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {permissionStats?.stats?.topPermissions?.map((item: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                  {item.permission}
                                </code>
                                <Badge variant="outline">{item.count} مرة</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* أكثر المستخدمين نشاطاً */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">أكثر المستخدمين نشاطاً</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {permissionStats?.stats?.topUsers?.map((item: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span className="font-medium">{item.userId}</span>
                                </div>
                                <Badge variant="outline">{item.count} نشاط</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// نموذج إنشاء صلاحية مشروطة
function ConditionalPermissionForm({ 
  onSubmit, 
  isLoading 
}: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    userId: '',
    permissionCode: '',
    timeStart: '',
    timeEnd: '',
    validDays: [] as string[],
    allowedDistricts: [] as string[],
    dataScope: 'personal',
    maxAmount: '',
    maxTransactionsPerDay: '',
    requiresApprovalFrom: [] as string[],
    reason: '',
    expiresAt: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : undefined,
      maxTransactionsPerDay: formData.maxTransactionsPerDay ? parseInt(formData.maxTransactionsPerDay) : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      validDays: formData.validDays.length > 0 ? formData.validDays : undefined,
      allowedDistricts: formData.allowedDistricts.length > 0 ? formData.allowedDistricts : undefined,
      requiresApprovalFrom: formData.requiresApprovalFrom.length > 0 ? formData.requiresApprovalFrom : undefined
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="userId">معرف المستخدم</Label>
          <Input
            id="userId"
            value={formData.userId}
            onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="permissionCode">كود الصلاحية</Label>
          <Input
            id="permissionCode"
            value={formData.permissionCode}
            onChange={(e) => setFormData(prev => ({ ...prev, permissionCode: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="timeStart">وقت البداية</Label>
          <Input
            id="timeStart"
            type="time"
            value={formData.timeStart}
            onChange={(e) => setFormData(prev => ({ ...prev, timeStart: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="timeEnd">وقت النهاية</Label>
          <Input
            id="timeEnd"
            type="time"
            value={formData.timeEnd}
            onChange={(e) => setFormData(prev => ({ ...prev, timeEnd: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="dataScope">نطاق البيانات</Label>
        <Select value={formData.dataScope} onValueChange={(value) => setFormData(prev => ({ ...prev, dataScope: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">شخصي</SelectItem>
            <SelectItem value="departmental">إداري</SelectItem>
            <SelectItem value="district">مديرية</SelectItem>
            <SelectItem value="organizational">تنظيمي</SelectItem>
            <SelectItem value="global">عام</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxAmount">الحد الأقصى للمبلغ (ريال)</Label>
          <Input
            id="maxAmount"
            type="number"
            value={formData.maxAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, maxAmount: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="maxTransactionsPerDay">أقصى معاملات يومية</Label>
          <Input
            id="maxTransactionsPerDay"
            type="number"
            value={formData.maxTransactionsPerDay}
            onChange={(e) => setFormData(prev => ({ ...prev, maxTransactionsPerDay: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="expiresAt">تاريخ الانتهاء</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={formData.expiresAt}
          onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="reason">السبب والمبرر</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="اذكر سبب إنشاء هذه الصلاحية المشروطة..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'جاري الإنشاء...' : 'إنشاء الصلاحية'}
        </Button>
      </div>
    </form>
  );
}