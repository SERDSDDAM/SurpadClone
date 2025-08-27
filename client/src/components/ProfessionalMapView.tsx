import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, ImageOverlay, useMapEvents } from 'react-leaflet';
import { Map as LeafletMap, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, LocateFixed, Grid, Layers, RotateCcw } from 'lucide-react';
import { wgs84ToUtm, utmToWgs84 } from '@/lib/coordinate-transform';

// تعديل أيقونات Leaflet الافتراضية
import L from 'leaflet';

let DefaultIcon = L.divIcon({
  html: "<div style='background-color:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white;'></div>",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface GeoreferencedLayer {
  id: string;
  name: string;
  type: 'raster' | 'vector';
  url: string;
  bounds: [[number, number], [number, number]]; // WGS84 bounds
  visible: boolean;
  opacity: number;
  coordinateSystem?: string;
  sourceCoordinateSystem?: string;
}

interface ProfessionalMapViewProps {
  layers: GeoreferencedLayer[];
  onLayerToggle: (layerId: string) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  activeTool: string;
  onPointClick?: (lat: number, lng: number, utmX: number, utmY: number) => void;
}

// مكون لعرض الطبقات على الخريطة
function LayersRenderer({ layers }: { layers: GeoreferencedLayer[] }) {
  return (
    <>
      {layers
        .filter(layer => layer.visible)
        .map(layer => (
          <ImageOverlay
            key={layer.id}
            url={layer.url}
            bounds={new LatLngBounds(
              [layer.bounds[0][0], layer.bounds[0][1]],
              [layer.bounds[1][0], layer.bounds[1][1]]
            )}
            opacity={layer.opacity}
            zIndex={1000}
          />
        ))}
    </>
  );
}

// مكون لمعالجة أحداث الخريطة
function MapEventHandler({ 
  onPointClick, 
  activeTool,
  onCoordinateUpdate 
}: { 
  onPointClick?: (lat: number, lng: number, utmX: number, utmY: number) => void;
  activeTool: string;
  onCoordinateUpdate: (lat: number, lng: number, utmX: number, utmY: number) => void;
}) {
  const map = useMapEvents({
    click: (e) => {
      if (onPointClick && activeTool !== 'hand') {
        const { lat, lng } = e.latlng;
        const [utmX, utmY] = wgs84ToUtm([lng, lat]);
        onPointClick(lat, lng, utmX, utmY);
      }
    },
    mousemove: (e) => {
      const { lat, lng } = e.latlng;
      const [utmX, utmY] = wgs84ToUtm([lng, lat]);
      onCoordinateUpdate(lat, lng, utmX, utmY);
    },
  });

  return null;
}

// مكون لأزرار التحكم
function MapControls({ 
  onZoomIn, 
  onZoomOut, 
  onReset, 
  onToggleGrid,
  showGrid,
  onCenterMap
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleGrid: () => void;
  showGrid: boolean;
  onCenterMap: () => void;
}) {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
      <Button
        size="sm"
        onClick={onZoomIn}
        className="bg-white dark:bg-gray-800 shadow-lg"
        data-testid="button-zoom-in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        onClick={onZoomOut}
        className="bg-white dark:bg-gray-800 shadow-lg"
        data-testid="button-zoom-out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        onClick={onCenterMap}
        className="bg-white dark:bg-gray-800 shadow-lg"
        data-testid="button-center-map"
      >
        <LocateFixed className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        onClick={onReset}
        className="bg-white dark:bg-gray-800 shadow-lg"
        data-testid="button-reset-view"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={showGrid ? "default" : "outline"}
        onClick={onToggleGrid}
        className="bg-white dark:bg-gray-800 shadow-lg"
        data-testid="button-toggle-grid"
      >
        <Grid className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ProfessionalMapView({
  layers,
  onLayerToggle,
  onLayerOpacityChange,
  activeTool,
  onPointClick
}: ProfessionalMapViewProps) {
  const [currentPosition, setCurrentPosition] = useState({ 
    lat: 15.3694, lng: 44.1910, utmX: 400000, utmY: 1700000 
  }); // صنعاء
  const [zoom, setZoom] = useState(12);
  const [showGrid, setShowGrid] = useState(false);
  const [coordinateSystem, setCoordinateSystem] = useState<'UTM' | 'WGS84'>('UTM');
  const mapRef = useRef<LeafletMap | null>(null);

  // تحديث الإحداثيات عند حركة الماوس
  const handleCoordinateUpdate = useCallback((lat: number, lng: number, utmX: number, utmY: number) => {
    setCurrentPosition({ lat, lng, utmX, utmY });
  }, []);

  // التحكم في التكبير
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleReset = () => {
    if (mapRef.current) {
      mapRef.current.setView([15.3694, 44.1910], 12);
    }
  };

  const handleCenterMap = () => {
    if (mapRef.current) {
      mapRef.current.setView([currentPosition.lat, currentPosition.lng]);
    }
  };

  const toggleCoordinateSystem = () => {
    setCoordinateSystem(prev => prev === 'UTM' ? 'WGS84' : 'UTM');
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[15.3694, 44.1910]} // صنعاء
        zoom={12}
        className="w-full h-full"
        ref={mapRef}
        data-testid="professional-map"
      >
        {/* طبقة الخريطة الأساسية - OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* طبقة الصور الجوية كخيار ثانوي */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          opacity={0.7}
        />

        {/* عرض الطبقات المرفوعة */}
        <LayersRenderer layers={layers} />

        {/* معالج الأحداث */}
        <MapEventHandler
          onPointClick={onPointClick}
          activeTool={activeTool}
          onCoordinateUpdate={handleCoordinateUpdate}
        />
      </MapContainer>

      {/* أزرار التحكم */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showGrid={showGrid}
        onCenterMap={handleCenterMap}
      />

      {/* شريط عرض الإحداثيات المحسّن */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-sm border z-[1000]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">الإحداثيات:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCoordinateSystem}
              className="h-6 px-2 text-xs"
            >
              {coordinateSystem}
            </Button>
          </div>
          
          {coordinateSystem === 'UTM' ? (
            <span className="font-mono">
              X: {currentPosition.utmX.toFixed(2)}m, Y: {currentPosition.utmY.toFixed(2)}m
            </span>
          ) : (
            <span className="font-mono">
              {currentPosition.lat.toFixed(6)}°, {currentPosition.lng.toFixed(6)}°
            </span>
          )}
          
          <Badge variant="secondary" className="text-xs">
            UTM Zone 38N
          </Badge>
        </div>
      </div>

      {/* معلومات الأداة النشطة */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[1000]">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            activeTool === 'hand' ? 'bg-green-500' : 'bg-blue-500'
          }`}></div>
          <span className="text-sm font-medium">
            {activeTool === 'hand' ? 'تصفح الخريطة' : `رسم: ${activeTool}`}
          </span>
        </div>
        
        <div className="mt-2 space-y-1 text-xs text-gray-500">
          <p>🗂️ الطبقات المرئية: {layers.filter(l => l.visible).length}</p>
          <p>📍 المنطقة: صنعاء، اليمن</p>
        </div>
      </div>

      {/* مفتاح الطبقات */}
      {layers.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[1000] max-w-xs">
          <div className="text-sm font-medium mb-2">الطبقات المرئية</div>
          <div className="space-y-2">
            {layers.filter(l => l.visible).map(layer => (
              <div key={layer.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-3 border rounded"
                  style={{ 
                    backgroundColor: `rgba(0, 123, 255, ${layer.opacity})`,
                    backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGklEQVQYlWNgYGBgYGJgYGBhYGBgYGBgYAAABQABAAWUM7ApAAAAAElFTkSuQmCC)'
                  }}
                />
                <span className="text-xs truncate">{layer.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}