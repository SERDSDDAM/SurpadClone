import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  Home, 
  Factory, 
  ShoppingBag, 
  TreePine,
  Search,
  Download,
  Star,
  Clock,
  Users
} from "lucide-react";

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  popularity: number;
  usage_count: number;
  last_updated: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
    fieldDisplayName: string;
  }>;
  actions: Array<{
    type: string;
    message: string;
  }>;
  tags: string[];
  complexity: 'simple' | 'medium' | 'advanced';
}

export function SmartTemplatesLibrary({ onApplyTemplate }: { onApplyTemplate?: (template: RuleTemplate) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);

  const ruleTemplates: RuleTemplate[] = [
    {
      id: 'residential-min-area',
      name: 'الحد الأدنى لمساحة المباني السكنية',
      description: 'قانون لضمان الحد الأدنى لمساحة البناء في المناطق السكنية',
      category: 'residential',
      icon: Home,
      popularity: 4.8,
      usage_count: 156,
      last_updated: '2024-01-15',
      conditions: [
        { field: 'buildingArea', operator: '>=', value: 120, fieldDisplayName: 'مساحة المبنى' },
        { field: 'buildingType', operator: '==', value: 'residential', fieldDisplayName: 'نوع المبنى' }
      ],
      actions: [
        { type: 'approve', message: 'تمت الموافقة - يحقق الحد الأدنى للمساحة' }
      ],
      tags: ['مساحة', 'سكني', 'أساسي'],
      complexity: 'simple'
    },
    {
      id: 'commercial-height-limit',
      name: 'حدود الارتفاع للمباني التجارية',
      description: 'قانون للتحكم في ارتفاع المباني التجارية حسب المنطقة',
      category: 'commercial',
      icon: ShoppingBag,
      popularity: 4.6,
      usage_count: 89,
      last_updated: '2024-01-10',
      conditions: [
        { field: 'height', operator: '<=', value: 25, fieldDisplayName: 'ارتفاع المبنى' },
        { field: 'buildingType', operator: '==', value: 'commercial', fieldDisplayName: 'نوع المبنى' },
        { field: 'zone', operator: 'in', value: ['CBD', 'commercial'], fieldDisplayName: 'المنطقة' }
      ],
      actions: [
        { type: 'approve', message: 'تمت الموافقة - يحترم حدود الارتفاع' }
      ],
      tags: ['ارتفاع', 'تجاري', 'منطقة'],
      complexity: 'medium'
    },
    {
      id: 'industrial-setback',
      name: 'الحدود الجانبية للمباني الصناعية',
      description: 'قانون لضمان المسافات الآمنة للمباني الصناعية من الحدود',
      category: 'industrial',
      icon: Factory,
      popularity: 4.4,
      usage_count: 67,
      last_updated: '2024-01-08',
      conditions: [
        { field: 'frontSetback', operator: '>=', value: 10, fieldDisplayName: 'المسافة الأمامية' },
        { field: 'sideSetback', operator: '>=', value: 5, fieldDisplayName: 'المسافة الجانبية' },
        { field: 'buildingType', operator: '==', value: 'industrial', fieldDisplayName: 'نوع المبنى' }
      ],
      actions: [
        { type: 'approve', message: 'تمت الموافقة - يحترم المسافات المطلوبة' }
      ],
      tags: ['حدود', 'صناعي', 'أمان'],
      complexity: 'medium'
    },
    {
      id: 'mixed-use-complex',
      name: 'قواعد المباني متعددة الاستخدام',
      description: 'قانون شامل للمباني المختلطة الاستخدام مع تعدد الشروط',
      category: 'mixed-use',
      icon: Building2,
      popularity: 4.9,
      usage_count: 234,
      last_updated: '2024-01-20',
      conditions: [
        { field: 'buildingArea', operator: '>=', value: 500, fieldDisplayName: 'مساحة المبنى' },
        { field: 'height', operator: '<=', value: 30, fieldDisplayName: 'ارتفاع المبنى' },
        { field: 'parkingRatio', operator: '>=', value: 1.2, fieldDisplayName: 'نسبة المواقف' },
        { field: 'greenSpaceRatio', operator: '>=', value: 0.15, fieldDisplayName: 'نسبة المساحة الخضراء' }
      ],
      actions: [
        { type: 'approve', message: 'تمت الموافقة - يحقق جميع متطلبات المباني المختلطة' }
      ],
      tags: ['مختلط', 'شامل', 'متقدم'],
      complexity: 'advanced'
    },
    {
      id: 'environmental-compliance',
      name: 'الامتثال البيئي للمشاريع',
      description: 'قانون للتحقق من الامتثال للمعايير البيئية',
      category: 'environmental',
      icon: TreePine,
      popularity: 4.7,
      usage_count: 123,
      last_updated: '2024-01-18',
      conditions: [
        { field: 'environmentalImpact', operator: '<=', value: 3, fieldDisplayName: 'التأثير البيئي' },
        { field: 'wasteManagementPlan', operator: '==', value: true, fieldDisplayName: 'خطة إدارة النفايات' },
        { field: 'energyEfficiencyRating', operator: '>=', value: 'B', fieldDisplayName: 'تصنيف كفاءة الطاقة' }
      ],
      actions: [
        { type: 'approve', message: 'تمت الموافقة - يحقق المعايير البيئية' }
      ],
      tags: ['بيئي', 'استدامة', 'طاقة'],
      complexity: 'advanced'
    }
  ];

  const categories = [
    { id: 'all', name: 'جميع الفئات', icon: Building2 },
    { id: 'residential', name: 'سكني', icon: Home },
    { id: 'commercial', name: 'تجاري', icon: ShoppingBag },
    { id: 'industrial', name: 'صناعي', icon: Factory },
    { id: 'mixed-use', name: 'مختلط', icon: Building2 },
    { id: 'environmental', name: 'بيئي', icon: TreePine }
  ];

  const filteredTemplates = ruleTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityText = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'بسيط';
      case 'medium': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return 'غير محدد';
    }
  };

  const handleApplyTemplate = (template: RuleTemplate) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
    }
    setSelectedTemplate(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-right">مكتبة القوالب الذكية</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* البحث والفلترة */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في القوالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* قائمة القوالب */}
        <ScrollArea className="h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* العنوان والأيقونة */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-blue-500" />
                          <div>
                            <h3 className="font-medium text-right text-sm">{template.name}</h3>
                            <p className="text-xs text-gray-600 text-right mt-1">{template.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* الإحصائيات */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{template.popularity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>{template.usage_count} استخدام</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{template.last_updated}</span>
                        </div>
                      </div>

                      {/* المستوى والعلامات */}
                      <div className="space-y-2">
                        <Badge className={getComplexityColor(template.complexity)} variant="outline">
                          {getComplexityText(template.complexity)}
                        </Badge>
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* الأزرار */}
                      <div className="flex gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(template)}>
                              عرض التفاصيل
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-right">{template.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600 text-right">{template.description}</p>
                              
                              <div>
                                <h4 className="font-medium mb-2 text-right">الشروط:</h4>
                                <div className="space-y-2">
                                  {template.conditions.map((condition, index) => (
                                    <div key={index} className="bg-gray-50 p-2 rounded text-sm text-right">
                                      {condition.fieldDisplayName} {condition.operator} {condition.value}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2 text-right">الإجراءات:</h4>
                                <div className="space-y-2">
                                  {template.actions.map((action, index) => (
                                    <div key={index} className="bg-green-50 p-2 rounded text-sm text-right">
                                      {action.type}: {action.message}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button onClick={() => handleApplyTemplate(template)}>
                                  تطبيق القالب
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button size="sm" onClick={() => handleApplyTemplate(template)}>
                          <Download className="h-4 w-4 ml-1" />
                          استخدام
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">لم يتم العثور على قوالب مطابقة للبحث</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}