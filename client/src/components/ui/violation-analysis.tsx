import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle,
  Calculator,
  Map,
  Ruler,
  Home,
  Car,
  TreePine,
  Zap,
  Shield
} from "lucide-react";

interface ViolationArea {
  type: "setback" | "height" | "coverage" | "parking" | "green";
  area: number;
  percentage: number;
  severity: "critical" | "warning" | "minor";
  description: string;
}

interface PlotAnalysis {
  plotArea: number;
  buildingArea: number;
  buildingCoverage: number;
  setbackViolations: ViolationArea[];
  heightViolations: ViolationArea[];
  validArea: number;
  violations: ViolationArea[];
  complianceScore: number;
  recommendations: string[];
}

interface ViolationAnalysisProps {
  plotPolygon?: any[];
  buildingPolygons?: any[];
  streetLines?: any[];
  zonePlan?: {
    setbacks: { front: number; side: number; rear: number };
    maxHeight: number;
    maxCoverage: number;
    minParking: number;
    minGreen: number;
  };
  className?: string;
}

export function ViolationAnalysis({
  plotPolygon = [],
  buildingPolygons = [],
  streetLines = [],
  zonePlan = {
    setbacks: { front: 4, side: 2, rear: 3 },
    maxHeight: 15,
    maxCoverage: 60,
    minParking: 1,
    minGreen: 15
  },
  className = ""
}: ViolationAnalysisProps) {
  const [analysis, setAnalysis] = useState<PlotAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSetback, setSelectedSetback] = useState("front");
  const [customSetback, setCustomSetback] = useState(4);

  // Calculate violation area using buffer analysis (simplified)
  const calculateViolationArea = (
    plotPolygon: any[],
    streetLine: any[],
    setbackDistance: number
  ): { violationArea: number; validArea: number; remainingPolygon: any[] } => {
    if (!plotPolygon.length || !streetLine.length) {
      return { violationArea: 0, validArea: 0, remainingPolygon: plotPolygon };
    }

    // Simplified calculation - in real implementation would use PostGIS or turf.js
    const plotArea = calculatePolygonArea(plotPolygon);
    
    // Estimate violation area based on setback distance and plot shape
    const perimeter = calculatePolygonPerimeter(plotPolygon);
    const estimatedViolationArea = Math.min(
      plotArea * 0.3, // Max 30% can be violation
      perimeter * setbackDistance * 0.8 // Buffer area estimate
    );
    
    const validArea = plotArea - estimatedViolationArea;
    
    return {
      violationArea: estimatedViolationArea,
      validArea: Math.max(0, validArea),
      remainingPolygon: plotPolygon // Simplified - would return actual clipped polygon
    };
  };

  // Calculate polygon area using shoelace formula (simplified)
  const calculatePolygonArea = (polygon: any[]): number => {
    if (polygon.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      area += polygon[i].x * polygon[j].y;
      area -= polygon[j].x * polygon[i].y;
    }
    return Math.abs(area) / 2;
  };

  // Calculate polygon perimeter
  const calculatePolygonPerimeter = (polygon: any[]): number => {
    if (polygon.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const dx = polygon[j].x - polygon[i].x;
      const dy = polygon[j].y - polygon[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
  };

  // Perform comprehensive plot analysis
  const performAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock plot data for demonstration
    const mockPlotPolygon = [
      { x: 0, y: 0, lat: 15.3694, lng: 44.1910 },
      { x: 20, y: 0, lat: 15.3696, lng: 44.1910 },
      { x: 20, y: 30, lat: 15.3696, lng: 44.1915 },
      { x: 0, y: 30, lat: 15.3694, lng: 44.1915 }
    ];
    
    const mockStreetLine = [
      { x: -2, y: -2, lat: 15.3693, lng: 44.1908 },
      { x: 22, y: -2, lat: 15.3697, lng: 44.1908 }
    ];

    const plotArea = calculatePolygonArea(mockPlotPolygon);
    const buildingArea = plotArea * 0.4; // Assume 40% coverage
    
    // Calculate setback violations
    const frontSetbackAnalysis = calculateViolationArea(
      mockPlotPolygon,
      mockStreetLine,
      zonePlan.setbacks.front
    );

    // Calculate violations
    const violations: ViolationArea[] = [];
    
    // Setback violations
    if (frontSetbackAnalysis.violationArea > 5) {
      violations.push({
        type: "setback",
        area: frontSetbackAnalysis.violationArea,
        percentage: (frontSetbackAnalysis.violationArea / plotArea) * 100,
        severity: frontSetbackAnalysis.violationArea > 50 ? "critical" : "warning",
        description: `انتهاك ارتداد أمامي: ${frontSetbackAnalysis.violationArea.toFixed(1)} م²`
      });
    }

    // Coverage violations
    const coveragePercent = (buildingArea / plotArea) * 100;
    if (coveragePercent > zonePlan.maxCoverage) {
      violations.push({
        type: "coverage",
        area: buildingArea - (plotArea * zonePlan.maxCoverage / 100),
        percentage: coveragePercent - zonePlan.maxCoverage,
        severity: coveragePercent > zonePlan.maxCoverage + 20 ? "critical" : "warning",
        description: `انتهاك نسبة البناء: ${coveragePercent.toFixed(1)}% (الحد الأقصى ${zonePlan.maxCoverage}%)`
      });
    }

    // Calculate compliance score
    const maxPossibleViolations = 5;
    const complianceScore = Math.max(0, 100 - (violations.length / maxPossibleViolations) * 100);

    // Generate recommendations
    const recommendations = [];
    if (violations.some(v => v.type === "setback")) {
      recommendations.push("يجب تعديل موقع المبنى للالتزام بالارتدادات المطلوبة");
      recommendations.push("يُنصح بإعادة تصميم الواجهة الأمامية لتحقيق الارتداد القانوني");
    }
    if (violations.some(v => v.type === "coverage")) {
      recommendations.push("تقليل مساحة البناء للالتزام بنسبة البناء المسموحة");
      recommendations.push("اقتراح تصميم متعدد الطوابق بدلاً من التوسع الأفقي");
    }
    if (violations.length === 0) {
      recommendations.push("المبنى يلتزم بجميع اشتراطات البناء");
      recommendations.push("يمكن المضي قدماً في إجراءات الترخيص");
    }

    const result: PlotAnalysis = {
      plotArea,
      buildingArea,
      buildingCoverage: coveragePercent,
      setbackViolations: violations.filter(v => v.type === "setback"),
      heightViolations: violations.filter(v => v.type === "height"),
      validArea: plotArea - violations.reduce((sum, v) => sum + v.area, 0),
      violations,
      complianceScore,
      recommendations
    };

    setAnalysis(result);
    setIsAnalyzing(false);
  };

  // Auto-analyze when data changes
  useEffect(() => {
    if (plotPolygon.length > 0 || buildingPolygons.length > 0) {
      performAnalysis();
    }
  }, [plotPolygon, buildingPolygons, streetLines]);

  const getViolationColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-700 bg-red-100 border-red-200";
      case "warning": return "text-yellow-700 bg-yellow-100 border-yellow-200";
      case "minor": return "text-blue-700 bg-blue-100 border-blue-200";
      default: return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "warning": return <Shield className="w-4 h-4 text-yellow-600" />;
      default: return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
  };

  return (
    <Card className={`${className}`} data-testid="violation-analysis">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          تحليل المساحات المخالفة
          {analysis && (
            <Badge 
              variant={analysis.complianceScore >= 80 ? "default" : "destructive"}
              className="mr-auto"
            >
              {analysis.complianceScore.toFixed(0)}% ملتزم
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Analysis Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">نوع الارتداد</Label>
            <select
              value={selectedSetback}
              onChange={(e) => setSelectedSetback(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
              data-testid="setback-type-select"
            >
              <option value="front">ارتداد أمامي</option>
              <option value="side">ارتداد جانبي</option>
              <option value="rear">ارتداد خلفي</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">المسافة المطلوبة (متر)</Label>
            <Input
              type="number"
              value={customSetback}
              onChange={(e) => setCustomSetback(parseFloat(e.target.value) || 0)}
              className="text-sm"
              min={0}
              step={0.5}
              data-testid="setback-distance-input"
            />
          </div>
        </div>

        <Button
          onClick={performAnalysis}
          disabled={isAnalyzing}
          className="w-full"
          data-testid="analyze-btn"
        >
          {isAnalyzing ? "جاري التحليل..." : "تحليل المساحات"}
        </Button>

        <Separator />

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-3">
            <div className="text-sm font-medium">جاري تحليل البيانات...</div>
            <Progress value={70} className="w-full" />
            <div className="text-xs text-gray-500">
              حساب الارتدادات والمساحات المخالفة...
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && !isAnalyzing && (
          <Tabs defaultValue="violations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="violations" data-testid="violations-tab">
                المخالفات ({analysis.violations.length})
              </TabsTrigger>
              <TabsTrigger value="measurements" data-testid="measurements-tab">
                القياسات
              </TabsTrigger>
              <TabsTrigger value="recommendations" data-testid="recommendations-tab">
                التوصيات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="violations" className="space-y-4">
              {analysis.violations.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    لا توجد مخالفات. المبنى يلتزم بجميع اشتراطات البناء.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {analysis.violations.map((violation, index) => (
                    <Card 
                      key={index}
                      className={`border-2 ${getViolationColor(violation.severity)}`}
                      data-testid={`violation-${index}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(violation.severity)}
                          <div className="flex-1 space-y-2">
                            <div className="font-medium">{violation.description}</div>
                            <div className="text-sm text-gray-600">
                              المساحة المخالفة: {violation.area.toFixed(1)} م²
                              ({violation.percentage.toFixed(1)}%)
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getViolationColor(violation.severity)}`}
                            >
                              {violation.severity === "critical" ? "حرج" :
                               violation.severity === "warning" ? "تحذير" : "طفيف"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="measurements" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">مساحة القطعة</span>
                  </div>
                  <div className="text-lg font-mono" data-testid="plot-area">
                    {analysis.plotArea.toFixed(1)} م²
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-green-600" />
                    <span className="font-medium">مساحة البناء</span>
                  </div>
                  <div className="text-lg font-mono" data-testid="building-area">
                    {analysis.buildingArea.toFixed(1)} م²
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">نسبة البناء</span>
                  </div>
                  <div className="text-lg font-mono" data-testid="building-coverage">
                    {analysis.buildingCoverage.toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium">المساحة الصالحة</span>
                  </div>
                  <div className="text-lg font-mono" data-testid="valid-area">
                    {analysis.validArea.toFixed(1)} م²
                  </div>
                </div>
              </div>

              {/* Compliance Score */}
              <Card className="bg-gradient-to-r from-blue-50 to-green-50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">درجة الالتزام</span>
                      <span className="text-lg font-bold" data-testid="compliance-score">
                        {analysis.complianceScore.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={analysis.complianceScore} 
                      className="w-full"
                    />
                    <div className="text-xs text-gray-600">
                      {analysis.complianceScore >= 90 ? "ممتاز" :
                       analysis.complianceScore >= 80 ? "جيد جداً" :
                       analysis.complianceScore >= 70 ? "جيد" :
                       analysis.complianceScore >= 60 ? "مقبول" : "غير مقبول"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <Zap className="h-4 w-4" />
                    <AlertDescription data-testid={`recommendation-${index}`}>
                      {recommendation}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button variant="outline" className="flex items-center gap-2" data-testid="generate-report-btn">
                  <Map className="w-4 h-4" />
                  توليد تقرير
                </Button>
                <Button variant="outline" className="flex items-center gap-2" data-testid="save-analysis-btn">
                  <CheckCircle className="w-4 h-4" />
                  حفظ التحليل
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}