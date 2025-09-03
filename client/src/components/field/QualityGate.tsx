import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";
import { SurveyPoint, SurveyPolygon } from "@shared/schema";

interface QualityCheck {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface QualityGateProps {
  surveyPoints: SurveyPoint[];
  surveyPolygons: SurveyPolygon[];
  onComplete: () => void;
  isSubmitting?: boolean;
}

export default function QualityGate({ 
  surveyPoints, 
  surveyPolygons, 
  onComplete, 
  isSubmitting = false 
}: QualityGateProps) {
  
  // فحص جودة GNSS
  const checkGNSSQuality = (): QualityCheck => {
    const points = surveyPoints;
    if (points.length === 0) {
      return {
        id: 'gnss_quality',
        name: 'جودة GNSS',
        status: 'fail',
        message: 'لا توجد نقاط مسجلة',
        severity: 'critical'
      };
    }

    const lowAccuracyPoints = points.filter(p => 
      !p.accuracy || p.accuracy > 0.02 // أكثر من 2 سم
    );

    if (lowAccuracyPoints.length > points.length * 0.3) {
      return {
        id: 'gnss_quality',
        name: 'جودة GNSS',
        status: 'fail',
        message: `${lowAccuracyPoints.length} نقطة دقة منخفضة (>2سم)`,
        severity: 'critical'
      };
    } else if (lowAccuracyPoints.length > 0) {
      return {
        id: 'gnss_quality',
        name: 'جودة GNSS',
        status: 'warning',
        message: `${lowAccuracyPoints.length} نقطة دقة متوسطة`,
        severity: 'medium'
      };
    }

    return {
      id: 'gnss_quality',
      name: 'جودة GNSS',
      status: 'pass',
      message: 'جميع النقاط بدقة عالية',
      severity: 'low'
    };
  };

  // فحص إغلاق المضلعات
  const checkPolygonClosure = (): QualityCheck => {
    if (surveyPolygons.length === 0) {
      return {
        id: 'polygon_closure',
        name: 'إغلاق المضلعات',
        status: 'warning',
        message: 'لا توجد مضلعات للفحص',
        severity: 'medium'
      };
    }

    const openPolygons = surveyPolygons.filter(polygon => {
      // فحص إذا كان المضلع مغلق هندسياً
      const pointIds = polygon.pointIds || [];
      if (pointIds.length < 3) return true;
      
      // فحص المسافة بين أول وآخر نقطة
      const firstPoint = surveyPoints.find(p => p.id === pointIds[0]);
      const lastPoint = surveyPoints.find(p => p.id === pointIds[pointIds.length - 1]);
      
      if (!firstPoint || !lastPoint) return true;
      
      const distance = Math.sqrt(
        Math.pow((firstPoint.longitude - lastPoint.longitude) * 111000, 2) +
        Math.pow((firstPoint.latitude - lastPoint.latitude) * 111000, 2)
      );
      
      return distance > 0.2; // أكثر من 20 سم
    });

    if (openPolygons.length > 0) {
      return {
        id: 'polygon_closure',
        name: 'إغلاق المضلعات',
        status: 'fail',
        message: `${openPolygons.length} مضلع غير مغلق`,
        severity: 'critical'
      };
    }

    return {
      id: 'polygon_closure',
      name: 'إغلاق المضلعات',
      status: 'pass',
      message: 'جميع المضلعات مغلقة',
      severity: 'low'
    };
  };

  // فحص كفاية العينة
  const checkSampleAdequacy = (): QualityCheck => {
    const totalPoints = surveyPoints.length;
    
    if (totalPoints < 4) {
      return {
        id: 'sample_adequacy',
        name: 'كفاية العينة',
        status: 'fail',
        message: `عدد النقاط قليل: ${totalPoints} (الحد الأدنى: 4)`,
        severity: 'critical'
      };
    }

    if (totalPoints < 8) {
      return {
        id: 'sample_adequacy',
        name: 'كفاية العينة',
        status: 'warning',
        message: `عدد النقاط مقبول: ${totalPoints} (المستحسن: 8+)`,
        severity: 'medium'
      };
    }

    return {
      id: 'sample_adequacy',
      name: 'كفاية العينة',
      status: 'pass',
      message: `عدد النقاط ممتاز: ${totalPoints}`,
      severity: 'low'
    };
  };

  // فحص التوزيع المكاني
  const checkSpatialDistribution = (): QualityCheck => {
    if (surveyPoints.length < 4) {
      return {
        id: 'spatial_distribution',
        name: 'التوزيع المكاني',
        status: 'fail',
        message: 'عدد النقاط غير كافي للتحليل',
        severity: 'high'
      };
    }

    // حساب المدى (Range) للنقاط
    const lats = surveyPoints.map(p => p.latitude);
    const lngs = surveyPoints.map(p => p.longitude);
    
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    
    // إذا كان المدى صغير جداً، النقاط متقاربة جداً
    if (latRange < 0.0001 && lngRange < 0.0001) {
      return {
        id: 'spatial_distribution',
        name: 'التوزيع المكاني',
        status: 'warning',
        message: 'النقاط متقاربة جداً - تأكد من تغطية المنطقة',
        severity: 'medium'
      };
    }

    return {
      id: 'spatial_distribution',
      name: 'التوزيع المكاني',
      status: 'pass',
      message: 'توزيع مكاني جيد',
      severity: 'low'
    };
  };

  // فحص تماسك البيانات
  const checkDataConsistency = (): QualityCheck => {
    const issues = [];
    
    // فحص النقاط المكررة
    const duplicates = surveyPoints.filter((point, index) => 
      surveyPoints.findIndex(p => 
        Math.abs(p.latitude - point.latitude) < 0.000001 &&
        Math.abs(p.longitude - point.longitude) < 0.000001
      ) !== index
    );
    
    if (duplicates.length > 0) {
      issues.push(`${duplicates.length} نقطة مكررة`);
    }

    // فحص النقاط خارج النطاق المعقول لليمن
    const outOfBounds = surveyPoints.filter(p => 
      p.latitude < 12.0 || p.latitude > 19.0 ||
      p.longitude < 42.0 || p.longitude > 55.0
    );
    
    if (outOfBounds.length > 0) {
      issues.push(`${outOfBounds.length} نقطة خارج اليمن`);
    }

    if (issues.length > 0) {
      return {
        id: 'data_consistency',
        name: 'تماسك البيانات',
        status: 'fail',
        message: issues.join(', '),
        severity: 'critical'
      };
    }

    return {
      id: 'data_consistency',
      name: 'تماسك البيانات',
      status: 'pass',
      message: 'البيانات متسقة',
      severity: 'low'
    };
  };

  // تشغيل جميع الفحوصات
  const qualityChecks: QualityCheck[] = [
    checkGNSSQuality(),
    checkPolygonClosure(),
    checkSampleAdequacy(),
    checkSpatialDistribution(),
    checkDataConsistency()
  ];

  // حساب النتيجة الإجمالية
  const passedChecks = qualityChecks.filter(check => check.status === 'pass').length;
  const warningChecks = qualityChecks.filter(check => check.status === 'warning').length;
  const failedChecks = qualityChecks.filter(check => check.status === 'fail').length;
  const criticalFailures = qualityChecks.filter(check => check.status === 'fail' && check.severity === 'critical').length;
  
  const overallScore = Math.round((passedChecks / qualityChecks.length) * 100);
  const canComplete = criticalFailures === 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          بوابة الجودة
          <Badge variant={canComplete ? "default" : "destructive"} className="ml-auto">
            {overallScore}%
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* مؤشر التقدم الإجمالي */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>جودة المسح الإجمالية</span>
            <span>{overallScore}%</span>
          </div>
          <Progress value={overallScore} className="h-3" />
        </div>

        {/* ملخص سريع */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-500">{passedChecks}</div>
            <div className="text-xs text-muted-foreground">نجح</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-500">{warningChecks}</div>
            <div className="text-xs text-muted-foreground">تحذير</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-500">{failedChecks}</div>
            <div className="text-xs text-muted-foreground">فشل</div>
          </div>
        </div>

        {/* تفاصيل الفحوصات */}
        <div className="space-y-3">
          {qualityChecks.map((check) => (
            <div key={check.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="mt-0.5">
                {check.status === 'pass' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {check.status === 'warning' && <AlertCircle className="h-5 w-5 text-orange-500" />}
                {check.status === 'fail' && <XCircle className="h-5 w-5 text-red-500" />}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{check.name}</h4>
                  <Badge 
                    variant={
                      check.status === 'pass' ? 'default' :
                      check.status === 'warning' ? 'secondary' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {check.status === 'pass' && 'نجح'}
                    {check.status === 'warning' && 'تحذير'}
                    {check.status === 'fail' && 'فشل'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{check.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* رسالة التوجيه */}
        {!canComplete && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">لا يمكن إكمال المسح</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">
              يجب حل جميع المشاكل الحرجة قبل إرسال المسح للاعتماد.
            </p>
          </div>
        )}

        {canComplete && failedChecks === 0 && warningChecks === 0 && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">جاهز للإرسال</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              جميع فحوصات الجودة نجحت. يمكن إرسال المسح للاعتماد.
            </p>
          </div>
        )}

        {canComplete && (failedChecks > 0 || warningChecks > 0) && (
          <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">مقبول مع تحذيرات</span>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              يمكن إرسال المسح، لكن يُنصح بمراجعة التحذيرات.
            </p>
          </div>
        )}

        {/* زر الإكمال */}
        <Button
          onClick={onComplete}
          disabled={!canComplete || isSubmitting}
          className="w-full"
          size="lg"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? 'جاري الإرسال...' : 'إكمال المسح وإرسال للاعتماد'}
        </Button>
      </CardContent>
    </Card>
  );
}