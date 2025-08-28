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
}

export function CleanLeafletMap({ layers, onMapReady, onCoordinatesChange }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const layerInstancesRef = useRef<Map<string, L.ImageOverlay>>(new Map());

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('🗺️ تهيئة خريطة Leaflet...');

    // إنشاء الخريطة
    const map = L.map(mapRef.current, {
      center: [15.3694, 44.1910], // مركز اليمن
      zoom: 8,
      zoomControl: true
    });

    // إضافة خريطة أساس من Esri World Imagery
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 18
    }).addTo(map);

    // إضافة مستمع لتتبع موقع المؤشر
    if (onCoordinatesChange) {
      map.on('mousemove', (e) => {
        onCoordinatesChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    // حفظ مرجع الخريطة عالمياً
    (window as any).__leafletMap = map;
    
    mapInstanceRef.current = map;
    setIsMapReady(true);
    
    console.log('✅ تم تهيئة خريطة Leaflet بنجاح');
    
    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        layerInstancesRef.current.clear();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
        delete (window as any).__leafletMap;
      }
    };
  }, [onMapReady, onCoordinatesChange]);

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

    for (const [layerId, layerInstance] of layerInstances) {
      if (!activeLayerIds.has(layerId)) {
        map.removeLayer(layerInstance);
        layerInstances.delete(layerId);
        console.log(`🗑️ تم إزالة الطبقة: ${layerId}`);
      }
    }

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

  return <div ref={mapRef} className="w-full h-full" />;
}