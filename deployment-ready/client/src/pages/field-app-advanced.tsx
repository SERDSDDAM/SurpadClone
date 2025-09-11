import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MapPin,
  Target, 
  Navigation,
  Camera,
  Save,
  Trash2,
  Plus,
  Minus,
  Map,
  Layers,
  Satellite,
  Signal,
  Battery,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Square,
  Circle,
  Triangle,
  Download,
  Upload,
  Settings,
  Users,
  FileText
} from "lucide-react";

// Mock GNSS Connection Status
const useGNSSConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [satelliteCount, setSatelliteCount] = useState(0);

  useEffect(() => {
    // Simulate GNSS connection
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.2); // 80% connection rate
      setAccuracy(Math.random() * 5 + 0.5); // 0.5-5.5m accuracy
      setSatelliteCount(Math.floor(Math.random() * 12) + 8); // 8-20 satellites
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { isConnected, accuracy, satelliteCount };
};

// Feature Codes for Smart Coding
const FEATURE_CODES = {
  points: [
    { code: "CORNER", name: "ركن مبنى", category: "مباني" },
    { code: "TREE", name: "شجرة", category: "نباتات" },
    { code: "LIGHT_POLE", name: "عمود إنارة", category: "مرافق" },
    { code: "WATER_POINT", name: "نقطة مياه", category: "مرافق" },
    { code: "BOUNDARY_STONE", name: "حجر حدود", category: "حدود" }
  ],
  lines: [
    { code: "FENCE", name: "سور", category: "حدود" },
    { code: "SIDEWALK", name: "رصيف", category: "طرق" },
    { code: "BUILDING_EDGE", name: "ضلع مبنى", category: "مباني" },
    { code: "POWER_LINE", name: "خط كهرباء", category: "مرافق" },
    { code: "ROAD_EDGE", name: "حافة طريق", category: "طرق" }
  ],
  polygons: [
    { code: "BUILDING", name: "مبنى", category: "مباني" },
    { code: "GARDEN", name: "حديقة", category: "مساحات خضراء" },
    { code: "PARKING", name: "موقف سيارات", category: "مواقف" },
    { code: "COURTYARD", name: "فناء", category: "مساحات مفتوحة" },
    { code: "WATER_TANK", name: "خزان مياه", category: "مرافق" }
  ]
};

