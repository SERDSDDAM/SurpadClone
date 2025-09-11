import L, { LatLng } from 'leaflet';

export interface GeometryMetrics {
  area?: number;          // m²
  length?: number;        // m  
  perimeter?: number;     // m
  centroid?: [number, number]; // [lng, lat]
}

/**
 * Calculate metrics for different geometry types
 */
export function calculateGeometryMetrics(geometry: any): GeometryMetrics {
  switch (geometry.type) {
    case 'Point':
      return calculatePointMetrics(geometry);
    case 'LineString':
      return calculateLineStringMetrics(geometry);
    case 'Polygon':
      return calculatePolygonMetrics(geometry);
    case 'MultiPoint':
      return calculateMultiPointMetrics(geometry);
    case 'MultiLineString':
      return calculateMultiLineStringMetrics(geometry);
    case 'MultiPolygon':
      return calculateMultiPolygonMetrics(geometry);
    default:
      return {};
  }
}

function calculatePointMetrics(geometry: any): GeometryMetrics {
  return {
    centroid: geometry.coordinates
  };
}

function calculateLineStringMetrics(geometry: any): GeometryMetrics {
  const coordinates = geometry.coordinates;
  let totalLength = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = L.latLng(coordinates[i][1], coordinates[i][0]);
    const point2 = L.latLng(coordinates[i + 1][1], coordinates[i + 1][0]);
    totalLength += point1.distanceTo(point2);
  }
  
  // Calculate centroid (midpoint of line)
  const midIndex = Math.floor(coordinates.length / 2);
  const centroid: [number, number] = [
    coordinates[midIndex][0],
    coordinates[midIndex][1]
  ];
  
  return {
    length: totalLength,
    centroid
  };
}

function calculatePolygonMetrics(geometry: any): GeometryMetrics {
  const coordinates = geometry.coordinates[0]; // Outer ring
  let area = 0;
  let perimeter = 0;
  
  // Calculate area using shoelace formula
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    area += (x1 * y2 - x2 * y1);
  }
  area = Math.abs(area) / 2;
  
  // Convert to square meters (rough approximation)
  area = area * 111111 * 111111 * Math.cos(coordinates[0][1] * Math.PI / 180);
  
  // Calculate perimeter
  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = L.latLng(coordinates[i][1], coordinates[i][0]);
    const point2 = L.latLng(coordinates[i + 1][1], coordinates[i + 1][0]);
    perimeter += point1.distanceTo(point2);
  }
  
  // Calculate centroid
  let centroidX = 0;
  let centroidY = 0;
  const len = coordinates.length - 1; // Exclude closing point
  
  for (let i = 0; i < len; i++) {
    centroidX += coordinates[i][0];
    centroidY += coordinates[i][1];
  }
  
  const centroid: [number, number] = [
    centroidX / len,
    centroidY / len
  ];
  
  return {
    area: Math.round(area),
    perimeter: Math.round(perimeter),
    centroid
  };
}

function calculateMultiPointMetrics(geometry: any): GeometryMetrics {
  const coordinates = geometry.coordinates;
  
  // Calculate centroid of all points
  let centroidX = 0;
  let centroidY = 0;
  
  for (const coord of coordinates) {
    centroidX += coord[0];
    centroidY += coord[1];
  }
  
  const centroid: [number, number] = [
    centroidX / coordinates.length,
    centroidY / coordinates.length
  ];
  
  return { centroid };
}

