import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bluetooth, 
  Search, 
  Zap, 
  Ruler,
  Satellite,
  Power,
  Settings,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface BluetoothDevice {
  id: string;
  name: string;
  type: "gnss" | "laser" | "level";
  batteryLevel?: number;
  signalStrength: number;
  isConnected: boolean;
  status: "connected" | "connecting" | "disconnected" | "error";
  lastSeen?: Date;
}

const deviceIcons = {
  gnss: Satellite,
  laser: Ruler,
  level: Zap
};

const statusColors = {
  connected: "bg-green-600",
  connecting: "bg-yellow-600",
  disconnected: "bg-gray-400",
  error: "bg-red-600"
};

export function BluetoothDeviceManager() {
  const [devices, setDevices] = useState<BluetoothDevice[]>([
    {
      id: "gnss-001",
      name: "RTK GNSS Receiver",
      type: "gnss",
      batteryLevel: 85,
      signalStrength: 92,
      isConnected: false,
      status: "disconnected",
      lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      id: "laser-001", 
      name: "Laser Distance Meter",
      type: "laser",
      batteryLevel: 65,
      signalStrength: 78,
      isConnected: false,
      status: "disconnected",
      lastSeen: new Date(Date.now() - 120000) // 2 minutes ago
    }
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

  const handleDeviceConnect = async (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, status: "connecting" }
        : device
    ));

    // Simulate connection process
    setTimeout(() => {
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { 
              ...device, 
              status: "connected",
              isConnected: true,
              lastSeen: new Date()
            }
          : device
      ));
    }, 2000);
  };

  const handleDeviceDisconnect = (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { 
            ...device, 
            status: "disconnected",
            isConnected: false
          }
        : device
    ));
  };

  const handleScanForDevices = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Could add new devices here
    }, 3000);
  };

  const getStatusText = (status: BluetoothDevice['status']): string => {
    switch (status) {
      case 'connected': return 'متصل';
      case 'connecting': return 'جاري الاتصال...';
      case 'disconnected': return 'غير متصل';
      case 'error': return 'خطأ في الاتصال';
    }
  };

  const getDeviceTypeText = (type: BluetoothDevice['type']): string => {
    switch (type) {
      case 'gnss': return 'جهاز GNSS';
      case 'laser': return 'جهاز قياس الليزر';
      case 'level': return 'ميزان رقمي';
    }
  };

  return (
    <div className="space-y-4">
      {/* Bluetooth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bluetooth className="h-5 w-5" />
              حالة البلوتوث
            </div>
            <Badge variant={bluetoothEnabled ? "default" : "destructive"}>
              {bluetoothEnabled ? "مفعل" : "معطل"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">الأجهزة المتصلة</span>
            <span className="text-lg font-bold text-blue-600">
              {devices.filter(d => d.isConnected).length}
            </span>
          </div>
          <Button
            onClick={handleScanForDevices}
            disabled={!bluetoothEnabled || isScanning}
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {isScanning ? "جاري البحث..." : "البحث عن أجهزة"}
          </Button>
        </CardContent>
      </Card>

      {/* Connected Devices */}
      <Card>
        <CardHeader>
          <CardTitle>الأجهزة المتاحة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.map((device) => {
            const IconComponent = deviceIcons[device.type];
            
            return (
              <div
                key={device.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {/* Device Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{device.name}</div>
                      <div className="text-sm text-gray-600">
                        {getDeviceTypeText(device.type)}
                      </div>
                    </div>
                  </div>
                  
                  <Badge className={statusColors[device.status]}>
                    {device.status === "connected" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {device.status === "error" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {getStatusText(device.status)}
                  </Badge>
                </div>

                {/* Device Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {device.batteryLevel && (
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Power className="h-3 w-3" />
                        البطارية
                      </div>
                      <div className="mt-1">
                        <Progress value={device.batteryLevel} className="h-1" />
                        <span className="text-xs text-gray-500">
                          {device.batteryLevel}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Bluetooth className="h-3 w-3" />
                      قوة الإشارة
                    </div>
                    <div className="mt-1">
                      <Progress value={device.signalStrength} className="h-1" />
                      <span className="text-xs text-gray-500">
                        {device.signalStrength}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last Seen */}
                {device.lastSeen && (
                  <div className="text-xs text-gray-500">
                    آخر اتصال: {device.lastSeen.toLocaleString('ar')}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {device.isConnected ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeviceDisconnect(device.id)}
                    >
                      قطع الاتصال
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleDeviceConnect(device.id)}
                      disabled={device.status === "connecting"}
                    >
                      {device.status === "connecting" ? "جاري الاتصال..." : "اتصال"}
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Manual Device Add */}
      <Card>
        <CardHeader>
          <CardTitle>إضافة جهاز جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" disabled>
            إقران جهاز يدوياً
          </Button>
          <div className="text-xs text-gray-500 mt-2 text-center">
            تأكد من أن الجهاز في وضع الإقران
          </div>
        </CardContent>
      </Card>
    </div>
  );
}