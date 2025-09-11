import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MapPin, 
  Building, 
  Users, 
  Settings, 
  ArrowRight,
  Zap,
  FileUp,
  Satellite
} from "lucide-react";

export default function ServicesMenu() {
  return (
    <div className="min-h-screen bg-gray-50" data-testid="services-menu">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">منصة بنّاء اليمن الرقمية</h1>
            <p className="text-gray-600">الخدمات الحكومية الرقمية للبناء والتشييد</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Access Cards */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-8">
          {/* Survey Decision Service - Main Feature */}
          <Card className="relative overflow-hidden border-blue-200 hover:shadow-lg transition-all">
            <div className="absolute top-2 right-2">
              <Badge variant="default" className="bg-blue-600">
                <Zap className="w-3 h-3 mr-1" />
                جديد
              </Badge>
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                <span>القرار المساحي</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">
                إصدار القرار المساحي للقطع العقارية مع دعم مسارين: Shapefile للإسقاطات السابقة أو GNSS للمسح الميداني الجديد
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileUp className="w-4 h-4 text-orange-500" />
                  <span>مسار Shapefile (1-2 أيام)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Satellite className="w-4 h-4 text-blue-500" />
                  <span>مسار GNSS الميداني (3-5 أيام)</span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/survey/wizard">
                  <Button className="w-full" data-testid="survey-decision-btn">
                    <span>بدء طلب جديد</span>
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Building Permits */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-6 h-6 text-green-600" />
                <span>رخص البناء</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">
                استخراج رخص البناء للمباني السكنية والتجارية والصناعية
              </p>
              
              <div className="space-y-1 text-xs text-gray-500">
                <div>• رخصة بناء مبنى سكني</div>
                <div>• رخصة بناء مبنى تجاري</div>
                <div>• رخصة ترميم وصيانة</div>
              </div>

              <Button variant="outline" className="w-full" disabled data-testid="building-permits-btn">
                <span>قريباً</span>
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Administrative Services */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                <span>الخدمات الإدارية</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">
                إدارة الطلبات والمتابعة والاستعلامات الإدارية
              </p>
              
              <div className="space-y-1 text-xs text-gray-500">
                <div>• متابعة حالة الطلبات</div>
                <div>• الاستعلامات العامة</div>
                <div>• دفع الرسوم إلكترونياً</div>
              </div>

              <Link href="/admin/login">
                <Button variant="outline" className="w-full" data-testid="admin-services-btn">
                  <span>دخول النظام الإداري</span>
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Service Statistics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">1,247</div>
                <div className="text-sm text-blue-800">قرار مساحي مُصدر</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">856</div>
                <div className="text-sm text-green-800">رخصة بناء</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">24</div>
                <div className="text-sm text-orange-800">ساعة (متوسط وقت الإنجاز)</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">98.5%</div>
                <div className="text-sm text-purple-800">معدل رضا المستفيدين</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-800">النظام يعمل بكامل طاقته</span>
              </div>
              <p className="text-sm text-gray-600">
                آخر تحديث: {new Date().toLocaleString('ar-YE')} • زمن الاستجابة: 0.2 ثانية
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            منصة بنّاء اليمن الرقمية | وزارة الأشغال العامة والطرق | الجمهورية اليمنية
          </p>
          <p className="text-xs mt-1">
            للدعم الفني: support@banaa.gov.ye | 777-123-456
          </p>
        </div>
      </div>
    </div>
  );
}