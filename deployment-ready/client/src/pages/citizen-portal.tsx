import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, FileText, MapPin, CreditCard, AlertTriangle, User, Home, Search } from "lucide-react";

interface CitizenStats {
  totalCitizens: number;
  activeBuildingPermits: number;
  pendingPermits: number;
  totalRevenue: number;
}

interface BuildingPermit {
  id: string;
  permitNumber: string;
  projectName: string;
  projectType: string;
  buildingType: string;
  location: string;
  status: string;
  priority: string;
  submitDate: string;
  fees: number;
  paymentStatus: string;
}

export default function CitizenPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<CitizenStats>({
    queryKey: ["/api/stats"],
  });

  const { data: buildingPermits, isLoading: permitsLoading } = useQuery<BuildingPermit[]>({
    queryKey: ["/api/building-permits"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "submitted": return "bg-blue-500";
      case "under_review": return "bg-yellow-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "معتمد";
      case "submitted": return "مقدم";
      case "under_review": return "قيد المراجعة";
      case "rejected": return "مرفوض";
      default: return status;
    }
  };

  const getProjectTypeText = (type: string) => {
    switch (type) {
      case "residential": return "سكني";
      case "commercial": return "تجاري";
      case "industrial": return "صناعي";
      case "mixed": return "مختلط";
      default: return type;
    }
  };

  const getBuildingTypeText = (type: string) => {
    switch (type) {
      case "house": return "منزل";
      case "villa": return "فيلا";
      case "apartment_building": return "مجمع سكني";
      case "office": return "مكتب";
      case "shop": return "محل تجاري";
      case "warehouse": return "مستودع";
      default: return type;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 rtl" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">بوابة المواطنين</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          منصة موحدة لجميع خدمات البناء والتشييد في الجمهورية اليمنية
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="card-citizens-count">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalCitizens || 0}</p>
                <p className="text-gray-600">المواطنين المسجلين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-permits">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Home className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeBuildingPermits || 0}</p>
                <p className="text-gray-600">رخص البناء النشطة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-permits">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.pendingPermits || 0}</p>
                <p className="text-gray-600">الطلبات المعلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{(stats?.totalRevenue || 0).toLocaleString()} ر.ي</p>
                <p className="text-gray-600">إجمالي الإيرادات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="permits" data-testid="tab-permits">رخص البناء</TabsTrigger>
          <TabsTrigger value="certificates" data-testid="tab-certificates">شهادات الإشغال</TabsTrigger>
          <TabsTrigger value="violations" data-testid="tab-violations">المخالفات</TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">خدمات أخرى</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                الخدمات المتاحة
              </CardTitle>
              <CardDescription>
                جميع الخدمات الحكومية المتعلقة بالبناء والتشييد في مكان واحد
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  data-testid="button-building-permit"
                >
                  <Home className="h-6 w-6" />
                  <span>رخصة بناء</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  data-testid="button-occupancy-certificate"
                >
                  <FileText className="h-6 w-6" />
                  <span>شهادة إشغال</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  data-testid="button-survey-request"
                >
                  <MapPin className="h-6 w-6" />
                  <span>طلب مسح</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  data-testid="button-violation-report"
                >
                  <AlertTriangle className="h-6 w-6" />
                  <span>بلاغ مخالفة</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  data-testid="button-payment-services"
                >
                  <CreditCard className="h-6 w-6" />
                  <span>خدمات الدفع</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  data-testid="button-consultation"
                >
                  <User className="h-6 w-6" />
                  <span>الاستشارات</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permits" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>رخص البناء</CardTitle>
                  <CardDescription>
                    جميع رخص البناء المقدمة والمعتمدة
                  </CardDescription>
                </div>
                <Button data-testid="button-new-permit">
                  <Building2 className="h-4 w-4 ml-2" />
                  طلب رخصة جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="البحث في رخص البناء..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                    data-testid="input-search-permits"
                  />
                </div>

                {permitsLoading ? (
                  <div className="text-center py-8">
                    <p>جاري تحميل البيانات...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {buildingPermits?.map((permit) => (
                      <Card key={permit.id} className="hover:shadow-md transition-shadow" data-testid={`card-permit-${permit.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{permit.projectName}</h4>
                                <Badge className={getStatusColor(permit.status)} data-testid={`badge-status-${permit.id}`}>
                                  {getStatusText(permit.status)}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">رقم الرخصة:</span> {permit.permitNumber}</p>
                                <p><span className="font-medium">النوع:</span> {getProjectTypeText(permit.projectType)} - {getBuildingTypeText(permit.buildingType)}</p>
                                <p><span className="font-medium">الموقع:</span> {permit.location}</p>
                                <p><span className="font-medium">تاريخ التقديم:</span> {new Date(permit.submitDate).toLocaleDateString('ar-YE')}</p>
                              </div>
                            </div>
                            <div className="text-left space-y-2">
                              <div className="text-lg font-bold">
                                {permit.fees?.toLocaleString() || 0} ر.ي
                              </div>
                              <Badge variant={permit.paymentStatus === "paid" ? "default" : "secondary"}>
                                {permit.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>شهادات الإشغال</CardTitle>
              <CardDescription>
                شهادات الإشغال المطلوبة والصادرة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">لا توجد شهادات إشغال حالياً</p>
                <Button data-testid="button-new-certificate">
                  طلب شهادة إشغال جديدة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تقارير المخالفات</CardTitle>
              <CardDescription>
                جميع تقارير المخالفات والإجراءات المتخذة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">لا توجد مخالفات مسجلة</p>
                <Button data-testid="button-report-violation">
                  إبلاغ عن مخالفة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>خدمات إضافية</CardTitle>
              <CardDescription>
                خدمات مساندة ومتخصصة للمواطنين والمهنيين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">الاستشارات الفنية</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    استشارات هندسية ومعمارية من خبراء معتمدين
                  </p>
                  <Button size="sm" data-testid="button-technical-consultation">
                    طلب استشارة
                  </Button>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-2">فحص المباني</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    خدمات فحص سلامة المباني والمنشآت
                  </p>
                  <Button size="sm" data-testid="button-building-inspection">
                    طلب فحص
                  </Button>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-2">التدريب والتأهيل</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    برامج تدريبية للمهنيين في قطاع البناء
                  </p>
                  <Button size="sm" data-testid="button-training-programs">
                    عرض البرامج
                  </Button>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-2">الدعم الفني</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    مساعدة تقنية لاستخدام المنصة وخدماتها
                  </p>
                  <Button size="sm" data-testid="button-technical-support">
                    تواصل معنا
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}