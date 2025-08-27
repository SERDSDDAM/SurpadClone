import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  Map, 
  MapPin, 
  Route, 
  Square, 
  Hand, 
  RotateCcw, 
  Save, 
  Eye, 
  EyeOff,
  Layers,
  Settings,
  Grid,
  Crosshair,
  Palette,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  LocateFixed
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { 
  transformImageBoundsForDisplay, 
  parseGeoTiffProjection,
  utmToWgs84,
  YEMEN_UTM_REFERENCES 
} from "@/lib/coordinate-transform";
import { LayersPanel } from "@/components/LayersPanel";

interface GeoreferencedLayer {
  id: string;
  name: string;
  type: 'raster' | 'vector';
  url: string;
  bounds: [[number, number], [number, number]];
  visible: boolean;
  opacity: number;
  coordinateSystem: string;
  sourceCoordinateSystem?: string;
  hasGeoreferencing: boolean;
  needsReprojection?: boolean;
  originalUtmBounds?: [[number, number], [number, number]] | null;
  clipGeometry?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  isClipped?: boolean;
}

interface DrawnFeature {
  id: string;
  type: 'street' | 'block';
  geometry: {
    type: 'LineString' | 'Polygon';
    coordinates: number[][] | number[][][];
  };
  properties: {
    name?: string;
    streetType?: string;
    blockCode?: string;
    landUse?: string;
    [key: string]: any;
  };
}

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ComponentType;
  type: 'street' | 'block' | 'hand';
  description: string;
}

