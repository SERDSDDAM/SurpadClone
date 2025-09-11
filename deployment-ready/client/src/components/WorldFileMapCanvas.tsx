import React, { useEffect, useRef, useState } from 'react';
import L, { type LatLngExpression, type Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface ProcessedLayer {
  id: string;
  name: string;
  pngUrl: string;
  pgwUrl: string;
  prjUrl: string;
  bounds: [[number, number], [number, number]]; // [[minY, minX], [maxY, maxX]]
  visible: boolean;
  opacity: number;
  coordinateSystem: string;
  metadata: {
    width: number;
    height: number;
    pixelSize: { x: number; y: number };
  };
}

interface WorldFileMapCanvasProps {
  layers: ProcessedLayer[];
  activeTool: string;
  onPointClick?: (x: number, y: number, utmX: number, utmY: number) => void;
  onFeatureDrawn?: (feature: any) => void;
  className?: string;
}

/**
 * مكون خريطة محسن للتعامل مع PNG + World Files
 * يحاكي آلية النظام القديم للعرض الفوري للخرائط المرقمة
 */
export default function WorldFileMapCanvas({
  layers,
  activeTool,
  onPointClick,
  onFeatureDrawn,
  className = "w-full h-full"
}: WorldFileMapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<Map<string, L.ImageOverlay>>(new Map());
  const drawingLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
  
  const [coordinateDisplay, setCoordinateDisplay] = useState<string>('');
  const [mapReady, setMapReady] = useState(false);

  // إعداد نظام الإحداثيات البسيط CRS.Simple
  const SIMPLE_CRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1, 0, 1, 0)
  });

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('🗺️ تهيئة خريطة World File Canvas...');

    const map = L.map(mapContainerRef.current, {
      crs: SIMPLE_CRS,
      center: [1650000, 400000], // إحداثيات افتراضية لليمن
      zoom: 1,
      minZoom: 0.5,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: false
    });

    mapRef.current = map;
    drawingLayerRef.current.addTo(map);

    // معالج حركة الماوس
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const point = e.latlng as any;
      setCoordinateDisplay(`X: ${point.lng.toFixed(2)}, Y: ${point.lat.toFixed(2)}`);
    });

    // معالج النقر
    map.on('click', (e: L.LeafletMouseEvent) => {
      const point = e.latlng as any;
      const x = point.lng;
      const y = point.lat;
      
      console.log('🗺️ نقر على الخريطة:', { x, y, activeTool });

      if (onPointClick) {
        onPointClick(x, y, x, y); // في CRS.Simple، X,Y هي نفسها UTM
      }

      // إضافة معالم حسب الأداة المختارة
      if (activeTool === 'point') {
        const marker = L.circleMarker([y, x], {
          radius: 6,
          fillColor: '#ff0000',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(drawingLayerRef.current);
        
        console.log('📍 تم إضافة نقطة في:', { x, y });
        
        if (onFeatureDrawn) {
          onFeatureDrawn({
            id: `point_${Date.now()}`,
            type: 'point',
            geometry: { type: 'Point', coordinates: [x, y] },
            properties: { name: 'نقطة جديدة', timestamp: Date.now() }
          });
        }
      }
    });

    setMapReady(true);
    console.log('✅ تم تهيئة الخريطة بنجاح');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // تحديث الطبقات عند تغيير المصفوفة
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    console.log('🔄 تحديث طبقات World File Canvas:', layers.length);
    
    const map = mapRef.current;
    const currentLayers = layersRef.current;

    // إزالة الطبقات القديمة
    currentLayers.forEach((layer, layerId) => {
      if (!layers.find(l => l.id === layerId)) {
        map.removeLayer(layer);
        currentLayers.delete(layerId);
      }
    });

    // إضافة أو تحديث الطبقات
    layers.forEach((layer) => {
      const existingLayer = currentLayers.get(layer.id);
      
      if (existingLayer) {
        // تحديث العتامة والرؤية
        existingLayer.setOpacity(layer.visible ? layer.opacity : 0);
      } else {
        // إضافة طبقة جديدة
        try {
          console.log('📍 إضافة طبقة PNG:', layer.name, 'بحدود:', layer.bounds);
          
          // إنشاء Image Overlay باستخدام PNG والحدود من World File
          const imageOverlay = L.imageOverlay(layer.pngUrl, layer.bounds, {
            opacity: layer.visible ? layer.opacity : 0,
            alt: layer.name,
            crossOrigin: true
          });

          imageOverlay.addTo(map);
          currentLayers.set(layer.id, imageOverlay);
          
          // تكبير تلقائي لأول طبقة
          if (currentLayers.size === 1) {
            console.log('🔍 تكبير تلقائي للطبقة الأولى');
            map.fitBounds(layer.bounds, { padding: [20, 20] });
          }

        } catch (error) {
          console.error('❌ خطأ في إضافة الطبقة:', layer.name, error);
        }
      }
    });

    console.log(`✅ تم تحديث ${layers.length} طبقة`);
    
  }, [layers, mapReady]);

  return (
    <div className={className}>
      <div ref={mapContainerRef} className="w-full h-full relative">
        {/* شريط المعلومات السفلي */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm z-[1000]">
          {coordinateDisplay || 'حرك الماوس لعرض الإحداثيات'}
        </div>
        
        {/* شريط حالة الطبقات */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow text-sm z-[1000]">
          <div className="font-semibold text-blue-800">
            الطبقات: {layers.filter(l => l.visible).length} / {layers.length}
          </div>
          {layers.length > 0 && (
            <div className="text-xs text-gray-600 mt-1">
              النظام: CRS.Simple + PNG + World Files
            </div>
          )}
        </div>
      </div>
    </div>
  );
}