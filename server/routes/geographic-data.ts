import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { 
  governorates, 
  districts, 
  subDistricts, 
  insertGovernorateSchema,
  insertDistrictSchema,
  insertSubDistrictSchema,
  type Governorate,
  type District,
  type SubDistrict
} from '@shared/schema';
import { db } from '../db';
import { eq, and, sql, like, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

// ========== MULTER CONFIGURATION FOR FILE UPLOADS ==========

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'temp-uploads/geographic-data';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${path.basename(file.originalname, ext)}_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.geojson', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بملفات GeoJSON'));
    }
  }
});

// ========== UTILITY FUNCTIONS ==========

/**
 * حساب الحدود الجغرافية من هندسة GeoJSON
 */
function calculateBounds(geometry: any): [number, number, number, number] | null {
  if (!geometry || !geometry.coordinates) return null;

  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;

  const processCoords = (coords: any) => {
    if (Array.isArray(coords[0])) {
      coords.forEach(processCoords);
    } else {
      const [lng, lat] = coords;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  };

  processCoords(geometry.coordinates);

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * حساب المساحة التقريبية للمضلع
 */
function calculatePolygonArea(geometry: any): number | null {
  if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) {
    return null;
  }

  let totalArea = 0;
  const earthRadius = 6371000; // meters

  const calculateRingArea = (ring: number[][]) => {
    if (ring.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      area += (p2[0] - p1[0]) * (Math.PI / 180) * earthRadius * earthRadius * 
              Math.cos((p1[1] + p2[1]) * Math.PI / 360);
    }
    return Math.abs(area) / 1000000; // Convert to km²
  };

  if (geometry.type === 'Polygon') {
    totalArea = calculateRingArea(geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon: number[][][]) => {
      totalArea += calculateRingArea(polygon[0]);
    });
  }

  return totalArea;
}

// ========== GOVERNORATES ENDPOINTS ==========

// GET /api/geographic/governorates - جلب جميع المحافظات
router.get('/governorates', async (req: Request, res: Response) => {
  try {
    const { includeGeometry = false, search, limit = 50, offset = 0 } = req.query;
    
    let query = db.select({
      id: governorates.id,
      code: governorates.code,
      nameAr: governorates.nameAr,
      nameEn: governorates.nameEn,
      bounds: governorates.bounds,
      area: governorates.area,
      population: governorates.population,
      capitalCity: governorates.capitalCity,
      isActive: governorates.isActive,
      createdAt: governorates.createdAt,
      updatedAt: governorates.updatedAt,
      ...(includeGeometry === 'true' && { geometry: governorates.geometry })
    }).from(governorates).where(eq(governorates.isActive, true));

    if (search) {
      query = query.where(
        and(
          eq(governorates.isActive, true),
          sql`(${governorates.nameAr} ILIKE ${`%${search}%`} OR ${governorates.nameEn} ILIKE ${`%${search}%`} OR ${governorates.code} ILIKE ${`%${search}%`})`
        )
      );
    }

    query = query.limit(Number(limit)).offset(Number(offset)).orderBy(governorates.nameAr);

    const allGovernorates = await query;
    
    res.json({
      success: true,
      data: allGovernorates,
      count: allGovernorates.length,
      message: `✅ ${allGovernorates.length} محافظة`
    });
  } catch (error) {
    console.error('خطأ في جلب المحافظات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب البيانات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// GET /api/geographic/governorates/:code - جلب محافظة محددة
router.get('/governorates/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { includeGeometry = false } = req.query;
    
    const selectFields = {
      id: governorates.id,
      code: governorates.code,
      nameAr: governorates.nameAr,
      nameEn: governorates.nameEn,
      bounds: governorates.bounds,
      area: governorates.area,
      population: governorates.population,
      capitalCity: governorates.capitalCity,
      isActive: governorates.isActive,
      createdAt: governorates.createdAt,
      updatedAt: governorates.updatedAt,
      ...(includeGeometry === 'true' && { geometry: governorates.geometry })
    };

    const governorate = await db.select(selectFields)
      .from(governorates)
      .where(eq(governorates.code, code))
      .limit(1);

    if (governorate.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'المحافظة غير موجودة',
        message: `لم يتم العثور على محافظة بالكود: ${code}`
      });
    }

    res.json({
      success: true,
      data: governorate[0],
      message: `✅ بيانات محافظة ${governorate[0].nameAr}`
    });
  } catch (error) {
    console.error('خطأ في جلب المحافظة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب البيانات'
    });
  }
});

