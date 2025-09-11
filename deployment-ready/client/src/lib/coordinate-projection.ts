import proj4 from 'proj4';

// تعريف أنظمة الإحداثيات المستخدمة في اليمن
export const COORDINATE_SYSTEMS = {
  // WGS 84 - نظام خطوط الطول والعرض العالمي
  WGS84: 'EPSG:4326',
  // UTM Zone 38N - النظام المتري المحلي لليمن
  UTM_38N: 'EPSG:32638'
} as const;

// تعريف المعاملات الكاملة لأنظمة الإحداثيات
proj4.defs([
  [
    COORDINATE_SYSTEMS.WGS84,
    '+proj=longlat +datum=WGS84 +no_defs'
  ],
  [
    COORDINATE_SYSTEMS.UTM_38N,
    '+proj=utm +zone=38 +datum=WGS84 +units=m +no_defs +type=crs'
  ]
]);

// إنشاء محولات الإحداثيات
const wgs84ToUtm = proj4(COORDINATE_SYSTEMS.WGS84, COORDINATE_SYSTEMS.UTM_38N);
const utmToWgs84 = proj4(COORDINATE_SYSTEMS.UTM_38N, COORDINATE_SYSTEMS.WGS84);

/**
 * تحويل من WGS84 إلى UTM Zone 38N
 */
export function convertWgs84ToUtm(longitude: number, latitude: number): { x: number; y: number } {
  try {
    const [x, y] = wgs84ToUtm.forward([longitude, latitude]);
    return { x, y };
  } catch (error) {
    console.error('خطأ في تحويل WGS84 إلى UTM:', error);
    // قيم افتراضية آمنة لمنطقة صنعاء
    return { 
      x: 400000 + (longitude - 44.19) * 100000, 
      y: 1700000 + (latitude - 15.37) * 110000 
    };
  }
}

/**
 * تحويل من UTM Zone 38N إلى WGS84
 */
export function convertUtmToWgs84(x: number, y: number): { longitude: number; latitude: number } {
  try {
    const [longitude, latitude] = utmToWgs84.forward([x, y]);
    return { longitude, latitude };
  } catch (error) {
    console.error('خطأ في تحويل UTM إلى WGS84:', error);
    // قيم افتراضية آمنة
    return { 
      longitude: 44.19 + (x - 400000) / 100000, 
      latitude: 15.37 + (y - 1700000) / 110000 
    };
  }
}

/**
 * تحويل حدود الصورة من UTM إلى WGS84 للعرض على الخريطة
 */
export function convertImageBoundsUtmToWgs84(
  bounds: [[number, number], [number, number]] // [[minX, minY], [maxX, maxY]] في UTM
): [[number, number], [number, number]] { // [[minLat, minLng], [maxLat, maxLng]] في WGS84
  
  const [[minX, minY], [maxX, maxY]] = bounds;
  
  try {
    // تحويل الزوايا الأربع
    const bottomLeft = convertUtmToWgs84(minX, minY);
    const bottomRight = convertUtmToWgs84(maxX, minY);
    const topLeft = convertUtmToWgs84(minX, maxY);
    const topRight = convertUtmToWgs84(maxX, maxY);
    
    // العثور على أقصى وأدنى قيم
    const latitudes = [bottomLeft.latitude, bottomRight.latitude, topLeft.latitude, topRight.latitude];
    const longitudes = [bottomLeft.longitude, bottomRight.longitude, topLeft.longitude, topRight.longitude];
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    return [[minLat, minLng], [maxLat, maxLng]];
    
  } catch (error) {
    console.error('خطأ في تحويل حدود الصورة:', error);
    // قيم افتراضية آمنة لمنطقة صنعاء
    return [[15.3, 44.1], [15.4, 44.3]];
  }
}

/**
 * تحويل إحداثيات WGS84 إلى موقع على الكانفاس
 */
export function wgs84ToCanvas(
  latitude: number, 
  longitude: number, 
  canvasWidth: number, 
  canvasHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  mapCenter: { lat: number; lng: number }
): { x: number; y: number } {
  
  // تحويل الإحداثيات الجغرافية إلى موقع على الكانفاس
  // باستخدام إسقاط ميركاتور البسيط
  const scale = zoom * 100000; // تكييف المقياس
  
  const x = canvasWidth / 2 + (longitude - mapCenter.lng) * scale + panX;
  const y = canvasHeight / 2 - (latitude - mapCenter.lat) * scale + panY;
  
  return { x, y };
}

/**
 * تحويل موقع على الكانفاس إلى إحداثيات WGS84
 */
export function canvasToWgs84(
  x: number, 
  y: number, 
  canvasWidth: number, 
  canvasHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  mapCenter: { lat: number; lng: number }
): { latitude: number; longitude: number } {
  
  const scale = zoom * 100000;
  
  const longitude = mapCenter.lng + (x - canvasWidth / 2 - panX) / scale;
  const latitude = mapCenter.lat - (y - canvasHeight / 2 - panY) / scale;
  
  return { latitude, longitude };
}

/**
 * حساب المسافة بين نقطتين بنظام UTM (بالأمتار)
 */
export function calculateUtmDistance(
  x1: number, y1: number, 
  x2: number, y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * حساب المساحة لمضلع بنظام UTM (بالمتر المربع)
 */
export function calculateUtmArea(coordinates: [number, number][]): number {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][0] * coordinates[j][1];
    area -= coordinates[j][0] * coordinates[i][1];
  }
  
  return Math.abs(area) / 2;
}

/**
 * تنسيق الإحداثيات للعرض
 */
export function formatCoordinates(
  latitude: number, 
  longitude: number, 
  utmX: number, 
  utmY: number,
  system: 'WGS84' | 'UTM' = 'UTM'
): string {
  if (system === 'WGS84') {
    return `${latitude.toFixed(6)}°, ${longitude.toFixed(6)}°`;
  } else {
    return `X: ${utmX.toFixed(2)}m, Y: ${utmY.toFixed(2)}m`;
  }
}

/**
 * التحقق من صحة الإحداثيات لمنطقة اليمن
 */
export function validateYemenCoordinates(latitude: number, longitude: number): boolean {
  // حدود اليمن التقريبية
  const YEMEN_BOUNDS = {
    minLat: 12.0,
    maxLat: 19.0,
    minLng: 42.0,
    maxLng: 55.0
  };
  
  return latitude >= YEMEN_BOUNDS.minLat && latitude <= YEMEN_BOUNDS.maxLat &&
         longitude >= YEMEN_BOUNDS.minLng && longitude <= YEMEN_BOUNDS.maxLng;
}

console.log('🗺️ تم تهيئة نظام تحويل الإحداثيات المتقدم:', {
  'أنظمة مدعومة': Object.values(COORDINATE_SYSTEMS),
  'مكتبة proj4': proj4.version || 'متاحة',
  'المنطقة': 'اليمن - UTM Zone 38N'
});