/**
 * Hook for managing layer visibility with server persistence
 * هوك لإدارة رؤية الطبقات مع الحفظ على الخادم
 */

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface LayerVisibilityState {
  visible: boolean;
  opacity: number;
  zIndex: number;
  lastUpdated: string;
}

export interface UseLayerVisibilityReturn {
  visibilityStates: Record<string, LayerVisibilityState>;
  isLoading: boolean;
  error: string | null;
  updateLayerVisibility: (layerId: string, updates: Partial<LayerVisibilityState>) => Promise<void>;
  updateMultipleLayerVisibility: (updates: Record<string, Partial<LayerVisibilityState>>) => Promise<void>;
  refreshVisibilityStates: () => Promise<void>;
}

/**
 * Hook for managing layer visibility with server persistence
 */
export function useLayerVisibility(): UseLayerVisibilityReturn {
  const [visibilityStates, setVisibilityStates] = useState<Record<string, LayerVisibilityState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // تحميل حالة الرؤية من الخادم
  const loadVisibilityStates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiRequest('/api/gis/layers/visibility');
      
      if (response.success) {
        setVisibilityStates(response.visibility || {});
      } else {
        throw new Error(response.error || 'فشل في تحميل حالة الرؤية');
      }
    } catch (err) {
      console.error('❌ خطأ في تحميل حالة الرؤية:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث رؤية طبقة واحدة
  const updateLayerVisibility = async (layerId: string, updates: Partial<LayerVisibilityState>) => {
    try {
      setError(null);
      
      // تحديث الحالة المحلية فوراً (Optimistic Update)
      setVisibilityStates(prev => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          ...updates,
          lastUpdated: new Date().toISOString()
        }
      }));
      
      // إرسال التحديث للخادم
      const response = await apiRequest(`/api/gis/layers/${layerId}/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.success) {
        // إرجاع الحالة المحلية عند الفشل
        await loadVisibilityStates();
        throw new Error(response.error || 'فشل في تحديث حالة الرؤية');
      }
      
      console.log(`✅ تم تحديث رؤية الطبقة ${layerId}`);
    } catch (err) {
      console.error('❌ خطأ في تحديث رؤية الطبقة:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
      throw err;
    }
  };

  // تحديث رؤية عدة طبقات
  const updateMultipleLayerVisibility = async (updates: Record<string, Partial<LayerVisibilityState>>) => {
    try {
      setError(null);
      
      // تحديث الحالة المحلية فوراً
      setVisibilityStates(prev => {
        const newStates = { ...prev };
        Object.entries(updates).forEach(([layerId, layerUpdates]) => {
          newStates[layerId] = {
            ...prev[layerId],
            ...layerUpdates,
            lastUpdated: new Date().toISOString()
          };
        });
        return newStates;
      });
      
      // إرسال التحديث للخادم
      const response = await apiRequest('/api/gis/layers/visibility/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      
      if (!response.success) {
        // إرجاع الحالة المحلية عند الفشل
        await loadVisibilityStates();
        throw new Error(response.error || 'فشل في التحديث المجمع');
      }
      
      console.log(`✅ تم تحديث ${Object.keys(updates).length} طبقة`);
    } catch (err) {
      console.error('❌ خطأ في التحديث المجمع:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
      throw err;
    }
  };

  // تحديث حالة الرؤية من الخادم
  const refreshVisibilityStates = async () => {
    await loadVisibilityStates();
  };

  // تحميل الحالة عند البداية
  useEffect(() => {
    loadVisibilityStates();
  }, []);

  // التحديث التلقائي كل دقيقة (اختياري)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        loadVisibilityStates();
      }
    }, 60000); // 60 ثانية

    return () => clearInterval(interval);
  }, [isLoading]);

  return {
    visibilityStates,
    isLoading,
    error,
    updateLayerVisibility,
    updateMultipleLayerVisibility,
    refreshVisibilityStates
  };
}

/**
 * Helper function to get default visibility state for a new layer
 */
export function getDefaultVisibilityState(): LayerVisibilityState {
  return {
    visible: true,
    opacity: 1.0,
    zIndex: 1000,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Helper function to merge visibility state with layer data
 */
export function mergeLayerWithVisibility<T extends { id: string }>(
  layer: T, 
  visibilityState?: LayerVisibilityState
): T & LayerVisibilityState {
  return {
    ...layer,
    ...(visibilityState || getDefaultVisibilityState())
  };
}