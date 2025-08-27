import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  Layers, 
  Trash2, 
  Settings, 
  Move, 
  Scissors,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LayerInfo {
  id: string;
  name: string;
  type: 'raster' | 'vector';
  url: string;
  bounds: [[number, number], [number, number]];
  visible: boolean;
  opacity: number;
  coordinateSystem: string;
  hasGeoreferencing: boolean;
  clipGeometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  isClipped?: boolean;
}

interface LayersPanelProps {
  layers: LayerInfo[];
  onLayerVisibilityChange: (layerId: string, visible: boolean) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerReorder: (layerId: string, direction: 'up' | 'down') => void;
  onClipLayer: (layerId: string) => void;
  onRemoveClip: (layerId: string) => void;
  activeClipTool: string | null;
  onClipToolToggle: (layerId: string | null) => void;
}

export function LayersPanel({
  layers,
  onLayerVisibilityChange,
  onLayerOpacityChange,
  onLayerDelete,
  onLayerReorder,
  onClipLayer,
  onRemoveClip,
  activeClipTool,
  onClipToolToggle
}: LayersPanelProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);

  const toggleLayerExpanded = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const formatCoordinateSystem = (epsg: string) => {
    switch (epsg) {
      case 'EPSG:32638': return 'UTM Zone 38N';
      case 'EPSG:4326': return 'WGS 84';
      case 'EPSG:3857': return 'Web Mercator';
      default: return epsg;
    }
  };

  if (layers.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            إدارة الطبقات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <Layers className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">لا توجد طبقات</p>
            <p className="text-xs text-gray-400 mt-1">
              قم برفع ملف ZIP يحتوي على خرائط جغرافية
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            إدارة الطبقات ({layers.length})
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            data-testid="button-toggle-layer-details"
          >
            <Info className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-2 p-2">
        {layers.map((layer, index) => {
          const isExpanded = expandedLayers.has(layer.id);
          const isClippingActive = activeClipTool === layer.id;

          return (
            <div
              key={layer.id}
              className={`border rounded-lg p-3 space-y-2 transition-all ${
                isClippingActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              data-testid={`layer-item-${layer.id}`}
            >
              {/* رأس الطبقة */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onLayerVisibilityChange(layer.id, !layer.visible)}
                  data-testid={`toggle-visibility-${layer.id}`}
                >
                  {layer.visible ? (
                    <Eye className="h-4 w-4 text-blue-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </Button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={layer.name}>
                    {layer.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="outline" className="text-xs h-5">
                      {layer.type === 'raster' ? 'صورة' : 'متجه'}
                    </Badge>
                    {layer.hasGeoreferencing && (
                      <Badge variant="secondary" className="text-xs h-5">
                        مرجع جغرافياً
                      </Badge>
                    )}
                    {layer.isClipped && (
                      <Badge variant="destructive" className="text-xs h-5">
                        مقصوص
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleLayerExpanded(layer.id)}
                  data-testid={`toggle-expand-${layer.id}`}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* شريط الشفافية */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 min-w-0">شفافية:</span>
                  <div className="flex-1">
                    <Slider
                      value={[layer.opacity]}
                      onValueChange={([value]) => onLayerOpacityChange(layer.id, value)}
                      max={100}
                      step={10}
                      className="w-full"
                      data-testid={`opacity-slider-${layer.id}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {layer.opacity}%
                  </span>
                </div>
              </div>

              {/* التفاصيل الموسعة */}
              {isExpanded && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  {showDetails && (
                    <div className="space-y-2">
                      <div className="text-xs">
                        <p className="text-gray-500">نظام الإحداثيات:</p>
                        <p className="font-mono bg-gray-100 rounded px-2 py-1">
                          {formatCoordinateSystem(layer.coordinateSystem)}
                        </p>
                      </div>
                      
                      <div className="text-xs">
                        <p className="text-gray-500">الحدود الجغرافية:</p>
                        <p className="font-mono bg-gray-100 rounded px-2 py-1 text-xs">
                          SW: {layer.bounds[0][0].toFixed(4)}, {layer.bounds[0][1].toFixed(4)}<br/>
                          NE: {layer.bounds[1][0].toFixed(4)}, {layer.bounds[1][1].toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* أدوات التحكم */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* أداة القص */}
                    <Button
                      variant={isClippingActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => onClipToolToggle(isClippingActive ? null : layer.id)}
                      data-testid={`clip-tool-${layer.id}`}
                      className="text-xs"
                    >
                      <Scissors className="h-3 w-3 mr-1" />
                      {isClippingActive ? 'إلغاء القص' : 'قص الطبقة'}
                    </Button>

                    {/* إزالة القص */}
                    {layer.isClipped && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveClip(layer.id)}
                        data-testid={`remove-clip-${layer.id}`}
                        className="text-xs"
                      >
                        إزالة القص
                      </Button>
                    )}

                    {/* ترتيب الطبقات */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => onLayerReorder(layer.id, 'up')}
                      data-testid={`move-up-${layer.id}`}
                      className="text-xs"
                    >
                      <Move className="h-3 w-3 mr-1" />
                      أعلى
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === layers.length - 1}
                      onClick={() => onLayerReorder(layer.id, 'down')}
                      data-testid={`move-down-${layer.id}`}
                      className="text-xs"
                    >
                      <Move className="h-3 w-3 mr-1" />
                      أسفل
                    </Button>

                    {/* إعدادات الطبقة */}
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`settings-${layer.id}`}
                      className="text-xs"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      إعدادات
                    </Button>

                    {/* حذف الطبقة */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLayerDelete(layer.id)}
                      data-testid={`delete-${layer.id}`}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              )}

              {/* رسالة أداة القص النشطة */}
              {isClippingActive && (
                <div className="bg-blue-100 border border-blue-200 rounded p-2 text-xs text-blue-800">
                  <div className="flex items-center gap-1">
                    <Scissors className="h-3 w-3" />
                    <span className="font-medium">أداة القص نشطة</span>
                  </div>
                  <p className="mt-1">ارسم مضلعاً فوق الطبقة لقص المنطقة المطلوبة</p>
                </div>
              )}
            </div>
          );
        })}

        {/* معلومات إضافية */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p className="font-medium mb-1">💡 نصائح الاستخدام:</p>
          <ul className="space-y-1 text-xs">
            <li>• انقر على العين لإظهار/إخفاء الطبقة</li>
            <li>• استخدم شريط الشفافية للتحكم في وضوح الطبقة</li>  
            <li>• أداة القص تسمح بتحديد منطقة معينة من الطبقة</li>
            <li>• يمكن ترتيب الطبقات بالأعلى والأسفل</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}