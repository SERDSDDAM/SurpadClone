import { z } from 'zod';

// Schema للتحقق من ملف GeoJSON المحافظات
export const governorateGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      geometry: z.object({
        type: z.enum(['Polygon', 'MultiPolygon']),
        coordinates: z.array(z.any()) // سيتم التحقق من التفاصيل في الكود
      }),
      properties: z.object({
        code: z.string().min(1).max(10, 'كود المحافظة يجب ألا يتجاوز 10 أحرف'),
        name_ar: z.string().min(1, 'الاسم العربي مطلوب').max(100),
        name_en: z.string().min(1, 'الاسم الإنجليزي مطلوب').max(100),
        population: z.number().positive().optional(),
        capital: z.string().max(100).optional()
      })
    })
  ).min(1, 'يجب أن يحتوي الملف على محافظة واحدة على الأقل')
});

// Schema للتحقق من ملف GeoJSON المديريات
export const districtGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      geometry: z.object({
        type: z.enum(['Polygon', 'MultiPolygon']),
        coordinates: z.array(z.any())
      }),
      properties: z.object({
        admin1Pcod: z.string().min(1, 'كود المحافظة مطلوب'),
        admin2Pcod: z.string().min(1).max(15, 'كود المديرية يجب ألا يتجاوز 15 حرف'),
        admin2Name: z.string().min(1, 'اسم المديرية مطلوب').max(100),
        admin2Na_1: z.string().max(100).optional() // الاسم العربي
      })
    })
  ).min(1, 'يجب أن يحتوي الملف على مديرية واحدة على الأقل')
});

// Schema للتحقق من ملف GeoJSON العزل
export const subDistrictGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      geometry: z.object({
        type: z.enum(['Polygon', 'MultiPolygon']),
        coordinates: z.array(z.any())
      }),
      properties: z.object({
        admin2Pcod: z.string().min(1, 'كود المديرية مطلوب'),
        admin3Pcod: z.string().min(1).max(20, 'كود العزلة يجب ألا يتجاوز 20 حرف'),
        admin3Name: z.string().min(1, 'اسم العزلة مطلوب').max(100),
        admin3Na_1: z.string().max(100).optional() // الاسم العربي
      })
    })
  ).min(1, 'يجب أن يحتوي الملف على عزلة واحدة على الأقل')
});

// Schema للتحقق من بيانات الاستعلام
export const geographicQuerySchema = z.object({
  includeGeometry: z.string().optional().default('false'),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/, 'الحد الأقصى يجب أن يكون رقم').optional().default('50'),
  offset: z.string().regex(/^\d+$/, 'الإزاحة يجب أن يكون رقم').optional().default('0'),
  governorateId: z.string().uuid().optional(),
  governorateCode: z.string().optional(),
  districtId: z.string().uuid().optional(),
  districtCode: z.string().optional()
});

// Schema للتحقق من معاملات الملف المرفوع
export const fileUploadSchema = z.object({
  originalname: z.string().min(1, 'اسم الملف مطلوب'),
  mimetype: z.enum(['application/json', 'application/geo+json']).refine(
    val => val === 'application/json' || val === 'application/geo+json',
    'نوع الملف يجب أن يكون GeoJSON'
  ),
  size: z.number().max(100 * 1024 * 1024, 'حجم الملف يجب ألا يتجاوز 100MB'),
  path: z.string().min(1, 'مسار الملف مطلوب')
});

// وظيفة للتحقق من صحة إحداثيات GeoJSON
export function validateGeoJsonCoordinates(geometry: any): boolean {
  if (!geometry || !geometry.coordinates) {
    return false;
  }

  try {
    const { type, coordinates } = geometry;
    
    switch (type) {
      case 'Polygon':
        return validatePolygonCoordinates(coordinates);
      case 'MultiPolygon':
        return Array.isArray(coordinates) && 
               coordinates.every(polygon => validatePolygonCoordinates(polygon));
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

function validatePolygonCoordinates(coordinates: any): boolean {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return false;
  }

  // التحقق من الحلقة الخارجية على الأقل
  const outerRing = coordinates[0];
  if (!Array.isArray(outerRing) || outerRing.length < 4) {
    return false; // المضلع يحتاج 4 نقاط على الأقل (مغلق)
  }

  // التحقق من كل نقطة في الحلقة
  return outerRing.every((point: any) => {
    return Array.isArray(point) && 
           point.length >= 2 && 
           typeof point[0] === 'number' && // خط الطول
           typeof point[1] === 'number' && // خط العرض
           point[0] >= -180 && point[0] <= 180 && // خط طول صحيح
           point[1] >= -90 && point[1] <= 90; // خط عرض صحيح
  });
}

// Schema للتحقق من حدود الخريطة
export const boundsSchema = z.array(z.number()).length(4).refine(
  (bounds) => {
    const [minLng, minLat, maxLng, maxLat] = bounds;
    return minLng >= -180 && minLng <= 180 &&
           minLat >= -90 && minLat <= 90 &&
           maxLng >= -180 && maxLng <= 180 &&
           maxLat >= -90 && maxLat <= 90 &&
           minLng < maxLng && minLat < maxLat;
  },
  'حدود الخريطة غير صحيحة'
);

// Middleware للتحقق من صحة البيانات المرفوعة
export function validateFileUpload(schema: z.ZodSchema) {
  return async (req: any, res: any, next: any) => {
    try {
      // التحقق من وجود الملف
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'لم يتم رفع ملف',
          code: 'FILE_REQUIRED'
        });
      }

      // التحقق من بيانات الملف الأساسية
      const fileValidation = fileUploadSchema.safeParse(req.file);
      if (!fileValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'بيانات الملف غير صحيحة',
          details: fileValidation.error.errors,
          code: 'INVALID_FILE_DATA'
        });
      }

      // قراءة وتحليل محتوى الملف
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(req.file.path, 'utf8');
      
      let geoJsonData;
      try {
        geoJsonData = JSON.parse(fileContent);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'ملف GeoJSON غير صالح - خطأ في التحليل',
          code: 'INVALID_JSON'
        });
      }

      // التحقق من صحة بنية GeoJSON
      const validation = schema.safeParse(geoJsonData);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'بنية GeoJSON غير صحيحة',
          details: validation.error.errors,
          code: 'INVALID_GEOJSON_STRUCTURE'
        });
      }

      // التحقق من صحة الإحداثيات الجغرافية
      const hasInvalidGeometry = geoJsonData.features.some((feature: any) => 
        !validateGeoJsonCoordinates(feature.geometry)
      );

      if (hasInvalidGeometry) {
        return res.status(400).json({
          success: false,
          error: 'إحداثيات جغرافية غير صحيحة في الملف',
          code: 'INVALID_COORDINATES'
        });
      }

      // إضافة البيانات المحققة إلى الطلب
      req.validatedGeoJson = validation.data;
      next();

    } catch (error) {
      console.error('❌ خطأ في التحقق من صحة الملف:', error);
      res.status(500).json({
        success: false,
        error: 'خطأ في التحقق من صحة الملف',
        code: 'VALIDATION_ERROR'
      });
    }
  };
}