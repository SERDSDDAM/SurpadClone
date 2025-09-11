import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Database, Map, MapPin, Building2, Route, Users, FileText, Plus, Search, Edit, Trash2, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GISStatistics {
  total: {
    governorates: number;
    districts: number;
    subDistricts: number;
    sectors: number;
    neighborhoodUnits: number;
    blocks: number;
    streets: number;
  };
  coverage: {
    withGeometry: number;
    totalRecords: number;
    percentage: number;
  };
  lastUpdated: string;
}

interface Governorate {
  id: number;
  nameAr: string;
  nameEn: string;
  code: string;
  capitalCity: string;
  population: number;
  area: number;
  governor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface District {
  id: number;
  governorateId: number;
  nameAr: string;
  nameEn: string;
  code: string;
  population: number;
  area: number;
  director: string;
  urbanPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function GISDataManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching queries
  const { data: statistics, isLoading: statisticsLoading } = useQuery<GISStatistics>({
    queryKey: ["/api/gis/statistics"],
  });

  const { data: governorates, isLoading: governoratesLoading } = useQuery<{ governorates: Governorate[]; total: number }>({
    queryKey: ["/api/gis/governorates"],
  });

  const { data: districts, isLoading: districtsLoading } = useQuery<{ districts: District[]; total: number }>({
    queryKey: ["/api/gis/districts", selectedGovernorate],
    enabled: !!selectedGovernorate,
  });

  // File upload mutations
  const uploadMutation = useMutation({
    mutationFn: async ({ file, dataType, options }: { file: File; dataType: string; options?: any }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', dataType);
      if (options) {
        formData.append('options', JSON.stringify(options));
      }
      
      return apiRequest("/api/gis/upload", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "تم الرفع بنجاح",
        description: "تم رفع البيانات الجغرافية وحفظها في قاعدة البيانات",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gis/statistics"] });
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast({
        title: "خطأ في الرفع",
        description: "فشل في رفع البيانات. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, dataType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.json', '.geojson', '.shp', '.zip'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: "يرجى اختيار ملف JSON, GeoJSON, Shapefile أو ZIP",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(25);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    uploadMutation.mutate({ file, dataType });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                إدارة البيانات الجغرافية
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                نظام إدارة شامل للهيكل الجغرافي الإداري لليمن مع إمكانيات رفع ومعالجة البيانات المكانية
              </p>
            </div>
            <div className="flex space-x-3 space-x-reverse">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                تصدير البيانات
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة منطقة جديدة
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        {!statisticsLoading && statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">المحافظات</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.total.governorates}</p>
                  </div>
                  <Map className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">المديريات</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.total.districts}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">العزل</p>
                    <p className="text-2xl font-bold text-purple-600">{statistics.total.subDistricts}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">القطاعات</p>
                    <p className="text-2xl font-bold text-orange-600">{statistics.total.sectors}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">وحدات الجوار</p>
                    <p className="text-2xl font-bold text-teal-600">{statistics.total.neighborhoodUnits}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-teal-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">البلوكات</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.total.blocks}</p>
                  </div>
                  <Database className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">الشوارع</p>
                    <p className="text-2xl font-bold text-indigo-600">{statistics.total.streets}</p>
                  </div>
                  <Route className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">التغطية</p>
                    <p className="text-2xl font-bold text-emerald-600">{statistics.coverage.percentage}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="upload">رفع البيانات</TabsTrigger>
            <TabsTrigger value="governorates">المحافظات</TabsTrigger>
            <TabsTrigger value="districts">المديريات</TabsTrigger>
            <TabsTrigger value="streets">الشوارع</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    حالة قاعدة البيانات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>التغطية الجغرافية</span>
                      <span>{statistics?.coverage.percentage}%</span>
                    </div>
                    <Progress value={statistics?.coverage.percentage || 0} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">سجلات مع بيانات جغرافية</p>
                      <p className="text-lg font-bold text-blue-600">{statistics?.coverage.withGeometry}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي السجلات</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{statistics?.coverage.totalRecords}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    آخر التحديثات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">تحديث بيانات المحافظات</p>
                        <p className="text-sm text-green-600 dark:text-green-400">تم تحديث 21 محافظة</p>
                      </div>
                      <Badge variant="secondary">منجز</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">رفع بيانات المديريات</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">تم رفع 333 مديرية</p>
                      </div>
                      <Badge variant="secondary">منجز</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">بيانات القطاعات</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">قيد المعالجة</p>
                      </div>
                      <Badge variant="outline">جاري</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    رفع البيانات الجغرافية
                  </CardTitle>
                  <CardDescription>
                    رفع ملفات Shapefile, GeoJSON, أو JSON للبيانات الجغرافية
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="data-type">نوع البيانات</Label>
                    <Select>
                      <SelectTrigger data-testid="select-data-type">
                        <SelectValue placeholder="اختر نوع البيانات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="governorates">المحافظات</SelectItem>
                        <SelectItem value="districts">المديريات</SelectItem>
                        <SelectItem value="sub-districts">العزل</SelectItem>
                        <SelectItem value="sectors">القطاعات</SelectItem>
                        <SelectItem value="neighborhoods">وحدات الجوار</SelectItem>
                        <SelectItem value="blocks">البلوكات</SelectItem>
                        <SelectItem value="streets">الشوارع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-upload">ملف البيانات</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                            اختر ملف أو اسحبه هنا
                          </span>
                          <span className="text-sm text-gray-500">
                            JSON, GeoJSON, Shapefile, ZIP (حتى 50MB)
                          </span>
                        </label>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".json,.geojson,.shp,.zip"
                          onChange={(e) => handleFileUpload(e, "governorates")}
                          data-testid="input-file-upload"
                        />
                      </div>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>جاري الرفع...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    disabled={isUploading}
                    data-testid="button-upload"
                  >
                    {isUploading ? "جاري الرفع..." : "رفع البيانات"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>متطلبات البيانات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">تنسيق الملفات المدعومة:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• ملفات Shapefile (.shp + .shx + .dbf + .prj)</li>
                        <li>• ملفات GeoJSON (.geojson)</li>
                        <li>• ملفات JSON (.json)</li>
                        <li>• ملفات مضغوطة (.zip)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">الحقول المطلوبة:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• الاسم بالعربية (name_ar)</li>
                        <li>• الاسم بالإنجليزية (name_en)</li>
                        <li>• الرمز (code)</li>
                        <li>• البيانات الجغرافية (geometry)</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">نظام الإحداثيات:</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        WGS84 (EPSG:4326) - يتم التحويل تلقائياً عند الحاجة
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Governorates Tab */}
          <TabsContent value="governorates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    إدارة المحافظات
                  </span>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة محافظة
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input 
                        placeholder="البحث في المحافظات..." 
                        className="w-full"
                        data-testid="input-search-governorates"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">الرمز</th>
                          <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">الاسم العربي</th>
                          <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">الاسم الإنجليزي</th>
                          <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">العاصمة</th>
                          <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">السكان</th>
                          <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">الحالة</th>
                          <th className="border border-gray-300 dark:border-gray-600 p-3 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {governorates?.governorates.map((gov) => (
                          <tr key={gov.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono">{gov.code}</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3 font-medium">{gov.nameAr}</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3">{gov.nameEn}</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3">{gov.capitalCity}</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3">{gov.population?.toLocaleString()}</td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3">
                              <Badge variant={gov.isActive ? "default" : "secondary"}>
                                {gov.isActive ? "نشط" : "غير نشط"}
                              </Badge>
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 p-3">
                              <div className="flex justify-center gap-2">
                                <Button size="sm" variant="outline" data-testid={`button-edit-${gov.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" data-testid={`button-delete-${gov.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Districts Tab */}
          <TabsContent value="districts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    إدارة المديريات
                  </span>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة مديرية
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select value={selectedGovernorate} onValueChange={setSelectedGovernorate}>
                      <SelectTrigger data-testid="select-governorate-filter">
                        <SelectValue placeholder="اختر المحافظة" />
                      </SelectTrigger>
                      <SelectContent>
                        {governorates?.governorates.map((gov) => (
                          <SelectItem key={gov.id} value={gov.id.toString()}>
                            {gov.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input 
                      placeholder="البحث في المديريات..." 
                      className="md:col-span-2"
                      data-testid="input-search-districts"
                    />
                  </div>

                  {selectedGovernorate && districts && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">الرمز</th>
                            <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">الاسم العربي</th>
                            <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">الاسم الإنجليزي</th>
                            <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">السكان</th>
                            <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">نسبة الحضر</th>
                            <th className="border border-gray-300 dark:border-gray-600 p-3 text-right">المدير</th>
                            <th className="border border-gray-300 dark:border-gray-600 p-3 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {districts.districts.map((district) => (
                            <tr key={district.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono">{district.code}</td>
                              <td className="border border-gray-300 dark:border-gray-600 p-3 font-medium">{district.nameAr}</td>
                              <td className="border border-gray-300 dark:border-gray-600 p-3">{district.nameEn}</td>
                              <td className="border border-gray-300 dark:border-gray-600 p-3">{district.population?.toLocaleString()}</td>
                              <td className="border border-gray-300 dark:border-gray-600 p-3">{district.urbanPercentage}%</td>
                              <td className="border border-gray-300 dark:border-gray-600 p-3">{district.director}</td>
                              <td className="border border-gray-300 dark:border-gray-600 p-3">
                                <div className="flex justify-center gap-2">
                                  <Button size="sm" variant="outline" data-testid={`button-edit-district-${district.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" data-testid={`button-delete-district-${district.id}`}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional tabs would be implemented similarly */}
          <TabsContent value="streets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الشوارع</CardTitle>
                <CardDescription>قريباً - إدارة شبكة الشوارع والطرق</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Route className="mx-auto h-16 w-16 mb-4" />
                  <p>قيد التطوير - سيتم إضافة إدارة الشوارع قريباً</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>التحليلات والإحصائيات</CardTitle>
                <CardDescription>قريباً - تحليلات متقدمة للبيانات الجغرافية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="mx-auto h-16 w-16 mb-4" />
                  <p>قيد التطوير - سيتم إضافة التحليلات قريباً</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}