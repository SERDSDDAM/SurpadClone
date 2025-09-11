/**
 * Response Adapters - توحيد استجابات API لضمان الاستقرار
 * الهدف: منع أخطاء map() في Frontend والحماية من null/undefined
 */

export interface StandardApiResponse<T = any> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  error?: string;
}

/**
 * Response Adapter للمصفوفات - يضمن إرجاع مصفوفة دائماً
 * يحمي من null/undefined ويضمن عدم وجود أخطاء map()
 */
export function toArrayResponse<T>(
  data: T[] | T | null | undefined, 
  message?: string
): StandardApiResponse<T[]> {
  let safeData: T[] = [];
  
  // تحويل أي نوع بيانات إلى مصفوفة بشكل آمن
  if (Array.isArray(data)) {
    safeData = data;
  } else if (data !== null && data !== undefined) {
    safeData = [data];
  }
  
  return {
    success: true,
    data: safeData,
    count: safeData.length,
    message: message || `تم جلب ${safeData.length} عنصر بنجاح`
  };
}

/**
 * Response Adapter للكائنات المفردة
 * يحمي من null ويعطي استجابة موحدة
 */
export function toObjectResponse<T>(
  data: T | null | undefined, 
  message?: string
): StandardApiResponse<T | null> {
  return {
    success: !!data,
    data: data || null,
    message: message || (data ? "تم جلب البيانات بنجاح" : "لم يتم العثور على البيانات")
  };
}

/**
 * Response Adapter للأخطاء
 * يوحد شكل رسائل الأخطاء
 */
export function toErrorResponse(
  error: string | Error, 
  details?: any
): StandardApiResponse<null> {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return {
    success: false,
    data: null,
    error: errorMessage,
    ...(details && { details })
  };
}

/**
 * Response Adapter للعمليات الناجحة (Create/Update/Delete)
 * يوحد شكل استجابات العمليات
 */
export function toSuccessResponse<T>(
  data: T, 
  message: string
): StandardApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

/**
 * Middleware للتحقق من نوع البيانات وتحويلها تلقائياً
 * يستخدم في routes لضمان التوحيد القياسي
 */
export function autoAdapt(data: any): StandardApiResponse<any> {
  // إذا كانت البيانات مصفوفة
  if (Array.isArray(data)) {
    return toArrayResponse(data);
  }
  
  // إذا كانت البيانات كائن مفرد
  if (data !== null && typeof data === 'object') {
    return toObjectResponse(data);
  }
  
  // في حالات أخرى
  return toObjectResponse(data);
}