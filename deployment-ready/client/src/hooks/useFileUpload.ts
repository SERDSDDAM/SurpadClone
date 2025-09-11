import { useState, useCallback } from 'react';
import { uploadFile, APIError } from '@/lib/api';

interface UseFileUploadOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await uploadFile(file, (progressValue) => {
        setProgress(progressValue);
        options.onProgress?.(progressValue);
      });

      setProgress(100);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof APIError || err instanceof Error 
        ? err.message 
        : 'Unknown upload error';
      
      setError(errorMessage);
      options.onError?.(err as Error);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setProgress(0);
    setError(null);
    setIsUploading(false);
  }, []);

  return {
    upload,
    reset,
    isUploading,
    progress,
    error,
  };
}