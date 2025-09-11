import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Map, 
  Download, 
  Trash2, 
  HardDrive, 
  Wifi,
  WifiOff,
  MapPin
} from "lucide-react";

interface MapArea {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  size: number; // in MB
  downloadProgress?: number;
  isDownloaded: boolean;
  lastUpdated?: Date;
}

export function OfflineMapsManager() {
  const [mapAreas, setMapAreas] = useState<MapArea[]>([
    {
      id: "sanaa-center",
      name: "وسط مدينة صنعاء",
      bounds: { north: 15.4, south: 15.3, east: 44.25, west: 44.15 },
      size: 125,
      isDownloaded: true,
      lastUpdated: new Date("2024-01-15")
    },
    {
      id: "sanaa-north",
      name: "شمال صنعاء",
      bounds: { north: 15.5, south: 15.4, east: 44.25, west: 44.15 },
      size: 98,
      isDownloaded: false
    }
  ]);

  const [totalStorageUsed, setTotalStorageUsed] = useState(125); // MB
  const [availableStorage] = useState(2048); // MB (2GB)

  const handleDownloadMap = (areaId: string) => {
    setMapAreas(prev => prev.map(area => 
      area.id === areaId 
        ? { ...area, downloadProgress: 0 }
        : area
    ));

    // Simulate download progress
    const interval = setInterval(() => {
      setMapAreas(prev => prev.map(area => {
        if (area.id === areaId && area.downloadProgress !== undefined) {
          const newProgress = area.downloadProgress + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return {
              ...area,
              downloadProgress: undefined,
              isDownloaded: true,
              lastUpdated: new Date()
            };
          }
          return { ...area, downloadProgress: newProgress };
        }
        return area;
      }));
    }, 500);
  };

  const handleDeleteMap = (areaId: string) => {
    setMapAreas(prev => prev.map(area => 
      area.id === areaId 
        ? { ...area, isDownloaded: false, lastUpdated: undefined }
        : area
    ));
    
    const deletedArea = mapAreas.find(area => area.id === areaId);
    if (deletedArea) {
      setTotalStorageUsed(prev => prev - deletedArea.size);
    }
  };

  const storagePercentage = (totalStorageUsed / availableStorage) * 100;

  return (
    <div className="space-y-4">
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            معلومات التخزين
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>المستخدم: {totalStorageUsed} ميجابايت</span>
            <span>المتاح: {availableStorage} ميجابايت</span>
          </div>
          <Progress value={storagePercentage} className="h-2" />
          <div className="text-xs text-gray-500">
            {(storagePercentage).toFixed(1)}% مستخدم من إجمالي التخزين
          </div>
        </CardContent>
      </Card>

      {/* Map Areas List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            المناطق المحفوظة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mapAreas.map((area) => (
            <div
              key={area.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{area.name}</span>
                  <Badge variant={area.isDownloaded ? "default" : "outline"}>
                    {area.isDownloaded ? (
                      <div className="flex items-center gap-1">
                        <WifiOff className="h-3 w-3" />
                        محفوظ
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Wifi className="h-3 w-3" />
                        غير محفوظ
                      </div>
                    )}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 mt-1">
                  الحجم: {area.size} ميجابايت
                  {area.lastUpdated && (
                    <span className="mx-2">•</span>
                  )}
                  {area.lastUpdated && (
                    <span>آخر تحديث: {area.lastUpdated.toLocaleDateString('ar')}</span>
                  )}
                </div>

                {area.downloadProgress !== undefined && (
                  <div className="mt-2">
                    <Progress value={area.downloadProgress} className="h-1" />
                    <div className="text-xs text-gray-500 mt-1">
                      جاري التحميل... {area.downloadProgress}%
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!area.isDownloaded && area.downloadProgress === undefined && (
                  <Button
                    size="sm"
                    onClick={() => handleDownloadMap(area.id)}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    تحميل
                  </Button>
                )}
                
                {area.isDownloaded && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteMap(area.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Current Location Map Download */}
      <Card>
        <CardHeader>
          <CardTitle>تحميل المنطقة الحالية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            الموقع الحالي: صنعاء، اليمن
          </div>
          <div className="text-sm text-gray-600">
            الحجم المتوقع: ~150 ميجابايت
          </div>
          <Button className="w-full" disabled>
            <Download className="h-4 w-4 mr-2" />
            تحميل خرائط المنطقة الحالية
          </Button>
          <div className="text-xs text-gray-500">
            يتطلب اتصال إنترنت نشط لتحميل الخرائط
          </div>
        </CardContent>
      </Card>
    </div>
  );
}