import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Satellite, Wifi } from "lucide-react";
import { GPSData } from "@/types/survey";
import { formatCoordinate } from "@/lib/survey-utils";

interface GPSPanelProps {
  gpsData: GPSData | null;
  isConnected: boolean;
}

export function GPSPanel({ gpsData, isConnected }: GPSPanelProps) {
  return (
    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Satellite className="mr-2 h-5 w-5" />
          حالة نظام تحديد المواقع (GNSS)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span>حالة الاتصال:</span>
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className={isConnected ? "bg-green-800" : ""}
            data-testid="gps-connection-status"
          >
            {isConnected ? "متصل" : "غير متصل"}
          </Badge>
        </div>
        
        {gpsData && (
          <>
            <div className="flex justify-between items-center">
              <span>دقة الموقع:</span>
              <span className="font-mono" data-testid="gps-accuracy">
                ±{(gpsData.accuracy * 100).toFixed(1)} سم
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>عدد الأقمار:</span>
              <span className="font-mono" data-testid="satellite-count">
                {gpsData.satelliteCount}
              </span>
            </div>
            
            <div className="space-y-1 pt-2 border-t border-green-400">
              <div className="flex justify-between items-center text-sm">
                <span>خط الطول:</span>
                <span className="font-mono" data-testid="longitude">
                  {formatCoordinate(gpsData.longitude, 'lon')}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>خط العرض:</span>
                <span className="font-mono" data-testid="latitude">
                  {formatCoordinate(gpsData.latitude, 'lat')}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>الارتفاع:</span>
                <span className="font-mono" data-testid="elevation">
                  {gpsData.elevation?.toFixed(1) || '--'} م
                </span>
              </div>
            </div>
          </>
        )}
        
        {!gpsData && (
          <div className="flex items-center justify-center py-4 text-green-200">
            <Wifi className="mr-2 h-4 w-4" />
            <span>جارٍ الاتصال بنظام تحديد المواقع...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
