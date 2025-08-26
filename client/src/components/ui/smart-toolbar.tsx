import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer2, 
  Target, 
  Route, 
  Square, 
  Move3D,
  Settings2,
  Layers3,
  Magnet
} from "lucide-react";
import { featureCodes } from "@/lib/survey-utils";
import { FeatureCode } from "@/types/survey";

export type ToolType = "select" | "point" | "line" | "polygon";

interface SmartToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  selectedFeatureCode: string;
  onFeatureCodeChange: (code: string) => void;
  snapEnabled: boolean;
  onSnapToggle: () => void;
  isCapturing: boolean;
}

const toolConfig = {
  select: { icon: MousePointer2, label: "تحديد", color: "bg-gray-600" },
  point: { icon: Target, label: "نقطة", color: "bg-blue-600" },
  line: { icon: Route, label: "خط", color: "bg-green-600" },
  polygon: { icon: Square, label: "مضلع", color: "bg-purple-600" }
};

export function SmartToolbar({
  activeTool,
  onToolChange,
  selectedFeatureCode,
  onFeatureCodeChange,
  snapEnabled,
  onSnapToggle,
  isCapturing
}: SmartToolbarProps) {
  
  const getFeatureCodesForTool = (tool: ToolType): FeatureCode[] => {
    if (tool === "select") return [];
    return featureCodes[tool] || [];
  };

  const getCurrentFeatureCode = (): FeatureCode | undefined => {
    const codes = getFeatureCodesForTool(activeTool);
    return codes.find(code => code.value === selectedFeatureCode);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      {/* Tool Selection */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">أدوات المسح</h3>
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(toolConfig) as [ToolType, typeof toolConfig.select][]).map(([tool, config]) => {
            const IconComponent = config.icon;
            const isActive = activeTool === tool;
            
            return (
              <Button
                key={tool}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onToolChange(tool)}
                disabled={isCapturing}
                className={`flex flex-col items-center gap-1 h-16 ${
                  isActive ? config.color : ''
                }`}
                data-testid={`tool-${tool}`}
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-xs">{config.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Feature Code Selection */}
      {activeTool !== "select" && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            تكويد {toolConfig[activeTool].label}
          </h3>
          <Select 
            value={selectedFeatureCode} 
            onValueChange={onFeatureCodeChange}
            disabled={isCapturing}
          >
            <SelectTrigger data-testid="select-feature-code">
              <SelectValue placeholder={`اختر نوع ${toolConfig[activeTool].label}`} />
            </SelectTrigger>
            <SelectContent>
              {getFeatureCodesForTool(activeTool).map((code) => (
                <SelectItem key={code.value} value={code.value}>
                  <div className="flex items-center gap-2">
                    <span>{code.text}</span>
                    <Badge variant="secondary" className="text-xs">
                      {code.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Show current feature code */}
          {getCurrentFeatureCode() && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              المحدد: {getCurrentFeatureCode()?.text} ({getCurrentFeatureCode()?.category})
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Advanced Options */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">خيارات متقدمة</h3>
        
        {/* Snap Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Magnet className="h-4 w-4" />
            <span className="text-sm">الالتصاق التلقائي</span>
          </div>
          <Button
            variant={snapEnabled ? "default" : "outline"}
            size="sm"
            onClick={onSnapToggle}
            disabled={isCapturing}
            data-testid="toggle-snap"
          >
            {snapEnabled ? "مفعل" : "معطل"}
          </Button>
        </div>
        
        {/* Layer Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4" />
            <span className="text-sm">إدارة الطبقات</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isCapturing}
            data-testid="button-manage-layers"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current Tool Status */}
      <div className="pt-2 border-t">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div className={`w-2 h-2 rounded-full ${toolConfig[activeTool].color}`} />
          <span>الأداة النشطة: {toolConfig[activeTool].label}</span>
          {isCapturing && (
            <Badge variant="outline" className="text-xs">
              جاري العمل...
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}