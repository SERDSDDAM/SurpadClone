import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  decimal,
  pgEnum,
  uuid,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums للأنواع المختلفة
export const roleHierarchyTypeEnum = pgEnum('role_hierarchy_type', ['inherit', 'delegate', 'escalate']);
export const permissionScopeEnum = pgEnum('permission_scope', ['global', 'organizational', 'departmental', 'district', 'personal']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent', 'critical']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'assigned', 'in_progress', 'completed', 'escalated', 'cancelled']);
export const delegationTypeEnum = pgEnum('delegation_type', ['temporary', 'permanent', 'conditional', 'emergency']);
export const alertSeverityEnum = pgEnum('alert_severity', ['info', 'warning', 'critical', 'emergency']);
export const contextTypeEnum = pgEnum('context_type', ['project', 'emergency', 'location', 'time', 'amount']);

// الصلاحيات المشروطة المتقدمة
export const conditionalPermissions = pgTable('conditional_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  permissionCode: varchar('permission_code', { length: 255 }).notNull(),
  
  // شروط الوقت
  timeStart: varchar('time_start', { length: 5 }), // HH:MM
  timeEnd: varchar('time_end', { length: 5 }), // HH:MM
  validDays: jsonb('valid_days').$type<string[]>(), // أيام الأسبوع
  
  // شروط المكان
  allowedDistricts: jsonb('allowed_districts').$type<string[]>(),
  allowedOffices: jsonb('allowed_offices').$type<string[]>(),
  allowedBuildings: jsonb('allowed_buildings').$type<string[]>(),
  geoFence: jsonb('geo_fence'), // إحداثيات المنطقة المسموحة
  
  // نطاق البيانات
  dataScope: permissionScopeEnum('data_scope').notNull(),
  canAccessOwnData: boolean('can_access_own_data').default(true),
  canAccessDepartmentData: boolean('can_access_department_data').default(false),
  canAccessDistrictData: boolean('can_access_district_data').default(false),
  
  // حدود مالية ومعاملات
  maxAmount: decimal('max_amount', { precision: 15, scale: 2 }),
  maxTransactionsPerDay: integer('max_transactions_per_day'),
  maxTransactionsPerMonth: integer('max_transactions_per_month'),
  
  // موافقات مطلوبة
  requiresApprovalFrom: jsonb('requires_approval_from').$type<string[]>(),
  requiresSecondSignature: boolean('requires_second_signature').default(false),
  
  // معلومات النشاط
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at'),
  
  // سجل الاستخدام
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at'),
  
  // درجة المخاطر
  riskScore: integer('risk_score').default(1), // 1-10
  
  // ملاحظات ومبررات
  reason: text('reason'),
  notes: text('notes'),
}, (table) => ({
  userPermissionIdx: index('conditional_permissions_user_permission_idx').on(table.userId, table.permissionCode),
  expiryIdx: index('conditional_permissions_expiry_idx').on(table.expiresAt),
  activeIdx: index('conditional_permissions_active_idx').on(table.isActive),
}));

// الصلاحيات المؤقتة والطوارئ
export const temporaryPermissions = pgTable('temporary_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  permissionCode: varchar('permission_code', { length: 255 }).notNull(),
  
  // فترة الصلاحية
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  autoRevoke: boolean('auto_revoke').default(true),
  
  // تفاصيل المنح
  grantedBy: varchar('granted_by', { length: 255 }).notNull(),
  reason: text('reason').notNull(),
  justification: text('justification'),
  
  // نوع الصلاحية
  isEmergency: boolean('is_emergency').default(false),
  emergencyLevel: integer('emergency_level'), // 1-5
  
  // الحدود والقيود
  maxUsage: integer('max_usage'),
  currentUsage: integer('current_usage').default(0),
  conditions: jsonb('conditions'),
  
  // الحالة والمراقبة
  isActive: boolean('is_active').default(true),
  isRevoked: boolean('is_revoked').default(false),
  revokedAt: timestamp('revoked_at'),
  revokedBy: varchar('revoked_by', { length: 255 }),
  revokeReason: text('revoke_reason'),
  
  // التدقيق
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
  usageLog: jsonb('usage_log').$type<any[]>(),
  
  // التنبيهات
  alertOnUsage: boolean('alert_on_usage').default(true),
  alertRecipients: jsonb('alert_recipients').$type<string[]>(),
}, (table) => ({
  userPermissionIdx: index('temporary_permissions_user_permission_idx').on(table.userId, table.permissionCode),
  validityIdx: index('temporary_permissions_validity_idx').on(table.validFrom, table.validUntil),
  emergencyIdx: index('temporary_permissions_emergency_idx').on(table.isEmergency),
  activeIdx: index('temporary_permissions_active_idx').on(table.isActive),
}));

