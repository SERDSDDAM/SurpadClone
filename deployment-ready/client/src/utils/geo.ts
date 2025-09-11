// utils/geo.ts
export function toLeafletBounds(raw: any, metaCrs = 'EPSG:4326') {
  if (!raw) return null;

  // bbox [west, south, east, north]
  if (Array.isArray(raw) && raw.length === 4 && typeof raw[0] === 'number') {
    const [w,s,e,n] = raw;
    return [[s,w],[n,e]];
  }

  // array-of-2-points [[a,b],[c,d]]
  if (Array.isArray(raw[0]) && Array.isArray(raw[1])) {
    const p1 = raw[0], p2 = raw[1]; // ambiguous
    // If metaCrs is EPSG:4326 assume [lat, lon] pairs (Leaflet style)
    if (metaCrs && metaCrs.includes('4326')) {
      return raw; // assume already [[south, west],[north, east]] or [[lat,lon],[lat,lon]]
    }
    // otherwise assume already correct (caller should prefer leaflet_bounds)
    return raw;
  }

  return null;
}

export function validateBounds(bounds: any): boolean {
  if (!bounds || !Array.isArray(bounds)) return false;
  if (bounds.length !== 2) return false;
  if (!Array.isArray(bounds[0]) || !Array.isArray(bounds[1])) return false;
  if (bounds[0].length !== 2 || bounds[1].length !== 2) return false;
  return bounds.every(([lat, lng]: [number, number]) => 
    typeof lat === 'number' && typeof lng === 'number' && 
    !isNaN(lat) && !isNaN(lng)
  );
}