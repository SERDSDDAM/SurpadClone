import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';
// @ts-ignore - proj4leaflet types not available
import 'proj4leaflet';

// إعداد تعريفات أنظمة الإحداثيات
proj4.defs('EPSG:32638', '+proj=utm +zone=38 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

// تعريف نظام إحداثيات مخصص لـ UTM Zone 38N في Leaflet
// @ts-ignore - L.Proj not in types
const UTM38N = new L.Proj.CRS('EPSG:32638', {
  resolutions: [
    4891.96981025128, 2445.98490512564, 1222.99245256282, 611.49622628141,
    305.748113140705, 152.874056570353, 76.4370282851763, 38.2185141425881,
    19.1092570712941, 9.55462853564703, 4.77731426782352, 2.38865713391176,
    1.19432856695588, 0.597164283477939
  ],
  origin: [166021.44, 0.00]
});

interface LayerData {
  id: string;
  name: string;
  fileName: string;
  objectPath: string;
  bounds: [[number, number], [number, number]]; // UTM coordinates
  coordinateSystem: string;
  geospatialInfo?: {
    transform?: number[];
    crsWkt?: string;
    dimensions?: { width: number; height: number };
  };
}

interface AdvancedMapCanvasProps {
  layers: LayerData[];
  onLayerSelect?: (layerId: string) => void;
  className?: string;
}

export function AdvancedMapCanvas({ 
  layers, 
  onLayerSelect, 
  className = "w-full h-96" 
}: AdvancedMapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersGroup = useRef<L.LayerGroup | null>(null);
  const [currentCRS, setCurrentCRS] = useState<'WGS84' | 'UTM'>('UTM');

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('🗺️ تهيئة خريطة متقدمة مع دعم UTM Zone 38N...');

    // إنشاء الخريطة مع نظام UTM
    const map = L.map(mapRef.current, {
      crs: currentCRS === 'UTM' ? UTM38N : L.CRS.EPSG4326,
      center: currentCRS === 'UTM' ? [450000, 1600000] : [15.3, 44.2], // صنعاء
      zoom: currentCRS === 'UTM' ? 8 : 10,
      attributionControl: true
    });

    // إضافة طبقة أساس من OpenStreetMap (للمرجعية)
    if (currentCRS === 'WGS84') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);
    } else {
      // للـ UTM، نستخدم خلفية بسيطة
      L.tileLayer('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', {
        attribution: 'UTM Zone 38N Display'
      }).addTo(map);
    }

    // إنشاء مجموعة طبقات
    const layerGroup = L.layerGroup().addTo(map);
    layersGroup.current = layerGroup;

    // عرض إحداثيات الماوس
    const coordinateDisplay = L.Control.extend({
      onAdd: function() {
      const div = L.DomUtil.create('div', 'coordinate-display');
      div.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      div.style.padding = '5px';
      div.style.fontSize = '12px';
      div.style.fontFamily = 'monospace';
        div.innerHTML = 'إحداثيات: --';
        return div;
      }
    });
    new coordinateDisplay().addTo(map);

    // تحديث الإحداثيات عند تحريك الماوس
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      if (currentCRS === 'UTM') {
        // تحويل من UTM إلى WGS84 للعرض
        const [lon, lat_wgs] = proj4('EPSG:32638', 'EPSG:4326', [lng, lat]);
        const displayElement = document.querySelector('.coordinate-display');
        if (displayElement) {
          displayElement.innerHTML = `
            UTM: ${lng.toFixed(0)}, ${lat.toFixed(0)}<br>
            WGS84: ${lon.toFixed(6)}, ${lat_wgs.toFixed(6)}
          `;
        }
      } else {
        const displayElement = document.querySelector('.coordinate-display');
        if (displayElement) {
          displayElement.innerHTML = `WGS84: ${lng.toFixed(6)}, ${lat.toFixed(6)}`;
        }
      }
    });

    // إضافة أداة تبديل نظام الإحداثيات
    const crsControl = L.Control.extend({
      onAdd: function() {
      const div = L.DomUtil.create('div', 'crs-control');
      div.innerHTML = `
        <button id="toggle-crs" style="
          background: white;
          border: 1px solid #ccc;
          padding: 5px 10px;
          cursor: pointer;
          border-radius: 3px;
        ">
          التبديل إلى ${currentCRS === 'UTM' ? 'WGS84' : 'UTM'}
        </button>
      `;
        return div;
      }
    });
    new crsControl({ position: 'topright' }).addTo(map);

    mapInstance.current = map;

    console.log('✅ تم تهيئة الخريطة المتقدمة بنجاح');

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [currentCRS]);

  // عرض الطبقات
  useEffect(() => {
    if (!mapInstance.current || !layersGroup.current || layers.length === 0) return;

    console.log('🔄 تحديث طبقات الخريطة:', layers.length);

    // مسح الطبقات الحالية
    layersGroup.current.clearLayers();

    const validLayers: L.ImageOverlay[] = [];

    layers.forEach((layer, index) => {
      try {
        console.log(`📍 معالجة الطبقة ${index + 1}:`, layer.name);

        let bounds: L.LatLngBounds;
        
        if (currentCRS === 'UTM') {
          // استخدام حدود UTM مباشرة
          bounds = L.latLngBounds(
            [layer.bounds[0][0], layer.bounds[0][1]], // SW (minY, minX)
            [layer.bounds[1][0], layer.bounds[1][1]]  // NE (maxY, maxX)
          );
        } else {
          // تحويل من UTM إلى WGS84
          const [minX_wgs, minY_wgs] = proj4('EPSG:32638', 'EPSG:4326', [layer.bounds[0][1], layer.bounds[0][0]]);
          const [maxX_wgs, maxY_wgs] = proj4('EPSG:32638', 'EPSG:4326', [layer.bounds[1][1], layer.bounds[1][0]]);
          
          bounds = L.latLngBounds(
            [minY_wgs, minX_wgs],
            [maxY_wgs, maxX_wgs]
          );
        }

        // إنشاء ImageOverlay
        const imageOverlay = L.imageOverlay(layer.objectPath, bounds, {
          opacity: 0.7,
          attribution: `${layer.name} (${layer.coordinateSystem})`
        });

        // إضافة معالج النقر
        imageOverlay.on('click', () => {
          console.log('🎯 تم النقر على الطبقة:', layer.name);
          onLayerSelect?.(layer.id);
        });

        // إضافة tooltip
        imageOverlay.bindTooltip(`
          <strong>${layer.name}</strong><br>
          نظام الإحداثيات: ${layer.coordinateSystem}<br>
          الملف: ${layer.fileName}
        `, {
          permanent: false,
          direction: 'top'
        });

        layersGroup.current!.addLayer(imageOverlay);
        validLayers.push(imageOverlay);

        console.log(`✅ تم إضافة الطبقة: ${layer.name}`);

      } catch (error) {
        console.error(`❌ خطأ في إضافة الطبقة ${layer.name}:`, error);
      }
    });

    // تكبير الخريطة لعرض جميع الطبقات
    if (validLayers.length > 0) {
      const group = L.featureGroup(validLayers);
      mapInstance.current.fitBounds(group.getBounds(), { padding: [10, 10] });
    }

    console.log(`✅ تم عرض ${validLayers.length} طبقة من أصل ${layers.length}`);

  }, [layers, currentCRS, onLayerSelect]);

  // معالج تبديل نظام الإحداثيات
  useEffect(() => {
    const handleCRSToggle = () => {
      setCurrentCRS(prev => prev === 'UTM' ? 'WGS84' : 'UTM');
    };

    const button = document.getElementById('toggle-crs');
    if (button) {
      button.addEventListener('click', handleCRSToggle);
      return () => button.removeEventListener('click', handleCRSToggle);
    }
  }, []);

  return (
    <div className={className}>
      <div 
        ref={mapRef} 
        className="w-full h-full border rounded-lg"
        style={{ minHeight: '400px' }}
      />
      <div className="mt-2 text-xs text-gray-600">
        نظام الإحداثيات الحالي: {currentCRS === 'UTM' ? 'UTM Zone 38N' : 'WGS 84'}
      </div>
    </div>
  );
}