// التدرج الهرمي للأدوار
export const roleHierarchy = pgTable('role_hierarchy', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentRoleId: varchar('parent_role_id', { length: 255 }).notNull(),
  childRoleId: varchar('child_role_id', { length: 255 }).notNull(),
  
  // نوع العلاقة
  hierarchyType: roleHierarchyTypeEnum('hierarchy_type').notNull(),
  
  // إعدادات الوراثة
  inheritPermissions: boolean('inherit_permissions').default(true),
  inheritLimitations: boolean('inherit_limitations').default(true),
  
  // إعدادات التفويض
  canDelegate: boolean('can_delegate').default(false),
  delegationLimit: integer('delegation_limit'),
  maxDelegationDepth: integer('max_delegation_depth').default(1),
  
  // شروط التفعيل
  conditions: jsonb('conditions'),
  isConditional: boolean('is_conditional').default(false),
  
  // التحكم في الصلاحيات
  permissionOverrides: jsonb('permission_overrides').$type<{
    grant?: string[];
    revoke?: string[];
    modify?: { [key: string]: any };
  }>(),
  
  // الحالة والتواريخ
  isActive: boolean('is_active').default(true),
  effectiveFrom: timestamp('effective_from').defaultNow(),
  effectiveUntil: timestamp('effective_until'),
  
  // التدقيق
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  lastModifiedAt: timestamp('last_modified_at').defaultNow(),
  lastModifiedBy: varchar('last_modified_by', { length: 255 }),
  
  // الأولوية والترتيب
  priority: integer('priority').default(0),
  sortOrder: integer('sort_order').default(0),
}, (table) => ({
  parentChildIdx: index('role_hierarchy_parent_child_idx').on(table.parentRoleId, table.childRoleId),
  hierarchyTypeIdx: index('role_hierarchy_type_idx').on(table.hierarchyType),
  activeIdx: index('role_hierarchy_active_idx').on(table.isActive),
}));

// الأدوار السياقية والمختلطة
export const contextualRoles = pgTable('contextual_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  baseRoleId: varchar('base_role_id', { length: 255 }).notNull(),
  
  // السياق والشروط
  contextType: contextTypeEnum('context_type').notNull(),
  contextValue: varchar('context_value', { length: 500 }).notNull(),
  contextMetadata: jsonb('context_metadata'),
  
  // الدور الإضافي
  additionalRoleId: varchar('additional_role_id', { length: 255 }).notNull(),
  rolePriority: integer('role_priority').default(1),
  
  // شروط التفعيل
  activationConditions: jsonb('activation_conditions'),
  autoActivate: boolean('auto_activate').default(true),
  
  // فترة الصلاحية
  validFrom: timestamp('valid_from').defaultNow(),
  validUntil: timestamp('valid_until'),
  
  // الحالة والمراقبة
  isActive: boolean('is_active').default(true),
  isCurrentlyActive: boolean('is_currently_active').default(false),
  lastActivatedAt: timestamp('last_activated_at'),
  activationCount: integer('activation_count').default(0),
  
  // التدقيق
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  
  // ملاحظات
  notes: text('notes'),
}, (table) => ({
  userContextIdx: index('contextual_roles_user_context_idx').on(table.userId, table.contextType),
  activeIdx: index('contextual_roles_active_idx').on(table.isActive),
  currentlyActiveIdx: index('contextual_roles_currently_active_idx').on(table.isCurrentlyActive),
}));

