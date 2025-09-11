import { useSurveyWizard } from "@/features/survey/wizard/SurveyWizardContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUp, Satellite, MapPin, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function ChoosePathStep() {
  const { state, setState } = useSurveyWizard();
  const [detecting, setDetecting] = useState(false);

  const detectLegacy = useMutation({
    mutationFn: async (data: { planNo?: string; lat?: number; lng?: number }) => {
      const resp = await apiRequest("POST", `/api/survey/requests/${data.planNo || 'test'}/workflow/detect`, {
        latitude: data.lat || 15.3694,
        longitude: data.lng || 44.1910,
        planNo: data.planNo
      });
      return resp;
    },
    onSuccess: (data) => {
      setDetecting(false);
      if (data?.detectedWorkflow === 'shapefile') {
        setState(s => ({ ...s, mode: 'shapefile', location: { ...s.location, legacyFound: true } }));
      }
    },
    onError: () => setDetecting(false)
  });

  const runAutoDetection = () => {
    setDetecting(true);
    detectLegacy.mutate({ planNo: state.location.planNo });
  };

  const next = (mode: 'shapefile'|'gnss') => {
    setState(s => ({ ...s, mode, step: 'applicant' }));
  };

  return (
    <div className="space-y-6" data-testid="choose-path-step">
      {/* Auto Detection */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="w-5 h-5" />
            كشف تلقائي للمسار المناسب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800 mb-4">
            يمكن للنظام كشف المسار الأنسب تلقائياً بناءً على وجود قرارات سابقة للمنطقة
          </p>
          <Button 
            onClick={runAutoDetection} 
            disabled={detecting} 
            className="w-full"
            data-testid="auto-detect-btn"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {detecting ? 'جاري الكشف...' : 'كشف تلقائي'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Shapefile Path */}
        <Card className={`cursor-pointer transition-all hover:shadow-md ${state.location.legacyFound ? 'ring-2 ring-green-500' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-orange-600" />
                <span>إسقاط سابق (Shapefile)</span>
              </div>
              {state.location.legacyFound && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  مُوصى به
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              للقطع التي لديها قرار/إسقاط سابق. يلزم رفع ملف ZIP يحتوي على (shp, shx, dbf, prj).
            </p>
            
            <div className="space-y-2 text-xs text-gray-500">
              <div>• مناسب للمناطق المطورة سابقاً</div>
              <div>• يتطلب ملف شيب فايل صحيح</div>
              <div>• معالجة أسرع (1-2 أيام)</div>
            </div>

            <Button 
              onClick={() => next('shapefile')} 
              className="w-full"
              variant={state.location.legacyFound ? 'default' : 'outline'}
              data-testid="shapefile-path-btn"
            >
              اختيار هذا المسار
            </Button>
          </CardContent>
        </Card>

        {/* GNSS Path */}
        <Card className="cursor-pointer transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-blue-600" />
              <span>إسقاط جديد (GNSS)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              جمع البيانات عبر تطبيق المساح الميداني باستخدام GNSS عالي الدقة.
            </p>
            
            <div className="space-y-2 text-xs text-gray-500">
              <div>• مناسب للمناطق الجديدة</div>
              <div>• يتطلب زيارة ميدانية</div>
              <div>• دقة عالية (سم واحد)</div>
              <div>• معالجة (3-5 أيام)</div>
            </div>

            <Button 
              onClick={() => next('gnss')} 
              variant="outline" 
              className="w-full"
              data-testid="gnss-path-btn"
            >
              اختيار هذا المسار
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Path Comparison */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">مقارنة سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 text-orange-600">Shapefile</h4>
              <ul className="space-y-1 text-gray-600">
                <li>✓ أسرع في المعالجة</li>
                <li>✓ لا يتطلب زيارة ميدانية</li>
                <li>✗ يحتاج ملف شيب صحيح</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-blue-600">GNSS</h4>
              <ul className="space-y-1 text-gray-600">
                <li>✓ دقة عالية جداً</li>
                <li>✓ لا يحتاج ملفات سابقة</li>
                <li>✗ يتطلب مسّاح ميداني</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}