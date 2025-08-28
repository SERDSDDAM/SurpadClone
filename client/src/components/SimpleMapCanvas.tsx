import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// إصلاح أيقونات Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LayerData {
  id: string;
  name: string;
  fileName: string;
  objectPath: string;
  bounds: [[number, number], [number, number]]; // WGS84 coordinates
  coordinateSystem: string;
}

interface SimpleMapCanvasProps {
  layers: LayerData[];
  onLayerSelect?: (layerId: string) => void;
  className?: string;
}

export function SimpleMapCanvas({ 
  layers, 
  onLayerSelect, 
  className = "w-full h-96" 
}: SimpleMapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersGroup = useRef<L.LayerGroup | null>(null);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('🗺️ تهيئة خريطة بسيطة...');

    // إنشاء الخريطة مع WGS84 (افتراضي)
    const map = L.map(mapRef.current, {
      center: [15.3, 44.2], // صنعاء، اليمن
      zoom: 7,
      attributionControl: true
    });

    // إضافة طبقة أساس من OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // إنشاء مجموعة طبقات
    const layerGroup = L.layerGroup().addTo(map);
    layersGroup.current = layerGroup;

    // عرض إحداثيات الماوس
    const coordinateDisplay = L.Control.extend({
      onAdd: function() {
        const div = L.DomUtil.create('div', 'coordinate-display');
        div.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        div.style.padding = '8px';
        div.style.fontSize = '12px';
        div.style.fontFamily = 'monospace';
        div.style.borderRadius = '4px';
        div.style.border = '1px solid #ccc';
        div.innerHTML = 'إحداثيات: --';
        return div;
      }
    });
    new coordinateDisplay().addTo(map);

    // تحديث الإحداثيات عند تحريك الماوس
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const displayElement = document.querySelector('.coordinate-display');
      if (displayElement) {
        displayElement.innerHTML = `خط الطول: ${lng.toFixed(6)}, خط العرض: ${lat.toFixed(6)}`;
      }
    });

    mapInstance.current = map;

    console.log('✅ تم تهيئة الخريطة البسيطة بنجاح');

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

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

        // استخدام حدود WGS84 مباشرة
        const bounds = L.latLngBounds(
          [layer.bounds[0][0], layer.bounds[0][1]], // SW (minLat, minLng)
          [layer.bounds[1][0], layer.bounds[1][1]]  // NE (maxLat, maxLng)
        );

        // إنشاء ImageOverlay
        const imageOverlay = L.imageOverlay(layer.objectPath, bounds, {
          opacity: 0.8,
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

  }, [layers, onLayerSelect]);

  return (
    <div className={className}>
      <div 
        ref={mapRef} 
        className="w-full h-full border rounded-lg"
        style={{ minHeight: '400px' }}
      />
      <div className="mt-2 text-xs text-gray-600">
        نظام الإحداثيات: WGS 84 (EPSG:4326)
      </div>
    </div>
  );
}