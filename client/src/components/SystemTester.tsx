import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export function SystemTester() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'اختبار حالة الخادم', status: 'pending' },
    { name: 'اختبار طبقات النظام', status: 'pending' },
    { name: 'اختبار نظام الملفات', status: 'pending' },
    { name: 'اختبار إنشاء طبقة تجريبية', status: 'pending' },
    { name: 'اختبار رفع ملف', status: 'pending' }
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runTest = async (testIndex: number) => {
    updateTest(testIndex, { status: 'running' });
    
    try {
      switch (testIndex) {
        case 0: // Server status
          const pingResponse = await fetch('/api/gis/debug/layers');
          if (pingResponse.ok) {
            const data = await pingResponse.json();
            updateTest(testIndex, { 
              status: 'success', 
              message: `${data.layersCount} طبقات محفوظة في النظام`,
              data 
            });
          } else {
            throw new Error(`HTTP ${pingResponse.status}`);
          }
          break;

        case 1: // System layers
          const layersResponse = await fetch('/api/gis/debug/layers');
          if (layersResponse.ok) {
            const data = await layersResponse.json();
            updateTest(testIndex, { 
              status: 'success', 
              message: `تم العثور على ${data.layersCount} طبقات`,
              data: data.layers 
            });
          } else {
            throw new Error(`HTTP ${layersResponse.status}`);
          }
          break;

        case 2: // File system
          const fsResponse = await fetch('/api/gis/debug/filesystem');
          if (fsResponse.ok) {
            const data = await fsResponse.json();
            updateTest(testIndex, { 
              status: 'success', 
              message: `${data.directories.length} مجلد في النظام`,
              data 
            });
          } else {
            throw new Error(`HTTP ${fsResponse.status}`);
          }
          break;

        case 3: // Create test layer
          const createResponse = await fetch('/api/gis/debug/create-test-layer', {
            method: 'POST'
          });
          if (createResponse.ok) {
            const data = await createResponse.json();
            updateTest(testIndex, { 
              status: 'success', 
              message: `تم إنشاء طبقة تجريبية: ${data.layerId}`,
              data 
            });
          } else {
            throw new Error(`HTTP ${createResponse.status}`);
          }
          break;

        case 4: // File upload test
          // Create a small test file
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 100, 100);
          }
          
          canvas.toBlob(async (blob) => {
            if (!blob) throw new Error('Failed to create test file');
            
            const formData = new FormData();
            formData.append('file', blob, 'test.png');
            
            const uploadResponse = await fetch('/api/gis/upload', {
              method: 'POST',
              body: formData
            });
            
            if (uploadResponse.ok) {
              const data = await uploadResponse.json();
              updateTest(testIndex, { 
                status: 'success', 
                message: `تم رفع الملف بنجاح: ${data.layerId}`,
                data 
              });
            } else {
              const errorText = await uploadResponse.text();
              throw new Error(`HTTP ${uploadResponse.status}: ${errorText}`);
            }
          }, 'image/png');
          break;
      }
    } catch (error) {
      updateTest(testIndex, { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'خطأ غير معروف' 
      });
    }
  };

  const runAllTests = async () => {
    for (let i = 0; i < tests.length; i++) {
      await runTest(i);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 اختبار شامل للنظام
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runAllTests} className="w-full">
          تشغيل جميع الاختبارات
        </Button>
        
        <div className="space-y-2">
          {tests.map((test, index) => (
            <Alert key={index} className={`${
              test.status === 'success' ? 'border-green-200 bg-green-50' :
              test.status === 'error' ? 'border-red-200 bg-red-50' :
              test.status === 'running' ? 'border-blue-200 bg-blue-50' :
              'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {test.status === 'running' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {test.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {test.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                  <span className="font-medium">{test.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest(index)}
                  disabled={test.status === 'running'}
                >
                  اختبار
                </Button>
              </div>
              {test.message && (
                <AlertDescription className="mt-2 text-sm">
                  {test.message}
                </AlertDescription>
              )}
              {test.data && test.status === 'success' && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer text-gray-600">
                    عرض التفاصيل
                  </summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </details>
              )}
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}