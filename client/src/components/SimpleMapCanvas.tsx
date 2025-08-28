import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { 
  convertWgs84ToUtm, 
  convertUtmToWgs84,
  formatCoordinates
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
  bounds?: [[number, number], [number, number]]; // UTM bounds
  url: string;
  coordinateSystem?: string;
}

interface SimpleMapCanvasProps {
  layers: GeoreferencedLayer[];
  activeTool?: string;
  onPointClick?: (lat: number, lng: number, utmX: number, utmY: number) => void;
  onZoomToLayer?: (layerId: string) => void;
}

export function SimpleMapCanvas({ 
  layers, 
  activeTool = 'hand', 
  onPointClick,
  onZoomToLayer 
}: SimpleMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // حالات التفاعل
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({
    x: 0, y: 0, lat: 15.3694, lng: 44.1910, utmX: 400000, utmY: 1700000
  });

  // رسم خريطة أساسية بسيطة
  const drawBasemap = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    // خلفية طبيعية لليمن
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0,
      CANVAS_WIDTH/2, CANVAS_HEIGHT/2, Math.max(CANVAS_WIDTH, CANVAS_HEIGHT)
    );
    gradient.addColorStop(0, '#2d5a27'); // أخضر للمرتفعات
    gradient.addColorStop(0.4, '#8d6e63'); // بني للهضاب
    gradient.addColorStop(0.7, '#d7ccc8'); // بيج للصحراء
    gradient.addColorStop(1, '#87ceeb'); // أزرق للبحر
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // شبكة بسيطة
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
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
    
    ctx.restore();
  }, [zoom, panX, panY]);

  // رسم الطبقات
  const drawLayers = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const layer of layers.filter(l => l.visible)) {
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      
      if (!layer.bounds) continue;
      
      // رسم مستطيل للطبقة
      const [[minX, minY], [maxX, maxY]] = layer.bounds;
      const centerUtm = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
      const sizeUtm = { width: maxX - minX, height: maxY - minY };
      
      // تحويل الحجم للعرض
      const scale = zoom * 0.0001; // مقياس للتحويل
      const centerX = CANVAS_WIDTH / 2 + (centerUtm.x - 400000) * scale + panX;
      const centerY = CANVAS_HEIGHT / 2 - (centerUtm.y - 1700000) * scale + panY;
      const width = sizeUtm.width * scale;
      const height = sizeUtm.height * scale;
      
      // رسم الطبقة
      if (layer.type === 'raster') {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
        
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - width/2, centerY - height/2, width, height);
        
        // اسم الطبقة
        ctx.fillStyle = '#2e7d32';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(layer.name, centerX, centerY);
        ctx.fillText('📷 صورة مرفوعة', centerX, centerY + 15);
      }
      
      ctx.restore();
    }
  }, [layers, zoom, panX, panY]);

  // الرسم الرئيسي
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBasemap(ctx);
    drawLayers(ctx);
  }, [drawBasemap, drawLayers]);

  // معالجة الماوس
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // تحويل تقريبي للإحداثيات
    const scale = zoom * 0.0001;
    const utmX = 400000 + (x - CANVAS_WIDTH/2 - panX) / scale;
    const utmY = 1700000 - (y - CANVAS_HEIGHT/2 - panY) / scale;
    
    const wgs84 = convertUtmToWgs84(utmX, utmY);
    
    setCursorPosition({ 
      x, y, 
      lat: wgs84.latitude, 
      lng: wgs84.longitude, 
      utmX, 
      utmY 
    });
    
    if (isDragging) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      setPanX(panX + deltaX);
      setPanY(panY + deltaY);
      setDragStart({ x, y });
    }
  };

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

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)));
    
    console.log('🔍 تكبير الخريطة:', { 
      oldZoom: zoom.toFixed(2), 
      newZoom: (zoom * zoomFactor).toFixed(2)
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || activeTool === "hand") return;
    
    if (onPointClick) {
      onPointClick(cursorPosition.lat, cursorPosition.lng, cursorPosition.utmX, cursorPosition.utmY);
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

      {/* أدوات التحكم */}
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
      </div>

      {/* عرض الإحداثيات */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center gap-4">
          <span className="font-medium">الإحداثيات:</span>
          <span className="font-mono text-green-600">
            {formatCoordinates(
              cursorPosition.lat, 
              cursorPosition.lng, 
              cursorPosition.utmX, 
              cursorPosition.utmY, 
              'UTM'
            )}
          </span>
          <Badge variant="secondary" className="text-xs">
            UTM Zone 38N
          </Badge>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex gap-4">
          <span>🔍 تكبير: {(zoom * 100).toFixed(0)}%</span>
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
          <p>🌍 النظام: UTM Zone 38N</p>
          <p>📍 المنطقة: صنعاء، اليمن</p>
        </div>
      </div>
    </div>
  );
}