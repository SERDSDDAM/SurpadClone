import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Grid, LocateFixed } from 'lucide-react';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const MAP_CENTER = {
  lat: 15.3694, // صنعاء
  lng: 44.1910
};

export interface GeoreferencedLayer {
  id: string;
  name: string;
  type: 'raster' | 'vector';
  visible: boolean;
  opacity: number;
  bounds?: [[number, number], [number, number]]; // [[minLat, minLng], [maxLat, maxLng]]
  url?: string;
  coordinateSystem?: string;
}

interface RealMapCanvasProps {
  layers: GeoreferencedLayer[];
  activeTool?: string;
  onPointClick?: (lat: number, lng: number, utmX: number, utmY: number) => void;
  onZoomToLayer?: (layerId: string) => void;
}

export function RealMapCanvas({ 
  layers, 
  activeTool = 'hand', 
  onPointClick,
  onZoomToLayer 
}: RealMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // حالات التفاعل
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [coordinateSystem, setCoordinateSystem] = useState<'UTM' | 'WGS84'>('UTM');
  const [cursorPosition, setCursorPosition] = useState({
    x: 0, y: 0, lat: 44.19, lng: 15.37, utmX: 400000, utmY: 1700000
  });

  // تحويل الإحداثيات
  const geoToCanvas = useCallback((lat: number, lng: number) => {
    const x = CANVAS_WIDTH / 2 + (lng - MAP_CENTER.lng) * 10000 * zoom + panX;
    const y = CANVAS_HEIGHT / 2 - (lat - MAP_CENTER.lat) * 10000 * zoom + panY;
    return { x, y };
  }, [zoom, panX, panY]);

  const canvasToGeo = useCallback((x: number, y: number) => {
    const lng = MAP_CENTER.lng + (x - CANVAS_WIDTH / 2 - panX) / (10000 * zoom);
    const lat = MAP_CENTER.lat - (y - CANVAS_HEIGHT / 2 - panY) / (10000 * zoom);
    return { lat, lng };
  }, [zoom, panX, panY]);

  // رسم خريطة أساسية مع تدرج طبيعي لليمن
  const drawBasemap = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    // خلفية متدرجة تمثل طبوغرافية اليمن
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#e8f4f8');    // أزرق فاتح للبحر الأحمر
    gradient.addColorStop(0.2, '#f5f5dc');  // بيج للسهول الساحلية
    gradient.addColorStop(0.5, '#deb887');  // بني فاتح للهضاب
    gradient.addColorStop(0.8, '#8d6e63');  // بني للجبال
    gradient.addColorStop(1, '#5d4037');    // بني داكن للقمم
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // خطوط طبوغرافية
    ctx.strokeStyle = 'rgba(139, 110, 99, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 12; i++) {
      const y = (CANVAS_HEIGHT / 12) * i + (panY % 60);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    
    for (let i = 0; i < 16; i++) {
      const x = (CANVAS_WIDTH / 16) * i + (panX % 60);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    // المدن الرئيسية
    const cities = [
      { name: 'صنعاء', lat: 15.3694, lng: 44.1910, color: '#d32f2f', size: 8 },
      { name: 'عدن', lat: 12.7794, lng: 45.0367, color: '#1976d2', size: 6 },
      { name: 'تعز', lat: 13.5795, lng: 44.0169, color: '#388e3c', size: 6 },
      { name: 'الحديدة', lat: 14.7978, lng: 42.9545, color: '#f57c00', size: 5 },
      { name: 'إب', lat: 13.9667, lng: 44.1833, color: '#7b1fa2', size: 4 }
    ];
    
    cities.forEach(city => {
      const pos = geoToCanvas(city.lat, city.lng);
      
      if (pos.x >= 0 && pos.x <= CANVAS_WIDTH && pos.y >= 0 && pos.y <= CANVAS_HEIGHT) {
        // نقطة المدينة
        ctx.fillStyle = city.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, city.size * zoom, 0, 2 * Math.PI);
        ctx.fill();
        
        // دائرة خارجية
        ctx.strokeStyle = city.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, (city.size + 4) * zoom, 0, 2 * Math.PI);
        ctx.stroke();
        
        // اسم المدينة
        if (zoom > 0.6) {
          ctx.fillStyle = '#2c3e50';
          ctx.font = `bold ${Math.max(12, 10 * zoom)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(city.name, pos.x, pos.y - (city.size + 8) * zoom);
        }
      }
    });
    
    ctx.restore();
  }, [geoToCanvas, zoom, panX, panY]);

  // رسم شبكة الإحداثيات
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(120, 120, 120, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    
    const gridSpacing = 100 * zoom;
    
    // خطوط عمودية
    for (let x = panX % gridSpacing; x < CANVAS_WIDTH; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    // خطوط أفقية
    for (let y = panY % gridSpacing; y < CANVAS_HEIGHT; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [showGrid, zoom, panX, panY]);

  // رسم الطبقات مع الصور الحقيقية
  const drawLayers = useCallback(async (ctx: CanvasRenderingContext2D) => {
    for (const layer of layers.filter(l => l.visible)) {
      try {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        
        if (!layer.bounds) continue;
        
        const [[minLat, minLng], [maxLat, maxLng]] = layer.bounds;
        const topLeft = geoToCanvas(maxLat, minLng);
        const bottomRight = geoToCanvas(minLat, maxLng);
        
        const width = Math.abs(bottomRight.x - topLeft.x);
        const height = Math.abs(bottomRight.y - topLeft.y);
        
        if (width > 0 && height > 0) {
          if (layer.type === 'raster' && layer.url) {
            // تحميل وعرض الصورة الفعلية
            const image = new Image();
            image.crossOrigin = 'anonymous';
            
            const drawImage = () => {
              try {
                ctx.drawImage(image, topLeft.x, topLeft.y, width, height);
                console.log(`✅ تم عرض الصورة: ${layer.name}`);
              } catch (err) {
                console.error('خطأ في رسم الصورة:', err);
                drawPlaceholder();
              }
            };
            
            const drawPlaceholder = () => {
              // خلفية شفافة
              ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
              ctx.fillRect(topLeft.x, topLeft.y, width, height);
              
              // إطار
              ctx.strokeStyle = '#4CAF50';
              ctx.lineWidth = 2;
              ctx.setLineDash([]);
              ctx.strokeRect(topLeft.x, topLeft.y, width, height);
              
              // أيقونة وتسمية
              ctx.fillStyle = '#2e7d32';
              ctx.font = `${Math.max(14, 12 * zoom)}px Arial`;
              ctx.textAlign = 'center';
              ctx.fillText('📷', topLeft.x + width / 2, topLeft.y + height / 2 - 8);
              ctx.font = `${Math.max(10, 8 * zoom)}px Arial`;
              ctx.fillText(layer.name, topLeft.x + width / 2, topLeft.y + height / 2 + 12);
            };
            
            image.onload = drawImage;
            image.onerror = () => {
              console.warn(`فشل تحميل الصورة: ${layer.url}`);
              drawPlaceholder();
            };
            
            // محاولة تحميل من مسارات مختلفة
            const urls = [
              layer.url,
              `/objects/${layer.url}`,
              `/public-objects/${layer.url}`,
              `${layer.url}?t=${Date.now()}`
            ];
            
            let urlIndex = 0;
            const tryNextUrl = () => {
              if (urlIndex < urls.length) {
                image.src = urls[urlIndex++];
              } else {
                drawPlaceholder();
              }
            };
            
            image.onerror = tryNextUrl;
            tryNextUrl();
            
            // placeholder فوري
            drawPlaceholder();
            
          } else {
            // طبقات متجهة
            ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
            ctx.fillRect(topLeft.x, topLeft.y, width, height);
            
            ctx.strokeStyle = '#FF9800';
            ctx.lineWidth = 2;
            ctx.strokeRect(topLeft.x, topLeft.y, width, height);
            
            ctx.fillStyle = '#E65100';
            ctx.font = `${Math.max(12, 10 * zoom)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(layer.name, topLeft.x + width / 2, topLeft.y + height / 2);
          }
        }
        
        ctx.restore();
      } catch (error) {
        console.error('خطأ في رسم الطبقة:', layer.name, error);
      }
    }
  }, [layers, geoToCanvas, zoom]);

  // الرسم الرئيسي
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawBasemap(ctx);
    drawGrid(ctx);
    drawLayers(ctx);
  }, [drawBasemap, drawGrid, drawLayers]);

  // معالجة حركة الماوس
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const geoCoords = canvasToGeo(x, y);
    // تحويل بسيط لUTM (تقريبي)
    const utmX = 400000 + (geoCoords.lng - 44.19) * 100000;
    const utmY = 1700000 + (geoCoords.lat - 15.37) * 110000;
    
    setCursorPosition({ x, y, lat: geoCoords.lat, lng: geoCoords.lng, utmX, utmY });
    
    if (isDragging) {
      setPanX(panX + (x - dragStart.x));
      setPanY(panY + (y - dragStart.y));
      setDragStart({ x, y });
    }
  };

  // معالجة النقر
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "hand") {
      setIsDragging(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // التكبير بالعجلة
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(8, zoom * zoomFactor));
    
    // تكبير نحو موضع الماوس
    const beforeGeo = canvasToGeo(mouseX, mouseY);
    setZoom(newZoom);
    
    setTimeout(() => {
      const afterCanvas = geoToCanvas(beforeGeo.lat, beforeGeo.lng);
      const deltaX = mouseX - afterCanvas.x;
      const deltaY = mouseY - afterCanvas.y;
      
      setPanX(prev => prev + deltaX);
      setPanY(prev => prev + deltaY);
    }, 0);
    
    console.log('🔍 تكبير الخريطة:', { 
      oldZoom: zoom.toFixed(2), 
      newZoom: newZoom.toFixed(2)
    });
  };

  // النقر على الخريطة
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || activeTool === "hand") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const geoCoords = canvasToGeo(x, y);
    const utmX = 400000 + (geoCoords.lng - 44.19) * 100000;
    const utmY = 1700000 + (geoCoords.lat - 15.37) * 110000;
    
    if (onPointClick) {
      onPointClick(geoCoords.lat, geoCoords.lng, utmX, utmY);
    }
  };

  // أدوات التحكم
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 8));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.1));
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // تكبير إلى طبقة
  const handleZoomToLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.bounds) return;

    const [[minLat, minLng], [maxLat, maxLng]] = layer.bounds;
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // حساب التكبير المناسب
    const latRange = Math.abs(maxLat - minLat);
    const lngRange = Math.abs(maxLng - minLng);
    const maxRange = Math.max(latRange, lngRange);
    const newZoom = Math.min(4, Math.max(0.5, 1 / (maxRange * 5)));
    
    // تطبيق التغيير
    setZoom(newZoom);
    setPanX((MAP_CENTER.lng - centerLng) * 10000 * newZoom);
    setPanY(-(MAP_CENTER.lat - centerLat) * 10000 * newZoom);
    
    console.log(`🎯 تم التكبير إلى الطبقة: ${layer.name}`);
  }, [layers]);

  // تطبيق onZoomToLayer
  useEffect(() => {
    if (onZoomToLayer) {
      (window as any).mapZoomToLayer = handleZoomToLayer;
    }
  }, [onZoomToLayer, handleZoomToLayer]);

  // الرسم عند التغيير
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
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
        onWheel={handleWheel}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />

      {/* أدوات التحكم */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <Button size="sm" onClick={handleZoomIn} className="bg-white shadow-lg">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleZoomOut} className="bg-white shadow-lg">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleReset} className="bg-white shadow-lg">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant={showGrid ? "default" : "outline"}
          onClick={() => setShowGrid(!showGrid)} 
          className="bg-white shadow-lg"
        >
          <Grid className="h-4 w-4" />
        </Button>
      </div>

      {/* عرض الإحداثيات */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">الإحداثيات:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCoordinateSystem(coordinateSystem === 'UTM' ? 'WGS84' : 'UTM')}
              className="h-6 px-2 text-xs"
            >
              {coordinateSystem}
            </Button>
          </div>
          
          {coordinateSystem === 'UTM' ? (
            <span className="font-mono text-green-600">
              X: {cursorPosition.utmX.toFixed(2)}m, Y: {cursorPosition.utmY.toFixed(2)}m
            </span>
          ) : (
            <span className="font-mono text-blue-600">
              {cursorPosition.lat.toFixed(6)}°, {cursorPosition.lng.toFixed(6)}°
            </span>
          )}
          
          <Badge variant="secondary" className="text-xs">
            UTM Zone 38N
          </Badge>
        </div>
      </div>

      {/* معلومات الحالة */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
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
    </div>
  );
}