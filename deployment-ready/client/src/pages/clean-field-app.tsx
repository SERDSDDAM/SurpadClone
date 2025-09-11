import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { InteractiveCanvas, type CanvasPoint, type CanvasLine, type CanvasPolygon } from "@/components/ui/interactive-canvas";
import { generatePointNumber, featureCodes } from "@/lib/survey-utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { SurveyPoint, SurveyLine, SurveyPolygon } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Satellite, 
  Wifi, 
  WifiOff, 
  Target,
  Activity,
  Navigation
} from "lucide-react";
import { Link } from "wouter";

// For demo purposes, using a sample request ID
const SAMPLE_REQUEST_ID = "sample-request-001";

export default function CleanFieldApp() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [layersVisible, setLayersVisible] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
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

  const queryClient = useQueryClient();

  // WebSocket for real-time updates
  const { isConnected: wsConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === "POINT_ADDED") {
        queryClient.invalidateQueries({ queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "points"] });
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
    onError: () => {
      toast({
        title: "خطأ في الرفع",
        description: "فشل في رفع النقطة",
        variant: "destructive",
      });
    },
  });

  // Advanced GPS simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAdvancedGPS(prev => {
        const latVariation = (Math.random() - 0.5) * 0.00005;
        const lngVariation = (Math.random() - 0.5) * 0.00005;
        const newAccuracy = Math.max(0.002, Math.min(0.02, prev.accuracy + (Math.random() - 0.5) * 0.003));
        const newHdop = Math.max(0.5, Math.min(3.0, prev.hdop + (Math.random() - 0.5) * 0.1));
        
        let fixType: "2D" | "3D" | "RTK_FLOAT" | "RTK_FIXED" = "3D";
        if (newAccuracy <= 0.01 && newHdop <= 1.0) {
          fixType = "RTK_FIXED";
        } else if (newAccuracy <= 0.05 && newHdop <= 1.5) {
          fixType = "RTK_FLOAT";
        }

        return {
          ...prev,
          latitude: prev.latitude + latVariation,
          longitude: prev.longitude + lngVariation,
          altitude: prev.altitude + (Math.random() - 0.5) * 0.3,
          accuracy: newAccuracy,
          hdop: newHdop,
          satelliteCount: Math.max(8, Math.min(16, prev.satelliteCount + Math.floor((Math.random() - 0.5) * 2))),
          fixType,
          timestamp: new Date()
        };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

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

  // FAB Action Handlers
  const handleAddPoint = () => {
    if (isCapturing) return;
    
    setIsCapturing(true);
    
    const pointData = {
      requestId: SAMPLE_REQUEST_ID,
      pointNumber: generatePointNumber(surveyPoints.length),
      featureCode: "MANUAL_POINT",
      featureType: "نقطة يدوية",
      longitude: advancedGPS.longitude,
      latitude: advancedGPS.latitude,
      elevation: advancedGPS.altitude,
      accuracy: advancedGPS.accuracy,
      capturedBy: "المساح الميداني",
      notes: `تم إنشاؤها باستخدام الزر العائم`,
      photos: []
    };

    createPointMutation.mutate(pointData);
    setTimeout(() => setIsCapturing(false), 1500);
  };

  const handleRecordGPS = () => {
    handleAddPoint();
  };

  const handleCanvasPointClick = (point: { x: number, y: number, lat: number, lng: number }) => {
    if (isCapturing) return;

    setIsCapturing(true);
    
    const pointData = {
      requestId: SAMPLE_REQUEST_ID,
      pointNumber: generatePointNumber(surveyPoints.length),
      featureCode: "CANVAS_POINT",
      featureType: "نقطة من الخريطة",
      longitude: point.lng,
      latitude: point.lat,
      elevation: advancedGPS.altitude,
      accuracy: advancedGPS.accuracy,
      capturedBy: "المساح الميداني",
      notes: `تم إنشاؤها من النقر على الخريطة`,
      photos: []
    };

    createPointMutation.mutate(pointData);
    setTimeout(() => setIsCapturing(false), 1500);
  };

  // Convert survey data to canvas format
  const canvasPoints: CanvasPoint[] = surveyPoints.map(point => ({
    id: point.id,
    x: 0,
    y: 0,
    lat: point.latitude,
    lng: point.longitude,
    featureCode: point.featureCode,
    color: point.featureCode.includes('building') ? '#ef4444' : 
           point.featureCode.includes('tree') ? '#22c55e' : 
           '#3b82f6'
  }));

  const canvasLines: CanvasLine[] = surveyLines.map(line => ({
    id: line.id,
    points: [],
    featureCode: line.featureCode,
    color: '#22c55e',
    length: 0
  }));

  const canvasPolygons: CanvasPolygon[] = surveyPolygons.map(polygon => ({
    id: polygon.id,
    points: [],
    featureCode: polygon.featureCode,
    color: '#8b5cf6',
    area: polygon.area ?? undefined
  }));

  // Format GPS accuracy and fix type for display
  const formatAccuracy = (accuracy: number) => {
    if (accuracy < 0.01) return "±" + (accuracy * 100).toFixed(1) + " سم";
    if (accuracy < 1) return "±" + (accuracy * 100).toFixed(0) + " سم";
    return "±" + accuracy.toFixed(1) + " م";
  };

  const getFixTypeDisplay = (fixType: string) => {
    switch(fixType) {
      case "RTK_FIXED": return "RTK ثابت";
      case "RTK_FLOAT": return "RTK عائم";  
      case "3D": return "3D";
      case "2D": return "2D";
      default: return "غير متاح";
    }
  };

  const getFixTypeColor = (fixType: string) => {
    switch(fixType) {
      case "RTK_FIXED": return "text-green-600 bg-green-100";
      case "RTK_FLOAT": return "text-blue-600 bg-blue-100";  
      case "3D": return "text-yellow-600 bg-yellow-100";
      case "2D": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-cyan-400 relative">
      {/* Minimal Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Survey</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Satellite className="h-3 w-3 mr-1" />
            {advancedGPS.satelliteCount}
          </Badge>
        </div>
      </div>

      {/* GPS Status Bar */}
      <div className="bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span>ΔV: {formatAccuracy(advancedGPS.accuracy)}</span>
            <span>ΔH: {formatAccuracy(advancedGPS.accuracy * 0.7)}</span>
            <Badge className={`text-xs ${getFixTypeColor(advancedGPS.fixType)}`}>
              Fix: {getFixTypeDisplay(advancedGPS.fixType)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span>{advancedGPS.satelliteCount}</span>
            <Navigation className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <InteractiveCanvas
          points={canvasPoints}
          lines={canvasLines}
          polygons={canvasPolygons}
          activeTool="point"
          onPointClick={handleCanvasPointClick}
          snapEnabled={snapEnabled}
          currentGPS={{ lat: advancedGPS.latitude, lng: advancedGPS.longitude }}
        />
        
        {/* Map Controls (Top Right) */}
        <div className="absolute top-4 right-4">
          <Card className="p-2 bg-white/90 backdrop-blur">
            <Target className="h-6 w-6 text-gray-600" />
          </Card>
        </div>

        {/* Zoom Controls (Bottom Right) */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-2">
          <Card className="p-0 bg-white shadow-lg">
            <div className="flex flex-col">
              <Button variant="ghost" size="sm" className="h-12 w-12 rounded-none">
                +
              </Button>
              <div className="border-t"></div>
              <Button variant="ghost" size="sm" className="h-12 w-12 rounded-none">
                −
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onAddPoint={handleAddPoint}
        onDeletePoint={() => toast({ title: "حذف النقطة", description: "جاري تطوير هذه الميزة" })}
        onToggleSnap={() => {
          setSnapEnabled(!snapEnabled);
          toast({ 
            title: snapEnabled ? "تم إيقاف الالتصاق" : "تم تفعيل الالتصاق",
            description: snapEnabled ? "الالتصاق التلقائي معطل" : "الالتصاق التلقائي مفعل"
          });
        }}
        onToggleLayers={() => {
          setLayersVisible(!layersVisible);
          toast({ title: "الطبقات", description: layersVisible ? "إخفاء الطبقات" : "عرض الطبقات" });
        }}
        onMovePoint={() => toast({ title: "تحريك النقطة", description: "جاري تطوير هذه الميزة" })}
        onAddCoordinate={() => toast({ title: "إضافة إحداثية", description: "جاري تطوير هذه الميزة" })}
        onCurrentLocation={() => toast({ title: "الموقع الحالي", description: "تم تحديد الموقع الحالي" })}
        onRecordGPS={handleRecordGPS}
        snapEnabled={snapEnabled}
        layersVisible={layersVisible}
        isCapturing={isCapturing}
      />

      {/* Status Indicators */}
      <div className="absolute top-20 left-4 space-y-2">
        {!wsConnected && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <WifiOff className="h-3 w-3" />
            غير متصل
          </Badge>
        )}
        
        {isOffline && (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            وضع أوفلاين
          </Badge>
        )}
      </div>
    </div>
  );
}