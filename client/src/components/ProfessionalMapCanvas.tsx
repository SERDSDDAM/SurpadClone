import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Grid, LocateFixed, Map } from 'lucide-react';
import { 
  convertWgs84ToUtm, 
  convertUtmToWgs84,
  convertImageBoundsUtmToWgs84,
  wgs84ToCanvas,
  canvasToWgs84,
  formatCoordinates,
  validateYemenCoordinates
} from '@/lib/coordinate-projection';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

// مركز الخريطة - صنعاء، اليمن
const MAP_CENTER = {
  lat: 15.3694,
  lng: 44.1910
};

export interface GeoreferencedLayer {
  id: string;
  name: string;
  type: 'raster' | 'vector';
  visible: boolean;
  opacity: number;
  bounds?: [[number, number], [number, number]]; // UTM bounds [[minX, minY], [maxX, maxY]]
  url: string; // جعل url مطلوباً
  coordinateSystem?: string;
  originalBounds?: [[number, number], [number, number]]; // الحدود الأصلية قبل التحويل
}

interface ProfessionalMapCanvasProps {
  layers: GeoreferencedLayer[];
  activeTool?: string;
  onPointClick?: (lat: number, lng: number, utmX: number, utmY: number) => void;
  onZoomToLayer?: (layerId: string) => void;
}

