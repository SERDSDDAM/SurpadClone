import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Satellite, 
  Target, 
  Navigation, 
  Activity,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle 
} from "lucide-react";

interface AdvancedGPSData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  hdop: number;
  vdop: number;
  pdop: number;
  satelliteCount: number;
  fixType: "2D" | "3D" | "RTK_FLOAT" | "RTK_FIXED";
  timestamp: Date;
}

interface AdvancedGPSPanelProps {
  gpsData: AdvancedGPSData;
  isConnected: boolean;
  onCapture: () => void;
  isCapturing: boolean;
}

const fixTypeColors = {
  "2D": "bg-red-500",
  "3D": "bg-yellow-500", 
  "RTK_FLOAT": "bg-blue-500",
  "RTK_FIXED": "bg-green-500"
};

const fixTypeLabels = {
  "2D": "2D",
  "3D": "3D",
  "RTK_FLOAT": "RTK عائم",
  "RTK_FIXED": "RTK ثابت"
};

function formatCoordinate(value: number, type: 'lat' | 'lng'): string {
  const direction = type === 'lat' ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  return `${Math.abs(value).toFixed(6)}° ${direction}`;
}

export function AdvancedGPSPanel({ 
  gpsData, 
  isConnected, 
  onCapture, 
  isCapturing 
}: AdvancedGPSPanelProps) {
  const accuracyPercentage = Math.min(100, Math.max(0, (1 - gpsData.accuracy) * 100));
  
  return (
    <Card className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            <span>GPS المتقدم</span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="bg-green-600">
                <Wifi className="h-3 w-3 ml-1" />
                متصل
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="h-3 w-3 ml-1" />
                غير متصل
              </Badge>
            )}
            <Badge 
              className={`text-white ${fixTypeColors[gpsData.fixType]}`}
            >
              {fixTypeLabels[gpsData.fixType]}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Coordinates */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">خط العرض:</span>
            <span className="text-sm font-mono">{formatCoordinate(gpsData.latitude, 'lat')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">خط الطول:</span>
            <span className="text-sm font-mono">{formatCoordinate(gpsData.longitude, 'lng')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">الارتفاع:</span>
            <span className="text-sm font-mono">{gpsData.altitude.toFixed(2)} م</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Accuracy & Quality */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">الدقة:</span>
            <span className="text-sm font-mono text-green-600">±{(gpsData.accuracy * 100).toFixed(1)} سم</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>جودة الإشارة</span>
              <span>{accuracyPercentage.toFixed(0)}%</span>
            </div>
            <Progress 
              value={accuracyPercentage} 
              className="h-2"
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Satellite Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{gpsData.satelliteCount}</div>
            <div className="text-xs text-gray-500">أقمار صناعية</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{gpsData.hdop.toFixed(1)}</div>
            <div className="text-xs text-gray-500">HDOP</div>
          </div>
        </div>
        
        {/* DOP Values */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium">HDOP: {gpsData.hdop.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="font-medium">VDOP: {gpsData.vdop.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="font-medium">PDOP: {gpsData.pdop.toFixed(2)}</div>
          </div>
        </div>
        
        <Separator />
        
        {/* Capture Button */}
        <Button 
          onClick={onCapture}
          disabled={!isConnected || isCapturing || gpsData.accuracy > 0.05}
          className="w-full"
          size="lg"
          data-testid="button-capture-point"
        >
          {isCapturing ? (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse" />
              جاري الرفع...
            </div>
          ) : gpsData.accuracy > 0.05 ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              دقة غير كافية
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              رفع نقطة GPS
            </div>
          )}
        </Button>
        
        {/* Status Indicators */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>آخر تحديث: {gpsData.timestamp.toLocaleTimeString('ar')}</span>
          {gpsData.accuracy <= 0.02 && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>دقة عالية</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}