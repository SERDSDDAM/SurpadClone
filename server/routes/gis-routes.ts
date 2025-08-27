import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  governorates, 
  districts, 
  subDistricts, 
  sectors, 
  neighborhoodUnits, 
  blocks, 
  streets,
  streetNeighborhoodBoundaries,
  insertGovernorateSchema,
  insertDistrictSchema,
  insertSubDistrictSchema,
  insertSectorSchema,
  insertNeighborhoodUnitSchema,
  insertBlockSchema,
  insertStreetSchema,
  insertStreetNeighborhoodBoundarySchema
} from '../../shared/gis-schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

// Mock authentication middleware for now
const isAuthenticated = (req: any, res: any, next: any) => {
  req.user = { sub: 'mock-user-id' };
  next();
};

const router = Router();

// ====== APIs للاستعلامات الجغرافية ======

// GET /api/gis/governorates - قائمة المحافظات (نموذج تجريبي)
router.get('/governorates', async (req: Request, res: Response) => {
  try {
    // بيانات تجريبية للمحافظات اليمنية
    const governorates = [
      { id: 1, nameAr: 'صنعاء', nameEn: 'Sana\'a', code: 'SA', capitalCity: 'صنعاء', population: 3000000 },
      { id: 2, nameAr: 'عدن', nameEn: 'Aden', code: 'AD', capitalCity: 'عدن', population: 950000 },
      { id: 3, nameAr: 'تعز', nameEn: 'Taiz', code: 'TA', capitalCity: 'تعز', population: 3500000 },
      { id: 4, nameAr: 'الحديدة', nameEn: 'Al Hudaydah', code: 'HD', capitalCity: 'الحديدة', population: 3100000 },
      { id: 5, nameAr: 'إب', nameEn: 'Ibb', code: 'IB', capitalCity: 'إب', population: 2800000 },
      { id: 6, nameAr: 'حضرموت', nameEn: 'Hadramout', code: 'HM', capitalCity: 'المكلا', population: 1400000 },
      { id: 7, nameAr: 'لحج', nameEn: 'Lahij', code: 'LA', capitalCity: 'الحوطة', population: 950000 },
      { id: 8, nameAr: 'أبين', nameEn: 'Abyan', code: 'AB', capitalCity: 'زنجبار', population: 500000 }
    ];
    
    res.json({ governorates, total: governorates.length });
  } catch (error) {
    console.error('Error fetching governorates:', error);
    res.status(500).json({ error: 'Failed to fetch governorates' });
  }
});

