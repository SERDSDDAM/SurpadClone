import proj4 from 'proj4';

// تعريف أنظمة الإحداثيات المستخدمة في اليمن

// UTM Zone 38N (EPSG:32638) - النظام الأساسي للمساحة في اليمن
const UTM_38N = '+proj=utm +zone=38 +datum=WGS84 +units=m +no_defs';

// WGS 84 (EPSG:4326) - النظام العالمي للإحداثيات الجغرافية
const WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

// Web Mercator (EPSG:3857) - نظام الإحداثيات المستخدم في Leaflet
const WEB_MERCATOR = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs';

// إعداد التحويلات
proj4.defs('EPSG:32638', UTM_38N);
proj4.defs('EPSG:4326', WGS84);
proj4.defs('EPSG:3857', WEB_MERCATOR);

/**
 * تحويل إحداثيات من UTM Zone 38N إلى WGS 84
 * @param utmCoords إحداثيات UTM [x, y] بالمتر
 * @returns إحداثيات WGS 84 [longitude, latitude] بالدرجات
 */
export function utmToWgs84(utmCoords: [number, number]): [number, number] {
  const [x, y] = utmCoords;
  const [lng, lat] = proj4('EPSG:32638', 'EPSG:4326', [x, y]);
  return [lng, lat];
}

/**
 * تحويل إحداثيات من WGS 84 إلى UTM Zone 38N
 * @param wgs84Coords إحداثيات WGS 84 [longitude, latitude] بالدرجات
 * @returns إحداثيات UTM [x, y] بالمتر
 */
export function wgs84ToUtm(wgs84Coords: [number, number]): [number, number] {
  const [lng, lat] = wgs84Coords;
  const [x, y] = proj4('EPSG:4326', 'EPSG:32638', [lng, lat]);
  return [x, y];
}

/**
 * تحويل حدود المنطقة من UTM إلى WGS 84 للاستخدام مع Leaflet
 * @param utmBounds حدود UTM [[minX, minY], [maxX, maxY]]
 * @returns حدود WGS 84 [[south, west], [north, east]] للاستخدام مع Leaflet
 */
export function transformUtmBoundsToWgs84(
  utmBounds: [[number, number], [number, number]]
): [[number, number], [number, number]] {
  const [[minX, minY], [maxX, maxY]] = utmBounds;
  
  // تحويل النقاط الأربع للمستطيل
  const [southWestLng, southWestLat] = utmToWgs84([minX, minY]);
  const [northEastLng, northEastLat] = utmToWgs84([maxX, maxY]);
  const [northWestLng, northWestLat] = utmToWgs84([minX, maxY]);
  const [southEastLng, southEastLat] = utmToWgs84([maxX, minY]);
  
  // العثور على أقصى وأدنى قيم
  const minLng = Math.min(southWestLng, northEastLng, northWestLng, southEastLng);
  const maxLng = Math.max(southWestLng, northEastLng, northWestLng, southEastLng);
  const minLat = Math.min(southWestLat, northEastLat, northWestLat, southEastLat);
  const maxLat = Math.max(southWestLat, northEastLat, northWestLat, southEastLat);
  
  return [[minLat, minLng], [maxLat, maxLng]];
}

/**
 * تحويل نقطة مفردة من UTM إلى Leaflet LatLng
 * @param utmPoint نقطة UTM [x, y]
 * @returns نقطة Leaflet [lat, lng]
 */
export function utmPointToLeafletLatLng(utmPoint: [number, number]): [number, number] {
  const [lng, lat] = utmToWgs84(utmPoint);
  return [lat, lng]; // Leaflet يستخدم [lat, lng] وليس [lng, lat]
}

/**
 * تحويل مجموعة من النقاط UTM إلى Leaflet LatLng
 * @param utmPoints مجموعة نقاط UTM
 * @returns مجموعة نقاط Leaflet [lat, lng][]
 */
export function utmPointsToLeafletLatLngs(utmPoints: [number, number][]): [number, number][] {
  return utmPoints.map(point => utmPointToLeafletLatLng(point));
}

/**
 * تحليل بيانات GeoTIFF واستخراج المعلومات الجغرافية
 * @param geoTiffMetadata بيانات وصفية من GeoTIFF
 * @returns معلومات الإسقاط والحدود المحولة
 */
export function parseGeoTiffProjection(geoTiffMetadata: any) {
  // في التطبيق الحقيقي، هذه الوظيفة ستقوم بقراءة:
  // - GeoTransform matrix
  // - Spatial Reference System (SRS)
  // - Pixel size and orientation
  
  // لأغراض التجربة، نفترض أن الملف بنظام UTM Zone 38N
  const isUtmZone38N = geoTiffMetadata?.spatialReference?.includes('32638') || 
                       geoTiffMetadata?.projection === 'UTM Zone 38N' ||
                       !geoTiffMetadata?.spatialReference; // افتراضي للملفات اليمنية
  
  return {
    isUtmZone38N,
    needsReprojection: isUtmZone38N,
    sourceEPSG: isUtmZone38N ? 'EPSG:32638' : 'EPSG:4326',
    targetEPSG: 'EPSG:4326'
  };
}

/**
 * تحويل حدود صورة GeoTIFF للعرض على الخريطة
 * @param imageBounds حدود الصورة الأصلية
 * @param metadata البيانات الوصفية للصورة
 * @returns الحدود المحولة للعرض على Leaflet
 */
export function transformImageBoundsForDisplay(
  imageBounds: [[number, number], [number, number]],
  metadata: any
): [[number, number], [number, number]] {
  const projectionInfo = parseGeoTiffProjection(metadata);
  
  if (projectionInfo.needsReprojection && projectionInfo.isUtmZone38N) {
    console.log('🔄 تحويل إحداثيات الصورة من UTM Zone 38N إلى WGS 84');
    return transformUtmBoundsToWgs84(imageBounds);
  }
  
  // إذا كانت الصورة بنظام WGS 84 بالفعل، إرجاع الحدود كما هي
  console.log('✅ الصورة بنظام WGS 84 بالفعل، لا حاجة للتحويل');
  return imageBounds;
}

// إحداثيات مرجعية لمناطق مهمة في اليمن (بنظام UTM Zone 38N)
export const YEMEN_UTM_REFERENCES = {
  SANAA: {
    utm: [400000, 1700000], // تقريباً
    wgs84: utmToWgs84([400000, 1700000])
  },
  ADEN: {
    utm: [550000, 1450000], // تقريباً  
    wgs84: utmToWgs84([550000, 1450000])
  },
  TAIZ: {
    utm: [450000, 1500000], // تقريباً
    wgs84: utmToWgs84([450000, 1500000])
  }
};

console.log('🗺️ تم تهيئة نظام تحويل الإحداثيات:', {
  'UTM Zone 38N': 'EPSG:32638',
  'WGS 84': 'EPSG:4326',
  'مراجع اليمن': YEMEN_UTM_REFERENCES
});