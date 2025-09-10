import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ZoomIn, 
  ZoomOut, 
  LocateFixed, 
  Layers,
  Eye,
  EyeOff,
  RefreshCw,
  Home
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeographicDataMapProps {
  height?: string;
  showControls?: boolean;
  selectedGovernorate?: string;
  onFeatureSelect?: (feature: any) => void;
}

interface MapControlsProps {
  map: L.Map | null;
  showGovernorates: boolean;
  showDistricts: boolean;
  showSubDistricts: boolean;
  onToggleLayer: (layer: 'governorates' | 'districts' | 'subDistricts', visible: boolean) => void;
}

function MapControls({ map, showGovernorates, showDistricts, showSubDistricts, onToggleLayer }: MapControlsProps) {
  const zoomIn = useCallback(() => {
    if (map) map.zoomIn();
  }, [map]);

  const zoomOut = useCallback(() => {
    if (map) map.zoomOut();
  }, [map]);

  const resetView = useCallback(() => {
    if (map) {
      // Center on Yemen
      map.setView([15.552727, 48.516388], 6);
    }
  }, [map]);

  const zoomToYemen = useCallback(() => {
    if (map) {
      // Zoom to Yemen bounds
      const yemenBounds: L.LatLngBoundsExpression = [
        [12.111, 41.815], // Southwest corner
        [19.000, 54.530]  // Northeast corner
      ];
      map.fitBounds(yemenBounds);
    }
  }, [map]);

  return (
    <Card className="absolute top-4 right-4 z-[1000] min-w-64">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5" />
          أدوات الخريطة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zoom Controls */}
        <div className="flex gap-2">
          <Button onClick={zoomIn} size="sm" variant="outline" data-testid="button-zoom-in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={zoomOut} size="sm" variant="outline" data-testid="button-zoom-out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button onClick={resetView} size="sm" variant="outline" data-testid="button-reset-view">
            <LocateFixed className="h-4 w-4" />
          </Button>
          <Button onClick={zoomToYemen} size="sm" variant="outline" data-testid="button-zoom-yemen">
            <Home className="h-4 w-4" />
          </Button>
        </div>

        {/* Layer Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">الطبقات المرئية</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="governorates-toggle" className="text-sm">المحافظات</Label>
            <Switch
              id="governorates-toggle"
              checked={showGovernorates}
              onCheckedChange={(checked) => onToggleLayer('governorates', checked)}
              data-testid="switch-governorates"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="districts-toggle" className="text-sm">المديريات</Label>
            <Switch
              id="districts-toggle"
              checked={showDistricts}
              onCheckedChange={(checked) => onToggleLayer('districts', checked)}
              data-testid="switch-districts"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="subdistricts-toggle" className="text-sm">العزل</Label>
            <Switch
              id="subdistricts-toggle"
              checked={showSubDistricts}
              onCheckedChange={(checked) => onToggleLayer('subDistricts', checked)}
              data-testid="switch-subdistricts"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">وسائل الإيضاح</Label>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-blue-500/30 border border-blue-500 rounded"></div>
              <span>المحافظات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-green-500/30 border border-green-500 rounded"></div>
              <span>المديريات</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-purple-500/30 border border-purple-500 rounded"></div>
              <span>العزل</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MapUpdater({ bounds }: { bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && map) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);

  return null;
}

export default function GeographicDataMap({ 
  height = '500px', 
  showControls = true,
  selectedGovernorate,
  onFeatureSelect 
}: GeographicDataMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [showGovernorates, setShowGovernorates] = useState(true);
  const [showDistricts, setShowDistricts] = useState(false);
  const [showSubDistricts, setShowSubDistricts] = useState(false);

  // Fetch geographic data
  const { data: governoratesData } = useQuery({
    queryKey: ['/api/geographic/governorates', { includeGeometry: true }],
    queryFn: () => apiRequest('/api/geographic/governorates?includeGeometry=true'),
    enabled: showGovernorates,
  });

  const { data: districtsData } = useQuery({
    queryKey: ['/api/geographic/districts', { includeGeometry: true, governorateCode: selectedGovernorate }],
    queryFn: () => {
      const params = new URLSearchParams({ includeGeometry: 'true' });
      if (selectedGovernorate) {
        params.append('governorateCode', selectedGovernorate);
      }
      return apiRequest(`/api/geographic/districts?${params.toString()}`);
    },
    enabled: showDistricts,
  });

  const { data: subDistrictsData } = useQuery({
    queryKey: ['/api/geographic/sub-districts', { includeGeometry: true }],
    queryFn: () => apiRequest('/api/geographic/sub-districts?includeGeometry=true&limit=100'),
    enabled: showSubDistricts,
  });

  const onToggleLayer = useCallback((layer: 'governorates' | 'districts' | 'subDistricts', visible: boolean) => {
    switch (layer) {
      case 'governorates':
        setShowGovernorates(visible);
        break;
      case 'districts':
        setShowDistricts(visible);
        break;
      case 'subDistricts':
        setShowSubDistricts(visible);
        break;
    }
  }, []);

  const getGovernoradesStyle = useCallback(() => ({
    color: '#2563eb',
    weight: 2,
    opacity: 1,
    fillColor: '#3b82f6',
    fillOpacity: 0.1
  }), []);

  const getDistrictsStyle = useCallback(() => ({
    color: '#16a34a',
    weight: 1.5,
    opacity: 1,
    fillColor: '#22c55e',
    fillOpacity: 0.1
  }), []);

  const getSubDistrictsStyle = useCallback(() => ({
    color: '#9333ea',
    weight: 1,
    opacity: 1,
    fillColor: '#a855f7',
    fillOpacity: 0.1
  }), []);

  const onEachGovernorate = useCallback((feature: any, layer: L.Layer) => {
    const props = feature.properties;
    layer.bindPopup(`
      <div class="p-2">
        <h3 class="font-bold text-lg">${props.nameAr}</h3>
        <p class="text-sm text-gray-600">${props.nameEn || ''}</p>
        <div class="mt-2 space-y-1 text-xs">
          <p><strong>الكود:</strong> ${props.code}</p>
          <p><strong>العاصمة:</strong> ${props.capitalCity || 'غير محدد'}</p>
          <p><strong>المساحة:</strong> ${props.area ? props.area.toLocaleString() + ' كم²' : 'غير محدد'}</p>
          <p><strong>السكان:</strong> ${props.population ? props.population.toLocaleString() : 'غير محدد'}</p>
        </div>
      </div>
    `);

    layer.on('click', () => {
      if (onFeatureSelect) {
        onFeatureSelect({ type: 'governorate', data: props });
      }
    });
  }, [onFeatureSelect]);

  const onEachDistrict = useCallback((feature: any, layer: L.Layer) => {
    const props = feature.properties;
    layer.bindPopup(`
      <div class="p-2">
        <h3 class="font-bold text-lg">${props.nameAr}</h3>
        <p class="text-sm text-gray-600">${props.nameEn || ''}</p>
        <div class="mt-2 space-y-1 text-xs">
          <p><strong>الكود:</strong> ${props.code}</p>
          <p><strong>المساحة:</strong> ${props.area ? props.area.toLocaleString() + ' كم²' : 'غير محدد'}</p>
          <p><strong>السكان:</strong> ${props.population ? props.population.toLocaleString() : 'غير محدد'}</p>
        </div>
      </div>
    `);

    layer.on('click', () => {
      if (onFeatureSelect) {
        onFeatureSelect({ type: 'district', data: props });
      }
    });
  }, [onFeatureSelect]);

  const onEachSubDistrict = useCallback((feature: any, layer: L.Layer) => {
    const props = feature.properties;
    layer.bindPopup(`
      <div class="p-2">
        <h3 class="font-bold text-lg">${props.nameAr}</h3>
        <p class="text-sm text-gray-600">${props.nameEn || ''}</p>
        <div class="mt-2 space-y-1 text-xs">
          <p><strong>الكود:</strong> ${props.code}</p>
          <p><strong>المساحة:</strong> ${props.area ? props.area.toLocaleString() + ' كم²' : 'غير محدد'}</p>
          <p><strong>السكان:</strong> ${props.population ? props.population.toLocaleString() : 'غير محدد'}</p>
        </div>
      </div>
    `);

    layer.on('click', () => {
      if (onFeatureSelect) {
        onFeatureSelect({ type: 'subDistrict', data: props });
      }
    });
  }, [onFeatureSelect]);

  // Convert API data to GeoJSON format
  const convertToGeoJSON = useCallback((data: any[]) => {
    return {
      type: 'FeatureCollection' as const,
      features: data
        .filter(item => item.geometry) // Only include items with geometry
        .map(item => ({
          type: 'Feature' as const,
          properties: item,
          geometry: item.geometry
        }))
    };
  }, []);

  return (
    <div className="relative" style={{ height }}>
      <MapContainer
        center={[15.552727, 48.516388]} // Center of Yemen
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        ref={setMap}
        data-testid="geographic-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Yemen center marker */}
        <Marker position={[15.552727, 48.516388]}>
          <Popup>
            <div className="p-2 text-center">
              <h3 className="font-bold">الجمهورية اليمنية</h3>
              <p className="text-sm text-gray-600">العاصمة: صنعاء</p>
            </div>
          </Popup>
        </Marker>

        {/* Governorates Layer */}
        {showGovernorates && governoratesData?.data && (
          <GeoJSON
            key="governorates"
            data={convertToGeoJSON(governoratesData.data)}
            style={getGovernoradesStyle}
            onEachFeature={onEachGovernorate}
          />
        )}

        {/* Districts Layer */}
        {showDistricts && districtsData?.data && (
          <GeoJSON
            key="districts"
            data={convertToGeoJSON(districtsData.data)}
            style={getDistrictsStyle}
            onEachFeature={onEachDistrict}
          />
        )}

        {/* Sub-Districts Layer */}
        {showSubDistricts && subDistrictsData?.data && (
          <GeoJSON
            key="sub-districts"
            data={convertToGeoJSON(subDistrictsData.data)}
            style={getSubDistrictsStyle}
            onEachFeature={onEachSubDistrict}
          />
        )}
      </MapContainer>

      {/* Map Controls */}
      {showControls && (
        <MapControls
          map={map}
          showGovernorates={showGovernorates}
          showDistricts={showDistricts}
          showSubDistricts={showSubDistricts}
          onToggleLayer={onToggleLayer}
        />
      )}
    </div>
  );
}