// GET /api/gis/districts/:governorateId - قائمة مديريات محافظة معينة
router.get('/districts/:governorateId', async (req: Request, res: Response) => {
  try {
    const { governorateId } = req.params;
    
    // بيانات تجريبية للمديريات
    const districtsByGovernorate: Record<string, any[]> = {
      '1': [ // صنعاء
        { id: 101, nameAr: 'شعوب', nameEn: 'Shuaub', code: 'SA-SH', population: 200000 },
        { id: 102, nameAr: 'الثورة', nameEn: 'Al Thawra', code: 'SA-TH', population: 180000 },
        { id: 103, nameAr: 'معين', nameEn: 'Maeen', code: 'SA-MA', population: 150000 }
      ],
      '2': [ // عدن
        { id: 201, nameAr: 'كريتر', nameEn: 'Crater', code: 'AD-CR', population: 90000 },
        { id: 202, nameAr: 'المعلا', nameEn: 'Al Mualla', code: 'AD-MU', population: 120000 },
        { id: 203, nameAr: 'الشيخ عثمان', nameEn: 'Sheikh Othman', code: 'AD-SO', population: 140000 }
      ]
    };
    
    const districts = districtsByGovernorate[governorateId] || [];
    res.json({ districts, total: districts.length });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// GET /api/gis/sub-districts/:districtId - قائمة عزل مديرية معينة
router.get('/sub-districts/:districtId', async (req: Request, res: Response) => {
  try {
    const { districtId } = req.params;
    const { includeGeometry = false } = req.query;
    
    let selectFields: any = {
      id: subDistricts.id,
      nameAr: subDistricts.nameAr,
      nameEn: subDistricts.nameEn,
      code: subDistricts.code,
      area: subDistricts.area,
      population: subDistricts.population,
      subDistrictType: subDistricts.subDistrictType,
      isActive: subDistricts.isActive,
    };
    
    if (includeGeometry === 'true') {
      selectFields.geometry = subDistricts.geometry;
    }
    
    const results = await db.select(selectFields)
      .from(subDistricts)
      .where(
        and(
          eq(subDistricts.districtId, parseInt(districtId)),
          eq(subDistricts.isActive, true)
        )
      );
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching sub-districts:', error);
    res.status(500).json({ error: 'Failed to fetch sub-districts' });
  }
});

// POST /api/gis/point-in-polygon - تحديد الموقع الإداري لنقطة معينة (نموذج تجريبي)
router.post('/point-in-polygon', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    // محاكاة تحديد الموقع الإداري بناءً على الإحداثيات
    let administrativeLocation = null;
    
    // صنعاء (تقريباً)
    if (latitude >= 15.2 && latitude <= 15.5 && longitude >= 44.1 && longitude <= 44.3) {
      administrativeLocation = {
        governorate: { id: 1, nameAr: 'صنعاء', code: 'SA' },
        district: { id: 101, nameAr: 'شعوب', code: 'SA-SH' },
        subDistrict: { id: 1001, nameAr: 'عزلة الحصبة', code: 'SA-SH-HA' },
        sector: { id: 10001, nameAr: 'قطاع الحصبة الشمالي', code: 'SA-SH-HA-N' },
        neighborhoodUnit: { id: 100001, nameAr: 'وحدة جوار الستين', code: 'SA-SH-HA-N-60' },
        block: { id: 1000001, blockNumber: 'B-001', blockCode: 'SA-SH-HA-N-60-B001', landUse: 'residential' }
      };
    }
    // عدن (تقريباً)
    else if (latitude >= 12.7 && latitude <= 12.9 && longitude >= 44.9 && longitude <= 45.1) {
      administrativeLocation = {
        governorate: { id: 2, nameAr: 'عدن', code: 'AD' },
        district: { id: 201, nameAr: 'كريتر', code: 'AD-CR' },
        subDistrict: { id: 2001, nameAr: 'عزلة كريتر المركز', code: 'AD-CR-CE' },
        sector: { id: 20001, nameAr: 'القطاع التجاري', code: 'AD-CR-CE-C' },
        neighborhoodUnit: { id: 200001, nameAr: 'وحدة جوار الميناء', code: 'AD-CR-CE-C-PO' },
        block: { id: 2000001, blockNumber: 'B-001', blockCode: 'AD-CR-CE-C-PO-B001', landUse: 'commercial' }
      };
    }
    
    if (!administrativeLocation) {
      return res.status(404).json({ 
        error: 'Location not found in current administrative boundaries',
        coordinates: { latitude, longitude },
        note: 'Currently supporting Sana\'a and Aden areas only'
      });
    }
    
    res.json({
      coordinates: { latitude, longitude },
      administrativeLocation,
      note: 'This is a demonstration using sample data'
    });
  } catch (error) {
    console.error('Error in point-in-polygon query:', error);
    res.status(500).json({ error: 'Failed to determine administrative location' });
  }
});

// POST /api/gis/upload/shapefile - رفع ملف Shapefile وتحويله للقاعدة
router.post('/upload/shapefile', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // هذا API placeholder لرفع ملفات Shapefile
    // في التطبيق الحقيقي سيستخدم multer ومكتبة gdal لمعالجة الملفات
    
    const { layerType, features } = req.body;
    
    if (!layerType || !features) {
      return res.status(400).json({ error: 'Layer type and features are required' });
    }
    
    // محاكاة معالجة البيانات
    let processedCount = 0;
    
    // هنا سيتم معالجة البيانات وإدخالها في الجداول المناسبة
    // بناءً على نوع الطبقة (governorates, districts, etc.)
    
    res.json({
      success: true,
      message: `Successfully processed ${features.length} features`,
      layerType,
      processedCount: features.length,
      insertedRecords: processedCount
    });
  } catch (error) {
    console.error('Error uploading shapefile:', error);
    res.status(500).json({ error: 'Failed to process shapefile' });
  }
});

