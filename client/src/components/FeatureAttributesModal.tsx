import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GeoJSONFeature } from '@shared/gis-schema';

// Zod schema for feature properties
const featureAttributesSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  type: z.string().min(1, 'النوع مطلوب'),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'planned', 'under_construction']).default('active'),
  importance: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  area: z.number().optional(),
  length: z.number().optional(),
  elevation: z.number().optional(),
  population: z.number().optional(),
  established_date: z.string().optional(),
  last_updated: z.string().optional(),
  source: z.string().optional(),
  accuracy: z.enum(['high', 'medium', 'low']).default('medium'),
  verified: z.boolean().default(false),
  tags: z.string().optional(), // Comma-separated tags
  custom_field_1: z.string().optional(),
  custom_field_2: z.string().optional(),
  custom_field_3: z.string().optional(),
});

type FeatureAttributes = z.infer<typeof featureAttributesSchema>;

interface FeatureAttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (attributes: FeatureAttributes) => void;
  featureType: 'point' | 'linestring' | 'polygon' | 'multipoint' | 'multilinestring' | 'multipolygon';
  initialValues?: Partial<FeatureAttributes>;
  calculatedMetrics?: {
    area?: number;
    length?: number;
    perimeter?: number;
  };
}

export function FeatureAttributesModal({
  isOpen,
  onClose,
  onSave,
  featureType,
  initialValues,
  calculatedMetrics
}: FeatureAttributesModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<FeatureAttributes>({
    resolver: zodResolver(featureAttributesSchema),
    defaultValues: {
      status: 'active',
      importance: 'medium',
      accuracy: 'medium',
      verified: false,
      ...initialValues,
    }
  });

  React.useEffect(() => {
    if (calculatedMetrics) {
      if (calculatedMetrics.area) setValue('area', calculatedMetrics.area);
      if (calculatedMetrics.length) setValue('length', calculatedMetrics.length);
    }
  }, [calculatedMetrics, setValue]);

  const onSubmit = (data: FeatureAttributes) => {
    // Set current timestamp for last_updated
    data.last_updated = new Date().toISOString();
    onSave(data);
    onClose();
    reset();
  };

  const handleCancel = () => {
    onClose();
    reset();
  };

  const getTypeOptions = () => {
    const commonTypes = [
      'مبنى', 'طريق', 'نهر', 'جبل', 'قرية', 'مدينة', 
      'مسجد', 'مدرسة', 'مستشفى', 'سوق', 'مزرعة', 'غابة'
    ];
    
    const typeSpecific = {
      point: ['معلم', 'نقطة اهتمام', 'محطة', 'برج', 'بئر', 'شجرة'],
      linestring: ['طريق', 'نهر', 'سكة حديد', 'أنبوب', 'سور', 'خط كهرباء'],
      polygon: ['مبنى', 'حديقة', 'بحيرة', 'منطقة سكنية', 'منطقة صناعية', 'مزرعة'],
    };

    return [...commonTypes, ...(typeSpecific[featureType as keyof typeof typeSpecific] || [])];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">خصائص المعلم الجغرافي</DialogTitle>
          <DialogDescription className="text-right">
            أدخل المعلومات التفصيلية للمعلم المرسوم ({featureType})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-right">الاسم *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="اسم المعلم"
                className="text-right"
                data-testid="input-feature-name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 text-right">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-right">النوع *</Label>
              <Select onValueChange={(value) => setValue('type', value)}>
                <SelectTrigger data-testid="select-feature-type">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {getTypeOptions().map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600 text-right">{errors.type.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-right">الوصف</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="وصف تفصيلي للمعلم"
              className="text-right"
              rows={3}
              data-testid="textarea-feature-description"
            />
          </div>

          {/* Status and Importance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">الحالة</Label>
              <Select onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger data-testid="select-feature-status">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="planned">مخطط</SelectItem>
                  <SelectItem value="under_construction">تحت الإنشاء</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importance" className="text-right">الأهمية</Label>
              <Select onValueChange={(value) => setValue('importance', value as any)}>
                <SelectTrigger data-testid="select-feature-importance">
                  <SelectValue placeholder="مستوى الأهمية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="critical">حرجة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calculated Metrics (Read-only) */}
          {calculatedMetrics && (
            <div className="p-4 bg-blue-50 rounded-md">
              <h4 className="font-semibold text-right mb-2">المقاييس المحسوبة</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {calculatedMetrics.area && (
                  <div className="text-right">
                    <span className="font-medium">المساحة: </span>
                    <span>{calculatedMetrics.area.toFixed(2)} م²</span>
                  </div>
                )}
                {calculatedMetrics.length && (
                  <div className="text-right">
                    <span className="font-medium">الطول: </span>
                    <span>{calculatedMetrics.length.toFixed(2)} م</span>
                  </div>
                )}
                {calculatedMetrics.perimeter && (
                  <div className="text-right">
                    <span className="font-medium">المحيط: </span>
                    <span>{calculatedMetrics.perimeter.toFixed(2)} م</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="elevation" className="text-right">الارتفاع (م)</Label>
              <Input
                id="elevation"
                type="number"
                {...register('elevation', { valueAsNumber: true })}
                placeholder="الارتفاع بالمتر"
                className="text-right"
                data-testid="input-feature-elevation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="population" className="text-right">عدد السكان</Label>
              <Input
                id="population"
                type="number"
                {...register('population', { valueAsNumber: true })}
                placeholder="عدد السكان"
                className="text-right"
                data-testid="input-feature-population"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-right">العلامات</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="علامات منفصلة بفواصل (مثل: تاريخي، سياحي، ديني)"
              className="text-right"
              data-testid="input-feature-tags"
            />
          </div>

          {/* Source and Accuracy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source" className="text-right">المصدر</Label>
              <Input
                id="source"
                {...register('source')}
                placeholder="مصدر البيانات"
                className="text-right"
                data-testid="input-feature-source"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accuracy" className="text-right">دقة البيانات</Label>
              <Select onValueChange={(value) => setValue('accuracy', value as any)}>
                <SelectTrigger data-testid="select-feature-accuracy">
                  <SelectValue placeholder="مستوى الدقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              data-testid="button-cancel-attributes"
            >
              إلغاء
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-attributes"
            >
              حفظ المعلم
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}