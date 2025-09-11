import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Shield, 
  Users, 
  Key, 
  Settings,
  Building,
  MapPin,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RolesAndPermissions() {
  const [searchTerm, setSearchTerm] = useState('');

  // جلب الأدوار
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/rbac/roles'],
    retry: false,
  });

  // جلب الصلاحيات
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/rbac/permissions'],
    retry: false,
  });

  // جلب الوحدات التنظيمية
  const { data: orgUnitsData, isLoading: orgUnitsLoading } = useQuery({
    queryKey: ['/api/rbac/org-units'],
    retry: false,
  });

  // جلب مصفوفة الأدوار والصلاحيات
  const { data: rolePermissionsData, isLoading: rolePermissionsLoading } = useQuery({
    queryKey: ['/api/rbac/role-permissions'],
    retry: false,
  });

  // جلب تعيينات المستخدمين
  const { data: userAssignmentsData, isLoading: userAssignmentsLoading } = useQuery({
    queryKey: ['/api/rbac/user-assignments'],
    retry: false,
  });

  const roles = (rolesData && 'roles' in rolesData) ? rolesData.roles : [];
  const permissions = (permissionsData && 'permissions' in permissionsData) ? permissionsData.permissions : [];
  const orgUnits = (orgUnitsData && 'orgUnits' in orgUnitsData) ? orgUnitsData.orgUnits : [];
  const rolePermissions = (rolePermissionsData && 'rolePermissions' in rolePermissionsData) ? rolePermissionsData.rolePermissions : [];
  const userAssignments = (userAssignmentsData && 'userAssignments' in userAssignmentsData) ? userAssignmentsData.userAssignments : [];

  const getRoleColor = (category: string) => {
    switch (category) {
      case 'executive': return 'bg-red-100 text-red-800';
      case 'management': return 'bg-blue-100 text-blue-800';
      case 'technical': return 'bg-green-100 text-green-800';
      case 'administrative': return 'bg-gray-100 text-gray-800';
      case 'field': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionDomainColor = (domain: string) => {
    switch (domain) {
      case 'survey_decisions': return 'bg-purple-100 text-purple-800';
      case 'building_permits': return 'bg-orange-100 text-orange-800';
      case 'inspections': return 'bg-red-100 text-red-800';
      case 'administration': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOrgTreeNode = (unit: any, level = 0) => {
    const indent = level * 20;
    return (
      <div key={unit.id}>
        <div 
          className="flex items-center p-2 hover:bg-gray-50 rounded-lg"
          style={{ marginRight: `${indent}px` }}
        >
          <div className="flex items-center flex-1">
            {unit.type === 'headquarters' && <Building className="w-4 h-4 ml-2 text-blue-600" />}
            {unit.type === 'sector' && <Shield className="w-4 h-4 ml-2 text-green-600" />}
            {unit.type === 'department' && <Users className="w-4 h-4 ml-2 text-orange-600" />}
            {unit.type === 'branch' && <MapPin className="w-4 h-4 ml-2 text-purple-600" />}
            
            <div className="flex-1">
              <div className="font-medium text-sm">{unit.name}</div>
              <div className="text-xs text-gray-500">{unit.nameEn}</div>
            </div>
            
            <Badge variant="outline" className="text-xs">
              {unit.type === 'headquarters' && 'مقر'}
              {unit.type === 'sector' && 'قطاع'}
              {unit.type === 'department' && 'إدارة'}
              {unit.type === 'branch' && 'فرع'}
            </Badge>
          </div>
        </div>
        
        {unit.children && unit.children.map((child: any) => 
          renderOrgTreeNode(child, level + 1)
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الأدوار والصلاحيات</h1>
          <p className="text-gray-600 mt-2">نظام إدارة الأدوار والصلاحيات والوحدات التنظيمية مشابه لمنصة بلدي</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            نظام RBAC متقدم
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="roles">الأدوار ({roles.length})</TabsTrigger>
          <TabsTrigger value="permissions">الصلاحيات ({permissions.length})</TabsTrigger>
          <TabsTrigger value="org-units">الوحدات التنظيمية</TabsTrigger>
          <TabsTrigger value="role-matrix">مصفوفة الأدوار</TabsTrigger>
          <TabsTrigger value="assignments">التعيينات</TabsTrigger>
        </TabsList>

        {/* الأدوار */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                الأدوار المعيارية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Input
                  placeholder="البحث في الأدوار..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              {rolesLoading ? (
                <div className="text-center py-8">جاري تحميل الأدوار...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles
                    .filter((role: any) => role.name.includes(searchTerm))
                    .map((role: any) => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-sm">{role.name}</h3>
                          <Badge className={getRoleColor(role.category)}>
                            المستوى {role.level}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          الكود: {role.code}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {role.category === 'executive' && 'تنفيذي'}
                            {role.category === 'management' && 'إداري'}
                            {role.category === 'technical' && 'فني'}
                            {role.category === 'administrative' && 'إداري'}
                            {role.category === 'field' && 'ميداني'}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {role.isActive ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-600" />
                            )}
                            {role.isActive ? 'نشط' : 'معطل'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الصلاحيات */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                الصلاحيات المعيارية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="text-center py-8">جاري تحميل الصلاحيات...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الصلاحية</TableHead>
                      <TableHead>الكود</TableHead>
                      <TableHead>المجال</TableHead>
                      <TableHead>الإجراء</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission: any) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">{permission.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {permission.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPermissionDomainColor(permission.domain)}>
                            {permission.domain}
                          </Badge>
                        </TableCell>
                        <TableCell>{permission.action}</TableCell>
                        <TableCell>
                          {permission.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* الوحدات التنظيمية */}
        <TabsContent value="org-units">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                الهيكل التنظيمي
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orgUnitsLoading ? (
                <div className="text-center py-8">جاري تحميل الهيكل التنظيمي...</div>
              ) : (
                <div className="space-y-2">
                  {orgUnits.map((unit: any) => renderOrgTreeNode(unit))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* مصفوفة الأدوار والصلاحيات */}
        <TabsContent value="role-matrix">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                مصفوفة الأدوار والصلاحيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rolePermissionsLoading ? (
                <div className="text-center py-8">جاري تحميل مصفوفة الأدوار...</div>
              ) : (
                <div className="space-y-4">
                  {rolePermissions.map((rolePermission: any) => (
                    <Card key={rolePermission.roleCode} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4" />
                        <h3 className="font-medium">
                          {roles.find((r: any) => r.code === rolePermission.roleCode)?.name || rolePermission.roleCode}
                        </h3>
                        <Badge variant="outline">
                          {rolePermission.permissions.length} صلاحية
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rolePermission.permissions.map((permissionCode: string) => {
                          const permission = permissions.find((p: any) => p.code === permissionCode);
                          return (
                            <Badge
                              key={permissionCode}
                              variant="outline"
                              className="text-xs"
                            >
                              {permission?.name || permissionCode}
                            </Badge>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* التعيينات */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                تعيينات المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAssignmentsLoading ? (
                <div className="text-center py-8">جاري تحميل التعيينات...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الوحدة التنظيمية</TableHead>
                      <TableHead>النطاق</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ الإنشاء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAssignments.map((assignment: any) => (
                      <TableRow key={assignment.id}>
                        <TableCell>مستخدم #{assignment.userId}</TableCell>
                        <TableCell>
                          {roles.find((r: any) => r.id === assignment.roleId)?.name || assignment.roleId}
                        </TableCell>
                        <TableCell>
                          {assignment.orgUnitId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {assignment.scope === 'global' && 'عام'}
                            {assignment.scope === 'organizational' && 'تنظيمي'}
                            {assignment.scope === 'departmental' && 'إداري'}
                            {assignment.scope === 'district' && 'مديرية'}
                            {assignment.scope === 'entity' && 'كيان'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {assignment.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(assignment.createdAt).toLocaleDateString('ar-YE')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}