// مهام سير العمل الذكية
export const smartWorkflowTasks = pgTable('smart_workflow_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // تفاصيل المهمة
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  taskType: varchar('task_type', { length: 100 }).notNull(),
  
  // الأولوية والمهلة الزمنية
  priority: taskPriorityEnum('priority').notNull(),
  deadline: timestamp('deadline'),
  estimatedDuration: integer('estimated_duration'), // بالدقائق
  
  // متطلبات الدور
  requiredRoleId: varchar('required_role_id', { length: 255 }).notNull(),
  alternativeRoleIds: jsonb('alternative_role_ids').$type<string[]>(),
  requiredPermissions: jsonb('required_permissions').$type<string[]>(),
  
  // التعيين الذكي
  autoAssignmentEnabled: boolean('auto_assignment_enabled').default(true),
  assignmentCriteria: jsonb('assignment_criteria').$type<{
    workload?: number;
    expertise?: string[];
    location?: string[];
    availability?: boolean;
    performance?: number;
  }>(),
  
  // التعيين الحالي
  assignedToUserId: varchar('assigned_to_user_id', { length: 255 }),
  assignedAt: timestamp('assigned_at'),
  assignedBy: varchar('assigned_by', { length: 255 }),
  
  // سلسلة التصعيد
  escalationChain: jsonb('escalation_chain').$type<{
    level: number;
    roleId: string;
    timeoutHours: number;
    conditions?: any;
  }[]>(),
  currentEscalationLevel: integer('current_escalation_level').default(0),
  
  // الحالة والتقدم
  status: taskStatusEnum('status').default('pending'),
  progress: integer('progress').default(0), // 0-100
  
  // البيانات المرتبطة
  relatedEntityType: varchar('related_entity_type', { length: 100 }),
  relatedEntityId: varchar('related_entity_id', { length: 255 }),
  attachments: jsonb('attachments').$type<any[]>(),
  
  // النتائج والقرارات
  result: text('result'),
  decision: varchar('decision', { length: 255 }),
  decisionReason: text('decision_reason'),
  
  // التوقيتات
  createdAt: timestamp('created_at').defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  lastModifiedAt: timestamp('last_modified_at').defaultNow(),
  
  // التدقيق والمراقبة
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  workflowId: varchar('workflow_id', { length: 255 }),
  parentTaskId: uuid('parent_task_id'),
  
  // معايير الجودة
  qualityScore: integer('quality_score'), // 1-10
  reviewRequired: boolean('review_required').default(false),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  reviewedAt: timestamp('reviewed_at'),
}, (table) => ({
  statusIdx: index('smart_workflow_tasks_status_idx').on(table.status),
  priorityIdx: index('smart_workflow_tasks_priority_idx').on(table.priority),
  assignedUserIdx: index('smart_workflow_tasks_assigned_user_idx').on(table.assignedToUserId),
  deadlineIdx: index('smart_workflow_tasks_deadline_idx').on(table.deadline),
  escalationIdx: index('smart_workflow_tasks_escalation_idx').on(table.currentEscalationLevel),
  workflowIdx: index('smart_workflow_tasks_workflow_idx').on(table.workflowId),
}));

// التفويض الذكي والمؤقت
export const smartDelegations = pgTable('smart_delegations', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // أطراف التفويض
  fromUserId: varchar('from_user_id', { length: 255 }).notNull(),
  toUserId: varchar('to_user_id', { length: 255 }).notNull(),
  
  // نوع وطبيعة التفويض
  delegationType: delegationTypeEnum('delegation_type').notNull(),
  delegatedPermissions: jsonb('delegated_permissions').$type<string[]>().notNull(),
  
  // الشروط والحدود
  conditions: jsonb('conditions').$type<{
    maxDuration?: number; // بالأيام
    maxAmount?: number;
    maxTransactions?: number;
    requiresApproval?: boolean;
    specificTasks?: string[];
    workingHours?: { start: string; end: string };
    workingDays?: string[];
  }>(),
  
  // التفعيل التلقائي
  autoActivationEnabled: boolean('auto_activation_enabled').default(false),
  autoActivationTriggers: jsonb('auto_activation_triggers').$type<{
    triggers: ('absence' | 'overload' | 'emergency')[];
    conditions: any;
  }>(),
  
  // فترة الصلاحية
  validFrom: timestamp('valid_from').defaultNow(),
  validUntil: timestamp('valid_until'),
  
  // الحالة والتفعيل
  isActive: boolean('is_active').default(true),
  isCurrentlyEffective: boolean('is_currently_effective').default(false),
  activatedAt: timestamp('activated_at'),
  deactivatedAt: timestamp('deactivated_at'),
  
  // المراقبة والاستخدام
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at'),
  usageLog: jsonb('usage_log').$type<any[]>(),
  
  // الموافقات والتصديق
  requiresApproval: boolean('requires_approval').default(false),
  approvedBy: varchar('approved_by', { length: 255 }),
  approvedAt: timestamp('approved_at'),
  approvalNotes: text('approval_notes'),
  
  // التدقيق
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
  lastModifiedAt: timestamp('last_modified_at').defaultNow(),
  
  // المبررات والملاحظات
  reason: text('reason').notNull(),
  notes: text('notes'),
  
  // درجة المخاطر
  riskAssessment: jsonb('risk_assessment').$type<{
    riskScore: number;
    riskFactors: string[];
    mitigationMeasures: string[];
  }>(),
}, (table) => ({
  fromUserIdx: index('smart_delegations_from_user_idx').on(table.fromUserId),
  toUserIdx: index('smart_delegations_to_user_idx').on(table.toUserId),
  typeIdx: index('smart_delegations_type_idx').on(table.delegationType),
  effectiveIdx: index('smart_delegations_effective_idx').on(table.isCurrentlyEffective),
  validityIdx: index('smart_delegations_validity_idx').on(table.validFrom, table.validUntil),
}));

