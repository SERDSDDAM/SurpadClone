import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  ChevronLeft,
  Filter,
  Download,
  Eye,
  BarChart3,
  Building2,
  Map,
  Layers,
  Home,
  RefreshCw,
  Users,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

// إدارة الهيكل الإداري اليمني التسعة مستويات
interface AdministrativeLevel {
  key: string;
  nameAr: string;
  nameEn: string;
  icon: React.ReactNode;
  endpoint: string;
  parentKey?: string;
  color: string;
  description: string;
}

const ADMINISTRATIVE_LEVELS: AdministrativeLevel[] = [
  {
    key: 'governorates',
    nameAr: 'المحافظات',
    nameEn: 'Governorates', 
    icon: <Building2 className="w-4 h-4" />,
    endpoint: '/api/gis/governorates',
    color: 'bg-blue-500',
    description: 'الوحدة الإدارية الأساسية في الجمهورية اليمنية'
  },
  {
    key: 'districts',
    nameAr: 'المديريات',
    nameEn: 'Districts',
    icon: <Map className="w-4 h-4" />,
    endpoint: '/api/gis/districts',
    parentKey: 'governorates',
    color: 'bg-green-500',
    description: 'الوحدة الإدارية التابعة للمحافظة'
  },
  {
    key: 'subDistricts',
    nameAr: 'العزل',
    nameEn: 'Sub-Districts',
    icon: <Layers className="w-4 h-4" />,
    endpoint: '/api/gis/sub-districts',
    parentKey: 'districts',
    color: 'bg-purple-500',
    description: 'الوحدة الإدارية التابعة للمديرية'
  },
  {
    key: 'neighborhoods',
    nameAr: 'الأحياء',
    nameEn: 'Neighborhoods',
    icon: <Home className="w-4 h-4" />,
    endpoint: '/api/gis/neighborhoods',
    parentKey: 'subDistricts',
    color: 'bg-orange-500',
    description: 'الوحدة الإدارية التابعة للعزلة'
  },
  {
    key: 'sectors',
    nameAr: 'القطاعات',
    nameEn: 'Sectors',
    icon: <MapPin className="w-4 h-4" />,
    endpoint: '/api/gis/sectors',
    parentKey: 'neighborhoods',
    color: 'bg-red-500',
    description: 'الوحدة الإدارية التابعة للحي'
  },
  {
    key: 'administrativeBlocks',
    nameAr: 'الكتل الإدارية',
    nameEn: 'Administrative Blocks',
    icon: <Building2 className="w-4 h-4" />,
    endpoint: '/api/gis/administrative-blocks',
    parentKey: 'sectors',
    color: 'bg-indigo-500',
    description: 'الوحدة الإدارية التابعة للقطاع'
  },
  {
    key: 'neighborhoodUnits',
    nameAr: 'وحدات الأحياء',
    nameEn: 'Neighborhood Units',
    icon: <Users className="w-4 h-4" />,
    endpoint: '/api/gis/neighborhood-units',
    parentKey: 'administrativeBlocks',
    color: 'bg-pink-500',
    description: 'الوحدة الإدارية التابعة للكتلة الإدارية'
  },
  {
    key: 'unitBlocks',
    nameAr: 'كتل الوحدات',
    nameEn: 'Unit Blocks',
    icon: <Building2 className="w-4 h-4" />,
    endpoint: '/api/gis/unit-blocks',
    parentKey: 'neighborhoodUnits',
    color: 'bg-teal-500',
    description: 'الوحدة الإدارية التابعة لوحدة الحي'
  },
  {
    key: 'streets',
    nameAr: 'الشوارع',
    nameEn: 'Streets',
    icon: <MapPin className="w-4 h-4" />,
    endpoint: '/api/gis/streets',
    parentKey: 'unitBlocks',
    color: 'bg-cyan-500',
    description: 'الشوارع والطرق العامة'
  }
];

interface GeographicDataBrowserProps {
  className?: string;
  height?: string;
  onSelectionChange?: (level: string, selection: any) => void;
  defaultExpanded?: boolean;
}

interface SelectionState {
  [key: string]: {
    id: string;
    name: string;
    data: any;
  };
}

interface SearchFilters {
  text: string;
  level: string;
  parentFilter?: string;
  includeGeometry: boolean;
}

