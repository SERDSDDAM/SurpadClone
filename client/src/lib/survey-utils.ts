import { FeatureCode, ExportFormat } from "@/types/survey";

export const featureCodes: Record<string, FeatureCode[]> = {
  point: [
    { value: 'building-corner', text: 'ركن مبنى', category: 'building' },
    { value: 'street-light', text: 'عمود إنارة', category: 'infrastructure' },
    { value: 'tree', text: 'شجرة', category: 'vegetation' },
    { value: 'utility-pole', text: 'عمود كهرباء', category: 'utilities' },
    { value: 'well', text: 'بئر', category: 'water' },
    { value: 'gate', text: 'بوابة', category: 'access' },
    { value: 'manhole', text: 'غرفة تفتيش', category: 'utilities' },
    { value: 'fire-hydrant', text: 'صنبور إطفاء', category: 'safety' },
  ],
  line: [
    { value: 'building-edge', text: 'ضلع مبنى', category: 'building' },
    { value: 'fence', text: 'سور', category: 'boundary' },
    { value: 'sidewalk', text: 'رصيف', category: 'transportation' },
    { value: 'power-line', text: 'خط كهرباء', category: 'utilities' },
    { value: 'road-edge', text: 'حافة طريق', category: 'transportation' },
    { value: 'curb', text: 'حافة الرصيف', category: 'transportation' },
    { value: 'pipe-line', text: 'خط أنابيب', category: 'utilities' },
  ],
  polygon: [
    { value: 'building', text: 'مبنى', category: 'structure' },
    { value: 'vacant-land', text: 'أرض فضاء', category: 'land' },
    { value: 'agricultural', text: 'مساحة زراعية', category: 'land' },
    { value: 'courtyard', text: 'عريم', category: 'space' },
    { value: 'roof', text: 'صبابة', category: 'structure' },
    { value: 'parking', text: 'موقف سيارات', category: 'transportation' },
    { value: 'garden', text: 'حديقة', category: 'vegetation' },
  ],
};

export const exportFormats: ExportFormat[] = [
  {
    format: 'csv',
    name: 'CSV',
    extension: 'csv',
    description: 'Comma Separated Values - جداول البيانات',
  },
  {
    format: 'geojson',
    name: 'GeoJSON',
    extension: 'geojson',
    description: 'Geographic JSON - البيانات الجغرافية',
  },
  {
    format: 'kml',
    name: 'KML',
    extension: 'kml',
    description: 'Google Earth Format - تنسيق جوجل إيرث',
  },
  {
    format: 'dxf',
    name: 'DXF',
    extension: 'dxf',
    description: 'AutoCAD Drawing - رسومات الأوتوكاد',
  },
];

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateArea(coordinates: [number, number][]): number {
  if (coordinates.length < 3) return 0;

  const earthRadius = 6371000; // meters
  let area = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const xi = coordinates[i][0] * Math.PI / 180;
    const yi = coordinates[i][1] * Math.PI / 180;
    const xj = coordinates[j][0] * Math.PI / 180;
    const yj = coordinates[j][1] * Math.PI / 180;

    area += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
  }

  area = Math.abs(area) * earthRadius * earthRadius / 2;
  return area;
}

export function formatCoordinate(value: number, type: 'lat' | 'lon'): string {
  const direction = type === 'lat' ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1) {
    return `${(meters * 100).toFixed(1)} سم`;
  } else if (meters < 1000) {
    return `${meters.toFixed(2)} م`;
  } else {
    return `${(meters / 1000).toFixed(3)} كم`;
  }
}

export function formatArea(squareMeters: number): string {
  if (squareMeters < 10000) {
    return `${squareMeters.toFixed(2)} م²`;
  } else {
    const hectares = squareMeters / 10000;
    return `${hectares.toFixed(4)} هكتار`;
  }
}

export function generatePointNumber(existingPoints: number): string {
  return `P${(existingPoints + 1).toString().padStart(3, '0')}`;
}

export function generateLineNumber(existingLines: number): string {
  return `L${(existingLines + 1).toString().padStart(3, '0')}`;
}

export function generatePolygonNumber(existingPolygons: number): string {
  return `PG${(existingPolygons + 1).toString().padStart(3, '0')}`;
}