export default function AdvancedFieldApp() {
  const [activeMode, setActiveMode] = useState<"point" | "line" | "polygon">("point");
  const [selectedFeatureCode, setSelectedFeatureCode] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<any>(null);
  const [points, setPoints] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const { isConnected, accuracy, satelliteCount } = useGNSSConnection();

  // Mock survey request data
  const surveyRequest = {
    id: "123",
    requestNumber: "SR-2025-001",
    ownerName: "محمد أحمد علي",
    location: "حي الزهراء، صنعاء",
    status: "field_survey_in_progress"
  };

  // Mock current location
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 15.3694,
    longitude: 44.1910
  });

  const capturePoint = () => {
    if (!selectedFeatureCode) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار كود المعلم أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "خطأ في الاتصال",
        description: "لا يوجد اتصال بجهاز GNSS",
        variant: "destructive",
      });
      return;
    }

    const newPoint = {
      id: Date.now(),
      latitude: currentLocation.latitude + (Math.random() - 0.5) * 0.001,
      longitude: currentLocation.longitude + (Math.random() - 0.5) * 0.001,
      elevation: 2200 + Math.random() * 100,
      accuracy: accuracy,
      featureCode: selectedFeatureCode,
      featureType: activeMode,
      timestamp: new Date().toISOString(),
      notes: notes
    };

    setPoints([...points, newPoint]);
    setNotes("");

    toast({
      title: "تم رفع النقطة",
      description: `النقطة ${newPoint.id} - ${selectedFeatureCode}`,
    });
  };

  const startDrawing = () => {
    if (!selectedFeatureCode) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار كود المعلم أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsDrawing(true);
    setCurrentFeature({
      featureCode: selectedFeatureCode,
      featureType: activeMode,
      points: [],
      startTime: new Date().toISOString()
    });
  };

  const addPointToFeature = () => {
    if (!isConnected || !isDrawing) return;

    const newPoint = {
      latitude: currentLocation.latitude + (Math.random() - 0.5) * 0.001,
      longitude: currentLocation.longitude + (Math.random() - 0.5) * 0.001,
      elevation: 2200 + Math.random() * 100,
      accuracy: accuracy,
      timestamp: new Date().toISOString()
    };

    setCurrentFeature(prev => ({
      ...prev,
      points: [...prev.points, newPoint]
    }));

    toast({
      title: "تم إضافة نقطة",
      description: `نقطة رقم ${currentFeature?.points?.length + 1 || 1}`,
    });
  };

  const finishFeature = () => {
    if (!currentFeature || currentFeature.points.length < 2) {
      toast({
        title: "خطأ",
        description: "المعلم يحتاج على الأقل نقطتين",
        variant: "destructive",
      });
      return;
    }

    // For polygons, optionally close the shape
    if (activeMode === "polygon" && currentFeature.points.length >= 3) {
      const firstPoint = currentFeature.points[0];
      const lastPoint = currentFeature.points[currentFeature.points.length - 1];
      
      // Check if user wants to close polygon
      const shouldClose = window.confirm("هل تريد إغلاق المضلع؟");
      if (shouldClose) {
        setCurrentFeature(prev => ({
          ...prev,
          points: [...prev.points, firstPoint],
          isClosed: true
        }));
      }
    }

    // Save feature
    const completedFeature = {
      ...currentFeature,
      id: Date.now(),
      endTime: new Date().toISOString(),
      isCompleted: true
    };

    // Add to points array for display
    setPoints([...points, ...currentFeature.points.map((point, index) => ({
      ...point,
      id: Date.now() + index,
      featureCode: currentFeature.featureCode,
      featureType: currentFeature.featureType,
      sequenceOrder: index + 1
    }))]);

    setIsDrawing(false);
    setCurrentFeature(null);
    setSelectedFeatureCode("");

    toast({
      title: "تم إنهاء المعلم",
      description: `${currentFeature.featureCode} - ${currentFeature.points.length} نقطة`,
    });
  };

  const getAccuracyColor = () => {
    if (accuracy < 1) return "text-green-600";
    if (accuracy < 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getConnectionStatus = () => {
    if (isConnected && accuracy < 2) return { color: "text-green-600", text: "ممتاز" };
    if (isConnected && accuracy < 5) return { color: "text-yellow-600", text: "جيد" };
    if (isConnected) return { color: "text-orange-600", text: "مقبول" };
    return { color: "text-red-600", text: "منقطع" };
  };

  const status = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header with GNSS Status */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-gray-900">تطبيق المساح الميداني</h1>
              <p className="text-sm text-gray-600">{surveyRequest.requestNumber}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* GNSS Status */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <div className="text-right">
                  <p className={`text-xs font-medium ${status.color}`}>{status.text}</p>
                  <p className="text-xs text-gray-500">{satelliteCount} أقمار</p>
                </div>
              </div>

              {/* Battery */}
              <div className="flex items-center gap-1">
                <Battery className="h-4 w-4 text-green-600" />
                <span className="text-sm">87%</span>
              </div>
            </div>
          </div>

          {/* Accuracy Info */}
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className={`h-4 w-4 ${getAccuracyColor()}`} />
              <span>الدقة: {accuracy.toFixed(2)}م</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>{currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Survey Request Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{surveyRequest.ownerName}</h3>
                <p className="text-sm text-gray-600">{surveyRequest.location}</p>
              </div>
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                قيد الرفع الميداني
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Mode Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">نوع المعلم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={activeMode === "point" ? "default" : "outline"}
                onClick={() => setActiveMode("point")}
                className="flex flex-col items-center p-4 h-auto"
                disabled={isDrawing}
              >
                <Circle className="h-5 w-5 mb-1" />
                <span className="text-sm">نقطة</span>
              </Button>
              
              <Button
                variant={activeMode === "line" ? "default" : "outline"}
                onClick={() => setActiveMode("line")}
                className="flex flex-col items-center p-4 h-auto"
                disabled={isDrawing}
              >
                <Minus className="h-5 w-5 mb-1" />
                <span className="text-sm">خط</span>
              </Button>
              
              <Button
                variant={activeMode === "polygon" ? "default" : "outline"}
                onClick={() => setActiveMode("polygon")}
                className="flex flex-col items-center p-4 h-auto"
                disabled={isDrawing}
              >
                <Square className="h-5 w-5 mb-1" />
                <span className="text-sm">مضلع</span>
              </Button>
            </div>

            {/* Feature Code Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">كود المعلم:</label>
              <Select value={selectedFeatureCode} onValueChange={setSelectedFeatureCode}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر كود المعلم" />
                </SelectTrigger>
                <SelectContent>
                  {FEATURE_CODES[`${activeMode}s` as keyof typeof FEATURE_CODES].map((code) => (
                    <SelectItem key={code.code} value={code.code}>
                      {code.name} ({code.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات:</label>
              <Textarea
                placeholder="ملاحظات حول المعلم..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-4">
            {!isDrawing ? (
              <div className="grid grid-cols-2 gap-3">
                {activeMode === "point" ? (
                  <Button
                    onClick={capturePoint}
                    disabled={!isConnected || !selectedFeatureCode}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Target className="h-4 w-4" />
                    رفع نقطة
                  </Button>
                ) : (
                  <Button
                    onClick={startDrawing}
                    disabled={!isConnected || !selectedFeatureCode}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    بدء الرسم
                  </Button>
                )}
                
                <Button variant="outline" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  التقاط صورة
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <Navigation className="h-4 w-4" />
                  <AlertDescription>
                    وضع الرسم نشط - {currentFeature?.points?.length || 0} نقطة تم رفعها
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={addPointToFeature}
                    disabled={!isConnected}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    إضافة نقطة
                  </Button>
                  
                  <Button
                    onClick={finishFeature}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    إنهاء المعلم
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points Summary */}
        {points.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>النقاط المرفوعة ({points.length})</span>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Upload className="h-3 w-3" />
                  مزامنة
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {points.slice(-5).map((point) => (
                  <div key={point.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{point.featureCode}</p>
                      <p className="text-xs text-gray-600">
                        {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600">±{point.accuracy.toFixed(2)}م</p>
                      <p className="text-xs text-gray-500">{new Date(point.timestamp).toLocaleTimeString('ar')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            تصدير البيانات
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            إعدادات الجهاز
          </Button>
        </div>
      </div>
    </div>
  );
}