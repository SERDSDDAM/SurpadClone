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
  Settings
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface ProjectRequest {
  id: string;
  title: string;
  code: string;
  status: "completed" | "pending" | "rejected";
  priority: "high" | "medium" | "low";
  dueDate: string;
  location: string;
}

const statusConfig = {
  completed: {
    label: "مكتمل",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  },
  pending: {
    label: "معلق", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock
  },
  rejected: {
    label: "مرفوض",
    color: "bg-red-100 text-red-800 border-red-200", 
    icon: AlertCircle
  }
};

const priorityConfig = {
  high: { label: "عالية", color: "bg-red-500" },
  medium: { label: "متوسطة", color: "bg-yellow-500" },
  low: { label: "منخفضة", color: "bg-green-500" }
};

export default function SurveyorDashboard() {
  const [, navigate] = useLocation();
  
  // Mock data for demonstration
  const surveyorData = {
    name: "Eng Rassam",
    avatar: null,
    activeDays: 33,
    totalPoints: 30,
    completedProjects: 3,
    status: "متاح"
  };

  const recentRequests: ProjectRequest[] = [
    {
      id: "BP-2024-001",
      title: "طلب رخصة بناء",
      code: "BP-2024-001",
      status: "completed",
      priority: "high",
      dueDate: "2024-01-15",
      location: "صنعاء - حي الصافية"
    },
    {
      id: "BP-2024-002", 
      title: "طلب رخصة بناء",
      code: "BP-2024-002",
      status: "pending",
      priority: "medium",
      dueDate: "2024-01-20",
      location: "صنعاء - شارع الزراعة"
    },
    {
      id: "BP-2024-003",
      title: "طلب رخصة بناء", 
      code: "BP-2024-003",
      status: "rejected",
      priority: "low",
      dueDate: "2024-01-18",
      location: "صنعاء - حدة"
    }
  ];

  const navigationItems = [
    { icon: Home, label: "الرئيسية", path: "/dashboard", active: true },
    { icon: FileText, label: "الخدمات", path: "/services", active: false },
    { icon: FolderOpen, label: "المشاريع", path: "/projects", active: false },
    { icon: Bell, label: "الاشعارات", path: "/notifications", active: false },
    { icon: User, label: "حسابي", path: "/profile", active: false }
  ];

  const handleRequestClick = (requestId: string) => {
    navigate(`/clean-field-app?requestId=${requestId}`);
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

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Profile Card */}
        <Card className="bg-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full absolute -top-1 -left-1 z-10"></div>
                  <Avatar className="w-16 h-16 border-2 border-white">
                    <AvatarImage src={surveyorData.avatar || undefined} />
                    <AvatarFallback className="bg-teal-700 text-white text-lg">
                      {surveyorData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{surveyorData.name}</h2>
                  <p className="text-teal-100">{surveyorData.activeDays} أيام</p>
                </div>
              </div>
              
              <Badge variant="secondary" className="bg-white text-teal-600">
                {surveyorData.status}
              </Badge>
            </div>
            
            {/* Statistics */}
            <div className="flex items-center justify-center mt-6 pt-6 border-t border-teal-500">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold">{surveyorData.totalPoints}</div>
                  <div className="text-teal-100 text-sm">إجمالي النقاط</div>
                </div>
                <div className="border-r border-teal-500 pl-8">
                  <div className="text-2xl font-bold">{surveyorData.completedProjects}</div>
                  <div className="text-teal-100 text-sm">المشاريع المكتملة</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">الإجراءات الأخيرة</h3>
            <Button variant="ghost" size="sm" className="text-teal-600">
              عرض الكل
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentRequests.map((request) => {
              const StatusIcon = statusConfig[request.status].icon;
              
              return (
                <Card 
                  key={request.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRequestClick(request.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge 
                              variant="outline" 
                              className={`${statusConfig[request.status].color} border text-xs`}
                            >
                              {statusConfig[request.status].label}
                            </Badge>
                          </div>
                          
                          <div className={`w-2 h-2 rounded-full ${priorityConfig[request.priority].color}`} />
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mt-2">{request.title}</h4>
                        <p className="text-sm text-gray-600">{request.code}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(request.dueDate).toLocaleDateString('ar')}
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="text-teal-600">
                        <Target className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-teal-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">85%</div>
              <div className="text-sm text-gray-600">معدل الإنجاز</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">2</div>
              <div className="text-sm text-gray-600">طلبات معلقة</div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                  item.active 
                    ? 'text-teal-600 bg-teal-50' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}>
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}