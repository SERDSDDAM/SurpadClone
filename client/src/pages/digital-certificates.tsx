import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  Key,
  Smartphone,
  Mail,
  Bell,
  Stamp,
  QrCode,
  Share2,
  Building2,
  User,
  MapPin,
  Calendar,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Digital Certificate Template Component
function CertificateTemplate({ certificate, isPreview = false }: { certificate: any; isPreview?: boolean }) {
  return (
    <div className={`bg-white ${isPreview ? 'p-4' : 'p-8'} border-2 border-primary rounded-lg font-arabic`}>
      {/* Header */}
      <div className="text-center border-b-2 border-primary pb-6 mb-6">
        <div className="flex justify-center items-center mb-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">الجمهورية اليمنية</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">أمانة العاصمة صنعاء</h2>
        <h3 className="text-lg text-gray-700">إدارة التراخيص والتخطيط العمراني</h3>
      </div>

      {/* Certificate Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary mb-4">شهادة إشغال</h2>
        <div className="bg-gray-100 p-3 rounded-lg inline-block">
          <p className="text-lg font-semibold">رقم الشهادة: {certificate.certificateNumber}</p>
        </div>
      </div>

      {/* Certificate Content */}
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">اسم المشروع:</label>
              <p className="font-semibold">{certificate.projectName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">المالك:</label>
              <p className="font-semibold">{certificate.applicantName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">الموقع:</label>
              <p className="font-semibold">{certificate.location}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">المديرية:</label>
              <p className="font-semibold">{certificate.district}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">نوع المبنى:</label>
              <p className="font-semibold">{certificate.buildingType}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">عدد الطوابق:</label>
              <p className="font-semibold">{certificate.totalFloors}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">مساحة البناء:</label>
              <p className="font-semibold">{certificate.buildingArea} م²</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">تاريخ الإصدار:</label>
              <p className="font-semibold">{new Date(certificate.issuedDate).toLocaleDateString('ar-YE')}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-center text-gray-700 leading-relaxed">
            تشهد هذه الشهادة بأن المبنى المذكور أعلاه قد تم فحصه ووجد مطابقاً لجميع المواصفات والمعايير المطلوبة
            ويصرح بإشغاله للغرض المحدد في رخصة البناء رقم ({certificate.buildingPermitId})
          </p>
        </div>
      </div>

      {/* Digital Signature Section */}
      <div className="border-t-2 border-gray-200 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-green-50 p-4 rounded-lg mb-3">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">توقيع إلكتروني معتمد</p>
            </div>
            <p className="text-sm text-gray-600">م. {certificate.issuedBy}</p>
            <p className="text-xs text-gray-500">مدير إدارة التراخيص</p>
          </div>

          <div className="text-center">
            <div className="bg-blue-50 p-4 rounded-lg mb-3">
              <QrCode className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-800">رمز التحقق</p>
            </div>
            <div className="bg-white border-2 border-gray-300 p-2 inline-block">
              {/* QR Code placeholder */}
              <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                <QrCode className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-purple-50 p-4 rounded-lg mb-3">
              <Key className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-800">التوقيت الرقمي</p>
            </div>
            <p className="text-sm text-gray-600">{new Date(certificate.issuedDate).toLocaleDateString('ar-YE')}</p>
            <p className="text-xs text-gray-500">معتمد رقمياً</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          هذه الشهادة صادرة رقمياً من منصة "بنّاء اليمن" ومعتمدة بالتوقيع الإلكتروني
        </p>
        <p className="text-xs text-gray-400 mt-1">
          للتحقق من صحة الشهادة، ادخل على الموقع الرسمي وأدخل رقم الشهادة
        </p>
      </div>
    </div>
  );
}

// Notification System Component
function NotificationSystem({ certificate }: { certificate: any }) {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    utilities: true,
    government: true,
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (type: string) => {
      return apiRequest(`/api/occupancy-certificates/${certificate.id}/notify`, {
        method: "POST",
        body: JSON.stringify({ type, settings: notificationSettings }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الإشعار",
        description: "تم إرسال الإشعار بنجاح",
      });
    },
  });

  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="ml-2 h-5 w-5" />
          نظام الإشعارات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => sendNotificationMutation.mutate("email")}
            disabled={sendNotificationMutation.isPending}
            className="flex items-center justify-center"
          >
            <Mail className="ml-2 h-4 w-4" />
            إشعار بريد إلكتروني
          </Button>

          <Button
            onClick={() => sendNotificationMutation.mutate("sms")}
            disabled={sendNotificationMutation.isPending}
            variant="outline"
            className="flex items-center justify-center"
          >
            <Smartphone className="ml-2 h-4 w-4" />
            إشعار رسالة نصية
          </Button>

          <Button
            onClick={() => sendNotificationMutation.mutate("utilities")}
            disabled={sendNotificationMutation.isPending}
            variant="outline"
            className="flex items-center justify-center"
          >
            <Zap className="ml-2 h-4 w-4" />
            إشعار شركات المرافق
          </Button>

          <Button
            onClick={() => sendNotificationMutation.mutate("government")}
            disabled={sendNotificationMutation.isPending}
            variant="outline"
            className="flex items-center justify-center"
          >
            <Shield className="ml-2 h-4 w-4" />
            إشعار الجهات الحكومية
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">سجل الإشعارات:</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                <span className="text-sm">تم إرسال إشعار بالبريد الإلكتروني</span>
              </div>
              <span className="text-xs text-gray-500">{new Date().toLocaleDateString('ar-YE')}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-600 ml-2" />
                <span className="text-sm">تم إرسال إشعار للمرافق العامة</span>
              </div>
              <span className="text-xs text-gray-500">{new Date().toLocaleDateString('ar-YE')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DigitalCertificates() {
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSigningOpen, setIsSigningOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch occupancy certificates
  const { data: certificates = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/occupancy-certificates"],
  });

  // Digital signature mutation
  const digitalSignMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      return apiRequest(`/api/occupancy-certificates/${certificateId}/sign`, {
        method: "POST",
        body: JSON.stringify({
          signatureType: "digital",
          signedBy: "م. عبدالله الصالح",
          signatureTimestamp: new Date().toISOString(),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم التوقيع الإلكتروني",
        description: "تم توقيع الشهادة رقمياً بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/occupancy-certificates"] });
      setIsSigningOpen(false);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issued": return <Badge className="bg-green-100 text-green-800">صادرة</Badge>;
      case "pending_signature": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">في انتظار التوقيع</Badge>;
      case "signed": return <Badge className="bg-blue-100 text-blue-800">موقعة</Badge>;
      case "delivered": return <Badge className="bg-purple-100 text-purple-800">مُسلمة</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="ml-2 h-8 w-8 text-primary" />
            الشهادات الرقمية والتوقيع الإلكتروني
          </h1>
          <p className="text-gray-600 mt-1">إدارة الشهادات الرقمية والتوقيع الإلكتروني ونظام الإشعارات</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الشهادات</p>
                <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">موقعة رقمياً</p>
                <p className="text-2xl font-bold text-green-600">
                  {certificates.filter(c => c.status === "signed").length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">في انتظار التوقيع</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {certificates.filter(c => c.status === "pending_signature").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مُسلمة</p>
                <p className="text-2xl font-bold text-blue-600">
                  {certificates.filter(c => c.status === "delivered").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {certificates.map((certificate) => (
          <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{certificate.projectName}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{certificate.certificateNumber}</p>
                </div>
                {getStatusBadge(certificate.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="ml-2 h-4 w-4" />
                  <span>{certificate.applicantName}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="ml-2 h-4 w-4" />
                  <span>{certificate.location}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="ml-2 h-4 w-4" />
                  <span>تاريخ الإصدار: {certificate.issuedDate ? new Date(certificate.issuedDate).toLocaleDateString('ar-YE') : 'لم يتم الإصدار'}</span>
                </div>

                {certificate.status === "signed" && (
                  <div className="flex items-center text-sm text-green-600">
                    <Shield className="ml-2 h-4 w-4" />
                    <span>موقعة رقمياً من: {certificate.issuedBy}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <div className="flex space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCertificate(certificate);
                      setIsPreviewOpen(true);
                    }}
                    data-testid={`button-preview-${certificate.id}`}
                  >
                    <Eye className="ml-1 h-3 w-3" />
                    معاينة
                  </Button>

                  {certificate.status === "signed" && (
                    <Button
                      size="sm"
                      data-testid={`button-download-${certificate.id}`}
                    >
                      <Download className="ml-1 h-3 w-3" />
                      تحميل PDF
                    </Button>
                  )}
                </div>

                <div className="flex space-x-2 space-x-reverse">
                  {certificate.status === "pending_signature" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedCertificate(certificate);
                        setIsSigningOpen(true);
                      }}
                      data-testid={`button-sign-${certificate.id}`}
                    >
                      <Stamp className="ml-1 h-3 w-3" />
                      توقيع رقمي
                    </Button>
                  )}

                  {certificate.status === "signed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-share-${certificate.id}`}
                    >
                      <Share2 className="ml-1 h-3 w-3" />
                      مشاركة
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Certificate Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة الشهادة الرقمية</DialogTitle>
          </DialogHeader>
          
          {selectedCertificate && (
            <div className="space-y-6">
              <CertificateTemplate certificate={selectedCertificate} isPreview={true} />
              
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  إغلاق
                </Button>
                <Button>
                  <Download className="ml-2 h-4 w-4" />
                  تحميل PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Digital Signing Dialog */}
      <Dialog open={isSigningOpen} onOpenChange={setIsSigningOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>التوقيع الإلكتروني</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-3">
                <Shield className="h-6 w-6 text-blue-600 ml-2" />
                <h4 className="font-medium text-blue-900">التوقيع الرقمي الآمن</h4>
              </div>
              <p className="text-sm text-blue-800">
                سيتم توقيع الشهادة رقمياً باستخدام التشفير المتقدم وفقاً للمعايير الدولية
              </p>
            </div>

            {selectedCertificate && (
              <div className="space-y-2">
                <p className="text-sm"><strong>رقم الشهادة:</strong> {selectedCertificate.certificateNumber}</p>
                <p className="text-sm"><strong>اسم المشروع:</strong> {selectedCertificate.projectName}</p>
                <p className="text-sm"><strong>الموقع بواسطة:</strong> م. عبدالله الصالح</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setIsSigningOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={() => digitalSignMutation.mutate(selectedCertificate?.id)}
                disabled={digitalSignMutation.isPending}
              >
                <Key className="ml-2 h-4 w-4" />
                {digitalSignMutation.isPending ? "جاري التوقيع..." : "توقيع رقمي"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification System for Selected Certificate */}
      {selectedCertificate && selectedCertificate.status === "signed" && (
        <NotificationSystem certificate={selectedCertificate} />
      )}
    </div>
  );
}