import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Send, 
  Settings, 
  Users, 
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Plus,
  Calendar,
  Zap,
  Shield,
  MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface NotificationTemplate {
  id: string;
  name: string;
  type: "email" | "sms" | "system";
  subject?: string;
  content: string;
  category: "inspection" | "occupancy" | "permit" | "violation" | "general";
  isActive: boolean;
}

interface NotificationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: any[];
  actions: any[];
  isActive: boolean;
  priority: "low" | "medium" | "high" | "urgent";
}

interface NotificationHistory {
  id: string;
  type: "email" | "sms" | "system";
  recipient: string;
  subject?: string;
  content: string;
  status: "sent" | "delivered" | "failed" | "pending";
  sentAt: string;
  relatedEntity: {
    type: string;
    id: string;
    name: string;
  };
}

export default function NotificationsSystem() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demonstration
  const notificationTemplates: NotificationTemplate[] = [
    {
      id: "template-001",
      name: "إشعار بدء التفتيش",
      type: "email",
      subject: "إشعار بدء عملية التفتيش - {projectName}",
      content: "تم تحديد موعد تفتيش مشروعكم {projectName} في تاريخ {inspectionDate}. يرجى التواجد في الموقع في الوقت المحدد.",
      category: "inspection",
      isActive: true,
    },
    {
      id: "template-002",
      name: "إشعار إصدار شهادة الإشغال",
      type: "sms",
      content: "تم إصدار شهادة الإشغال رقم {certificateNumber} لمشروع {projectName}. يمكنكم استلامها من الأمانة.",
      category: "occupancy",
      isActive: true,
    },
    {
      id: "template-003",
      name: "تنبيه مخالفة جديدة",
      type: "email",
      subject: "تنبيه: مخالفة جديدة - {violationType}",
      content: "تم رصد مخالفة جديدة في مشروع {projectName}. نوع المخالفة: {violationType}. الرجاء اتخاذ الإجراءات اللازمة.",
      category: "violation",
      isActive: true,
    },
  ];

  const notificationRules: NotificationRule[] = [
    {
      id: "rule-001",
      name: "إشعار تلقائي عند اكتمال التفتيش",
      trigger: "inspection_completed",
      conditions: [
        { field: "inspectionStatus", operator: "equals", value: "completed" }
      ],
      actions: [
        { type: "send_email", template: "template-001", recipients: ["owner", "contractor"] },
        { type: "send_sms", template: "template-002", recipients: ["owner"] }
      ],
      isActive: true,
      priority: "high",
    },
    {
      id: "rule-002",
      name: "تنبيه المرافق عند إصدار شهادة الإشغال",
      trigger: "occupancy_certificate_issued",
      conditions: [
        { field: "certificateStatus", operator: "equals", value: "issued" }
      ],
      actions: [
        { type: "notify_utilities", recipients: ["electricity", "water", "internet"] }
      ],
      isActive: true,
      priority: "medium",
    },
  ];

  const notificationHistory: NotificationHistory[] = [
    {
      id: "notif-001",
      type: "email",
      recipient: "ahmed.alzubiri@example.com",
      subject: "إشعار بدء عملية التفتيش - منزل سكني",
      content: "تم تحديد موعد تفتيش مشروعكم منزل سكني في تاريخ 2025-01-22.",
      status: "delivered",
      sentAt: "2025-01-20T10:30:00Z",
      relatedEntity: {
        type: "inspection",
        id: "report-001",
        name: "منزل سكني - عائلة الزبيري"
      }
    },
    {
      id: "notif-002",
      type: "sms",
      recipient: "+967 777 123 456",
      content: "تم إصدار شهادة الإشغال رقم OC-2025-0001 لمشروع منزل سكني.",
      status: "sent",
      sentAt: "2025-01-22T14:15:00Z",
      relatedEntity: {
        type: "occupancy_certificate",
        id: "cert-001",
        name: "شهادة إشغال - منزل سكني"
      }
    },
  ];

  // Statistics
  const stats = {
    totalSent: notificationHistory.length,
    delivered: notificationHistory.filter(n => n.status === "delivered").length,
    pending: notificationHistory.filter(n => n.status === "pending").length,
    failed: notificationHistory.filter(n => n.status === "failed").length,
    activeRules: notificationRules.filter(r => r.isActive).length,
    activeTemplates: notificationTemplates.filter(t => t.isActive).length,
  };

  // Send manual notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/notifications/send", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الإشعار",
        description: "تم إرسال الإشعار بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الإشعار",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered": return <Badge className="bg-green-100 text-green-800">تم التسليم</Badge>;
      case "sent": return <Badge className="bg-blue-100 text-blue-800">تم الإرسال</Badge>;
      case "pending": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">في الانتظار</Badge>;
      case "failed": return <Badge variant="destructive">فشل</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "email": return <Badge variant="outline" className="bg-blue-50 text-blue-700">بريد إلكتروني</Badge>;
      case "sms": return <Badge variant="outline" className="bg-green-50 text-green-700">رسالة نصية</Badge>;
      case "system": return <Badge variant="outline" className="bg-purple-50 text-purple-700">نظام</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent": return <Badge variant="destructive">عاجل</Badge>;
      case "high": return <Badge className="bg-orange-100 text-orange-800">عالي</Badge>;
      case "medium": return <Badge variant="secondary">متوسط</Badge>;
      case "low": return <Badge variant="outline">منخفض</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const filteredHistory = notificationHistory.filter(notification => {
    const matchesStatus = filterStatus === "all" || notification.status === filterStatus;
    const matchesType = filterType === "all" || notification.type === filterType;
    return matchesStatus && matchesType;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="ml-2 h-8 w-8 text-primary" />
            نظام الإشعارات والتنبيهات
          </h1>
          <p className="text-gray-600 mt-1">إدارة الإشعارات التلقائية والتنبيهات للتفتيش وشهادات الإشغال</p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90" data-testid="button-send-notification">
          <Send className="ml-2 h-4 w-4" />
          إرسال إشعار جديد
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الإشعارات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تم التسليم</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">في الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">فشل</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">القواعد النشطة</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeRules}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">القوالب النشطة</p>
                <p className="text-2xl font-bold text-purple-600">{stats.activeTemplates}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="templates">قوالب الإشعارات</TabsTrigger>
          <TabsTrigger value="rules">قواعد التشغيل</TabsTrigger>
          <TabsTrigger value="history">سجل الإشعارات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="ml-2 h-5 w-5" />
                النشاط الأخير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationHistory.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      {notification.type === "email" ? (
                        <Mail className="h-5 w-5 text-blue-600" />
                      ) : notification.type === "sms" ? (
                        <Smartphone className="h-5 w-5 text-green-600" />
                      ) : (
                        <Bell className="h-5 w-5 text-purple-600" />
                      )}
                      
                      <div>
                        <p className="font-medium text-gray-900">
                          {notification.subject || notification.content.substring(0, 50) + "..."}
                        </p>
                        <p className="text-sm text-gray-600">
                          إلى: {notification.recipient} • {new Date(notification.sentAt).toLocaleDateString('ar-YE')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusBadge(notification.status)}
                      {getTypeBadge(notification.type)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="ml-2 h-5 w-5" />
                  حالة النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">خدمة البريد الإلكتروني</span>
                  <Badge className="bg-green-100 text-green-800">نشط</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">خدمة الرسائل النصية</span>
                  <Badge className="bg-green-100 text-green-800">نشط</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">إشعارات المرافق</span>
                  <Badge className="bg-green-100 text-green-800">نشط</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">إشعارات الجهات الحكومية</span>
                  <Badge className="bg-yellow-100 text-yellow-800">صيانة</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="ml-2 h-5 w-5" />
                  إحصائيات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">معدل التسليم</span>
                  <span className="font-semibold text-green-600">98.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">متوسط وقت التسليم</span>
                  <span className="font-semibold">2.3 ثانية</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">إجمالي الإشعارات اليوم</span>
                  <span className="font-semibold">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">إشعارات تلقائية</span>
                  <span className="font-semibold text-blue-600">85%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">قوالب الإشعارات</h3>
            <Button onClick={() => setIsCreateTemplateOpen(true)} data-testid="button-create-template">
              <Plus className="ml-2 h-4 w-4" />
              قالب جديد
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {notificationTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{template.category}</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getTypeBadge(template.type)}
                      <Switch checked={template.isActive} />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {template.subject && (
                    <div>
                      <Label className="text-xs text-gray-500">الموضوع:</Label>
                      <p className="text-sm font-medium">{template.subject}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-xs text-gray-500">المحتوى:</Label>
                    <p className="text-sm text-gray-700 line-clamp-2">{template.content}</p>
                  </div>

                  <div className="flex justify-end space-x-2 space-x-reverse pt-2 border-t">
                    <Button variant="outline" size="sm" data-testid={`button-edit-template-${template.id}`}>
                      تعديل
                    </Button>
                    <Button size="sm" data-testid={`button-test-template-${template.id}`}>
                      اختبار
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">قواعد التشغيل التلقائي</h3>
            <Button data-testid="button-create-rule">
              <Plus className="ml-2 h-4 w-4" />
              قاعدة جديدة
            </Button>
          </div>

          <div className="space-y-4">
            {notificationRules.map((rule) => (
              <Card key={rule.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">مشغل: {rule.trigger}</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getPriorityBadge(rule.priority)}
                      <Switch checked={rule.isActive} />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">الشروط:</Label>
                      <div className="text-sm">
                        {rule.conditions.map((condition, index) => (
                          <p key={index} className="text-gray-700">
                            {condition.field} {condition.operator} {condition.value}
                          </p>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500">الإجراءات:</Label>
                      <div className="text-sm">
                        {rule.actions.map((action, index) => (
                          <p key={index} className="text-gray-700">
                            {action.type} - {action.recipients?.join(', ')}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 space-x-reverse pt-2 border-t">
                    <Button variant="outline" size="sm" data-testid={`button-edit-rule-${rule.id}`}>
                      تعديل
                    </Button>
                    <Button size="sm" data-testid={`button-test-rule-${rule.id}`}>
                      اختبار
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="تصفية بالحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                    <SelectItem value="sent">تم الإرسال</SelectItem>
                    <SelectItem value="pending">في الانتظار</SelectItem>
                    <SelectItem value="failed">فشل</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-48" data-testid="select-type-filter">
                    <SelectValue placeholder="تصفية بالنوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="email">بريد إلكتروني</SelectItem>
                    <SelectItem value="sms">رسالة نصية</SelectItem>
                    <SelectItem value="system">نظام</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications History */}
          <div className="space-y-4">
            {filteredHistory.map((notification) => (
              <Card key={notification.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="flex-shrink-0">
                        {notification.type === "email" ? (
                          <Mail className="h-6 w-6 text-blue-600" />
                        ) : notification.type === "sms" ? (
                          <Smartphone className="h-6 w-6 text-green-600" />
                        ) : (
                          <Bell className="h-6 w-6 text-purple-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <h4 className="font-medium text-gray-900">
                            {notification.subject || notification.content.substring(0, 60) + "..."}
                          </h4>
                          {getStatusBadge(notification.status)}
                          {getTypeBadge(notification.type)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 ml-1" />
                            {notification.recipient}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 ml-1" />
                            {new Date(notification.sentAt).toLocaleDateString('ar-YE')}
                          </div>
                          <div className="flex items-center">
                            <Building2 className="h-3 w-3 ml-1" />
                            {notification.relatedEntity.name}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" data-testid={`button-view-notification-${notification.id}`}>
                      <Eye className="ml-1 h-3 w-3" />
                      التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد إشعارات</h3>
                <p className="text-gray-600">لم يتم العثور على إشعارات مطابقة لمعايير البحث</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}