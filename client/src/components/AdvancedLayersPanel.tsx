import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Trash2, 
  ZoomIn,
  Settings,
  GripVertical,
  Folder,
  Image,
  Map,
  Info,
  Download
} from 'lucide-react';
import { GeoreferencedLayer } from '@/components/EnhancedMapCanvas';

interface LayerGroup {
  id: string;
  name: string;
  type: 'group';
  expanded: boolean;
  layers: GeoreferencedLayer[];
}

interface AdvancedLayersPanelProps {
  layers: GeoreferencedLayer[];
  onLayerToggle: (layerId: string) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerReorder: (dragIndex: number, hoverIndex: number) => void;
  onZoomToLayer: (layerId: string) => void;
}

export function AdvancedLayersPanel({
  layers,
  onLayerToggle,
  onLayerOpacityChange,
  onLayerDelete,
  onLayerReorder,
  onZoomToLayer
}: AdvancedLayersPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['raster-layers', 'vector-layers']));
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // تجميع الطبقات حسب النوع
  const layerGroups: LayerGroup[] = [
    {
      id: 'raster-layers',
      name: 'الطبقات النقطية (Raster)',
      type: 'group',
      expanded: expandedGroups.has('raster-layers'),
      layers: layers.filter(layer => layer.type === 'raster')
    },
    {
      id: 'vector-layers', 
      name: 'الطبقات المتجهة (Vector)',
      type: 'group',
      expanded: expandedGroups.has('vector-layers'),
      layers: layers.filter(layer => layer.type === 'vector')
    }
  ];

  // تصفية الطبقات حسب البحث
  const filteredGroups = layerGroups.map(group => ({
    ...group,
    layers: group.layers.filter(layer => 
      layer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      layer.coordinateSystem?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.layers.length > 0);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayer(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (draggedLayer && draggedLayer !== targetLayerId) {
      const dragIndex = layers.findIndex(l => l.id === draggedLayer);
      const hoverIndex = layers.findIndex(l => l.id === targetLayerId);
      onLayerReorder(dragIndex, hoverIndex);
    }
    setDraggedLayer(null);
  };

  const formatFileSize = (size?: number) => {
    if (!size) return 'غير معروف';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5" />
          إدارة الطبقات المتقدمة
        </CardTitle>
        
        {/* شريط البحث */}
        <div className="mt-3">
          <Input
            placeholder="البحث في الطبقات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-sm"
          />
        </div>
        
        {/* إحصائيات سريعة */}
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {layers.length} طبقة
          </Badge>
          <Badge variant="outline" className="text-xs">
            {layers.filter(l => l.visible).length} مرئية
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Map className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">لا توجد طبقات متطابقة</p>
            </div>
          ) : (
            filteredGroups.map(group => (
              <div key={group.id} className="border-b">
                {/* رأس المجموعة */}
                <div 
                  className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => toggleGroup(group.id)}
                >
                  {group.expanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                  <Folder className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">{group.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {group.layers.length}
                  </Badge>
                </div>

                {/* طبقات المجموعة */}
                {group.expanded && (
                  <div className="pl-6 pb-2">
                    {group.layers.map((layer, index) => (
                      <div
                        key={layer.id}
                        className={`
                          border rounded-lg p-3 mb-2 cursor-pointer transition-all
                          ${selectedLayer === layer.id 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }
                          ${draggedLayer === layer.id ? 'opacity-50' : ''}
                        `}
                        draggable
                        onDragStart={(e) => handleDragStart(e, layer.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, layer.id)}
                        onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}
                      >
                        {/* رأس الطبقة */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                            <Image className="h-4 w-4 text-green-500" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium truncate block">
                                {layer.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {layer.coordinateSystem || 'نظام إحداثي غير محدد'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLayerToggle(layer.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              {layer.visible ? 
                                <Eye className="h-3 w-3" /> : 
                                <EyeOff className="h-3 w-3 text-gray-400" />
                              }
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onZoomToLayer(layer.id);
                              }}
                              className="h-6 w-6 p-0"
                              title="تكبير للطبقة"
                            >
                              <ZoomIn className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLayerDelete(layer.id);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              title="حذف الطبقة"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* شريط الشفافية */}
                        <div className="mt-2 space-y-1">
                          <Label className="text-xs">الشفافية: {Math.round(layer.opacity * 100)}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={layer.opacity}
                            onChange={(e) => {
                              e.stopPropagation();
                              onLayerOpacityChange(layer.id, parseFloat(e.target.value));
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${layer.opacity * 100}%, #e5e7eb ${layer.opacity * 100}%, #e5e7eb 100%)`
                            }}
                          />
                        </div>

                        {/* تفاصيل موسعة عند التحديد */}
                        {selectedLayer === layer.id && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium">النوع:</span>
                                <Badge variant="outline" className="text-xs ml-1">
                                  {layer.type}
                                </Badge>
                              </div>
                              <div>
                                <span className="font-medium">الحالة:</span>
                                <Badge 
                                  variant={layer.visible ? "default" : "secondary"} 
                                  className="text-xs ml-1"
                                >
                                  {layer.visible ? 'مرئية' : 'مخفية'}
                                </Badge>
                              </div>
                            </div>
                            
                            {layer.bounds && (
                              <div className="text-xs">
                                <span className="font-medium">الحدود:</span>
                                <div className="font-mono text-gray-600 dark:text-gray-400 mt-1">
                                  <div>شمال: {layer.bounds[1][0].toFixed(6)}°</div>
                                  <div>جنوب: {layer.bounds[0][0].toFixed(6)}°</div>
                                  <div>شرق: {layer.bounds[1][1].toFixed(6)}°</div>
                                  <div>غرب: {layer.bounds[0][1].toFixed(6)}°</div>
                                </div>
                              </div>
                            )}
                            
                            {layer.sourceCoordinateSystem && (
                              <div className="text-xs">
                                <span className="font-medium">النظام الأصلي:</span>
                                <span className="ml-1 font-mono">{layer.sourceCoordinateSystem}</span>
                              </div>
                            )}
                            
                            <Separator className="my-2" />
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="text-xs">
                                <Settings className="h-3 w-3 mr-1" />
                                خصائص
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Download className="h-3 w-3 mr-1" />
                                تصدير
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Info className="h-3 w-3 mr-1" />
                                تفاصيل
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* إحصائيات تفصيلية في الأسفل */}
        {layers.length > 0 && (
          <div className="border-t p-3 bg-gray-50 dark:bg-gray-800">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>مجموع الطبقات:</span>
                <span className="font-medium">{layers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>طبقات مرئية:</span>
                <span className="font-medium">{layers.filter(l => l.visible).length}</span>
              </div>
              <div className="flex justify-between">
                <span>طبقات نقطية:</span>
                <span className="font-medium">{layers.filter(l => l.type === 'raster').length}</span>
              </div>
              <div className="flex justify-between">
                <span>طبقات متجهة:</span>
                <span className="font-medium">{layers.filter(l => l.type === 'vector').length}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}