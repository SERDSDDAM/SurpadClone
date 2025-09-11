import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  RefreshCw, 
  EyeOff, 
  Trash2, 
  Download, 
  MapPin, 
  FileImage,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Layer {
  id: string;
  name?: string;
  fileName?: string;
  status?: string;
  fileSize?: number;
  visible?: boolean;
  imageUrl?: string;
  bounds?: any;
  createdAt?: string;
}

interface LayersResponse {
  success: boolean;
  layers: Layer[];
  message?: string;
}

export default function AdminGIS() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useQuery<LayersResponse>({
    queryKey: ['admin', 'gis', 'layers'],
    queryFn: () => apiRequest('/api/gis/debug/layers'),
    staleTime: 30_000,
    refetchInterval: 60_000, // Refresh every minute
  });

  const reprocessMutation = useMutation({
    mutationFn: async (layerId: string) => {
      return apiRequest(`/api/gis/reprocess-existing-layer/${layerId}`, { 
        method: 'POST' 
      });
    },
    onSuccess: (data, layerId) => {
      toast({
        title: 'تم بدء إعادة المعالجة',
        description: `جارٍ إعادة معالجة الطبقة ${layerId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'gis', 'layers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'فشل في إعادة المعالجة',
        description: error.message || 'حدث خطأ أثناء إعادة معالجة الطبقة',
        variant: 'destructive',
      });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      return apiRequest(`/api/gis/layers/${id}/visibility`, { 
        method: 'POST', 
        body: JSON.stringify({ visible }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data, { id, visible }) => {
      toast({
        title: visible ? 'تم إظهار الطبقة' : 'تم إخفاء الطبقة',
        description: `تم ${visible ? 'إظهار' : 'إخفاء'} الطبقة ${id} بنجاح`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'gis', 'layers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'فشل في تبديل الرؤية',
        description: error.message || 'حدث خطأ أثناء تبديل رؤية الطبقة',
        variant: 'destructive',
      });
    },
  });

  const refreshLayersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/gis/debug/layers');
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث قائمة الطبقات',
        description: 'تم جلب أحدث بيانات الطبقات',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'gis', 'layers'] });
    },
  });

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'processed':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileImage className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'processed':
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'غير محدد';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024) * 10) / 10} MB`;
  };

  const getImageUrl = (layer: Layer) => {
    if (layer.imageUrl) return layer.imageUrl;
    return `/api/gis/layers/${layer.id}/image/processed.png`;
  };

  const previewLayer = (layer: Layer) => {
    const imageUrl = getImageUrl(layer);
    window.open(imageUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جارٍ تحميل الطبقات...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 ml-2" />
            <h3 className="text-red-800 font-medium">فشل في تحميل الطبقات</h3>
          </div>
          <p className="text-red-700 mt-2">
            {error?.message || 'حدث خطأ أثناء جلب قائمة الطبقات'}
          </p>
          <Button 
            onClick={() => refreshLayersMutation.mutate()} 
            className="mt-3"
            size="sm"
            disabled={refreshLayersMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${refreshLayersMutation.isPending ? 'animate-spin' : ''}`} />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  const layers = data?.layers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">نظام GIS — إدارة الطبقات</h1>
          <p className="text-gray-600 mt-1">إدارة وعرض طبقات الخرائط الجغرافية</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => refreshLayersMutation.mutate()} 
            variant="outline"
            disabled={refreshLayersMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${refreshLayersMutation.isPending ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-500 ml-2" />
              <div>
                <p className="text-sm text-gray-600">إجمالي الطبقات</p>
                <p className="text-xl font-bold">{layers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
              <div>
                <p className="text-sm text-gray-600">طبقات مكتملة</p>
                <p className="text-xl font-bold">
                  {layers.filter(l => l.status?.toLowerCase().includes('processed') || l.status?.toLowerCase().includes('completed')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Eye className="w-5 h-5 text-purple-500 ml-2" />
              <div>
                <p className="text-sm text-gray-600">طبقات مرئية</p>
                <p className="text-xl font-bold">
                  {layers.filter(l => l.visible !== false).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-orange-500 ml-2" />
              <div>
                <p className="text-sm text-gray-600">قيد المعالجة</p>
                <p className="text-xl font-bold">
                  {layers.filter(l => l.status?.toLowerCase().includes('processing')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layers Grid */}
      {layers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طبقات</h3>
            <p className="text-gray-600">لم يتم العثور على أي طبقات في النظام</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {layers.map((layer) => (
            <Card key={layer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={getImageUrl(layer)} 
                  alt={layer.name || layer.fileName || layer.id}
                  className="w-full h-40 object-cover bg-gray-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE2MCIgdmlld0JveD0iMCAwIDIwMCAxNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA3MEw3MCA4NUw5MCA5NUwxMTUgNzBMODUgNzBaIiBmaWxsPSIjOUNBM0FGIi8+CjxjaXJjbGUgY3g9IjcwIiBjeT0iNjAiIHI9IjUiIGZpbGw9IiM5Q0EzQUYiLz4KPHR0ZXh0IHg9IjEwMCIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LXNpemU9IjEyIj5لا توجد صورة</text>Cjwvc3ZnPgo=';
                  }}
                />
                {layer.visible !== false && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                    مرئية
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-sm truncate mb-1">
                    {layer.name || layer.fileName || layer.id}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(layer.status)}
                    <Badge variant={getStatusColor(layer.status) as any} className="text-xs">
                      {layer.status || 'غير محدد'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    الحجم: {formatFileSize(layer.fileSize)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => previewLayer(layer)}
                    className="flex-1 text-xs"
                  >
                    <Eye className="w-3 h-3 ml-1" />
                    معاينة
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => reprocessMutation.mutate(layer.id)}
                    disabled={reprocessMutation.isPending}
                    className="flex-1 text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ml-1 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                    إعادة معالجة
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => toggleVisibilityMutation.mutate({ 
                      id: layer.id, 
                      visible: layer.visible === false 
                    })}
                    disabled={toggleVisibilityMutation.isPending}
                    className="text-xs"
                  >
                    {layer.visible !== false ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}