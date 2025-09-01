import express from 'express';
import { authenticateToken } from './working-auth';
import { STANDARD_PERMISSIONS, STANDARD_ROLES } from '../../shared/rbac-schema';

const router = express.Router();

// Middleware للتحقق من صلاحية الإدارة
const requireAdminRole = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'صلاحية الإدارة مطلوبة للوصول لهذا المورد'
    });
  }
  next();
};

// الوحدات التنظيمية
router.get('/org-units', authenticateToken, (req: any, res) => {
  const orgUnits = [
    {
      id: 'hq',
      name: 'المقر الرئيسي',
      nameEn: 'Headquarters',
      type: 'headquarters',
      parentId: null,
      level: 1,
      isActive: true,
      children: [
        {
          id: 'sector_technical',
          name: 'القطاع الفني',
          nameEn: 'Technical Sector',
          type: 'sector',
          parentId: 'hq',
          level: 2,
          isActive: true,
          children: [
            {
              id: 'dept_technical_buildings',
              name: 'إدارة الشؤون الفنية والمباني',
              nameEn: 'Technical Affairs and Buildings Department',
              type: 'department',
              parentId: 'sector_technical',
              level: 3,
              isActive: true
            },
            {
              id: 'dept_surveying',
              name: 'إدارة المساحة',
              nameEn: 'Surveying Department',
              type: 'department',
              parentId: 'sector_technical',
              level: 3,
              isActive: true
            }
          ]
        },
        {
          id: 'sector_inspection',
          name: 'قطاع التفتيش والرقابة',
          nameEn: 'Inspection and Control Sector',
          type: 'sector',
          parentId: 'hq',
          level: 2,
          isActive: true,
          children: [
            {
              id: 'dept_inspection',
              name: 'إدارة التفتيش',
              nameEn: 'Inspection Department',
              type: 'department',
              parentId: 'sector_inspection',
              level: 3,
              isActive: true
            }
          ]
        },
        {
          id: 'sector_branches',
          name: 'فروع المديريات',
          nameEn: 'District Branches',
          type: 'sector',
          parentId: 'hq',
          level: 2,
          isActive: true,
          children: [
            {
              id: 'branch_sana_old_city',
              name: 'فرع مديرية أمانة العاصمة - الصافية',
              nameEn: 'Old Sana\'a District Branch',
              type: 'branch',
              parentId: 'sector_branches',
              level: 3,
              districtId: 'district_sana_old_city',
              isActive: true
            },
            {
              id: 'branch_sana_center',
              name: 'فرع مديرية أمانة العاصمة - الوسط',
              nameEn: 'Central Sana\'a District Branch',
              type: 'branch',
              parentId: 'sector_branches',
              level: 3,
              districtId: 'district_sana_center',
              isActive: true
            }
          ]
        }
      ]
    }
  ];

  res.json({
    success: true,
    orgUnits
  });
});

