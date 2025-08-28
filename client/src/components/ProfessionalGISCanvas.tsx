import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Trash2,
  Download,
  Navigation,
  Scissors
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

// تعريف أنظمة الإحداثيات المدعومة
proj4.defs('EPSG:32638', '+proj=utm +zone=38 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

// إعدادات الخرائط الأساسية
const BASEMAP_LAYERS = {
  osm: {
    name: 'خريطة الشوارع',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  satellite: {
    name: 'صور الأقمار الصناعية',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri & Contributors'
  },
  terrain: {
    name: 'التضاريس',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri & Contributors'
  }
};

export interface ProcessedLayer {
  id: string;
  name: string;
  fileName: string;
  objectPath: string;
  type: 'raster' | 'vector';
  bounds: [[number, number], [number, number]];
  coordinateSystem: string;
  uploadDate: string;
  status: 'ready' | 'processing' | 'error';
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
  geospatialInfo: {
    hasGeoreferencing: boolean;
    spatialReference: string;
    pixelSize: [number, number];
    transform: any;
  };
}

interface ProfessionalGISCanvasProps {
  layers: ProcessedLayer[];
  onLayersUpdate?: (layers: ProcessedLayer[]) => void;
  activeTool?: string;
  onFeatureDrawn?: (feature: any) => void;
  className?: string;
}

export default function ProfessionalGISCanvas({ 
  layers = [], 
  onLayersUpdate,
  activeTool = 'hand',
  onFeatureDrawn,
  className 
}: ProfessionalGISCanvasProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const drawingGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());
  
  const [currentCoords, setCurrentCoords] = useState({ utm: '', wgs84: '' });
  const [activeBasemap, setActiveBasemap] = useState<keyof typeof BASEMAP_LAYERS>('satellite');
  const [coordinateSystem, setCoordinateSystem] = useState<'utm' | 'wgs84'>('utm');
  const [layersPanelOpen, setLayersPanelOpen] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('🗺️ تهيئة خريطة GIS احترافية...');
    
    // إنشاء الخريطة مع إعدادات متقدمة
    const map = L.map(mapContainerRef.current, {
      center: [15.369, 44.191], // صنعاء، اليمن
      zoom: 10,
      zoomControl: false,
      attributionControl: true
    });

    // إضافة الخريطة الأساسية
    const basemapLayer = L.tileLayer(
      BASEMAP_LAYERS[activeBasemap].url,
      {
        attribution: BASEMAP_LAYERS[activeBasemap].attribution,
        maxZoom: 18
      }
    ).addTo(map);

    // إضافة طبقات العمل
    layerGroupRef.current.addTo(map);
    drawingGroupRef.current.addTo(map);

    // إضافة أدوات التحكم
    L.control.zoom({ position: 'topleft' }).addTo(map);
    L.control.scale({ position: 'bottomright', metric: true, imperial: false }).addTo(map);

    // تتبع حركة الماوس لعرض الإحداثيات
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      updateCoordinateDisplay(e.latlng);
    });

    mapRef.current = map;
    console.log('✅ تم تهيئة الخريطة الاحترافية بنجاح');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // تحديث عرض الإحداثيات
  const updateCoordinateDisplay = useCallback((latlng: L.LatLng) => {
    try {
      const wgs84Coords = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
      
      // تحويل إلى UTM
      const utmCoords = proj4('EPSG:4326', 'EPSG:32638', [latlng.lng, latlng.lat]);
      const utmDisplay = `${Math.round(utmCoords[0])}, ${Math.round(utmCoords[1])}`;
      
      setCurrentCoords({
        utm: utmDisplay,
        wgs84: wgs84Coords
      });
    } catch (error) {
      console.warn('خطأ في تحويل الإحداثيات:', error);
    }
  }, []);

  // تحديث الطبقات على الخريطة
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;

    console.log('🔄 تحديث طبقات الخريطة:', layers.length);
    
    // مسح الطبقات الحالية
    layerGroupRef.current.clearLayers();

    // إضافة الطبقات الجديدة
    layers.forEach((layer, index) => {
      if (!layer.visible && layer.visible !== undefined) return;

      if (layer.type === 'raster' && layer.status === 'ready') {
        try {
          // إنشاء bounds للصورة
          const bounds: L.LatLngBoundsExpression = [
            [layer.bounds[0][0], layer.bounds[0][1]],
            [layer.bounds[1][0], layer.bounds[1][1]]
          ];

          // تحويل bounds من UTM إلى WGS84 لعرض صحيح على Leaflet
          const sw = proj4('EPSG:32638', 'EPSG:4326', [layer.bounds[0][1], layer.bounds[0][0]]);
          const ne = proj4('EPSG:32638', 'EPSG:4326', [layer.bounds[1][1], layer.bounds[1][0]]);
          
          const leafletBounds: L.LatLngBoundsExpression = [
            [sw[1], sw[0]], // Southwest corner
            [ne[1], ne[0]]  // Northeast corner
          ];

          // إنشاء طبقة الصورة مع التحويل الصحيح
          const imageUrl = `/api/gis/public-objects/gis-layers/${layer.fileName}`;
          console.log(`🖼️ إضافة طبقة صورة: ${imageUrl} في bounds:`, leafletBounds);
          
          const imageOverlay = L.imageOverlay(imageUrl, leafletBounds, {
            opacity: layer.opacity || 1.0,
            alt: layer.name,
            interactive: true
          });

          // إضافة tooltip
          imageOverlay.bindTooltip(`📄 ${layer.name}`, {
            permanent: false,
            direction: 'top'
          });

          // إعداد z-index
          const container = imageOverlay.getElement();
          if (container) {
            container.style.zIndex = (layer.zIndex || (1000 + index)).toString();
          }

          layerGroupRef.current.addLayer(imageOverlay);
          console.log(`✅ تمت إضافة طبقة: ${layer.name}`);

        } catch (error) {
          console.error(`❌ خطأ في إضافة طبقة ${layer.name}:`, error);
        }
      }
    });
  }, [layers]);

  // تحديث الخريطة الأساسية
  const changeBasemap = (basemapKey: keyof typeof BASEMAP_LAYERS) => {
    if (!mapRef.current) return;

    setActiveBasemap(basemapKey);
    
    // إزالة الطبقة الحالية
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // إضافة الطبقة الجديدة
    const newBasemap = L.tileLayer(
      BASEMAP_LAYERS[basemapKey].url,
      {
        attribution: BASEMAP_LAYERS[basemapKey].attribution,
        maxZoom: 18
      }
    ).addTo(mapRef.current);
  };

  // التحكم في رؤية الطبقات
  const toggleLayerVisibility = (layerId: string) => {
    const updatedLayers = layers.map(layer => ({
      ...layer,
      visible: layer.id === layerId ? !layer.visible : layer.visible
    }));
    onLayersUpdate?.(updatedLayers);
  };

  // حذف طبقة
  const deleteLayer = (layerId: string) => {
    const updatedLayers = layers.filter(layer => layer.id !== layerId);
    onLayersUpdate?.(updatedLayers);
  };

  // تكبير للطبقة
  const zoomToLayer = (layer: ProcessedLayer) => {
    if (!mapRef.current) return;
    
    const bounds: L.LatLngBoundsExpression = [
      [layer.bounds[0][0], layer.bounds[0][1]],
      [layer.bounds[1][0], layer.bounds[1][1]]
    ];
    
    mapRef.current.fitBounds(bounds, { padding: [20, 20] });
  };

  // إعادة ترتيب الطبقات
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedLayers = Array.from(layers);
    const [removed] = reorderedLayers.splice(result.source.index, 1);
    reorderedLayers.splice(result.destination.index, 0, removed);

    // تحديث zIndex
    const updatedLayers = reorderedLayers.map((layer, index) => ({
      ...layer,
      zIndex: layers.length - index + 1000
    }));

    onLayersUpdate?.(updatedLayers);
  };

  return (
    <div className={`flex h-full ${className || ''}`}>
      {/* لوحة إدارة الطبقات */}
      {layersPanelOpen && (
        <div className="w-80 bg-card border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Layers className="w-5 h-5" />
                إدارة الطبقات
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLayersPanelOpen(false)}
              >
                ←
              </Button>
            </div>
            
            {/* تبديل الخريطة الأساسية */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الخريطة الأساسية:</label>
              <div className="flex gap-1">
                {Object.entries(BASEMAP_LAYERS).map(([key, layer]) => (
                  <Button
                    key={key}
                    variant={activeBasemap === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeBasemap(key as keyof typeof BASEMAP_LAYERS)}
                    className="text-xs"
                  >
                    {layer.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* قائمة الطبقات */}
          <div className="flex-1 overflow-auto p-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="layers">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {layers.map((layer, index) => (
                      <Draggable key={layer.id} draggableId={layer.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`mb-2 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div {...provided.dragHandleProps} className="flex-1 cursor-move">
                                  <h4 className="font-medium text-sm mb-1">{layer.name}</h4>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="secondary" className="text-xs">
                                      {layer.type === 'raster' ? '🖼️ صورة' : '📍 متجه'}
                                    </Badge>
                                    <span>{layer.coordinateSystem}</span>
                                  </div>
                                </div>
                                
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleLayerVisibility(layer.id)}
                                    data-testid={`toggle-layer-${layer.id}`}
                                  >
                                    {layer.visible !== false ? (
                                      <Eye className="w-4 h-4" />
                                    ) : (
                                      <EyeOff className="w-4 h-4" />
                                    )}
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => zoomToLayer(layer)}
                                    data-testid={`zoom-to-layer-${layer.id}`}
                                  >
                                    <Navigation className="w-4 h-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteLayer(layer.id)}
                                    className="text-destructive hover:text-destructive"
                                    data-testid={`delete-layer-${layer.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            {layers.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لم يتم رفع أي طبقات بعد</p>
                <p className="text-xs mt-1">قم برفع ملفات GeoTIFF لبدء الرقمنة</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* منطقة الخريطة */}
      <div className="flex-1 relative">
        {!layersPanelOpen && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 left-4 z-[1000]"
            onClick={() => setLayersPanelOpen(true)}
            data-testid="open-layers-panel"
          >
            <Layers className="w-4 h-4 mr-2" />
            الطبقات
          </Button>
        )}

        <div ref={mapContainerRef} className="w-full h-full" />

        {/* شريط الإحداثيات */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <Card className="bg-background/95 backdrop-blur">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <Button
                    variant={coordinateSystem === 'utm' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCoordinateSystem('utm')}
                    className="h-7 text-xs"
                  >
                    UTM 38N
                  </Button>
                  <Button
                    variant={coordinateSystem === 'wgs84' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCoordinateSystem('wgs84')}
                    className="h-7 text-xs"
                  >
                    WGS84
                  </Button>
                </div>
                
                <div className="font-mono text-sm">
                  <span className="text-muted-foreground ml-2">
                    {coordinateSystem === 'utm' ? 'الإحداثيات المسقطة:' : 'خط الطول والعرض:'}
                  </span>
                  <span className="font-semibold">
                    {coordinateSystem === 'utm' ? currentCoords.utm : currentCoords.wgs84}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}