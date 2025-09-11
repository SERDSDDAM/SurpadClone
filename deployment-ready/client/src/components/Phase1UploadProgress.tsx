/**
 * Phase 1 Upload Progress Component
 * مكون تتبع رفع المرحلة الأولى
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play,
  Square,
  Eye,
  Download
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

interface ProcessingJob {
  job_id: string;
  layer_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  metadata?: {
    original_filename?: string;
    cog_url?: string;
    png_url?: string;
    bounds_wgs84?: [[number, number], [number, number]];
    width?: number;
    height?: number;
    crs?: string;
    error?: string;
  };
  created_at: string;
  updated_at: string;
}

interface Phase1UploadProgressProps {
  jobId: string;
  onComplete?: (job: ProcessingJob) => void;
  onError?: (error: string) => void;
  showControls?: boolean;
}

export default function Phase1UploadProgress({ 
  jobId, 
  onComplete, 
  onError,
  showControls = true 
}: Phase1UploadProgressProps) {
  const queryClient = useQueryClient();
  
  // Poll job status
  const { data: jobData, error, isLoading } = useQuery({
    queryKey: ['/api/gis/jobs', jobId],
    queryFn: async () => {
      const response = await apiRequest(`/api/gis/jobs/${jobId}`);
      return response.job as ProcessingJob;
    },
    refetchInterval: (data) => {
      // Stop polling when job is completed, failed, or cancelled
      if (data && data.status && ['completed', 'failed', 'cancelled'].includes(data.status)) {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchIntervalInBackground: true,
  });

  // Cancel job mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/gis/jobs/${jobId}/cancel`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gis/jobs', jobId] });
    },
    onError: (error) => {
      console.error('Cancel job failed:', error);
      const axiosError = error as AxiosError;
      console.error('Full error details:', axiosError.response?.data || axiosError.message);
    },
  });

  // Handle job completion
  useEffect(() => {
    if (jobData?.status === 'completed' && onComplete) {
      onComplete(jobData);
    } else if (jobData?.status === 'failed' && onError) {
      onError(jobData.metadata?.error || 'Processing failed');
    }
  }, [jobData?.status, onComplete, onError, jobData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDuration = (createdAt: string, updatedAt: string) => {
    const created = new Date(createdAt);
    const updated = new Date(updatedAt);
    const duration = Math.floor((updated.getTime() - created.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    } else {
      return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>جاري تحميل حالة المهمة...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !jobData) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              خطأ في تحميل حالة المهمة: {error instanceof Error ? error.message : 'خطأ غير معروف'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon(jobData.status)}
            <span>معالجة الطبقة: {jobData.layer_id}</span>
          </div>
          <Badge variant={getStatusColor(jobData.status)}>
            {jobData.status === 'queued' && 'في الطابور'}
            {jobData.status === 'processing' && 'قيد المعالجة'}
            {jobData.status === 'completed' && 'مكتملة'}
            {jobData.status === 'failed' && 'فشلت'}
            {jobData.status === 'cancelled' && 'ملغاة'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {jobData.status === 'processing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>التقدم</span>
              <span>{jobData.progress}%</span>
            </div>
            <Progress value={jobData.progress} className="h-2" />
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {jobData.metadata?.original_filename && (
            <div>
              <span className="text-muted-foreground">اسم الملف:</span>
              <p className="font-medium">{jobData.metadata.original_filename}</p>
            </div>
          )}
          
          <div>
            <span className="text-muted-foreground">المدة:</span>
            <p className="font-medium">
              {formatDuration(jobData.created_at, jobData.updated_at)}
            </p>
          </div>

          {jobData.metadata?.width && jobData.metadata?.height && (
            <div>
              <span className="text-muted-foreground">الأبعاد:</span>
              <p className="font-medium">{jobData.metadata.width} × {jobData.metadata.height}</p>
            </div>
          )}

          {jobData.metadata?.crs && (
            <div>
              <span className="text-muted-foreground">نظام الإحداثيات:</span>
              <p className="font-medium">{jobData.metadata.crs}</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {jobData.status === 'failed' && jobData.metadata?.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{jobData.metadata.error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message with Links */}
        {jobData.status === 'completed' && jobData.metadata && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              تم إنجاز معالجة الطبقة بنجاح! الطبقة متاحة الآن للعرض.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {showControls && (
          <div className="flex gap-2 pt-2">
            {jobData.status === 'processing' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                <Square className="h-4 w-4 mr-2" />
                {cancelMutation.isPending ? 'جاري الإلغاء...' : 'إلغاء'}
              </Button>
            )}

            {jobData.status === 'completed' && jobData.metadata?.png_url && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(jobData.metadata!.png_url, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  عرض الصورة
                </Button>
                
                {jobData.metadata.cog_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(jobData.metadata!.cog_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تحميل COG
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}