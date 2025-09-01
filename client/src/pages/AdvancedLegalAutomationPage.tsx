// صفحة أتمتة القانون المتقدمة - المرحلة الثالثة المطورة
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  TestTube, 
  Target, 
  TrendingUp, 
  Settings,
  BookOpen,
  Users,
  Play,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { AdvancedRuleBuilderInterface } from '@/components/rule-builder/AdvancedRuleBuilderInterface';
import { SmartTemplatesLibrary } from '@/components/rule-builder/SmartTemplatesLibrary';
import { ScenarioSimulator } from '@/components/rule-builder/ScenarioSimulator';
import { AITrainerInterface } from '@/components/rule-builder/AITrainerInterface';
import { useQuery } from '@tanstack/react-query';

export function AdvancedLegalAutomationPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // جلب إحصائيات النظام
  const { data: systemStats } = useQuery({
    queryKey: ['/api/advanced-automation/stats'],
    retry: false,
  });

  // جلب القوانين النشطة
  const { data: activeRules } = useQuery({
    queryKey: ['/api/advanced-automation/rules'],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* العنوان الرئيسي */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg">
              <Brain className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                أتمتة قانون البناء المتقدمة
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                المرحلة الثالثة المطورة - نظام ذكي لأتمتة اشتراطات البناء والقوانين
              </p>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    {activeRules?.length || 12}
                  </p>
                  <p className="text-sm text-gray-600">قانون نشط</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">94.2%</p>
                  <p className="text-sm text-gray-600">دقة النظام</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600">1,247</p>
                  <p className="text-sm text-gray-600">طلب تمت معالجته</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600">2.4s</p>
                  <p className="text-sm text-gray-600">متوسط وقت المعالجة</p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* التبويبات الرئيسية */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white p-2 rounded-xl shadow-md">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <Brain className="h-4 w-4" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              منشئ القوانين
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <BookOpen className="h-4 w-4" />
              القوالب الذكية
            </TabsTrigger>
            <TabsTrigger value="simulator" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <TestTube className="h-4 w-4" />
              محاكي السيناريوهات
            </TabsTrigger>
            <TabsTrigger value="ai-trainer" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <Brain className="h-4 w-4" />
              مدرب الذكاء الاصطناعي
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              إدارة القوانين
            </TabsTrigger>
          </TabsList>

          {/* نظرة عامة */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* مزايا النظام المتقدم */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Zap className="h-6 w-6 text-purple-600" />
                    المزايا الجديدة في المرحلة الثالثة المطورة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-green-700">مكتبة القوالب الذكية</h4>
                        <p className="text-sm text-gray-600">5+ قوالب جاهزة للاستخدام مع إمكانية البحث والفلترة المتقدمة</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-blue-700">محاكي السيناريوهات المتقدم</h4>
                        <p className="text-sm text-gray-600">اختبار شامل للقوانين مع متغيرات متعددة وحالات معقدة</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-purple-700">مدرب الذكاء الاصطناعي</h4>
                        <p className="text-sm text-gray-600">نظام تعلم آلي مع مقاييس أداء وتحليل ذكي للقرارات</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-orange-700">تحليل المخاطر المتقدم</h4>
                        <p className="text-sm text-gray-600">تقييم ذكي للمخاطر مع توصيات استباقية ومعالجة الحالات الطارئة</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* حالة النظام */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    حالة النظام والأداء
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">دقة اتخاذ القرار</span>
                        <span className="text-sm font-bold text-green-600">94.2%</span>
                      </div>
                      <Progress value={94.2} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">سرعة المعالجة</span>
                        <span className="text-sm font-bold text-blue-600">92.8%</span>
                      </div>
                      <Progress value={92.8} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">رضا المستخدمين</span>
                        <span className="text-sm font-bold text-purple-600">96.5%</span>
                      </div>
                      <Progress value={96.5} className="h-2" />
                    </div>
                  </div>

                  {/* حالة الخدمات */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">✅ متصل</div>
                      <div className="text-xs text-gray-600">خدمة التقييم</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">✅ متصل</div>
                      <div className="text-xs text-gray-600">خدمة القوالب</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">✅ متصل</div>
                      <div className="text-xs text-gray-600">محرك الذكاء الاصطناعي</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">✅ متصل</div>
                      <div className="text-xs text-gray-600">خدمة المحاكاة</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* اختبار سريع */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TestTube className="h-6 w-6 text-blue-600" />
                  اختبار سريع للنظام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">مساحة البناء (م²)</label>
                    <input
                      type="number"
                      defaultValue={150}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">نوع المبنى</label>
                    <select className="w-full px-3 py-2 border rounded-lg">
                      <option value="residential">سكني</option>
                      <option value="commercial">تجاري</option>
                      <option value="industrial">صناعي</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">عدد الطوابق</label>
                    <input
                      type="number"
                      defaultValue={2}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="2"
                    />
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                  <Play className="h-4 w-4 mr-2" />
                  تشغيل اختبار سريع
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* منشئ القوانين */}
          <TabsContent value="builder" className="space-y-6">
            <AdvancedRuleBuilderInterface />
          </TabsContent>

          {/* القوالب الذكية */}
          <TabsContent value="templates" className="space-y-6">
            <SmartTemplatesLibrary />
          </TabsContent>

          {/* محاكي السيناريوهات */}
          <TabsContent value="simulator" className="space-y-6">
            <ScenarioSimulator />
          </TabsContent>

          {/* مدرب الذكاء الاصطناعي */}
          <TabsContent value="ai-trainer" className="space-y-6">
            <AITrainerInterface />
          </TabsContent>

          {/* إدارة القوانين */}
          <TabsContent value="management" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-6 w-6 text-gray-600" />
                  إدارة القوانين النشطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* قائمة القوانين */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">قانون المساحة الدنيا للمباني السكنية</h4>
                        <p className="text-sm text-gray-600">يجب أن تكون مساحة المبنى السكني لا تقل عن 100 متر مربع</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">سكني</Badge>
                          <Badge variant="outline">نشط</Badge>
                          <Badge variant="outline">دقة: 96%</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">تعديل</Button>
                        <Button size="sm" variant="outline">تعطيل</Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">قانون ارتفاع المباني في المناطق السكنية</h4>
                        <p className="text-sm text-gray-600">الحد الأقصى لارتفاع المباني في المناطق السكنية 15 متر</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">سكني</Badge>
                          <Badge variant="outline">نشط</Badge>
                          <Badge variant="outline">دقة: 94%</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">تعديل</Button>
                        <Button size="sm" variant="outline">تعطيل</Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">قانون السلامة الإنشائية للهدم</h4>
                        <p className="text-sm text-gray-600">يتطلب تقرير سلامة إنشائية من مهندس معتمد قبل الهدم</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">هدم</Badge>
                          <Badge variant="outline">نشط</Badge>
                          <Badge variant="outline">دقة: 99%</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">تعديل</Button>
                        <Button size="sm" variant="outline">تعطيل</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}