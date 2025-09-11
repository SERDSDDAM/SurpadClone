import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  Users, 
  Settings,
  Eye,
  Edit,
  Plus,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Crown,
  Building2,
  HardHat,
  ClipboardCheck,
  Map,
  UserCheck,
  LogOut,
  Bell
} from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

// Role and Permission definitions from shared/permissions.ts
const roleDefinitions = {
  "citizen": { name: "مواطن", icon: User, color: "bg-blue-500" },
  "engineer_owner": { name: "صاحب مكتب هندسي", icon: Crown, color: "bg-purple-500" },
  "engineer_staff": { name: "موظف مكتب هندسي", icon: Building2, color: "bg-green-500" },
  "contractor_owner": { name: "صاحب شركة مقاولات", icon: HardHat, color: "bg-orange-500" },
  "contractor_staff": { name: "موظف شركة مقاولات", icon: HardHat, color: "bg-yellow-500" },
  "inspector": { name: "مفتش حكومي", icon: ClipboardCheck, color: "bg-red-500" },
  "surveyor": { name: "مساح حكومي", icon: Map, color: "bg-teal-500" },
  "admin": { name: "مدير النظام", icon: Shield, color: "bg-gray-700" },
  "manager": { name: "مدير إدارة", icon: UserCheck, color: "bg-indigo-500" },
  "super_admin": { name: "مدير أعلى", icon: Crown, color: "bg-black" }
};

