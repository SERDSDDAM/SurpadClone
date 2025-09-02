// مدير الهيكل التنظيمي - واجهة No-Code شاملة
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Plus, 
  Users, 
  Search,
  ChevronRight,
  ChevronDown,
  Settings,
  Target,
  BarChart3,
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Building
} from 'lucide-react';

interface OrganizationalLevel {
  id: string;
  name: string;
  nameAr: string;
  level: number;
  parentId?: string;
  type: 'ministry' | 'agency' | 'general_directorate' | 'directorate' | 'department' | 'section' | 'unit';
  code: string;
  isActive: boolean;
  responsibilities: Responsibility[];
  jobLevels: JobLevel[];
  organizationalUnits: OrganizationalUnit[];
  keywords: string[];
  location?: string;
  budget?: number;
  employeeCount?: number;
  contactInfo?: ContactInfo;
  establishedDate?: Date;
}

interface Responsibility {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  type: 'primary' | 'secondary' | 'shared' | 'coordinating';
  taskTypes: string[];
  sectors: string[];
  keywords: string[];
  authority: 'decision' | 'advisory' | 'coordination' | 'implementation';
}

interface JobLevel {
  id: string;
  title: string;
  titleAr: string;
  grade: number;
  category: 'executive' | 'supervisory' | 'technical' | 'administrative' | 'support';
  responsibilities: string[];
  requiredQualifications: string[];
  requiredExperience: number;
  salary: SalaryRange;
  isLeadership: boolean;
  workingHours: number;
}

interface SalaryRange {
  minimum: number;
  maximum: number;
  currency: string;
  allowances: Allowance[];
}

interface Allowance {
  type: string;
  amount: number;
  isPercentage: boolean;
}

interface OrganizationalUnit {
  id: string;
  name: string;
  nameAr: string;
  type: 'operational' | 'support' | 'strategic' | 'advisory';
  parentLevelId: string;
  objectives: string[];
  isActive: boolean;
}

interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

interface TaskData {
  title: string;
  description: string;
  type: string;
  sector: string;
  location: string;
  keywords: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  complexity: 'simple' | 'moderate' | 'complex' | 'critical';
  estimatedTime?: string;
  budget?: number;
  requiredSkills: string[];
  requiredAuthorityLevel: number;
  geographicalScope: 'local' | 'regional' | 'national' | 'international';
  stakeholders: string[];
  timeFrame: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

interface TaskAssignmentResult {
  assigned: boolean;
  organizationalLevelId?: string;
  organizationalLevelName?: string;
  unitId?: string;
  unitName?: string;
  jobLevelId?: string;
  jobLevelTitle?: string;
  confidence: number;
  message: string;
  nextSteps: NextStep[];
  recommendedActions: string[];
  alternativeOptions?: AssignmentOption[];
  estimatedCompletion?: Date;
  riskFactors?: RiskFactor[];
}

interface NextStep {
  step: number;
  title: string;
  description: string;
  estimatedTime: string;
  responsible: string;
}

interface AssignmentOption {
  organizationalLevelId: string;
  organizationalLevelName: string;
  confidence: number;
  pros: string[];
  cons: string[];
  estimatedTime: string;
}

interface RiskFactor {
  type: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string[];
}

export function OrganizationalStructureManager() {
  const [organizationalLevels, setOrganizationalLevels] = useState<OrganizationalLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<OrganizationalLevel | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // نماذج البيانات الجديدة
  const [newLevel, setNewLevel] = useState<Partial<OrganizationalLevel>>({
    type: 'department',
    isActive: true,
    responsibilities: [],
    jobLevels: [],
    organizationalUnits: [],
    keywords: []
  });
  const [newJobLevel, setNewJobLevel] = useState<Partial<JobLevel>>({
    category: 'administrative',
    isLeadership: false,
    responsibilities: [],
    requiredQualifications: [],
    workingHours: 40,
    salary: {
      minimum: 100000,
      maximum: 150000,
      currency: 'YER',
      allowances: []
    }
  });
  const [newTaskAssignment, setNewTaskAssignment] = useState<Partial<TaskData>>({
    priority: 'medium',
    complexity: 'moderate',
    geographicalScope: 'local',
    timeFrame: 'medium_term',
    keywords: [],
    requiredSkills: [],
    stakeholders: [],
    requiredAuthorityLevel: 5
  });

  // حالات النوافذ المنبثقة
  const [showAddLevelDialog, setShowAddLevelDialog] = useState(false);
  const [showAddJobLevelDialog, setShowAddJobLevelDialog] = useState(false);
  const [showTaskAssignmentDialog, setShowTaskAssignmentDialog] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<TaskAssignmentResult | null>(null);

  // إحصائيات النظام
  const [statistics, setStatistics] = useState<any>(null);
  const [efficiencyReport, setEfficiencyReport] = useState<any>(null);

  useEffect(() => {
    loadOrganizationalData();
  }, []);

  const loadOrganizationalData = async () => {
    try {
      setLoading(true);
      
      // تحميل المستويات التنظيمية
      const levelsResponse = await fetch('/api/organizational-automation/organizational-levels');
      const levelsData = await levelsResponse.json();
      if (levelsData.success) {
        setOrganizationalLevels(levelsData.levels);
      }

      // تحميل الإحصائيات
      const statsResponse = await fetch('/api/organizational-automation/statistics');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStatistics(statsData.statistics);
      }

      // تحميل تقرير الكفاءة
      const efficiencyResponse = await fetch('/api/organizational-automation/efficiency-report');
      const efficiencyData = await efficiencyResponse.json();
      if (efficiencyData.success) {
        setEfficiencyReport(efficiencyData.efficiencyReport);
      }

      setLoading(false);
    } catch (error) {
      console.error('خطأ في تحميل البيانات التنظيمية:', error);
      setLoading(false);
    }
  };

