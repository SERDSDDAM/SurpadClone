import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CleanLeafletMap } from '@/components/CleanLeafletMap';
import { AdvancedFileUploader } from '@/components/AdvancedFileUploader';
import { SystemTester } from '@/components/SystemTester';
import { useMutation } from '@tanstack/react-query';
import { MapContainer, TileLayer, useMapEvents, ImageOverlay, useMap } from 'react-leaflet';
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

function CoordinateDisplay({ coordinates, format, onFormatChange }: { 
  coordinates: { lat: number; lng: number } | null;
  format: 'wgs84' | 'utm';
  onFormatChange: (format: 'wgs84' | 'utm') => void;
}) {
  // تحويل للإحداثيات UTM (مبسط للمنطقة 38N)
  const toUTM = (lat: number, lng: number) => {
    // تحويل تقريبي للمنطقة 38N في اليمن
    const x = ((lng - 45) * 111320 * Math.cos(lat * Math.PI / 180)) + 500000;
    const y = (lat * 111320) + 10000000;
    return { x: Math.round(x), y: Math.round(y) };
  };

  return (
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-md z-[1000] border" dir="ltr">
      <div className="flex items-center gap-2 mb-1">
        <button
          onClick={() => onFormatChange(format === 'wgs84' ? 'utm' : 'wgs84')}
          className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
          title="تبديل نظام الإحداثيات"
        >
          {format === 'wgs84' ? 'WGS84' : 'UTM 38N'}
        </button>
      </div>
      <div className="text-sm font-mono">
        {coordinates ? (
          format === 'wgs84' ? (
            <>
              <div>خط العرض: {coordinates.lat.toFixed(6)}</div>
              <div>خط الطول: {coordinates.lng.toFixed(6)}</div>
            </>
          ) : (
            (() => {
              const utm = toUTM(coordinates.lat, coordinates.lng);
              return (
                <>
                  <div>X (شرق): {utm.x.toLocaleString()}</div>
                  <div>Y (شمال): {utm.y.toLocaleString()}</div>
                </>
              );
            })()
          )
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

function AutoFitBounds({ layers }: { layers: any[] }) {
  const map = useMap();
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [hasInitialFit, setHasInitialFit] = useState(false);
  
  useEffect(() => {
    // حفظ مرجع الخريطة للوصول إليها من الخارج
    (window as any).__leafletMap = map;
    
    // إعداد مستمعات لتتبع تفاعل المستخدم
    const onUserInteraction = () => {
      setHasUserInteracted(true);
    };
    
    map.on('dragstart', onUserInteraction);
    map.on('zoomstart', onUserInteraction);
    map.on('movestart', onUserInteraction);
    
    return () => {
      map.off('dragstart', onUserInteraction);
      map.off('zoomstart', onUserInteraction);
      map.off('movestart', onUserInteraction);
    };
  }, [map]);
  
  useEffect(() => {
    // فقط تطبيق AutoFit إذا لم يتفاعل المستخدم مع الخريطة بعد
    if (hasUserInteracted || layers.length === 0) return;
    
    const visibleLayers = layers.filter(l => l.visible && l.bounds);
    if (visibleLayers.length > 0 && !hasInitialFit) {
      const groupBounds = L.latLngBounds([]);
      visibleLayers.forEach(layer => {
        if (layer.bounds && Array.isArray(layer.bounds)) {
          const sw = L.latLng(layer.bounds[0][0], layer.bounds[0][1]);
          const ne = L.latLng(layer.bounds[1][0], layer.bounds[1][1]);
          groupBounds.extend(sw);
          groupBounds.extend(ne);
        }
      });
      
      if (groupBounds.isValid()) {
        map.fitBounds(groupBounds, { 
          padding: [20, 20],
          maxZoom: 10
        });
        setHasInitialFit(true);
        console.log(`📍 تم تطبيق العرض التلقائي الأولي على ${visibleLayers.length} طبقة`);
      }
    }
  }, [layers, map, hasUserInteracted, hasInitialFit]);

  return null;
}

// مكون لحفظ واستعادة حالة الخريطة
function MapStateManager() {
  const map = useMap();
  
  useEffect(() => {
    // استعادة الحالة المحفوظة
    const savedView = localStorage.getItem('map-view');
    if (savedView) {
      try {
        const { center, zoom } = JSON.parse(savedView);
        map.setView([center.lat, center.lng], zoom);
      } catch (e) {
        console.log('⚠️ خطأ في استعادة حالة الخريطة');
      }
    }
    
    // حفظ الحالة عند التحرك
    const handleMoveEnd = () => {
      const state = {
        center: map.getCenter(),
        zoom: map.getZoom()
      };
      localStorage.setItem('map-view', JSON.stringify(state));
    };
    
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);

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
  const [currentBasemap, setCurrentBasemap] = useState(() => 
    localStorage.getItem('basemap') || 'osm'
  );
  const [coordinateFormat, setCoordinateFormat] = useState<'wgs84' | 'utm'>('wgs84');
  const [layerPanelCollapsed, setLayerPanelCollapsed] = useState(false);
  const [processingLayers, setProcessingLayers] = useState<Set<string>>(new Set());
  const mapRef = useRef<L.Map | null>(null);

  // حفظ نوع طبقة الأساس عند التغيير
  useEffect(() => {
    localStorage.setItem('basemap', currentBasemap);
  }, [currentBasemap]);

  // استرداد الطبقات المحفوظة وجلب الطبقات الجديدة من الخادم
  useEffect(() => {
    const loadLayers = async () => {
      try {
        // جلب الطبقات من الخادم
        const serverResponse = await fetch('/api/gis/debug/layers');
        if (serverResponse.ok) {
          const serverData = await serverResponse.json();
          if (serverData.success && serverData.layers.length > 0) {
            const serverLayers = serverData.layers.map((layer: any) => ({
              id: layer.id,
              name: layer.fileName?.replace(/\.[^/.]+$/, "") || layer.id,
              fileName: layer.fileName,
              status: layer.status,
              fileSize: layer.fileSize,
              uploadDate: layer.uploadDate,
              visible: true,
              imageUrl: layer.imageUrl,
              bounds: layer.bounds,
              width: layer.width,
              height: layer.height,
              crs: layer.crs
            }));
            
            setLayers(serverLayers);
            console.log('✅ تم جلب الطبقات من الخادم:', serverLayers);
            return;
          }
        }
        
        // في حالة عدم وجود طبقات في الخادم، جرب الطبقات المحفوظة محلياً
        const savedLayers = localStorage.getItem('gis-layers');
        if (savedLayers) {
          const parsedLayers = JSON.parse(savedLayers);
          // التحقق من معلومات الطبقات وتحديثها من الخادم
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
          console.log('✅ تم استرداد الطبقات المحفوظة:', updatedLayers);
        }
      } catch (error) {
        console.error('❌ خطأ في جلب الطبقات:', error);
      }
    };
    
    loadLayers();
    
    // إعداد تحديث دوري لجلب الطبقات الجديدة
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch('/api/gis/debug/layers');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.layers.length > 0) {
            const serverLayers = data.layers.map((layer: any) => ({
              id: layer.id,
              name: layer.fileName?.replace(/\.[^/.]+$/, "") || layer.id,
              fileName: layer.fileName,
              status: layer.status,
              fileSize: layer.fileSize,
              uploadDate: layer.uploadDate,
              visible: true,
              imageUrl: layer.imageUrl,
              bounds: layer.bounds,
              width: layer.width,
              height: layer.height,
              crs: layer.crs
            }));
            
            setLayers(prevLayers => {
              // فقط تحديث إذا كان هناك طبقات جديدة أو تغييرات
              const newLayersJson = JSON.stringify(serverLayers);
              const currentLayersJson = JSON.stringify(prevLayers);
              
              if (newLayersJson !== currentLayersJson) {
                console.log('🔄 تحديث الطبقات من الخادم:', serverLayers);
                return serverLayers;
              }
              
              return prevLayers;
            });
          }
        }
      } catch (error) {
        console.error('خطأ في تحديث الطبقات:', error);
      }
    }, 3000); // تحديث كل 3 ثوان
    
    return () => clearInterval(intervalId);
  }, []);

  // حفظ الطبقات في localStorage عند تحديثها
  useEffect(() => {
    if (layers.length > 0) {
      localStorage.setItem('gis-layers', JSON.stringify(layers));
      console.log('💾 تم حفظ الطبقات:', layers);
    }
  }, [layers]);

  // دالة استقصاء حالة الطبقة
  const startPollingLayer = useCallback((layerId: string) => {
    console.log(`🔄 بدء استقصاء الطبقة: ${layerId}`);
    
    const maxAttempts = 20; // حد أقصى 60 ثانية (20 × 3 ثوانٍ)
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.warn(`⏰ انتهى وقت انتظار الطبقة: ${layerId}`);
        setLayers(prev => prev.map(layer => 
          layer.id === layerId 
            ? { ...layer, status: 'timeout', error: 'انتهى وقت المعالجة' }
            : layer
        ));
        return;
      }
      
      attempts++;
      
      try {
        const response = await fetch(`/api/gis/layers/${layerId}`);
        const result = await response.json();
        
        if (result.success && result.imageUrl) {
          console.log(`✅ الطبقة جاهزة: ${layerId}`);
          
          // تحديث الطبقة بالمعلومات الكاملة
          setLayers(prev => {
            const updated = prev.map(layer => 
              layer.id === layerId 
                ? { 
                    ...layer, 
                    status: 'processed',
                    imageUrl: result.imageUrl,
                    bounds: result.bounds,
                    width: result.width,
                    height: result.height,
                    crs: result.crs
                  }
                : layer
            );
            localStorage.setItem('gis-layers', JSON.stringify(updated));
            return updated;
          });
          
          toast({
            title: "تمت معالجة الطبقة",
            description: "الطبقة جاهزة للعرض على الخريطة",
          });
          
          return;
        }
        
        if (result.status === 'error') {
          console.error(`❌ خطأ في معالجة الطبقة: ${layerId}`, result.error);
          
          setLayers(prev => prev.map(layer => 
            layer.id === layerId 
              ? { ...layer, status: 'error', error: result.error }
              : layer
          ));
          
          toast({
            title: "خطأ في المعالجة",
            description: result.error || "فشل في معالجة الطبقة",
            variant: "destructive",
          });
          
          return;
        }
        
        // لا تزال قيد المعالجة، إعادة المحاولة
        setTimeout(poll, 3000);
        
      } catch (error) {
        console.error(`❌ خطأ في استقصاء الطبقة ${layerId}:`, error);
        
        // إعادة المحاولة في حالة خطأ الشبكة
        setTimeout(poll, 5000);
      }
    };
    
    // بدء الاستقصاء بعد ثانية واحدة
    setTimeout(poll, 1000);
  }, [toast]);

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

      // رفع الملف باستخدام النظام الجديد
      const response = await fetch('/api/gis/upload', {
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
          // إنشاء كائن طبقة جديدة في حالة المعالجة
          const newLayer = {
            id: result.layerId,
            name: result.fileName.replace(/\.[^/.]+$/, ""), // إزالة امتداد الملف
            fileName: result.fileName,
            status: 'processing',
            fileSize: result.fileSize,
            uploadDate: new Date().toISOString(),
            visible: true,
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
              
              <div className="space-y-3">
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
                      imageUrl: '/api/gis/layers/test_layer_demo/image/test_geotiff.png',
                      bounds: [[15.2, 44.0], [15.6, 44.4]],
                      width: 800,
                      height: 600,
                      crs: 'EPSG:4326'
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
                
                {/* Advanced File Uploader */}
                <AdvancedFileUploader 
                  onLayerAdded={(layer) => {
                    setLayers(prev => [...prev, layer]);
                  }}
                />
                
                {/* System Tester for debugging */}
                <SystemTester />
              </div>
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
                            {layer.bounds && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const map = (window as any).__leafletMap as L.Map | undefined;
                                  if (!map || !layer.bounds) return;
                                  const bounds = L.latLngBounds(layer.bounds);
                                  map.fitBounds(bounds, { padding: [40, 40] });
                                }}
                                title="تكبير إلى الطبقة"
                              >
                                🔍
                              </Button>
                            )}
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
                        {layer.status === 'processed' && layer.bounds && layer.imageUrl && (
                          <div className="mt-2 text-xs text-blue-600">
                            ✅ جاهز للعرض على الخريطة
                          </div>
                        )}
                        {layer.status === 'uploaded' && !layer.imageUrl && (
                          <div className="mt-2 text-xs text-orange-600">
                            ⏳ في انتظار معلومات العرض
                          </div>
                        )}
                        {layer.status === 'uploading' && (
                          <div className="mt-2 text-xs text-gray-600">
                            📤 جاري الرفع...
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
        <CleanLeafletMap 
          layers={layers}
          onMapReady={(map) => {
            mapRef.current = map;
            console.log('🗺️ تم تهيئة الخريطة في الصفحة');
          }}
          onCoordinatesChange={handleCoordinatesChange}
        />
        
        {/* مؤشر المعالجة الدوار */}
        {layers.some(layer => layer.status === 'processing' || layer.status === 'uploading') && (
          <div className="absolute top-20 right-4 bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded-md shadow-md z-[1000] flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <div className="text-sm font-medium">معالجة الطبقات جارية...</div>
              <div className="text-xs">
                {layers.filter(layer => layer.status === 'processing' || layer.status === 'uploading').length} طبقة قيد المعالجة
              </div>
            </div>
          </div>
        )}

        {/* عرض الإحداثيات */}
        <CoordinateDisplay 
          coordinates={coordinates} 
          format={coordinateFormat}
          onFormatChange={setCoordinateFormat}
        />

        {/* شريط أدوات مصغر يطفو */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-md shadow-md z-[1000] flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setLayerPanelCollapsed(!layerPanelCollapsed)}
            title={layerPanelCollapsed ? "إظهار لوحة الطبقات" : "إخفاء لوحة الطبقات"}
          >
            {layerPanelCollapsed ? '📋' : '🔙'}
          </Button>
          
          <div className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
            <span>{layers.filter(layer => layer.visible).length}</span>
            <span>طبقة</span>
          </div>
        </div>

        {/* معلومات النظام العلوية */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-md shadow-md z-[1000]">
          <div className="text-sm text-gray-600 mb-2">
            الأداة النشطة: <span className="font-medium">{activeTool}</span>
          </div>
          <div className="text-xs text-blue-600 mb-1">
            طبقة الأساس: {currentBasemap === 'osm' ? 'خريطة الشوارع' : 'صور الأقمار الصناعية'}
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
              setCurrentBasemap(prev => prev === 'osm' ? 'satellite' : 'osm');
            }}
            title={currentBasemap === 'osm' ? "تبديل إلى صور الأقمار الصناعية" : "تبديل إلى خريطة الشوارع"}
          >
            {currentBasemap === 'osm' ? "🛰️ أقمار صناعية" : "🗺️ خريطة شوارع"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
            onClick={() => {
              const map = (window as any).__leafletMap as L.Map | undefined;
              if (!map) return;
              const yemenBounds = L.latLngBounds([[12.0, 42.0], [19.5, 55.0]]);
              map.fitBounds(yemenBounds, { padding: [40, 40] });
            }}
            title="إعادة التعيين إلى حدود اليمن"
          >
            🌍 إعادة التعيين
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm"
            onClick={() => {
              const visibleLayers = layers.filter(l => l.visible && l.bounds);
              if (visibleLayers.length === 0) return;
              const map = (window as any).__leafletMap as L.Map | undefined;
              if (!map) return;
              const groupBounds = L.latLngBounds([]);
              visibleLayers.forEach(layer => {
                if (layer.bounds) groupBounds.extend(layer.bounds);
              });
              if (groupBounds.isValid()) {
                map.fitBounds(groupBounds, { padding: [40, 40] });
              }
            }}
            title="تكبير إلى جميع الطبقات المرئية"
          >
            🎯 تكبير للكل
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