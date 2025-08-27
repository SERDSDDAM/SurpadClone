// Advanced RBAC System for Binaa Yemen Platform
// This system is designed to support future integration with national digital identity systems

export type Permission = 
  // Citizen Permissions
  | "citizen.view_services"
  | "citizen.submit_building_permit"
  | "citizen.view_own_requests"
  | "citizen.upload_documents"
  | "citizen.pay_fees"
  | "citizen.schedule_inspection"
  | "citizen.view_certificates"
  
  // Engineering Office Permissions
  | "engineer.view_clients"
  | "engineer.submit_professional_applications"
  | "engineer.review_plans"
  | "engineer.sign_documents"
  | "engineer.manage_staff"
  | "engineer.assign_projects"
  | "engineer.approve_designs"
  | "engineer.view_office_statistics"
  
  // Engineering Office Staff Permissions
  | "engineer_staff.view_assigned_projects"
  | "engineer_staff.edit_drawings"
  | "engineer_staff.submit_calculations"
  | "engineer_staff.communicate_clients"
  
  // Contractor Permissions
  | "contractor.view_projects"
  | "contractor.submit_bids"
  | "contractor.manage_workers"
  | "contractor.update_progress"
  | "contractor.request_payments"
  | "contractor.view_contracts"
  | "contractor.manage_subcontractors"
  
  // Inspector Permissions
  | "inspector.view_assigned_inspections"
  | "inspector.conduct_inspection"
  | "inspector.approve_inspection"
  | "inspector.reject_inspection"
  | "inspector.schedule_reinspection"
  | "inspector.generate_reports"
  | "inspector.access_field_app"
  | "inspector.update_inspection_status"
  
  // Surveyor Permissions
  | "surveyor.view_survey_requests"
  | "surveyor.conduct_survey"
  | "surveyor.use_gps_tools"
  | "surveyor.generate_survey_reports"
  | "surveyor.approve_coordinates"
  | "surveyor.access_field_app"
  | "surveyor.export_survey_data"
  
  // Admin Permissions
  | "admin.manage_users"
  | "admin.manage_roles"
  | "admin.view_all_data"
  | "admin.system_configuration"
  | "admin.generate_reports"
  | "admin.manage_fees"
  | "admin.approve_licenses"
  | "admin.system_audit"
  | "admin.manage_integrations"
  | "admin.backup_restore"
  
  // Manager Permissions
  | "manager.view_department_data"
  | "manager.approve_requests"
  | "manager.assign_inspectors"
  | "manager.view_statistics"
  | "manager.manage_department_staff"
  
  // System Permissions for future National ID Integration
  | "system.national_id_verification"
  | "system.biometric_verification"
  | "system.digital_signature"
  | "system.external_api_access";

export type Role = 
  | "citizen"                    // Regular citizens
  | "engineer_owner"            // Engineering office owner
  | "engineer_staff"            // Engineering office staff
  | "contractor_owner"          // Contracting company owner  
  | "contractor_staff"          // Contracting company staff
  | "inspector"                 // Government inspector
  | "surveyor"                  // Government surveyor
  | "admin"                     // System administrator
  | "manager"                   // Department manager
  | "super_admin";              // Super administrator

// Role-Permission Matrix
export const rolePermissions: Record<Role, Permission[]> = {
  citizen: [
    "citizen.view_services",
    "citizen.submit_building_permit", 
    "citizen.view_own_requests",
    "citizen.upload_documents",
    "citizen.pay_fees",
    "citizen.schedule_inspection",
    "citizen.view_certificates"
  ],

  engineer_owner: [
    "engineer.view_clients",
    "engineer.submit_professional_applications",
    "engineer.review_plans", 
    "engineer.sign_documents",
    "engineer.manage_staff",
    "engineer.assign_projects",
    "engineer.approve_designs",
    "engineer.view_office_statistics",
    // Can also do staff work
    "engineer_staff.view_assigned_projects",
    "engineer_staff.edit_drawings",
    "engineer_staff.submit_calculations", 
    "engineer_staff.communicate_clients"
  ],

  engineer_staff: [
    "engineer_staff.view_assigned_projects",
    "engineer_staff.edit_drawings",
    "engineer_staff.submit_calculations",
    "engineer_staff.communicate_clients"
  ],

  contractor_owner: [
    "contractor.view_projects",
    "contractor.submit_bids",
    "contractor.manage_workers",
    "contractor.update_progress",
    "contractor.request_payments",
    "contractor.view_contracts",
    "contractor.manage_subcontractors"
  ],

  contractor_staff: [
    "contractor.view_projects",
    "contractor.update_progress"
  ],

  inspector: [
    "inspector.view_assigned_inspections",
    "inspector.conduct_inspection",
    "inspector.approve_inspection",
    "inspector.reject_inspection", 
    "inspector.schedule_reinspection",
    "inspector.generate_reports",
    "inspector.access_field_app",
    "inspector.update_inspection_status"
  ],

  surveyor: [
    "surveyor.view_survey_requests",
    "surveyor.conduct_survey",
    "surveyor.use_gps_tools",
    "surveyor.generate_survey_reports",
    "surveyor.approve_coordinates",
    "surveyor.access_field_app", 
    "surveyor.export_survey_data"
  ],

  manager: [
    "manager.view_department_data",
    "manager.approve_requests",
    "manager.assign_inspectors", 
    "manager.view_statistics",
    "manager.manage_department_staff",
    // Can also do inspector/surveyor work
    ...rolePermissions.inspector || [],
    ...rolePermissions.surveyor || []
  ],

  admin: [
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
    // Admins can do manager work
    ...rolePermissions.manager || []
  ],

  super_admin: [
    // Super admin has all permissions
    ...Object.values(rolePermissions).flat(),
    "system.national_id_verification",
    "system.biometric_verification", 
    "system.digital_signature",
    "system.external_api_access"
  ]
};

// Permission checking functions
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const userPermissions = rolePermissions[userRole] || [];
  return userPermissions.includes(permission);
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Engineering Office Staff Management
export interface EngineeringOfficeStaff {
  id: string;
  officeId: string;
  userId: string;
  role: "engineer_staff";
  permissions: Permission[];
  assignedBy: string; // Engineering office owner ID
  isActive: boolean;
  assignedDate: Date;
  lastAccess?: Date;
}

// Future National ID Integration Interface
export interface NationalIdentityIntegration {
  // This interface is designed for future integration with Yemen's national digital identity system
  nationalIdNumber: string;
  biometricHash?: string;
  digitalSignature?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedDate?: Date;
  verificationMethod: "manual" | "biometric" | "national_system";
  externalSystemRef?: string; // Reference to external national ID system
}

// Permission context for API calls
export interface PermissionContext {
  userId: string;
  role: Role;
  organizationId?: string; // For engineering offices/contractors
  departmentId?: string;   // For government employees
  nationalId?: string;     // For future national system integration
}