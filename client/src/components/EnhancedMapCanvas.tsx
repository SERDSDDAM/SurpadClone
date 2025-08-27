import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, LocateFixed, Grid, RotateCcw } from 'lucide-react';
import { wgs84ToUtm, utmToWgs84 } from '@/lib/coordinate-transform';

// إعدادات الخريطة
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const MAP_CENTER = { lat: 15.3694, lng: 44.1910 }; // صنعاء
const METERS_PER_DEGREE_LAT = 111320;
const METERS_PER_DEGREE_LNG = 111320 * Math.cos(MAP_CENTER.lat * Math.PI / 180);

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

interface EnhancedMapCanvasProps {
  layers: GeoreferencedLayer[];
  activeTool: string;
  onPointClick?: (lat: number, lng: number, utmX: number, utmY: number) => void;
}

export function EnhancedMapCanvas({
  layers,
  activeTool,
  onPointClick
}: EnhancedMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ 
    x: 0, y: 0, lat: MAP_CENTER.lat, lng: MAP_CENTER.lng, utmX: 0, utmY: 0 
  });
  const [coordinateSystem, setCoordinateSystem] = useState<'UTM' | 'WGS84'>('UTM');

  // تحويل إحداثيات WGS84 إلى إحداثيات الكانفاس
  const geoToCanvas = useCallback((lat: number, lng: number) => {
    const deltaLat = lat - MAP_CENTER.lat;
    const deltaLng = lng - MAP_CENTER.lng;
    
    const x = (deltaLng * METERS_PER_DEGREE_LNG / 10) * zoom + CANVAS_WIDTH / 2 + panX;
    const y = -(deltaLat * METERS_PER_DEGREE_LAT / 10) * zoom + CANVAS_HEIGHT / 2 + panY;
    
    return { x, y };
  }, [zoom, panX, panY]);

  // تحويل إحداثيات الكانفاس إلى WGS84
  const canvasToGeo = useCallback((x: number, y: number) => {
    const canvasX = (x - CANVAS_WIDTH / 2 - panX) / zoom;
    const canvasY = -(y - CANVAS_HEIGHT / 2 - panY) / zoom;
    
    const lng = MAP_CENTER.lng + (canvasX * 10) / METERS_PER_DEGREE_LNG;
    const lat = MAP_CENTER.lat + (canvasY * 10) / METERS_PER_DEGREE_LAT;
    
    return { lat, lng };
  }, [zoom, panX, panY]);

  // رسم خريطة أساسية مبسطة (مربعات تمثل المناطق)
  const drawBasemap = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    // خلفية زرقاء فاتحة للمياه
    ctx.fillStyle = '#e3f2fd';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // رسم مناطق أراضي بسيطة
    const landAreas = [
      { center: { lat: 15.3694, lng: 44.1910 }, size: 0.2, color: '#f5f5dc' }, // صنعاء
      { center: { lat: 15.2, lng: 44.0 }, size: 0.15, color: '#deb887' },
      { center: { lat: 15.5, lng: 44.3 }, size: 0.18, color: '#d2b48c' },
    ];
    
    landAreas.forEach(area => {
      const centerCanvas = geoToCanvas(area.center.lat, area.center.lng);
      const radius = area.size * METERS_PER_DEGREE_LAT * zoom / 10;
      
      ctx.fillStyle = area.color;
      ctx.beginPath();
      ctx.arc(centerCanvas.x, centerCanvas.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // حدود
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    
    // رسم شوارع رئيسية مبسطة
    const roads = [
      { start: { lat: 15.2, lng: 44.0 }, end: { lat: 15.5, lng: 44.3 } },
      { start: { lat: 15.3, lng: 44.1 }, end: { lat: 15.4, lng: 44.2 } },
    ];
    
    ctx.strokeStyle = '#757575';
    ctx.lineWidth = 2 * zoom;
    roads.forEach(road => {
      const startCanvas = geoToCanvas(road.start.lat, road.start.lng);
      const endCanvas = geoToCanvas(road.end.lat, road.end.lng);
      
      ctx.beginPath();
      ctx.moveTo(startCanvas.x, startCanvas.y);
      ctx.lineTo(endCanvas.x, endCanvas.y);
      ctx.stroke();
    });
    
    ctx.restore();
  }, [geoToCanvas, zoom]);

  // رسم الشبكة
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    
    ctx.save();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    
    const gridSize = 50 * zoom;
    const offsetX = panX % gridSize;
    const offsetY = panY % gridSize;
    
    // خطوط عمودية
    for (let x = offsetX; x < CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    // خطوط أفقية
    for (let y = offsetY; y < CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [showGrid, zoom, panX, panY]);

  // رسم الطبقات المرفوعة
  const drawLayers = useCallback(async (ctx: CanvasRenderingContext2D) => {
    for (const layer of layers.filter(l => l.visible)) {
      try {
        // محاكاة عرض طبقة مرفوعة
        const [[minLat, minLng], [maxLat, maxLng]] = layer.bounds;
        const topLeft = geoToCanvas(maxLat, minLng);
        const bottomRight = geoToCanvas(minLat, maxLng);
        
        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;
        
        // رسم مستطيل يمثل الطبقة المرفوعة
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        
        // خلفية الطبقة
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(topLeft.x, topLeft.y, width, height);
        
        // إطار الطبقة
        ctx.strokeStyle = '#388E3C';
        ctx.lineWidth = 2;
        ctx.strokeRect(topLeft.x, topLeft.y, width, height);
        
        // نص تعريفي
        ctx.fillStyle = '#1B5E20';
        ctx.font = `${Math.max(12, 10 * zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(
          layer.name, 
          topLeft.x + width / 2, 
          topLeft.y + height / 2
        );
        
        ctx.restore();
      } catch (error) {
        console.error('Error drawing layer:', layer.name, error);
      }
    }
  }, [layers, geoToCanvas]);

  // رسم كل العناصر
  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // مسح الكانفاس
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // رسم العناصر بالترتيب
    drawBasemap(ctx);
    drawGrid(ctx);
    await drawLayers(ctx);
  }, [drawBasemap, drawGrid, drawLayers]);

  // معالج النقر على الكانفاس
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || activeTool === "hand") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const geoCoords = canvasToGeo(x, y);
    const [utmX, utmY] = wgs84ToUtm([geoCoords.lng, geoCoords.lat]);
    
    if (onPointClick) {
      onPointClick(geoCoords.lat, geoCoords.lng, utmX, utmY);
    }
  };

  // معالج حركة الماوس
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const geoCoords = canvasToGeo(x, y);
    const [utmX, utmY] = wgs84ToUtm([geoCoords.lng, geoCoords.lat]);
    setCursorPosition({ x, y, lat: geoCoords.lat, lng: geoCoords.lng, utmX, utmY });
    
    // معالجة السحب
    if (isDragging) {
      setPanX(panX + (x - dragStart.x));
      setPanY(panY + (y - dragStart.y));
      setDragStart({ x, y });
    }
  };

  // معالج الضغط على الماوس
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "hand") {
      setIsDragging(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setDragStart({ x, y });
    }
  };

  // معالج رفع الماوس
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // أزرار التحكم
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const toggleCoordinateSystem = () => {
    setCoordinateSystem(prev => prev === 'UTM' ? 'WGS84' : 'UTM');
  };

  // رسم عند تغيير التبعيات
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* الكانفاس */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="cursor-crosshair border-2 border-gray-200 dark:border-gray-700"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid="enhanced-map-canvas"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />

      {/* أزرار التحكم */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <Button 
          size="sm" 
          onClick={handleZoomIn} 
          className="bg-white dark:bg-gray-800 shadow-lg"
          data-testid="button-zoom-in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          onClick={handleZoomOut} 
          className="bg-white dark:bg-gray-800 shadow-lg"
          data-testid="button-zoom-out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          onClick={handleReset} 
          className="bg-white dark:bg-gray-800 shadow-lg"
          data-testid="button-reset-view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button 
          size="sm"
          variant={showGrid ? "default" : "outline"}
          onClick={() => setShowGrid(!showGrid)}
          className="bg-white dark:bg-gray-800 shadow-lg"
          data-testid="button-toggle-grid"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          className="bg-white dark:bg-gray-800 shadow-lg"
          data-testid="button-center-map"
        >
          <LocateFixed className="h-4 w-4" />
        </Button>
      </div>

      {/* شريط عرض الإحداثيات المحسّن */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-sm border">
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
            <span className="font-mono text-green-600 dark:text-green-400">
              X: {cursorPosition.utmX.toFixed(2)}m, Y: {cursorPosition.utmY.toFixed(2)}m
            </span>
          ) : (
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {cursorPosition.lat.toFixed(6)}°, {cursorPosition.lng.toFixed(6)}°
            </span>
          )}
          
          <Badge variant="secondary" className="text-xs">
            UTM Zone 38N
          </Badge>
        </div>
      </div>

      {/* معلومات الأداة النشطة */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            activeTool === 'hand' ? 'bg-green-500' : 'bg-blue-500'
          }`}></div>
          <span className="text-sm font-medium">
            {activeTool === 'hand' ? 'تصفح الخريطة' : `رسم: ${activeTool}`}
          </span>
        </div>
        
        <div className="mt-2 space-y-1 text-xs text-gray-500">
          <p>🔍 تكبير: {(zoom * 100).toFixed(0)}%</p>
          <p>🗂️ طبقات مرئية: {layers.filter(l => l.visible).length}</p>
          <p>📍 المنطقة: صنعاء، اليمن</p>
        </div>
      </div>

      {/* مفتاح الطبقات */}
      {layers.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-xs">
          <div className="text-sm font-medium mb-2">الطبقات المرئية</div>
          <div className="space-y-2">
            {layers.filter(l => l.visible).map(layer => (
              <div key={layer.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-3 border rounded"
                  style={{ 
                    backgroundColor: `rgba(76, 175, 80, ${layer.opacity})`,
                    borderColor: '#388E3C'
                  }}
                />
                <span className="text-xs truncate">{layer.name}</span>
                <Badge variant="outline" className="text-xs">
                  {layer.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}