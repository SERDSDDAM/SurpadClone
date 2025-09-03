import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Satellite, 
  Bluetooth, 
  Wifi, 
  MapPin, 
  Signal, 
  Battery, 
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface GNSSDevice {
  id: string;
  name: string;
  type: 'RTK' | 'DGPS' | 'Standard';
  connected: boolean;
  batteryLevel?: number;
  signalStrength: number;
}

interface GNSSFix {
  type: '2D' | '3D' | 'RTK_FLOAT' | 'RTK_FIXED';
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  hdop: number;
  vdop: number;
  pdop: number;
  satelliteCount: number;
  timestamp: Date;
}

interface GNSSStatusPanelProps {
  currentFix: GNSSFix;
  onFixUpdate: (fix: GNSSFix) => void;
}

export default function GNSSStatusPanel({ currentFix, onFixUpdate }: GNSSStatusPanelProps) {
  const [devices, setDevices] = useState<GNSSDevice[]>([
    {
      id: 'trimble-r12',
      name: 'Trimble R12',
      type: 'RTK',
      connected: true,
      batteryLevel: 85,
      signalStrength: 92
    },
    {
      id: 'internal-gps',
      name: 'GPS داخلي',
      type: 'Standard',
      connected: true,
      signalStrength: 65
    }
  ]);

  const [selectedDevice, setSelectedDevice] = useState<string>('trimble-r12');
  const [isSimulation, setIsSimulation] = useState(true);
  const [rtkAge, setRtkAge] = useState<number>(2.3); // Age of RTK correction in seconds

  // محاكاة تحديث بيانات GNSS
  useEffect(() => {
    if (!isSimulation) return;

    const interval = setInterval(() => {
      const newFix: GNSSFix = {
        ...currentFix,
        accuracy: Math.max(0.001, currentFix.accuracy + (Math.random() - 0.5) * 0.002),
        hdop: Math.max(0.5, currentFix.hdop + (Math.random() - 0.5) * 0.1),
        vdop: Math.max(0.5, currentFix.vdop + (Math.random() - 0.5) * 0.1),
        pdop: Math.max(0.7, currentFix.pdop + (Math.random() - 0.5) * 0.1),
        satelliteCount: Math.max(8, Math.min(16, currentFix.satelliteCount + Math.floor((Math.random() - 0.5) * 3))),
        timestamp: new Date()
      };

      // تحديث عمر تصحيح RTK
      setRtkAge(prev => prev + 1 + Math.random());
      if (rtkAge > 30) {
        setRtkAge(Math.random() * 5);
      }

      onFixUpdate(newFix);
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulation, currentFix, rtkAge, onFixUpdate]);

  // محاكاة اكتشاف أجهزة Bluetooth
  const scanForDevices = () => {
    // محاكاة البحث عن أجهزة
    setTimeout(() => {
      setDevices(prev => [...prev, {
        id: 'leica-gs18t',
        name: 'Leica GS18T',
        type: 'RTK',
        connected: false,
        batteryLevel: 72,
        signalStrength: 88
      }]);
    }, 2000);
  };

  const connectDevice = (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, connected: true }
        : { ...device, connected: false }
    ));
    setSelectedDevice(deviceId);
  };

  const getFixQuality = (fix: GNSSFix) => {
    if (fix.type === 'RTK_FIXED' && fix.accuracy <= 0.02) return 'ممتاز';
    if (fix.type === 'RTK_FLOAT' && fix.accuracy <= 0.05) return 'جيد جداً';
    if (fix.type === '3D' && fix.accuracy <= 0.5) return 'جيد';
    if (fix.type === '2D') return 'ضعيف';
    return 'غير مناسب';
  };

  const getFixColor = (fix: GNSSFix) => {
    if (fix.type === 'RTK_FIXED' && fix.accuracy <= 0.02) return 'text-green-600';
    if (fix.type === 'RTK_FLOAT' && fix.accuracy <= 0.05) return 'text-blue-600';
    if (fix.type === '3D' && fix.accuracy <= 0.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const connectedDevice = devices.find(d => d.id === selectedDevice);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Satellite className="h-5 w-5" />
          حالة GNSS
          <Badge 
            variant={currentFix.type === 'RTK_FIXED' ? 'default' : 'secondary'}
            className="ml-auto"
          >
            {currentFix.type.replace('_', ' ')}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* الجهاز المتصل */}
        {connectedDevice && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bluetooth className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">{connectedDevice.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {connectedDevice.batteryLevel && (
                  <div className="flex items-center gap-1">
                    <Battery className="h-4 w-4" />
                    <span className="text-xs">{connectedDevice.batteryLevel}%</span>
                  </div>
                )}
                <Badge variant={connectedDevice.connected ? 'default' : 'secondary'}>
                  {connectedDevice.connected ? 'متصل' : 'غير متصل'}
                </Badge>
              </div>
            </div>

            {connectedDevice.connected && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>قوة الإشارة</span>
                  <span>{connectedDevice.signalStrength}%</span>
                </div>
                <Progress value={connectedDevice.signalStrength} className="h-2" />
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* معلومات الإحداثية الحالية */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">الإحداثية الحالية</h4>
            <Badge 
              variant={
                currentFix.type === 'RTK_FIXED' ? 'default' :
                currentFix.type === 'RTK_FLOAT' ? 'secondary' : 'outline'
              }
              className={getFixColor(currentFix)}
            >
              {getFixQuality(currentFix)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">خط العرض</div>
              <div className="font-mono text-xs">{currentFix.latitude.toFixed(8)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">خط الطول</div>
              <div className="font-mono text-xs">{currentFix.longitude.toFixed(8)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">الارتفاع</div>
              <div className="font-mono text-xs">{currentFix.altitude.toFixed(2)} م</div>
            </div>
            <div>
              <div className="text-muted-foreground">الدقة</div>
              <div className="font-mono text-xs">{(currentFix.accuracy * 100).toFixed(1)} سم</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* مؤشرات الجودة */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">مؤشرات الجودة</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>HDOP</span>
                <span>{currentFix.hdop.toFixed(1)}</span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, (3 - currentFix.hdop) / 3 * 100))} 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>الأقمار</span>
                <span>{currentFix.satelliteCount}</span>
              </div>
              <Progress 
                value={Math.min(100, (currentFix.satelliteCount / 16) * 100)} 
                className="h-2" 
              />
            </div>
          </div>

          {/* RTK Information */}
          {currentFix.type.startsWith('RTK') && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <MapPin className="h-4 w-4" />
                <span className="font-medium text-sm">RTK Status</span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                عمر التصحيح: {rtkAge.toFixed(1)} ثانية
                {rtkAge > 30 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    قديم
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* أزرار التحكم */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={scanForDevices}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              بحث عن أجهزة
            </Button>
            
            <Button
              onClick={() => setIsSimulation(!isSimulation)}
              variant="ghost"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              {isSimulation ? 'محاكاة' : 'حقيقي'}
            </Button>
          </div>

          {/* قائمة الأجهزة المتاحة */}
          <div className="space-y-1">
            {devices.map((device) => (
              <div 
                key={device.id}
                className={`p-2 rounded border cursor-pointer transition-colors ${
                  device.id === selectedDevice 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => connectDevice(device.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      device.connected ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className="text-sm font-medium">{device.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {device.type}
                    </Badge>
                  </div>
                  
                  {device.batteryLevel && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Battery className="h-3 w-3" />
                      {device.batteryLevel}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* تحذيرات الجودة */}
        {(currentFix.hdop > 2.0 || currentFix.accuracy > 0.1 || currentFix.satelliteCount < 8) && (
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium text-sm">تحذير الجودة</span>
            </div>
            <div className="text-xs text-orange-600 mt-1">
              {currentFix.hdop > 2.0 && 'HDOP مرتفع - '}
              {currentFix.accuracy > 0.1 && 'دقة منخفضة - '}
              {currentFix.satelliteCount < 8 && 'أقمار قليلة - '}
              يُنصح بتحسين الاستقبال قبل المسح
            </div>
          </div>
        )}

        {/* آخر تحديث */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          آخر تحديث: {currentFix.timestamp.toLocaleTimeString('ar-EG')}
        </div>
      </CardContent>
    </Card>
  );
}