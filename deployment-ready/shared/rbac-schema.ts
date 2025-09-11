import { z } from 'zod';

// Organization Units (الوحدات التنظيمية)
export const OrgUnit = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
  type: z.enum(['headquarters', 'sector', 'department', 'section', 'branch']),
  parentId: z.string().nullable(),
  level: z.number(),
  districtId: z.string().optional(), // للفروع
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Roles (الأدوار)
export const Role = z.object({
  id: z.string(),
  code: z.string(), // مثل admin.general_director
  name: z.string(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['executive', 'management', 'technical', 'administrative', 'field']),
  level: z.number(), // مستوى الصلاحية 1-10
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Permissions (الصلاحيات)
export const Permission = z.object({
  id: z.string(),
  code: z.string(), // مثل permits.build.issue
  name: z.string(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  domain: z.string(), // المجال: permits, surveys, inspections, etc
  action: z.string(), // الإجراء: create, read, update, delete, approve, etc
  resource: z.string().optional(), // المورد المحدد
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Role Permissions (صلاحيات الأدوار)
export const RolePermission = z.object({
  id: z.string(),
  roleId: z.string(),
  permissionId: z.string(),
  scope: z.enum(['global', 'organizational', 'departmental', 'district', 'entity']),
  constraints: z.string().optional(), // JSON للقيود الإضافية
  createdAt: z.date()
});

// User Assignments (تعيينات المستخدمين)
export const UserAssignment = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  orgUnitId: z.string(),
  scope: z.enum(['global', 'organizational', 'departmental', 'district', 'entity']),
  districtId: z.string().optional(),
  entityId: z.string().optional(), // للمنشآت/المكاتب المحددة
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Delegations (التفويضات)
export const Delegation = z.object({
  id: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  roleId: z.string(),
  orgUnitId: z.string(),
  scope: z.enum(['specific_services', 'specific_district', 'specific_entity']),
  services: z.array(z.string()).optional(), // قائمة الخدمات المفوضة
  districtId: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
  otpVerified: z.boolean(),
  createdAt: z.date(),
  revokedAt: z.date().optional()
});

// Approval Workflows (سير العمل للموافقات)
export const ApprovalWorkflow = z.object({
  id: z.string(),
  serviceCode: z.string(), // survey_decision, building_permit, etc
  stepCode: z.string(), // review, approve, sign, etc
  stepOrder: z.number(),
  roleCode: z.string(),
  isRequired: z.boolean(),
  canSkip: z.boolean(),
  timeoutHours: z.number().optional(),
  isActive: z.boolean(),
  createdAt: z.date()
});

// Audit Logs (سجلات التدقيق)
export const AuditLog = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  oldValue: z.string().optional(), // JSON
  newValue: z.string().optional(), // JSON
  ipAddress: z.string(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  timestamp: z.date()
});

// الصلاحيات المعيارية
export const STANDARD_PERMISSIONS = {
  // صلاحيات القرار المساحي
  SURVEY_DECISIONS: {
    'surveys.decisions.view': 'عرض القرارات المساحية',
    'surveys.decisions.create': 'إنشاء قرار مساحي',
    'surveys.decisions.edit': 'تعديل القرار المساحي',
    'surveys.decisions.review': 'مراجعة القرار المساحي',
    'surveys.decisions.approve': 'اعتماد القرار المساحي',
    'surveys.decisions.sign': 'توقيع القرار المساحي',
    'surveys.decisions.cancel': 'إلغاء القرار المساحي'
  },
  
  // صلاحيات تراخيص البناء
  BUILDING_PERMITS: {
    'permits.building.view': 'عرض تراخيص البناء',
    'permits.building.create': 'إنشاء ترخيص بناء',
    'permits.building.edit': 'تعديل ترخيص البناء',
    'permits.building.review': 'مراجعة ترخيص البناء',
    'permits.building.approve': 'اعتماد ترخيص البناء',
    'permits.building.issue': 'إصدار ترخيص البناء',
    'permits.building.renew': 'تجديد ترخيص البناء',
    'permits.building.cancel': 'إلغاء ترخيص البناء'
  },
  
  // صلاحيات التفتيش
  INSPECTIONS: {
    'inspections.view': 'عرض التفتيشات',
    'inspections.create': 'إنشاء تفتيش',
    'inspections.conduct': 'تنفيذ التفتيش',
    'inspections.report': 'كتابة تقرير التفتيش',
    'inspections.approve': 'اعتماد تقرير التفتيش',
    'inspections.violations.issue': 'إصدار مخالفة',
    'inspections.violations.approve': 'اعتماد المخالفة'
  },
  
  // صلاحيات الإدارة
  ADMINISTRATION: {
    'admin.users.view': 'عرض المستخدمين',
    'admin.users.create': 'إنشاء مستخدم',
    'admin.users.edit': 'تعديل المستخدم',
    'admin.users.deactivate': 'تعطيل المستخدم',
    'admin.roles.manage': 'إدارة الأدوار',
    'admin.permissions.manage': 'إدارة الصلاحيات',
    'admin.assignments.manage': 'إدارة التعيينات',
    'admin.delegations.manage': 'إدارة التفويضات',
    'admin.audit.view': 'عرض سجلات التدقيق',
    'admin.reports.view': 'عرض التقارير الإدارية'
  }
};

// الأدوار المعيارية
export const STANDARD_ROLES = {
  // الإدارة العليا
  'admin.general_director': {
    name: 'المدير العام',
    level: 10,
    category: 'executive'
  },
  'admin.deputy_technical': {
    name: 'نائب المدير العام للشؤون الفنية',
    level: 9,
    category: 'executive'
  },
  'admin.deputy_inspection': {
    name: 'نائب المدير العام للتفتيش والرقابة',
    level: 9,
    category: 'executive'
  },
  
  // مدراء الإدارات
  'management.technical_director': {
    name: 'مدير إدارة الشؤون الفنية والمباني',
    level: 8,
    category: 'management'
  },
  'management.survey_director': {
    name: 'مدير إدارة المساحة',
    level: 8,
    category: 'management'
  },
  'management.inspection_director': {
    name: 'مدير إدارة التفتيش',
    level: 8,
    category: 'management'
  },
  
  // الموظفون الفنيون
  'technical.senior_engineer': {
    name: 'مهندس أول',
    level: 6,
    category: 'technical'
  },
  'technical.engineer': {
    name: 'مهندس',
    level: 5,
    category: 'technical'
  },
  'technical.surveyor': {
    name: 'مساح',
    level: 5,
    category: 'technical'
  },
  'technical.inspector': {
    name: 'مفتش',
    level: 5,
    category: 'technical'
  },
  
  // الموظفون الإداريون
  'administrative.clerk': {
    name: 'موظف إداري',
    level: 3,
    category: 'administrative'
  },
  'administrative.data_entry': {
    name: 'مدخل بيانات',
    level: 2,
    category: 'administrative'
  }
};

export type OrgUnitType = z.infer<typeof OrgUnit>;
export type RoleType = z.infer<typeof Role>;
export type PermissionType = z.infer<typeof Permission>;
export type RolePermissionType = z.infer<typeof RolePermission>;
export type UserAssignmentType = z.infer<typeof UserAssignment>;
export type DelegationType = z.infer<typeof Delegation>;
export type ApprovalWorkflowType = z.infer<typeof ApprovalWorkflow>;
export type AuditLogType = z.infer<typeof AuditLog>;