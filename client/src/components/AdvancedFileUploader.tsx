import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFile, APIError } from '@/lib/api';

interface GISLayer {
  id: string;
  name: string;
  fileName: string;
  status: string;
  visible: boolean;
  imageUrl?: string;
  bounds?: [[number, number], [number, number]];
  width?: number;
  height?: number;
  crs?: string;
  fileSize?: number;
  uploadDate?: string;
}

interface AdvancedFileUploaderProps {
  onLayerAdded: (layer: GISLayer) => void;
  maxFileSize?: number;
}

export function AdvancedFileUploader({ onLayerAdded, maxFileSize = 200 * 1024 * 1024 }: AdvancedFileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const { toast } = useToast();

  // Upload mutation using XMLHttpRequest with progress tracking
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
    },
    onSuccess: async (data: any) => {
      const { layerId } = data as { layerId: string };
      setProcessingStatus('معالجة الملف...');
      
      // Poll for processing status
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/gis/layers/${layerId}/status`);
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'processed') {
              // Create layer object
              const newLayer: GISLayer = {
                id: layerId,
                name: statusData.fileName.replace(/\.[^/.]+$/, ''), // Remove extension
                fileName: statusData.fileName,
                status: 'processed',
                visible: true,
                imageUrl: statusData.imageUrl,
                bounds: statusData.bounds,
                width: statusData.width,
                height: statusData.height,
                crs: statusData.crs,
                fileSize: statusData.fileSize,
                uploadDate: statusData.uploadDate
              };
              
              onLayerAdded(newLayer);
              setProcessingStatus('');
              setSelectedFile(null);
              
              toast({
                title: "تم رفع الملف بنجاح",
                description: `تم معالجة ${statusData.fileName} وإضافته للخريطة`,
              });
            } else if (statusData.status === 'error') {
              setProcessingStatus('');
              toast({
                title: "خطأ في معالجة الملف",
                description: statusData.error || 'حدث خطأ غير معروف',
                variant: "destructive",
              });
            } else {
              // Continue polling
              setTimeout(pollStatus, 2000);
              setProcessingStatus(`حالة المعالجة: ${statusData.status}`);
            }
          }
        } catch (error) {
          console.error('خطأ في تتبع حالة المعالجة:', error);
        }
      };
      
      // Start polling
      setTimeout(pollStatus, 1000);
    },
    onError: (error) => {
      setProcessingStatus('');
      setUploadProgress(0);
      
      let errorMessage = 'حدث خطأ غير معروف';
      
      if (error instanceof APIError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "خطأ في رفع الملف",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxFileSize) {
      toast({
        title: "حجم الملف كبير جداً",
        description: `الحد الأقصى للحجم هو ${Math.round(maxFileSize / (1024 * 1024))}MB`,
        variant: "destructive",
      });
      return false;
    }

    // Check file type
    const validExtensions = ['.zip', '.tif', '.tiff', '.geotiff'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: "نوع الملف غير مدعوم",
        description: "يُدعم فقط: ZIP, TIF, TIFF, GeoTIFF",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          رفع ملفات GIS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and drop area */}
        <div className="relative">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={(e) => {
              // Only trigger file input if clicking on the drop area itself, not child elements
              if (e.target === e.currentTarget) {
                const input = document.getElementById('file-input-hidden') as HTMLInputElement;
                input?.click();
              }
            }}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <FileImage className="w-12 h-12 mx-auto text-green-600" />
                <div className="text-sm font-medium">{selectedFile.name}</div>
                <div className="text-xs text-gray-500">
                  {Math.round(selectedFile.size / (1024 * 1024))} MB
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <div className="text-sm font-medium">اسحب الملف هنا أو انقر للاختيار</div>
                  <div className="text-xs text-gray-500">
                    ZIP, GeoTIFF, TIF - حتى {Math.round(maxFileSize / (1024 * 1024))}MB
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <input
            id="file-input-hidden"
            type="file"
            className="hidden"
            accept=".zip,.tif,.tiff,.geotiff"
            onChange={handleFileSelect}
          />
        </div>

        {/* Upload button and status */}
        {selectedFile && (
          <div className="space-y-2">
            <Button 
              onClick={handleUpload}
              disabled={uploadMutation.isPending || !!processingStatus}
              className="w-full"
            >
              {uploadMutation.isPending || processingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {processingStatus || 'جاري الرفع...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  رفع الملف
                </>
              )}
            </Button>
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="w-full" />
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setSelectedFile(null)}
              disabled={uploadMutation.isPending || !!processingStatus}
              className="w-full"
            >
              إلغاء
            </Button>
          </div>
        )}

        {/* Status messages */}
        {processingStatus && (
          <Alert>
            <Loader2 className="w-4 h-4 animate-spin" />
            <AlertDescription>{processingStatus}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}