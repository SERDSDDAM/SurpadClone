import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  RefreshCw, 
  Upload, 
  Download, 
  Search,
  MapPin, 
  Building2,
  Users,
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Map,
  Layers,
  Filter,
  Plus,
  Trash2
} from 'lucide-react';
import GeographicDataMap from '@/components/GeographicDataMap';

// TypeScript interfaces
interface GeographicStats {
  governorates: number;
  districts: number;
  subDistricts: number;
  totalArea: number;
  totalPopulation: number;
}

interface Governorate {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  bounds?: [number, number, number, number];
  area?: number;
  population?: number;
  capitalCity?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface District {
  id: string;
  governorateId: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  bounds?: [number, number, number, number];
  area?: number;
  population?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SubDistrict {
  id: string;
  districtId: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  bounds?: [number, number, number, number];
  area?: number;
  population?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FileUploadComponentProps {
  type: 'governorates' | 'districts' | 'sub-districts';
  onSuccess: () => void;
}

function FileUploadComponent({ type, onSuccess }: FileUploadComponentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      setUploadProgress(10);
      
      const response = await fetch(`/api/geographic/${type}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      setUploadProgress(50);

      if (!response.ok) {
        throw new Error(`فشل في رفع الملف: ${response.statusText}`);
      }

      setUploadProgress(80);
      const result = await response.json();
      setUploadProgress(100);
      
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: 'تم رفع الملف بنجاح',
        description: data.message || `تم إدراج ${data.data?.inserted || 0} و تحديث ${data.data?.updated || 0} سجل`,
      });
      setSelectedFile(null);
      setUploadProgress(0);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'فشل في رفع الملف',
        description: error.message || 'حدث خطأ أثناء رفع الملف',
        variant: 'destructive',
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.geojson')) {
        setSelectedFile(file);
      } else {
        toast({
          title: 'نوع ملف غير مدعوم',
          description: 'يُرجى اختيار ملف GeoJSON صالح',
          variant: 'destructive',
        });
      }
    }
  }, [toast]);

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  }, [selectedFile, uploadMutation]);

  const getTypeLabel = () => {
    switch (type) {
      case 'governorates': return 'المحافظات';
      case 'districts': return 'المديريات';
      case 'sub-districts': return 'العزل';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          رفع ملف {getTypeLabel()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`file-${type}`}>اختر ملف GeoJSON</Label>
          <Input
            id={`file-${type}`}
            type="file"
            accept=".geojson,.json"
            onChange={handleFileSelect}
            disabled={uploadMutation.isPending}
            data-testid={`input-file-${type}`}
          />
        </div>
        
        {selectedFile && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              الملف المحدد: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} ميجابايت)
            </p>
          </div>
        )}

        {uploadProgress > 0 && (
          <div className="space-y-2">
            <Label>تقدم الرفع</Label>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-gray-600">{uploadProgress}% مكتمل</p>
          </div>
        )}

        <Button 
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className="w-full"
          data-testid={`button-upload-${type}`}
        >
          {uploadMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              جارِ الرفع...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              رفع الملف
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatisticsOverview() {
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ['/api/geographic/statistics'],
    queryFn: () => apiRequest('/api/geographic/statistics'),
  });

  const stats = statsResponse?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card data-testid="stats-governorates">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Globe className="h-8 w-8 text-blue-600" />
            <div className="mr-4">
              <p className="text-2xl font-bold">{stats?.governorates || 0}</p>
              <p className="text-gray-600">المحافظات</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="stats-districts">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-green-600" />
            <div className="mr-4">
              <p className="text-2xl font-bold">{stats?.districts || 0}</p>
              <p className="text-gray-600">المديريات</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="stats-subdistricts">
        <CardContent className="p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-purple-600" />
            <div className="mr-4">
              <p className="text-2xl font-bold">{stats?.subDistricts || 0}</p>
              <p className="text-gray-600">العزل</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="stats-area">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Map className="h-8 w-8 text-orange-600" />
            <div className="mr-4">
              <p className="text-2xl font-bold">{stats?.totalArea?.toLocaleString() || 0}</p>
              <p className="text-gray-600">كم² المساحة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="stats-population">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-red-600" />
            <div className="mr-4">
              <p className="text-2xl font-bold">{stats?.totalPopulation?.toLocaleString() || 0}</p>
              <p className="text-gray-600">السكان</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GovernoradesTable() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/geographic/governorates', { search, limit, offset: page * limit }],
    queryFn: () => apiRequest(`/api/geographic/governorates?search=${search}&limit=${limit}&offset=${page * limit}`),
  });

  const governorates: Governorate[] = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="البحث في المحافظات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-governorates"
          />
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" data-testid="button-refresh-governorates">
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="mr-2">جارِ التحميل...</span>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم بالعربية</TableHead>
                <TableHead>الاسم بالإنجليزية</TableHead>
                <TableHead>العاصمة</TableHead>
                <TableHead>المساحة</TableHead>
                <TableHead>السكان</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {governorates.map((gov) => (
                <TableRow key={gov.id} data-testid={`row-governorate-${gov.code}`}>
                  <TableCell className="font-mono">{gov.code}</TableCell>
                  <TableCell className="font-semibold">{gov.nameAr}</TableCell>
                  <TableCell>{gov.nameEn}</TableCell>
                  <TableCell>{gov.capitalCity || '-'}</TableCell>
                  <TableCell>{gov.area ? `${gov.area.toLocaleString()} كم²` : '-'}</TableCell>
                  <TableCell>{gov.population ? gov.population.toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={gov.isActive ? 'default' : 'secondary'}>
                      {gov.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${gov.code}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {governorates.length === 0 && !isLoading && (
        <div className="text-center p-8 text-gray-500">
          لا توجد محافظات تطابق معايير البحث
        </div>
      )}
    </div>
  );
}

function DistrictsTable() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/geographic/districts', { search, limit, offset: page * limit }],
    queryFn: () => apiRequest(`/api/geographic/districts?search=${search}&limit=${limit}&offset=${page * limit}`),
  });

  const districts: District[] = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="البحث في المديريات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-districts"
          />
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" data-testid="button-refresh-districts">
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="mr-2">جارِ التحميل...</span>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم بالعربية</TableHead>
                <TableHead>الاسم بالإنجليزية</TableHead>
                <TableHead>المساحة</TableHead>
                <TableHead>السكان</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {districts.map((district) => (
                <TableRow key={district.id} data-testid={`row-district-${district.code}`}>
                  <TableCell className="font-mono">{district.code}</TableCell>
                  <TableCell className="font-semibold">{district.nameAr}</TableCell>
                  <TableCell>{district.nameEn || '-'}</TableCell>
                  <TableCell>{district.area ? `${district.area.toLocaleString()} كم²` : '-'}</TableCell>
                  <TableCell>{district.population ? district.population.toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={district.isActive ? 'default' : 'secondary'}>
                      {district.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${district.code}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {districts.length === 0 && !isLoading && (
        <div className="text-center p-8 text-gray-500">
          لا توجد مديريات تطابق معايير البحث
        </div>
      )}
    </div>
  );
}

function SubDistrictsTable() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 100;
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/geographic/sub-districts', { search, limit, offset: page * limit }],
    queryFn: () => apiRequest(`/api/geographic/sub-districts?search=${search}&limit=${limit}&offset=${page * limit}`),
  });

  const subDistricts: SubDistrict[] = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="البحث في العزل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            data-testid="input-search-subdistricts"
          />
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" data-testid="button-refresh-subdistricts">
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="mr-2">جارِ التحميل...</span>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكود</TableHead>
                <TableHead>الاسم بالعربية</TableHead>
                <TableHead>الاسم بالإنجليزية</TableHead>
                <TableHead>المساحة</TableHead>
                <TableHead>السكان</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subDistricts.map((subDistrict) => (
                <TableRow key={subDistrict.id} data-testid={`row-subdistrict-${subDistrict.code}`}>
                  <TableCell className="font-mono">{subDistrict.code}</TableCell>
                  <TableCell className="font-semibold">{subDistrict.nameAr}</TableCell>
                  <TableCell>{subDistrict.nameEn || '-'}</TableCell>
                  <TableCell>{subDistrict.area ? `${subDistrict.area.toLocaleString()} كم²` : '-'}</TableCell>
                  <TableCell>{subDistrict.population ? subDistrict.population.toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={subDistrict.isActive ? 'default' : 'secondary'}>
                      {subDistrict.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" data-testid={`button-view-${subDistrict.code}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {subDistricts.length === 0 && !isLoading && (
        <div className="text-center p-8 text-gray-500">
          لا توجد عزل تطابق معايير البحث
        </div>
      )}
    </div>
  );
}

export default function GeographicDataManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUploadSuccess = useCallback(() => {
    // Invalidate all geographic data queries to refresh the tables and stats
    queryClient.invalidateQueries({ queryKey: ['/api/geographic'] });
    toast({
      title: 'تم تحديث البيانات',
      description: 'تم تحديث جميع البيانات الجغرافية بنجاح',
    });
  }, [queryClient, toast]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة البيانات الجغرافية</h1>
          <p className="text-gray-600 mt-1">إدارة المحافظات والمديريات والعزل</p>
        </div>
        <Button variant="outline" size="sm" data-testid="button-export-all">
          <Download className="h-4 w-4 mr-2" />
          تصدير البيانات
        </Button>
      </div>

      {/* Statistics Overview */}
      <StatisticsOverview />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="governorates" data-testid="tab-governorates">المحافظات</TabsTrigger>
          <TabsTrigger value="districts" data-testid="tab-districts">المديريات</TabsTrigger>
          <TabsTrigger value="sub-districts" data-testid="tab-subdistricts">العزل</TabsTrigger>
          <TabsTrigger value="import" data-testid="tab-import">رفع البيانات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أحدث البيانات المرفوعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">محافظات اليمن</p>
                        <p className="text-sm text-gray-600">تم الرفع منذ 3 أيام</p>
                      </div>
                    </div>
                    <Badge variant="outline">22 محافظة</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">مديريات اليمن</p>
                        <p className="text-sm text-gray-600">تم الرفع منذ 2 أيام</p>
                      </div>
                    </div>
                    <Badge variant="outline">343 مديرية</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <AlertCircle className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium">عزل اليمن</p>
                        <p className="text-sm text-gray-600">في انتظار التحديث</p>
                      </div>
                    </div>
                    <Badge variant="secondary">قيد الانتظار</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>خريطة التوزيع الجغرافي</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <GeographicDataMap height="300px" showControls={false} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="governorates" className="space-y-4">
          <GovernoradesTable />
        </TabsContent>

        <TabsContent value="districts" className="space-y-4">
          <DistrictsTable />
        </TabsContent>

        <TabsContent value="sub-districts" className="space-y-4">
          <SubDistrictsTable />
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FileUploadComponent type="governorates" onSuccess={handleUploadSuccess} />
            <FileUploadComponent type="districts" onSuccess={handleUploadSuccess} />
            <FileUploadComponent type="sub-districts" onSuccess={handleUploadSuccess} />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              يُرجى التأكد من أن ملفات GeoJSON تحتوي على البيانات المطلوبة للمحافظات، المديريات، أو العزل. 
              يجب أن تكون الملفات بتنسيق GeoJSON صالح مع الخصائص المطلوبة.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}