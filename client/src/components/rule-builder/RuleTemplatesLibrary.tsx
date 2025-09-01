import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Star, Search, Filter, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  usageCount: number;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  tags: string[];
  author: string;
  lastUpdated: string;
  isOfficial: boolean;
}

const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'auto_approve_small_building',
    name: 'موافقة تلقائية للمباني الصغيرة',
    description: 'موافقة تلقائية على طلبات البناء السكني للمباني أقل من 200 متر مربع وبتكلفة أقل من 100 ألف ريال',
    category: 'building_permit',
    rating: 4.8,
    usageCount: 1250,
    conditions: {
      area_sqm: { operator: '<', value: 200 },
      estimatedCost: { operator: '<', value: 100000 },
      buildingType: { operator: '==', value: 'residential' },
      floors: { operator: '<=', value: 2 }
    },
    actions: {
      autoApprove: true,
      fastTrack: true,
      skipManualReview: true,
      generatePermit: true
    },
    tags: ['سكني', 'صغير', 'سريع', 'تلقائي'],
    author: 'النظام الرسمي',
    lastUpdated: '2025-08-15',
    isOfficial: true
  },
  {
    id: 'escalate_heritage_areas',
    name: 'تصعيد للمناطق التراثية',
    description: 'تصعيد تلقائي لجميع طلبات البناء في المناطق التراثية والأثرية للجنة التراث',
    category: 'building_permit',
    rating: 4.9,
    usageCount: 890,
    conditions: {
      location: { operator: 'contains', value: 'تاريخي,تراثي,أثري' },
      district: { operator: 'in', value: 'المنطقة التاريخية,البلدة القديمة' }
    },
    actions: {
      escalateToHeritage: true,
      requiresHeritageApproval: true,
      additionalDocuments: true,
      extendedReviewPeriod: true
    },
    tags: ['تراث', 'تاريخي', 'تصعيد', 'لجنة'],
    author: 'إدارة التراث',
    lastUpdated: '2025-08-10',
    isOfficial: true
  },
  {
    id: 'high_value_review',
    name: 'مراجعة المشاريع عالية القيمة',
    description: 'مراجعة إضافية ومتعددة المستويات للمشاريع التي تزيد قيمتها عن مليون ريال',
    category: 'building_permit',
    rating: 4.7,
    usageCount: 567,
    conditions: {
      estimatedCost: { operator: '>', value: 1000000 },
      buildingType: { operator: 'in', value: 'commercial,industrial,mixed' }
    },
    actions: {
      escalateToManager: true,
      requiresFinancialApproval: true,
      requiresEngineeringReview: true,
      multiLevelApproval: true,
      extendedReviewPeriod: true
    },
    tags: ['عالي القيمة', 'تجاري', 'مراجعة متعددة'],
    author: 'الإدارة المالية',
    lastUpdated: '2025-08-12',
    isOfficial: true
  },
  {
    id: 'emergency_fast_track',
    name: 'مسار طوارئ سريع',
    description: 'معالجة عاجلة للطلبات الطارئة مثل الإصلاحات الضرورية والمشاريع الإنسانية',
    category: 'emergency_permits',
    rating: 4.6,
    usageCount: 234,
    conditions: {
      urgencyLevel: { operator: '==', value: 'emergency' },
      projectType: { operator: 'in', value: 'repair,humanitarian,infrastructure' }
    },
    actions: {
      fastTrack: true,
      skipNonEssentialSteps: true,
      priorityProcessing: true,
      immediateNotification: true,
      weekendProcessing: true
    },
    tags: ['طوارئ', 'سريع', 'إنساني', 'إصلاح'],
    author: 'إدارة الطوارئ',
    lastUpdated: '2025-08-20',
    isOfficial: true
  },
  {
    id: 'license_renewal_simple',
    name: 'تجديد بسيط للرخص',
    description: 'تجديد تلقائي للرخص البسيطة بدون مخالفات أو تغييرات جوهرية',
    category: 'license_renewal',
    rating: 4.9,
    usageCount: 2100,
    conditions: {
      renewalType: { operator: '==', value: 'simple' },
      previousViolations: { operator: '==', value: 0 },
      noStructuralChanges: { operator: '==', value: true },
      validInsurance: { operator: '==', value: true }
    },
    actions: {
      autoApprove: true,
      instantRenewal: true,
      generateNewLicense: true,
      sendConfirmation: true
    },
    tags: ['تجديد', 'بسيط', 'تلقائي', 'فوري'],
    author: 'النظام الرسمي',
    lastUpdated: '2025-08-18',
    isOfficial: true
  },
  {
    id: 'survey_priority_areas',
    name: 'أولوية المساحة للمناطق الحيوية',
    description: 'إعطاء أولوية عالية لطلبات المساحة في المناطق الحيوية والاستراتيجية',
    category: 'survey_request',
    rating: 4.5,
    usageCount: 445,
    conditions: {
      location: { operator: 'in', value: 'المطار,الميناء,المنطقة الحكومية,المنطقة الاقتصادية' },
      projectImportance: { operator: '>=', value: 8 }
    },
    actions: {
      highPriority: true,
      assignSeniorSurveyor: true,
      acceleratedProcessing: true,
      qualityAssurance: true
    },
    tags: ['مساحة', 'أولوية', 'حيوي', 'استراتيجي'],
    author: 'إدارة المساحة',
    lastUpdated: '2025-08-14',
    isOfficial: true
  }
];

