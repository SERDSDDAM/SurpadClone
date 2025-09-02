// لوحة إدارة القوانين والإدارة - النظام المتقدم
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Scale, 
  Building2, 
  FileText,
  BarChart3,
  CheckCircle,
  Target
} from 'lucide-react';

interface LegalRule {
  ruleName: string;
  description: string;
  category: string;
  administrativeLevel: 'federal' | 'regional' | 'local' | 'municipal';
  governingAuthority: string;
  legalSource: string;
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  priority: number;
  amendments?: Amendment[];
}

interface Amendment {
  id: string;
  date: string;
  description: string;
  amendedBy: string;
  status: 'draft' | 'approved' | 'implemented';
}

export function LegalManagementDashboard() {
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [complianceReport, setComplianceReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // جلب الهيكل الإداري
        const hierarchyResponse = await fetch('/api/advanced-automation/administrative-hierarchy');
        const hierarchyData = await hierarchyResponse.json();
        setHierarchy(hierarchyData);

        // جلب تقرير الامتثال
        const complianceResponse = await fetch('/api/advanced-automation/compliance-report');
        const complianceData = await complianceResponse.json();
        setComplianceReport(complianceData);

        setLoading(false);
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Scale className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600">جاري تحميل نظام إدارة القوانين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* الرأس الرئيسي */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl shadow-lg">
              <Scale className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                إدارة القوانين والإدارة
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                نظام شامل لإدارة القوانين النافذة والهيكل الإداري
              </p>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-emerald-600">
                    {complianceReport?.report?.totalRules || 15}
                  </p>
                  <p className="text-sm text-gray-600">إجمالي القوانين</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {complianceReport?.report?.activeRules || 12}
                  </p>
                  <p className="text-sm text-gray-600">قوانين نشطة</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {hierarchy?.totalAuthorities || 24}
                  </p>
                  <p className="text-sm text-gray-600">جهة إدارية</p>
                </div>
                <Building2 className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600">
                    {complianceReport?.summary?.complianceRate || 85}%
                  </p>
                  <p className="text-sm text-gray-600">معدل الامتثال</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className="space-y-8">

          {/* إدارة القوانين */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="h-6 w-6" />
              إدارة القوانين النافذة
            </h2>

            {/* قائمة القوانين */}
            <div className="grid gap-4">
              {[
                {
                  ruleName: 'قانون البناء الموحد رقم 5 لسنة 2007',
                  description: 'القانون الأساسي لتنظيم أعمال البناء والتشييد في الجمهورية اليمنية',
                  category: 'building_permit',
                  level: 'federal',
                  authority: 'وزارة الأشغال العامة والطرق',
                  status: 'active',
                  amendments: 3
                },
                {
                  ruleName: 'لائحة السلامة الإنشائية رقم 12 لسنة 2010',
                  description: 'تنظيم متطلبات السلامة الإنشائية للمباني والمنشآت',
                  category: 'safety_compliance',
                  level: 'federal',
                  authority: 'الهيئة العامة للمواصفات والمقاييس',
                  status: 'active',
                  amendments: 1
                },
                {
                  ruleName: 'قانون المحافظة على التراث العمراني رقم 8 لسنة 2013',
                  description: 'حماية المناطق التراثية والمباني ذات القيمة التاريخية',
                  category: 'heritage_protection',
                  level: 'federal',
                  authority: 'الهيئة العامة للآثار والمتاحف',
                  status: 'active',
                  amendments: 0
                }
              ].map((law, index) => (
                <Card key={index} className="shadow-lg border-0">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{law.ruleName}</h3>
                        <p className="text-gray-600 mb-4">{law.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">{law.category}</Badge>
                          <Badge variant="outline">{law.level}</Badge>
                          <Badge variant={law.status === 'active' ? 'default' : 'secondary'}>
                            {law.status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                          {law.amendments > 0 && (
                            <Badge variant="outline">
                              {law.amendments} تعديل
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {law.authority}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          التفاصيل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* الهيكل الإداري */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              الهيكل الإداري لليمن
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hierarchy?.hierarchy && Object.entries(hierarchy.hierarchy).map(([level, authorities]) => (
                <Card key={level} className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {level === 'federal' ? 'المستوى الاتحادي' : 
                       level === 'regional' ? 'المستوى الإقليمي' :
                       level === 'local' ? 'المستوى المحلي' : 'المستوى البلدي'}
                      <Badge variant="outline">{authorities.length} جهة</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {authorities.map((authority: string, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">{authority}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* تقرير الامتثال */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              تقرير الامتثال القانوني
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-lg border-0 col-span-2">
                <CardHeader>
                  <CardTitle>التوزيع حسب المستوى الإداري</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceReport?.report?.rulesByLevel && Object.entries(complianceReport.report.rulesByLevel).map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between">
                        <span className="font-medium">
                          {level === 'federal' ? 'اتحادي' : 
                           level === 'regional' ? 'إقليمي' :
                           level === 'local' ? 'محلي' : 'بلدي'}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(count / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-bold">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>ملخص الامتثال</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-emerald-600 mb-2">
                      {complianceReport?.summary?.complianceRate || 85}%
                    </div>
                    <p className="text-sm text-gray-600">معدل الامتثال الإجمالي</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>القوانين النشطة</span>
                      <Badge variant="default">{complianceReport?.report?.activeRules || 12}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>إجمالي القوانين</span>
                      <Badge variant="outline">{complianceReport?.report?.totalRules || 15}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>التحديث الأخير</span>
                      <span className="text-sm text-gray-500">اليوم</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}