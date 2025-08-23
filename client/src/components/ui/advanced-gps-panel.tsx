import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Satellite, Signal, Clock, MapPin, AlertTriangle, CheckCircle } from "lucide-react";

interface GPSData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  hdop: number; // Horizontal Dilution of Precision
  vdop: number; // Vertical Dilution of Precision
  pdop: number; // Position Dilution of Precision
  satelliteCount: number;
  fixType: "2D" | "3D" | "RTK_FLOAT" | "RTK_FIXED";
  timestamp: Date;
}

interface AdvancedGPSPanelProps {
  gpsData: GPSData;
  onLocationCapture: (location: GPSData) => void;
  isCapturing: boolean;
  className?: string;
}

export function AdvancedGPSPanel({ 
  gpsData, 
  onLocationCapture, 
  isCapturing, 
  className = "" 
}: AdvancedGPSPanelProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [quality, setQuality] = useState<"excellent" | "good" | "fair" | "poor">("poor");

  useEffect(() => {
    // Determine GPS quality based on accuracy and DOP values
    if (gpsData.accuracy <= 0.01 && gpsData.hdop <= 1) {
      setQuality("excellent");
    } else if (gpsData.accuracy <= 0.1 && gpsData.hdop <= 2) {
      setQuality("good");
    } else if (gpsData.accuracy <= 1 && gpsData.hdop <= 5) {
      setQuality("fair");
    } else {
      setQuality("poor");
    }

    setIsConnected(gpsData.satelliteCount > 4);
  }, [gpsData]);

  const formatCoordinate = (coord: number, precision: number = 8) => {
    return coord.toFixed(precision);
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent": return "text-green-600 bg-green-100";
      case "good": return "text-blue-600 bg-blue-100";
      case "fair": return "text-yellow-600 bg-yellow-100";
      case "poor": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getFixTypeColor = (fixType: string) => {
    switch (fixType) {
      case "RTK_FIXED": return "text-green-600 bg-green-100";
      case "RTK_FLOAT": return "text-blue-600 bg-blue-100";
      case "3D": return "text-yellow-600 bg-yellow-100";
      case "2D": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Card className={`${className} shadow-sm border-2 ${isConnected ? 'border-green-200' : 'border-red-200'}`} data-testid="advanced-gps-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Satellite className={`w-5 h-5 ${isConnected ? 'text-green-600' : 'text-red-600'}`} />
          بيانات GNSS المتقدمة
          {isConnected ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">حالة الاتصال:</span>
          <Badge 
            className={isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
            data-testid="connection-status"
          >
            {isConnected ? "متصل" : "غير متصل"}
          </Badge>
        </div>

        <Separator />

        {/* Position Data */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">خط الطول (X)</span>
            </div>
            <div className="text-lg font-mono" data-testid="longitude">
              {formatCoordinate(gpsData.longitude)}°
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">دائرة العرض (Y)</span>
            </div>
            <div className="text-lg font-mono" data-testid="latitude">
              {formatCoordinate(gpsData.latitude)}°
            </div>
          </div>
        </div>

        {/* Elevation */}
        {gpsData.altitude && (
          <div>
            <span className="text-sm font-medium">الارتفاع: </span>
            <span className="text-lg font-mono" data-testid="elevation">
              {gpsData.altitude.toFixed(3)} م
            </span>
          </div>
        )}

        <Separator />

        {/* Accuracy & Quality */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">جودة الإشارة:</span>
            <Badge className={getQualityColor(quality)} data-testid="signal-quality">
              {quality === "excellent" ? "ممتازة" : 
               quality === "good" ? "جيدة" : 
               quality === "fair" ? "متوسطة" : "ضعيفة"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">نوع التثبيت:</span>
            <Badge className={getFixTypeColor(gpsData.fixType)} data-testid="fix-type">
              {gpsData.fixType}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">الدقة الأفقية:</span>
            <span className="text-sm font-mono" data-testid="accuracy">
              ±{gpsData.accuracy.toFixed(3)} م
            </span>
          </div>
        </div>

        <Separator />

        {/* DOP Values */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">HDOP</div>
            <div className="text-sm font-mono" data-testid="hdop-value">
              {gpsData.hdop.toFixed(1)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">VDOP</div>
            <div className="text-sm font-mono" data-testid="vdop-value">
              {gpsData.vdop.toFixed(1)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">PDOP</div>
            <div className="text-sm font-mono" data-testid="pdop-value">
              {gpsData.pdop.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Satellite Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">عدد الأقمار:</span>
          </div>
          <span className="text-lg font-bold" data-testid="satellite-count">
            {gpsData.satelliteCount}
          </span>
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>آخر تحديث:</span>
          </div>
          <span data-testid="gps-timestamp">
            {gpsData.timestamp.toLocaleTimeString('ar-YE')}
          </span>
        </div>

        {/* Capture Button */}
        <button
          onClick={() => onLocationCapture(gpsData)}
          disabled={!isConnected || quality === "poor" || isCapturing}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isConnected && quality !== "poor" 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          data-testid="capture-location-btn"
        >
          {isCapturing ? "جاري التسجيل..." : "تسجيل الموقع"}
        </button>
      </CardContent>
    </Card>
  );
}