export default function DigitizationTool() {
  const [activeTab, setActiveTab] = useState("map");
  const [activeTool, setActiveTool] = useState<string>("hand");
  const [isDrawing, setIsDrawing] = useState(false);
  const [layers, setLayers] = useState<GeoreferencedLayer[]>([]);
  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([]);
  const [mapCenter] = useState<[number, number]>([15.3694, 44.1910]); // صنعاء
  const [mapZoom] = useState(13);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [activeClipTool, setActiveClipTool] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const drawingTools: DrawingTool[] = [
    {
      id: "hand",
      name: "أداة التحريك",
      icon: Hand,
      type: "hand",
      description: "تحريك وتصفح الخريطة"
    },
    {
      id: "street",
      name: "رسم الشوارع",
      icon: Route,
      type: "street",
      description: "رسم خطوط الشوارع والطرق"
    },
    {
      id: "block",
      name: "رسم البلوكات",
      icon: Square,
      type: "block",
      description: "رسم مضلعات البلوكات والقطع"
    }
  ];

  // Mutation لحفظ الأشكال المرسومة
  const saveFeatureMutation = useMutation({
    mutationFn: async (feature: DrawnFeature) => {
      const endpoint = feature.type === 'street' ? '/api/gis/streets/digitize' : '/api/gis/blocks/digitize';
      return apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          geometry: feature.geometry,
          properties: feature.properties
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ الشكل الهندسي في قاعدة البيانات"
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحفظ",
        description: "فشل في حفظ البيانات. يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    }
  });

  // Mutation للحصول على رابط الرفع
  const getUploadUrlMutation = useMutation({
    mutationFn: async ({ fileName, fileType }: { fileName: string; fileType: string }) => {
      return apiRequest("/api/gis/layers/upload-url", {
        method: "POST",
        body: JSON.stringify({ fileName, fileType }),
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });

  // Mutation لرفع الملف إلى التخزين السحابي
  const uploadToCloudMutation = useMutation({
    mutationFn: async ({ uploadUrl, file }: { uploadUrl: string; file: File }) => {
      // في بيئة التطوير، نحاكي رفع الملف
      if (uploadUrl.includes('mock-cloud-storage')) {
        // محاكاة تأخير الرفع
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { ok: true, status: 200 };
      }
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      return response;
    }
  });

  // Mutation لتأكيد اكتمال الرفع
  const confirmUploadMutation = useMutation({
    mutationFn: async ({ layerId, objectPath, fileName, metadata }: { 
      layerId: string; 
      objectPath: string; 
      fileName: string; 
      metadata: any 
    }) => {
      return apiRequest("/api/gis/layers/confirm", {
        method: "POST",
        body: JSON.stringify({ layerId, objectPath, fileName, metadata }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (data) => {
      const coordinateInfo = data.layer.needsReprojection 
        ? `تم تحويل الإحداثيات من ${data.layer.sourceCoordinateSystem} إلى WGS 84`
        : `نظام الإحداثيات: ${data.layer.sourceCoordinateSystem}`;
        
      toast({
        title: "✅ تم رفع الطبقة بنجاح", 
        description: `${data.layer.name} - ${coordinateInfo}`
      });
      
      // إضافة الطبقة الجديدة إلى القائمة
      const newLayer: GeoreferencedLayer = {
        id: data.layer.id,
        name: data.layer.name,
        type: data.layer.type,
        url: data.layer.objectPath,
        bounds: data.layer.bounds,
        visible: true,
        opacity: 0.7
      };
      setLayers(prev => [...prev, newLayer]);
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast({
        title: "❌ خطأ في تأكيد الرفع",
        description: "فشل في تسجيل الطبقة الجغرافية",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // التحقق من حجم الملف (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "❌ الملف كبير جداً",
        description: "الحد الأقصى لحجم الملف هو 100MB",
        variant: "destructive"
      });
      return;
    }

    // التحقق من نوع الملف - دعم ZIP و الصور
    const validTypes = ['.tiff', '.tif', '.png', '.jpg', '.jpeg', '.zip'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      toast({
        title: "❌ نوع ملف غير مدعوم",
        description: "يرجى اختيار ملف ZIP (للخرائط المتكاملة) أو GeoTIFF (.tiff/.tif) أو صورة (PNG, JPG)",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // 1. الحصول على رابط الرفع
      toast({
        title: "🔄 جاري التحضير...",
        description: "الحصول على رابط رفع آمن"
      });

      const uploadData = await getUploadUrlMutation.mutateAsync({
        fileName: file.name,
        fileType: fileExtension === '.zip' ? 'application/zip' : (file.type || 'image/tiff')
      });

      setUploadProgress(20);

      // 2. رفع الملف إلى التخزين السحابي
      toast({
        title: "📤 جاري الرفع...",
        description: `رفع ${file.name} إلى التخزين السحابي`
      });

      // تقدم الرفع
      const uploadProgressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 80) {
            clearInterval(uploadProgressInterval);
            return 80;
          }
          return prev + 10;
        });
      }, 1000);

      await uploadToCloudMutation.mutateAsync({
        uploadUrl: uploadData.uploadUrl,
        file: file
      });

      clearInterval(uploadProgressInterval);
      setUploadProgress(85);

      // 3. تأكيد اكتمال الرفع وحفظ البيانات الوصفية
      toast({
        title: "💾 جاري الحفظ...",
        description: fileExtension === '.zip' ? "معالجة ملف ZIP وتحليل الطبقات" : "تسجيل الطبقة الجغرافية في النظام"
      });

      // تحليل نوع الملف وتحديد نظام الإحداثيات
      const isZipFile = fileExtension === '.zip';
      const isGeoTiff = fileExtension === '.tiff' || fileExtension === '.tif';
      const isYemeniSurveyFile = isGeoTiff || isZipFile; // ملفات ZIP والـ TIFF من اليمن تستخدم UTM Zone 38N
      
      // إحداثيات افتراضية بنظام UTM Zone 38N لمنطقة صنعاء
      const defaultUtmBounds: [[number, number], [number, number]] = [
        [398000, 1698000], // النقطة الجنوبية الغربية (UTM)
        [402000, 1702000]  // النقطة الشمالية الشرقية (UTM)
      ];
      
      // تحويل الإحداثيات إلى WGS 84 للعرض
      const displayBounds = isYemeniSurveyFile 
        ? transformImageBoundsForDisplay(defaultUtmBounds, { 
            spatialReference: 'EPSG:32638',
            projection: 'UTM Zone 38N'
          })
        : [[15.2, 44.1], [15.5, 44.3]]; // إحداثيات WGS 84 افتراضية

      const metadata = {
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileSize: file.size,
        fileType: fileExtension,
        isZipFile: isZipFile,
        coordinateSystem: isYemeniSurveyFile ? 'EPSG:32638' : 'EPSG:4326',
        sourceCoordinateSystem: isYemeniSurveyFile ? 'UTM Zone 38N' : 'WGS 84',
        bounds: displayBounds,
        originalUtmBounds: isYemeniSurveyFile ? defaultUtmBounds : null,
        hasGeoreferencing: isGeoTiff || isZipFile,
        needsReprojection: isYemeniSurveyFile,
        projectionInfo: parseGeoTiffProjection({
          spatialReference: isYemeniSurveyFile ? 'EPSG:32638' : 'EPSG:4326',
          projection: isYemeniSurveyFile ? 'UTM Zone 38N' : 'WGS 84'
        })
      };

      await confirmUploadMutation.mutateAsync({
        layerId: uploadData.layerId,
        objectPath: uploadData.objectPath,
        fileName: file.name,
        metadata
      });

      setUploadProgress(100);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "❌ فشل في رفع الملف",
        description: error instanceof Error ? error.message : "خطأ غير متوقع",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    }

    // إعادة تعيين input
    event.target.value = '';
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity }
        : layer
    ));
  };

  const saveAllFeatures = () => {
    drawnFeatures.forEach(feature => {
      saveFeatureMutation.mutate(feature);
    });
  };

  const clearAllFeatures = () => {
    setDrawnFeatures([]);
    setSelectedFeature(null);
  };

  const deleteFeature = (featureId: string) => {
    setDrawnFeatures(features => features.filter(f => f.id !== featureId));
    if (selectedFeature === featureId) {
      setSelectedFeature(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="flex h-screen">
        {/* الشريط الجانبي للأدوات */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              أداة رقمنة المخططات
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              تحويل المخططات الورقية إلى بيانات رقمية
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map">الخريطة</TabsTrigger>
                <TabsTrigger value="layers">الطبقات</TabsTrigger>
                <TabsTrigger value="features">الأشكال</TabsTrigger>
              </TabsList>

              {/* تبويب الخريطة */}
              <TabsContent value="map" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">أدوات الرسم</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {drawingTools.map((tool) => {
                      const IconComponent = tool.icon;
                      const isActive = activeTool === tool.id;
                      
                      return (
                        <Button
                          key={tool.id}
                          variant={isActive ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setActiveTool(tool.id)}
                          data-testid={`tool-${tool.id}`}
                        >
                          <IconComponent className="ml-2 h-4 w-4" />
                          {tool.name}
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">أدوات التحكم</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" data-testid="button-zoom-in">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-zoom-out">
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-undo">
                        <Undo className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-redo">
                        <Redo className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={saveAllFeatures}
                        disabled={drawnFeatures.length === 0}
                        data-testid="button-save-all"
                      >
                        <Save className="ml-2 h-4 w-4" />
                        حفظ جميع الأشكال
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={clearAllFeatures}
                        disabled={drawnFeatures.length === 0}
                        data-testid="button-clear-all"
                      >
                        <RotateCcw className="ml-2 h-4 w-4" />
                        مسح الكل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* تبويب الطبقات */}
              <TabsContent value="layers" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      رفع طبقة جديدة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="layer-upload" className="cursor-pointer">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            اختر ملف صورة جغرافية
                          </span>
                          <span className="block text-xs text-gray-500">
                            ZIP (مُستحسن), GeoTIFF, PNG, JPG (حتى 100MB)
                          </span>
                        </label>
                        <input
                          id="layer-upload"
                          name="layer-upload"
                          type="file"
                          className="sr-only"
                          accept=".tiff,.tif,.png,.jpg,.jpeg,.zip,application/zip,application/x-zip-compressed,image/tiff,image/png,image/jpeg"
                          onChange={handleFileUpload}
                          data-testid="input-layer-upload"
                        />
                      </div>
                    </div>

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>جاري الرفع...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                        <div className="text-xs text-gray-500 text-center">
                          {uploadProgress < 20 && "التحضير للرفع..."}
                          {uploadProgress >= 20 && uploadProgress < 80 && "رفع إلى التخزين السحابي..."}
                          {uploadProgress >= 80 && uploadProgress < 100 && "تسجيل في قاعدة البيانات..."}
                          {uploadProgress === 100 && "تم الانتهاء بنجاح!"}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">الطبقات المحملة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {layers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        لا توجد طبقات محملة
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {layers.map((layer) => (
                          <div key={layer.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">
                                {layer.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLayerVisibility(layer.id)}
                                data-testid={`toggle-layer-${layer.id}`}
                              >
                                {layer.visible ? 
                                  <Eye className="h-4 w-4" /> : 
                                  <EyeOff className="h-4 w-4" />
                                }
                              </Button>
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs">الشفافية</Label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={layer.opacity}
                                onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                                className="w-full"
                                data-testid={`opacity-layer-${layer.id}`}
                              />
                              <div className="text-xs text-gray-500">
                                {Math.round(layer.opacity * 100)}%
                              </div>
                            </div>
                            
                            <Badge variant="secondary" className="text-xs">
                              {layer.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* تبويب الأشكال المرسومة */}
              <TabsContent value="features" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">الأشكال المرسومة</CardTitle>
                    <CardDescription className="text-xs">
                      {drawnFeatures.length} شكل مرسوم
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {drawnFeatures.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        لا توجد أشكال مرسومة
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {drawnFeatures.map((feature) => (
                          <div 
                            key={feature.id} 
                            className={`border rounded-lg p-2 cursor-pointer transition-colors ${
                              selectedFeature === feature.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedFeature(feature.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {feature.type === 'street' ? 
                                  <Route className="h-4 w-4 text-blue-500" /> :
                                  <Square className="h-4 w-4 text-green-500" />
                                }
                                <span className="text-sm font-medium">
                                  {feature.properties.name || `${feature.type === 'street' ? 'شارع' : 'بلوك'} ${feature.id.slice(-4)}`}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFeature(feature.id);
                                }}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                data-testid={`delete-feature-${feature.id}`}
                              >
                                ×
                              </Button>
                            </div>
                            
                            <div className="mt-1">
                              <Badge 
                                variant={feature.type === 'street' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {feature.type === 'street' ? 'شارع' : 'بلوك'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* منطقة الخريطة */}
        <div className="flex-1 relative">
          <div 
            ref={mapContainerRef}
            className="w-full h-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden"
            data-testid="map-container"
          >
            {/* محاكي الخريطة */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
                  <Map className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    عارض الخريطة التفاعلي
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {activeTool !== 'hand' ? `الأداة النشطة: ${drawingTools.find(t => t.id === activeTool)?.name}` : 'جاهز للاستخدام'}
                  </p>
                  
                  <div className="mt-4 space-y-2 text-xs text-gray-500">
                    <p>📍 الموقع: صنعاء، اليمن</p>
                    <p>🔍 مستوى التكبير: {mapZoom}</p>
                    <p>🗂️ الطبقات المرئية: {layers.filter(l => l.visible).length}</p>
                    <p>✏️ الأشكال المرسومة: {drawnFeatures.length}</p>
                  </div>
                  
                  {layers.length === 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        💡 ابدأ برفع طبقة جغرافية من التبويب "الطبقات"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* شريط الحالة */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 text-xs border">
              <div className="flex items-center gap-4">
                <span>الإحداثيات: {mapCenter[1].toFixed(4)}, {mapCenter[0].toFixed(4)}</span>
                <span>التكبير: {mapZoom}</span>
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isDrawing ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  {isDrawing ? 'رسم' : 'جاهز'}
                </span>
              </div>
            </div>

            {/* أزرار التحكم السريع */}
            <div className="absolute top-4 left-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-gray-800"
                data-testid="button-center-map"
              >
                <LocateFixed className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-gray-800"
                data-testid="button-grid-toggle"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}