import React, { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Map, 
  MapPin, 
  Route, 
  Square, 
  Hand, 
  Save, 
  Eye, 
  EyeOff,
  ZoomIn,
  ZoomOut,
  LocateFixed
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import SimpleCRSMapCanvas, { type SimpleGeoreferencedLayer } from '@/components/SimpleCRSMapCanvas';
import WorldFileMapCanvas, { type ProcessedLayer } from '@/components/WorldFileMapCanvas';

interface DrawnFeature {
  id: string;
  type: 'point' | 'line' | 'polygon';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    name: string;
    timestamp: number;
  };
}

export default function SimpleDigitizationTool() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // حالة الطبقات والأدوات
  const [layers, setLayers] = useState<ProcessedLayer[]>([]);
  const [activeTool, setActiveTool] = useState<string>('hand');
  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // رفع الملفات
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('📤 بدء رفع الملف:', file.name, 'حجم:', file.size);
      setIsUploading(true);
      setUploadProgress(0);

      // الخطوة 1: طلب URL للرفع
      const uploadResponse = await apiRequest<{
        layerId: string;
        uploadUrl: string;
        objectPath: string;
        fileName: string;
        fileType: string;
      }>('/api/gis/layers/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/zip'
        })
      });

      console.log('✅ تم الحصول على رابط الرفع:', uploadResponse);
      setUploadProgress(30);

      // الخطوة 2: محاكاة رفع الملف
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadProgress(70);

      // الخطوة 3: تأكيد الرفع ومعالجة الملف
      const confirmResponse = await apiRequest<{
        success: boolean;
        layer: any;
      }>('/api/gis/layers/confirm', {
        method: 'POST',
        body: JSON.stringify({
          layerId: uploadResponse.layerId,
          objectPath: uploadResponse.objectPath,
          fileName: file.name,
          metadata: {
            name: file.name.replace(/\.[^/.]+$/, ""),
            fileType: file.type,
            fileSize: file.size,
            isZipFile: file.name.toLowerCase().endsWith('.zip'),
            coordinateSystem: 'EPSG:32638',
            sourceCoordinateSystem: 'UTM Zone 38N'
          }
        })
      });

      setUploadProgress(100);
      console.log('✅ تم تأكيد الرفع والمعالجة:', confirmResponse);

      return confirmResponse.layer;
    },
    onSuccess: (newLayer) => {
      // تحويل البيانات لتناسب مكون WorldFileMapCanvas
      const processedLayer: ProcessedLayer = {
        id: newLayer.id,
        name: newLayer.name,
        pngUrl: newLayer.preprocessingInfo?.pngUrl || `/public-objects/gis-layers/${newLayer.id}.png`,
        pgwUrl: newLayer.preprocessingInfo?.pgwUrl || `/public-objects/gis-layers/${newLayer.id}.pgw`,
        prjUrl: newLayer.preprocessingInfo?.prjUrl || `/public-objects/gis-layers/${newLayer.id}.prj`,
        bounds: newLayer.bounds,
        visible: true,
        opacity: 1.0,
        coordinateSystem: newLayer.coordinateSystem,
        metadata: {
          width: newLayer.geospatialInfo?.dimensions?.width || 2048,
          height: newLayer.geospatialInfo?.dimensions?.height || 2048,
          pixelSize: newLayer.geospatialInfo?.pixelSize || { x: 10, y: -10 }
        }
      };
      
      setLayers(prev => [...prev, processedLayer]);
      
      toast({
        title: "تم رفع الملف بنجاح",
        description: `تمت إضافة الطبقة: ${newLayer.name}`,
      });
      
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error('❌ خطأ في رفع الملف:', error);
      toast({
        title: "فشل في رفع الملف",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 تم اختيار الملف:', file.name, 'نوع:', file.type);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  const handleFeatureDrawn = useCallback((feature: any) => {
    setDrawnFeatures(prev => [...prev, feature]);
    console.log('🎨 تم رسم شكل جديد:', feature);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* الشريط الجانبي الأيمن */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Map className="w-6 h-6 text-blue-600" />
            أداة الرقمنة البسيطة
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            نظام إحداثيات بسيط مع دعم CRS.Simple
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* قسم رفع الملفات */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                رفع الخرائط
              </CardTitle>
              <CardDescription>
                رفع ملفات GeoTIFF مضغوطة (.zip)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".zip,.tif,.tiff"
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                  variant="outline"
                >
                  {isUploading ? `رفع... ${uploadProgress}%` : 'اختر ملف ZIP'}
                </Button>
                
                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* قسم الأدوات */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">أدوات الرسم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={activeTool === 'hand' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('hand')}
                  className="flex items-center gap-2"
                >
                  <Hand className="w-4 h-4" />
                  تحريك
                </Button>
                <Button
                  variant={activeTool === 'point' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('point')}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  نقطة
                </Button>
                <Button
                  variant={activeTool === 'line' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('line')}
                  className="flex items-center gap-2"
                >
                  <Route className="w-4 h-4" />
                  خط
                </Button>
                <Button
                  variant={activeTool === 'polygon' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('polygon')}
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  مضلع
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* قسم الطبقات */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الطبقات ({layers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {layers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  لا توجد طبقات محملة
                </p>
              ) : (
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleLayerVisibility(layer.id)}
                        >
                          {layer.visible ? (
                            <Eye className="w-4 h-4 text-blue-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <span className="text-sm font-medium">{layer.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {layer.coordinateSystem}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* قسم الأشكال المرسومة */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المعالم المرسومة ({drawnFeatures.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {drawnFeatures.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  لم يتم رسم معالم بعد
                </p>
              ) : (
                <div className="space-y-2">
                  {drawnFeatures.slice(-5).map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm">{feature.properties.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {feature.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* منطقة الخريطة الرئيسية */}
      <div className="flex-1 relative">
        <WorldFileMapCanvas
          layers={layers}
          activeTool={activeTool}
          onPointClick={(x, y, utmX, utmY) => {
            console.log('🗺️ نقر على الخريطة:', { 
              x: x.toFixed(2), 
              y: y.toFixed(2), 
              utmX: utmX.toFixed(2), 
              utmY: utmY.toFixed(2),
              activeTool 
            });
          }}
          onFeatureDrawn={handleFeatureDrawn}
          className="w-full h-full"
        />
        
        {/* أزرار التحكم المباشر */}
        <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-2 flex gap-2">
          <Button size="sm" variant="outline" title="تكبير">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" title="تصغير">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" title="تمركز">
            <LocateFixed className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}