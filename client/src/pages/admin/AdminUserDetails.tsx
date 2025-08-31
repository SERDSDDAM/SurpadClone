import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Shield, 
  Clock, 
  Activity, 
  Edit3, 
  RotateCcw,
  UserCheck,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserDetails {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  status: string;
  phone?: string;
  department?: string;
  position?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  tableName?: string;
  timestamp: string;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
}

interface UserSession {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt: string;
  lastActivity: string;
  logoutAt?: string;
  active: boolean;
}

export default function AdminUserDetails() {
  const params = useParams();
  const userId = params.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user details
  const { data: user, isLoading } = useQuery<UserDetails>({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery<AuditLog[]>({
    queryKey: [`/api/admin/users/${userId}/audit-logs`],
    enabled: !!userId && activeTab === "activity",
  });

  // Fetch user sessions
  const { data: sessions = [] } = useQuery<UserSession[]>({
    queryKey: [`/api/admin/users/${userId}/sessions`],
    enabled: !!userId && activeTab === "sessions",
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('فشل في إعادة تعيين كلمة المرور');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إعادة التعيين",
        description: "تم إعادة تعيين كلمة المرور بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إعادة تعيين كلمة المرور",
        variant: "destructive",
      });
    },
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('فشل في تحديث حالة المستخدم');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة المستخدم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة المستخدم",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  if (!user) {
    return <div className="text-center text-red-600">المستخدم غير موجود</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      case 'suspended': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'suspended': return 'معلق';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">تفاصيل المستخدم</h1>
            <p className="text-muted-foreground">إدارة ومراقبة بيانات المستخدم</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => updateStatusMutation.mutate(user.status === 'active' ? 'inactive' : 'active')}
            disabled={updateStatusMutation.isPending}
            data-testid="toggle-status-button"
          >
            <UserCheck className="h-4 w-4 ml-2" />
            {user.status === 'active' ? 'إلغاء التفعيل' : 'تفعيل'}
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => resetPasswordMutation.mutate()}
            disabled={resetPasswordMutation.isPending}
            data-testid="reset-password-button"
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            إعادة تعيين كلمة المرور
          </Button>
        </div>
      </div>

      {/* User Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl" data-testid="user-name">{user.name}</CardTitle>
              <p className="text-muted-foreground" data-testid="user-username">@{user.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" data-testid="user-role">{user.role}</Badge>
                <Badge className={getStatusColor(user.status)} data-testid="user-status">
                  {getStatusText(user.status)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="activity">سجل الأنشطة</TabsTrigger>
          <TabsTrigger value="sessions">الجلسات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  المعلومات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>البريد الإلكتروني</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="user-email">{user.email}</span>
                    </div>
                  </div>
                  
                  {user.phone && (
                    <div>
                      <Label>رقم الهاتف</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span data-testid="user-phone">{user.phone}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.department && (
                    <div>
                      <Label>القسم</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span data-testid="user-department">{user.department}</span>
                      </div>
                    </div>
                  )}
                  
                  {user.position && (
                    <div>
                      <Label>المنصب</Label>
                      <span data-testid="user-position">{user.position}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  نشاط الحساب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>آخر تسجيل دخول</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="last-login">
                      {user.lastLogin 
                        ? formatDistanceToNow(new Date(user.lastLogin), { 
                            addSuffix: true, 
                            locale: ar 
                          })
                        : 'لم يسجل دخول من قبل'
                      }
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label>تاريخ الإنشاء</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="created-at">
                      {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ar })}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label>آخر تحديث</Label>
                  <span data-testid="updated-at">
                    {format(new Date(user.updatedAt), 'dd/MM/yyyy', { locale: ar })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>سجل الأنشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد أنشطة مسجلة
                  </p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`audit-log-${log.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {log.success ? (
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{log.action}</p>
                          {log.tableName && (
                            <p className="text-sm text-muted-foreground">
                              في جدول: {log.tableName}
                            </p>
                          )}
                          {log.errorMessage && (
                            <p className="text-sm text-red-600">{log.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </p>
                        {log.ipAddress && (
                          <p className="text-xs text-muted-foreground">{log.ipAddress}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>جلسات المستخدم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد جلسات مسجلة
                  </p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`session-${session.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${session.active ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <div>
                          <p className="font-medium">
                            {session.active ? 'جلسة نشطة' : 'جلسة منتهية'}
                          </p>
                          {session.ipAddress && (
                            <p className="text-sm text-muted-foreground">
                              IP: {session.ipAddress}
                            </p>
                          )}
                          {session.userAgent && (
                            <p className="text-xs text-muted-foreground">
                              {session.userAgent.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-muted-foreground">
                          دخول: {format(new Date(session.loginAt), 'dd/MM HH:mm', { locale: ar })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          آخر نشاط: {format(new Date(session.lastActivity), 'dd/MM HH:mm', { locale: ar })}
                        </p>
                        {session.logoutAt && (
                          <p className="text-sm text-muted-foreground">
                            خروج: {format(new Date(session.logoutAt), 'dd/MM HH:mm', { locale: ar })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                إعدادات المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" value={user.email} disabled />
                  </div>
                  
                  <div>
                    <Label htmlFor="role">الدور</Label>
                    <Input id="role" value={user.role} disabled />
                  </div>
                  
                  <div>
                    <Label htmlFor="department">القسم</Label>
                    <Input id="department" value={user.department || ''} disabled />
                  </div>
                  
                  <div>
                    <Label htmlFor="position">المنصب</Label>
                    <Input id="position" value={user.position || ''} disabled />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" data-testid="edit-user-button">
                    <Edit3 className="h-4 w-4 ml-2" />
                    تعديل المعلومات
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}