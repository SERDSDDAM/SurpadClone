import { useQuery } from "@tanstack/react-query";
import { FileText, MapPin, Eye, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { SurveyRequest } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/survey-requests"],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { variant: "default" as const, text: "مقدم", color: "bg-blue-100 text-blue-800" },
      under_review: { variant: "secondary" as const, text: "قيد المراجعة", color: "bg-yellow-100 text-yellow-800" },
      surveying: { variant: "default" as const, text: "قيد المساحة", color: "bg-green-100 text-green-800" },
      completed: { variant: "default" as const, text: "مكتمل", color: "bg-purple-100 text-purple-800" },
      approved: { variant: "default" as const, text: "معتمد", color: "bg-green-100 text-green-800" },
      rejected: { variant: "destructive" as const, text: "مرفوض", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  if (statsLoading || requestsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم الرئيسية</h1>
        <p className="text-gray-600">نظرة عامة على جميع الطلبات والأنشطة المساحية</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="الطلبات الجديدة"
          value={stats?.newRequests || 0}
          icon={<FileText />}
          gradient="from-blue-500 to-blue-600"
        />
        <StatsCard
          title="قيد المساحة"
          value={stats?.inProgress || 0}
          icon={<MapPin />}
          gradient="from-green-500 to-green-600"
        />
        <StatsCard
          title="قيد المراجعة"
          value={stats?.underReview || 0}
          icon={<Eye />}
          gradient="from-orange-500 to-orange-600"
        />
        <StatsCard
          title="مكتملة"
          value={stats?.completed || 0}
          icon={<CheckCircle />}
          gradient="from-purple-500 to-purple-600"
        />
      </div>

      {/* Recent Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" />
            الطلبات الحديثة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الطلب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم المالك
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنطقة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المساح المعين
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests?.map((request: SurveyRequest) => (
                  <tr key={request.id} className="hover:bg-gray-50" data-testid={`request-row-${request.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                      {request.requestNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.ownerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.region}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.assignedSurveyor || "غير محدد"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        <Button variant="ghost" size="sm" data-testid={`view-request-${request.id}`}>
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {(!requests || requests.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      لا توجد طلبات حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
