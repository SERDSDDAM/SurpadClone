import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Ruler, Maximize2 } from "lucide-react";
import { GPSData } from "@/types/survey";
import { SurveyPoint, SurveyLine, SurveyPolygon } from "@shared/schema";

interface InteractiveMapProps {
  currentPosition: GPSData | null;
  surveyPoints: SurveyPoint[];
  surveyLines: SurveyLine[];
  surveyPolygons: SurveyPolygon[];
  onMapClick?: (lat: number, lng: number) => void;
}

export function InteractiveMap({
  currentPosition,
  surveyPoints,
  surveyLines,
  surveyPolygons,
  onMapClick,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !mapRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = mapRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw survey elements
    drawSurveyPoints(ctx, surveyPoints, canvas.width, canvas.height);
    drawSurveyLines(ctx, surveyLines, canvas.width, canvas.height);
    drawSurveyPolygons(ctx, surveyPolygons, canvas.width, canvas.height);

    // Draw current position
    if (currentPosition) {
      drawCurrentPosition(ctx, canvas.width / 2, canvas.height / 2);
    }

    // Draw sample building
    drawSampleBuilding(ctx, canvas.width * 0.75, canvas.height * 0.4);

  }, [currentPosition, surveyPoints, surveyLines, surveyPolygons]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.strokeStyle = 'rgba(25, 118, 210, 0.1)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawCurrentPosition = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Outer circle with animation effect
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.fill();

    // Inner circle
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    
    // White border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('موقعك الحالي', x, y - 20);
  };

  const drawSurveyPoints = (ctx: CanvasRenderingContext2D, points: SurveyPoint[], width: number, height: number) => {
    points.forEach((point, index) => {
      // Map coordinates to canvas position (simplified)
      const x = (index % 3) * 100 + 100;
      const y = Math.floor(index / 3) * 80 + 80;

      // Point circle
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#1976d2';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Point label
      ctx.fillStyle = '#1976d2';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.pointNumber, x, y - 12);
    });
  };

  const drawSurveyLines = (ctx: CanvasRenderingContext2D, lines: SurveyLine[], width: number, height: number) => {
    lines.forEach((line) => {
      if (line.points && Array.isArray(line.points) && line.points.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = '#388e3c';
        ctx.lineWidth = 3;
        
        // Draw line (simplified positioning)
        const startX = 150;
        const startY = 100;
        const endX = 250;
        const endY = 150;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    });
  };

  const drawSurveyPolygons = (ctx: CanvasRenderingContext2D, polygons: SurveyPolygon[], width: number, height: number) => {
    polygons.forEach((polygon) => {
      if (polygon.points && Array.isArray(polygon.points) && polygon.points.length >= 3) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(25, 118, 210, 0.2)';
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 2;
        
        // Draw polygon (simplified)
        const centerX = width * 0.6;
        const centerY = height * 0.3;
        
        ctx.rect(centerX, centerY, 100, 60);
        ctx.fill();
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#1976d2';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(polygon.featureCode, centerX + 50, centerY + 35);
      }
    });
  };

  const drawSampleBuilding = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.beginPath();
    ctx.rect(x, y, 128, 96);
    ctx.fillStyle = 'rgba(25, 118, 210, 0.1)';
    ctx.fill();
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#1976d2';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('مبنى', x + 64, y + 52);
  };

  const handleMapClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onMapClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert canvas coordinates to lat/lng (simplified)
    const lat = 15.3547 + (y - canvas.height / 2) * 0.0001;
    const lng = 44.2066 + (x - canvas.width / 2) * 0.0001;
    
    onMapClick(lat, lng);
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gray-800 text-white p-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">خريطة المساحة التفاعلية</h3>
          <div className="flex space-x-2 space-x-reverse">
            <Button variant="outline" size="sm" className="bg-gray-600 hover:bg-gray-500 border-gray-600">
              <Layers className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-gray-600 hover:bg-gray-500 border-gray-600">
              <Ruler className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-gray-600 hover:bg-gray-500 border-gray-600">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={mapRef}
          className="relative w-full bg-green-50 overflow-hidden"
          style={{ height: "600px" }}
          data-testid="interactive-map"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onClick={handleMapClick}
          />
          
          {/* Coordinate Display */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-sm font-mono">
            X: 573,420.15 | Y: 1,702,850.32
          </div>

          {/* Scale Bar */}
          <div className="absolute bottom-4 right-4 bg-white p-2 rounded border">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-16 h-1 bg-black"></div>
              <span className="text-xs">10م</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