// POST /api/geographic/governorates/upload - رفع ملف GeoJSON للمحافظات
router.post('/governorates/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('🌍 بدء رفع ملف المحافظات الجغرافي');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم العثور على ملف'
      });
    }

    const filePath = req.file.path;
    console.log(`📁 قراءة الملف: ${filePath}`);

    // قراءة وتحليل ملف GeoJSON
    const fileContent = await fs.readFile(filePath, 'utf8');
    const geoJsonData = JSON.parse(fileContent);

    if (geoJsonData.type !== 'FeatureCollection' || !Array.isArray(geoJsonData.features)) {
      return res.status(400).json({
        success: false,
        error: 'تنسيق GeoJSON غير صحيح'
      });
    }

    console.log(`📊 عدد المحافظات في الملف: ${geoJsonData.features.length}`);

    // معالجة البيانات وحفظها
    const processedGovernorates = [];
    let insertedCount = 0;
    let updatedCount = 0;

    for (const feature of geoJsonData.features) {
      const properties = feature.properties;
      
      // التحقق من البيانات المطلوبة
      if (!properties.name_ar || !properties.name_en || !properties.code) {
        console.warn('⚠️ تخطي محافظة بسبب نقص البيانات:', properties);
        continue;
      }

      // حساب الحدود والمساحة
      const bounds = calculateBounds(feature.geometry);
      const area = calculatePolygonArea(feature.geometry);

      const governorateData = {
        code: properties.code,
        nameAr: properties.name_ar,
        nameEn: properties.name_en,
        geometry: feature.geometry,
        bounds: bounds,
        area: area,
        population: properties.population || null,
        capitalCity: properties.capital || null
      };

      // التحقق من وجود المحافظة مسبقاً
      const existingGov = await db.select()
        .from(governorates)
        .where(eq(governorates.code, governorateData.code))
        .limit(1);

      if (existingGov.length > 0) {
        // تحديث المحافظة الموجودة
        await db.update(governorates)
          .set({
            nameAr: governorateData.nameAr,
            nameEn: governorateData.nameEn,
            geometry: governorateData.geometry,
            bounds: governorateData.bounds,
            area: governorateData.area,
            population: governorateData.population,
            capitalCity: governorateData.capitalCity,
            updatedAt: new Date()
          })
          .where(eq(governorates.code, governorateData.code));
        
        updatedCount++;
        console.log(`📝 تم تحديث: ${governorateData.nameAr} (${governorateData.code})`);
      } else {
        // إدراج محافظة جديدة
        await db.insert(governorates).values(governorateData);
        insertedCount++;
        console.log(`✅ تم إدراج: ${governorateData.nameAr} (${governorateData.code})`);
      }

      processedGovernorates.push({
        code: governorateData.code,
        nameAr: governorateData.nameAr,
        nameEn: governorateData.nameEn
      });
    }

    // حذف الملف المؤقت
    await fs.unlink(filePath);

    console.log(`🎉 اكتملت المعالجة: ${insertedCount} جديد، ${updatedCount} محدث`);

    res.json({
      success: true,
      data: {
        inserted: insertedCount,
        updated: updatedCount,
        total: processedGovernorates.length,
        governorates: processedGovernorates
      },
      message: `✅ تم معالجة ${processedGovernorates.length} محافظة بنجاح`
    });

  } catch (error) {
    console.error('❌ خطأ في معالجة ملف المحافظات:', error);
    
    // حذف الملف المؤقت في حالة الخطأ
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('خطأ في حذف الملف المؤقت:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'فشل في معالجة ملف المحافظات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// ========== DISTRICTS ENDPOINTS ==========

// GET /api/geographic/districts - جلب جميع المديريات
router.get('/districts', async (req: Request, res: Response) => {
  try {
    const { governorateId, governorateCode, includeGeometry = false, search, limit = 100, offset = 0 } = req.query;
    
    let query = db.select({
      id: districts.id,
      governorateId: districts.governorateId,
      code: districts.code,
      nameAr: districts.nameAr,
      nameEn: districts.nameEn,
      bounds: districts.bounds,
      area: districts.area,
      population: districts.population,
      isActive: districts.isActive,
      createdAt: districts.createdAt,
      updatedAt: districts.updatedAt,
      ...(includeGeometry === 'true' && { geometry: districts.geometry })
    }).from(districts).where(eq(districts.isActive, true));

    if (governorateId) {
      query = query.where(
        and(
          eq(districts.isActive, true),
          eq(districts.governorateId, governorateId as string)
        )
      );
    }

    if (governorateCode) {
      // البحث بكود المحافظة
      const governorate = await db.select({ id: governorates.id })
        .from(governorates)
        .where(eq(governorates.code, governorateCode as string))
        .limit(1);
      
      if (governorate.length > 0) {
        query = query.where(
          and(
            eq(districts.isActive, true),
            eq(districts.governorateId, governorate[0].id)
          )
        );
      }
    }

    if (search) {
      query = query.where(
        and(
          eq(districts.isActive, true),
          sql`(${districts.nameAr} ILIKE ${`%${search}%`} OR ${districts.nameEn} ILIKE ${`%${search}%`} OR ${districts.code} ILIKE ${`%${search}%`})`
        )
      );
    }

    query = query.limit(Number(limit)).offset(Number(offset)).orderBy(districts.nameAr);

    const allDistricts = await query;
    
    res.json({
      success: true,
      data: allDistricts,
      count: allDistricts.length,
      message: `✅ ${allDistricts.length} مديرية`
    });
  } catch (error) {
    console.error('خطأ في جلب المديريات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب البيانات'
    });
  }
});

// POST /api/geographic/districts/upload - رفع ملف GeoJSON للمديريات
router.post('/districts/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('🏘️ بدء رفع ملف المديريات الجغرافي');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم العثور على ملف'
      });
    }

    const filePath = req.file.path;
    console.log(`📁 قراءة الملف: ${filePath}`);

    // قراءة وتحليل ملف GeoJSON
    const fileContent = await fs.readFile(filePath, 'utf8');
    const geoJsonData = JSON.parse(fileContent);

    if (geoJsonData.type !== 'FeatureCollection' || !Array.isArray(geoJsonData.features)) {
      return res.status(400).json({
        success: false,
        error: 'تنسيق GeoJSON غير صحيح'
      });
    }

    console.log(`📊 عدد المديريات في الملف: ${geoJsonData.features.length}`);

    // بناء خريطة المحافظات للربط
    const governoratesMap = new Map<string, string>();
    const govs = await db.select({ id: governorates.id, code: governorates.code }).from(governorates);
    govs.forEach(gov => governoratesMap.set(gov.code, gov.id));

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const feature of geoJsonData.features) {
      const properties = feature.properties;
      
      // التحقق من البيانات المطلوبة
      if (!properties.admin2Name || !properties.admin2Pcod || !properties.admin1Pcod) {
        console.warn('⚠️ تخطي مديرية بسبب نقص البيانات:', properties);
        skippedCount++;
        continue;
      }

      // العثور على المحافظة المرتبطة
      const governorateId = governoratesMap.get(properties.admin1Pcod);
      if (!governorateId) {
        console.warn(`⚠️ تخطي مديرية ${properties.admin2Name}: لم يتم العثور على المحافظة ${properties.admin1Pcod}`);
        skippedCount++;
        continue;
      }

      const bounds = calculateBounds(feature.geometry);
      const area = calculatePolygonArea(feature.geometry);

      const districtData = {
        governorateId: governorateId,
        code: properties.admin2Pcod,
        nameAr: properties.admin2Na_1 || properties.admin2Name,
        nameEn: properties.admin2Name,
        geometry: feature.geometry,
        bounds: bounds,
        area: area,
        population: null // سيتم إضافتها لاحقاً
      };

      // التحقق من وجود المديرية مسبقاً
      const existingDistrict = await db.select()
        .from(districts)
        .where(eq(districts.code, districtData.code))
        .limit(1);

      if (existingDistrict.length > 0) {
        // تحديث المديرية الموجودة
        await db.update(districts)
          .set({
            governorateId: districtData.governorateId,
            nameAr: districtData.nameAr,
            nameEn: districtData.nameEn,
            geometry: districtData.geometry,
            bounds: districtData.bounds,
            area: districtData.area,
            updatedAt: new Date()
          })
          .where(eq(districts.code, districtData.code));
        
        updatedCount++;
        console.log(`📝 تم تحديث: ${districtData.nameAr} (${districtData.code})`);
      } else {
        // إدراج مديرية جديدة
        await db.insert(districts).values(districtData);
        insertedCount++;
        console.log(`✅ تم إدراج: ${districtData.nameAr} (${districtData.code})`);
      }
    }

    // حذف الملف المؤقت
    await fs.unlink(filePath);

    console.log(`🎉 اكتملت معالجة المديريات: ${insertedCount} جديد، ${updatedCount} محدث، ${skippedCount} متخطى`);

    res.json({
      success: true,
      data: {
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: geoJsonData.features.length
      },
      message: `✅ تم معالجة ${insertedCount + updatedCount} مديرية من أصل ${geoJsonData.features.length}`
    });

  } catch (error) {
    console.error('❌ خطأ في معالجة ملف المديريات:', error);
    
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('خطأ في حذف الملف المؤقت:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'فشل في معالجة ملف المديريات',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// ========== SUB-DISTRICTS ENDPOINTS ==========

// GET /api/geographic/sub-districts - جلب جميع العزل
router.get('/sub-districts', async (req: Request, res: Response) => {
  try {
    const { districtId, districtCode, includeGeometry = false, search, limit = 200, offset = 0 } = req.query;
    
    let query = db.select({
      id: subDistricts.id,
      districtId: subDistricts.districtId,
      code: subDistricts.code,
      nameAr: subDistricts.nameAr,
      nameEn: subDistricts.nameEn,
      bounds: subDistricts.bounds,
      area: subDistricts.area,
      population: subDistricts.population,
      isActive: subDistricts.isActive,
      createdAt: subDistricts.createdAt,
      updatedAt: subDistricts.updatedAt,
      ...(includeGeometry === 'true' && { geometry: subDistricts.geometry })
    }).from(subDistricts).where(eq(subDistricts.isActive, true));

    if (districtId) {
      query = query.where(
        and(
          eq(subDistricts.isActive, true),
          eq(subDistricts.districtId, districtId as string)
        )
      );
    }

    if (districtCode) {
      // البحث بكود المديرية
      const district = await db.select({ id: districts.id })
        .from(districts)
        .where(eq(districts.code, districtCode as string))
        .limit(1);
      
      if (district.length > 0) {
        query = query.where(
          and(
            eq(subDistricts.isActive, true),
            eq(subDistricts.districtId, district[0].id)
          )
        );
      }
    }

    if (search) {
      query = query.where(
        and(
          eq(subDistricts.isActive, true),
          sql`(${subDistricts.nameAr} ILIKE ${`%${search}%`} OR ${subDistricts.nameEn} ILIKE ${`%${search}%`} OR ${subDistricts.code} ILIKE ${`%${search}%`})`
        )
      );
    }

    query = query.limit(Number(limit)).offset(Number(offset)).orderBy(subDistricts.nameAr);

    const allSubDistricts = await query;
    
    res.json({
      success: true,
      data: allSubDistricts,
      count: allSubDistricts.length,
      message: `✅ ${allSubDistricts.length} عزلة`
    });
  } catch (error) {
    console.error('خطأ في جلب العزل:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب البيانات'
    });
  }
});

// POST /api/geographic/sub-districts/upload - رفع ملف GeoJSON للعزل
router.post('/sub-districts/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('🏡 بدء رفع ملف العزل الجغرافي');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم العثور على ملف'
      });
    }

    const filePath = req.file.path;
    console.log(`📁 قراءة الملف: ${filePath}`);

    // قراءة وتحليل ملف GeoJSON
    const fileContent = await fs.readFile(filePath, 'utf8');
    const geoJsonData = JSON.parse(fileContent);

    if (geoJsonData.type !== 'FeatureCollection' || !Array.isArray(geoJsonData.features)) {
      return res.status(400).json({
        success: false,
        error: 'تنسيق GeoJSON غير صحيح'
      });
    }

    console.log(`📊 عدد العزل في الملف: ${geoJsonData.features.length}`);

    // بناء خريطة المديريات للربط
    const districtsMap = new Map<string, string>();
    const dists = await db.select({ id: districts.id, code: districts.code }).from(districts);
    dists.forEach(district => districtsMap.set(district.code, district.id));

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const feature of geoJsonData.features) {
      const properties = feature.properties;
      
      // التحقق من البيانات المطلوبة
      if (!properties.admin3Name || !properties.admin3Pcod || !properties.admin2Pcod) {
        console.warn('⚠️ تخطي عزلة بسبب نقص البيانات:', properties);
        skippedCount++;
        continue;
      }

      // العثور على المديرية المرتبطة
      const districtId = districtsMap.get(properties.admin2Pcod);
      if (!districtId) {
        console.warn(`⚠️ تخطي عزلة ${properties.admin3Name}: لم يتم العثور على المديرية ${properties.admin2Pcod}`);
        skippedCount++;
        continue;
      }

      const bounds = calculateBounds(feature.geometry);
      const area = calculatePolygonArea(feature.geometry);

      const subDistrictData = {
        districtId: districtId,
        code: properties.admin3Pcod,
        nameAr: properties.admin3Na_1 || properties.admin3Name,
        nameEn: properties.admin3Name,
        geometry: feature.geometry,
        bounds: bounds,
        area: area,
        population: null // سيتم إضافتها لاحقاً
      };

      // التحقق من وجود العزلة مسبقاً
      const existingSubDistrict = await db.select()
        .from(subDistricts)
        .where(eq(subDistricts.code, subDistrictData.code))
        .limit(1);

      if (existingSubDistrict.length > 0) {
        // تحديث العزلة الموجودة
        await db.update(subDistricts)
          .set({
            districtId: subDistrictData.districtId,
            nameAr: subDistrictData.nameAr,
            nameEn: subDistrictData.nameEn,
            geometry: subDistrictData.geometry,
            bounds: subDistrictData.bounds,
            area: subDistrictData.area,
            updatedAt: new Date()
          })
          .where(eq(subDistricts.code, subDistrictData.code));
        
        updatedCount++;
        console.log(`📝 تم تحديث: ${subDistrictData.nameAr} (${subDistrictData.code})`);
      } else {
        // إدراج عزلة جديدة
        await db.insert(subDistricts).values(subDistrictData);
        insertedCount++;
        console.log(`✅ تم إدراج: ${subDistrictData.nameAr} (${subDistrictData.code})`);
      }
    }

    // حذف الملف المؤقت
    await fs.unlink(filePath);

    console.log(`🎉 اكتملت معالجة العزل: ${insertedCount} جديد، ${updatedCount} محدث، ${skippedCount} متخطى`);

    res.json({
      success: true,
      data: {
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: geoJsonData.features.length
      },
      message: `✅ تم معالجة ${insertedCount + updatedCount} عزلة من أصل ${geoJsonData.features.length}`
    });

  } catch (error) {
    console.error('❌ خطأ في معالجة ملف العزل:', error);
    
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('خطأ في حذف الملف المؤقت:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'فشل في معالجة ملف العزل',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// ========== HIERARCHICAL QUERY ENDPOINTS ==========

// GET /api/geographic/hierarchy/:governorateCode - جلب التسلسل الهرمي الكامل للمحافظة
router.get('/hierarchy/:governorateCode', async (req: Request, res: Response) => {
  try {
    const { governorateCode } = req.params;
    const { includeGeometry = false, depth = 'all' } = req.query;

    // جلب المحافظة
    const governorate = await db.select()
      .from(governorates)
      .where(eq(governorates.code, governorateCode))
      .limit(1);

    if (governorate.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'المحافظة غير موجودة'
      });
    }

    const result: any = { governorate: governorate[0] };

    if (depth === 'all' || depth === 'districts') {
      // جلب المديريات
      const governorateDistricts = await db.select()
        .from(districts)
        .where(eq(districts.governorateId, governorate[0].id));
      
      result.districts = governorateDistricts;

      if (depth === 'all' || depth === 'sub-districts') {
        // جلب العزل لكل مديرية
        for (const district of governorateDistricts) {
          const districtSubDistricts = await db.select()
            .from(subDistricts)
            .where(eq(subDistricts.districtId, district.id));
          
          (district as any).subDistricts = districtSubDistricts;
        }
      }
    }

    res.json({
      success: true,
      data: result,
      message: `✅ التسلسل الهرمي لمحافظة ${governorate[0].nameAr}`
    });

  } catch (error) {
    console.error('خطأ في جلب التسلسل الهرمي:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب البيانات'
    });
  }
});

// GET /api/geographic/statistics - إحصائيات النظام الجغرافي
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const [governoratesCount] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(governorates).where(eq(governorates.isActive, true));
    const [districtsCount] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(districts).where(eq(districts.isActive, true));
    const [subDistrictsCount] = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(subDistricts).where(eq(subDistricts.isActive, true));

    const statistics = {
      governorates: governoratesCount.count,
      districts: districtsCount.count,
      subDistricts: subDistrictsCount.count,
      neighborhoods: 0, // سيتم تحديثها عند إضافة البيانات
      totalAdministrativeUnits: governoratesCount.count + districtsCount.count + subDistrictsCount.count
    };

    res.json({
      success: true,
      data: statistics,
      message: '✅ إحصائيات النظام الجغرافي'
    });

  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإحصائيات'
    });
  }
});

export default router;