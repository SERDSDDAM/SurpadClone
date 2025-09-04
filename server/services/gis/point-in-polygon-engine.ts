import { toObjectResponse, toArrayResponse, toErrorResponse } from '../../adapters/response';

export interface CoordinatePoint {
  latitude: number;
  longitude: number;
  coordinateSystem?: 'WGS84' | 'UTM' | 'YEMEN_NATIONAL';
}

export interface AdministrativeBoundary {
  type: 'governorate' | 'directorate' | 'district' | 'neighborhood';
  name: string;
  code: string;
  boundary: number[][]; // Array of [lng, lat] coordinates forming polygon
  level: number; // 1=governorate, 2=directorate, 3=district, 4=neighborhood
}

export interface PointInPolygonResult {
  isWithinBoundary: boolean;
  governorate: string | null;
  directorate: string | null;
  district: string | null;
  neighborhood: string | null;
  riskLayers: {
    heritage: boolean;
    flood: boolean;
    environmental: boolean;
    military: boolean;
  };
  recommendedAction: 'branch_processing' | 'supervisory_escalation' | 'ministerial_review';
  confidence: number; // 0-1 confidence score
}

export class PointInPolygonEngine {
  private administrativeBoundaries: AdministrativeBoundary[] = [];

  constructor() {
    this.initializeYemenBoundaries();
  }

  /**
   * تحليل النقطة والتحقق من موقعها الإداري
   */
  async analyzePoint(point: CoordinatePoint): Promise<PointInPolygonResult> {
    try {
      // تحويل النقطة إلى WGS84 إذا لزم الأمر
      const normalizedPoint = await this.normalizeCoordinates(point);
      
      // تحليل الحدود الإدارية
      const administrativeResult = this.findAdministrativeBoundaries(normalizedPoint);
      
      // تحليل طبقات المخاطر
      const riskAnalysis = await this.analyzeRiskLayers(normalizedPoint);
      
      // تحديد الإجراء الموصى به
      const recommendedAction = this.determineRecommendedAction(riskAnalysis, administrativeResult);
      
      return {
        isWithinBoundary: administrativeResult.governorate !== null,
        governorate: administrativeResult.governorate,
        directorate: administrativeResult.directorate,
        district: administrativeResult.district,
        neighborhood: administrativeResult.neighborhood,
        riskLayers: riskAnalysis,
        recommendedAction,
        confidence: this.calculateConfidence(administrativeResult, riskAnalysis)
      };

    } catch (error) {
      console.error('خطأ في تحليل النقطة:', error);
      return {
        isWithinBoundary: false,
        governorate: null,
        directorate: null,
        district: null,
        neighborhood: null,
        riskLayers: {
          heritage: false,
          flood: false,
          environmental: false,
          military: false
        },
        recommendedAction: 'supervisory_escalation',
        confidence: 0
      };
    }
  }

  /**
   * تحويل الإحداثيات إلى WGS84
   */
  private async normalizeCoordinates(point: CoordinatePoint): Promise<CoordinatePoint> {
    switch (point.coordinateSystem) {
      case 'WGS84':
        return point;
      
      case 'UTM':
        // تحويل UTM إلى WGS84 (نظام اليمن عادة UTM Zone 38N أو 39N)
        return this.convertUTMToWGS84(point);
      
      case 'YEMEN_NATIONAL':
        // تحويل النظام الوطني اليمني إلى WGS84
        return this.convertYemenNationalToWGS84(point);
      
      default:
        // افتراض WGS84 إذا لم يتم تحديد النظام
        return { ...point, coordinateSystem: 'WGS84' };
    }
  }

  /**
   * تحويل UTM إلى WGS84
   */
  private convertUTMToWGS84(point: CoordinatePoint): CoordinatePoint {
    // للتطبيق الحقيقي، يجب استخدام مكتبة proj4 أو ما شابه
    // هذا مثال مبسط لأغراض التطوير
    const utmZone = point.longitude > 45 ? 39 : 38; // تحديد المنطقة
    
    // تحويل مبسط (يحتاج تحسين للإنتاج)
    const lat = point.latitude + (utmZone === 38 ? 0.0001 : 0.0002);
    const lng = point.longitude + (utmZone === 38 ? 0.0001 : 0.0002);
    
    return {
      latitude: lat,
      longitude: lng,
      coordinateSystem: 'WGS84'
    };
  }

