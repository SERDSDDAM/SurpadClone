import React from 'react';
import GeographicDataBrowser from '@/components/GeographicDataBrowser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, BarChart3 } from 'lucide-react';

export default function GeographicDataBrowserPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                متصفح البيانات الجغرافية الشامل
              </h1>
              <p className="text-muted-foreground mt-1">
                نظام شامل لاستعراض وإدارة البيانات الجغرافية الإدارية للجمهورية اليمنية
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-lg py-2 px-4">
              <BarChart3 className="w-4 h-4 mr-2" />
              9 مستويات إدارية
            </Badge>
            <Badge variant="secondary" className="text-lg py-2 px-4">
              <Users className="w-4 h-4 mr-2" />
              30+ مليون مواطن
            </Badge>
          </div>
        </div>
        
        {/* Features Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">الميزات الرئيسية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>التنقل الهرمي التسعة مستويات</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>البحث المتقدم والتصفية</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>التصدير المتعدد الصيغ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>الإحصائيات التفاعلية</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Browser Component */}
      <GeographicDataBrowser 
        height="calc(100vh - 280px)"
        defaultExpanded={true}
        onSelectionChange={(level, selection) => {
          console.log(`تم اختيار ${level}:`, selection);
        }}
        data-testid="geographic-data-browser"
      />
      
      {/* Footer Info */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          نظام بنّاء اليمن للتحول الرقمي في قطاع البناء والتشييد - الإصدار 2.0
        </p>
        <p className="mt-1">
          يدعم جميع المستويات الإدارية من المحافظات إلى الشوارع مع إحصائيات شاملة
        </p>
      </div>
    </div>
  );
}