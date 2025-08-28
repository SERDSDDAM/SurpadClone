import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { LeafletMap } from '@/components/LeafletMap';
import { Upload, FileImage, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface GISLayer {
  id: string;
  name: string;
  fileName: string;
  boundsWGS84: {
    southwest: [number, number];
    northeast: [number, number];
  };
}

export default function QGISWebTool() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  const queryClient = useQueryClient();

  // استعلام الطبقات المحفوظة
  const { data: layers = [], isLoading: layersLoading } = useQuery<GISLayer[]>({
    queryKey: ['/api/gis/layers']
  });

  // طلب رابط الرفع
  const uploadUrlMutation = useMutation({
    mutationFn: async (file: File) => {
      const response = await apiRequest(`/api/gis/layers/upload-url`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/zip'
        })
      });
      return response;
    },
    onSuccess: (data, file) => {
      handleFileUpload(file, data);
    }
  });

  // تأكيد الطبقة
  const confirmLayerMutation = useMutation({
    mutationFn: async ({ layerId, fileName }: { layerId: string; fileName: string }) => {
      const response = await apiRequest(`/api/gis/layers/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          layerId,
          fileName,
          metadata: { isZipFile: true }
        })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gis/layers'] });
      setSelectedFile(null);
      setUploadProgress(0);
      setProcessingStatus('✅ تم حفظ الطبقة بنجاح!');
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
      setProcessingStatus('');
    }
  };

  const handleFileUpload = useCallback(async (file: File, uploadData: any) => {
    setProcessingStatus('🔄 جاري رفع الملف...');
    
    try {
      // محاكاة الرفع للتطوير
      setUploadProgress(30);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress(70);
      setProcessingStatus('🌍 معالجة البيانات الجغرافية...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadProgress(100);
      setProcessingStatus('💾 حفظ الطبقة...');
      
      // تأكيد الطبقة
      await confirmLayerMutation.mutateAsync({
        layerId: uploadData.layerId,
        fileName: file.name
      });
      
    } catch (error) {
      setProcessingStatus('❌ فشل في معالجة الملف');
      console.error('Upload error:', error);
    }
  }, [confirmLayerMutation]);

  const handleUploadClick = () => {
    if (!selectedFile) return;
    uploadUrlMutation.mutate(selectedFile);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* العنوان */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            أداة الرقمنة الاحترافية
          </h1>
          <p className="text-gray-600">
            مستوحاة من QGIS Web Publisher - تحويل خرائط GeoTIFF إلى طبقات ويب تفاعلية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* قسم الرفع */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                رفع ملف جغرافي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div>
                <Label htmlFor="file-input">اختر ملف ZIP يحتوي على GeoTIFF</Label>
                <Input
                  id="file-input"
                  type="file"
                  accept=".zip,.tif,.tiff"
                  onChange={handleFileSelect}
                  className="mt-1"
                  data-testid="input-geotiff-file"
                />
              </div>

              {selectedFile && (
                <Alert>
                  <FileImage className="h-4 w-4" />
                  <AlertDescription>
                    ملف محدد: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleUploadClick}
                disabled={!selectedFile || uploadUrlMutation.isPending || confirmLayerMutation.isPending}
                className="w-full"
                data-testid="button-upload-geotiff"
              >
                {uploadUrlMutation.isPending || confirmLayerMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    رفع ومعالجة
                  </>
                )}
              </Button>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-gray-600 text-center">{uploadProgress}%</p>
                </div>
              )}

              {processingStatus && (
                <Alert>
                  {processingStatus.includes('✅') ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : processingStatus.includes('❌') ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  <AlertDescription>{processingStatus}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* قسم الطبقات */}
          <Card>
            <CardHeader>
              <CardTitle>الطبقات المحفوظة ({layers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {layersLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">تحميل الطبقات...</p>
                </div>
              ) : layers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد طبقات محفوظة</p>
                  <p className="text-sm">ارفع ملف GeoTIFF لبدء الرقمنة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <div 
                      key={layer.id} 
                      className="p-3 bg-gray-50 rounded-lg"
                      data-testid={`layer-item-${layer.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{layer.name}</h4>
                          <p className="text-sm text-gray-600">
                            الحدود: {layer.boundsWGS84.southwest[0].toFixed(4)}, {layer.boundsWGS84.southwest[1].toFixed(4)}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الخريطة التفاعلية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              الخريطة التفاعلية - عرض الطبقات على صور الأقمار الصناعية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full">
              <LeafletMap 
                layers={layers}
                onMapReady={(map) => {
                  console.log('🗺️ الخريطة جاهزة:', map);
                }}
              />
            </div>
            
            {layers.length === 0 && (
              <div className="text-center mt-4 p-4 bg-blue-50 rounded-lg">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-blue-800 font-medium">
                  ارفع ملف GeoTIFF لرؤية الطبقات على الخريطة
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  ستظهر الصور في مواقعها الجغرافية الحقيقية فوق صور الأقمار الصناعية
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}