import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  FileText, 
  FolderOpen, 
  Bell, 
  User,
  MapPin,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Settings,
  Compass,
  Navigation
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { SurveyRequest, Surveyor } from "@shared/schema";

interface SurveyDashboardStats {
  newRequests: number;
  inProgress: number;
  underReview: number;
  completed: number;
}

const statusConfig = {
  submitted: {
    label: "مُقدم",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FileText
  },
  assigned: {
    label: "مُوزع",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Target
  },
  in_progress: {
    label: "قيد التنفيذ",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock
  },
  completed: {
    label: "مكتمل",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  },
  under_review: {
    label: "تحت المراجعة",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: FolderOpen
  },
  approved: {
    label: "معتمد",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle
  },
  rejected: {
    label: "مرفوض",
    color: "bg-red-100 text-red-800 border-red-200", 
    icon: AlertCircle
  }
};

const priorityConfig = {
  urgent: { label: "عاجل", color: "bg-red-500" },
  high: { label: "عالية", color: "bg-orange-500" },
  medium: { label: "متوسطة", color: "bg-yellow-500" },
  low: { label: "منخفضة", color: "bg-green-500" }
};

export default function SurveyorDashboard() {
  const [, navigate] = useLocation();
  
  // Fetch survey requests and stats from API
  const { data: surveyRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/survey-requests"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: surveyors = [], isLoading: surveyorsLoading } = useQuery({
    queryKey: ["/api/surveyors"],
  });

  // Get current surveyor (first one for demo - in real app would be from auth)
  const currentSurveyor = surveyors[0] as Surveyor;

  // Filter requests for current surveyor (assigned to them)
  const myRequests = (surveyRequests as SurveyRequest[]).filter((req: SurveyRequest) => 
    req.assignedSurveyorId === currentSurveyor?.id
  );

  // Get recent requests (last 5)
  const recentRequests = [...myRequests]
    .sort((a: SurveyRequest, b: SurveyRequest) => 
      new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
    )
    .slice(0, 5);

  const handleStartSurvey = (requestId: string) => {
    // Navigate to field app with selected survey request
    navigate(`/field-app?requestId=${requestId}`);
  };

  if (requestsLoading || statsLoading || surveyorsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const overviewCards = [
    { title: "المشاريع المنجزة", value: currentSurveyor?.totalProjects || 0, icon: FolderOpen, color: "text-green-600", bgColor: "bg-green-50" },
    { title: "الأيام النشطة", value: currentSurveyor?.activeDays || 0, icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "النقاط الإجمالية", value: currentSurveyor?.totalPoints || 0, icon: TrendingUp, color: "text-purple-600", bgColor: "bg-purple-50" },
    { title: "الحالة", value: currentSurveyor?.status === "active" ? "متاح" : "غير متاح", icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  ];

  const navigationItems = [
    { icon: Home, label: "الرئيسية", path: "/dashboard", active: true },
    { icon: FileText, label: "الخدمات", path: "/services", active: false },
    { icon: FolderOpen, label: "المشاريع", path: "/projects", active: false },
    { icon: Bell, label: "الاشعارات", path: "/notifications", active: false },
    { icon: User, label: "حسابي", path: "/profile", active: false }
  ];

  const handleRequestClick = (requestId: string) => {
    navigate(`/field-app?requestId=${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-teal-600 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Government Logo */}
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <div className="text-teal-600 font-bold text-sm">وزارة</div>
            </div>
            <div className="text-sm">
              <div>الجمهورية اليمنية</div>
              <div className="opacity-90">وزارة الاشغال العامة والطرق</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4">
          {/* Profile Section */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-teal-100 text-teal-600">
                {currentSurveyor?.name ? currentSurveyor.name.split(' ')[0][0] + currentSurveyor.name.split(' ')[1]?.[0] : "مس"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{currentSurveyor?.name || "المساح"}</h3>
              <p className="text-sm text-gray-600">{currentSurveyor?.title || "مهندس مساحة"}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-right ${
                  item.active ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              مرحباً {currentSurveyor?.name ? currentSurveyor.name.split(' ')[0] : ""}
            </h1>
            <p className="text-gray-600">إليك ملخص أعمال المساحة اليوم</p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {overviewCards.map((card, index) => (
              <Card key={index} className={`${card.bgColor} border-0`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className={`text-2xl font-bold ${card.color}`}>
                        {typeof card.value === 'string' ? card.value : card.value.toLocaleString()}
                      </p>
                    </div>
                    <card.icon className={`h-8 w-8 ${card.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Survey Requests */}
          <Card className="mb-8">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900">طلبات المسح المتاحة</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/requests")}
                  className="text-teal-600 border-teal-200 hover:bg-teal-50"
                >
                  عرض الكل
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {recentRequests.map((request) => {
                    const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || FileText;
                    const priorityColor = priorityConfig[request.priority as keyof typeof priorityConfig]?.color || "bg-gray-500";
                    
                    return (
                      <div 
                        key={request.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleRequestClick(request.id)}
                        data-testid={`request-card-${request.id}`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                            <StatusIcon className="h-6 w-6 text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{request.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-600">{request.requestNumber}</span>
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                              <span className="text-sm text-gray-600">{request.location}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={statusConfig[request.status as keyof typeof statusConfig]?.color}>
                                {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
                              </Badge>
                              <div className={`w-2 h-2 rounded-full ${priorityColor}`}></div>
                              <span className="text-xs text-gray-500">
                                {priorityConfig[request.priority as keyof typeof priorityConfig]?.label || request.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">موعد التسليم</p>
                            <p className="font-medium text-gray-900">
                              {request.dueDate ? new Date(request.dueDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSurvey(request.id);
                            }}
                            className="bg-teal-600 hover:bg-teal-700"
                            data-testid={`start-survey-${request.id}`}
                          >
                            <Compass className="w-4 h-4 mr-2" />
                            ابدأ المسح
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد طلبات مسح متاحة</h3>
                  <p className="text-gray-500">ستظهر طلبات المسح المخصصة لك هنا</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6 text-center">
                <MapPin className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">إدارة الخرائط</h3>
                <p className="text-sm text-gray-600 mb-4">تحميل وإدارة الخرائط المحلية</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => navigate("/maps")}
                >
                  إدارة الخرائط
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6 text-center">
                <Target className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">إدارة الأجهزة</h3>
                <p className="text-sm text-gray-600 mb-4">ربط أجهزة GPS وأدوات القياس</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => navigate("/devices")}
                >
                  إدارة الأجهزة
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6 text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">التقارير</h3>
                <p className="text-sm text-gray-600 mb-4">عرض إحصائيات الأداء والتقارير</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => navigate("/reports")}
                >
                  عرض التقارير
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}