// مراقبة الصلاحيات في الوقت الفعلي
export const permissionMonitoring = pgTable('permission_monitoring', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // تفاصيل النشاط
  userId: varchar('user_id', { length: 255 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  resource: varchar('resource', { length: 255 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }),
  
  // النتيجة والقرار
  result: varchar('result', { length: 50 }).notNull(), // granted, denied, escalated
  permissionUsed: varchar('permission_used', { length: 255 }),
  
  // السياق والمعلومات
  sessionId: varchar('session_id', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  deviceInfo: jsonb('device_info'),
  
  // المكان والوقت
  timestamp: timestamp('timestamp').defaultNow(),
  location: jsonb('location').$type<{
    latitude?: number;
    longitude?: number;
    address?: string;
    building?: string;
    office?: string;
  }>(),
  
  // تقييم المخاطر
  riskScore: integer('risk_score').default(1), // 1-10
  riskFactors: jsonb('risk_factors').$type<{
    unusualTime?: boolean;
    unusualLocation?: boolean;
    elevatedPermission?: boolean;
    multipleAttempts?: boolean;
    suspiciousPattern?: boolean;
  }>(),
  
  // التفاصيل الإضافية
  requestData: jsonb('request_data'),
  responseData: jsonb('response_data'),
  duration: integer('duration'), // بالميلي ثانية
  
  // العلامات والتصنيف
  tags: jsonb('tags').$type<string[]>(),
  category: varchar('category', { length: 100 }),
  
  // المراجعة والتدقيق
  reviewed: boolean('reviewed').default(false),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  
  // التنبيهات المرتبطة
  alertGenerated: boolean('alert_generated').default(false),
  alertId: uuid('alert_id'),
}, (table) => ({
  userActionIdx: index('permission_monitoring_user_action_idx').on(table.userId, table.action),
  timestampIdx: index('permission_monitoring_timestamp_idx').on(table.timestamp),
  resultIdx: index('permission_monitoring_result_idx').on(table.result),
  riskScoreIdx: index('permission_monitoring_risk_score_idx').on(table.riskScore),
  reviewIdx: index('permission_monitoring_review_idx').on(table.reviewed),
}));

// التنبيهات الذكية والتلقائية
export const smartAlerts = pgTable('smart_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // نوع ومستوى التنبيه
  type: varchar('type', { length: 100 }).notNull(), // security, workflow, compliance, performance
  severity: alertSeverityEnum('severity').notNull(),
  category: varchar('category', { length: 100 }),
  
  // المحتوى والرسالة
  title: varchar('title', { length: 500 }).notNull(),
  message: text('message').notNull(),
  description: text('description'),
  
  // المصدر والسبب
  triggeredBy: jsonb('triggered_by').$type<{
    userId?: string;
    action?: string;
    condition?: string;
    systemEvent?: string;
    monitoringId?: string;
  }>(),
  
  // البيانات المرتبطة
  relatedData: jsonb('related_data'),
  affectedResources: jsonb('affected_resources').$type<string[]>(),
  
  // الإجراءات التلقائية
  autoActions: jsonb('auto_actions').$type<{
    lockAccount?: boolean;
    revokePermission?: boolean;
    notifyManager?: boolean;
    escalateToAdmin?: boolean;
    suspendAccess?: boolean;
    requireReauth?: boolean;
  }>(),
  
  // المتلقين والإشعارات
  recipients: jsonb('recipients').$type<string[]>().notNull(),
  notificationChannels: jsonb('notification_channels').$type<string[]>(), // email, sms, push, system
  
  // الحالة والمعالجة
  status: varchar('status', { length: 50 }).default('active'), // active, acknowledged, resolved, dismissed
  acknowledgedBy: varchar('acknowledged_by', { length: 255 }),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedBy: varchar('resolved_by', { length: 255 }),
  resolvedAt: timestamp('resolved_at'),
  resolution: text('resolution'),
  
  // التوقيتات
  createdAt: timestamp('created_at').defaultNow(),
  firstOccurredAt: timestamp('first_occurred_at').defaultNow(),
  lastOccurredAt: timestamp('last_occurred_at').defaultNow(),
  
  // التكرار والتجميع
  occurrenceCount: integer('occurrence_count').default(1),
  isRecurring: boolean('is_recurring').default(false),
  groupId: varchar('group_id', { length: 255 }), // لتجميع التنبيهات المشابهة
  
  // الأولوية والتصعيد
  priority: integer('priority').default(5), // 1-10
  escalationLevel: integer('escalation_level').default(0),
  escalatedAt: timestamp('escalated_at'),
  escalatedTo: varchar('escalated_to', { length: 255 }),
  
  // التقييم والمراجعة
  impact: varchar('impact', { length: 100 }), // low, medium, high, critical
  likelihood: varchar('likelihood', { length: 100 }), // low, medium, high
  falsePositive: boolean('false_positive').default(false),
  
  // ملاحظات إضافية
  tags: jsonb('tags').$type<string[]>(),
  metadata: jsonb('metadata'),
}, (table) => ({
  typeIdx: index('smart_alerts_type_idx').on(table.type),
  severityIdx: index('smart_alerts_severity_idx').on(table.severity),
  statusIdx: index('smart_alerts_status_idx').on(table.status),
  createdAtIdx: index('smart_alerts_created_at_idx').on(table.createdAt),
  escalationIdx: index('smart_alerts_escalation_idx').on(table.escalationLevel),
  groupIdx: index('smart_alerts_group_idx').on(table.groupId),
}));

// أنواع البيانات للـ Zod schemas
export const ConditionalPermissionInsertSchema = createInsertSchema(conditionalPermissions);
export const ConditionalPermissionSelectSchema = createSelectSchema(conditionalPermissions);
export type ConditionalPermissionInsert = z.infer<typeof ConditionalPermissionInsertSchema>;
export type ConditionalPermission = z.infer<typeof ConditionalPermissionSelectSchema>;

export const TemporaryPermissionInsertSchema = createInsertSchema(temporaryPermissions);
export const TemporaryPermissionSelectSchema = createSelectSchema(temporaryPermissions);
export type TemporaryPermissionInsert = z.infer<typeof TemporaryPermissionInsertSchema>;
export type TemporaryPermission = z.infer<typeof TemporaryPermissionSelectSchema>;

export const RoleHierarchyInsertSchema = createInsertSchema(roleHierarchy);
export const RoleHierarchySelectSchema = createSelectSchema(roleHierarchy);
export type RoleHierarchyInsert = z.infer<typeof RoleHierarchyInsertSchema>;
export type RoleHierarchy = z.infer<typeof RoleHierarchySelectSchema>;

export const ContextualRoleInsertSchema = createInsertSchema(contextualRoles);
export const ContextualRoleSelectSchema = createSelectSchema(contextualRoles);
export type ContextualRoleInsert = z.infer<typeof ContextualRoleInsertSchema>;
export type ContextualRole = z.infer<typeof ContextualRoleSelectSchema>;

export const SmartWorkflowTaskInsertSchema = createInsertSchema(smartWorkflowTasks);
export const SmartWorkflowTaskSelectSchema = createSelectSchema(smartWorkflowTasks);
export type SmartWorkflowTaskInsert = z.infer<typeof SmartWorkflowTaskInsertSchema>;
export type SmartWorkflowTask = z.infer<typeof SmartWorkflowTaskSelectSchema>;

export const SmartDelegationInsertSchema = createInsertSchema(smartDelegations);
export const SmartDelegationSelectSchema = createSelectSchema(smartDelegations);
export type SmartDelegationInsert = z.infer<typeof SmartDelegationInsertSchema>;
export type SmartDelegation = z.infer<typeof SmartDelegationSelectSchema>;

export const PermissionMonitoringInsertSchema = createInsertSchema(permissionMonitoring);
export const PermissionMonitoringSelectSchema = createSelectSchema(permissionMonitoring);
export type PermissionMonitoringInsert = z.infer<typeof PermissionMonitoringInsertSchema>;
export type PermissionMonitoring = z.infer<typeof PermissionMonitoringSelectSchema>;

export const SmartAlertInsertSchema = createInsertSchema(smartAlerts);
export const SmartAlertSelectSchema = createSelectSchema(smartAlerts);
export type SmartAlertInsert = z.infer<typeof SmartAlertInsertSchema>;
export type SmartAlert = z.infer<typeof SmartAlertSelectSchema>;