const CATEGORIES = [
  { value: 'all', label: 'جميع الفئات' },
  { value: 'building_permit', label: 'تراخيص البناء' },
  { value: 'survey_request', label: 'طلبات المساحة' },
  { value: 'license_renewal', label: 'تجديد الرخص' },
  { value: 'emergency_permits', label: 'تراخيص الطوارئ' },
  { value: 'violation_handling', label: 'معالجة المخالفات' },
];

export function RuleTemplatesLibrary({ onSelectTemplate }: { onSelectTemplate?: (template: RuleTemplate) => void }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');

  const filteredTemplates = RULE_TEMPLATES
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.tags.some(tag => tag.includes(searchTerm));
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default:
          return 0;
      }
    });

  const copyTemplate = (template: RuleTemplate) => {
    const templateData = {
      name: template.name,
      description: template.description,
      conditions: template.conditions,
      actions: template.actions,
      category: template.category
    };
    
    navigator.clipboard.writeText(JSON.stringify(templateData, null, 2));
    toast({
      title: "تم النسخ",
      description: `تم نسخ قالب: ${template.name}`,
    });
  };

  const useTemplate = (template: RuleTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    toast({
      title: "تم اختيار القالب",
      description: `سيتم استخدام قالب: ${template.name}`,
    });
  };

  const exportTemplate = (template: RuleTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `rule_template_${template.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "تم التصدير",
      description: `تم تصدير قالب: ${template.name}`,
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* أدوات البحث والفلترة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            مكتبة قوالب قوانين الأتمتة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="البحث في القوالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-templates"
              />
            </div>
            
            <div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue placeholder="فلترة بالفئة" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort-by">
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">التقييم</SelectItem>
                  <SelectItem value="usage">الاستخدام</SelectItem>
                  <SelectItem value="name">الاسم</SelectItem>
                  <SelectItem value="recent">الأحدث</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{RULE_TEMPLATES.length}</div>
            <p className="text-sm text-muted-foreground">إجمالي القوالب</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{RULE_TEMPLATES.filter(t => t.isOfficial).length}</div>
            <p className="text-sm text-muted-foreground">قوالب رسمية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredTemplates.length}</div>
            <p className="text-sm text-muted-foreground">قوالب مطابقة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {(RULE_TEMPLATES.reduce((sum, t) => sum + t.rating, 0) / RULE_TEMPLATES.length).toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground">متوسط التقييم</p>
          </CardContent>
        </Card>
      </div>

      {/* قائمة القوالب */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">{renderStars(template.rating)}</div>
                    <span className="text-sm text-muted-foreground">
                      ({template.rating}) • استُخدم {template.usageCount.toLocaleString()} مرة
                    </span>
                  </div>
                </div>
                
                {template.isOfficial && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    رسمي
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {CATEGORIES.find(c => c.value === template.category)?.label}
                </Badge>
                {template.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                بواسطة: {template.author} • آخر تحديث: {template.lastUpdated}
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => useTemplate(template)}
                  data-testid={`button-use-template-${template.id}`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  استخدام
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyTemplate(template)}
                  data-testid={`button-copy-template-${template.id}`}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  نسخ
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportTemplate(template)}
                  data-testid={`button-export-template-${template.id}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  تصدير
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">لا توجد قوالب تطابق معايير البحث</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}