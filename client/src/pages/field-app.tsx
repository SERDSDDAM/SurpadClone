import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { GPSPanel } from "@/components/ui/gps-panel";
import { SurveyTools } from "@/components/ui/survey-tools";
import { InteractiveMap } from "@/components/ui/interactive-map";
import { SurveyProgress } from "@/components/ui/survey-progress";
import { gpsSimulator } from "@/lib/gps-simulator";
import { generatePointNumber } from "@/lib/survey-utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { GPSData, SurveyStats } from "@/types/survey";
import { SurveyPoint, SurveyLine, SurveyPolygon } from "@shared/schema";

// For demo purposes, using a sample request ID
const SAMPLE_REQUEST_ID = "sample-request-001";

export default function FieldApp() {
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>("point");
  const [isCapturing, setIsCapturing] = useState(false);
  const [surveyStats, setSurveyStats] = useState<SurveyStats>({
    pointsCount: 0,
    linesCount: 0,
    polygonsCount: 0,
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
  const { data: surveyPoints = [] } = useQuery({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "points"],
  });

  const { data: surveyLines = [] } = useQuery({
    queryKey: ["/api/survey-requests", SAMPLE_REQUEST_ID, "lines"],
  });

  const { data: surveyPolygons = [] } = useQuery({
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
      toast({
        title: "خطأ في الرفع",
        description: "فشل في رفع النقطة",
        variant: "destructive",
      });
    },
  });

  // Update survey stats when data changes
  useEffect(() => {
    setSurveyStats({
      pointsCount: surveyPoints.length,
      linesCount: surveyLines.length,
      polygonsCount: surveyPolygons.length,
    });
  }, [surveyPoints, surveyLines, surveyPolygons]);

  // GPS simulation
  useEffect(() => {
    gpsSimulator.start();
    
    const handleGPSUpdate = (data: GPSData) => {
      setGpsData(data);
    };

    gpsSimulator.onUpdate(handleGPSUpdate);

    return () => {
      gpsSimulator.stop();
      gpsSimulator.removeCallback(handleGPSUpdate);
    };
  }, []);

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
  };

  const handleCapturePoint = async (featureCode: string) => {
    if (!gpsData) {
      toast({
        title: "خطأ في GPS",
        description: "لا يوجد إشارة GPS",
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);
    
    try {
      // Simulate high-precision capture
      const preciseData = await gpsSimulator.capturePoint();
      
      const pointData = {
        pointNumber: generatePointNumber(surveyPoints.length),
        featureCode,
        featureType: "point",
        longitude: preciseData.longitude,
        latitude: preciseData.latitude,
        elevation: preciseData.elevation,
        accuracy: preciseData.accuracy,
        capturedBy: "أحمد المساحي", // In real app, get from auth
        notes: null,
        photos: [],
      };

      await createPointMutation.mutateAsync(pointData);
    } catch (error) {
      console.error("Error capturing point:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAddPhoto = () => {
    toast({
      title: "إضافة صورة",
      description: "سيتم تنفيذ هذه الميزة قريباً",
    });
  };

  const handleSave = () => {
    toast({
      title: "تم الحفظ",
      description: "تم حفظ جميع البيانات بنجاح",
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    console.log(`Map clicked at: ${lat}, ${lng}`);
    // In a real app, this could be used for manual point placement
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تطبيق المساح الميداني المتقدم</h1>
        <p className="text-gray-600">رفع البيانات المساحية بدقة عالية</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Panel - GPS and Tools */}
        <div className="lg:w-1/3 space-y-6">
          <GPSPanel 
            gpsData={gpsData} 
            isConnected={true} 
          />
          
          <SurveyTools
            activeTool={activeTool}
            onToolChange={handleToolChange}
            onCapturePoint={handleCapturePoint}
            onAddPhoto={handleAddPhoto}
            onSave={handleSave}
            isCapturing={isCapturing}
          />
        </div>

        {/* Right Panel - Map and Progress */}
        <div className="lg:w-2/3 space-y-6">
          <InteractiveMap
            currentPosition={gpsData}
            surveyPoints={surveyPoints}
            surveyLines={surveyLines}
            surveyPolygons={surveyPolygons}
            onMapClick={handleMapClick}
          />
          
          <SurveyProgress stats={surveyStats} />
        </div>
      </div>

      {/* Connection Status */}
      <div className="fixed bottom-4 right-4">
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
          wsConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {wsConnected ? 'متصل بالخادم' : 'غير متصل بالخادم'}
        </div>
      </div>
    </div>
  );
}
