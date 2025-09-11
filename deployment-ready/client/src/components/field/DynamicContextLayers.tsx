import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Layers, 
  MapPin, 
  Eye, 
  EyeOff, 
  Download,
  Zap,
  Navigation,
  Grid,
  Home,
  TreePine,
  Waves
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GISLayer {
  id: string;
  name: string;
  type: 'polygon' | 'line' | 'point';
  description: string;
  icon: typeof Layers;
  color: string;
  visible: boolean;
  loaded: boolean;
  features?: any[];
}

interface DynamicContextLayersProps {
  currentLocation?: { latitude: number; longitude: number };
  requestCoordinates?: { latitude: number; longitude: number };
}

export default function DynamicContextLayers({ 
  currentLocation, 
  requestCoordinates 
}: DynamicContextLayersProps) {
  const { toast } = useToast();
  const [layers, setLayers] = useState<GISLayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(true);

  // تعريف الطبقات المتاحة
  const availableLayers: Omit<GISLayer, 'visible' | 'loaded' | 'features'>[] = [
    {
      id: 'neighborhood_boundaries',
      name: 'حدود وحدة الجوار',
      type: 'polygon',
      description: 'حدود وحدة الجوار التي يقع فيها الطلب',
      icon: Grid,
      color: '#3b82f6'
    },
    {
      id: 'street_network',
      name: 'شبكة الشوارع المرقمنة',
      type: 'line',
      description: 'شبكة الشوارع المرقمنة في المنطقة المحيطة',
      icon: Navigation,
      color: '#ef4444'
    },
    {
      id: 'block_boundaries',
      name: 'حدود البلوكات المجاورة',
      type: 'polygon',
      description: 'حدود البلوكات السكنية والتجارية المجاورة',
      icon: Home,
      color: '#10b981'
    },
    {
      id: 'heritage_sites',
      name: 'المواقع التراثية',
      type: 'polygon',
      description: 'المواقع والمناطق التراثية ومناطق الحماية',
      icon: TreePine,
      color: '#f59e0b'
    },
    {
      id: 'flood_zones',
      name: 'مناطق مخاطر الفيضان',
      type: 'polygon',
      description: 'المناطق المعرضة لمخاطر الفيضان',
      icon: Waves,
      color: '#06b6d4'
    },
    {
      id: 'existing_permits',
      name: 'التراخيص الموجودة',
      type: 'point',
      description: 'مواقع التراخيص والقرارات المساحية الصادرة سابقاً',
      icon: MapPin,
      color: '#8b5cf6'
    }
  ];

  // تحميل الطبقات تلقائياً عند تغيير الموقع
  useEffect(() => {
    if (autoLoadEnabled && (currentLocation || requestCoordinates)) {
      loadDynamicLayers();
    }
  }, [currentLocation, requestCoordinates, autoLoadEnabled]);

  const loadDynamicLayers = async () => {
    setLoading(true);
    const coordinates = requestCoordinates || currentLocation;
    
    if (!coordinates) {
      toast({
        title: "خطأ في الموقع",
        description: "لم يتم العثور على إحداثيات صالحة",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 تحميل طبقات السياق الديناميكية للموقع:', coordinates);
      
      // محاكاة تحميل الطبقات من الخادم
      const loadedLayers: GISLayer[] = await Promise.all(
        availableLayers.map(async (layer) => {
          // محاكاة استدعاء API لتحميل الطبقة
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
          
          const mockFeatures = generateMockFeatures(layer.type, coordinates);
          
          return {
            ...layer,
            visible: ['neighborhood_boundaries', 'street_network', 'block_boundaries'].includes(layer.id),
            loaded: true,
            features: mockFeatures
          };
        })
      );

      setLayers(loadedLayers);
      
      const visibleLayersCount = loadedLayers.filter(l => l.visible).length;
      toast({
        title: "تم تحميل طبقات السياق بنجاح",
        description: `تم تحميل ${loadedLayers.length} طبقة، ${visibleLayersCount} منها مرئية`,
      });
      
    } catch (error) {
      console.error('خطأ في تحميل الطبقات:', error);
      toast({
        title: "خطأ في تحميل الطبقات",
        description: "حدث خطأ أثناء تحميل الطبقات الجغرافية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockFeatures = (type: string, center: { latitude: number; longitude: number }) => {
    const features = [];
    const offset = 0.001; // تقريباً 100 متر
    
    if (type === 'polygon') {
      features.push({
        id: `${type}_1`,
        coordinates: [
          [center.longitude - offset, center.latitude - offset],
          [center.longitude + offset, center.latitude - offset],
          [center.longitude + offset, center.latitude + offset],
          [center.longitude - offset, center.latitude + offset],
          [center.longitude - offset, center.latitude - offset]
        ]
      });
    } else if (type === 'line') {
      features.push({
        id: `${type}_1`,
        coordinates: [
          [center.longitude - offset, center.latitude],
          [center.longitude + offset, center.latitude]
        ]
      });
    } else if (type === 'point') {
      features.push({
        id: `${type}_1`,
        coordinates: [center.longitude, center.latitude]
      });
    }
    
    return features;
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  const downloadLayerData = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.features) return;

    const geoJSON = {
      type: "FeatureCollection",
      features: layer.features.map(feature => ({
        type: "Feature",
        geometry: {
          type: layer.type === 'polygon' ? 'Polygon' : layer.type === 'line' ? 'LineString' : 'Point',
          coordinates: feature.coordinates
        },
        properties: {
          layerId: layer.id,
          name: layer.name
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layer.name}.geojson`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "تم تنزيل الطبقة",
      description: `تم تنزيل بيانات طبقة "${layer.name}" بصيغة GeoJSON`,
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-right flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-600" />
            طبقات السياق الديناميكية
          </CardTitle>
          <Badge variant="outline" className="px-2 py-1">
            {layers.filter(l => l.visible).length}/{layers.length} مرئية
          </Badge>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoLoadEnabled}
              onCheckedChange={setAutoLoadEnabled}
              id="auto-load"
            />
            <label htmlFor="auto-load" className="text-sm text-gray-600">
              التحميل التلقائي
            </label>
          </div>
          
          <Button
            onClick={loadDynamicLayers}
            disabled={loading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="reload-layers-button"
          >
            <Zap className="h-4 w-4 ml-1" />
            {loading ? 'جاري التحميل...' : 'إعادة تحميل'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">جاري تحميل الطبقات الجغرافية...</p>
          </div>
        )}

        {!loading && layers.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">لم يتم تحميل أي طبقات بعد</p>
            <p className="text-xs mt-1">اضغط "إعادة تحميل" أو فعّل التحميل التلقائي</p>
          </div>
        )}

        {!loading && layers.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {layers.map((layer) => {
              const IconComponent = layer.icon;
              return (
                <div
                  key={layer.id}
                  className="border-b border-gray-100 p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent 
                        className="h-4 w-4" 
                        style={{ color: layer.color }} 
                      />
                      <span className="font-medium text-sm">{layer.name}</span>
                      {layer.loaded && (
                        <Badge variant="outline" className="text-xs">
                          {layer.features?.length || 0} عنصر
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="h-8 w-8 p-0"
                        data-testid={`toggle-layer-${layer.id}`}
                      >
                        {layer.visible ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadLayerData(layer.id)}
                        className="h-8 w-8 p-0"
                        disabled={!layer.loaded || !layer.features?.length}
                        data-testid={`download-layer-${layer.id}`}
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 text-right">
                    {layer.description}
                  </p>
                  
                  {layer.visible && layer.loaded && (
                    <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                      ✓ مفعّلة في الخريطة
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {layers.length > 0 && (
          <div className="p-3 bg-blue-50 border-t text-center">
            <p className="text-xs text-blue-700">
              💡 الطبقات المرئية تظهر على الخريطة وتساعد في التحليل المكاني الدقيق
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}