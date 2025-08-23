import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Route,
  Pentagon,
  Target,
  Grid,
  Layers,
  Search,
  Save,
  FileText,
  Settings,
  Zap
} from "lucide-react";

interface FeatureCode {
  code: string;
  name: string;
  type: "point" | "line" | "polygon";
  category: string;
  color: string;
  description?: string;
}

interface SmartToolbarProps {
  activeMode: "point" | "line" | "polygon" | "select";
  onModeChange: (mode: "point" | "line" | "polygon" | "select") => void;
  onFeatureCreate: (type: string, featureCode: string, data: any) => void;
  snapEnabled: boolean;
  onSnapToggle: (enabled: boolean) => void;
  className?: string;
}

// Feature codes database (similar to professional surveying software)
const FEATURE_CODES: FeatureCode[] = [
  // Points
  { code: "BM", name: "نقطة مرجعية", type: "point", category: "مرجعية", color: "#FF0000" },
  { code: "CP", name: "نقطة تحكم", type: "point", category: "مرجعية", color: "#FF4444" },
  { code: "TP", name: "نقطة مؤقتة", type: "point", category: "مرجعية", color: "#FF8888" },
  { code: "TREE", name: "شجرة", type: "point", category: "طبيعية", color: "#00AA00" },
  { code: "POLE", name: "عمود", type: "point", category: "منشآت", color: "#666666" },
  { code: "WELL", name: "بئر", type: "point", category: "مياه", color: "#0066CC" },
  { code: "CORNER", name: "زاوية", type: "point", category: "حدود", color: "#FF6600" },
  { code: "GATE", name: "بوابة", type: "point", category: "منشآت", color: "#AA6600" },
  
  // Lines
  { code: "ROAD", name: "طريق", type: "line", category: "طرق", color: "#444444" },
  { code: "FENCE", name: "سياج", type: "line", category: "حدود", color: "#8B4513" },
  { code: "WALL", name: "جدار", type: "line", category: "منشآت", color: "#888888" },
  { code: "CURB", name: "رصيف", type: "line", category: "طرق", color: "#CCCCCC" },
  { code: "DITCH", name: "خندق", type: "line", category: "مياه", color: "#4169E1" },
  { code: "PIPE", name: "أنبوب", type: "line", category: "مرافق", color: "#8A2BE2" },
  { code: "CABLE", name: "كابل", type: "line", category: "مرافق", color: "#FF1493" },
  { code: "BOUNDARY", name: "حد", type: "line", category: "حدود", color: "#DC143C" },
  
  // Polygons
  { code: "BUILDING", name: "مبنى", type: "polygon", category: "منشآت", color: "#CD853F" },
  { code: "PLOT", name: "قطعة أرض", type: "polygon", category: "حدود", color: "#32CD32" },
  { code: "PARKING", name: "موقف", type: "polygon", category: "طرق", color: "#696969" },
  { code: "GARDEN", name: "حديقة", type: "polygon", category: "طبيعية", color: "#9ACD32" },
  { code: "POOL", name: "بركة", type: "polygon", category: "مياه", color: "#00CED1" },
  { code: "SETBACK", name: "منطقة ارتداد", type: "polygon", category: "تخطيط", color: "#FFB6C1" },
];