const permissionCategories = {
  "citizen": [
    "citizen.view_services",
    "citizen.submit_building_permit", 
    "citizen.view_own_requests",
    "citizen.upload_documents",
    "citizen.pay_fees",
    "citizen.schedule_inspection",
    "citizen.view_certificates"
  ],
  "engineering": [
    "engineer.view_clients",
    "engineer.submit_professional_applications",
    "engineer.review_plans",
    "engineer.sign_documents",
    "engineer.manage_staff",
    "engineer.assign_projects",
    "engineer.approve_designs",
    "engineer.view_office_statistics",
    "engineer_staff.view_assigned_projects",
    "engineer_staff.edit_drawings",
    "engineer_staff.submit_calculations",
    "engineer_staff.communicate_clients"
  ],
  "contractor": [
    "contractor.view_projects",
    "contractor.submit_bids",
    "contractor.manage_workers",
    "contractor.update_progress",
    "contractor.request_payments",
    "contractor.view_contracts",
    "contractor.manage_subcontractors"
  ],
  "government": [
    "inspector.view_assigned_inspections",
    "inspector.conduct_inspection",
    "inspector.approve_inspection",
    "inspector.reject_inspection",
    "inspector.schedule_reinspection",
    "inspector.generate_reports",
    "inspector.access_field_app",
    "inspector.update_inspection_status",
    "surveyor.view_survey_requests",
    "surveyor.conduct_survey",
    "surveyor.use_gps_tools",
    "surveyor.generate_survey_reports",
    "surveyor.approve_coordinates",
    "surveyor.access_field_app",
    "surveyor.export_survey_data"
  ],
  "admin": [
    "admin.manage_users",
    "admin.manage_roles",
    "admin.view_all_data",
    "admin.system_configuration",
    "admin.generate_reports",
    "admin.manage_fees",
    "admin.approve_licenses",
    "admin.system_audit",
    "admin.manage_integrations",
    "admin.backup_restore",
    "manager.view_department_data",
    "manager.approve_requests",
    "manager.assign_inspectors",
    "manager.view_statistics",
    "manager.manage_department_staff"
  ]
};

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState("matrix");
  const [selectedRole, setSelectedRole] = useState("citizen");
  const [searchTerm, setSearchTerm] = useState("");
  const [simulationUser, setSimulationUser] = useState("");

  // Mock data for users
  const users = [
    { id: "1", name: "محمد أحمد علي", role: "citizen", email: "m.ahmed@email.com", lastLogin: "2025-01-27", status: "active" },
    { id: "2", name: "سارة محمد", role: "engineer_owner", email: "s.mohammed@eng.com", lastLogin: "2025-01-27", status: "active" },
    { id: "3", name: "أحمد الفقيه", role: "inspector", email: "a.alfaqih@gov.ye", lastLogin: "2025-01-26", status: "active" },
    { id: "4", name: "علي حسن", role: "surveyor", email: "a.hassan@gov.ye", lastLogin: "2025-01-25", status: "inactive" }
  ];

  // Mock permissions matrix
  const [permissionsMatrix, setPermissionsMatrix] = useState({
    "citizen": ["citizen.view_services", "citizen.submit_building_permit", "citizen.view_own_requests"],
    "engineer_owner": ["engineer.view_clients", "engineer.manage_staff", "engineer.approve_designs"],
    "inspector": ["inspector.view_assigned_inspections", "inspector.conduct_inspection", "inspector.approve_inspection"],
    "admin": ["admin.manage_users", "admin.manage_roles", "admin.view_all_data"]
  });

  const togglePermission = (role: string, permission: string) => {
    setPermissionsMatrix(prev => {
      const rolePerms = prev[role] || [];
      const hasPermission = rolePerms.includes(permission);
      
      return {
        ...prev,
        [role]: hasPermission 
          ? rolePerms.filter(p => p !== permission)
          : [...rolePerms, permission]
      };
    });
  };

  const getPermissionName = (permission: string) => {
    const names = {
      "citizen.view_services": "عرض الخدمات",
      "citizen.submit_building_permit": "تقديم رخصة بناء",
      "citizen.view_own_requests": "عرض الطلبات الخاصة",
      "citizen.upload_documents": "رفع المستندات",
      "citizen.pay_fees": "دفع الرسوم",
      "engineer.view_clients": "عرض العملاء",
      "engineer.manage_staff": "إدارة الموظفين",
      "engineer.approve_designs": "اعتماد التصاميم",
      "inspector.view_assigned_inspections": "عرض التفتيشات المخصصة",
      "inspector.conduct_inspection": "إجراء التفتيش",
      "inspector.approve_inspection": "اعتماد التفتيش",
      "admin.manage_users": "إدارة المستخدمين",
      "admin.manage_roles": "إدارة الأدوار",
      "admin.view_all_data": "عرض جميع البيانات"
    };
    return names[permission] || permission;
  };

  const getRoleIcon = (role: string) => {
    const roleData = roleDefinitions[role];
    if (roleData) {
      const IconComponent = roleData.icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  const getRoleName = (role: string) => {
    return roleDefinitions[role]?.name || role;
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="default" className="bg-green-100 text-green-800">نشط</Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">غير نشط</Badge>
    );
  };

  const filteredUsers = users.filter(user => 
    user.name.includes(searchTerm) || 
    user.email.includes(searchTerm) ||
    getRoleName(user.role).includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">إدارة الأدوار والصلاحيات</h1>
                <p className="text-sm text-gray-600">نظام RBAC المتقدم</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="matrix">مصفوفة الصلاحيات</TabsTrigger>
            <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
            <TabsTrigger value="simulation">محاكاة المستخدم</TabsTrigger>
            <TabsTrigger value="audit">سجل المراجعة</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  مصفوفة الأدوار والصلاحيات
                </CardTitle>
                <CardDescription>
                  إدارة مرئية لجميع الصلاحيات المخصصة لكل دور في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-3 text-right font-medium">الصلاحية</th>
                        {Object.keys(roleDefinitions).map(role => (
                          <th key={role} className="border border-gray-200 p-3 text-center min-w-[120px]">
                            <div className="flex flex-col items-center gap-1">
                              {getRoleIcon(role)}
                              <span className="text-xs">{getRoleName(role)}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(permissionCategories).map(([category, permissions]) => (
                        permissions.map((permission, index) => (
                          <tr key={permission} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="border border-gray-200 p-3 font-medium">
                              {getPermissionName(permission)}
                              <div className="text-xs text-gray-500 mt-1">{permission}</div>
                            </td>
                            {Object.keys(roleDefinitions).map(role => (
                              <td key={role} className="border border-gray-200 p-3 text-center">
                                <Checkbox
                                  checked={permissionsMatrix[role]?.includes(permission) || false}
                                  onCheckedChange={() => togglePermission(role, permission)}
                                  className="mx-auto"
                                />
                              </td>
                            ))}
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    حفظ التغييرات
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    إلغاء التغييرات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      إدارة المستخدمين
                    </CardTitle>
                    <CardDescription>
                      عرض وإدارة جميع المستخدمين وأدوارهم في النظام
                    </CardDescription>
                  </div>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة مستخدم جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="البحث في المستخدمين..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    تصفية
                  </Button>
                </div>

                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {getRoleIcon(user.role)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{user.name}</h4>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {getRoleName(user.role)}
                                </Badge>
                                {getStatusBadge(user.status)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-left text-sm text-gray-500">
                              <p>آخر دخول: {user.lastLogin}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <Trash2 className="h-3 w-3" />
                              </Button>
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

          <TabsContent value="simulation" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  محاكاة المستخدم
                </CardTitle>
                <CardDescription>
                  عرض النظام من منظور أي مستخدم آخر لتشخيص مشاكل الصلاحيات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>تحذير أمني:</strong> محاكاة المستخدم تتيح عرض النظام للقراءة فقط. 
                    جميع الإجراءات محظورة في وضع المحاكاة لضمان الأمان.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">اختر المستخدم للمحاكاة:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {users.map((user) => (
                        <Card 
                          key={user.id} 
                          className={`cursor-pointer transition-all ${
                            simulationUser === user.id ? 'border-purple-500 bg-purple-50' : 'hover:border-gray-300'
                          }`}
                          onClick={() => setSimulationUser(user.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                {getRoleIcon(user.role)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-gray-600">{getRoleName(user.role)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {simulationUser && (
                    <div className="border-t pt-4">
                      <div className="flex gap-4">
                        <Button className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          بدء المحاكاة (وضع القراءة فقط)
                        </Button>
                        <Button variant="outline">
                          إيقاف المحاكاة
                        </Button>
                      </div>
                      
                      <Alert className="mt-4 border-purple-200 bg-purple-50">
                        <Eye className="h-4 w-4 text-purple-600" />
                        <AlertDescription className="text-purple-800">
                          ستتمكن من رؤية النظام تماماً كما يراه المستخدم المحدد، 
                          مع جميع الصلاحيات والقيود المطبقة عليه.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-green-600" />
                  سجل مراجعة الصلاحيات
                </CardTitle>
                <CardDescription>
                  تتبع جميع التغييرات على الأدوار والصلاحيات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>سيتم تطوير سجل المراجعة التفصيلي قريباً</p>
                  <p className="text-sm">لعرض جميع التغييرات على الصلاحيات مع التواريخ والمسؤولين</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}