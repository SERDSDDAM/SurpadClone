import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ROLE_HIERARCHY, type RoleCode } from '@shared/auth-schema';

// تمديد نوع Request ليشمل user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
        email?: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

// التحقق من المصادقة
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'مطلوب تسجيل الدخول' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized', message: 'توكن غير صالح' });
  }
}

// التحقق من الأدوار المطلوبة
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'مطلوب تسجيل الدخول' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
}

// التحقق من مستوى الصلاحية الأدنى
export function requireMinLevel(minLevel: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'مطلوب تسجيل الدخول' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role as RoleCode] ?? 0;
    if (userLevel < minLevel) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'مستوى الصلاحية غير كافي',
        required: minLevel,
        current: userLevel
      });
    }

    next();
  };
}

// التحقق من صلاحية محددة
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'مطلوب تسجيل الدخول' });
    }

    // تحديد الصلاحيات بناءً على الدور
    const permissions = getRolePermissions(req.user.role);
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `ليس لديك صلاحية: ${permission}`,
        required: permission,
        available: permissions
      });
    }

    next();
  };
}

// الحصول على صلاحيات الدور
function getRolePermissions(role: string): string[] {
  const basePermissions = [
    'dashboard.view',
    'reports.view',
    'gis.view_layer',
    'documents.read'
  ];

  switch (role) {
    case 'admin':
      return ['*']; // جميع الصلاحيات

    case 'deputy_admin_first':
      return [
        ...basePermissions,
        'users.create', 'users.read', 'users.update', 'users.assign_role',
        'gis.upload_file', 'gis.edit_layer', 'gis.publish_layer', 'gis.digitize',
        'survey.request_decision', 'survey.approve_decision', 'survey.reject_decision',
        'projects.create', 'projects.read', 'projects.update', 'projects.assign_worker',
        'projects.submit_report', 'projects.review', 'projects.close',
        'documents.upload', 'documents.update', 'documents.share',
        'analytics.view', 'analytics.generate'
      ];

    case 'deputy_admin_technical':
      return [
        ...basePermissions,
        'users.create', 'users.read', 'users.update', 'users.assign_role',
        'gis.upload_file', 'gis.edit_layer', 'gis.publish_layer', 'gis.digitize',
        'survey.request_decision', 'survey.approve_decision', 'survey.reject_decision',
        'documents.upload', 'documents.update', 'documents.share',
        'analytics.view'
      ];

    case 'deputy_admin_planning':
      return [
        ...basePermissions,
        'projects.create', 'projects.read', 'projects.update', 'projects.assign_worker',
        'projects.submit_report', 'projects.review', 'projects.close',
        'gis.upload_file', 'gis.digitize',
        'survey.request_decision', 'survey.approve_decision',
        'documents.upload', 'documents.update', 'documents.share',
        'analytics.view', 'analytics.generate'
      ];

    case 'deputy_admin_inspection':
    case 'deputy_admin_projects':
    case 'deputy_admin_finance':
      return [
        ...basePermissions,
        'users.create', 'users.read', 'users.update',
        'gis.upload_file', 'gis.digitize',
        'survey.request_decision', 'survey.approve_decision',
        'documents.upload', 'documents.update', 'documents.share',
        'analytics.view'
      ];

    case 'manager':
      return [
        ...basePermissions,
        'users.create', 'users.read', 'users.update',
        'gis.upload_file', 'gis.digitize',
        'survey.request_decision', 'survey.approve_decision',
        'projects.read', 'projects.update', 'projects.submit_report', 'projects.review',
        'documents.upload', 'documents.update', 'documents.share'
      ];

    case 'section_head':
      return [
        ...basePermissions,
        'gis.upload_file', 'gis.digitize',
        'survey.request_decision', 'survey.approve_decision',
        'documents.upload', 'documents.update', 'documents.share'
      ];

    case 'staff':
      return [
        ...basePermissions,
        'gis.upload_file', 'gis.digitize',
        'survey.request_decision',
        'documents.upload'
      ];

    default:
      return basePermissions;
  }
}

// تحقق من وجود صلاحية
export function hasPermission(role: string, permission: string): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes('*') || permissions.includes(permission);
}

// تحقق من مستوى الدور
export function hasMinLevel(role: string, minLevel: number): boolean {
  const userLevel = ROLE_HIERARCHY[role as RoleCode] ?? 0;
  return userLevel >= minLevel;
}