import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Send, ArrowUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FieldEscalationProps {
  requestId: string;
  currentLocation: { latitude: number; longitude: number };
}

const escalationReasons = [
  { value: 'street_status', label: 'مشكلة في حالة الشارع', priority: 'high' },
  { value: 'boundary_dispute', label: 'نزاع حدود', priority: 'high' },
  { value: 'access_denied', label: 'منع الوصول للموقع', priority: 'medium' },
  { value: 'technical_issue', label: 'مشكلة تقنية', priority: 'medium' },
  { value: 'safety_concern', label: 'مخاوف أمنية', priority: 'high' },
  { value: 'unclear_boundaries', label: 'حدود غير واضحة', priority: 'medium' },
  { value: 'missing_documentation', label: 'وثائق مفقودة', priority: 'low' },
  { value: 'weather_conditions', label: 'ظروف جوية', priority: 'low' },
  { value: 'equipment_failure', label: 'عطل في المعدات', priority: 'medium' },
  { value: 'other', label: 'أخرى', priority: 'medium' }
];

export default function FieldEscalation({ requestId, currentLocation }: FieldEscalationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const escalateMutation = useMutation({
    mutationFn: async (escalationData: any) => {
      return apiRequest(`/api/survey/requests/${requestId}/escalate`, {
        method: 'POST',
        body: escalationData
      });
    },
    onSuccess: () => {
      toast({
        title: "تم التصعيد بنجاح",
        description: "سيتم مراجعة الطلب من قبل المكتب الإشرافي",
        variant: "default",
      });
      setIsOpen(false);
      setSelectedReason('');
      setNotes('');
      setIsUrgent(false);
      
      // تحديث حالة الطلب
      queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", requestId] });
    },
    onError: (error) => {
      toast({
        title: "خطأ في التصعيد",
        description: "فشل في إرسال طلب التصعيد",
        variant: "destructive",
      });
    }
  });

  const handleEscalate = () => {
    if (!selectedReason) {
      toast({
        title: "يرجى اختيار السبب",
        description: "يجب تحديد سبب التصعيد",
        variant: "destructive",
      });
      return;
    }

    const escalationData = {
      escalationReason: selectedReason,
      notes: notes || 'تصعيد من المساح الميداني',
      isUrgent,
      fieldLocation: currentLocation,
      timestamp: new Date().toISOString(),
      escalatedBy: 'المساح الميداني'
    };

    escalateMutation.mutate(escalationData);
  };

  const selectedReasonData = escalationReasons.find(r => r.value === selectedReason);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
      >
        <ArrowUp className="h-4 w-4 mr-2" />
        تصعيد للمكتب الإشرافي
      </Button>
    );
  }

  return (
    <Card className="w-full border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
          <AlertTriangle className="h-5 w-5" />
          تصعيد للمكتب الإشرافي
          <Badge variant="secondary" className="ml-auto">
            طارئ
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* سبب التصعيد */}
        <div className="space-y-2">
          <label className="text-sm font-medium">سبب التصعيد</label>
          <Select value={selectedReason} onValueChange={setSelectedReason}>
            <SelectTrigger>
              <SelectValue placeholder="اختر سبب التصعيد" />
            </SelectTrigger>
            <SelectContent>
              {escalationReasons.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{reason.label}</span>
                    <Badge 
                      variant={
                        reason.priority === 'high' ? 'destructive' :
                        reason.priority === 'medium' ? 'secondary' : 'outline'
                      }
                      className="ml-2 text-xs"
                    >
                      {reason.priority === 'high' && 'عالي'}
                      {reason.priority === 'medium' && 'متوسط'}
                      {reason.priority === 'low' && 'منخفض'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* تفاصيل إضافية */}
        <div className="space-y-2">
          <label className="text-sm font-medium">تفاصيل المشكلة</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="وصف مفصل للمشكلة والظروف المحيطة..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* مؤشر الأولوية */}
        {selectedReasonData && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">مستوى الأولوية:</span>
              <Badge 
                variant={
                  selectedReasonData.priority === 'high' ? 'destructive' :
                  selectedReasonData.priority === 'medium' ? 'secondary' : 'outline'
                }
              >
                {selectedReasonData.priority === 'high' && 'عالي - استجابة فورية'}
                {selectedReasonData.priority === 'medium' && 'متوسط - في نفس اليوم'}
                {selectedReasonData.priority === 'low' && 'منخفض - خلال 48 ساعة'}
              </Badge>
            </div>
            
            {selectedReasonData.priority === 'high' && (
              <p className="text-sm text-destructive mt-2">
                سيتم إشعار المكتب الإشرافي فوراً وتعليق المسح حتى الحل
              </p>
            )}
          </div>
        )}

        {/* معلومات الموقع */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-sm text-blue-700">
            <div className="font-medium">الموقع الحالي:</div>
            <div className="font-mono text-xs">
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              سيتم إرفاق الموقع الدقيق مع طلب التصعيد
            </div>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleEscalate}
            disabled={!selectedReason || escalateMutation.isPending}
            className="flex-1"
            variant="destructive"
          >
            <Send className="h-4 w-4 mr-2" />
            {escalateMutation.isPending ? 'جاري الإرسال...' : 'إرسال التصعيد'}
          </Button>
          
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            disabled={escalateMutation.isPending}
          >
            إلغاء
          </Button>
        </div>

        {/* رسالة تحذيرية */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          <strong>ملاحظة:</strong> التصعيد سيؤدي إلى تعليق المسح مؤقتاً حتى يتم حل المشكلة من قبل المكتب الإشرافي. 
          تأكد من ضرورة التصعيد قبل الإرسال.
        </div>
      </CardContent>
    </Card>
  );
}