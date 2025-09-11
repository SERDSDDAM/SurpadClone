/**
 * Phase 0 Test Page - Comprehensive testing for visibility persistence
 * صفحة اختبار Phase 0 للتأكد من عمل نظام حفظ الرؤية
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCcw, 
  Settings, 
  Eye, 
  EyeOff,
  Database,
  Layers,
  TestTube,
  Activity
} from 'lucide-react';
import { useLayerVisibility } from '@/hooks/useLayerVisibility';
import { apiRequest } from '@/lib/queryClient';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export default function Phase0Test() {
  const {
    visibilityStates,
    isLoading,
    error,
    updateLayerVisibility,
    updateMultipleLayerVisibility,
    refreshVisibilityStates
  } = useLayerVisibility();

  const [layers, setLayers] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // تحميل الطبقات من API
  useEffect(() => {
    loadLayers();
  }, []);

  const loadLayers = async () => {
    try {
      const response = await apiRequest('/api/gis/layers');
      if (response.success) {
        setLayers(response.layers || []);
      }
    } catch (error) {
      console.error('خطأ في تحميل الطبقات:', error);
    }
  };

  // تعريف الاختبارات
  const runTest = async (testName: string, testFunction: () => Promise<void>): Promise<TestResult> => {
    const startTime = Date.now();
    
    setTestResults(prev => prev.map(test => 
      test.name === testName 
        ? { ...test, status: 'running' }
        : test
    ));

    try {
      await testFunction();
      const duration = Date.now() - startTime;
      return {
        name: testName,
        status: 'passed',
        message: 'اجتاز الاختبار بنجاح',
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name: testName,
        status: 'failed',
        message: error instanceof Error ? error.message : 'خطأ غير معروف',
        duration
      };
    }
  };

  // تشغيل جميع الاختبارات
  const runAllTests = async () => {
    setIsRunningTests(true);
    
    // تهيئة حالة الاختبارات
    const tests: TestResult[] = [
      { name: 'تحميل حالة الرؤية', status: 'pending' },
      { name: 'تحديث رؤية طبقة واحدة', status: 'pending' },
      { name: 'تحديث opacity', status: 'pending' },
      { name: 'تحديث zIndex', status: 'pending' },
      { name: 'تحديث مجمع للطبقات', status: 'pending' },
      { name: 'استمرارية البيانات عبر إعادة التحميل', status: 'pending' },
      { name: 'معايير metadata.json موحد', status: 'pending' },
      { name: 'layer-state.json persistence', status: 'pending' }
    ];
    
    setTestResults(tests);

    const results: TestResult[] = [];

    // اختبار 1: تحميل حالة الرؤية
    results.push(await runTest('تحميل حالة الرؤية', async () => {
      await refreshVisibilityStates();
      if (typeof visibilityStates !== 'object') {
        throw new Error('فشل في تحميل حالة الرؤية');
      }
    }));

    // اختبار 2: تحديث رؤية طبقة واحدة
    if (layers.length > 0) {
      const testLayer = layers[0];
      results.push(await runTest('تحديث رؤية طبقة واحدة', async () => {
        await updateLayerVisibility(testLayer.id, { visible: !testLayer.visible });
        await new Promise(resolve => setTimeout(resolve, 500)); // انتظار قصير
      }));

      // اختبار 3: تحديث opacity
      results.push(await runTest('تحديث opacity', async () => {
        await updateLayerVisibility(testLayer.id, { opacity: 0.7 });
        await new Promise(resolve => setTimeout(resolve, 500));
      }));

      // اختبار 4: تحديث zIndex
      results.push(await runTest('تحديث zIndex', async () => {
        await updateLayerVisibility(testLayer.id, { zIndex: 2000 });
        await new Promise(resolve => setTimeout(resolve, 500));
      }));
    } else {
      results.push({ name: 'تحديث رؤية طبقة واحدة', status: 'failed', message: 'لا توجد طبقات للاختبار' });
      results.push({ name: 'تحديث opacity', status: 'failed', message: 'لا توجد طبقات للاختبار' });
      results.push({ name: 'تحديث zIndex', status: 'failed', message: 'لا توجد طبقات للاختبار' });
    }

    // اختبار 5: تحديث مجمع
    if (layers.length >= 2) {
      results.push(await runTest('تحديث مجمع للطبقات', async () => {
        const updates: any = {};
        layers.slice(0, 2).forEach((layer, index) => {
          updates[layer.id] = { opacity: 0.5 + (index * 0.2) };
        });
        await updateMultipleLayerVisibility(updates);
      }));
    } else {
      results.push({ name: 'تحديث مجمع للطبقات', status: 'failed', message: 'الحاجة لطبقتين على الأقل' });
    }

    // اختبار 6: استمرارية البيانات
    results.push(await runTest('استمرارية البيانات عبر إعادة التحميل', async () => {
      const beforeRefresh = { ...visibilityStates };
      await refreshVisibilityStates();
      
      // التحقق من أن البيانات لا تزال محفوظة
      if (Object.keys(beforeRefresh).length > 0 && Object.keys(visibilityStates).length === 0) {
        throw new Error('فقدان البيانات عبر إعادة التحميل');
      }
    }));

    // اختبار 7: معايير metadata.json
    results.push(await runTest('معايير metadata.json موحد', async () => {
      const response = await apiRequest('/api/gis/layers');
      const layers = response.layers || [];
      
      for (const layer of layers) {
        if (layer.status === 'processed') {
          const metadataResponse = await fetch(`/api/gis/layers/${layer.id}/metadata`);
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            
            // التحقق من وجود الحقول المطلوبة
            const requiredFields = ['success', 'imageFile', 'bbox', 'leaflet_bounds', 'width', 'height', 'crs'];
            for (const field of requiredFields) {
              if (!(field in metadata)) {
                throw new Error(`حقل مطلوب مفقود في metadata: ${field}`);
              }
            }
          }
        }
      }
    }));

    // اختبار 8: layer-state.json persistence
    results.push(await runTest('layer-state.json persistence', async () => {
      const response = await fetch('/api/gis/layers/visibility');
      if (!response.ok) {
        throw new Error('فشل في الوصول لـ layer-state.json');
      }
      
      const data = await response.json();
      if (!data.success || !data.visibility) {
        throw new Error('تنسيق غير صحيح لـ layer-state.json');
      }
    }));

    setTestResults(results);
    setIsRunningTests(false);
  };

  // احصائيات الاختبارات
  const testStats = testResults.reduce((acc, test) => {
    acc[test.status]++;
    return acc;
  }, { pending: 0, running: 0, passed: 0, failed: 0 });

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧪 Phase 0 Test Suite</h1>
        <p className="text-muted-foreground">
          اختبارات شاملة لنظام حفظ الرؤية والمعايير الموحدة - المرحلة 0
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="tests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">الاختبارات</TabsTrigger>
          <TabsTrigger value="layers">الطبقات</TabsTrigger>
          <TabsTrigger value="visibility">حالة الرؤية</TabsTrigger>
          <TabsTrigger value="controls">تحكم يدوي</TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  نتائج الاختبارات
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{testStats.passed} نجح</Badge>
                  <Badge variant="destructive">{testStats.failed} فشل</Badge>
                  <Badge variant="secondary">{testStats.pending} معلق</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={runAllTests} 
                  disabled={isRunningTests || isLoading}
                  className="w-full"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {isRunningTests ? 'تشغيل الاختبارات...' : 'تشغيل جميع الاختبارات'}
                </Button>

                <div className="space-y-2">
                  {testResults.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {test.status === 'passed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {test.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                        {test.status === 'running' && <RefreshCcw className="h-5 w-5 animate-spin text-blue-500" />}
                        {test.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
                        
                        <div>
                          <div className="font-medium">{test.name}</div>
                          {test.message && (
                            <div className="text-sm text-muted-foreground">{test.message}</div>
                          )}
                        </div>
                      </div>
                      
                      {test.duration && (
                        <Badge variant="outline">{test.duration}ms</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                الطبقات المحملة ({layers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {layers.map((layer) => (
                  <div key={layer.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{layer.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          {layer.id} • {layer.status}
                        </div>
                      </div>
                      <Badge 
                        variant={layer.status === 'processed' ? 'default' : 'secondary'}
                      >
                        {layer.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                حالة الرؤية المحفوظة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  تحميل حالة الرؤية...
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(visibilityStates).map(([layerId, state]) => (
                    <div key={layerId} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{layerId}</div>
                        <div className="flex items-center gap-2">
                          {state.visible ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                          <Badge variant="outline">
                            {Math.round(state.opacity * 100)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        آخر تحديث: {new Date(state.lastUpdated).toLocaleString('ar')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                تحكم يدوي للاختبار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {layers.slice(0, 3).map((layer) => {
                  const state = visibilityStates[layer.id];
                  
                  return (
                    <div key={layer.id} className="p-4 border rounded">
                      <div className="font-medium mb-3">{layer.fileName}</div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>الرؤية</span>
                          <Switch 
                            checked={state?.visible || false}
                            onCheckedChange={async (visible) => {
                              await updateLayerVisibility(layer.id, { visible });
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <span>الشفافية: {Math.round((state?.opacity || 1) * 100)}%</span>
                          <Slider
                            value={[state?.opacity || 1]}
                            onValueChange={async ([opacity]) => {
                              await updateLayerVisibility(layer.id, { opacity });
                            }}
                            max={1}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <span>Z-Index: {state?.zIndex || 1000}</span>
                          <Slider
                            value={[state?.zIndex || 1000]}
                            onValueChange={async ([zIndex]) => {
                              await updateLayerVisibility(layer.id, { zIndex });
                            }}
                            max={5000}
                            min={100}
                            step={100}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}