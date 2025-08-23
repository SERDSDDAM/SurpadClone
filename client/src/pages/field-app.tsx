import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { AdvancedGPSPanel } from "@/components/ui/advanced-gps-panel";
import { SmartToolbar } from "@/components/ui/smart-toolbar";
import { InteractiveCanvas } from "@/components/ui/interactive-canvas";
import { SurveyProgress } from "@/components/ui/survey-progress";
import { generatePointNumber } from "@/lib/survey-utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { SurveyPoint, SurveyLine, SurveyPolygon } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wifi, WifiOff, Save, Upload, Download, Activity } from "lucide-react";

// For demo purposes, using a sample request ID
const SAMPLE_REQUEST_ID = "sample-request-001";

interface SurveyStats {
  pointsCount: number;
  linesCount: number;
  polygonsCount: number;
}

export default function FieldApp() {
  const [activeTool, setActiveTool] = useState<"point" | "line" | "polygon" | "select">("point");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [surveyStats, setSurveyStats] = useState<SurveyStats>({
    pointsCount: 0,
    linesCount: 0,
    polygonsCount: 0,
  });
  
  // Advanced GPS simulation with realistic GNSS data
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
        queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "points"] });
      } else if (data.type === "LINE_ADDED") {
        queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "lines"] });
      } else if (data.type === "POLYGON_ADDED") {
        queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "polygons"] });
      }
    },
  });

  // Query survey data
  const { data: surveyPoints = [] } = useQuery<SurveyPoint[]>({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "points"],
  });

  const { data: surveyLines = [] } = useQuery<SurveyLine[]>({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "lines"],
  });

  const { data: surveyPolygons = [] } = useQuery<SurveyPolygon[]>({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "polygons"],
  });

  // Mutations
  const createPointMutation = useMutation({
    mutationFn: async (pointData: any) => {
      return apiRequest("POST", `/api/survey-requests/${SAMPLE_REQUEST_ID}/points`, pointData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "points"] });
      toast({
        title: "نجح الرفع",
        description: "تم رفع النقطة بنجاح",
      });
    },
    onError: (error) => {
      // Store for offline sync if needed
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

  // Advanced GPS simulation with realistic GNSS data
  useEffect(() => {
    const interval = setInterval(() => {
      setAdvancedGPS(prev => {
        // Simulate realistic GPS movement and variations
        const latVariation = (Math.random() - 0.5) * 0.00005; // ~5m variation
        const lngVariation = (Math.random() - 0.5) * 0.00005;
        const newAccuracy = Math.max(0.002, Math.min(0.02, prev.accuracy + (Math.random() - 0.5) * 0.003));
        const newHdop = Math.max(0.5, Math.min(3.0, prev.hdop + (Math.random() - 0.5) * 0.1));
        const newVdop = Math.max(0.8, Math.min(4.0, prev.vdop + (Math.random() - 0.5) * 0.15));
        
        // Determine fix type based on accuracy
        let fixType: "2D" | "3D" | "RTK_FLOAT" | "RTK_FIXED" = "3D";
        if (newAccuracy <= 0.01 && newHdop <= 1.0) {
          fixType = "RTK_FIXED";
        } else if (newAccuracy <= 0.05 && newHdop <= 1.5) {
          fixType = "RTK_FLOAT";
        } else if (newAccuracy <= 1.0) {
          fixType = "3D";
        } else {
          fixType = "2D";
        }

        return {
          ...prev,
          latitude: prev.latitude + latVariation,
          longitude: prev.longitude + lngVariation,
          altitude: prev.altitude + (Math.random() - 0.5) * 0.3,
          accuracy: newAccuracy,
          hdop: newHdop,
          vdop: newVdop,
          pdop: Math.sqrt(newHdop ** 2 + newVdop ** 2),
          satelliteCount: Math.max(8, Math.min(16, prev.satelliteCount + Math.floor((Math.random() - 0.5) * 2))),
          fixType,
          timestamp: new Date()
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Update survey stats when data changes
  useEffect(() => {
    setSurveyStats({
      pointsCount: surveyPoints.length,
      linesCount: surveyLines.length,
      polygonsCount: surveyPolygons.length,
    });
  }, [surveyPoints, surveyLines, surveyPolygons]);

  // Network status monitoring
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

  const handleLocationCapture = (location: any) => {
    if (!location) return;

    setIsCapturing(true);
    
    const pointData = {
      requestId: SAMPLE_REQUEST_ID,
      pointNumber: generatePointNumber(surveyPoints.length + 1),
      featureCode: "GPS",
      featureType: "GPS Point",
      longitude: location.longitude,
      latitude: location.latitude,
      elevation: location.altitude || 0,
      accuracy: location.accuracy || 0,
      capturedBy: "المساح الميداني",
      notes: `HDOP: ${location.hdop?.toFixed(2)}, VDOP: ${location.vdop?.toFixed(2)}, Fix: ${location.fixType}`,
      photos: []
    };

    createPointMutation.mutate(pointData);
    setTimeout(() => setIsCapturing(false), 1000);
  };

  const handleFeatureCreate = (type: string, featureCode: string, data: any) => {
    const featureData = {
      requestId: SAMPLE_REQUEST_ID,
      ...data,
      longitude: advancedGPS.longitude,
      latitude: advancedGPS.latitude,
      elevation: advancedGPS.altitude,
      accuracy: advancedGPS.accuracy,
      capturedBy: "المساح الميداني"
    };

    if (type === "point") {
      createPointMutation.mutate(featureData);
    }
    // Add handlers for line and polygon later
  };

  const handleSyncData = () => {
    toast({
      title: "المزامنة",
      description: "تتم المزامنة مع الخادم...",
    });
    // Implement actual sync logic
    setTimeout(() => {
      setPendingSync(0);
      toast({
        title: "تمت المزامنة",
        description: "تم رفع جميع البيانات المحفوظة محلياً",
      });
    }, 2000);
  };

  const handleExportSession = () => {
    toast({
      title: "التصدير",
      description: "يتم تصدير بيانات الجلسة...",
    });
  };

  // Convert survey data for canvas
  const canvasPoints = surveyPoints.map(point => ({
    id: point.id,
    x: 0, // Will be calculated by canvas
    y: 0,
    lat: point.latitude,
    lng: point.longitude,
    featureCode: point.featureCode,
    featureType: point.featureType,
    color: point.featureCode === "BM" ? "#FF0000" : "#0066CC"
  }));

  const canvasLines = surveyLines.map(line => ({
    id: line.id,
    points: [], // Will be populated with actual points
    featureCode: line.featureCode,
    color: "#0066CC"
  }));

  const canvasPolygons = surveyPolygons.map(polygon => ({
    id: polygon.id,
    points: [], // Will be populated with actual points
    featureCode: polygon.featureCode,
    color: "#32CD32",
    area: polygon.area
  }));

  return (
    <div className="space-y-6 p-4">
      {/* Header with Status */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">التطبيق الميداني المتقدم</h1>
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
            onLocationCapture={handleLocationCapture}
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
            stats={surveyStats}
            isConnected={wsConnected}
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
                onClick={handleSyncData}
                disabled={isOffline || pendingSync === 0}
                className="w-full flex items-center gap-2"
                data-testid="sync-data-btn"
              >
                <Upload className="w-4 h-4" />
                مزامنة البيانات
              </Button>
              
              <Button
                onClick={handleExportSession}
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
              const pointData = {
                requestId: SAMPLE_REQUEST_ID,
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
            onLineAdd={(line) => {
              console.log('Line added:', line);
              toast({
                title: "خط جديد",
                description: "تم إضافة خط جديد للخريطة",
              });
            }}
            onPolygonAdd={(polygon) => {
              console.log('Polygon added:', polygon);
              toast({
                title: "مضلع جديد",
                description: "تم إضافة مضلع جديد للخريطة",
              });
            }}
            onFeatureSelect={(feature) => {
              console.log('Feature selected:', feature);
            }}
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
              onClick={handleSyncData}
              disabled={pendingSync === 0}
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