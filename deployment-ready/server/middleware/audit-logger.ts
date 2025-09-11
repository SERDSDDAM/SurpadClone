import { Request } from 'express';
import { db } from '../db';
import { auditLogs } from '@shared/schema';

export interface AuditLogData {
  userId: string;
  action: string;
  tableName?: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  success?: boolean;
  errorMessage?: string;
  metadata?: any;
}

export class AuditLogger {
  /**
   * تسجيل حدث في سجل المراجعة
   */
  static async log(req: Request, data: AuditLogData): Promise<void> {
    try {
      // استخراج معلومات الطلب
      const ipAddress = req.ip || 
                       req.connection.remoteAddress || 
                       req.headers['x-forwarded-for'] as string ||
                       'unknown';
      
      const userAgent = req.headers['user-agent'] || 'unknown';
      const sessionId = req.sessionID || req.headers['x-session-id'] as string || 'unknown';

      // إدخال سجل المراجعة في قاعدة البيانات
      await db.insert(auditLogs).values({
        userId: data.userId,
        action: data.action,
        tableName: data.tableName || null,
        recordId: data.recordId || null,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        ipAddress: ipAddress,
        userAgent: userAgent,
        sessionId: sessionId,
        success: data.success ?? true,
        errorMessage: data.errorMessage || null,
        timestamp: new Date()
      });

      console.log(`📝 Audit Log: ${data.userId} performed ${data.action} on ${data.tableName || 'system'} ${data.success ? '✅' : '❌'}`);
    } catch (error) {
      console.error('❌ فشل في تسجيل سجل المراجعة:', error);
      // لا نريد أن يفشل الطلب الأصلي بسبب فشل تسجيل المراجعة
    }
  }

  /**
   * تسجيل عملية رفع الملفات
   */
  static async logFileUpload(req: Request, fileName: string, fileSize: number, success: boolean, errorMessage?: string): Promise<void> {
    await this.log(req, {
      userId: req.user?.id || 'anonymous',
      action: 'file_upload',
      tableName: 'geographic_data',
      newValues: {
        fileName: fileName,
        fileSize: fileSize,
        uploadPath: req.path,
        contentType: req.headers['content-type']
      },
      success: success,
      errorMessage: errorMessage
    });
  }

  /**
   * تسجيل عمليات تعديل البيانات الجغرافية
   */
  static async logGeographicDataMutation(req: Request, operation: 'insert' | 'update' | 'delete', tableName: string, recordData: any, oldData?: any): Promise<void> {
    await this.log(req, {
      userId: req.user?.id || 'anonymous',
      action: `geographic_data_${operation}`,
      tableName: tableName,
      recordId: recordData.id || recordData.code,
      oldValues: oldData,
      newValues: recordData,
      success: true
    });
  }

  /**
   * تسجيل محاولات الوصول غير المصرح بها
   */
  static async logUnauthorizedAccess(req: Request, reason: string): Promise<void> {
    await this.log(req, {
      userId: req.user?.id || 'anonymous',
      action: 'unauthorized_access_attempt',
      newValues: {
        path: req.path,
        method: req.method,
        reason: reason,
        headers: req.headers
      },
      success: false,
      errorMessage: reason
    });
  }

  /**
   * تسجيل أخطاء التحقق من صحة البيانات
   */
  static async logValidationError(req: Request, validationErrors: any): Promise<void> {
    await this.log(req, {
      userId: req.user?.id || 'anonymous',
      action: 'validation_error',
      tableName: 'geographic_data',
      newValues: {
        errors: validationErrors,
        requestBody: req.body,
        path: req.path
      },
      success: false,
      errorMessage: 'Data validation failed'
    });
  }

  /**
   * تسجيل أخطاء CSRF
   */
  static async logCsrfError(req: Request, errorType: string): Promise<void> {
    await this.log(req, {
      userId: req.user?.id || 'anonymous',
      action: 'csrf_error',
      newValues: {
        errorType: errorType,
        path: req.path,
        method: req.method,
        hasToken: !!req.headers['x-csrf-token'],
        hasSession: !!req.session
      },
      success: false,
      errorMessage: `CSRF protection failed: ${errorType}`
    });
  }

  /**
   * تسجيل أنشطة الإدارة الحساسة
   */
  static async logAdminActivity(req: Request, activity: string, targetResource: string, changes?: any): Promise<void> {
    await this.log(req, {
      userId: req.user?.id || 'anonymous',
      action: `admin_${activity}`,
      tableName: targetResource,
      newValues: changes,
      success: true,
      metadata: {
        adminLevel: req.user?.role,
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * Middleware لتسجيل جميع الطلبات الواردة
 */
export function requestLogger(req: Request, res: any, next: any) {
  const start = Date.now();
  
  // تسجيل الطلب
  console.log(`🌐 ${req.method} ${req.path} - ${req.ip} - ${req.user?.id || 'anonymous'}`);
  
  // تسجيل الاستجابة عند اكتمالها
  res.on('finish', async () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // تسجيل الطلبات المشبوهة فقط (أخطاء أو طلبات حساسة)
    if (statusCode >= 400 || req.path.includes('upload') || req.path.includes('admin')) {
      await AuditLogger.log(req, {
        userId: req.user?.id || 'anonymous',
        action: 'http_request',
        newValues: {
          method: req.method,
          path: req.path,
          statusCode: statusCode,
          duration: duration,
          userAgent: req.headers['user-agent']
        },
        success: statusCode < 400
      });
    }
  });
  
  next();
}