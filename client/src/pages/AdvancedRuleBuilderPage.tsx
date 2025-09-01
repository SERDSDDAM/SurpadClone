import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Wrench, TestTube, BookOpen, BarChart3, Zap } from 'lucide-react';
import { RuleBuilderInterface } from '@/components/rule-builder/RuleBuilderInterface';
import { RuleTemplatesLibrary } from '@/components/rule-builder/RuleTemplatesLibrary';
import { ScenarioSimulator } from '@/components/rule-builder/ScenarioSimulator';
import { RulePerformanceMonitor } from '@/components/rule-builder/RulePerformanceMonitor';
import { AITrainerInterface } from '@/components/rule-builder/AITrainerInterface';
import { useAuth } from '@/hooks/useAuth';

export function AdvancedRuleBuilderPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('builder');

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">يرجى تسجيل الدخول للوصول إلى أدوات إنشاء قوانين الأتمتة</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* العنوان والوصف */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Zap className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">مساعد إنشاء قوانين الأتمتة المتقدم</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          أنشئ وأدر واختبر قوانين الأتمتة الذكية بدون كتابة كود. 
          حوّل المنطق الإداري إلى قوانين تلقائية ذكية بسهولة تامة.
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <Badge variant="secondary" className="px-4 py-2">
            <Settings className="h-4 w-4 mr-2" />
            لا يحتاج برمجة
          </Badge>
          <Badge variant="secondary" className="px-4 py-2">
            <TestTube className="h-4 w-4 mr-2" />
            اختبار فوري
          </Badge>
          <Badge variant="secondary" className="px-4 py-2">
            <BarChart3 className="h-4 w-4 mr-2" />
            تحليل الأداء
          </Badge>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">15</div>
            <p className="text-sm text-muted-foreground">قواعد نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">89%</div>
            <p className="text-sm text-muted-foreground">معدل النجاح</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">6</div>
            <p className="text-sm text-muted-foreground">قوالب متاحة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-orange-600">1,247</div>
            <p className="text-sm text-muted-foreground">قرار هذا الشهر</p>
          </CardContent>
        </Card>
      </div>

      {/* الواجهات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="builder" className="flex items-center gap-2" data-testid="tab-rule-builder">
            <Wrench className="h-4 w-4" />
            إنشاء قاعدة
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2" data-testid="tab-templates">
            <BookOpen className="h-4 w-4" />
            مكتبة القوالب
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2" data-testid="tab-simulator">
            <TestTube className="h-4 w-4" />
            محاكي السيناريوهات
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2" data-testid="tab-performance">
            <BarChart3 className="h-4 w-4" />
            مراقبة الأداء
          </TabsTrigger>
          <TabsTrigger value="trainer" className="flex items-center gap-2" data-testid="tab-trainer">
            <Settings className="h-4 w-4" />
            مدرب الذكاء الاصطناعي
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                إنشاء قاعدة أتمتة جديدة
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                استخدم أدوات البناء المرئية لإنشاء قوانين أتمتة ذكية. 
                اسحب وأفلت العناصر لبناء منطق القرار بدون كتابة كود.
              </p>
            </CardHeader>
            <CardContent>
              <RuleBuilderInterface />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                مكتبة قوالب قوانين الأتمتة
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                استعرض وستخدم القوالب الجاهزة لتوفير الوقت. 
                جميع القوالب مُختبرة وموثقة من قبل خبراء النظام.
              </p>
            </CardHeader>
            <CardContent>
              <RuleTemplatesLibrary
                onSelectTemplate={(template) => {
                  // تحويل القالب لاستخدامه في إنشاء قاعدة جديدة
                  setActiveTab('builder');
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                محاكي السيناريوهات واختبار القوانين
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                اختبر قوانين الأتمتة على سيناريوهات مختلفة قبل التفعيل. 
                تأكد من دقة النظام ومعدلات النجاح.
              </p>
            </CardHeader>
            <CardContent>
              <ScenarioSimulator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                مراقبة أداء القوانين والإحصائيات
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                راقب أداء قوانين الأتمتة الخاصة بك واحصل على تقارير مفصلة 
                حول معدلات النجاح وأوقات التنفيذ.
              </p>
            </CardHeader>
            <CardContent>
              <RulePerformanceMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trainer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                مدرب الذكاء الاصطناعي
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                حسّن دقة النظام من خلال تصحيح القرارات الخاطئة وإعادة تدريب 
                النموذج لتحقيق نتائج أفضل.
              </p>
            </CardHeader>
            <CardContent>
              <AITrainerInterface />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نصائح وإرشادات */}
      <Card className="bg-blue-50 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            💡 نصائح لإنشاء قوانين أتمتة فعّالة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-blue-700 dark:text-blue-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">🎯 تحديد الأهداف بوضوح:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>حدد نوع القرارات التي تريد أتمتتها</li>
                <li>ابدأ بالقوانين البسيطة والواضحة</li>
                <li>اختبر كل قاعدة على بيانات حقيقية</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚡ تحسين الأداء:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>استخدم شروط محددة لتقليل الغموض</li>
                <li>راقب معدلات النجاح باستمرار</li>
                <li>حدّث القوانين بناءً على النتائج</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* روابط سريعة */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" asChild>
          <a href="/smart-automation" data-testid="link-smart-automation-dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            لوحة الأتمتة الذكية
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/admin" data-testid="link-admin-dashboard">
            <Settings className="h-4 w-4 mr-2" />
            لوحة الإدارة
          </a>
        </Button>
      </div>
    </div>
  );
}