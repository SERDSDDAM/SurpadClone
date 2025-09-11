/**
 * Phase 1 Processing Dashboard
 * لوحة تحكم معالجة المرحلة الأولى
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Database,
  Server,
  Monitor
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Phase1UploadProgress from '@/components/Phase1UploadProgress';

interface QueueStats {
  active_tasks: number;
  job_counts_24h: {
    [status: string]: number;
  };
}

export default function Phase1Processing() {
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Health check query
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/gis/health'],
    queryFn: async () => {
      const response = await apiRequest('/api/gis/health');
      return response;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Queue status query
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['/api/gis/queue/status'],
    queryFn: async () => {
      const response = await apiRequest('/api/gis/queue/status');
      return response.queue_status as QueueStats;
    },
    refetchInterval: 5000, // Update every 5 seconds
    retry: false,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, priority }: { file: File; priority: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('priority', priority);

      const response = await apiRequest('/api/gis/upload-phase1', {
        method: 'POST',
        body: formData,
      });
      
      return response;
    },
    onSuccess: (data) => {
      setUploadJobId(data.job_id);
      queryClient.invalidateQueries({ queryKey: ['/api/gis/queue/status'] });
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    uploadMutation.mutate({ 
      file: selectedFile, 
      priority: 'normal' 
    });
  };

  const handleJobComplete = (job: any) => {
    console.log('Job completed:', job);
    queryClient.invalidateQueries({ queryKey: ['/api/gis/layers'] });
    queryClient.invalidateQueries({ queryKey: ['/api/gis/queue/status'] });
  };

  const getStatusColor = (status: boolean | undefined) => {
    return status ? 'default' : 'destructive';
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">معالجة Phase 1 - نظام المعالجة المحسن</h1>
        <Badge variant="outline">v1.0.0</Badge>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">رفع الملفات</TabsTrigger>
          <TabsTrigger value="monitoring">المراقبة</TabsTrigger>
          <TabsTrigger value="health">حالة النظام</TabsTrigger>
          <TabsTrigger value="jobs">المهام</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                رفع ملفات Phase 1 - معالجة متقدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">اختر ملف GeoTIFF أو ZIP</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".tif,.tiff,.zip"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={uploadMutation.isPending}
                />
              </div>

              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  <p>الملف المحدد: {selectedFile.name}</p>
                  <p>الحجم: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}

              <Button
                onClick={handleFileUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? 'جاري الرفع...' : 'رفع ومعالجة'}
              </Button>

              {uploadMutation.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    خطأ في الرفع: {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'خطأ غير معروف'}
                  </AlertDescription>
                </Alert>
              )}

              {uploadJobId && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">تتبع المعالجة</h3>
                  <Phase1UploadProgress
                    jobId={uploadJobId}
                    onComplete={handleJobComplete}
                    onError={(error) => console.error('Processing error:', error)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Activity className="h-8 w-8 text-blue-500" />
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {queueLoading ? '...' : queueData?.active_tasks || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">مهام نشطة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {queueLoading ? '...' : queueData?.job_counts_24h?.completed || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">مكتملة (24س)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {queueLoading ? '...' : queueData?.job_counts_24h?.processing || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">قيد المعالجة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {queueLoading ? '...' : queueData?.job_counts_24h?.failed || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">فشلت (24س)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                حالة خدمات Phase 1
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    <span>Node.js API</span>
                  </div>
                  <Badge variant={getStatusColor(!healthLoading)}>
                    {healthLoading ? 'فحص...' : 'يعمل'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    <span>Dispatcher Service</span>
                  </div>
                  <Badge variant={getStatusColor(healthData?.dispatcher_status === 'healthy')}>
                    {healthLoading ? 'فحص...' : healthData?.dispatcher_status === 'healthy' ? 'يعمل' : 'متوقف'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    <span>Processing Pipeline</span>
                  </div>
                  <Badge variant={getStatusColor(healthData?.phase1_integration === 'healthy')}>
                    {healthLoading ? 'فحص...' : healthData?.phase1_integration === 'healthy' ? 'يعمل' : 'متوقف'}
                  </Badge>
                </div>
              </div>

              {healthData && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">تفاصيل النظام</h4>
                  <p className="text-sm text-muted-foreground">
                    مجلد الرفع: {healthData.upload_dir}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل المهام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4" />
                <p>قائمة المهام ستتوفر قريباً</p>
                <p className="text-sm">سيتم إضافة واجهة إدارة المهام في التحديث القادم</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}