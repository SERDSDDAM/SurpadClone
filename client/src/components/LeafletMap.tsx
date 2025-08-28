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
  boundsWGS84: {
    southwest: [number, number]; // [lat, lng]
    northeast: [number, number]; // [lat, lng]
  };
}

interface LeafletMapProps {
  layers: GISLayer[];
  onMapReady?: (map: L.Map) => void;
}

export function LeafletMap({ layers, onMapReady }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    console.log('🗺️ تهيئة خريطة Leaflet مع Esri World Imagery...');

    // إنشاء الخريطة
    const map = L.map(mapRef.current, {
      center: [15.3694, 44.1910], // مركز اليمن
      zoom: 8,
      zoomControl: true
    });

    // إضافة خريطة أساس من Esri World Imagery
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
      maxZoom: 18
    }).addTo(map);

    mapInstanceRef.current = map;
    setIsMapReady(true);
    
    console.log('✅ تم تهيئة خريطة Leaflet بنجاح');
    
    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
      }
    };
  }, [onMapReady]);

  // إدارة الطبقات
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !layers.length) return;

    const map = mapInstanceRef.current;
    
    console.log('🔄 تحديث طبقات Leaflet:', layers.length);

    // مسح الطبقات السابقة
    map.eachLayer((layer) => {
      if (layer instanceof L.ImageOverlay) {
        map.removeLayer(layer);
      }
    });

    // إضافة الطبقات الجديدة
    const allBounds: L.LatLngBounds[] = [];

    layers.forEach((layer) => {
      try {
        console.log('📍 إضافة طبقة:', layer.name, 'بحدود WGS84:', layer.boundsWGS84);
        
        // تحويل الحدود إلى تنسيق Leaflet
        const bounds = L.latLngBounds(
          L.latLng(layer.boundsWGS84.southwest[0], layer.boundsWGS84.southwest[1]),
          L.latLng(layer.boundsWGS84.northeast[0], layer.boundsWGS84.northeast[1])
        );

        // إنشاء رابط الصورة
        const imageUrl = `/api/gis/layers/${layer.id}/files/${layer.fileName}`;
        
        // إضافة الطبقة كـ Image Overlay
        const imageOverlay = L.imageOverlay(imageUrl, bounds, {
          opacity: 0.8,
          interactive: true
        });

        imageOverlay.addTo(map);
        allBounds.push(bounds);
        
        console.log('✅ تمت إضافة الطبقة:', layer.name);

      } catch (error) {
        console.error('❌ خطأ في إضافة الطبقة:', layer.name, error);
      }
    });

    // التمركز على جميع الطبقات
    if (allBounds.length > 0) {
      const group = new L.FeatureGroup();
      allBounds.forEach(bounds => {
        const rectangle = L.rectangle(bounds);
        group.addLayer(rectangle);
      });
      
      console.log('🎯 التمركز على الطبقات...');
      map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }

  }, [isMapReady, layers]);

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg border"
        style={{ minHeight: '400px' }}
      />
      
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">تحميل الخريطة...</p>
          </div>
        </div>
      )}
    </div>
  );
}