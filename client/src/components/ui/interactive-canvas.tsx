import React, { useRef, useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Move, RotateCcw, Save } from "lucide-react";

interface Point {
  id: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  featureCode?: string;
  featureType?: string;
  color?: string;
}

interface Line {
  id: string;
  points: Point[];
  featureCode?: string;
  color?: string;
}

interface CanvasPolygon {
  id: string;
  points: Point[];
  featureCode?: string;
  color?: string;
  area?: number;
}

interface InteractiveCanvasProps {
  points: Point[];
  lines: Line[];
  polygons: CanvasPolygon[];
  mode: "point" | "line" | "polygon" | "select";
  snapEnabled: boolean;
  onPointAdd: (point: Omit<Point, 'id'>) => void;
  onLineAdd: (line: Omit<Line, 'id'>) => void;
  onPolygonAdd: (polygon: Omit<CanvasPolygon, 'id'>) => void;
  onFeatureSelect: (feature: any) => void;
  className?: string;
}

export function InteractiveCanvas({
  points,
  lines,
  polygons,
  mode,
  snapEnabled,
  onPointAdd,
  onLineAdd,
  onPolygonAdd,
  onFeatureSelect,
  className = ""
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<Point[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);

  const SNAP_DISTANCE = 15; // pixels
  const GRID_SIZE = 20; // pixels
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Convert geographic coordinates to canvas coordinates
  const geoToCanvas = useCallback((lat: number, lng: number) => {
    const centerLat = 15.3694; // Sanaa approximate center
    const centerLng = 44.1910;
    
    // Simple projection (for small areas in Yemen)
    const x = (lng - centerLng) * 111320 * Math.cos(centerLat * Math.PI / 180) + CANVAS_WIDTH / 2;
    const y = CANVAS_HEIGHT / 2 - (lat - centerLat) * 110540;
    
    return {
      x: x * scale + panX,
      y: y * scale + panY
    };
  }, [scale, panX, panY]);

  // Convert canvas coordinates to geographic coordinates
  const canvasToGeo = useCallback((x: number, y: number) => {
    const centerLat = 15.3694;
    const centerLng = 44.1910;
    
    const adjustedX = (x - panX) / scale - CANVAS_WIDTH / 2;
    const adjustedY = CANVAS_HEIGHT / 2 - (y - panY) / scale;
    
    const lng = centerLng + adjustedX / (111320 * Math.cos(centerLat * Math.PI / 180));
    const lat = centerLat + adjustedY / 110540;
    
    return { lat, lng };
  }, [scale, panX, panY]);

  // Find nearest point for snapping
  const findSnapPoint = useCallback((mouseX: number, mouseY: number): Point | null => {
    if (!snapEnabled) return null;

    let nearestPoint: Point | null = null;
    let nearestDistance = SNAP_DISTANCE;

    // Check existing points
    points.forEach(point => {
      const canvasPos = geoToCanvas(point.lat, point.lng);
      const distance = Math.sqrt(
        Math.pow(mouseX - canvasPos.x, 2) + Math.pow(mouseY - canvasPos.y, 2)
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPoint = point;
      }
    });

    // Check line endpoints and midpoints
    lines.forEach(line => {
      line.points.forEach(point => {
        const canvasPos = geoToCanvas(point.lat, point.lng);
        const distance = Math.sqrt(
          Math.pow(mouseX - canvasPos.x, 2) + Math.pow(mouseY - canvasPos.y, 2)
        );
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPoint = point;
        }
      });
    });

    return nearestPoint;
  }, [snapEnabled, points, lines, geoToCanvas]);

  // Draw everything on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw polygons
    polygons.forEach(polygon => {
      if (polygon.points.length < 3) return;
      
      ctx.fillStyle = polygon.color ? `${polygon.color}40` : '#32CD3240';
      ctx.strokeStyle = polygon.color || '#32CD32';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      const firstPoint = geoToCanvas(polygon.points[0].lat, polygon.points[0].lng);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      polygon.points.slice(1).forEach(point => {
        const canvasPos = geoToCanvas(point.lat, point.lng);
        ctx.lineTo(canvasPos.x, canvasPos.y);
      });
      
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Draw lines
    lines.forEach(line => {
      if (line.points.length < 2) return;
      
      ctx.strokeStyle = line.color || '#0066CC';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      const firstPoint = geoToCanvas(line.points[0].lat, line.points[0].lng);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      line.points.slice(1).forEach(point => {
        const canvasPos = geoToCanvas(point.lat, point.lng);
        ctx.lineTo(canvasPos.x, canvasPos.y);
      });
      
      ctx.stroke();
    });

    // Draw current line being drawn
    if (currentLine.length > 0) {
      ctx.strokeStyle = '#FF6600';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      const firstPoint = geoToCanvas(currentLine[0].lat, currentLine[0].lng);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      currentLine.slice(1).forEach(point => {
        const canvasPos = geoToCanvas(point.lat, point.lng);
        ctx.lineTo(canvasPos.x, canvasPos.y);
      });
      
      // Draw line to mouse position
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw current polygon being drawn
    if (currentPolygon.length > 0) {
      ctx.strokeStyle = '#FF6600';
      ctx.fillStyle = '#FF660040';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      const firstPoint = geoToCanvas(currentPolygon[0].lat, currentPolygon[0].lng);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      currentPolygon.slice(1).forEach(point => {
        const canvasPos = geoToCanvas(point.lat, point.lng);
        ctx.lineTo(canvasPos.x, canvasPos.y);
      });
      
      // Draw line to mouse position
      ctx.lineTo(mousePos.x, mousePos.y);
      
      if (currentPolygon.length > 2) {
        ctx.lineTo(firstPoint.x, firstPoint.y);
        ctx.fill();
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw points
    points.forEach(point => {
      const canvasPos = geoToCanvas(point.lat, point.lng);
      
      ctx.fillStyle = point.color || '#FF0000';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Draw point label
      if (point.featureCode) {
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(point.featureCode, canvasPos.x, canvasPos.y - 12);
      }
    });

    // Draw snap indicator
    if (snapPoint) {
      const canvasPos = geoToCanvas(snapPoint.lat, snapPoint.lng);
      
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 12, 0, 2 * Math.PI);
      ctx.stroke();
    }

  }, [
    points, lines, polygons, currentLine, currentPolygon, 
    mousePos, snapPoint, geoToCanvas, scale, panX, panY
  ]);

  // Handle mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });

    if (isPanning) {
      setPanX(panX + e.movementX);
      setPanY(panY + e.movementY);
    }

    // Update snap point
    setSnapPoint(findSnapPoint(x, y));
  }, [isPanning, panX, panY, findSnapPoint]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      return;
    }

    if (e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let pointLocation = canvasToGeo(x, y);
    
    // Use snap point if available
    if (snapPoint) {
      pointLocation = { lat: snapPoint.lat, lng: snapPoint.lng };
    }

    const newPoint: Omit<Point, 'id'> = {
      x,
      y,
      lat: pointLocation.lat,
      lng: pointLocation.lng
    };

    switch (mode) {
      case "point":
        onPointAdd(newPoint);
        break;
        
      case "line":
        if (!isDrawing) {
          setCurrentLine([newPoint as Point]);
          setIsDrawing(true);
        } else {
          setCurrentLine(prev => [...prev, newPoint as Point]);
        }
        break;
        
      case "polygon":
        if (!isDrawing) {
          setCurrentPolygon([newPoint as Point]);
          setIsDrawing(true);
        } else {
          setCurrentPolygon(prev => [...prev, newPoint as Point]);
        }
        break;
    }
  }, [mode, isDrawing, snapPoint, canvasToGeo, onPointAdd]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (mode === "line" && currentLine.length > 1) {
      onLineAdd({ points: currentLine });
      setCurrentLine([]);
      setIsDrawing(false);
    } else if (mode === "polygon" && currentPolygon.length > 2) {
      onPolygonAdd({ points: currentPolygon });
      setCurrentPolygon([]);
      setIsDrawing(false);
    }
  }, [mode, currentLine, currentPolygon, onLineAdd, onPolygonAdd]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCurrentLine([]);
        setCurrentPolygon([]);
        setIsDrawing(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Draw on canvas
  useEffect(() => {
    draw();
  }, [draw]);

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.2));
  const handleReset = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  };

  return (
    <Card className={`${className} p-4`} data-testid="interactive-canvas">
      <div className="space-y-2">
        {/* Canvas Controls */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomIn} data-testid="zoom-in-btn">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut} data-testid="zoom-out-btn">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset} data-testid="reset-view-btn">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            التكبير: {Math.round(scale * 100)}% | 
            {snapEnabled ? " الربط الذكي مفعل" : " الربط الذكي معطل"}
          </div>
        </div>

        {/* Drawing Instructions */}
        {mode !== "select" && (
          <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
            {mode === "point" && "انقر لإضافة نقطة"}
            {mode === "line" && (isDrawing ? "انقر لإضافة نقاط الخط، انقر مرتين لإنهاء الخط" : "انقر لبدء رسم خط")}
            {mode === "polygon" && (isDrawing ? "انقر لإضافة نقاط المضلع، انقر مرتين لإنهاء المضلع" : "انقر لبدء رسم مضلع")}
          </div>
        )}

        {/* Canvas Container */}
        <div 
          ref={containerRef} 
          className="relative border border-gray-300 rounded-lg overflow-hidden bg-white"
          style={{ cursor: isPanning ? 'grabbing' : mode === 'select' ? 'default' : 'crosshair' }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className="block"
            data-testid="drawing-canvas"
          />
        </div>

        {/* Status Bar */}
        <div className="text-xs text-gray-500 flex justify-between">
          <span>النقاط: {points.length} | الخطوط: {lines.length} | المضلعات: {polygons.length}</span>
          <span>الإحداثيات: {mousePos.x}, {mousePos.y}</span>
        </div>
      </div>
    </Card>
  );
}