// GET /api/gis/blocks/neighborhood/:neighborhoodId - قائمة البلوكات في وحدة جوار معينة
router.get('/blocks/neighborhood/:neighborhoodId', async (req: Request, res: Response) => {
  try {
    const { neighborhoodId } = req.params;
    const { includeGeometry = false } = req.query;
    
    let selectFields: any = {
      id: blocks.id,
      blockNumber: blocks.blockNumber,
      blockCode: blocks.blockCode,
      area: blocks.area,
      landUse: blocks.landUse,
      buildingType: blocks.buildingType,
      plotsCount: blocks.plotsCount,
      builtPlotsCount: blocks.builtPlotsCount,
      developmentStatus: blocks.developmentStatus,
      ownershipType: blocks.ownershipType,
      isActive: blocks.isActive,
    };
    
    if (includeGeometry === 'true') {
      selectFields.geometry = blocks.geometry;
    }
    
    const results = await db.select(selectFields)
      .from(blocks)
      .where(
        and(
          eq(blocks.neighborhoodUnitId, parseInt(neighborhoodId)),
          eq(blocks.isActive, true)
        )
      );
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

// GET /api/gis/streets/neighborhood/:neighborhoodId - قائمة الشوارع المحيطة بوحدة جوار
router.get('/streets/neighborhood/:neighborhoodId', async (req: Request, res: Response) => {
  try {
    const { neighborhoodId } = req.params;
    const { includeGeometry = false } = req.query;
    
    let selectFields: any = {
      id: streets.id,
      nameAr: streets.nameAr,
      nameEn: streets.nameEn,
      streetCode: streets.streetCode,
      streetType: streets.streetType,
      streetClass: streets.streetClass,
      width: streets.width,
      surfaceType: streets.surfaceType,
      direction: streets.direction,
      condition: streets.condition,
      boundaryType: streetNeighborhoodBoundaries.boundaryType,
    };
    
    if (includeGeometry === 'true') {
      selectFields.geometry = streets.geometry;
      selectFields.segmentGeometry = streetNeighborhoodBoundaries.segmentGeometry;
    }
    
    const results = await db.select(selectFields)
      .from(streets)
      .innerJoin(
        streetNeighborhoodBoundaries,
        eq(streets.id, streetNeighborhoodBoundaries.streetId)
      )
      .where(
        and(
          eq(streetNeighborhoodBoundaries.neighborhoodUnitId, parseInt(neighborhoodId)),
          eq(streets.isActive, true)
        )
      );
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching neighborhood streets:', error);
    res.status(500).json({ error: 'Failed to fetch neighborhood streets' });
  }
});

// GET /api/gis/statistics - إحصائيات النظام الجغرافي الشاملة
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    // إحصائيات شاملة من قاعدة البيانات
    const [
      governoratesCount,
      districtsCount,
      subDistrictsCount,
      sectorsCount,
      neighborhoodUnitsCount,
      blocksCount,
      streetsCount
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(governorates),
      db.select({ count: sql<number>`count(*)` }).from(districts),
      db.select({ count: sql<number>`count(*)` }).from(subDistricts),
      db.select({ count: sql<number>`count(*)` }).from(sectors),
      db.select({ count: sql<number>`count(*)` }).from(neighborhoodUnits),
      db.select({ count: sql<number>`count(*)` }).from(blocks),
      db.select({ count: sql<number>`count(*)` }).from(streets)
    ]);

    // إحصائيات التغطية الجغرافية
    const [
      governoratesWithGeometry,
      districtsWithGeometry,
      totalRecords
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(governorates).where(sql`geometry IS NOT NULL`),
      db.select({ count: sql<number>`count(*)` }).from(districts).where(sql`geometry IS NOT NULL`),
      db.select({ count: sql<number>`count(*)` }).from(governorates)
        .unionAll(db.select({ count: sql<number>`count(*)` }).from(districts))
        .unionAll(db.select({ count: sql<number>`count(*)` }).from(subDistricts))
    ]);

    const withGeometry = (governoratesWithGeometry[0]?.count || 0) + (districtsWithGeometry[0]?.count || 0);
    const totalCount = (governoratesCount[0]?.count || 0) + (districtsCount[0]?.count || 0) + (subDistrictsCount[0]?.count || 0);
    const coveragePercentage = totalCount > 0 ? Math.round((withGeometry / totalCount) * 100) : 0;

    const statistics = {
      total: {
        governorates: governoratesCount[0]?.count || 0,
        districts: districtsCount[0]?.count || 0,
        subDistricts: subDistrictsCount[0]?.count || 0,
        sectors: sectorsCount[0]?.count || 0,
        neighborhoodUnits: neighborhoodUnitsCount[0]?.count || 0,
        blocks: blocksCount[0]?.count || 0,
        streets: streetsCount[0]?.count || 0
      },
      coverage: {
        withGeometry: withGeometry,
        totalRecords: totalCount,
        percentage: coveragePercentage
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching GIS statistics:', error);
    res.status(500).json({ error: 'Failed to fetch GIS statistics' });
  }
});

