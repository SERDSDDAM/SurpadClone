import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Upload,
  Download,
  Eye,
  Edit,
  CreditCard,
  Phone,
  Mail,
  Building2,
  ArrowLeft,
  Bell,
  Share2,
  Printer,
  Star,
  ThumbsUp,
  Flag
} from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function UnifiedRequestDetails() {
  const [activeTab, setActiveTab] = useState("timeline");
  const [newMessage, setNewMessage] = useState("");

  // Mock data للطلب - في التطبيق الحقيقي ستأتي من API
  const requestData = {
    id: "#2024-001",
    type: "رخصة بناء",
    title: "رخصة بناء منزل سكني",
    applicant: {
      name: "محمد أحمد علي",
      nationalId: "123456789",
      phone: "+967-777-123456",
      email: "m.ahmed@email.com",
      address: "حي الزهراء، شارع الجامعة، صنعاء"
    },
    property: {
      location: "حي الزهراء، صنعاء",
      area: "500 متر مربع",
      coordinates: "15.3694° N, 44.1910° E",
      landType: "سكني",
      buildingType: "منزل عائلي"
    },
    status: "قيد المراجعة الفنية",
    priority: "عادية",
    progress: 65,
    submittedDate: "2025-01-15",
    estimatedCompletion: "2025-02-15",
    assignedOfficer: "المهندس أحمد محمد الفقيه",
    fees: {
      totalAmount: 50000,
      paidAmount: 25000,
      remainingAmount: 25000,
      currency: "ريال يمني"
    }
  };

  const timeline = [
    {
      id: 1,
      title: "تم استلام الطلب",
      description: "تم تسجيل طلب رخصة البناء في النظام",
      date: "2025-01-15 09:00",
      status: "completed",
      user: "النظام الآلي",
      icon: CheckCircle
    },
    {
      id: 2,
      title: "دفع الرسوم الأولية",
      description: "تم سداد 50% من رسوم رخصة البناء",
      date: "2025-01-15 14:30",
      status: "completed",
      user: "محمد أحمد علي",
      icon: CreditCard
    },
    {
      id: 3,
      title: "بدء المراجعة الفنية",
      description: "تم إسناد الطلب للمهندس المختص للمراجعة",
      date: "2025-01-17 10:00",
      status: "completed",
      user: "إدارة التراخيص",
      icon: FileText
    },
    {
      id: 4,
      title: "طلب مستندات إضافية",
      description: "مطلوب رفع نسخة محدثة من صك الملكية",
      date: "2025-01-20 11:30",
      status: "pending",
      user: "المهندس أحمد محمد",
      icon: Upload
    },
    {
      id: 5,
      title: "التفتيش الميداني",
      description: "جدولة زيارة موقع للتفتيش الفني",
      date: "2025-01-30 09:00",
      status: "upcoming",
      user: "قسم التفتيش",
      icon: MapPin
    },
    {
      id: 6,
      title: "إصدار الرخصة",
      description: "إصدار رخصة البناء النهائية",
      date: "2025-02-15 12:00",
      status: "upcoming",
      user: "مدير الإدارة",
      icon: CheckCircle
    }
  ];

  const documents = [
    {
      id: 1,
      name: "صك الملكية",
      type: "PDF",
      size: "2.3 MB",
      uploadDate: "2025-01-15",
      status: "مقبول",
      required: true
    },
    {
      id: 2,
      name: "المخططات الهندسية",
      type: "PDF",
      size: "5.1 MB",
      uploadDate: "2025-01-15",
      status: "قيد المراجعة",
      required: true
    },
    {
      id: 3,
      name: "نسخة الهوية الوطنية",
      type: "PDF",
      size: "1.2 MB",
      uploadDate: "2025-01-15",
      status: "مقبول",
      required: true
    },
    {
      id: 4,
      name: "تقرير التربة",
      type: "PDF",
      size: "3.8 MB",
      uploadDate: "",
      status: "مطلوب",
      required: true
    }
  ];

  const messages = [
    {
      id: 1,
      sender: "المهندس أحمد محمد",
      message: "تم مراجعة المخططات الأولية. هناك بعض الملاحظات البسيطة التي تحتاج تعديل في الواجهة الأمامية.",
      timestamp: "2025-01-20 14:30",
      type: "official"
    },
    {
      id: 2,
      sender: "محمد أحمد علي",
      message: "شكراً لكم. هل يمكن توضيح التعديلات المطلوبة بالتفصيل؟",
      timestamp: "2025-01-20 15:45",
      type: "applicant"
    },
    {
      id: 3,
      sender: "المهندس أحمد محمد",
      message: "بخصوص النوافذ في الطابق الأول، يجب أن تكون المسافة من حدود الأرض لا تقل عن 3 أمتار وفقاً للائحة البناء.",
      timestamp: "2025-01-21 09:00",
      type: "official"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100";
      case "pending": return "text-orange-600 bg-orange-100";
      case "upcoming": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "pending": return Clock;
      case "upcoming": return Calendar;
      default: return AlertCircle;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case "مقبول": return "text-green-600 bg-green-100";
      case "قيد المراجعة": return "text-orange-600 bg-orange-100";
      case "مرفوض": return "text-red-600 bg-red-100";
      case "مطلوب": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      // هنا سيتم إرسال الرسالة عبر API
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">تفاصيل الطلب {requestData.id}</h1>
                <p className="text-sm text-gray-600">{requestData.type} - {requestData.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 ml-1" />
                مشاركة
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 ml-1" />
                طباعة
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 ml-1" />
                تنبيهات
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Badge className={getStatusColor("pending")}>{requestData.status}</Badge>
              <p className="text-sm text-gray-600 mt-2">الحالة الحالية</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{requestData.progress}%</p>
              <p className="text-sm text-gray-600">نسبة الإنجاز</p>
              <Progress value={requestData.progress} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">15</p>
              <p className="text-sm text-gray-600">أيام متبقية</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-900">{requestData.fees.remainingAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">ريال متبقي للدفع</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="timeline">الخط الزمني</TabsTrigger>
                <TabsTrigger value="documents">المستندات</TabsTrigger>
                <TabsTrigger value="communication">التواصل</TabsTrigger>
                <TabsTrigger value="details">التفاصيل</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      الخط الزمني للمعاملة
                    </CardTitle>
                    <CardDescription>
                      تتبع مراحل معالجة طلبك خطوة بخطوة
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timeline.map((step, index) => {
                        const StatusIcon = getStatusIcon(step.status);
                        return (
                          <div key={step.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                step.status === "completed" ? "bg-green-100" :
                                step.status === "pending" ? "bg-orange-100" :
                                "bg-blue-100"
                              }`}>
                                <StatusIcon className={`h-5 w-5 ${
                                  step.status === "completed" ? "text-green-600" :
                                  step.status === "pending" ? "text-orange-600" :
                                  "text-blue-600"
                                }`} />
                              </div>
                              {index < timeline.length - 1 && (
                                <div className={`w-px h-8 ${
                                  step.status === "completed" ? "bg-green-200" : "bg-gray-200"
                                }`}></div>
                              )}
                            </div>
                            
                            <div className="flex-1 pb-4">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-semibold text-gray-900">{step.title}</h4>
                                <Badge variant="outline" className={getStatusColor(step.status)}>
                                  {step.status === "completed" ? "مكتمل" :
                                   step.status === "pending" ? "قيد التنفيذ" : "قادم"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{step.date}</span>
                                <span>بواسطة: {step.user}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-green-600" />
                          المستندات والملفات
                        </CardTitle>
                        <CardDescription>
                          جميع المستندات المطلوبة والمرفوعة
                        </CardDescription>
                      </div>
                      <Button className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        رفع مستند
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <Card key={doc.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{doc.name}</h4>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{doc.type}</span>
                                    {doc.size && <span>• {doc.size}</span>}
                                    {doc.uploadDate && <span>• رفع في {doc.uploadDate}</span>}
                                  </div>
                                  {doc.required && (
                                    <Badge variant="outline" className="text-xs mt-1">مطلوب</Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge className={getDocumentStatusColor(doc.status)}>
                                  {doc.status}
                                </Badge>
                                <div className="flex gap-1">
                                  {doc.uploadDate && (
                                    <>
                                      <Button size="sm" variant="outline">
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="outline">
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                  {doc.status === "مطلوب" && (
                                    <Button size="sm">
                                      <Upload className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                      التواصل والتعليقات
                    </CardTitle>
                    <CardDescription>
                      تواصل مع الموظف المختص حول طلبك
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messages.map((message) => (
                        <div key={message.id} className={`flex ${
                          message.type === "applicant" ? "justify-start" : "justify-end"
                        }`}>
                          <div className={`max-w-[70%] p-3 rounded-lg ${
                            message.type === "applicant" 
                              ? "bg-blue-100 text-blue-900" 
                              : "bg-gray-100 text-gray-900"
                          }`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm">{message.sender}</span>
                              <span className="text-xs opacity-70">{message.timestamp}</span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="اكتب رسالتك هنا..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <Button onClick={sendMessage} className="self-end">
                          إرسال
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-6">
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>تفاصيل الطلب</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">نوع الطلب</label>
                        <p className="font-medium">{requestData.type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">الأولوية</label>
                        <p className="font-medium">{requestData.priority}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">تاريخ التقديم</label>
                        <p className="font-medium">{requestData.submittedDate}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">الإنجاز المتوقع</label>
                        <p className="font-medium">{requestData.estimatedCompletion}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>تفاصيل العقار</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">الموقع</label>
                        <p className="font-medium">{requestData.property.location}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">المساحة</label>
                        <p className="font-medium">{requestData.property.area}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">نوع الأرض</label>
                        <p className="font-medium">{requestData.property.landType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">نوع البناء</label>
                        <p className="font-medium">{requestData.property.buildingType}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">الموظف المختص</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{requestData.assignedOfficer}</p>
                    <p className="text-xs text-gray-600">مهندس مراجعة فنية</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 ml-2" />
                    إرسال رسالة
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Phone className="h-4 w-4 ml-2" />
                    اتصال هاتفي
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">الرسوم والدفعات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">المبلغ الإجمالي:</span>
                  <span className="font-medium">{requestData.fees.totalAmount.toLocaleString()} ريال</span>
                  
                  <span className="text-gray-600">المدفوع:</span>
                  <span className="font-medium text-green-600">{requestData.fees.paidAmount.toLocaleString()} ريال</span>
                  
                  <span className="text-gray-600">المتبقي:</span>
                  <span className="font-medium text-orange-600">{requestData.fees.remainingAmount.toLocaleString()} ريال</span>
                </div>
                
                {requestData.fees.remainingAmount > 0 && (
                  <Button className="w-full" size="sm">
                    <CreditCard className="h-4 w-4 ml-2" />
                    دفع المبلغ المتبقي
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Flag className="h-4 w-4 ml-2" />
                  الإبلاغ عن مشكلة
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Star className="h-4 w-4 ml-2" />
                  تقييم الخدمة
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 ml-2" />
                  طلب موعد
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}