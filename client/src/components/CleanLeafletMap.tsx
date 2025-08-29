import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// إصلاح أيقونات Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GISLayer {
  id: string;
  name: string;
  fileName: string;
  status: string;
  visible: boolean;
  imageUrl?: string;
  bounds?: [[number, number], [number, number]]; // [[lat, lng], [lat, lng]]
  width?: number;
  height?: number;
  crs?: string;
}

interface LeafletMapProps {
  layers: GISLayer[];
  onMapReady?: (map: L.Map) => void;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  currentBasemap?: string;
  children?: React.ReactNode;
}

export function CleanLeafletMap({ layers, onMapReady, onCoordinatesChange, currentBasemap = 'esri', children }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const layerInstancesRef = useRef<Map<string, L.ImageOverlay>>(new Map());

  // تهيئة الخريطة - تحسين لمنع التذبذب
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('🗺️ تهيئة خريطة Leaflet...');

    // إنشاء الخريطة مع إعدادات محسنة لمنع التذبذب
    const map = L.map(mapRef.current, {
      center: [15.3694, 44.1910], // مركز اليمن
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
      // إعدادات لمنع التذبذب
      zoomAnimation: true,
      zoomAnimationThreshold: 4,
      fadeAnimation: true,
      markerZoomAnimation: true,
      transform3DLimit: 2^23,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 60,
      // إعدادات السحب المحسنة
      dragging: true,
      inertia: true,
      inertiaDeceleration: 2000,
      inertiaMaxSpeed: 1000,
      easeLinearity: 0.2,
      worldCopyJump: false,
      maxBoundsViscosity: 0.0
    });

    // إضافة خريطة أساس مع إعدادات محسنة
    const baseLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 18,
      minZoom: 2,
      tileSize: 256,
      zoomOffset: 0,
      crossOrigin: true,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 2
    });
    
    baseLayer.addTo(map);

    // إضافة مستمع محسن لتتبع موقع المؤشر
    if (onCoordinatesChange) {
      let lastUpdate = 0;
      const throttleDelay = 50; // تحديث كل 50ms فقط
      
      const throttledMouseMove = (e: L.LeafletMouseEvent) => {
        const now = Date.now();
        if (now - lastUpdate > throttleDelay) {
          onCoordinatesChange({ lat: e.latlng.lat, lng: e.latlng.lng });
          lastUpdate = now;
        }
      };
      
      map.on('mousemove', throttledMouseMove);
    }

    // حفظ مرجع الخريطة عالمياً
    (window as any).__leafletMap = map;
    
    mapInstanceRef.current = map;
    setIsMapReady(true);
    
    console.log('✅ تم تهيئة خريطة Leaflet محسنة بنجاح');
    console.log('🗺️ تم تهيئة الخريطة في الصفحة');
    
    if (onMapReady) {
      onMapReady(map);
    }

    // تنظيف محسن
    return () => {
      if (mapInstanceRef.current) {
        // إزالة جميع الطبقات أولاً
        layerInstancesRef.current.forEach((layer) => {
          if (mapInstanceRef.current?.hasLayer(layer)) {
            mapInstanceRef.current.removeLayer(layer);
          }
        });
        layerInstancesRef.current.clear();
        
        // إزالة جميع مستمعي الأحداث
        mapInstanceRef.current.off();
        
        // إزالة الخريطة
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
        delete (window as any).__leafletMap;
      }
    };
  }, []);

  // إدارة الطبقات
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const layerInstances = layerInstancesRef.current;

    console.log('🔄 تحديث طبقات الخريطة:', layers.length);

    // إزالة الطبقات التي لم تعد موجودة أو غير مرئية
    const activeLayerIds = new Set(
      layers.filter(layer => layer.visible && layer.status === 'processed' && layer.imageUrl && layer.bounds)
        .map(layer => layer.id)
    );

    Array.from(layerInstances.entries()).forEach(([layerId, layerInstance]) => {
      if (!activeLayerIds.has(layerId)) {
        map.removeLayer(layerInstance);
        layerInstances.delete(layerId);
        console.log(`🗑️ تم إزالة الطبقة: ${layerId}`);
      }
    });

    // إضافة الطبقات الجديدة
    layers.forEach(layer => {
      // التحقق من شروط العرض
      if (layer.status !== 'processed' || !layer.visible || !layer.imageUrl || !layer.bounds) {
        return;
      }

      // إذا كانت الطبقة موجودة، تجاهلها
      if (layerInstances.has(layer.id)) {
        return;
      }

      try {
        console.log(`🎨 إضافة طبقة: ${layer.name}`);
        console.log(`📍 الحدود:`, layer.bounds);
        console.log(`🖼️ URL:`, layer.imageUrl);

        // تحويل الحدود إلى تنسيق Leaflet
        const bounds = L.latLngBounds(
          [layer.bounds[0][0], layer.bounds[0][1]], // southwest
          [layer.bounds[1][0], layer.bounds[1][1]]  // northeast
        );

        // إنشاء ImageOverlay
        const imageOverlay = L.imageOverlay(layer.imageUrl, bounds, {
          opacity: 0.8,
          alt: layer.name,
          interactive: true
        });

        // إضافة الطبقة إلى الخريطة
        imageOverlay.addTo(map);
        layerInstances.set(layer.id, imageOverlay);

        console.log(`✅ تم إضافة الطبقة بنجاح: ${layer.name}`);

        // إضافة popup عند النقر
        imageOverlay.on('click', (e) => {
          const popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(`
              <div class="text-right" dir="rtl" style="font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px;">${layer.name}</h4>
                <p style="margin: 4px 0; font-size: 12px;"><strong>الملف:</strong> ${layer.fileName}</p>
                ${layer.width && layer.height ? `<p style="margin: 4px 0; font-size: 12px;"><strong>الأبعاد:</strong> ${layer.width}×${layer.height}</p>` : ''}
                ${layer.crs ? `<p style="margin: 4px 0; font-size: 12px;"><strong>الإسقاط:</strong> ${layer.crs}</p>` : ''}
              </div>
            `)
            .openOn(map);
        });

      } catch (error) {
        console.error(`❌ خطأ في إضافة الطبقة ${layer.name}:`, error);
      }
    });

  }, [layers, isMapReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {children}
    </div>
  );
}