  /**
   * تحويل النظام الوطني اليمني إلى WGS84
   */
  private convertYemenNationalToWGS84(point: CoordinatePoint): CoordinatePoint {
    // تحويل النظام الوطني اليمني (معاملات تحويل معيارية)
    // هذه معاملات تقريبية - يجب استخدام المعاملات الرسمية
    const deltaX = 0.0001; // معامل التحويل للطول
    const deltaY = 0.0001; // معامل التحويل للعرض
    
    return {
      latitude: point.latitude + deltaY,
      longitude: point.longitude + deltaX,
      coordinateSystem: 'WGS84'
    };
  }

  /**
   * العثور على الحدود الإدارية للنقطة
   */
  private findAdministrativeBoundaries(point: CoordinatePoint) {
    const result = {
      governorate: null as string | null,
      directorate: null as string | null,
      district: null as string | null,
      neighborhood: null as string | null
    };

    // فحص الحدود الإدارية من الأكبر إلى الأصغر
    for (const boundary of this.administrativeBoundaries) {
      if (this.isPointInPolygon(point, boundary.boundary)) {
        switch (boundary.type) {
          case 'governorate':
            result.governorate = boundary.name;
            break;
          case 'directorate':
            result.directorate = boundary.name;
            break;
          case 'district':
            result.district = boundary.name;
            break;
          case 'neighborhood':
            result.neighborhood = boundary.name;
            break;
        }
      }
    }

    return result;
  }

