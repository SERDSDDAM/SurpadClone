export interface GPSData {
  longitude: number;
  latitude: number;
  elevation?: number;
  accuracy: number;
  satelliteCount: number;
  timestamp: Date;
}

export interface SurveyTool {
  type: 'point' | 'line' | 'polygon';
  icon: string;
  name: string;
  active: boolean;
}

export interface FeatureCode {
  value: string;
  text: string;
  category: string;
}

export interface SurveyStats {
  pointsCount: number;
  linesCount: number;
  polygonsCount: number;
}

export interface CoordinateSystem {
  name: string;
  code: string;
  projection: string;
}

export interface ExportFormat {
  format: string;
  name: string;
  extension: string;
  description: string;
}
