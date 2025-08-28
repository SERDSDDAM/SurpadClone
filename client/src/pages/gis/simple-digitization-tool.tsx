import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MapContainer, TileLayer, useMapEvents, ImageOverlay } from 'react-leaflet';
import { Map as MapIcon, Upload, Hand, MapPin, Route, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// إصلاح أيقونات Leaflet الافتراضية
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CoordinateDisplayProps {
  coordinates: { lat: number; lng: number } | null;
}

function CoordinateDisplay({ coordinates }: CoordinateDisplayProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-md z-[1000] border" dir="ltr">
      <div className="text-sm font-mono">
        {coordinates ? (
          <>
            <div>خط العرض: {coordinates.lat.toFixed(6)}</div>
            <div>خط الطول: {coordinates.lng.toFixed(6)}</div>
          </>
        ) : (
          <div>حرك الماوس فوق الخريطة</div>
        )}
      </div>
    </div>
  );
}

function MapEvents({ onCoordinatesChange }: { onCoordinatesChange: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    mousemove: (e) => {
      onCoordinatesChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
    mouseout: () => {
      onCoordinatesChange({ lat: 0, lng: 0 });
    }
  });

  return null;
}

export default function SimpleDigitizationTool() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // حالة الواجهة
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTool, setActiveTool] = useState<string>('hand');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [layers, setLayers] = useState<any[]>([]);

  // استرداد الطبقات المحفوظة عند تحميل الصفحة
  useEffect(() => {
    const savedLayers = localStorage.getItem('gis-layers');
    if (savedLayers) {
      try {
        const parsedLayers = JSON.parse(savedLayers);
        // التحقق من معلومات الطبقات وتحديثها من الخادم
        const updateLayersWithServerData = async () => {
          const updatedLayers = await Promise.all(
            parsedLayers.map(async (layer: any) => {
              if (layer.status === 'uploaded' && !layer.imageUrl) {
                try {
                  const response = await fetch(`/api/gis/layers/${layer.id}`);
                  if (response.ok) {
                    const serverData = await response.json();
                    if (serverData.success) {
                      return {
                        ...layer,
                        status: 'processed',
                        imageUrl: serverData.imageUrl,
                        bounds: serverData.bounds
                      };
                    }
                  }
                } catch (error) {
                  console.warn(`فشل في جلب بيانات الطبقة ${layer.id}:`, error);
                }
              }
              return layer;
            })
          );
          
          setLayers(updatedLayers);
        };
        
        updateLayersWithServerData();
        console.log('✅ تم استرداد الطبقات المحفوظة:', parsedLayers);
      } catch (error) {
        console.error('❌ خطأ في استرداد الطبقات:', error);
      }
    }
  }, []);

  // حفظ الطبقات في localStorage عند تحديثها
  useEffect(() => {
    if (layers.length > 0) {
      localStorage.setItem('gis-layers', JSON.stringify(layers));
      console.log('💾 تم حفظ الطبقات:', layers);
    }
  }, [layers]);

  // معالج تحديث الإحداثيات
  const handleCoordinatesChange = useCallback((coords: { lat: number; lng: number }) => {
    setCoordinates(coords);
  }, []);

  // معالج رفع الملفات
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('📤 بدء رفع الملف:', file.name, 'حجم:', file.size);
      setIsUploading(true);
      setUploadProgress(10);

      // إنشاء FormData
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📤 إرسال الملف باستخدام FormData');

      // رفع الملف
      const response = await fetch('/api/gis/upload-geotiff-zip', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل في رفع الملف: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ تم رفع الملف بنجاح:', result);
      setUploadProgress(100);

      return result;
    },
    onSuccess: async (result) => {
      console.log('✅ نجح رفع الملف:', result);
      
      // الحصول على معلومات الطبقة المفصلة من الخادم
      try {
        const layerResponse = await fetch(`/api/gis/layers/${result.layerId}`);
        const layerData = await layerResponse.json();
        
        if (layerData.success) {
          // إنشاء كائن طبقة جديدة مع معلومات الخريطة
          const newLayer = {
            id: result.layerId,
            name: result.fileName.replace(/\.[^/.]+$/, ""), // إزالة امتداد الملف
            fileName: result.fileName,
            status: 'processed',
            fileSize: result.fileSize,
            uploadDate: new Date().toISOString(),
            visible: true,
            imageUrl: layerData.imageUrl,
            bounds: layerData.bounds
          };
          
          // إضافة الطبقة الجديدة إلى القائمة
          setLayers(prevLayers => [...prevLayers, newLayer]);
          console.log('📝 تمت إضافة الطبقة الجديدة مع بيانات الخريطة:', newLayer);
          
          toast({
            title: "تم رفع ومعالجة الملف بنجاح",
            description: `تمت إضافة الطبقة: ${newLayer.name}`,
          });
        } else {
          // في حالة عدم توفر معلومات الطبقة، إضافة بيانات أساسية
          const basicLayer = {
            id: result.layerId,
            name: result.fileName.replace(/\.[^/.]+$/, ""),
            fileName: result.fileName,
            status: 'uploaded',
            fileSize: result.fileSize,
            uploadDate: new Date().toISOString(),
            visible: true
          };
          
          setLayers(prevLayers => [...prevLayers, basicLayer]);
          console.log('📝 تمت إضافة الطبقة الأساسية:', basicLayer);
          
          toast({
            title: "تم رفع الملف بنجاح",
            description: `تمت إضافة الطبقة: ${basicLayer.name}`,
          });
        }
      } catch (error) {
        console.error('❌ خطأ في الحصول على معلومات الطبقة:', error);
        // إضافة الطبقة الأساسية في حالة الخطأ
        const basicLayer = {
          id: result.layerId,
          name: result.fileName.replace(/\.[^/.]+$/, ""),
          fileName: result.fileName,
          status: 'uploaded',
          fileSize: result.fileSize,
          uploadDate: new Date().toISOString(),
          visible: true
        };
        
        setLayers(prevLayers => [...prevLayers, basicLayer]);
        
        toast({
          title: "تم رفع الملف بنجاح",
          description: `تمت إضافة الطبقة: ${basicLayer.name}`,
        });
      }
      
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

  // معالج اختيار الملف
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 تم اختيار الملف:', file.name, 'نوع:', file.type);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* الشريط الجانبي */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-blue-600" />
            أداة الرقمنة البسيطة
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            خريطة تفاعلية مع أدوات الرقمنة
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
                  data-testid="file-input"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                  variant="outline"
                  data-testid="button-upload"
                >
                  {isUploading ? `رفع... ${uploadProgress}%` : 'اختر ملف ZIP'}
                </Button>
                
                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                      data-testid="progress-bar"
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
                  data-testid="button-tool-hand"
                >
                  <Hand className="w-4 h-4" />
                  تحريك
                </Button>
                <Button
                  variant={activeTool === 'point' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('point')}
                  className="flex items-center gap-2"
                  data-testid="button-tool-point"
                >
                  <MapPin className="w-4 h-4" />
                  نقطة
                </Button>
                <Button
                  variant={activeTool === 'line' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('line')}
                  className="flex items-center gap-2"
                  data-testid="button-tool-line"
                >
                  <Route className="w-4 h-4" />
                  خط
                </Button>
                <Button
                  variant={activeTool === 'polygon' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('polygon')}
                  className="flex items-center gap-2"
                  data-testid="button-tool-polygon"
                >
                  <Square className="w-4 h-4" />
                  مضلع
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* إدارة مساحة التخزين */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إدارة البيانات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  if (confirm('هل تريد مسح جميع البيانات المحفوظة؟')) {
                    localStorage.removeItem('gis-layers');
                    setLayers([]);
                    toast({
                      title: "تم مسح البيانات",
                      description: "تم مسح جميع الطبقات المحفوظة",
                    });
                  }
                }}
              >
                🗑️ مسح جميع البيانات
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const data = JSON.stringify(layers, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `gis-layers-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                💾 تصدير البيانات
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // إضافة طبقة تجريبية تعمل
                  const testLayer = {
                    id: 'test_layer_demo',
                    name: 'طبقة تجريبية - خريطة اليمن',
                    fileName: 'yemen_test.png',
                    status: 'processed',
                    fileSize: 1024000,
                    uploadDate: new Date().toISOString(),
                    visible: true,
                    imageUrl: '/api/gis/layers/layer_1756416413136_0jzxl2mb1/image/test_geotiff.png',
                    bounds: [[15.2, 44.0], [15.6, 44.4]]
                  };
                  
                  setLayers(prev => [...prev.filter(l => l.id !== 'test_layer_demo'), testLayer]);
                  
                  toast({
                    title: "تمت إضافة طبقة تجريبية",
                    description: "طبقة تجريبية للاختبار",
                  });
                }}
              >
                🧪 إضافة طبقة تجريبية
              </Button>
            </CardContent>
          </Card>

          {/* معلومات الطبقات */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الطبقات المحملة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {layers.length === 0 ? (
                  <div className="text-sm text-gray-600">لا توجد طبقات محملة</div>
                ) : (
                  <>
                    <div className="text-sm text-gray-600 mb-2">{layers.length} طبقة محملة</div>
                    {layers.map((layer) => (
                      <div key={layer.id} className="bg-gray-50 p-3 rounded border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">{layer.name}</div>
                            <div className="text-xs text-gray-500">
                              {layer.fileName} • {layer.status}
                            </div>
                            {layer.fileSize && (
                              <div className="text-xs text-gray-400">
                                {(layer.fileSize / (1024 * 1024)).toFixed(1)} MB
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const newLayers = layers.map(l => 
                                  l.id === layer.id ? { ...l, visible: !l.visible } : l
                                );
                                setLayers(newLayers);
                              }}
                              title={layer.visible ? "إخفاء الطبقة" : "إظهار الطبقة"}
                            >
                              {layer.visible ? "👁️" : "🚫"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500"
                              onClick={() => {
                                const newLayers = layers.filter(l => l.id !== layer.id);
                                setLayers(newLayers);
                              }}
                              title="حذف الطبقة"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                        {layer.status === 'processed' && layer.bounds && (
                          <div className="mt-2 text-xs text-blue-600">
                            ✅ جاهز للعرض على الخريطة
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* منطقة الخريطة */}
      <div className="flex-1 relative">
        <MapContainer
          center={[15.3694, 44.1910]} // إحداثيات صنعاء
          zoom={8}
          className="w-full h-full"
          zoomControl={true}
          data-testid="leaflet-map"
          style={{ height: '100vh', width: '100%' }}
        >
          {/* طبقة الأساس - OpenStreetMap للاختبار */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
          
          {/* طبقة الأساس - صور الأقمار الصناعية احتياطي */}
          {/* <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            maxZoom={18}
          /> */}

          {/* عرض الطبقات المرفوعة */}
          {layers.filter(layer => layer.visible && layer.imageUrl && layer.bounds).map(layer => {
            console.log('🗺️ عرض الطبقة على الخريطة:', layer.name, layer.imageUrl, layer.bounds);
            return (
              <ImageOverlay
                key={layer.id}
                url={layer.imageUrl}
                bounds={layer.bounds}
                opacity={0.8}
                interactive={false}
              />
            );
          })}
          
          {/* عرض مؤشر للطبقات التي لم تتم معالجتها بعد */}
          {layers.filter(layer => layer.visible && !layer.imageUrl).length > 0 && (
            <div className="absolute top-20 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-md shadow-md z-[1000]">
              <div className="text-sm font-medium">معالجة الطبقات جارية...</div>
              <div className="text-xs">
                {layers.filter(layer => layer.visible && !layer.imageUrl).length} طبقة في انتظار المعالجة
              </div>
            </div>
          )}

          {/* معالج الأحداث */}
          <MapEvents onCoordinatesChange={handleCoordinatesChange} />
        </MapContainer>

        {/* عرض الإحداثيات */}
        <CoordinateDisplay coordinates={coordinates} />

        {/* شريط الأدوات العلوي */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-md shadow-md z-[1000]">
          <div className="text-sm text-gray-600 mb-2">
            الأداة النشطة: <span className="font-medium">{activeTool}</span>
          </div>
          {layers.filter(layer => layer.visible).length > 0 && (
            <div className="text-xs text-green-600">
              {layers.filter(layer => layer.visible).length} طبقة مرئية
            </div>
          )}
        </div>

        {/* أزرار التحكم بالخريطة */}
        <div className="absolute bottom-20 right-4 space-y-2 z-[1000]">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
            onClick={() => {
              // إعادة تعيين عرض الخريطة لليمن
              const map = document.querySelector('[data-testid="leaflet-map"]');
              if (map) {
                // هذا مثال - يمكن تحسينه لاحقاً
                console.log('🔄 إعادة تعيين عرض الخريطة');
              }
            }}
            title="إعادة تعيين العرض"
          >
            🌍 إعادة التعيين
          </Button>
          
          {layers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm"
              onClick={() => {
                const allVisible = layers.every(layer => layer.visible);
                const newLayers = layers.map(layer => ({ ...layer, visible: !allVisible }));
                setLayers(newLayers);
              }}
              title={layers.every(layer => layer.visible) ? "إخفاء جميع الطبقات" : "إظهار جميع الطبقات"}
            >
              {layers.every(layer => layer.visible) ? "🚫 إخفاء الكل" : "👁️ إظهار الكل"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}