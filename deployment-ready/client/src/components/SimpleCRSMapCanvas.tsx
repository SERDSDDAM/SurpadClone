import React, { useEffect, useRef, useState } from 'react';
import L, { type LatLngExpression, type Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// إعداد نظام الإحداثيات البسيط - بالضبط كما في النظام القديم
const SIMPLE_CRS = L.extend({}, L.CRS.Simple, {
  transformation: new L.Transformation(1, 0, -1, 0)
});

export interface SimpleGeoreferencedLayer {
  id: string;
  name: string;
  imageUrl: string;
  bounds: [[number, number], [number, number]]; // [[minX, minY], [maxX, maxY]] في UTM
  visible: boolean;
  opacity: number;
  metadata?: {
    width: number;
    height: number;
    crs: string;
    bounds: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    };
  };
}

interface SimpleCRSMapCanvasProps {
  layers: SimpleGeoreferencedLayer[];
  activeTool: string;
  onPointClick?: (x: number, y: number, utmX: number, utmY: number) => void;
  onFeatureDrawn?: (feature: any) => void;
  className?: string;
}

export default function SimpleCRSMapCanvas({ 
  layers, 
  activeTool, 
  onPointClick, 
  onFeatureDrawn,
  className = "w-full h-full" 
}: SimpleCRSMapCanvasProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageOverlaysRef = useRef<Map<string, L.ImageOverlay>>(new Map());
  const drawingLayerRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const [coordinateDisplay, setCoordinateDisplay] = useState<string>('X: 0, Y: 0');

  // تهيئة الخريطة مع CRS.Simple
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    console.log('🗺️ تهيئة خريطة مع نظام الإحداثيات البسيط...');

    const map = L.map(containerRef.current, {
      crs: SIMPLE_CRS,
      center: [0, 0],
      zoom: 0,
      minZoom: -5,
      maxZoom: 10,
      zoomControl: true,
      attributionControl: false
    });

    // إضافة طبقة الرسم
    drawingLayerRef.current.addTo(map);

    // معالج حركة الماوس لعرض الإحداثيات
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const point = e.latlng as any;
      setCoordinateDisplay(`X: ${point.lng.toFixed(2)}, Y: ${point.lat.toFixed(2)}`);
    });

    // معالج النقر
    map.on('click', (e: L.LeafletMouseEvent) => {
      const point = e.latlng as any;
      const x = point.lng; // X coordinate
      const y = point.lat;  // Y coordinate
      
      console.log('🗺️ نقر على الخريطة:', {
        simpleCoords: [y, x], // lat, lng format for Leaflet
        utmCoords: [x, y], // X, Y format for UTM
        activeTool
      });

      if (onPointClick) {
        onPointClick(x, y, x, y); // في النظام البسيط X,Y هي نفسها UTM
      }

      // إضافة نقطة إذا كانت أداة النقطة مفعلة
      if (activeTool === 'point') {
        const marker = L.circleMarker([y, x], { // Leaflet expects [lat, lng]
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
            type: 'point',
            coordinates: [x, y],
            properties: { id: Date.now().toString() }
          });
        }
      }
    });

    mapRef.current = map;
    console.log('✅ تم تهيئة الخريطة بنجاح مع CRS.Simple');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // تحديث الطبقات
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    console.log('🔄 تحديث طبقات CRS.Simple:', layers.length);

    // إزالة الطبقات القديمة
    imageOverlaysRef.current.forEach((overlay) => {
      map.removeLayer(overlay);
    });
    imageOverlaysRef.current.clear();

    // إضافة الطبقات الجديدة
    layers.forEach((layer) => {
      if (!layer.visible) return;

      const bounds = layer.bounds;
      console.log('📍 إضافة طبقة:', layer.name, 'بحدود:', bounds);

      try {
        const imageOverlay = L.imageOverlay(layer.imageUrl, bounds, {
          opacity: layer.opacity
        });

        imageOverlay.addTo(map);
        imageOverlaysRef.current.set(layer.id, imageOverlay);

        // تكبير تلقائي للطبقة الأولى أو الجديدة
        if (layers.length === 1 || imageOverlaysRef.current.size === 1) {
          console.log('🚀 تكبير تلقائي للطبقة:', layer.name);
          map.fitBounds(bounds, { padding: [20, 20] });
        }

        console.log('✅ تم إضافة طبقة بنجاح:', layer.name);

      } catch (error) {
        console.error('❌ خطأ في إضافة الطبقة:', layer.name, error);
      }
    });
  }, [layers]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={containerRef} 
        className="w-full h-full bg-gray-100 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {/* شريط عرض الإحداثيات */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
        {coordinateDisplay}
      </div>
      
      {/* مؤشر الأداة النشطة */}
      <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded">
        الأداة: {activeTool}
      </div>
    </div>
  );
}

export type { SimpleGeoreferencedLayer };