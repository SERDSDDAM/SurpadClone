import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Bell, 
  FileText, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Home,
  Building2,
  MapPin,
  User,
  Settings,
  LogOut,
  Phone,
  Mail,
  Download,
  Upload,
  MessageSquare,
  TrendingUp,
  Activity
} from "lucide-react";
import { useState } from "react";

export default function CitizenDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock data - في التطبيق الحقيقي ستأتي من API
  const recentUpdates = [
    {
      id: 1,
      type: "status_update",
      message: "تمت مراجعة طلب رخصة البناء رقم #2024-001 من قبل المهندس أحمد محمد",
      timestamp: "2025-01-27 14:30",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      id: 2,
      type: "document_request",
      message: "مطلوب رفع نسخة من صك الملكية لطلب رقم #2024-002",
      timestamp: "2025-01-27 12:15",
      icon: Upload,
      color: "text-orange-600"
    },
    {
      id: 3,
      type: "payment",
      message: "تم إصدار فاتورة رسوم رخصة البناء بقيمة 50,000 ريال",
      timestamp: "2025-01-27 10:00",
      icon: CreditCard,
      color: "text-blue-600"
    }
  ];

  const requiredActions = [
    {
      id: 1,
      title: "سداد فاتورة رسوم",
      description: "فاتورة رقم #INV-2024-001 بقيمة 50,000 ريال",
      dueDate: "2025-02-01",
      priority: "high",
      actionUrl: "/payments/INV-2024-001"
    },
    {
      id: 2,
      title: "رفع مستندات ناقصة",
      description: "نسخة من صك الملكية لطلب رخصة البناء",
      dueDate: "2025-01-30",
      priority: "medium",
      actionUrl: "/documents/upload"
    }
  ];

  const myRequests = [
    {
      id: "#2024-001",
      type: "رخصة بناء",
      property: "منزل سكني - حي الزهراء",
      status: "قيد المراجعة الفنية",
      progress: 65,
      submittedDate: "2025-01-15",
      estimatedCompletion: "2025-02-15"
    },
    {
      id: "#2024-002", 
      type: "شهادة إشغال",
      property: "مبنى تجاري - شارع الستين",
      status: "في انتظار التفتيش",
      progress: 45,
      submittedDate: "2025-01-20",
      estimatedCompletion: "2025-02-20"
    }
  ];

  const quickServices = [
    { name: "رخصة بناء جديدة", icon: Building2, href: "/building-permits/new" },
    { name: "شهادة إشغال", icon: Home, href: "/occupancy-certificates/new" },
    { name: "طلب تفتيش", icon: CheckCircle, href: "/inspections/request" },
    { name: "دفع الرسوم", icon: CreditCard, href: "/payments" },
    { name: "رفع مستندات", icon: Upload, href: "/documents/upload" },
    { name: "تحديث البيانات", icon: User, href: "/profile/update" }
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">بوابة المواطن</h1>
                <p className="text-sm text-gray-600">أهلاً وسهلاً، محمد أحمد</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
                <Badge variant="destructive" className="mr-1 text-xs">3</Badge>
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Required Actions Alert */}
        {requiredActions.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>مطلوب إجراء:</strong> لديك {requiredActions.length} إجراءات مطلوبة تحتاج لانتباهك
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  آخر التحديثات
                </CardTitle>
                <CardDescription>
                  تحديثات حية على معاملاتك وطلباتك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentUpdates.map((update) => {
                  const IconComponent = update.icon;
                  return (
                    <div key={update.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <IconComponent className={`h-5 w-5 mt-0.5 ${update.color}`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{update.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{update.timestamp}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* My Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  طلباتي الحالية
                </CardTitle>
                <CardDescription>
                  متابعة حالة جميع طلباتك ومعاملاتك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{request.type}</h4>
                          <p className="text-sm text-gray-600">{request.property}</p>
                          <Badge variant="outline" className="mt-2">{request.id}</Badge>
                        </div>
                        <Badge 
                          variant={request.status.includes("قيد") ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>التقدم:</span>
                          <span>{request.progress}%</span>
                        </div>
                        <Progress value={request.progress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-gray-600">
                        <div>
                          <span className="block">تاريخ التقديم:</span>
                          <span>{request.submittedDate}</span>
                        </div>
                        <div>
                          <span className="block">الإنجاز المتوقع:</span>
                          <span>{request.estimatedCompletion}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3 ml-1" />
                          تواصل
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 ml-1" />
                          المستندات
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Required Actions */}
            {requiredActions.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="h-5 w-5" />
                    إجراءات مطلوبة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requiredActions.map((action) => (
                    <div key={action.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-900">{action.title}</h4>
                      <p className="text-sm text-orange-700 mt-1">{action.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-orange-600">
                          مطلوب قبل: {action.dueDate}
                        </span>
                        <Badge 
                          variant={action.priority === "high" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {action.priority === "high" ? "عاجل" : "متوسط"}
                        </Badge>
                      </div>
                      <Button size="sm" className="w-full mt-2" variant="outline">
                        اتخاذ الإجراء
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  الوصول السريع
                </CardTitle>
                <CardDescription>
                  الخدمات الأكثر استخداماً
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {quickServices.map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <Button
                      key={service.name}
                      variant="outline"
                      className="h-auto p-3 flex flex-col items-center gap-2 text-center"
                      onClick={() => window.location.href = service.href}
                    >
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <span className="text-xs">{service.name}</span>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">تواصل معنا</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>191 (خدمة عملاء 24/7)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>support@binaa.gov.ye</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>مكاتب الخدمة في جميع المحافظات</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}