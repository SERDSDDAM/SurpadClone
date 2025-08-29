import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Pencil, 
  Square, 
  Circle, 
  MapPin, 
  Minus, 
  Edit3, 
  Trash2, 
  Undo, 
  Redo,
  Save,
  Eye,
  EyeOff 
} from 'lucide-react';

export type DrawingMode = 'point' | 'line' | 'polygon' | 'rectangle' | 'circle' | 'modify' | 'delete' | null;

interface DrawingToolbarProps {
  currentMode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  featuresVisible: boolean;
  onToggleVisibility: () => void;
  featureCount: number;
  isEnabled?: boolean;
}

export function DrawingToolbar({
  currentMode,
  onModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  featuresVisible,
  onToggleVisibility,
  featureCount,
  isEnabled = true
}: DrawingToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const drawingTools = [
    { id: 'point' as const, icon: MapPin, label: 'نقطة', color: 'bg-blue-500' },
    { id: 'line' as const, icon: Minus, label: 'خط', color: 'bg-green-500' },
    { id: 'polygon' as const, icon: Pencil, label: 'مضلع', color: 'bg-purple-500' },
    { id: 'rectangle' as const, icon: Square, label: 'مستطيل', color: 'bg-orange-500' },
    { id: 'circle' as const, icon: Circle, label: 'دائرة', color: 'bg-red-500' },
  ];

  const editingTools = [
    { id: 'modify' as const, icon: Edit3, label: 'تعديل', color: 'bg-yellow-500' },
    { id: 'delete' as const, icon: Trash2, label: 'حذف', color: 'bg-red-600' },
  ];

  const getModeButton = (tool: typeof drawingTools[0]) => (
    <Button
      key={tool.id}
      variant={currentMode === tool.id ? "default" : "outline"}
      size="sm"
      onClick={() => onModeChange(currentMode === tool.id ? null : tool.id)}
      disabled={!isEnabled}
      className={`flex items-center gap-2 ${
        currentMode === tool.id ? tool.color + ' text-white' : 'hover:' + tool.color + ' hover:text-white'
      } transition-colors`}
      data-testid={`button-draw-${tool.id}`}
    >
      <tool.icon className="h-4 w-4" />
      {!isCollapsed && <span className="text-xs">{tool.label}</span>}
    </Button>
  );

  return (
    <Card className="fixed top-20 left-4 z-[1000] shadow-lg min-w-[200px]" dir="rtl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-right">أدوات الرسم</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {featureCount} معلم
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Drawing Tools */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-600 text-right">أدوات الإنشاء</div>
          <div className="grid grid-cols-2 gap-1">
            {drawingTools.map(getModeButton)}
          </div>
        </div>

        <Separator />

        {/* Editing Tools */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-600 text-right">أدوات التحرير</div>
          <div className="flex gap-1">
            {editingTools.map((tool) => (
              <Button
                key={tool.id}
                variant={currentMode === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onModeChange(currentMode === tool.id ? null : tool.id)}
                disabled={!isEnabled}
                className={`flex items-center gap-2 ${
                  currentMode === tool.id ? tool.color + ' text-white' : 'hover:' + tool.color + ' hover:text-white'
                } transition-colors`}
                data-testid={`button-edit-${tool.id}`}
              >
                <tool.icon className="h-4 w-4" />
                {!isCollapsed && <span className="text-xs">{tool.label}</span>}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Action Tools */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-600 text-right">الإجراءات</div>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo || !isEnabled}
              className="flex-1"
              data-testid="button-undo"
            >
              <Undo className="h-4 w-4" />
              {!isCollapsed && <span className="text-xs">تراجع</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo || !isEnabled}
              className="flex-1"
              data-testid="button-redo"
            >
              <Redo className="h-4 w-4" />
              {!isCollapsed && <span className="text-xs">إعادة</span>}
            </Button>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={onSave}
              disabled={!isEnabled}
              className="flex-1 bg-green-600 hover:bg-green-700"
              data-testid="button-save"
            >
              <Save className="h-4 w-4" />
              {!isCollapsed && <span className="text-xs">حفظ</span>}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleVisibility}
              className="flex-1"
              data-testid="button-toggle-visibility"
            >
              {featuresVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {!isCollapsed && (
                <span className="text-xs">
                  {featuresVisible ? 'إخفاء' : 'إظهار'}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Current Mode Indicator */}
        {currentMode && (
          <div className="p-2 bg-blue-50 rounded-md text-right">
            <div className="text-xs text-blue-800">
              الوضع النشط: <span className="font-bold">
                {drawingTools.find(t => t.id === currentMode)?.label || 
                 editingTools.find(t => t.id === currentMode)?.label || currentMode}
              </span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              انقر على الخريطة للرسم أو ESC للإلغاء
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}