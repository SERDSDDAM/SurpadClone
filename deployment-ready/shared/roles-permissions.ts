import { pgTable, text, uuid, boolean, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// تعريف الأدوار والصلاحيات المتوافقة مع الهيكل التنظيمي

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // 'admin', 'deputy_admin_technical', etc.
  nameAr: text('name_ar').notNull(), // 'المدير العام', 'نائب المدير العام للشؤون الفنية'
  nameEn: text('name_en').notNull(),
  level: integer('level').notNull(), // 0-5 (5 = أعلى صلاحية)
  description: text('description'),
  sector: text('sector'), // 'technical', 'planning', 'inspection', 'projects', 'finance'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // 'users.create', 'gis.layers.publish'
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  category: text('category').notNull(), // 'users', 'gis', 'projects', 'documents'
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

// العلاقات
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// تعريف الأدوار الافتراضية
export const DEFAULT_ROLES = [
  {
    code: 'admin',
    nameAr: 'المدير العام',
    nameEn: 'General Director',
    level: 5,
    description: 'المدير العام - كامل الصلاحيات',
    sector: null,
  },
  {
    code: 'deputy_admin_first',
    nameAr: 'النائب الأول',
    nameEn: 'First Deputy',
    level: 4,
    description: 'النائب الأول للمدير العام',
    sector: null,
  },
  {
    code: 'deputy_admin_planning',
    nameAr: 'نائب المدير العام للتخطيط والمتابعة',
    nameEn: 'Deputy for Planning and Follow-up',
    level: 3,
    description: 'نائب المدير العام للتخطيط والمتابعة',
    sector: 'planning',
  },
  {
    code: 'deputy_admin_technical',
    nameAr: 'نائب المدير العام للشؤون الفنية',
    nameEn: 'Deputy for Technical Affairs',
    level: 3,
    description: 'نائب المدير العام للشؤون الفنية',
    sector: 'technical',
  },
  {
    code: 'deputy_admin_inspection',
    nameAr: 'نائب المدير العام للتفتيش الفني',
    nameEn: 'Deputy for Technical Inspection',
    level: 3,
    description: 'نائب المدير العام للتفتيش الفني',
    sector: 'inspection',
  },
  {
    code: 'deputy_admin_projects',
    nameAr: 'نائب المدير العام للمشاريع',
    nameEn: 'Deputy for Projects',
    level: 3,
    description: 'نائب المدير العام للمشاريع',
    sector: 'projects',
  },
  {
    code: 'deputy_admin_finance',
    nameAr: 'نائب المدير العام للشؤون المالية',
    nameEn: 'Deputy for Financial Affairs',
    level: 3,
    description: 'نائب المدير العام للشؤون المالية',
    sector: 'finance',
  },
  {
    code: 'manager',
    nameAr: 'مدير إدارة',
    nameEn: 'Department Manager',
    level: 2,
    description: 'مدير إدارة أو فرع',
    sector: null,
  },
  {
    code: 'section_head',
    nameAr: 'رئيس قسم',
    nameEn: 'Section Head',
    level: 1,
    description: 'رئيس قسم',
    sector: null,
  },
  {
    code: 'staff',
    nameAr: 'موظف',
    nameEn: 'Staff',
    level: 0,
    description: 'موظف عادي',
    sector: null,
  }
] as const;

// تعريف الصلاحيات الافتراضية
export const DEFAULT_PERMISSIONS = [
  // إدارة المستخدمين
  { code: 'users.create', nameAr: 'إنشاء مستخدم', nameEn: 'Create User', category: 'users' },
  { code: 'users.read', nameAr: 'عرض المستخدمين', nameEn: 'View Users', category: 'users' },
  { code: 'users.update', nameAr: 'تعديل مستخدم', nameEn: 'Update User', category: 'users' },
  { code: 'users.delete', nameAr: 'حذف مستخدم', nameEn: 'Delete User', category: 'users' },
  { code: 'users.assign_role', nameAr: 'تعيين دور', nameEn: 'Assign Role', category: 'users' },
  { code: 'users.reset_password', nameAr: 'إعادة تعيين كلمة المرور', nameEn: 'Reset Password', category: 'users' },
  
  // إدارة الأدوار والصلاحيات
  { code: 'roles.manage', nameAr: 'إدارة الأدوار', nameEn: 'Manage Roles', category: 'roles' },
  { code: 'permissions.manage', nameAr: 'إدارة الصلاحيات', nameEn: 'Manage Permissions', category: 'permissions' },
  
  // الخدمات الجغرافية
  { code: 'gis.upload_file', nameAr: 'رفع ملف جغرافي', nameEn: 'Upload GIS File', category: 'gis' },
  { code: 'gis.view_layer', nameAr: 'عرض طبقة جغرافية', nameEn: 'View GIS Layer', category: 'gis' },
  { code: 'gis.edit_layer', nameAr: 'تعديل طبقة جغرافية', nameEn: 'Edit GIS Layer', category: 'gis' },
  { code: 'gis.publish_layer', nameAr: 'نشر طبقة جغرافية', nameEn: 'Publish GIS Layer', category: 'gis' },
  { code: 'gis.digitize', nameAr: 'أداة الرقمنة', nameEn: 'Digitization Tool', category: 'gis' },
  
  // القرار المساحي
  { code: 'survey.request_decision', nameAr: 'طلب قرار مساحي', nameEn: 'Request Survey Decision', category: 'survey' },
  { code: 'survey.approve_decision', nameAr: 'الموافقة على قرار مساحي', nameEn: 'Approve Survey Decision', category: 'survey' },
  { code: 'survey.reject_decision', nameAr: 'رفض قرار مساحي', nameEn: 'Reject Survey Decision', category: 'survey' },
  
  // إدارة المشاريع
  { code: 'projects.create', nameAr: 'إنشاء مشروع', nameEn: 'Create Project', category: 'projects' },
  { code: 'projects.read', nameAr: 'عرض المشاريع', nameEn: 'View Projects', category: 'projects' },
  { code: 'projects.update', nameAr: 'تعديل مشروع', nameEn: 'Update Project', category: 'projects' },
  { code: 'projects.delete', nameAr: 'حذف مشروع', nameEn: 'Delete Project', category: 'projects' },
  { code: 'projects.assign_worker', nameAr: 'تعيين مسؤول مشروع', nameEn: 'Assign Project Worker', category: 'projects' },
  { code: 'projects.submit_report', nameAr: 'تسليم تقرير', nameEn: 'Submit Report', category: 'projects' },
  { code: 'projects.review', nameAr: 'مراجعة مشروع', nameEn: 'Review Project', category: 'projects' },
  { code: 'projects.close', nameAr: 'إغلاق مشروع', nameEn: 'Close Project', category: 'projects' },
  
  // إدارة المستندات
  { code: 'documents.upload', nameAr: 'رفع مستند', nameEn: 'Upload Document', category: 'documents' },
  { code: 'documents.read', nameAr: 'عرض مستند', nameEn: 'View Document', category: 'documents' },
  { code: 'documents.update', nameAr: 'تعديل مستند', nameEn: 'Update Document', category: 'documents' },
  { code: 'documents.delete', nameAr: 'حذف مستند', nameEn: 'Delete Document', category: 'documents' },
  { code: 'documents.share', nameAr: 'مشاركة مستند', nameEn: 'Share Document', category: 'documents' },
  
  // التحليلات والتقارير
  { code: 'analytics.view', nameAr: 'عرض التحليلات', nameEn: 'View Analytics', category: 'analytics' },
  { code: 'analytics.generate', nameAr: 'إنشاء تقرير', nameEn: 'Generate Report', category: 'analytics' },
  { code: 'analytics.export', nameAr: 'تصدير تقرير', nameEn: 'Export Report', category: 'analytics' },
  
  // الأمان والسجلات
  { code: 'security.view_audit_log', nameAr: 'عرض سجل العمليات', nameEn: 'View Audit Log', category: 'security' },
  { code: 'security.view_alerts', nameAr: 'عرض تنبيهات الأمان', nameEn: 'View Security Alerts', category: 'security' },
  { code: 'security.ban_user', nameAr: 'حظر مستخدم', nameEn: 'Ban User', category: 'security' },
  
  // الوصول العام
  { code: 'dashboard.view', nameAr: 'عرض لوحة التحكم', nameEn: 'View Dashboard', category: 'general' },
  { code: 'reports.view', nameAr: 'عرض التقارير', nameEn: 'View Reports', category: 'general' },
  { code: 'data.export', nameAr: 'تصدير البيانات', nameEn: 'Export Data', category: 'general' },
  { code: 'users.search', nameAr: 'البحث في المستخدمين', nameEn: 'Search Users', category: 'general' },
] as const;