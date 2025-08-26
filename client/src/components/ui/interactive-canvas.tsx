import { useRef, useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ZoomIn, ZoomOut, Move, RotateCcw, Layers, Target } from "lucide-react";

export interface CanvasPoint {
  id: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  featureCode: string;
  color: string;
}

export interface CanvasLine {
  id: string;
  points: CanvasPoint[];
  featureCode: string;
  color: string;
  length?: number;
}

export interface CanvasPolygon {
  id: string;
  points: CanvasPoint[];
  featureCode: string;
  color: string;
  area?: number;
}

interface InteractiveCanvasProps {
  points: CanvasPoint[];
  lines: CanvasLine[];
  polygons: CanvasPolygon[];
  activeTool: "select" | "point" | "line" | "polygon";
  onPointClick: (x: number, y: number, lat: number, lng: number) => void;
  snapEnabled: boolean;
  currentGPS: { lat: number; lng: number };
}

export function InteractiveCanvas({
  points,
  lines,
  polygons,
  activeTool,
  onPointClick,
  snapEnabled,
  currentGPS
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0, lat: 0, lng: 0 });

  // Constants for coordinate system
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const MAP_CENTER = { lat: 15.3694, lng: 44.1910 }; // Sanaa coordinates
  const METERS_PER_DEGREE_LAT = 111000;
  const METERS_PER_DEGREE_LNG = 111000 * Math.cos(MAP_CENTER.lat * Math.PI / 180);

  // Convert geographic coordinates to canvas coordinates
  const geoToCanvas = useCallback((lat: number, lng: number) => {
    const deltaLat = lat - MAP_CENTER.lat;
    const deltaLng = lng - MAP_CENTER.lng;
    
    const x = (deltaLng * METERS_PER_DEGREE_LNG / 10) * zoom + CANVAS_WIDTH / 2 + panX;
    const y = -(deltaLat * METERS_PER_DEGREE_LAT / 10) * zoom + CANVAS_HEIGHT / 2 + panY;
    
    return { x, y };
  }, [zoom, panX, panY]);

  // Convert canvas coordinates to geographic coordinates
  const canvasToGeo = useCallback((x: number, y: number) => {
    const canvasX = (x - CANVAS_WIDTH / 2 - panX) / zoom;
    const canvasY = -(y - CANVAS_HEIGHT / 2 - panY) / zoom;
    
    const lng = MAP_CENTER.lng + (canvasX * 10) / METERS_PER_DEGREE_LNG;
    const lat = MAP_CENTER.lat + (canvasY * 10) / METERS_PER_DEGREE_LAT;
    
    return { lat, lng };
  }, [zoom, panX, panY]);

  // Draw grid
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!showGrid) return;
    
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    
    const gridSize = 50 * zoom;
    const offsetX = panX % gridSize;
    const offsetY = panY % gridSize;
    
    // Vertical lines
    for (let x = offsetX; x < CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = offsetY; y < CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [showGrid, zoom, panX, panY]);

  // Draw points
  const drawPoints = useCallback((ctx: CanvasRenderingContext2D) => {
    points.forEach(point => {
      const canvasPos = geoToCanvas(point.lat, point.lng);
      
      ctx.save();
      ctx.fillStyle = point.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.featureCode, canvasPos.x, canvasPos.y - 10);
      
      ctx.restore();
    });
  }, [points, geoToCanvas]);

  // Draw lines
  const drawLines = useCallback((ctx: CanvasRenderingContext2D) => {
    lines.forEach(line => {
      if (line.points.length < 2) return;
      
      ctx.save();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      const startPos = geoToCanvas(line.points[0].lat, line.points[0].lng);
      ctx.moveTo(startPos.x, startPos.y);
      
      for (let i = 1; i < line.points.length; i++) {
        const pos = geoToCanvas(line.points[i].lat, line.points[i].lng);
        ctx.lineTo(pos.x, pos.y);
      }
      
      ctx.stroke();
      ctx.restore();
    });
  }, [lines, geoToCanvas]);

  // Draw polygons
  const drawPolygons = useCallback((ctx: CanvasRenderingContext2D) => {
    polygons.forEach(polygon => {
      if (polygon.points.length < 3) return;
      
      ctx.save();
      ctx.fillStyle = polygon.color + '40'; // Semi-transparent
      ctx.strokeStyle = polygon.color;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      const startPos = geoToCanvas(polygon.points[0].lat, polygon.points[0].lng);
      ctx.moveTo(startPos.x, startPos.y);
      
      for (let i = 1; i < polygon.points.length; i++) {
        const pos = geoToCanvas(polygon.points[i].lat, polygon.points[i].lng);
        ctx.lineTo(pos.x, pos.y);
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }, [polygons, geoToCanvas]);

  // Draw current GPS position
  const drawGPSPosition = useCallback((ctx: CanvasRenderingContext2D) => {
    const gpsPos = geoToCanvas(currentGPS.lat, currentGPS.lng);
    
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.lineWidth = 3;
    
    // Outer circle (pulsing effect)
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(gpsPos.x, gpsPos.y, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    // Inner circle
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(gpsPos.x, gpsPos.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(gpsPos.x - 15, gpsPos.y);
    ctx.lineTo(gpsPos.x + 15, gpsPos.y);
    ctx.moveTo(gpsPos.x, gpsPos.y - 15);
    ctx.lineTo(gpsPos.x, gpsPos.y + 15);
    ctx.stroke();
    
    ctx.restore();
  }, [currentGPS, geoToCanvas]);

  // Main drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw components in order
    drawGrid(ctx);
    drawPolygons(ctx);
    drawLines(ctx);
    drawPoints(ctx);
    drawGPSPosition(ctx);
  }, [drawGrid, drawPolygons, drawLines, drawPoints, drawGPSPosition]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || activeTool === "select") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const geoCoords = canvasToGeo(x, y);
    onPointClick(x, y, geoCoords.lat, geoCoords.lng);
  };

  // Handle mouse move for cursor position
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const geoCoords = canvasToGeo(x, y);
    setCursorPosition({ x, y, lat: geoCoords.lat, lng: geoCoords.lng });
    
    // Handle dragging
    if (isDragging) {
      setPanX(panX + (x - dragStart.x));
      setPanY(panY + (y - dragStart.y));
      setDragStart({ x, y });
    }
  };

  // Handle mouse down for dragging
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "select") {
      setIsDragging(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setDragStart({ x, y });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom functions
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Draw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <Card className="relative overflow-hidden">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="cursor-crosshair border"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid="survey-canvas"
      />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <Button size="sm" onClick={handleZoomIn} data-testid="button-zoom-in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleZoomOut} data-testid="button-zoom-out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={handleReset} data-testid="button-reset-view">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant={showGrid ? "default" : "outline"}
          onClick={() => setShowGrid(!showGrid)}
          data-testid="button-toggle-grid"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Info Panel */}
      <div className="absolute top-4 right-4 space-y-2">
        <Badge variant="secondary">
          التكبير: {(zoom * 100).toFixed(0)}%
        </Badge>
        <Badge variant="secondary" className="block">
          الموضع: {cursorPosition.lat.toFixed(6)}, {cursorPosition.lng.toFixed(6)}
        </Badge>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4">
        <Card className="p-3 bg-white/90 backdrop-blur">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>موقع GPS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>نقاط مرفوعة</span>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
}