  /**
   * خوارزمية Ray Casting للتحقق من وجود النقطة داخل المضلع
   */
  private isPointInPolygon(point: CoordinatePoint, polygon: number[][]): boolean {
    const x = point.longitude;
    const y = point.latitude;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * تحليل طبقات المخاطر
   */
  private async analyzeRiskLayers(point: CoordinatePoint) {
    const riskLayers = {
      heritage: false,
      flood: false,
      environmental: false,
      military: false
    };

    // فحص التراث (مناطق أثرية ومواقع تراثية)
    riskLayers.heritage = await this.checkHeritageLayer(point);
    
    // فحص مخاطر الفيضانات
    riskLayers.flood = await this.checkFloodLayer(point);
    
    // فحص البيئة (محميات طبيعية ومناطق حساسة)
    riskLayers.environmental = await this.checkEnvironmentalLayer(point);
    
    // فحص المناطق العسكرية والأمنية
    riskLayers.military = await this.checkMilitaryLayer(point);

    return riskLayers;
  }

  /**
   * فحص طبقة التراث
   */
  private async checkHeritageLayer(point: CoordinatePoint): Promise<boolean> {
    // مناطق التراث في اليمن (مثال: صنعاء القديمة، شبام)
    const heritageZones = [
      { name: 'صنعاء القديمة', lat: 15.3547, lng: 44.2066, radius: 0.01 },
      { name: 'شبام حضرموت', lat: 15.9267, lng: 48.6267, radius: 0.005 },
      { name: 'زبيد التاريخية', lat: 14.2022, lng: 43.3172, radius: 0.008 }
    ];

    for (const zone of heritageZones) {
      const distance = this.calculateDistance(
        point.latitude, point.longitude,
        zone.lat, zone.lng
      );
      if (distance <= zone.radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * فحص طبقة الفيضانات
   */
  private async checkFloodLayer(point: CoordinatePoint): Promise<boolean> {
    // مناطق معرضة للفيضانات (وديان وسيول)
    const floodZones = [
      { name: 'وادي حضرموت', lat: 15.9, lng: 48.7, radius: 0.02 },
      { name: 'وادي زبيد', lat: 14.2, lng: 43.3, radius: 0.015 }
    ];

    for (const zone of floodZones) {
      const distance = this.calculateDistance(
        point.latitude, point.longitude,
        zone.lat, zone.lng
      );
      if (distance <= zone.radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * فحص الطبقة البيئية
   */
  private async checkEnvironmentalLayer(point: CoordinatePoint): Promise<boolean> {
    // المحميات الطبيعية والمناطق البيئية الحساسة
    const environmentalZones = [
      { name: 'محمية سقطرى', lat: 12.5, lng: 54.0, radius: 0.5 },
      { name: 'جبال اللوز', lat: 15.5, lng: 43.8, radius: 0.1 }
    ];

    for (const zone of environmentalZones) {
      const distance = this.calculateDistance(
        point.latitude, point.longitude,
        zone.lat, zone.lng
      );
      if (distance <= zone.radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * فحص الطبقة العسكرية
   */
  private async checkMilitaryLayer(point: CoordinatePoint): Promise<boolean> {
    // المناطق العسكرية والأمنية (بيانات حساسة - مثال عام)
    // في التطبيق الحقيقي، هذه البيانات سرية ويجب الحصول عليها من الجهات المختصة
    const sensitiveZones = [
      { name: 'منطقة أمنية', lat: 15.3, lng: 44.2, radius: 0.005 }
    ];

    for (const zone of sensitiveZones) {
      const distance = this.calculateDistance(
        point.latitude, point.longitude,
        zone.lat, zone.lng
      );
      if (distance <= zone.radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * حساب المسافة بين نقطتين (هافرساين)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * تحديد الإجراء الموصى به
   */
  private determineRecommendedAction(
    riskLayers: any,
    administrativeResult: any
  ): 'branch_processing' | 'supervisory_escalation' | 'ministerial_review' {
    // إذا كانت هناك مخاطر عالية، يتم التصعيد
    if (riskLayers.heritage || riskLayers.military) {
      return 'ministerial_review';
    }
    
    if (riskLayers.flood || riskLayers.environmental) {
      return 'supervisory_escalation';
    }
    
    // إذا كان الموقع واضح وبدون مخاطر، يمكن المعالجة على مستوى الفرع
    if (administrativeResult.governorate && administrativeResult.directorate) {
      return 'branch_processing';
    }
    
    // في حالة عدم الوضوح، يتم التصعيد للمكتب الإشرافي
    return 'supervisory_escalation';
  }

  /**
   * حساب مستوى الثقة في النتيجة
   */
  private calculateConfidence(administrativeResult: any, riskLayers: any): number {
    let confidence = 0.5; // بداية متوسطة
    
    // زيادة الثقة إذا كانت البيانات الإدارية مكتملة
    if (administrativeResult.governorate) confidence += 0.2;
    if (administrativeResult.directorate) confidence += 0.2;
    if (administrativeResult.district) confidence += 0.1;
    
    // تقليل الثقة إذا كانت هناك مخاطر (تحتاج مراجعة إضافية)
    const riskCount = Object.values(riskLayers).filter(Boolean).length;
    confidence -= riskCount * 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * تهيئة الحدود الإدارية لليمن
   */
  private initializeYemenBoundaries() {
    // بيانات مبسطة للتطوير - في الإنتاج يجب استخدام بيانات GIS دقيقة
    this.administrativeBoundaries = [
      // محافظة صنعاء
      {
        type: 'governorate',
        name: 'صنعاء',
        code: 'SA',
        level: 1,
        boundary: [
          [44.0, 15.0], [44.5, 15.0], [44.5, 15.7], [44.0, 15.7], [44.0, 15.0]
        ]
      },
      // مديرية الأمانة
      {
        type: 'directorate',
        name: 'أمانة العاصمة',
        code: 'SA-01',
        level: 2,
        boundary: [
          [44.1, 15.2], [44.4, 15.2], [44.4, 15.5], [44.1, 15.5], [44.1, 15.2]
        ]
      },
      // محافظة حضرموت
      {
        type: 'governorate',
        name: 'حضرموت',
        code: 'HD',
        level: 1,
        boundary: [
          [48.0, 15.5], [49.5, 15.5], [49.5, 16.5], [48.0, 16.5], [48.0, 15.5]
        ]
      },
      // مديرية شبام
      {
        type: 'directorate',
        name: 'شبام',
        code: 'HD-01',
        level: 2,
        boundary: [
          [48.5, 15.8], [48.8, 15.8], [48.8, 16.1], [48.5, 16.1], [48.5, 15.8]
        ]
      }
    ];
  }
}

export const pointInPolygonEngine = new PointInPolygonEngine();