// الأدوار
router.get('/roles', authenticateToken, (req: any, res) => {
  const roles = Object.entries(STANDARD_ROLES).map(([code, role]) => ({
    id: code,
    code,
    name: role.name,
    level: role.level,
    category: role.category,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  res.json({
    success: true,
    roles
  });
});

// الصلاحيات
router.get('/permissions', authenticateToken, (req: any, res) => {
  const permissions: any[] = [];
  
  Object.entries(STANDARD_PERMISSIONS).forEach(([domain, perms]) => {
    Object.entries(perms).forEach(([code, name]) => {
      const [domainName, action] = code.split('.').slice(-2);
      permissions.push({
        id: code,
        code,
        name,
        domain: domain.toLowerCase(),
        action,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  });

  res.json({
    success: true,
    permissions
  });
});

// مصفوفة الأدوار والصلاحيات
router.get('/role-permissions', authenticateToken, requireAdminRole, (req: any, res) => {
  // مصفوفة مبسطة للتوضيح - يجب استخدام قاعدة البيانات في الإنتاج
  const rolePermissions = [
    {
      roleCode: 'admin.general_director',
      permissions: Object.keys(STANDARD_PERMISSIONS.ADMINISTRATION).concat(
        Object.keys(STANDARD_PERMISSIONS.SURVEY_DECISIONS),
        Object.keys(STANDARD_PERMISSIONS.BUILDING_PERMITS),
        Object.keys(STANDARD_PERMISSIONS.INSPECTIONS)
      )
    },
    {
      roleCode: 'management.survey_director',
      permissions: Object.keys(STANDARD_PERMISSIONS.SURVEY_DECISIONS).concat([
        'admin.users.view',
        'admin.reports.view'
      ])
    },
    {
      roleCode: 'technical.surveyor',
      permissions: [
        'surveys.decisions.view',
        'surveys.decisions.create',
        'surveys.decisions.edit'
      ]
    },
    {
      roleCode: 'technical.inspector',
      permissions: Object.keys(STANDARD_PERMISSIONS.INSPECTIONS)
    }
  ];

  res.json({
    success: true,
    rolePermissions
  });
});

// تعيينات المستخدمين
router.get('/user-assignments', authenticateToken, requireAdminRole, (req: any, res) => {
  const userAssignments = [
    {
      id: '1',
      userId: '1',
      roleId: 'admin.general_director',
      orgUnitId: 'hq',
      scope: 'global',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      userId: '2',
      roleId: 'technical.surveyor',
      orgUnitId: 'dept_surveying',
      scope: 'departmental',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      userId: '3',
      roleId: 'technical.inspector',
      orgUnitId: 'dept_inspection',
      scope: 'departmental',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      userId: '4',
      roleId: 'technical.engineer',
      orgUnitId: 'dept_technical_buildings',
      scope: 'departmental',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    userAssignments
  });
});

// إنشاء تعيين مستخدم جديد
router.post('/user-assignments', authenticateToken, requireAdminRole, (req: any, res) => {
  const { userId, roleId, orgUnitId, scope, districtId, entityId, endDate } = req.body;

  // التحقق من صحة البيانات
  if (!userId || !roleId || !orgUnitId || !scope) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'البيانات المطلوبة: userId, roleId, orgUnitId, scope'
    });
  }

  const newAssignment = {
    id: Date.now().toString(),
    userId,
    roleId,
    orgUnitId,
    scope,
    districtId: districtId || null,
    entityId: entityId || null,
    startDate: new Date().toISOString(),
    endDate: endDate || null,
    isActive: true,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    assignment: newAssignment,
    message: 'تم إنشاء التعيين بنجاح'
  });
});

// التحقق من صلاحيات المستخدم
router.post('/check-permission', authenticateToken, (req: any, res) => {
  const { permission, scope, resourceId } = req.body;

  // منطق مبسط للتحقق من الصلاحيات
  // في الإنتاج، يجب استخدام قاعدة البيانات ونظام RBAC متكامل
  let hasPermission = false;

  if (req.user.role === 'admin') {
    hasPermission = true; // المدير العام له جميع الصلاحيات
  } else if (req.user.role === 'surveyor' && permission.startsWith('surveys.')) {
    hasPermission = true;
  } else if (req.user.role === 'inspector' && permission.startsWith('inspections.')) {
    hasPermission = true;
  } else if (req.user.role === 'engineer' && permission.startsWith('permits.building.')) {
    hasPermission = true;
  }

  res.json({
    success: true,
    hasPermission,
    user: {
      id: req.user.id,
      role: req.user.role
    },
    permission,
    scope: scope || 'departmental'
  });
});

// سجلات التدقيق
router.get('/audit-logs', authenticateToken, requireAdminRole, (req: any, res) => {
  const { page = 1, limit = 50, userId, action, dateFrom, dateTo } = req.query;

  // بيانات تجريبية لسجلات التدقيق
  const auditLogs = [
    {
      id: '1',
      userId: '1',
      userName: 'مدير النظام',
      action: 'surveys.decisions.approve',
      resource: 'survey_decision',
      resourceId: 'SD-2024-001',
      success: true,
      ipAddress: '192.168.1.100',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      userId: '2',
      userName: 'أحمد المساح',
      action: 'surveys.decisions.create',
      resource: 'survey_decision',
      resourceId: 'SD-2024-002',
      success: true,
      ipAddress: '192.168.1.101',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    }
  ];

  res.json({
    success: true,
    auditLogs,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: auditLogs.length,
      totalPages: 1
    }
  });
});

export default router;