  const handleAddLevel = async () => {
    try {
      const response = await fetch('/api/organizational-automation/add-organizational-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLevel)
      });
      
      const result = await response.json();
      if (result.success) {
        await loadOrganizationalData();
        setShowAddLevelDialog(false);
        setNewLevel({
          type: 'department',
          isActive: true,
          responsibilities: [],
          jobLevels: [],
          organizationalUnits: [],
          keywords: []
        });
      } else {
        alert('خطأ: ' + result.error);
      }
    } catch (error) {
      console.error('خطأ في إضافة المستوى التنظيمي:', error);
      alert('حدث خطأ في إضافة المستوى التنظيمي');
    }
  };

  const handleAddJobLevel = async () => {
    if (!selectedLevel) {
      alert('يرجى اختيار مستوى تنظيمي أولاً');
      return;
    }

    try {
      const response = await fetch(`/api/organizational-automation/add-job-level/${selectedLevel.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJobLevel)
      });
      
      const result = await response.json();
      if (result.success) {
        await loadOrganizationalData();
        setShowAddJobLevelDialog(false);
        setNewJobLevel({
          category: 'administrative',
          isLeadership: false,
          responsibilities: [],
          requiredQualifications: [],
          workingHours: 40,
          salary: {
            minimum: 100000,
            maximum: 150000,
            currency: 'YER',
            allowances: []
          }
        });
      } else {
        alert('خطأ: ' + result.error);
      }
    } catch (error) {
      console.error('خطأ في إضافة المستوى الوظيفي:', error);
      alert('حدث خطأ في إضافة المستوى الوظيفي');
    }
  };

  const handleTaskAssignment = async () => {
    try {
      const response = await fetch('/api/organizational-automation/assign-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskAssignment)
      });
      
      const result = await response.json();
      if (result.success) {
        setAssignmentResult(result.assignment);
        setShowTaskAssignmentDialog(false);
      } else {
        alert('خطأ: ' + result.error);
      }
    } catch (error) {
      console.error('خطأ في تعيين المهمة:', error);
      alert('حدث خطأ في تعيين المهمة');
    }
  };

  const toggleLevelExpansion = (levelId: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(levelId)) {
      newExpanded.delete(levelId);
    } else {
      newExpanded.add(levelId);
    }
    setExpandedLevels(newExpanded);
  };

  const renderOrganizationalTree = (levels: OrganizationalLevel[], parentId?: string, indent = 0) => {
    return levels
      .filter(level => level.parentId === parentId)
      .map(level => (
        <div key={level.id} className="mb-2">
          <div 
            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedLevel?.id === level.id ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            style={{ marginLeft: `${indent * 20}px` }}
            onClick={() => setSelectedLevel(level)}
          >
            {levels.some(l => l.parentId === level.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLevelExpansion(level.id);
                }}
                className="p-1"
              >
                {expandedLevels.has(level.id) ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </button>
            )}
            
            <Building2 className="h-5 w-5 text-blue-600" />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{level.nameAr}</span>
                <Badge variant={level.isActive ? 'default' : 'secondary'}>
                  {level.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
                <Badge variant="outline">{level.code}</Badge>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {level.jobLevels.length} مستوى وظيفي • {level.organizationalUnits.length} وحدة تنظيمية
                {level.employeeCount && ` • ${level.employeeCount} موظف`}
              </div>
            </div>
          </div>
          
          {expandedLevels.has(level.id) && renderOrganizationalTree(levels, level.id, indent + 1)}
        </div>
      ));
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'ministry': 'وزارة',
      'agency': 'وكالة',
      'general_directorate': 'إدارة عامة',
      'directorate': 'إدارة',
      'department': 'قسم',
      'section': 'شعبة',
      'unit': 'وحدة'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600">جاري تحميل نظام الهيكل التنظيمي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* الرأس الرئيسي */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg">
              <Building className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                مدير الهيكل التنظيمي والإداري
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                نظام شامل لإدارة الهياكل التنظيمية والمستويات الوظيفية وأتمتة توزيع المهام
              </p>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">
                      {statistics.totalOrganizationalLevels}
                    </p>
                    <p className="text-sm text-gray-600">مستوى تنظيمي</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600">
                      {statistics.totalJobLevels}
                    </p>
                    <p className="text-sm text-gray-600">مستوى وظيفي</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-purple-600">
                      {statistics.totalOrganizationalUnits}
                    </p>
                    <p className="text-sm text-gray-600">وحدة تنظيمية</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-orange-600">
                      {statistics.totalEmployees}
                    </p>
                    <p className="text-sm text-gray-600">موظف</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-red-600">
                      {statistics.activeEntities}
                    </p>
                    <p className="text-sm text-gray-600">كيان نشط</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* التبويبات الرئيسية */}
        <Tabs defaultValue="structure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white p-2 rounded-xl shadow-md">
            <TabsTrigger value="structure" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              الهيكل التنظيمي
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              المستويات الوظيفية
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              تعيين المهام
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              التقارير
            </TabsTrigger>
          </TabsList>

          {/* إدارة الهيكل التنظيمي */}
          <TabsContent value="structure" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة الهيكل التنظيمي</h2>
              <div className="flex gap-3">
                <Input
                  placeholder="البحث في الهيكل التنظيمي..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Dialog open={showAddLevelDialog} onOpenChange={setShowAddLevelDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة مستوى تنظيمي
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>إضافة مستوى تنظيمي جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">الاسم بالعربية</label>
                          <Input
                            value={newLevel.nameAr || ''}
                            onChange={(e) => setNewLevel({...newLevel, nameAr: e.target.value})}
                            placeholder="الإدارة العامة للطرق"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">الاسم بالإنجليزية</label>
                          <Input
                            value={newLevel.name || ''}
                            onChange={(e) => setNewLevel({...newLevel, name: e.target.value})}
                            placeholder="General Directorate of Roads"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">النوع</label>
                          <Select value={newLevel.type} onValueChange={(value) => setNewLevel({...newLevel, type: value as any})}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع المستوى" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ministry">وزارة</SelectItem>
                              <SelectItem value="agency">وكالة</SelectItem>
                              <SelectItem value="general_directorate">إدارة عامة</SelectItem>
                              <SelectItem value="directorate">إدارة</SelectItem>
                              <SelectItem value="department">قسم</SelectItem>
                              <SelectItem value="section">شعبة</SelectItem>
                              <SelectItem value="unit">وحدة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">الرمز</label>
                          <Input
                            value={newLevel.code || ''}
                            onChange={(e) => setNewLevel({...newLevel, code: e.target.value})}
                            placeholder="GDR"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">المستوى الأعلى</label>
                        <Select value={newLevel.parentId || ''} onValueChange={(value) => setNewLevel({...newLevel, parentId: value || undefined})}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المستوى الأعلى (اختياري)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">بدون مستوى أعلى</SelectItem>
                            {organizationalLevels.map(level => (
                              <SelectItem key={level.id} value={level.id}>
                                {level.nameAr} ({getTypeLabel(level.type)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">الموقع</label>
                          <Input
                            value={newLevel.location || ''}
                            onChange={(e) => setNewLevel({...newLevel, location: e.target.value})}
                            placeholder="صنعاء - اليمن"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">عدد الموظفين</label>
                          <Input
                            type="number"
                            value={newLevel.employeeCount || ''}
                            onChange={(e) => setNewLevel({...newLevel, employeeCount: parseInt(e.target.value) || undefined})}
                            placeholder="150"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">الكلمات المفتاحية (مفصولة بفواصل)</label>
                        <Input
                          value={newLevel.keywords?.join(', ') || ''}
                          onChange={(e) => setNewLevel({...newLevel, keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)})}
                          placeholder="طرق، تطوير، صيانة، بنية تحتية"
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button onClick={handleAddLevel} className="flex-1">
                          حفظ المستوى التنظيمي
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddLevelDialog(false)} className="flex-1">
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* شجرة الهيكل التنظيمي */}
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>الهيكل التنظيمي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      {renderOrganizationalTree(organizationalLevels)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* تفاصيل المستوى المحدد */}
              <div>
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>تفاصيل المستوى المحدد</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedLevel ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{selectedLevel.nameAr}</h3>
                          <p className="text-gray-600">{selectedLevel.name}</p>
                          <Badge variant="outline" className="mt-2">
                            {getTypeLabel(selectedLevel.type)}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>الرمز:</span>
                            <span className="font-medium">{selectedLevel.code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>المستوى:</span>
                            <span className="font-medium">{selectedLevel.level}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>الحالة:</span>
                            <Badge variant={selectedLevel.isActive ? 'default' : 'secondary'}>
                              {selectedLevel.isActive ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </div>
                          {selectedLevel.employeeCount && (
                            <div className="flex justify-between">
                              <span>عدد الموظفين:</span>
                              <span className="font-medium">{selectedLevel.employeeCount}</span>
                            </div>
                          )}
                          {selectedLevel.location && (
                            <div className="flex justify-between">
                              <span>الموقع:</span>
                              <span className="font-medium">{selectedLevel.location}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">المسؤوليات ({selectedLevel.responsibilities.length})</h4>
                          <div className="space-y-1">
                            {selectedLevel.responsibilities.slice(0, 3).map(resp => (
                              <div key={resp.id} className="text-sm p-2 bg-gray-50 rounded">
                                {resp.titleAr}
                              </div>
                            ))}
                            {selectedLevel.responsibilities.length > 3 && (
                              <p className="text-xs text-gray-500">
                                وعدد {selectedLevel.responsibilities.length - 3} مسؤوليات أخرى...
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">المستويات الوظيفية ({selectedLevel.jobLevels.length})</h4>
                          <div className="space-y-1">
                            {selectedLevel.jobLevels.slice(0, 3).map(job => (
                              <div key={job.id} className="text-sm p-2 bg-blue-50 rounded">
                                {job.titleAr} (درجة {job.grade})
                              </div>
                            ))}
                            {selectedLevel.jobLevels.length > 3 && (
                              <p className="text-xs text-gray-500">
                                وعدد {selectedLevel.jobLevels.length - 3} مستويات أخرى...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        اختر مستوى تنظيمي لعرض التفاصيل
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* إدارة المستويات الوظيفية */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة المستويات الوظيفية</h2>
              <Dialog open={showAddJobLevelDialog} onOpenChange={setShowAddJobLevelDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700" disabled={!selectedLevel}>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة مستوى وظيفي
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>إضافة مستوى وظيفي جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">المسمى الوظيفي (عربي)</label>
                        <Input
                          value={newJobLevel.titleAr || ''}
                          onChange={(e) => setNewJobLevel({...newJobLevel, titleAr: e.target.value})}
                          placeholder="المدير العام"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">المسمى الوظيفي (إنجليزي)</label>
                        <Input
                          value={newJobLevel.title || ''}
                          onChange={(e) => setNewJobLevel({...newJobLevel, title: e.target.value})}
                          placeholder="General Manager"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">الدرجة (1-15)</label>
                        <Input
                          type="number"
                          min="1"
                          max="15"
                          value={newJobLevel.grade || ''}
                          onChange={(e) => setNewJobLevel({...newJobLevel, grade: parseInt(e.target.value) || 1})}
                          placeholder="13"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">الفئة</label>
                        <Select value={newJobLevel.category} onValueChange={(value) => setNewJobLevel({...newJobLevel, category: value as any})}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="executive">تنفيذية</SelectItem>
                            <SelectItem value="supervisory">إشرافية</SelectItem>
                            <SelectItem value="technical">تقنية</SelectItem>
                            <SelectItem value="administrative">إدارية</SelectItem>
                            <SelectItem value="support">دعم</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ساعات العمل</label>
                        <Input
                          type="number"
                          value={newJobLevel.workingHours || ''}
                          onChange={(e) => setNewJobLevel({...newJobLevel, workingHours: parseInt(e.target.value) || 40})}
                          placeholder="40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">الراتب الأدنى (ريال)</label>
                        <Input
                          type="number"
                          value={newJobLevel.salary?.minimum || ''}
                          onChange={(e) => setNewJobLevel({
                            ...newJobLevel, 
                            salary: {...newJobLevel.salary!, minimum: parseInt(e.target.value) || 0}
                          })}
                          placeholder="300000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">الراتب الأعلى (ريال)</label>
                        <Input
                          type="number"
                          value={newJobLevel.salary?.maximum || ''}
                          onChange={(e) => setNewJobLevel({
                            ...newJobLevel, 
                            salary: {...newJobLevel.salary!, maximum: parseInt(e.target.value) || 0}
                          })}
                          placeholder="400000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">المسؤوليات (مفصولة بفواصل)</label>
                      <Textarea
                        value={newJobLevel.responsibilities?.join(', ') || ''}
                        onChange={(e) => setNewJobLevel({
                          ...newJobLevel, 
                          responsibilities: e.target.value.split(',').map(r => r.trim()).filter(r => r)
                        })}
                        placeholder="إدارة القسم، اتخاذ القرارات، الإشراف على الموظفين"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">المؤهلات المطلوبة (مفصولة بفواصل)</label>
                      <Textarea
                        value={newJobLevel.requiredQualifications?.join(', ') || ''}
                        onChange={(e) => setNewJobLevel({
                          ...newJobLevel, 
                          requiredQualifications: e.target.value.split(',').map(q => q.trim()).filter(q => q)
                        })}
                        placeholder="بكالوريوس هندسة، ماجستير إدارة أعمال، شهادات مهنية"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newJobLevel.isLeadership || false}
                          onChange={(e) => setNewJobLevel({...newJobLevel, isLeadership: e.target.checked})}
                        />
                        <span>منصب قيادي</span>
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={handleAddJobLevel} className="flex-1">
                        حفظ المستوى الوظيفي
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddJobLevelDialog(false)} className="flex-1">
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {!selectedLevel ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-8 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">اختر مستوى تنظيمي</h3>
                  <p className="text-gray-500">يرجى اختيار مستوى تنظيمي من التبويب الأول لعرض وإدارة المستويات الوظيفية</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>المستويات الوظيفية في {selectedLevel.nameAr}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLevel.jobLevels.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      لا توجد مستويات وظيفية محددة بعد
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedLevel.jobLevels.map(job => (
                        <div key={job.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{job.titleAr}</h3>
                              <p className="text-gray-600">{job.title}</p>
                              
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">درجة {job.grade}</Badge>
                                <Badge variant="outline">{job.category}</Badge>
                                {job.isLeadership && <Badge variant="default">قيادي</Badge>}
                              </div>
                              
                              <div className="mt-3 space-y-1">
                                <div className="text-sm">
                                  <strong>الراتب:</strong> {job.salary.minimum.toLocaleString()} - {job.salary.maximum.toLocaleString()} {job.salary.currency}
                                </div>
                                <div className="text-sm">
                                  <strong>ساعات العمل:</strong> {job.workingHours} ساعة أسبوعياً
                                </div>
                                <div className="text-sm">
                                  <strong>سنوات الخبرة:</strong> {job.requiredExperience} سنة
                                </div>
                              </div>
                              
                              {job.responsibilities.length > 0 && (
                                <div className="mt-3">
                                  <strong className="text-sm">المسؤوليات:</strong>
                                  <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                                    {job.responsibilities.slice(0, 3).map((resp, index) => (
                                      <li key={index}>{resp}</li>
                                    ))}
                                    {job.responsibilities.length > 3 && (
                                      <li>وعدد {job.responsibilities.length - 3} مسؤوليات أخرى...</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* تعيين المهام */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">أتمتة تعيين المهام</h2>
              <Dialog open={showTaskAssignmentDialog} onOpenChange={setShowTaskAssignmentDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Target className="h-4 w-4 mr-2" />
                    تعيين مهمة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>تعيين مهمة جديدة تلقائياً</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">عنوان المهمة</label>
                        <Input
                          value={newTaskAssignment.title || ''}
                          onChange={(e) => setNewTaskAssignment({...newTaskAssignment, title: e.target.value})}
                          placeholder="صيانة طريق صنعاء - تعز"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">نوع المهمة</label>
                        <Select value={newTaskAssignment.type} onValueChange={(value) => setNewTaskAssignment({...newTaskAssignment, type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المهمة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="construction">إنشاء</SelectItem>
                            <SelectItem value="maintenance">صيانة</SelectItem>
                            <SelectItem value="planning">تخطيط</SelectItem>
                            <SelectItem value="inspection">تفتيش</SelectItem>
                            <SelectItem value="consultation">استشارة</SelectItem>
                            <SelectItem value="coordination">تنسيق</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">وصف المهمة</label>
                      <Textarea
                        value={newTaskAssignment.description || ''}
                        onChange={(e) => setNewTaskAssignment({...newTaskAssignment, description: e.target.value})}
                        placeholder="وصف تفصيلي للمهمة والمتطلبات..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">القطاع</label>
                        <Select value={newTaskAssignment.sector} onValueChange={(value) => setNewTaskAssignment({...newTaskAssignment, sector: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القطاع" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transport">النقل</SelectItem>
                            <SelectItem value="public_works">الأشغال العامة</SelectItem>
                            <SelectItem value="urban_planning">التخطيط العمراني</SelectItem>
                            <SelectItem value="infrastructure">البنية التحتية</SelectItem>
                            <SelectItem value="environment">البيئة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">الأولوية</label>
                        <Select value={newTaskAssignment.priority} onValueChange={(value) => setNewTaskAssignment({...newTaskAssignment, priority: value as any})}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الأولوية" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">منخفضة</SelectItem>
                            <SelectItem value="medium">متوسطة</SelectItem>
                            <SelectItem value="high">عالية</SelectItem>
                            <SelectItem value="urgent">عاجل</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">التعقيد</label>
                        <Select value={newTaskAssignment.complexity} onValueChange={(value) => setNewTaskAssignment({...newTaskAssignment, complexity: value as any})}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مستوى التعقيد" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">بسيط</SelectItem>
                            <SelectItem value="moderate">متوسط</SelectItem>
                            <SelectItem value="complex">معقد</SelectItem>
                            <SelectItem value="critical">بالغ التعقيد</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">الموقع</label>
                        <Input
                          value={newTaskAssignment.location || ''}
                          onChange={(e) => setNewTaskAssignment({...newTaskAssignment, location: e.target.value})}
                          placeholder="صنعاء"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">الميزانية (ريال)</label>
                        <Input
                          type="number"
                          value={newTaskAssignment.budget || ''}
                          onChange={(e) => setNewTaskAssignment({...newTaskAssignment, budget: parseInt(e.target.value) || undefined})}
                          placeholder="1000000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">الكلمات المفتاحية (مفصولة بفواصل)</label>
                      <Input
                        value={newTaskAssignment.keywords?.join(', ') || ''}
                        onChange={(e) => setNewTaskAssignment({
                          ...newTaskAssignment, 
                          keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                        })}
                        placeholder="طريق، صيانة، أسفلت، إصلاح"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">المهارات المطلوبة (مفصولة بفواصل)</label>
                      <Input
                        value={newTaskAssignment.requiredSkills?.join(', ') || ''}
                        onChange={(e) => setNewTaskAssignment({
                          ...newTaskAssignment, 
                          requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        })}
                        placeholder="هندسة مدنية، إدارة مشاريع، مساحة"
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={handleTaskAssignment} className="flex-1">
                        تعيين المهمة تلقائياً
                      </Button>
                      <Button variant="outline" onClick={() => setShowTaskAssignmentDialog(false)} className="flex-1">
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* نتيجة تعيين المهمة */}
            {assignmentResult && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {assignmentResult.assigned ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                    نتيجة تعيين المهمة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${assignmentResult.assigned ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                      <p className="font-medium">{assignmentResult.message}</p>
                      {assignmentResult.confidence && (
                        <p className="text-sm mt-2">
                          درجة الثقة: {Math.round(assignmentResult.confidence * 100)}%
                        </p>
                      )}
                    </div>

                    {assignmentResult.assigned && assignmentResult.nextSteps && (
                      <div>
                        <h4 className="font-medium mb-3">الخطوات التالية:</h4>
                        <div className="space-y-3">
                          {assignmentResult.nextSteps.map(step => (
                            <div key={step.step} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {step.step}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium">{step.title}</h5>
                                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                                <div className="flex justify-between mt-2 text-xs text-gray-500">
                                  <span>المسؤول: {step.responsible}</span>
                                  <span>المدة المتوقعة: {step.estimatedTime}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {assignmentResult.recommendedActions && assignmentResult.recommendedActions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">الإجراءات الموصى بها:</h4>
                        <ul className="space-y-1">
                          {assignmentResult.recommendedActions.map((action, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {assignmentResult.riskFactors && assignmentResult.riskFactors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">عوامل المخاطرة:</h4>
                        <div className="space-y-2">
                          {assignmentResult.riskFactors.map((risk, index) => (
                            <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium">{risk.type}</span>
                                <div className="flex gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    احتمالية: {risk.probability}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    تأثير: {risk.impact}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                              <div className="text-xs">
                                <strong>التخفيف:</strong> {risk.mitigation.join('، ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      onClick={() => setAssignmentResult(null)}
                      className="w-full"
                    >
                      إغلاق النتيجة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>دليل أتمتة المهام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">كيف يعمل النظام:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        تحليل نوع المهمة والقطاع
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        مطابقة المسؤوليات والاختصاصات
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        تقييم مستوى السلطة المطلوب
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        حساب درجة الثقة في التعيين
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        إنشاء خطة تنفيذ مفصلة
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">العوامل المؤثرة:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        نوع المهمة ومستوى التعقيد
                      </li>
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        القطاع والموقع الجغرافي
                      </li>
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        الأولوية والإطار الزمني
                      </li>
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        الميزانية والموارد المطلوبة
                      </li>
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        المهارات والخبرات المطلوبة
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* التحليلات */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">تحليلات الهيكل التنظيمي</h2>
            
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>التوزيع حسب النوع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(statistics.levelsByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span>{getTypeLabel(type)}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>التوزيع حسب المستوى</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(statistics.levelDistribution).map(([level, count]) => (
                        <div key={level} className="flex justify-between items-center">
                          <span>المستوى {level}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>الإحصائيات العامة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>متوسط الموظفين</span>
                        <Badge variant="outline">
                          {Math.round(statistics.averageEmployeesPerLevel)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الميزانية الإجمالية</span>
                        <Badge variant="outline">
                          {(statistics.totalBudget / 1000000).toFixed(1)}م ريال
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>معدل النشاط</span>
                        <Badge variant="outline">
                          {Math.round((statistics.activeEntities / statistics.totalOrganizationalLevels) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* التقارير */}
          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-2xl font-bold">تقارير الكفاءة التنظيمية</h2>
            
            {efficiencyReport && (
              <div className="space-y-6">
                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-6 w-6" />
                      الصحة التنظيمية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${
                          efficiencyReport.organizationalHealth.score >= 80 ? 'text-green-600' :
                          efficiencyReport.organizationalHealth.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {efficiencyReport.organizationalHealth.score}%
                        </div>
                        <p className="text-sm text-gray-600">النتيجة الإجمالية</p>
                      </div>
                      <div className="flex-1">
                        <div className={`h-4 bg-gray-200 rounded-full overflow-hidden`}>
                          <div 
                            className={`h-full transition-all duration-500 ${
                              efficiencyReport.organizationalHealth.score >= 80 ? 'bg-green-600' :
                              efficiencyReport.organizationalHealth.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{width: `${efficiencyReport.organizationalHealth.score}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {efficiencyReport.organizationalHealth.factors.map((factor: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{factor.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              factor.status === 'ممتاز' ? 'default' :
                              factor.status === 'جيد' ? 'secondary' : 'destructive'
                            }>
                              {factor.status}
                            </Badge>
                            <span className="text-sm text-gray-600">{factor.score}/25</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="text-green-600">نقاط القوة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {efficiencyReport.strengths.map((strength: string, index: number) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0">
                    <CardHeader>
                      <CardTitle className="text-red-600">نقاط الضعف</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {efficiencyReport.weaknesses.map((weakness: string, index: number) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>التوصيات للتحسين</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {efficiencyReport.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>الفرص المستقبلية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {efficiencyReport.opportunities.map((opportunity: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          {opportunity}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}