export default function GeographicDataBrowser({ 
  className,
  height = '800px',
  onSelectionChange,
  defaultExpanded = true
}: GeographicDataBrowserProps) {
  // حالة الاختيارات الهرمية
  const [selections, setSelections] = useState<SelectionState>({});
  
  // حالة البحث والفلتر
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    text: '',
    level: 'governorates',
    includeGeometry: false
  });
  
  // المستوى النشط الحالي
  const [activeLevel, setActiveLevel] = useState<string>('governorates');
  
  // حالة الإحصائيات
  const [showStatistics, setShowStatistics] = useState(false);

  // إعداد البيانات للمستوى المطلوب
  const currentLevel = useMemo(() => 
    ADMINISTRATIVE_LEVELS.find(level => level.key === activeLevel), 
    [activeLevel]
  );

  // إعداد المعاملات لاستعلامات البيانات
  const buildQueryParams = useCallback((level: AdministrativeLevel) => {
    const params = new URLSearchParams();
    
    // إضافة البحث النصي
    if (searchFilters.text.trim()) {
      params.append('search', searchFilters.text);
    }
    
    // إضافة geometry إذا كان مطلوباً
    if (searchFilters.includeGeometry) {
      params.append('includeGeometry', 'true');
    }
    
    // إضافة parent ID إذا كان المستوى يحتاج parent
    if (level.parentKey && selections[level.parentKey]) {
      const parentId = selections[level.parentKey].id;
      params.append('parentId', parentId);
    }
    
    // حد افتراضي للنتائج
    params.append('limit', '50');
    params.append('offset', '0');
    
    return params.toString();
  }, [searchFilters, selections]);

  // استعلام البيانات للمستوى الحالي
  const { data: currentLevelData, isLoading, error, refetch } = useQuery({
    queryKey: [currentLevel?.endpoint, searchFilters, selections[currentLevel?.parentKey || '']],
    queryFn: async () => {
      if (!currentLevel) return null;
      
      const queryString = buildQueryParams(currentLevel);
      const url = queryString ? `${currentLevel.endpoint}?${queryString}` : currentLevel.endpoint;
      
      return await apiRequest(url);
    },
    enabled: !!currentLevel,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });

  // استعلام إحصائيات الطبقات
  const { data: layerStats } = useQuery({
    queryKey: ['/api/gis/debug/layers'],
    queryFn: () => apiRequest('/api/gis/debug/layers'),
    refetchInterval: 30 * 1000, // كل 30 ثانية
  });

  // دالة التعامل مع اختيار عنصر
  const handleItemSelection = useCallback((item: any, level: string) => {
    const newSelections = { ...selections };
    
    // إضافة الاختيار الجديد
    newSelections[level] = {
      id: item.id,
      name: item.nameAr || item.streetName || item.name || 'بدون اسم',
      data: item
    };
    
    // إزالة الاختيارات الفرعية عند تغيير المستوى الأعلى
    ADMINISTRATIVE_LEVELS.forEach(adminLevel => {
      if (adminLevel.parentKey === level) {
        delete newSelections[adminLevel.key];
      }
    });
    
    setSelections(newSelections);
    
    // إشعار المكون الأب
    if (onSelectionChange) {
      onSelectionChange(level, item);
    }
    
    // الانتقال للمستوى التالي إذا كان متاحاً
    const nextLevel = ADMINISTRATIVE_LEVELS.find(l => l.parentKey === level);
    if (nextLevel) {
      setActiveLevel(nextLevel.key);
    }
  }, [selections, onSelectionChange]);

  // دالة تغيير مستوى النشاط
  const changeActiveLevel = useCallback((levelKey: string) => {
    setActiveLevel(levelKey);
    setSearchFilters(prev => ({ ...prev, text: '', level: levelKey }));
  }, []);

  // دالة التصدير
  const handleExport = useCallback(async (format: 'json' | 'csv' | 'geojson') => {
    try {
      if (!currentLevel || !currentLevelData?.data) {
        console.warn('لا توجد بيانات للتصدير');
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${currentLevel.nameEn}_${timestamp}.${format}`;
      
      let content: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(currentLevelData.data, null, 2);
          mimeType = 'application/json';
          break;
        case 'csv':
          // تحويل إلى CSV
          const data = currentLevelData.data;
          if (!data.length) return;
          
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map((row: any) => 
            Object.values(row).map((val: any) => 
              typeof val === 'string' ? `"${val}"` : val
            ).join(',')
          ).join('\n');
          
          content = `${headers}\n${rows}`;
          mimeType = 'text/csv';
          break;
        case 'geojson':
          // تحويل إلى GeoJSON
          const features = currentLevelData.data
            .filter((item: any) => item.geometry)
            .map((item: any) => ({
              type: 'Feature',
              properties: { ...item, geometry: undefined },
              geometry: item.geometry
            }));
          
          content = JSON.stringify({
            type: 'FeatureCollection',
            features
          }, null, 2);
          mimeType = 'application/geo+json';
          break;
        default:
          return;
      }

      // تنزيل الملف
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
    }
  }, [currentLevel, currentLevelData]);

  return (
    <div className={cn("flex flex-col bg-background", className)} style={{ height }}>
      {/* شريط العنوان والأدوات */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Building2 className="w-6 h-6 text-primary" />
              متصفح البيانات الجغرافية اليمنية
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh-data"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatistics(!showStatistics)}
                data-testid="button-toggle-stats"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* شريط التنقل الهرمي */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {ADMINISTRATIVE_LEVELS.map((level, index) => (
              <div key={level.key} className="flex items-center gap-2">
                <Button
                  variant={activeLevel === level.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeActiveLevel(level.key)}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    activeLevel === level.key && "shadow-lg"
                  )}
                  disabled={!!(level.parentKey && !selections[level.parentKey])}
                  data-testid={`button-level-${level.key}`}
                >
                  {level.icon}
                  <span>{level.nameAr}</span>
                  {selections[level.key] && (
                    <Badge variant="secondary" className="mr-2">
                      {selections[level.key].name}
                    </Badge>
                  )}
                </Button>
                {index < ADMINISTRATIVE_LEVELS.length - 1 && (
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* شريط البحث والفلاتر */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`ابحث في ${currentLevel?.nameAr || 'البيانات'}...`}
                  value={searchFilters.text}
                  onChange={(e) => 
                    setSearchFilters(prev => ({ ...prev, text: e.target.value }))
                  }
                  className="pr-10 text-right"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <Select
              value={searchFilters.includeGeometry ? "with-geometry" : "without-geometry"}
              onValueChange={(value) => 
                setSearchFilters(prev => ({ ...prev, includeGeometry: value === "with-geometry" }))
              }
            >
              <SelectTrigger className="w-[180px]" data-testid="select-geometry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="without-geometry">بدون هندسة</SelectItem>
                <SelectItem value="with-geometry">مع الهندسة</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                disabled={!currentLevelData?.data?.length}
                data-testid="button-export-json"
              >
                <Download className="w-4 h-4" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={!currentLevelData?.data?.length}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('geojson')}
                disabled={!currentLevelData?.data?.filter((item: any) => item.geometry)?.length}
                data-testid="button-export-geojson"
              >
                <Download className="w-4 h-4" />
                GeoJSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* قائمة البيانات */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {currentLevel?.icon}
                {currentLevel?.nameAr}
              </CardTitle>
              <Badge variant="outline" className="text-sm" data-testid="text-results-count">
                {isLoading ? 'جاري التحميل...' : 
                 currentLevelData?.data?.length || 0} نتيجة
              </Badge>
            </div>
            {currentLevel?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {currentLevel.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="p-6 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">جاري تحميل البيانات...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-destructive">خطأ في تحميل البيانات</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()} 
                    className="mt-2"
                    data-testid="button-retry-load"
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              ) : !currentLevelData?.data?.length ? (
                <div className="p-6 text-center">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">لا توجد بيانات متاحة</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {currentLevelData.data.map((item: any, index: number) => (
                    <div
                      key={item.id || index}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                        selections[currentLevel?.key || '']?.id === item.id && 
                        "border-primary bg-primary/5"
                      )}
                      onClick={() => currentLevel && handleItemSelection(item, currentLevel.key)}
                      data-testid={`item-${item.id || index}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {item.nameAr || item.streetName || item.name || 'بدون اسم'}
                          </h4>
                          {item.nameEn && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.nameEn}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.code && (
                              <Badge variant="outline" className="text-xs">
                                كود: {item.code}
                              </Badge>
                            )}
                            {item.isActive !== undefined && (
                              <Badge 
                                variant={item.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {item.isActive ? 'نشط' : 'غير نشط'}
                              </Badge>
                            )}
                            {item.geometry && (
                              <Badge variant="outline" className="text-xs">
                                <Map className="w-3 h-3 mr-1" />
                                هندسة
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* لوحة الإحصائيات (إذا كانت مفعلة) */}
        {showStatistics && layerStats?.layerCounts && (
          <Card className="w-80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                إحصائيات البيانات
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {ADMINISTRATIVE_LEVELS.map((level) => {
                  const count = layerStats.layerCounts[level.key] || 0;
                  return (
                    <div
                      key={level.key}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", level.color)} />
                        <span className="text-sm">{level.nameAr}</span>
                      </div>
                      <Badge variant="secondary" data-testid={`stat-${level.key}`}>
                        {count.toLocaleString()}
                      </Badge>
                    </div>
                  );
                })}
                
                <Separator />
                
                <div className="text-xs text-muted-foreground mt-4">
                  آخر تحديث: {new Date(layerStats.timestamp).toLocaleString('ar-YE')}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}