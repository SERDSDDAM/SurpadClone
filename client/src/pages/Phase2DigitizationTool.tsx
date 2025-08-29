import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DrawingToolbar, DrawingMode } from '@/components/DrawingToolbar';
import { FeatureAttributesModal } from '@/components/FeatureAttributesModal';
// Remove unused import
import type { 
  GeoJSONFeature, 
  GeoJSONFeatureCollection,
  GisFeatureInsert 
} from '@shared/gis-schema';
import { calculateGeometryMetrics } from '@/utils/geometry';
import { apiRequest } from '@/lib/queryClient';
import InteractiveDrawingMap from '@/components/InteractiveDrawingMap';

interface DigitizationState {
  currentMode: DrawingMode;
  drawnFeatures: GeoJSONFeature[];
  undoStack: GeoJSONFeature[][];
  redoStack: GeoJSONFeature[][];
  isDrawing: boolean;
  selectedFeature: GeoJSONFeature | null;
  showAttributesModal: boolean;
  pendingFeature: {
    geometry: any;
    featureType: string;
    calculatedMetrics?: any;
  } | null;
}

export default function Phase2DigitizationTool() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<DigitizationState>({
    currentMode: null,
    drawnFeatures: [],
    undoStack: [],
    redoStack: [],
    isDrawing: false,
    selectedFeature: null,
    showAttributesModal: false,
    pendingFeature: null,
  });

  const [selectedLayerId, setSelectedLayerId] = useState<string>('default_layer');
  const [featuresVisible, setFeaturesVisible] = useState(true);

  // Fetch existing features
  const { data: featuresCollection, isLoading } = useQuery({
    queryKey: ['/api/gis/features', selectedLayerId],
    queryFn: () => apiRequest(`/api/gis/features?layerId=${selectedLayerId}`),
  });

  // Save feature mutation
  const saveFeatureMutation = useMutation({
    mutationFn: async (feature: GisFeatureInsert) => {
      return apiRequest('/api/gis/features', {
        method: 'POST',
        body: JSON.stringify(feature),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gis/features', selectedLayerId] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المعلم بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في الحفظ",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle mode change
  const handleModeChange = useCallback((mode: DrawingMode) => {
    setState(prev => ({
      ...prev,
      currentMode: mode,
      isDrawing: mode !== null,
    }));
  }, []);

  // Handle feature drawn
  const handleFeatureDrawn = useCallback((feature: { geometry: any; featureType: string }) => {
    // Calculate metrics for the drawn feature
    const metrics = calculateGeometryMetrics(feature.geometry);
    
    setState(prev => ({
      ...prev,
      pendingFeature: { ...feature, calculatedMetrics: metrics },
      showAttributesModal: true,
      currentMode: null,
      isDrawing: false,
    }));
  }, []);

  // Handle saving with attributes
  const handleSaveWithAttributes = useCallback((attributes: any) => {
    if (!state.pendingFeature) return;

    const featureToSave: GisFeatureInsert = {
      layerId: selectedLayerId,
      geometry: JSON.stringify(state.pendingFeature.geometry),
      featureType: state.pendingFeature.featureType as any,
      properties: attributes,
      createdBy: 'current_user',
    };

    saveFeatureMutation.mutate(featureToSave);

    setState(prev => ({
      ...prev,
      pendingFeature: null,
      showAttributesModal: false,
    }));
  }, [state.pendingFeature, selectedLayerId, saveFeatureMutation]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (state.undoStack.length === 0) return;
    
    const previousState = state.undoStack[state.undoStack.length - 1];
    setState(prev => ({
      ...prev,
      drawnFeatures: previousState,
      undoStack: prev.undoStack.slice(0, -1),
      redoStack: [...prev.redoStack, prev.drawnFeatures],
    }));
  }, [state.undoStack]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (state.redoStack.length === 0) return;
    
    const nextState = state.redoStack[state.redoStack.length - 1];
    setState(prev => ({
      ...prev,
      drawnFeatures: nextState,
      redoStack: prev.redoStack.slice(0, -1),
      undoStack: [...prev.undoStack, prev.drawnFeatures],
    }));
  }, [state.redoStack]);

  // Save all features
  const handleSaveAll = useCallback(() => {
    toast({
      title: "حفظ تلقائي",
      description: "يتم حفظ المعالم تلقائياً عند الإنشاء",
    });
  }, [toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'Escape') {
        setState(prev => ({ ...prev, currentMode: null, isDrawing: false }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleUndo, handleRedo]);

  const totalFeatures = featuresCollection?.features?.length || 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-right">
              أدوات الرقمنة المتقدمة - Phase 2
            </h1>
            <p className="text-sm text-gray-600 text-right mt-1">
              رسم وتحرير المعالم الجغرافية مع خصائص تفصيلية
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {totalFeatures} معلم محفوظ
            </Badge>
            
            <div className="text-sm text-gray-600">
              الطبقة: <span className="font-semibold">{selectedLayerId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Map Container */}
        <div className="absolute inset-0">
          <InteractiveDrawingMap
            currentMode={state.currentMode}
            onFeatureDrawn={handleFeatureDrawn}
            features={featuresCollection?.features || []}
            featuresVisible={featuresVisible}
            isEnabled={true}
          />
        </div>

        {/* Drawing Toolbar */}
        <DrawingToolbar
          currentMode={state.currentMode}
          onModeChange={handleModeChange}
          canUndo={state.undoStack.length > 0}
          canRedo={state.redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSaveAll}
          featuresVisible={featuresVisible}
          onToggleVisibility={() => setFeaturesVisible(!featuresVisible)}
          featureCount={totalFeatures}
          isEnabled={true}
        />

        {/* Status Panel */}
        <Card className="fixed bottom-4 right-4 w-80 z-[1000]" dir="rtl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">حالة النظام</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>الوضع الحالي:</span>
              <Badge variant={state.currentMode ? "default" : "secondary"}>
                {state.currentMode || 'غير نشط'}
              </Badge>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>المعالم المحفوظة:</span>
              <span className="font-semibold">{totalFeatures}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>حالة التحميل:</span>
              <Badge variant={isLoading ? "secondary" : "outline"}>
                {isLoading ? 'تحميل...' : 'جاهز'}
              </Badge>
            </div>

            {state.currentMode && (
              <Alert className="mt-2">
                <AlertDescription className="text-xs text-right">
                  انقر على الخريطة لرسم {state.currentMode}. اضغط ESC للإلغاء.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Attributes Modal */}
      <FeatureAttributesModal
        isOpen={state.showAttributesModal}
        onClose={() => setState(prev => ({ 
          ...prev, 
          showAttributesModal: false, 
          pendingFeature: null 
        }))}
        onSave={handleSaveWithAttributes}
        featureType={state.pendingFeature?.featureType as any || 'point'}
        calculatedMetrics={state.pendingFeature?.calculatedMetrics}
      />
    </div>
  );
}