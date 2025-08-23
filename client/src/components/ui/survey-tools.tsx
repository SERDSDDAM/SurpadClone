import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Minus, Pentagon, Camera, Save, Crosshair, Loader2 } from "lucide-react";
import { SurveyTool, FeatureCode } from "@/types/survey";
import { featureCodes } from "@/lib/survey-utils";
import { cn } from "@/lib/utils";

interface SurveyToolsProps {
  activeTool: string | null;
  onToolChange: (tool: string) => void;
  onCapturePoint: (featureCode: string) => Promise<void>;
  onAddPhoto: () => void;
  onSave: () => void;
  isCapturing: boolean;
}

const tools: SurveyTool[] = [
  { type: 'point', icon: 'MapPin', name: 'نقطة', active: false },
  { type: 'line', icon: 'Minus', name: 'خط', active: false },
  { type: 'polygon', icon: 'Pentagon', name: 'مضلع', active: false },
];

const iconComponents = {
  MapPin,
  Minus,
  Pentagon,
};

export function SurveyTools({
  activeTool,
  onToolChange,
  onCapturePoint,
  onAddPhoto,
  onSave,
  isCapturing,
}: SurveyToolsProps) {
  const [selectedFeatureCode, setSelectedFeatureCode] = useState<string>("");

  const handleToolClick = (toolType: string) => {
    onToolChange(toolType);
    setSelectedFeatureCode(""); // Reset feature code when tool changes
  };

  const handleCapturePoint = async () => {
    if (!selectedFeatureCode) {
      alert("يرجى اختيار نوع المعلم أولاً");
      return;
    }
    
    await onCapturePoint(selectedFeatureCode);
    setSelectedFeatureCode(""); // Reset after capture
  };

  const getToolFeatureCodes = (): FeatureCode[] => {
    if (!activeTool || !featureCodes[activeTool]) return [];
    return featureCodes[activeTool];
  };

  const getToolName = (toolType: string): string => {
    switch (toolType) {
      case 'point': return 'النقطة';
      case 'line': return 'الخط';
      case 'polygon': return 'المضلع';
      default: return 'المعلم';
    }
  };

  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="text-lg text-gray-800">أدوات المساحة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tool Selection */}
        <div className="grid grid-cols-3 gap-3">
          {tools.map((tool) => {
            const IconComponent = iconComponents[tool.icon as keyof typeof iconComponents];
            const isActive = activeTool === tool.type;
            
            return (
              <Button
                key={tool.type}
                variant="outline"
                className={cn(
                  "p-4 h-auto flex-col space-y-2",
                  isActive && "bg-primary text-white border-primary hover:bg-primary/90"
                )}
                onClick={() => handleToolClick(tool.type)}
                data-testid={`tool-${tool.type}`}
              >
                <IconComponent className="h-6 w-6" />
                <span className="text-sm font-medium">{tool.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Feature Code Selection */}
        {activeTool && (
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-gray-700">
              اختر نوع {getToolName(activeTool)}
            </h4>
            
            <Select value={selectedFeatureCode} onValueChange={setSelectedFeatureCode}>
              <SelectTrigger className="w-full" data-testid="feature-code-select">
                <SelectValue placeholder={`اختر نوع ${getToolName(activeTool)}...`} />
              </SelectTrigger>
              <SelectContent>
                {getToolFeatureCodes().map((code) => (
                  <SelectItem key={code.value} value={code.value}>
                    {code.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeTool === 'point' && (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleCapturePoint}
                disabled={!selectedFeatureCode || isCapturing}
                data-testid="capture-point-button"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جارٍ الرفع...
                  </>
                ) : (
                  <>
                    <Crosshair className="mr-2 h-4 w-4" />
                    رفع النقطة
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-3 border-t">
          <Button
            variant="outline"
            className="w-full bg-orange-500 text-white hover:bg-orange-600 border-orange-500"
            onClick={onAddPhoto}
            data-testid="add-photo-button"
          >
            <Camera className="mr-2 h-4 w-4" />
            إضافة صورة
          </Button>
          
          <Button
            variant="outline"
            className="w-full bg-gray-600 text-white hover:bg-gray-700 border-gray-600"
            onClick={onSave}
            data-testid="save-work-button"
          >
            <Save className="mr-2 h-4 w-4" />
            حفظ العمل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
