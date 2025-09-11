import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Users, Star, Award, Search, Filter, Plus } from "lucide-react";

interface EngineeringOffice {
  id: string;
  officeName: string;
  licenseNumber: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  governorate: string;
  specializations: string[];
  classification: string;
  status: string;
  rating: number;
  totalProjects: number;
  activeProjects: number;
  createdAt: string;
}

interface Contractor {
  id: string;
  contractorName: string;
  licenseNumber: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  governorate: string;
  specializations: string[];
  classification: string;
  maxProjectValue: number;
  status: string;
  rating: number;
  totalProjects: number;
  activeProjects: number;
  createdAt: string;
}

export default function ProfessionalsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("engineering-offices");

  const { data: engineeringOffices, isLoading: officesLoading } = useQuery<EngineeringOffice[]>({
    queryKey: ["/api/engineering-offices"],
  });

  const { data: contractors, isLoading: contractorsLoading } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "suspended": return "bg-red-500";
      case "rejected": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "معتمد";
      case "pending": return "قيد المراجعة";
      case "suspended": return "موقوف";
      case "rejected": return "مرفوض";
      default: return status;
    }
  };

  const getClassificationText = (classification: string, type: "office" | "contractor") => {
    if (type === "office") {
      switch (classification) {
        case "grade_a": return "الدرجة أ";
        case "grade_b": return "الدرجة ب";
        case "grade_c": return "الدرجة ج";
        default: return classification;
      }
    } else {
      switch (classification) {
        case "grade_1": return "الدرجة الأولى";
        case "grade_2": return "الدرجة الثانية";
        case "grade_3": return "الدرجة الثالثة";
        case "grade_4": return "الدرجة الرابعة";
        case "grade_5": return "الدرجة الخامسة";
        default: return classification;
      }
    }
  };

  const getSpecializationText = (specialization: string) => {
    const translations: Record<string, string> = {
      "architectural": "معماري",
      "structural": "إنشائي",
      "electrical": "كهربائي",
      "mechanical": "ميكانيكي",
      "interior_design": "تصميم داخلي",
      "residential": "سكني",
      "commercial": "تجاري",
      "infrastructure": "بنية تحتية",
      "industrial": "صناعي"
    };
    return translations[specialization] || specialization;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ));
  };

  const filteredOffices = engineeringOffices?.filter(office => {
    const matchesSearch = office.officeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         office.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         office.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || office.status === statusFilter;
    const matchesClassification = classificationFilter === "all" || office.classification === classificationFilter;
    return matchesSearch && matchesStatus && matchesClassification;
  }) || [];

  const filteredContractors = contractors?.filter(contractor => {
    const matchesSearch = contractor.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contractor.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contractor.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || contractor.status === statusFilter;
    const matchesClassification = classificationFilter === "all" || contractor.classification === classificationFilter;
    return matchesSearch && matchesStatus && matchesClassification;
  }) || [];

  return (
    <div className="container mx-auto p-6 space-y-8 rtl" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">إدارة المهنيين</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          نظام إدارة وتصنيف المكاتب الهندسية والمقاولين المعتمدين
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="card-total-offices">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{engineeringOffices?.length || 0}</p>
                <p className="text-gray-600">المكاتب الهندسية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-contractors">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{contractors?.length || 0}</p>
                <p className="text-gray-600">المقاولين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-approved-professionals">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {(engineeringOffices?.filter(o => o.status === "approved").length || 0) + 
                   (contractors?.filter(c => c.status === "approved").length || 0)}
                </p>
                <p className="text-gray-600">المهنيين المعتمدين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-applications">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Filter className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {(engineeringOffices?.filter(o => o.status === "pending").length || 0) + 
                   (contractors?.filter(c => c.status === "pending").length || 0)}
                </p>
                <p className="text-gray-600">طلبات معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="البحث بالاسم أو رقم الرخصة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
                data-testid="input-search-professionals"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>

            <Select value={classificationFilter} onValueChange={setClassificationFilter}>
              <SelectTrigger className="w-48" data-testid="select-classification-filter">
                <SelectValue placeholder="فلترة حسب التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                <SelectItem value="grade_a">الدرجة أ</SelectItem>
                <SelectItem value="grade_b">الدرجة ب</SelectItem>
                <SelectItem value="grade_c">الدرجة ج</SelectItem>
                <SelectItem value="grade_1">الدرجة الأولى</SelectItem>
                <SelectItem value="grade_2">الدرجة الثانية</SelectItem>
                <SelectItem value="grade_3">الدرجة الثالثة</SelectItem>
              </SelectContent>
            </Select>

            <Button data-testid="button-add-professional">
              <Plus className="h-4 w-4 ml-2" />
              إضافة مهني جديد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="engineering-offices" data-testid="tab-engineering-offices">
            المكاتب الهندسية
          </TabsTrigger>
          <TabsTrigger value="contractors" data-testid="tab-contractors">
            المقاولين
          </TabsTrigger>
        </TabsList>

        <TabsContent value="engineering-offices" className="space-y-4">
          {officesLoading ? (
            <div className="text-center py-8">
              <p>جاري تحميل البيانات...</p>
            </div>
          ) : filteredOffices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد مكاتب هندسية تطابق معايير البحث</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOffices.map((office) => (
                <Card key={office.id} className="hover:shadow-md transition-shadow" data-testid={`card-office-${office.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-semibold">{office.officeName}</h3>
                          <Badge className={getStatusColor(office.status)} data-testid={`badge-status-${office.id}`}>
                            {getStatusText(office.status)}
                          </Badge>
                          <Badge variant="outline" data-testid={`badge-classification-${office.id}`}>
                            {getClassificationText(office.classification, "office")}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">المالك:</span> {office.ownerName}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">رقم الرخصة:</span> {office.licenseNumber}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">الهاتف:</span> {office.phone}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">العنوان:</span> {office.address}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm">التقييم:</span>
                              <div className="flex items-center gap-1">
                                {renderStars(office.rating)}
                                <span className="text-sm">({office.rating})</span>
                              </div>
                            </div>
                            <p className="text-sm">
                              <span className="font-medium">المشاريع المكتملة:</span> {office.totalProjects}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">المشاريع النشطة:</span> {office.activeProjects}
                            </p>
                            <div className="text-sm">
                              <span className="font-medium">التخصصات:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {office.specializations.map((spec, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {getSpecializationText(spec)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button size="sm" data-testid={`button-view-office-${office.id}`}>
                          عرض التفاصيل
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-edit-office-${office.id}`}>
                          تعديل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contractors" className="space-y-4">
          {contractorsLoading ? (
            <div className="text-center py-8">
              <p>جاري تحميل البيانات...</p>
            </div>
          ) : filteredContractors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد مقاولين يطابقون معايير البحث</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredContractors.map((contractor) => (
                <Card key={contractor.id} className="hover:shadow-md transition-shadow" data-testid={`card-contractor-${contractor.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-semibold">{contractor.contractorName}</h3>
                          <Badge className={getStatusColor(contractor.status)} data-testid={`badge-status-${contractor.id}`}>
                            {getStatusText(contractor.status)}
                          </Badge>
                          <Badge variant="outline" data-testid={`badge-classification-${contractor.id}`}>
                            {getClassificationText(contractor.classification, "contractor")}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">المالك:</span> {contractor.ownerName}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">رقم الرخصة:</span> {contractor.licenseNumber}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">الهاتف:</span> {contractor.phone}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">العنوان:</span> {contractor.address}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm">التقييم:</span>
                              <div className="flex items-center gap-1">
                                {renderStars(contractor.rating)}
                                <span className="text-sm">({contractor.rating})</span>
                              </div>
                            </div>
                            <p className="text-sm">
                              <span className="font-medium">المشاريع المكتملة:</span> {contractor.totalProjects}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">المشاريع النشطة:</span> {contractor.activeProjects}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">القيمة القصوى للمشروع:</span> {contractor.maxProjectValue?.toLocaleString() || "غير محدد"} ر.ي
                            </p>
                            <div className="text-sm">
                              <span className="font-medium">التخصصات:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {contractor.specializations.map((spec, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {getSpecializationText(spec)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button size="sm" data-testid={`button-view-contractor-${contractor.id}`}>
                          عرض التفاصيل
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-edit-contractor-${contractor.id}`}>
                          تعديل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}