function calculateMultiLineStringMetrics(geometry: any): GeometryMetrics {
  let totalLength = 0;
  const allCoordinates: number[][] = [];
  
  for (const lineCoordinates of geometry.coordinates) {
    // Calculate length for this line
    for (let i = 0; i < lineCoordinates.length - 1; i++) {
      const point1 = L.latLng(lineCoordinates[i][1], lineCoordinates[i][0]);
      const point2 = L.latLng(lineCoordinates[i + 1][1], lineCoordinates[i + 1][0]);
      totalLength += point1.distanceTo(point2);
    }
    
    // Collect all coordinates for centroid
    allCoordinates.push(...lineCoordinates);
  }
  
  // Calculate overall centroid
  let centroidX = 0;
  let centroidY = 0;
  
  for (const coord of allCoordinates) {
    centroidX += coord[0];
    centroidY += coord[1];
  }
  
  const centroid: [number, number] = [
    centroidX / allCoordinates.length,
    centroidY / allCoordinates.length
  ];
  
  return {
    length: totalLength,
    centroid
  };
}

function calculateMultiPolygonMetrics(geometry: any): GeometryMetrics {
  let totalArea = 0;
  let totalPerimeter = 0;
  const allCoordinates: number[][] = [];
  
  for (const polygonCoordinates of geometry.coordinates) {
    const ring = polygonCoordinates[0]; // Outer ring
    
    // Calculate area for this polygon
    let polygonArea = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      polygonArea += (x1 * y2 - x2 * y1);
    }
    polygonArea = Math.abs(polygonArea) / 2;
    polygonArea = polygonArea * 111111 * 111111 * Math.cos(ring[0][1] * Math.PI / 180);
    totalArea += polygonArea;
    
    // Calculate perimeter for this polygon
    for (let i = 0; i < ring.length - 1; i++) {
      const point1 = L.latLng(ring[i][1], ring[i][0]);
      const point2 = L.latLng(ring[i + 1][1], ring[i + 1][0]);
      totalPerimeter += point1.distanceTo(point2);
    }
    
    // Collect coordinates for centroid (excluding closing point)
    allCoordinates.push(...ring.slice(0, -1));
  }
  
  // Calculate overall centroid
  let centroidX = 0;
  let centroidY = 0;
  
  for (const coord of allCoordinates) {
    centroidX += coord[0];
    centroidY += coord[1];
  }
  
  const centroid: [number, number] = [
    centroidX / allCoordinates.length,
    centroidY / allCoordinates.length
  ];
  
  return {
    area: Math.round(totalArea),
    perimeter: Math.round(totalPerimeter),
    centroid
  };
}

/**
 * Format area for display
 */
export function formatArea(area: number): string {
  if (area < 10000) {
    return `${area.toFixed(0)} متر²`;
  } else if (area < 1000000) {
    return `${(area / 10000).toFixed(2)} هكتار`;
  } else {
    return `${(area / 1000000).toFixed(2)} كم²`;
  }
}

/**
 * Format length for display
 */
export function formatLength(length: number): string {
  if (length < 1000) {
    return `${length.toFixed(0)} متر`;
  } else {
    return `${(length / 1000).toFixed(2)} كم`;
  }
}

/**
 * Validate geometry
 */
export function validateGeometry(geometry: any): { valid: boolean; error?: string } {
  try {
    switch (geometry.type) {
      case 'Point':
        if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length !== 2) {
          return { valid: false, error: 'نقطة غير صحيحة: يجب أن تحتوي على إحداثيين' };
        }
        break;
        
      case 'LineString':
        if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
          return { valid: false, error: 'خط غير صحيح: يجب أن يحتوي على نقطتين على الأقل' };
        }
        break;
        
      case 'Polygon':
        if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 1) {
          return { valid: false, error: 'مضلع غير صحيح: يجب أن يحتوي على حلقة واحدة على الأقل' };
        }
        
        const ring = geometry.coordinates[0];
        if (!Array.isArray(ring) || ring.length < 4) {
          return { valid: false, error: 'مضلع غير صحيح: يجب أن تحتوي الحلقة على 4 نقاط على الأقل' };
        }
        
        // Check if ring is closed
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          return { valid: false, error: 'مضلع غير صحيح: الحلقة يجب أن تكون مغلقة' };
        }
        break;
        
      default:
        return { valid: false, error: `نوع الهندسة غير مدعوم: ${geometry.type}` };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'خطأ في التحقق من الهندسة' };
  }
}