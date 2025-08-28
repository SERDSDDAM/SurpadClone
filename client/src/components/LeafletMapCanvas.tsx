import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';
import type { GeoreferencedLayer } from './SimpleMapCanvas';
import { convertUtmToWgs84 } from '@/lib/coordinate-projection';

// تعريف الإسقاطات المطلوبة
proj4.defs([
  ['EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs'],
  ['EPSG:32638', '+proj=utm +zone=38 +datum=WGS84 +units=m +no_defs +type=crs']
]);

interface LeafletMapCanvasProps {
  layers: GeoreferencedLayer[];
  activeTool?: string;
  onPointClick?: (lat: number, lng: number, utmX: number, utmY: number) => void;
  className?: string;
}

export interface MapRef {
  zoomToLayer: (layerId: string) => void;
  zoomToExtent: (bounds: [[number, number], [number, number]]) => void;
}

// خريطة Leaflet محترفة مع دعم UTM Zone 38N
const LeafletMapCanvas = forwardRef<MapRef, LeafletMapCanvasProps>(({
  layers,
  activeTool = 'hand',
  onPointClick,
  className = ''
}, ref) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // تفعيل الوظائف الخارجية
  useImperativeHandle(ref, () => ({
    zoomToLayer: (layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (layer && layer.bounds && mapRef.current) {
        zoomToExtent(layer.bounds);
      }
    },
    zoomToExtent: (bounds: [[number, number], [number, number]]) => {
      zoomToExtent(bounds);
    }
  }));

  // وظيفة التكبير إلى منطقة محددة
  const zoomToExtent = (bounds: [[number, number], [number, number]]) => {
    if (!mapRef.current) return;
    
    console.log('🔍 Leaflet - تكبير إلى المنطقة:', bounds);
    
    // تحويل حدود UTM إلى WGS84
    const [[minX, minY], [maxX, maxY]] = bounds;
    
    const southWest = convertUtmToWgs84(minX, minY);
    const northEast = convertUtmToWgs84(maxX, maxY);
    
    const leafletBounds = L.latLngBounds(
      L.latLng(southWest.latitude, southWest.longitude),
      L.latLng(northEast.latitude, northEast.longitude)
    );
    
    console.log('🌍 Leaflet - حدود WGS84:', {
      southWest: [southWest.latitude, southWest.longitude],
      northEast: [northEast.latitude, northEast.longitude]
    });
    
    mapRef.current.fitBounds(leafletBounds, { padding: [20, 20] });
  };

  // تهيئة الخريطة
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('🗺️ تهيئة خريطة Leaflet...');

    // إنشاء الخريطة
    const map = L.map(containerRef.current, {
      center: [15.3694, 44.1910], // صنعاء، اليمن
      zoom: 7,
      zoomControl: true,
      attributionControl: true
    });

    // إضافة طبقة الخلفية من OpenStreetMap
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    });
    osmLayer.addTo(map);

    // إضافة طبقة للبيانات المحلية
    const layerGroup = L.layerGroup();
    layerGroup.addTo(map);

    mapRef.current = map;
    layerGroupRef.current = layerGroup;

    // معالجة النقرات على الخريطة
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      if (onPointClick) {
        // تحويل من WGS84 إلى UTM للاستخدام الداخلي
        const utmCoords = proj4('EPSG:4326', 'EPSG:32638', [lng, lat]);
        const [utmX, utmY] = utmCoords;
        
        console.log('🗺️ Leaflet - نقر على الخريطة:', {
          wgs84: [lat, lng],
          utm: [utmX, utmY],
          activeTool
        });
        
        onPointClick(lat, lng, utmX, utmY);
      }
    });

    // تنظيف الخريطة عند إلغاء التركيب
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // مرة واحدة فقط

  // تحديث الطبقات
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;

    console.log('🔄 تحديث طبقات Leaflet:', layers.length);

    // مسح الطبقات القديمة
    layerGroupRef.current.clearLayers();

    // إضافة كل طبقة جديدة
    layers.forEach(layer => {
      if (!layer.visible || !layer.bounds) return;

      console.log('📍 إضافة طبقة:', layer.name, layer.bounds);

      const [[minX, minY], [maxX, maxY]] = layer.bounds;

      // تحويل حدود UTM إلى WGS84
      const southWest = convertUtmToWgs84(minX, minY);
      const northEast = convertUtmToWgs84(maxX, maxY);

      // إنشاء مستطيل للطبقة
      const rectangle = L.rectangle(
        [
          [southWest.latitude, southWest.longitude],
          [northEast.latitude, northEast.longitude]
        ],
        {
          color: '#4CAF50',
          weight: 2,
          opacity: layer.opacity,
          fillColor: '#81C784',
          fillOpacity: layer.opacity * 0.3
        }
      );

      // إضافة popup مع معلومات الطبقة
      rectangle.bindPopup(`
        <div style="direction: rtl; text-align: right;">
          <h3>${layer.name}</h3>
          <p><strong>النوع:</strong> ${layer.type === 'raster' ? 'صورة جوية' : 'بيانات متجهة'}</p>
          <p><strong>نظام الإحداثيات:</strong> ${layer.coordinateSystem || 'UTM Zone 38N'}</p>
          <p><strong>الحدود:</strong><br/>
            الشمال الشرقي: ${northEast.latitude.toFixed(6)}, ${northEast.longitude.toFixed(6)}<br/>
            الجنوب الغربي: ${southWest.latitude.toFixed(6)}, ${southWest.longitude.toFixed(6)}
          </p>
        </div>
      `);

      layerGroupRef.current!.addLayer(rectangle);
    });

  }, [layers]);

  // تكبير تلقائي للطبقة الأحدث
  useEffect(() => {
    if (layers.length > 0) {
      const latestLayer = layers[layers.length - 1];
      if (latestLayer.bounds && latestLayer.visible) {
        console.log('🚀 Leaflet - تكبير تلقائي للطبقة الجديدة:', latestLayer.name);
        setTimeout(() => {
          zoomToExtent(latestLayer.bounds!);
        }, 500); // تأخير بسيط للسماح للطبقة بالتحميل
      }
    }
  }, [layers.length]);

  return (
    <div className={`w-full h-full ${className}`}>
      <div 
        ref={containerRef} 
        className="w-full h-full rounded-lg border border-gray-200"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
});

LeafletMapCanvas.displayName = 'LeafletMapCanvas';

export default LeafletMapCanvas;