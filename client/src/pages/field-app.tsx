import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { AdvancedGPSPanel } from "@/components/ui/advanced-gps-panel";
import { SmartToolbar } from "@/components/ui/smart-toolbar";
import { InteractiveCanvas } from "@/components/ui/interactive-canvas";
import { SurveyProgress } from "@/components/ui/survey-progress";
import { generatePointNumber } from "@/lib/survey-utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { SurveyPoint, SurveyRequest } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wifi, WifiOff, Upload, Download, Activity } from "lucide-react";

interface SurveyStats {
  pointsCount: number;
  linesCount: number;
  polygonsCount: number;
}

export default function FieldApp() {
  const { id: requestId } = useParams<{ id: string }>();
  const [activeTool, setActiveTool] = useState<"point" | "line" | "polygon" | "select">("point");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
 
  const [advancedGPS, setAdvancedGPS] = useState({
    latitude: 15.3694,
    longitude: 44.1910,
    altitude: 2250.5,
    accuracy: 0.005,
    speed: 0,
    heading: 0,
    hdop: 0.8,
    vdop: 1.2,
    pdop: 1.5,
    satelliteCount: 12,
    fixType: "RTK_FIXED" as "2D" | "3D" | "RTK_FLOAT" | "RTK_FIXED",
    timestamp: new Date()
  });
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const queryClient = useQueryClient();
  // WebSocket for real-time updates
  const { isConnected: wsConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "POINT_ADDED") {
        queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", requestId, "points"] });
      }
    },
  });

  // Fetch survey request
  const {
    data: surveyRequest,
    isPending: requestLoading,
    error: requestError
  } = useQuery<SurveyRequest | undefined>({
    queryKey: ["/api/survey-requests", requestId],
    queryFn: async () => {
      if (!requestId) throw new Error("لم يتم تحديد رقم الطلب");
      const res = await fetch(`/api/survey-requests/${requestId}`);
      if (!res.ok) throw new Error("فشل في جلب بيانات الطلب");
      return res.json();
    },
    enabled: !!requestId
  });

  // Fetch survey points
  const {
    data: surveyPoints = [],
    isPending: pointsLoading,
    error: pointsError
  } = useQuery<SurveyPoint[]>({
    queryKey: ["/api/survey-requests", requestId, "points"],
    queryFn: async () => {
      if (!requestId) return [];
      const res = await fetch(`/api/survey-requests/${requestId}/points`);
      if (!res.ok) throw new Error("فشل في جلب النقاط");
      return res.json();
    },
    enabled: !!requestId
  });

  // Add new point
  const createPointMutation = useMutation({
    mutationFn: async (pointData: Partial<SurveyPoint>) => {
      if (!requestId) throw new Error("لا يوجد رقم طلب");
      const res = await fetch(`/api/survey-requests/${requestId}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pointData)
      });
      if (!res.ok) throw new Error("فشل في إضافة النقطة");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", requestId, "points"] });
      toast({
        title: "نجح الرفع",
        description: "تم رفع النقطة بنجاح",
      });
    },
    onError: () => {
      if (isOffline) {
        setPendingSync(prev => prev + 1);
        toast({
          title: "حُفظ محلياً",
          description: "سيتم المزامنة عند الاتصال",
          variant: "default",
        });
      } else {
        toast({
          title: "خطأ في الرفع",
          description: "فشل في رفع النقطة",
          variant: "destructive",
        });
      }
    },
  });

  // Update survey stats

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add point from SmartToolbar
  const handleFeatureCreate = (type: string, featureCode: string, data: any) => {
    if (type === "point") {
      const pointData: Partial<SurveyPoint> = {
        requestId,
        pointNumber: generatePointNumber(surveyPoints.length + 1),
        featureCode: featureCode || "GPS",
        featureType: "GPS Point",
        longitude: advancedGPS.longitude,
        latitude: advancedGPS.latitude,
        elevation: advancedGPS.altitude,
        accuracy: advancedGPS.accuracy,
        capturedBy: "المساح الميداني",
        notes: `HDOP: ${advancedGPS.hdop?.toFixed(2)}, VDOP: ${advancedGPS.vdop?.toFixed(2)}, Fix: ${advancedGPS.fixType}`,
        photos: []
      };
      createPointMutation.mutate(pointData);
    }
  };

  // Prepare points for map
  const canvasPoints = surveyPoints.map(point => ({
    id: point.id,
    x: 0,
    y: 0,
    lat: point.latitude,
    lng: point.longitude,
    featureCode: point.featureCode,
    featureType: point.featureType,
    color: point.featureCode === "BM" ? "#FF0000" : "#0066CC"
  }));
  const canvasLines: any[] = [];
  const canvasPolygons: any[] = [];

  // Loading and error states
// Loading and error states
if (requestLoading || pointsLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">جارٍ تحميل البيانات...</p>
      </div>
    </div>
  );
}

if (requestError || pointsError) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center text-red-600">
        حدث خطأ أثناء جلب البيانات: {requestError?.message || pointsError?.message}
      </div>
    </div>
  );
}

// هذا هو الشرط الأهم: يتم التحقق منه بعد انتهاء التحميل وحدوث الأخطاء
if (!surveyRequest) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center text-gray-600">لم يتم العثور على الطلب أو حدث خطأ غير متوقع.</div>
    </div>
  );
}

const currentStats = {
  pointsCount: surveyPoints.length,
  linesCount: 0, 
  polygonsCount: 0,
};

  return (
    <div className="space-y-6 p-4">
      {/* Header with Status */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">التطبيق الميداني المتقدم</h1>
          <div className="text-gray-700 text-lg font-semibold">
            رقم الطلب: <span className="text-primary">{surveyRequest.requestNumber}</span>
            <span className="mx-2">|</span>
            المالك: <span className="text-primary">{surveyRequest.ownerName}</span>
          </div>
          <p className="text-gray-600">نظام GNSS عالي الدقة مع أدوات مساحية ذكية</p>
        </div>
        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          <Badge 
            variant={wsConnected ? "default" : "destructive"}
            className="flex items-center gap-1"
            data-testid="websocket-status"
          >
            {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {wsConnected ? "متصل" : "غير متصل"}
          </Badge>
          <Badge 
            variant={isOffline ? "destructive" : "default"}
            className="flex items-center gap-1"
            data-testid="network-status"
          >
            <Activity className="w-3 h-3" />
            {isOffline ? "دون إنترنت" : "متصل"}
          </Badge>
          {pendingSync > 0 && (
            <Badge variant="outline" data-testid="pending-sync">
              {pendingSync} معلق
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Advanced GPS Panel */}
        <div className="xl:col-span-1">
          <AdvancedGPSPanel
            gpsData={advancedGPS}
            onLocationCapture={() => {}}
            isCapturing={isCapturing}
          />
        </div>
        {/* Smart Toolbar */}
        <div className="xl:col-span-1">
          <SmartToolbar
            activeMode={activeTool}
            onModeChange={setActiveTool}
            onFeatureCreate={handleFeatureCreate}
            snapEnabled={snapEnabled}
            onSnapToggle={setSnapEnabled}
          />
        </div>
        {/* Survey Progress */}
        <div className="xl:col-span-1">
          <SurveyProgress
            stats={currentStats} //
           
          />
        </div>
        {/* Session Management */}
        <div className="xl:col-span-1">
          <Card data-testid="session-management">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">إدارة الجلسة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                disabled
                className="w-full flex items-center gap-2"
                data-testid="sync-data-btn"
              >
                <Upload className="w-4 h-4" />
                مزامنة البيانات
              </Button>
              <Button
                disabled
                variant="outline"
                className="w-full flex items-center gap-2"
                data-testid="export-session-btn"
              >
                <Download className="w-4 h-4" />
                تصدير الجلسة
              </Button>
              <div className="text-xs text-gray-500 space-y-1">
                <div>آخر مزامنة: {new Date().toLocaleTimeString('ar-YE')}</div>
                <div>جودة الإشارة: {
                  advancedGPS.fixType === "RTK_FIXED" ? "ممتازة" :
                  advancedGPS.fixType === "RTK_FLOAT" ? "جيدة جداً" :
                  advancedGPS.fixType === "3D" ? "جيدة" : "متوسطة"
                }</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactive Canvas for Drawing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>لوحة الرسم التفاعلية</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Badge variant="outline" className="text-xs">
                النقاط: {canvasPoints.length}
              </Badge>
              <Badge variant="outline" className="text-xs">
                الخطوط: {canvasLines.length}
              </Badge>
              <Badge variant="outline" className="text-xs">
                المضلعات: {canvasPolygons.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InteractiveCanvas
            points={canvasPoints}
            lines={canvasLines}
            polygons={canvasPolygons}
            mode={activeTool}
            snapEnabled={snapEnabled}
            onPointAdd={(point) => {
              const pointData: Partial<SurveyPoint> = {
                requestId,
                pointNumber: generatePointNumber(surveyPoints.length + 1),
                featureCode: "MANUAL",
                featureType: "Manual Point",
                longitude: point.lng,
                latitude: point.lat,
                elevation: advancedGPS.altitude,
                accuracy: advancedGPS.accuracy,
                capturedBy: "المساح الميداني",
                photos: []
              };
              createPointMutation.mutate(pointData);
            }}
            onLineAdd={() => {}}
            onPolygonAdd={() => {}}
            onFeatureSelect={() => {}}
          />
        </CardContent>
      </Card>

      {/* Offline Mode Banner */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg" data-testid="offline-banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span className="font-medium">وضع العمل دون إنترنت</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled
              data-testid="offline-sync-btn"
            >
              مزامنة ({pendingSync})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}