// POST /api/gis/upload - رفع البيانات الجغرافية بصيغ مختلفة
router.post('/upload', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // This is a placeholder for file upload processing
    // In a real implementation, this would use multer for file handling
    // and libraries like GDAL for shapefile processing
    
    res.json({
      success: true,
      message: "File upload endpoint ready - implement with multer and GDAL",
      supportedFormats: ["JSON", "GeoJSON", "Shapefile", "ZIP"],
      note: "Integration with file processing libraries pending"
    });
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ error: 'Upload endpoint error' });
  }
});

// POST /api/gis/governorates - إضافة محافظة جديدة
router.post('/governorates', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const validatedData = insertGovernorateSchema.parse(req.body);
    const [newGovernorate] = await db.insert(governorates).values([validatedData]).returning();
    res.status(201).json(newGovernorate);
  } catch (error) {
    console.error('Error creating governorate:', error);
    res.status(400).json({ error: 'Invalid governorate data' });
  }
});

// PUT /api/gis/governorates/:id - تحديث محافظة
router.put('/governorates/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = insertGovernorateSchema.partial().parse(req.body);
    
    const [updatedGovernorate] = await db
      .update(governorates)
      .set({ 
        nameAr: validatedData.nameAr,
        nameEn: validatedData.nameEn,
        code: validatedData.code,
        capitalCity: validatedData.capitalCity,
        population: validatedData.population,
        area: validatedData.area,
        governor: validatedData.governor,
        isActive: validatedData.isActive,
        updatedAt: new Date() 
      })
      .where(eq(governorates.id, parseInt(id)))
      .returning();
    
    if (!updatedGovernorate) {
      return res.status(404).json({ error: 'Governorate not found' });
    }
    
    res.json(updatedGovernorate);
  } catch (error) {
    console.error('Error updating governorate:', error);
    res.status(400).json({ error: 'Invalid update data' });
  }
});

// POST /api/gis/districts - إضافة مديرية جديدة
router.post('/districts', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const validatedData = insertDistrictSchema.parse(req.body);
    const [newDistrict] = await db.insert(districts).values([validatedData]).returning();
    res.status(201).json(newDistrict);
  } catch (error) {
    console.error('Error creating district:', error);
    res.status(400).json({ error: 'Invalid district data' });
  }
});

// ====== APIs الرقمنة - Digitization APIs ======

// POST /api/gis/layers/upload - رفع طبقة جغرافية مرجعية
router.post('/layers/upload', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // This is a placeholder for georeferenced layer upload
    // In real implementation, this would process GeoTIFF and other raster formats
    // using libraries like GDAL and generate tile services
    
    const { metadata } = req.body;
    
    // Simulate layer processing and return mock data
    const layerId = `layer_${Date.now()}`;
    const processedLayer = {
      id: layerId,
      name: metadata?.name || 'طبقة جديدة',
      type: metadata?.type || 'raster',
      url: `/api/gis/layers/${layerId}/tiles/{z}/{x}/{y}`,
      bounds: [[15.2, 44.1], [15.5, 44.3]], // صنعاء تقريباً
      coordinateSystem: metadata?.coordinateSystem || 'EPSG:4326',
      uploadDate: new Date().toISOString(),
      status: 'processed'
    };
    
    res.json(processedLayer);
  } catch (error) {
    console.error('Error uploading layer:', error);
    res.status(500).json({ error: 'Failed to upload layer' });
  }
});

