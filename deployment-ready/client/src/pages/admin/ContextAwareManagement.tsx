/**
 * صفحة إدارة الذكاء السياقي التلقائي - المرحلة 1
 * واجهة لإدارة المشغلات السياقية والأحداث
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Power, Clock, MapPin, AlertTriangle, DollarSign, Settings, Eye, BarChart3 } from 'lucide-react';

interface ContextualTrigger {
  id: string;
  name: string;
  description?: string;
  triggerType: 'project' | 'location' | 'time' | 'emergency' | 'amount';
  affectedPermissions: string[];
  isActive: boolean;
  priority: number;
  triggerCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
  notes?: string;
}

interface UserContextState {
  id: string;
  userId: string;
  currentProject?: string;
  currentLocation?: any;
  emergencyStatus?: any;
  activePermissions: string[];
  contextualPermissions: string[];
  sessionStats?: any;
  updatedAt: string;
}

interface ContextualEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: any;
  success: boolean;
  severity: string;
  category: string;
  createdAt: string;
}

export function ContextAwareManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<ContextualTrigger | null>(null);
  const [activeTab, setActiveTab] = useState('triggers');

  // جلب المشغلات السياقية
  const { data: triggersData, isLoading: triggersLoading } = useQuery({
    queryKey: ['/api/context-aware/triggers', selectedUserId],
    enabled: !!selectedUserId
  });

  // جلب حالة السياق
  const { data: contextState, isLoading: contextLoading } = useQuery({
    queryKey: ['/api/context-aware/context-state', selectedUserId],
    enabled: !!selectedUserId
  });

  // جلب الأحداث السياقية
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/context-aware/events', selectedUserId],
    enabled: !!selectedUserId
  });

  // إنشاء مشغل جديد
  const createTriggerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/context-aware/triggers', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/context-aware/triggers'] });
      setShowCreateDialog(false);
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء المشغل السياقي بنجاح'
      });
    }
  });

  // تحديث مشغل
  const updateTriggerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await apiRequest(`/api/context-aware/triggers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/context-aware/triggers'] });
      setEditingTrigger(null);
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث المشغل السياقي بنجاح'
      });
    }
  });

  // تفعيل/إلغاء تفعيل مشغل
  const toggleTriggerMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      return await apiRequest(`/api/context-aware/triggers/${id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/context-aware/triggers'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم تغيير حالة المشغل بنجاح'
      });
    }
  });

  // حذف مشغل
  const deleteTriggerMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/context-aware/triggers/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/context-aware/triggers'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف المشغل السياقي بنجاح'
      });
    }
  });

  // تنظيف الصلاحيات المنتهية الصلاحية
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/context-aware/cleanup-expired', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/context-aware'] });
      toast({
        title: 'تم بنجاح',
        description: 'تم تنظيف الصلاحيات المنتهية الصلاحية'
      });
    }
  });

  useEffect(() => {
    if (user?.id) {
      setSelectedUserId(user.id);
    }
  }, [user]);

  const getTriggerTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <Settings className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'time': return <Clock className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      case 'amount': return <DollarSign className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'project': return 'مشروع';
      case 'location': return 'موقع';
      case 'time': return 'وقت';
      case 'emergency': return 'طوارئ';
      case 'amount': return 'مبلغ';
      default: return type;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      'info': 'default',
      'warning': 'secondary',
      'error': 'destructive',
      'critical': 'destructive'
    } as const;
    
    return <Badge variant={variants[severity as keyof typeof variants] || 'default'}>{severity}</Badge>;
  };

  const triggers = triggersData?.data || [];
  const events = eventsData?.data || [];

  return (
    <div className="container mx-auto p-6 max-w-7xl" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              الذكاء السياقي التلقائي
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              إدارة المشغلات السياقية وتفعيل الصلاحيات التلقائي
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => cleanupMutation.mutate()}
              variant="outline"
              disabled={cleanupMutation.isPending}
              data-testid="button-cleanup-permissions"
            >
              تنظيف الصلاحيات المنتهية الصلاحية
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              data-testid="button-create-trigger"
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء مشغل جديد
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="triggers">المشغلات السياقية</TabsTrigger>
          <TabsTrigger value="context">حالة السياق</TabsTrigger>
          <TabsTrigger value="events">سجل الأحداث</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="triggers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                المشغلات السياقية النشطة
              </CardTitle>
              <CardDescription>
                إدارة المشغلات التي تتحكم في تفعيل الصلاحيات تلقائياً
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {triggersLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : !triggers || triggers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد مشغلات سياقية
                  </div>
                ) : (
                  triggers.map((trigger: ContextualTrigger) => (
                    <div
                      key={trigger.id}
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`trigger-card-${trigger.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTriggerTypeIcon(trigger.triggerType)}
                          <div>
                            <h3 className="font-semibold">{trigger.name}</h3>
                            <p className="text-sm text-gray-600">
                              {trigger.description || 'لا يوجد وصف'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getTriggerTypeLabel(trigger.triggerType)}
                          </Badge>
                          <Switch
                            checked={trigger.isActive}
                            onCheckedChange={(checked) =>
                              toggleTriggerMutation.mutate({
                                id: trigger.id,
                                isActive: checked
                              })
                            }
                            data-testid={`switch-trigger-${trigger.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTrigger(trigger)}
                            data-testid={`button-edit-trigger-${trigger.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا المشغل؟')) {
                                deleteTriggerMutation.mutate(trigger.id);
                              }
                            }}
                            data-testid={`button-delete-trigger-${trigger.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">الأولوية:</span>
                          <span className="mr-2">{trigger.priority}/10</span>
                        </div>
                        <div>
                          <span className="font-medium">عدد التفعيلات:</span>
                          <span className="mr-2">{trigger.triggerCount}</span>
                        </div>
                        <div>
                          <span className="font-medium">الصلاحيات المتأثرة:</span>
                          <span className="mr-2">{trigger.affectedPermissions.length}</span>
                        </div>
                        <div>
                          <span className="font-medium">آخر تفعيل:</span>
                          <span className="mr-2">
                            {trigger.lastTriggeredAt
                              ? new Date(trigger.lastTriggeredAt).toLocaleDateString('ar-SA')
                              : 'لم يتم التفعيل بعد'}
                          </span>
                        </div>
                      </div>

                      {trigger.affectedPermissions.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">الصلاحيات المتأثرة:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {trigger.affectedPermissions.map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                حالة السياق الحالية
              </CardTitle>
              <CardDescription>
                عرض السياق الحالي للمستخدم والصلاحيات النشطة
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contextLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : !contextState || !contextState.data ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد بيانات سياق
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold">معلومات المشروع</h3>
                      <p className="text-sm text-gray-600">
                        المشروع الحالي: {contextState?.data?.currentProject || 'غير محدد'}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold">الموقع الجغرافي</h3>
                      <p className="text-sm text-gray-600">
                        {contextState?.data?.currentLocation
                          ? `الموقع: ${contextState.data.currentLocation.district || 'غير محدد'}`
                          : 'الموقع: غير محدد'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">الصلاحيات النشطة</h3>
                    <div className="flex flex-wrap gap-2">
                      {contextState?.data?.activePermissions?.map((permission: string) => (
                        <Badge key={permission} variant="default">
                          {permission}
                        </Badge>
                      )) || <span className="text-gray-500">لا توجد صلاحيات نشطة</span>}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">الصلاحيات السياقية</h3>
                    <div className="flex flex-wrap gap-2">
                      {contextState?.data?.contextualPermissions?.map((permission: string) => (
                        <Badge key={permission} variant="secondary">
                          {permission}
                        </Badge>
                      )) || <span className="text-gray-500">لا توجد صلاحيات سياقية</span>}
                    </div>
                  </div>

                  {contextState?.data?.emergencyStatus?.isActive && (
                    <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-red-800">وضع الطوارئ نشط</h3>
                      </div>
                      <p className="text-red-700 mt-2">
                        المستوى: {contextState?.data?.emergencyStatus?.level}/5
                        <br />
                        النوع: {contextState?.data?.emergencyStatus?.type}
                        <br />
                        السبب: {contextState?.data?.emergencyStatus?.reason}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                سجل الأحداث السياقية
              </CardTitle>
              <CardDescription>
                عرض آخر الأحداث والإجراءات المتخذة تلقائياً
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : !events || events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد أحداث سياقية
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event: ContextualEvent) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4"
                      data-testid={`event-${event.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{event.eventType}</span>
                          {getSeverityBadge(event.severity)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(event.createdAt).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">النجاح:</span>
                          <span className={`mr-2 ${event.success ? 'text-green-600' : 'text-red-600'}`}>
                            {event.success ? 'نعم' : 'لا'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">الفئة:</span>
                          <span className="mr-2">{event.category}</span>
                        </div>
                        <div>
                          <span className="font-medium">المستخدم:</span>
                          <span className="mr-2">{event.userId}</span>
                        </div>
                      </div>

                      {event.eventData && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium">
                            عرض التفاصيل
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
                            {JSON.stringify(event.eventData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>التحليلات والإحصائيات</CardTitle>
              <CardDescription>
                إحصائيات الأداء والاستخدام للذكاء السياقي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="text-2xl font-bold text-blue-600">
                    {triggers.filter((t: ContextualTrigger) => t.isActive).length}
                  </h3>
                  <p className="text-sm text-gray-600">مشغلات نشطة</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="text-2xl font-bold text-green-600">
                    {triggers.reduce((sum: number, t: ContextualTrigger) => sum + t.triggerCount, 0)}
                  </h3>
                  <p className="text-sm text-gray-600">إجمالي التفعيلات</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="text-2xl font-bold text-orange-600">
                    {events.filter((e: ContextualEvent) => e.success).length}
                  </h3>
                  <p className="text-sm text-gray-600">أحداث ناجحة</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="text-2xl font-bold text-red-600">
                    {events.filter((e: ContextualEvent) => !e.success).length}
                  </h3>
                  <p className="text-sm text-gray-600">أحداث فاشلة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نموذج إنشاء/تعديل المشغل */}
      <TriggerDialog
        open={showCreateDialog || !!editingTrigger}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingTrigger(null);
        }}
        trigger={editingTrigger}
        onSubmit={(data) => {
          if (editingTrigger) {
            updateTriggerMutation.mutate({ id: editingTrigger.id, data });
          } else {
            createTriggerMutation.mutate(data);
          }
        }}
        isLoading={createTriggerMutation.isPending || updateTriggerMutation.isPending}
      />
    </div>
  );
}