export function SmartToolbar({
  activeMode,
  onModeChange,
  onFeatureCreate,
  snapEnabled,
  onSnapToggle,
  className = ""
}: SmartToolbarProps) {
  const [selectedFeatureCode, setSelectedFeatureCode] = useState<FeatureCode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeatureCodes, setShowFeatureCodes] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [pointNumber, setPointNumber] = useState(1);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-select appropriate feature code when mode changes
    const defaultCodes = {
      point: FEATURE_CODES.find(f => f.code === "TP"),
      line: FEATURE_CODES.find(f => f.code === "BOUNDARY"), 
      polygon: FEATURE_CODES.find(f => f.code === "PLOT")
    };
    
    if (activeMode !== "select" && !selectedFeatureCode) {
      setSelectedFeatureCode(defaultCodes[activeMode] || null);
    }
  }, [activeMode, selectedFeatureCode]);

  const filteredFeatureCodes = FEATURE_CODES.filter(code => 
    code.type === activeMode &&
    (code.name.includes(searchQuery) || code.code.includes(searchQuery))
  );

  const handleModeChange = (mode: "point" | "line" | "polygon" | "select") => {
    onModeChange(mode);
    setShowFeatureCodes(mode !== "select");
  };

  const handleFeatureCodeSelect = (featureCode: FeatureCode) => {
    setSelectedFeatureCode(featureCode);
    setShowFeatureCodes(false);
    setSearchQuery("");
  };

  const handleCreateFeature = () => {
    if (!selectedFeatureCode) return;

    const featureData = {
      featureCode: selectedFeatureCode.code,
      featureType: selectedFeatureCode.name,
      pointNumber: activeMode === "point" ? `P${pointNumber.toString().padStart(3, '0')}` : undefined,
      notes: customNote || undefined,
      color: selectedFeatureCode.color,
      category: selectedFeatureCode.category
    };

    onFeatureCreate(activeMode, selectedFeatureCode.code, featureData);
    
    // Auto-increment point number
    if (activeMode === "point") {
      setPointNumber(prev => prev + 1);
    }
    
    setCustomNote("");
  };

  return (
    <Card className={`${className} shadow-lg border-2 border-blue-200`} data-testid="smart-toolbar">
      <CardContent className="p-4 space-y-4">
        
        {/* Mode Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">أدوات الرسم</Label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={activeMode === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("select")}
              className="flex flex-col items-center p-2 h-auto"
              data-testid="select-tool-btn"
            >
              <Target className="w-4 h-4 mb-1" />
              <span className="text-xs">تحديد</span>
            </Button>
            
            <Button
              variant={activeMode === "point" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("point")}
              className="flex flex-col items-center p-2 h-auto"
              data-testid="point-tool-btn"
            >
              <MapPin className="w-4 h-4 mb-1" />
              <span className="text-xs">نقطة</span>
            </Button>
            
            <Button
              variant={activeMode === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("line")}
              className="flex flex-col items-center p-2 h-auto"
              data-testid="line-tool-btn"
            >
              <Route className="w-4 h-4 mb-1" />
              <span className="text-xs">خط</span>
            </Button>
            
            <Button
              variant={activeMode === "polygon" ? "default" : "outline"}
              size="sm"
              onClick={() => handleModeChange("polygon")}
              className="flex flex-col items-center p-2 h-auto"
              data-testid="polygon-tool-btn"
            >
              <Pentagon className="w-4 h-4 mb-1" />
              <span className="text-xs">مضلع</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Smart Snapping */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">الربط الذكي (Snapping)</Label>
          <Button
            variant={snapEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onSnapToggle(!snapEnabled)}
            className="h-8 px-3"
            data-testid="snap-toggle-btn"
          >
            <Zap className={`w-4 h-4 mr-1 ${snapEnabled ? 'text-white' : 'text-gray-500'}`} />
            {snapEnabled ? "مفعل" : "معطل"}
          </Button>
        </div>

        {/* Feature Code Selection */}
        {activeMode !== "select" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">كود المعلم</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeatureCodes(!showFeatureCodes)}
                data-testid="feature-codes-btn"
              >
                <Search className="w-4 h-4 mr-1" />
                اختيار
              </Button>
            </div>

            {/* Selected Feature Code */}
            {selectedFeatureCode && (
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedFeatureCode.color }}
                    />
                    <Badge variant="outline" data-testid="selected-feature-code">
                      {selectedFeatureCode.code}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">{selectedFeatureCode.category}</span>
                </div>
                <div className="text-sm font-medium">{selectedFeatureCode.name}</div>
              </div>
            )}

            {/* Feature Code Search */}
            {showFeatureCodes && (
              <div className="space-y-2">
                <Input
                  ref={searchRef}
                  placeholder="البحث في أكواد المعالم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm"
                  data-testid="feature-code-search"
                />
                
                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                  {filteredFeatureCodes.map((code) => (
                    <button
                      key={code.code}
                      onClick={() => handleFeatureCodeSelect(code)}
                      className="w-full text-right p-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                      data-testid={`feature-code-${code.code}`}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: code.color }}
                      />
                      <Badge variant="outline" className="text-xs">{code.code}</Badge>
                      <span className="flex-1">{code.name}</span>
                      <span className="text-xs text-gray-500">{code.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Point Number (for points only) */}
            {activeMode === "point" && (
              <div className="space-y-1">
                <Label className="text-sm font-medium">رقم النقطة</Label>
                <Input
                  type="number"
                  value={pointNumber}
                  onChange={(e) => setPointNumber(parseInt(e.target.value) || 1)}
                  className="text-sm"
                  min={1}
                  data-testid="point-number-input"
                />
              </div>
            )}

            {/* Custom Notes */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">ملاحظات</Label>
              <Input
                placeholder="إضافة ملاحظة اختيارية..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="text-sm"
                data-testid="custom-note-input"
              />
            </div>

            {/* Create Feature Button */}
            <Button
              onClick={handleCreateFeature}
              disabled={!selectedFeatureCode}
              className="w-full"
              data-testid="create-feature-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {activeMode === "point" ? "إضافة نقطة" :
               activeMode === "line" ? "بدء رسم خط" :
               "بدء رسم مضلع"}
            </Button>
          </div>
        )}

        <Separator />

        {/* Additional Tools */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" data-testid="layers-btn">
            <Layers className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" data-testid="grid-btn">
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" data-testid="settings-btn">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}