export function ProfessionalMapCanvas({ 
  layers, 
  activeTool = 'hand', 
  onPointClick,
  onZoomToLayer 
}: ProfessionalMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef(new Map<string, HTMLImageElement>());
  
  // حالات التفاعل
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [coordinateSystem, setCoordinateSystem] = useState<'UTM' | 'WGS84'>('UTM');
  const [cursorPosition, setCursorPosition] = useState({
    x: 0, y: 0, lat: 15.3694, lng: 44.1910, utmX: 400000, utmY: 1700000
  });
  const [basemapType, setBasemapType] = useState<'satellite' | 'street' | 'topographic'>('satellite');

  // محاكاة خريطة أساسية حقيقية متطورة
  const drawAdvancedBasemap = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    if (basemapType === 'satellite') {
      // محاكاة صور الأقمار الصناعية لليمن
      const satelliteGradient = ctx.createRadialGradient(
        CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0,
        CANVAS_WIDTH/2, CANVAS_HEIGHT/2, Math.max(CANVAS_WIDTH, CANVAS_HEIGHT)
      );
      satelliteGradient.addColorStop(0, '#2d5a27'); // أخضر داكن للمرتفعات
      satelliteGradient.addColorStop(0.3, '#8d6e63'); // بني للهضاب
      satelliteGradient.addColorStop(0.6, '#d7ccc8'); // بيج للصحراء
      satelliteGradient.addColorStop(0.8, '#f5f5dc'); // كريمي للسهول
      satelliteGradient.addColorStop(1, '#87ceeb'); // أزرق للبحر
      
      ctx.fillStyle = satelliteGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // إضافة نسيج يحاكي التضاريس
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        const size = Math.random() * 3 + 1;
        ctx.fillStyle = Math.random() > 0.5 ? '#4a4a4a' : '#6d4c41';
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1;
      
    } else if (basemapType === 'street') {
      // محاكاة خريطة شوارع
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // شبكة شوارع
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 1;
      const gridSize = 50 * zoom;
      
      for (let x = panX % gridSize; x < CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      
      for (let y = panY % gridSize; y < CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
      
    } else {
      // خريطة طبوغرافية
      const topoGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      topoGradient.addColorStop(0, '#e8f5e8');
      topoGradient.addColorStop(0.2, '#c8e6c9');
      topoGradient.addColorStop(0.4, '#a5d6a7');
      topoGradient.addColorStop(0.6, '#81c784');
      topoGradient.addColorStop(0.8, '#66bb6a');
      topoGradient.addColorStop(1, '#4caf50');
      
      ctx.fillStyle = topoGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // رسم المدن الرئيسية مع التحويل الصحيح للإحداثيات
    const cities = [
      { name: 'صنعاء', lat: 15.3694, lng: 44.1910, population: 2500000, color: '#d32f2f' },
      { name: 'عدن', lat: 12.7794, lng: 45.0367, population: 800000, color: '#1976d2' },
      { name: 'تعز', lat: 13.5795, lng: 44.0169, population: 600000, color: '#388e3c' },
      { name: 'الحديدة', lat: 14.7978, lng: 42.9545, population: 400000, color: '#f57c00' },
      { name: 'إب', lat: 13.9667, lng: 44.1833, population: 300000, color: '#7b1fa2' },
      { name: 'ذمار', lat: 14.5428, lng: 44.4011, population: 200000, color: '#00796b' }
    ];
    
    cities.forEach(city => {
      if (!validateYemenCoordinates(city.lat, city.lng)) return;
      
      const pos = wgs84ToCanvas(
        city.lat, city.lng, 
        CANVAS_WIDTH, CANVAS_HEIGHT, 
        zoom, panX, panY, MAP_CENTER
      );
      
      if (pos.x >= -50 && pos.x <= CANVAS_WIDTH + 50 && pos.y >= -50 && pos.y <= CANVAS_HEIGHT + 50) {
        const size = Math.max(4, Math.min(16, Math.log(city.population) * zoom));
        
        // نقطة المدينة
        ctx.fillStyle = city.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI);
        ctx.fill();
        
        // حلقة خارجية
        ctx.strokeStyle = city.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size + 3, 0, 2 * Math.PI);
        ctx.stroke();
        
        // اسم المدينة
        if (zoom > 0.5) {
          ctx.fillStyle = '#2c3e50';
          ctx.font = `bold ${Math.max(10, 8 * zoom)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(city.name, pos.x, pos.y - size - 8);
        }
      }
    });
    
    ctx.restore();
  }, [zoom, panX, panY, basemapType]);

  // رسم الشبكة مع إحداثيات UTM
  const drawUtmGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 100, 200, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    
    const gridSpacing = Math.max(50, 100 * zoom);
    const labelSpacing = Math.max(100, 200 * zoom);
    
    // خطوط الشبكة
    for (let x = panX % gridSpacing; x < CANVAS_WIDTH; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    for (let y = panY % gridSpacing; y < CANVAS_HEIGHT; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    
    // تسميات الشبكة بإحداثيات UTM
    if (zoom > 0.7) {
      ctx.fillStyle = 'rgba(0, 100, 200, 0.8)';
      ctx.font = `${Math.max(8, 6 * zoom)}px Arial`;
      ctx.textAlign = 'left';
      
      for (let x = panX % labelSpacing; x < CANVAS_WIDTH; x += labelSpacing) {
        for (let y = panY % labelSpacing; y < CANVAS_HEIGHT; y += labelSpacing) {
          const geoCoords = canvasToWgs84(x, y, CANVAS_WIDTH, CANVAS_HEIGHT, zoom, panX, panY, MAP_CENTER);
          const utmCoords = convertWgs84ToUtm(geoCoords.longitude, geoCoords.latitude);
          
          ctx.fillText(
            `${Math.round(utmCoords.x/1000)}k`,
            x + 5, y + 12
          );
          ctx.fillText(
            `${Math.round(utmCoords.y/1000)}k`,
            x + 5, y + 24
          );
        }
      }
    }
    
    ctx.restore();
  }, [showGrid, zoom, panX, panY]);

  // رسم الطبقات مع التحويل الصحيح للإحداثيات
  const drawGeoreferencedLayers = useCallback(async (ctx: CanvasRenderingContext2D) => {
    for (const layer of layers.filter(l => l.visible)) {
      try {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        
        if (!layer.bounds) {
          console.warn(`الطبقة ${layer.name} ليس لها حدود محددة`);
          continue;
        }
        
        // تحويل حدود الطبقة من UTM إلى WGS84 للعرض
        const wgs84Bounds = convertImageBoundsUtmToWgs84(layer.bounds);
        const [[minLat, minLng], [maxLat, maxLng]] = wgs84Bounds;
        
        console.log(`🗺️ عرض الطبقة ${layer.name}:`, {
          utmBounds: layer.bounds,
          wgs84Bounds: wgs84Bounds
        });
        
        // حساب موقع الطبقة على الكانفاس
        const topLeft = wgs84ToCanvas(maxLat, minLng, CANVAS_WIDTH, CANVAS_HEIGHT, zoom, panX, panY, MAP_CENTER);
        const bottomRight = wgs84ToCanvas(minLat, maxLng, CANVAS_WIDTH, CANVAS_HEIGHT, zoom, panX, panY, MAP_CENTER);
        
        const width = Math.abs(bottomRight.x - topLeft.x);
        const height = Math.abs(bottomRight.y - topLeft.y);
        
        if (width > 0 && height > 0) {
          if (layer.type === 'raster' && layer.url) {
            // تحميل وعرض الصورة الحقيقية
            const cacheKey = layer.url;
            let image = imageCache.current.get(cacheKey);
            
            if (!image) {
              image = new Image();
              image.crossOrigin = 'anonymous';
              imageCache.current.set(cacheKey, image);
              
              const loadImage = () => {
                try {
                  ctx.save();
                  ctx.globalAlpha = layer.opacity;
                  ctx.drawImage(image!, topLeft.x, topLeft.y, width, height);
                  ctx.restore();
                  console.log(`✅ تم عرض الصورة: ${layer.name}`);
                } catch (err) {
                  console.error('خطأ في رسم الصورة:', err);
                }
              };
              
              image.onload = loadImage;
              image.onerror = () => {
                console.warn(`فشل تحميل الصورة: ${layer.url}`);
                drawLayerPlaceholder();
              };
              
              // محاولة تحميل من مسارات مختلفة
              const urls = [
                `/objects/${layer.url}`,
                `/public-objects/${layer.url}`,
                layer.url,
                `${layer.url}?t=${Date.now()}`
              ];
              
              let urlIndex = 0;
              const tryNextUrl = () => {
                if (urlIndex < urls.length) {
                  image!.src = urls[urlIndex++];
                } else {
                  drawLayerPlaceholder();
                }
              };
              
              image.onerror = tryNextUrl;
              tryNextUrl();
            } else if (image.complete && image.naturalWidth > 0) {
              // الصورة محملة مسبقاً
              ctx.drawImage(image, topLeft.x, topLeft.y, width, height);
            }
            
            // رسم placeholder
            const drawLayerPlaceholder = () => {
              ctx.fillStyle = 'rgba(76, 175, 80, 0.15)';
              ctx.fillRect(topLeft.x, topLeft.y, width, height);
              
              ctx.strokeStyle = '#4CAF50';
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 5]);
              ctx.strokeRect(topLeft.x, topLeft.y, width, height);
              
              ctx.fillStyle = '#2e7d32';
              ctx.font = `bold ${Math.max(12, 10 * zoom)}px Arial`;
              ctx.textAlign = 'center';
              ctx.fillText('📷', topLeft.x + width / 2, topLeft.y + height / 2 - 8);
              ctx.font = `${Math.max(10, 8 * zoom)}px Arial`;
              ctx.fillText(layer.name, topLeft.x + width / 2, topLeft.y + height / 2 + 12);
            };
            
            drawLayerPlaceholder();
            
          } else {
            // طبقات متجهة
            ctx.fillStyle = 'rgba(255, 152, 0, 0.2)';
            ctx.fillRect(topLeft.x, topLeft.y, width, height);
            
            ctx.strokeStyle = '#FF9800';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
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
  }, [layers, zoom, panX, panY]);

  // الرسم الرئيسي
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawAdvancedBasemap(ctx);
    drawUtmGrid(ctx);
    drawGeoreferencedLayers(ctx);
  }, [drawAdvancedBasemap, drawUtmGrid, drawGeoreferencedLayers]);

  // معالجة حركة الماوس مع التحويل الصحيح للإحداثيات
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // تحويل من الكانفاس إلى WGS84
    const wgs84Coords = canvasToWgs84(x, y, CANVAS_WIDTH, CANVAS_HEIGHT, zoom, panX, panY, MAP_CENTER);
    
    // تحويل من WGS84 إلى UTM
    const utmCoords = convertWgs84ToUtm(wgs84Coords.longitude, wgs84Coords.latitude);
    
    setCursorPosition({ 
      x, y, 
      lat: wgs84Coords.latitude, 
      lng: wgs84Coords.longitude, 
      utmX: utmCoords.x, 
      utmY: utmCoords.y 
    });
    
    if (isDragging) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      setPanX(panX + deltaX);
      setPanY(panY + deltaY);
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

  // التكبير بالعجلة مع التحسين للأداء
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // التكبير نحو موضع الماوس
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
    
    const beforeGeo = canvasToWgs84(mouseX, mouseY, CANVAS_WIDTH, CANVAS_HEIGHT, zoom, panX, panY, MAP_CENTER);
    setZoom(newZoom);
    
    // تعديل التحريك للحفاظ على نقطة التركيز
    setTimeout(() => {
      const afterCanvas = wgs84ToCanvas(beforeGeo.latitude, beforeGeo.longitude, CANVAS_WIDTH, CANVAS_HEIGHT, newZoom, panX, panY, MAP_CENTER);
      const deltaX = mouseX - afterCanvas.x;
      const deltaY = mouseY - afterCanvas.y;
      
      setPanX(prev => prev + deltaX);
      setPanY(prev => prev + deltaY);
    }, 0);
    
    console.log('🔍 تكبير متقدم:', { 
      oldZoom: zoom.toFixed(2), 
      newZoom: newZoom.toFixed(2),
      mouseUTM: `${cursorPosition.utmX.toFixed(0)}, ${cursorPosition.utmY.toFixed(0)}`
    });
  };

  // النقر على الخريطة مع إحداثيات دقيقة
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || activeTool === "hand") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const wgs84Coords = canvasToWgs84(x, y, CANVAS_WIDTH, CANVAS_HEIGHT, zoom, panX, panY, MAP_CENTER);
    const utmCoords = convertWgs84ToUtm(wgs84Coords.longitude, wgs84Coords.latitude);
    
    if (onPointClick) {
      onPointClick(wgs84Coords.latitude, wgs84Coords.longitude, utmCoords.x, utmCoords.y);
    }
  };

  // أدوات التحكم
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.1));
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // تكبير إلى طبقة مع تحويل إحداثيات دقيق
  const handleZoomToLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.bounds) return;

    // تحويل حدود UTM إلى WGS84
    const wgs84Bounds = convertImageBoundsUtmToWgs84(layer.bounds);
    const [[minLat, minLng], [maxLat, maxLng]] = wgs84Bounds;
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // حساب التكبير المناسب
    const latRange = Math.abs(maxLat - minLat);
    const lngRange = Math.abs(maxLng - minLng);
    const maxRange = Math.max(latRange, lngRange);
    const newZoom = Math.min(8, Math.max(0.3, 0.5 / maxRange));
    
    // تطبيق التغيير
    setZoom(newZoom);
    
    const targetCanvas = wgs84ToCanvas(centerLat, centerLng, CANVAS_WIDTH, CANVAS_HEIGHT, newZoom, 0, 0, MAP_CENTER);
    const centerCanvas = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    
    setPanX(centerCanvas.x - targetCanvas.x);
    setPanY(centerCanvas.y - targetCanvas.y);
    
    console.log(`🎯 تم التكبير إلى الطبقة: ${layer.name}`, {
      utmBounds: layer.bounds,
      wgs84Bounds: wgs84Bounds,
      center: { centerLat, centerLng },
      zoom: newZoom
    });
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
        className="cursor-crosshair border-2 border-gray-200 dark:border-gray-700 rounded-lg"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />

      {/* أدوات التحكم المتقدمة */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <Button size="sm" onClick={handleZoomIn} className="bg-white dark:bg-gray-800 shadow-lg">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleZoomOut} className="bg-white dark:bg-gray-800 shadow-lg">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleReset} className="bg-white dark:bg-gray-800 shadow-lg">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant={showGrid ? "default" : "outline"}
          onClick={() => setShowGrid(!showGrid)} 
          className="bg-white dark:bg-gray-800 shadow-lg"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setBasemapType(prev => 
            prev === 'satellite' ? 'street' : prev === 'street' ? 'topographic' : 'satellite'
          )}
          className="bg-white dark:bg-gray-800 shadow-lg"
          title={`خريطة أساسية: ${basemapType === 'satellite' ? 'قمر صناعي' : basemapType === 'street' ? 'شوارع' : 'طبوغرافية'}`}
        >
          <Map className="h-4 w-4" />
        </Button>
      </div>

      {/* عرض الإحداثيات المتقدم */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-sm">
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
          
          <span className={`font-mono ${coordinateSystem === 'UTM' ? 'text-green-600' : 'text-blue-600'}`}>
            {formatCoordinates(
              cursorPosition.lat, 
              cursorPosition.lng, 
              cursorPosition.utmX, 
              cursorPosition.utmY, 
              coordinateSystem
            )}
          </span>
          
          <Badge variant="secondary" className="text-xs">
            UTM Zone 38N
          </Badge>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex gap-4">
          <span>🔍 تكبير: {(zoom * 100).toFixed(0)}%</span>
          <span>📍 {validateYemenCoordinates(cursorPosition.lat, cursorPosition.lng) ? 'داخل اليمن' : 'خارج النطاق'}</span>
          <span>🗂️ طبقات: {layers.filter(l => l.visible).length}/{layers.length}</span>
        </div>
      </div>

      {/* معلومات الحالة */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            activeTool === 'hand' ? 'bg-green-500' : 'bg-blue-500'
          }`}></div>
          <span className="text-sm font-medium">
            {activeTool === 'hand' ? 'تصفح الخريطة' : `رسم: ${activeTool}`}
          </span>
        </div>
        
        <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <p>🌍 النظام: {coordinateSystem === 'UTM' ? 'UTM Zone 38N' : 'WGS 84'}</p>
          <p>🗺️ الأساس: {basemapType === 'satellite' ? 'أقمار صناعية' : basemapType === 'street' ? 'شوارع' : 'طبوغرافية'}</p>
          <p>📍 المنطقة: صنعاء، اليمن</p>
        </div>
      </div>
    </div>
  );
}