import { Router, Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db';

const router = Router();

// GET /api/geographic/statistics - Simple statistics endpoint
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        (SELECT count(*) FROM governorates) as governorates_count,
        (SELECT count(*) FROM districts) as districts_count,
        (SELECT count(*) FROM sub_districts) as sub_districts_count,
        (SELECT COALESCE(sum(area_km2), 0) FROM governorates) as total_area,
        (SELECT COALESCE(sum(population), 0) FROM governorates) as total_population
    `);

    const statistics = {
      governorates: Number(stats.rows[0]?.governorates_count || 0),
      districts: Number(stats.rows[0]?.districts_count || 0),
      subDistricts: Number(stats.rows[0]?.sub_districts_count || 0),
      totalArea: Number(stats.rows[0]?.total_area || 0),
      totalPopulation: Number(stats.rows[0]?.total_population || 0)
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

// GET /api/geographic/governorates - Simple governorates endpoint
router.get('/governorates', async (req: Request, res: Response) => {
  try {
    const { includeGeometry = false, search, limit = 50, offset = 0 } = req.query;
    
    let query = sql`
      SELECT 
        id, code, name_ar, name_en, bounds, area_km2 as area, 
        population, capital_ar as capital_city, created_at, updated_at
    `;
    
    if (includeGeometry === 'true') {
      query = sql`
        SELECT 
          id, code, name_ar, name_en, bounds, area_km2 as area, 
          population, capital_ar as capital_city, geometry, created_at, updated_at
      `;
    }
    
    query = sql`${query} FROM governorates`;
    
    if (search) {
      query = sql`${query} WHERE (name_ar ILIKE ${`%${search}%`} OR name_en ILIKE ${`%${search}%`} OR code ILIKE ${`%${search}%`})`;
    }
    
    query = sql`${query} ORDER BY name_ar LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const result = await db.execute(query);
    
    const governorates = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      bounds: row.bounds,
      area: row.area,
      population: row.population,
      capitalCity: row.capital_city,
      isActive: true, // Default since column doesn't exist
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(includeGeometry === 'true' && { geometry: row.geometry })
    }));

    res.json({
      success: true,
      data: governorates,
      count: governorates.length,
      message: `✅ ${governorates.length} محافظة`
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

// GET /api/geographic/districts - Simple districts endpoint
router.get('/districts', async (req: Request, res: Response) => {
  try {
    const { governorateId, governorateCode, includeGeometry = false, search, limit = 100, offset = 0 } = req.query;
    
    let query = sql`
      SELECT 
        id, governorate_id, code, name_ar, name_en, bounds, area_km2 as area, 
        population, created_at, updated_at
    `;
    
    if (includeGeometry === 'true') {
      query = sql`
        SELECT 
          id, governorate_id, code, name_ar, name_en, bounds, area_km2 as area, 
          population, geometry, created_at, updated_at
      `;
    }
    
    query = sql`${query} FROM districts WHERE 1=1`;
    
    if (governorateId) {
      query = sql`${query} AND governorate_id = ${governorateId}`;
    }
    
    if (governorateCode) {
      // Find governorate by code first
      const govResult = await db.execute(sql`SELECT id FROM governorates WHERE code = ${governorateCode}`);
      if (govResult.rows.length > 0) {
        query = sql`${query} AND governorate_id = ${govResult.rows[0].id}`;
      }
    }
    
    if (search) {
      query = sql`${query} AND (name_ar ILIKE ${`%${search}%`} OR name_en ILIKE ${`%${search}%`} OR code ILIKE ${`%${search}%`})`;
    }
    
    query = sql`${query} ORDER BY name_ar LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const result = await db.execute(query);
    
    const districts = result.rows.map(row => ({
      id: row.id,
      governorateId: row.governorate_id,
      code: row.code,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      bounds: row.bounds,
      area: row.area,
      population: row.population,
      isActive: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(includeGeometry === 'true' && { geometry: row.geometry })
    }));

    res.json({
      success: true,
      data: districts,
      count: districts.length,
      message: `✅ ${districts.length} مديرية`
    });

  } catch (error) {
    console.error('خطأ في جلب المديريات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب البيانات'
    });
  }
});

// GET /api/geographic/sub-districts - Simple sub-districts endpoint
router.get('/sub-districts', async (req: Request, res: Response) => {
  try {
    const { districtId, districtCode, includeGeometry = false, search, limit = 200, offset = 0 } = req.query;
    
    let query = sql`
      SELECT 
        id, district_id, code, name_ar, name_en, bounds, area_km2 as area, 
        population, created_at, updated_at
    `;
    
    if (includeGeometry === 'true') {
      query = sql`
        SELECT 
          id, district_id, code, name_ar, name_en, bounds, area_km2 as area, 
          population, geometry, created_at, updated_at
      `;
    }
    
    query = sql`${query} FROM sub_districts WHERE 1=1`;
    
    if (districtId) {
      query = sql`${query} AND district_id = ${districtId}`;
    }
    
    if (districtCode) {
      // Find district by code first
      const distResult = await db.execute(sql`SELECT id FROM districts WHERE code = ${districtCode}`);
      if (distResult.rows.length > 0) {
        query = sql`${query} AND district_id = ${distResult.rows[0].id}`;
      }
    }
    
    if (search) {
      query = sql`${query} AND (name_ar ILIKE ${`%${search}%`} OR name_en ILIKE ${`%${search}%`} OR code ILIKE ${`%${search}%`})`;
    }
    
    query = sql`${query} ORDER BY name_ar LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const result = await db.execute(query);
    
    const subDistricts = result.rows.map(row => ({
      id: row.id,
      districtId: row.district_id,
      code: row.code,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      bounds: row.bounds,
      area: row.area,
      population: row.population,
      isActive: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(includeGeometry === 'true' && { geometry: row.geometry })
    }));

    res.json({
      success: true,
      data: subDistricts,
      count: subDistricts.length,
      message: `✅ ${subDistricts.length} عزلة`
    });

  } catch (error) {
    console.error('خطأ في جلب العزل:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب البيانات'
    });
  }
});

export default router;