// مكون نموذج إنشاء/تعديل المشغل
function TriggerDialog({
  open,
  onClose,
  trigger,
  onSubmit,
  isLoading
}: {
  open: boolean;
  onClose: () => void;
  trigger?: ContextualTrigger | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'project',
    affectedPermissions: [] as string[],
    priority: 5,
    notes: ''
  });

  useEffect(() => {
    if (trigger) {
      setFormData({
        name: trigger.name,
        description: trigger.description || '',
        triggerType: trigger.triggerType,
        affectedPermissions: trigger.affectedPermissions,
        priority: trigger.priority,
        notes: trigger.notes || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        triggerType: 'project',
        affectedPermissions: ["permits.build.issue", "permits.build.modify"],
        priority: 5,
        notes: ''
      });
    }
  }, [trigger]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // تأكد من وجود صلاحيات قبل الإرسال
    if (formData.affectedPermissions.length === 0) {
      alert('يجب تحديد على الأقل صلاحية واحدة');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {trigger ? 'تعديل المشغل السياقي' : 'إنشاء مشغل سياقي جديد'}
          </DialogTitle>
          <DialogDescription>
            قم بتكوين المشغل السياقي لتفعيل الصلاحيات تلقائياً
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">اسم المشغل</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-trigger-name"
              />
            </div>
            <div>
              <Label htmlFor="triggerType">نوع المشغل</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
              >
                <SelectTrigger data-testid="select-trigger-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">مشروع</SelectItem>
                  <SelectItem value="location">موقع</SelectItem>
                  <SelectItem value="time">وقت</SelectItem>
                  <SelectItem value="emergency">طوارئ</SelectItem>
                  <SelectItem value="amount">مبلغ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              data-testid="textarea-trigger-description"
            />
          </div>

          <div>
            <Label htmlFor="priority">الأولوية (1-10)</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              data-testid="input-trigger-priority"
            />
          </div>

          <div>
            <Label>الصلاحيات المتأثرة</Label>
            <div className="space-y-2 mt-2 p-3 border rounded">
              {[
                { id: "permits.build.issue", label: "إصدار تراخيص البناء" },
                { id: "permits.build.modify", label: "تعديل تراخيص البناء" },
                { id: "permits.survey.approve", label: "اعتماد المسوحات" },
                { id: "certificates.occupancy.issue", label: "إصدار شهادات الإشغال" },
                { id: "inspection.schedule", label: "جدولة التفتيش" }
              ].map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={permission.id}
                    checked={formData.affectedPermissions.includes(permission.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          affectedPermissions: [...formData.affectedPermissions, permission.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          affectedPermissions: formData.affectedPermissions.filter(p => p !== permission.id)
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <label htmlFor={permission.id} className="text-sm mr-2">
                    {permission.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              data-testid="textarea-trigger-notes"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              data-testid="button-cancel-trigger"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              data-testid="button-save-trigger"
            >
              {isLoading ? 'جاري الحفظ...' : trigger ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}