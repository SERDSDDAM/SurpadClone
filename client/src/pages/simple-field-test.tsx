import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SimpleFieldTest() {
  const [testData, setTestData] = useState({
    latitude: 15.3694,
    longitude: 44.1910,
    accuracy: 0.005
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4" data-testid="simple-field-app">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-center" data-testid="app-title">
              🗺️ تطبيق المساحة الميدانية - اختبار مبسط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-600">
              نظام المساحة الرقمية للأراضي اليمنية
            </div>
          </CardContent>
        </Card>

        {/* GPS Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📡 معلومات GPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">خط العرض</div>
                  <div className="font-mono text-lg" data-testid="latitude">
                    {testData.latitude.toFixed(6)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">خط الطول</div>
                  <div className="font-mono text-lg" data-testid="longitude">
                    {testData.longitude.toFixed(6)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" data-testid="gps-status">
                  متصل
                </Badge>
                <span className="text-sm text-gray-600">
                  دقة: {testData.accuracy}م
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🏗️ عداد المعالم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600" data-testid="points-count">0</div>
                  <div className="text-sm text-gray-600">نقاط</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600" data-testid="lines-count">0</div>
                  <div className="text-sm text-gray-600">خطوط</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600" data-testid="polygons-count">0</div>
                  <div className="text-sm text-gray-600">مضلعات</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 أدوات المسح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => alert("إضافة نقطة")}
                className="h-12"
                data-testid="add-point-btn"
              >
                ➕ إضافة نقطة
              </Button>
              <Button 
                variant="outline"
                onClick={() => alert("رسم خط")}
                className="h-12"
                data-testid="add-line-btn"
              >
                📏 رسم خط
              </Button>
              <Button 
                variant="secondary"
                onClick={() => alert("رسم مضلع")}
                className="h-12"
                data-testid="add-polygon-btn"
              >
                🔷 رسم مضلع
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Bar */}
        <div className="mt-6 text-center text-sm text-gray-500">
          ✅ الاختبار المبسط يعمل بنجاح | 🕐 {new Date().toLocaleTimeString('ar-YE')}
        </div>
      </div>
    </div>
  );
}