// GET /api/gis/layers/:layerId/tiles/:z/:x/:y - خدمة البلاط للطبقات
router.get('/layers/:layerId/tiles/:z/:x/:y', async (req: Request, res: Response) => {
  try {
    const { layerId, z, x, y } = req.params;
    
    // This is a placeholder for tile serving
    // In real implementation, this would serve actual map tiles
    res.json({
      layerId,
      tile: { z: parseInt(z), x: parseInt(x), y: parseInt(y) },
      note: 'Tile serving endpoint - implement with tile server'
    });
  } catch (error) {
    console.error('Error serving tile:', error);
    res.status(500).json({ error: 'Failed to serve tile' });
  }
});

// POST /api/gis/streets/digitize - حفظ شارع مرقمن
router.post('/streets/digitize', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { geometry, properties } = req.body;
    
    if (!geometry || geometry.type !== 'LineString') {
      return res.status(400).json({ error: 'Invalid street geometry - must be LineString' });
    }
    
    // تحضير بيانات الشارع للحفظ
    const streetData = {
      nameAr: properties.name || 'شارع بدون اسم',
      nameEn: properties.nameEn,
      streetCode: properties.streetCode || `ST_${Date.now()}`,
      geometry: `LINESTRING(${geometry.coordinates.map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')})`,
      streetType: properties.streetType || 'local',
      streetClass: properties.streetClass || 'tertiary',
      width: properties.width || 6,
      surfaceType: properties.surfaceType || 'asphalt',
      condition: properties.condition || 'good',
      isActive: true
    };
    
    // محاكاة حفظ البيانات
    // في التطبيق الحقيقي سيتم الحفظ في جدول streets
    const savedStreet = {
      id: Math.floor(Math.random() * 10000),
      ...streetData,
      createdAt: new Date().toISOString(),
      source: 'digitization'
    };
    
    res.status(201).json(savedStreet);
  } catch (error) {
    console.error('Error saving digitized street:', error);
    res.status(500).json({ error: 'Failed to save street' });
  }
});

// POST /api/gis/blocks/digitize - حفظ بلوك مرقمن
router.post('/blocks/digitize', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { geometry, properties } = req.body;
    
    if (!geometry || geometry.type !== 'Polygon') {
      return res.status(400).json({ error: 'Invalid block geometry - must be Polygon' });
    }
    
    // تحضير بيانات البلوك للحفظ
    const blockData = {
      blockNumber: properties.blockNumber || `B${Math.floor(Math.random() * 1000)}`,
      blockCode: properties.blockCode || `BLK_${Date.now()}`,
      geometry: `POLYGON((${geometry.coordinates[0].map((coord: number[]) => `${coord[0]} ${coord[1]}`).join(', ')}))`,
      landUse: properties.landUse || 'residential',
      buildingType: properties.buildingType || 'villa',
      area: properties.area || 0,
      plotsCount: properties.plotsCount || 1,
      developmentStatus: properties.developmentStatus || 'available',
      ownershipType: properties.ownershipType || 'private',
      description: properties.description,
      isActive: true
    };
    
    // محاكاة حفظ البيانات
    // في التطبيق الحقيقي سيتم الحفظ في جدول blocks
    const savedBlock = {
      id: Math.floor(Math.random() * 10000),
      ...blockData,
      createdAt: new Date().toISOString(),
      source: 'digitization'
    };
    
    res.status(201).json(savedBlock);
  } catch (error) {
    console.error('Error saving digitized block:', error);
    res.status(500).json({ error: 'Failed to save block' });
  }
});

// GET /api/gis/digitization/session/:sessionId - استرجاع جلسة رقمنة
router.get('/digitization/session/:sessionId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // محاكاة استرجاع جلسة الرقمنة
    const sessionData = {
      id: sessionId,
      layers: [],
      features: [],
      lastModified: new Date().toISOString(),
      status: 'active'
    };
    
    res.json(sessionData);
  } catch (error) {
    console.error('Error retrieving digitization session:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// POST /api/gis/digitization/session - حفظ جلسة رقمنة
router.post('/digitization/session', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { layers, features, metadata } = req.body;
    
    const sessionId = `session_${Date.now()}`;
    const sessionData = {
      id: sessionId,
      layers: layers || [],
      features: features || [],
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      status: 'saved'
    };
    
    res.status(201).json(sessionData);
  } catch (error) {
    console.error('Error saving digitization session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

export default router;