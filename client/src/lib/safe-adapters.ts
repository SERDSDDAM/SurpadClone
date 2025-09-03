/**
 * Frontend Safe Adapters - حماية Frontend من null/undefined
 * الهدف: منع أخطاء map() وتوفير بيانات آمنة دائماً
 */

/**
 * toArray Adapter - يحول أي استجابة إلى مصفوفة آمنة
 * يمنع أخطاء map() تماماً ويضمن وجود مصفوفة دائماً
 */
export function toSafeArray<T>(response: any): T[] {
  // إذا لم تكن هناك استجابة
  if (!response) {
    console.warn('[toSafeArray] No response received, returning empty array');
    return [];
  }
  
  // إذا كانت الاستجابة تحتوي على data
  if (response.data) {
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data !== null && response.data !== undefined) {
      // تحويل الكائن المفرد إلى مصفوفة
      return [response.data];
    }
  }
  
  // إذا كانت الاستجابة نفسها مصفوفة
  if (Array.isArray(response)) {
    return response;
  }
  
  // في جميع الحالات الأخرى، إرجاع مصفوفة فارغة
  console.warn('[toSafeArray] Unexpected response format, returning empty array:', response);
  return [];
}

/**
 * toSafeObject - يحول الاستجابة إلى كائن آمن
 * يمنع أخطاء الـ null reference
 */
export function toSafeObject<T>(response: any, fallback?: T): T | null {
  if (!response) {
    return fallback || null;
  }
  
  if (response.data) {
    return response.data;
  }
  
  return response || fallback || null;
}

/**
 * logSafely - سجل البيانات بشكل آمن للـ debugging
 * يعرض تفاصيل الاستجابة بوضوح
 */
export function logSafely(label: string, data: any) {
  if (Array.isArray(data)) {
    console.log(`[${label}]:`, data.length, data);
  } else if (data && typeof data === 'object') {
    console.log(`[${label}]:`, data);
  } else {
    console.log(`[${label}]:`, typeof data, data);
  }
}

/**
 * isValidArray - يتحقق من أن البيانات مصفوفة صحيحة
 * يستخدم في conditions قبل معالجة البيانات
 */
export function isValidArray(data: any): data is any[] {
  return Array.isArray(data) && data.length >= 0;
}

/**
 * ensureArray - ضمان وجود مصفوفة مع fallback
 * يستخدم عند الحاجة لمصفوفة افتراضية محددة
 */
export function ensureArray<T>(data: any, fallback: T[] = []): T[] {
  const result = toSafeArray<T>(data);
  return result.length > 0 ? result : fallback;
}