import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText, 
  Users, 
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Eye,
  Edit,
  MessageSquare,
  Calendar,
  MapPin,
  Building2,
  Shield,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Activity
} from "lucide-react";
import { useState } from "react";

export default function SmartEmployeeDashboard() {
  const [activeTab, setActiveTab] = useState("tasks");

  // Mock data للموظف - في التطبيق الحقيقي ستأتي من API
  const employeeInfo = {
    name: "أحمد محمد الفقيه",
    role: "مهندس مراجعة فنية",
    department: "إدارة التراخيص",
    employeeId: "ENG-001",
    avatar: "/api/placeholder/40/40"
  };

  const myTasks = [
    {
      id: "#2024-001",
      type: "مراجعة فنية",
      title: "رخصة بناء منزل سكني",
      location: "حي الزهراء، صنعاء",
      applicant: "محمد أحمد علي",
      priority: "عالية",
      dueDate: "2025-01-28",
      status: "جديد",
      estimatedTime: "2 ساعة",
      receivedDate: "2025-01-27"
    },
    {
      id: "#2024-002",
      type: "تفتيش ميداني",
      title: "فحص أعمال البناء",
      location: "شارع الستين، صنعاء", 
      applicant: "شركة النور للمقاولات",
      priority: "متوسطة",
      dueDate: "2025-01-29",
      status: "قيد التنفيذ",
      estimatedTime: "4 ساعات",
      receivedDate: "2025-01-25"
    },
    {
      id: "#2024-003",
      type: "مراجعة مستندات",
      title: "تحديث بيانات رخصة",
      location: "حي السبعين، صنعاء",
      applicant: "سارة أحمد محمد",
      priority: "منخفضة",
      dueDate: "2025-01-30",
      status: "في انتظار المستندات",
      estimatedTime: "1 ساعة",
      receivedDate: "2025-01-26"
    }
  ];

  const personalKPIs = {
    tasksCompleted: 47,
    averageTime: "3.2 ساعة",
    onTimeCompletion: 94,
    customerSatisfaction: 4.8,
    weeklyTarget: 50,
    monthlyTarget: 200
  };

  const notifications = [
    {
      id: 1,
      type: "new_task",
      message: "تم إسناد مهمة مراجعة جديدة رقم #2024-001",
      timestamp: "منذ 15 دقيقة",
      priority: "high"
    },
    {
      id: 2,
      type: "overdue",
      message: "المهمة #2024-002 تجاوزت الموعد المحدد",
      timestamp: "منذ ساعة",
      priority: "urgent"
    },
    {
      id: 3,
      type: "update",
      message: "تم تحديث بيانات المهمة #2024-003",
      timestamp: "منذ 3 ساعات",
      priority: "normal"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "عالية": return "text-red-600 bg-red-50 border-red-200";
      case "متوسطة": return "text-orange-600 bg-orange-50 border-orange-200";
      case "منخفضة": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "جديد": return "bg-blue-100 text-blue-800";
      case "قيد التنفيذ": return "bg-orange-100 text-orange-800";
      case "مكتمل": return "bg-green-100 text-green-800";
      case "في انتظار المستندات": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">لوحة تحكم الموظف</h1>
                <p className="text-sm text-gray-600">أهلاً وسهلاً، {employeeInfo.name}</p>
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
        {/* Employee Info & Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="md:col-span-1">
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <h3 className="font-semibold text-gray-900">{employeeInfo.name}</h3>
              <p className="text-sm text-gray-600">{employeeInfo.role}</p>
              <Badge variant="outline" className="mt-2">{employeeInfo.employeeId}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{personalKPIs.tasksCompleted}</p>
                  <p className="text-sm text-gray-600">مهمة مكتملة هذا الأسبوع</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{personalKPIs.averageTime}</p>
                  <p className="text-sm text-gray-600">متوسط وقت الإنجاز</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{personalKPIs.onTimeCompletion}%</p>
                  <p className="text-sm text-gray-600">إنجاز في الوقت المحدد</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tasks">مهامي</TabsTrigger>
                <TabsTrigger value="performance">الأداء</TabsTrigger>
                <TabsTrigger value="calendar">التقويم</TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      قائمة مهامي
                    </CardTitle>
                    <CardDescription>
                      مهامك مرتبة حسب الأولوية وتاريخ الاستحقاق
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {myTasks.map((task) => (
                      <Card key={task.id} className={`border-r-4 ${
                        task.priority === "عالية" ? "border-r-red-500" :
                        task.priority === "متوسطة" ? "border-r-orange-500" : "border-r-green-500"
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                <Badge variant="outline" className="text-xs">{task.id}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{task.type}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="h-3 w-3" />
                                <span>{task.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="h-3 w-3" />
                                <span>{task.applicant}</span>
                              </div>
                            </div>
                            
                            <div className="text-left space-y-2">
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge variant="secondary" className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="block">موعد الإنجاز:</span>
                              <span className="font-medium">{task.dueDate}</span>
                            </div>
                            <div>
                              <span className="block">الوقت المقدر:</span>
                              <span className="font-medium">{task.estimatedTime}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1">
                              <Eye className="h-3 w-3 ml-1" />
                              عرض التفاصيل
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3 ml-1" />
                              تحديث الحالة
                            </Button>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-3 w-3 ml-1" />
                              تعليق
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      مؤشرات الأداء الشخصية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">التقدم نحو الهدف الأسبوعي</span>
                          <span className="text-sm text-gray-600">{personalKPIs.tasksCompleted}/{personalKPIs.weeklyTarget}</span>
                        </div>
                        <Progress value={(personalKPIs.tasksCompleted / personalKPIs.weeklyTarget) * 100} className="h-3" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">نسبة الإنجاز في الوقت المحدد</span>
                          <span className="text-sm text-gray-600">{personalKPIs.onTimeCompletion}%</span>
                        </div>
                        <Progress value={personalKPIs.onTimeCompletion} className="h-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-900">{personalKPIs.customerSatisfaction}</p>
                        <p className="text-sm text-blue-700">تقييم المواطنين</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-900">{personalKPIs.averageTime}</p>
                        <p className="text-sm text-green-700">متوسط الإنجاز</p>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-purple-900">A+</p>
                        <p className="text-sm text-purple-700">التقييم العام</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      تقويم المهام
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>سيتم تطوير عرض التقويم قريباً</p>
                      <p className="text-sm">لعرض المهام والمواعيد بشكل تفاعلي</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  التنبيهات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-lg border ${
                      notification.priority === "urgent" ? "bg-red-50 border-red-200" :
                      notification.priority === "high" ? "bg-orange-50 border-orange-200" :
                      "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{notification.timestamp}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <FileText className="h-4 w-4 ml-2" />
                  إنشاء تقرير
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="h-4 w-4 ml-2" />
                  جدولة تفتيش
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="h-4 w-4 ml-2" />
                  تواصل مع المواطن
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <BarChart3 className="h-4 w-4 ml-2" />
                  عرض الإحصائيات
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}