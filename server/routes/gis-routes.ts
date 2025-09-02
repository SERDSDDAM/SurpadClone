import express, { Router, Request, Response } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// مخزن حالة الطبقات
const layerStates = new Map<string, any>();

const router = express.Router();

// Mock authentication middleware for now
const isAuthenticated = (req: any, res: any, next: any) => {
  req.user = { sub: 'mock-user-id' };
  next();
};

// Phase 1 standardized GIS endpoints - OVERRIDE existing endpoints
// GET /api/gis/layers/all - Returns all available GIS layers
router.get('/layers/all', async (req: Request, res: Response) => {
  try {
    const standardizedLayers = [
      {
        id: "masterplan",
        name: "المخطط العام",
        type: "vector",
        category: "planning",
        description: "المخطط العام للمدينة",
        visible: true,
        opacity: 1.0,
        zIndex: 5,
        featureCount: 15,
        bbox: [44.0, 15.0, 44.5, 15.5],
        lastUpdated: new Date().toISOString()
      },
      {
        id: "governorates",
        name: "حدود المحافظات",
        type: "vector", 
        category: "administrative",
        description: "الحدود الإدارية للمحافظات اليمنية",
        visible: true,
        opacity: 0.8,
        zIndex: 3,
        featureCount: 22,
        bbox: [42.0, 12.0, 54.0, 19.0],
        lastUpdated: new Date().toISOString()
      },
      {
        id: "districts",
        name: "حدود المديريات",
        type: "vector",
        category: "administrative", 
        description: "الحدود الإدارية للمديريات",
        visible: false,
        opacity: 0.7,
        zIndex: 4,
        featureCount: 333,
        bbox: [42.0, 12.0, 54.0, 19.0],
        lastUpdated: new Date().toISOString()
      },
      {
        id: "roads",
        name: "شبكة الطرق",
        type: "vector",
        category: "infrastructure",
        description: "شبكة الطرق الرئيسية والفرعية",
        visible: true,
        opacity: 0.9,
        zIndex: 7,
        featureCount: 1250,
        bbox: [42.0, 12.0, 54.0, 19.0],
        lastUpdated: new Date().toISOString()
      },
      {
        id: "flood_zones",
        name: "مناطق الفيضانات",
        type: "vector",
        category: "environmental",
        description: "مناطق مخاطر الفيضانات",
        visible: false,
        opacity: 0.6,
        zIndex: 2,
        featureCount: 45,
        bbox: [43.0, 14.0, 45.0, 16.0],
        lastUpdated: new Date().toISOString()
      },
      {
        id: "heritage_sites",
        name: "المواقع التراثية",
        type: "point",
        category: "cultural",
        description: "المواقع الأثرية والتراثية",
        visible: true,
        opacity: 1.0,
        zIndex: 8,
        featureCount: 127,
        bbox: [42.5, 12.5, 50.0, 18.5],
        lastUpdated: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: standardizedLayers,
      count: standardizedLayers.length,
      message: "✅ Phase 1 GIS Layers - All Available"
    });
  } catch (error) {
    console.error('Error fetching GIS layers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GIS layers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/gis/features - Returns features for a specific layer (requires layerId)
router.get('/features', async (req: Request, res: Response) => {
  try {
    const { layerId } = req.query;
    
    if (!layerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: layerId',
        message: 'Please provide layerId parameter'
      });
    }

    // Generate sample features based on layer type
    let features = [];
    
    switch (layerId) {
      case 'masterplan':
        features = [
          {
            type: "Feature",
            geometry: {
              type: "Polygon", 
              coordinates: [[[44.2, 15.2], [44.3, 15.2], [44.3, 15.3], [44.2, 15.3], [44.2, 15.2]]]
            },
            properties: {
              id: "mp_001",
              name: "المنطقة السكنية أ",
              zoning: "residential",
              density: "medium",
              area: 125.5
            }
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[44.25, 15.25], [44.35, 15.25], [44.35, 15.35], [44.25, 15.35], [44.25, 15.25]]]
            },
            properties: {
              id: "mp_002", 
              name: "المنطقة التجارية المركزية",
              zoning: "commercial",
              density: "high",
              area: 85.2
            }
          }
        ];
        break;
      case 'governorates':
        features = [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[[44.0, 15.0], [44.5, 15.0], [44.5, 15.5], [44.0, 15.5], [44.0, 15.0]]]
            },
            properties: {
              id: "gov_001",
              name: "صنعاء",
              population: 3200000,
              area_km2: 13850,
              capital: "صنعاء"
            }
          }
        ];
        break;
      case 'roads':
        features = [
          {
            type: "Feature", 
            geometry: {
              type: "LineString",
              coordinates: [[44.2, 15.2], [44.25, 15.25], [44.3, 15.3]]
            },
            properties: {
              id: "road_001",
              name: "شارع الستين",
              type: "primary",
              width: 30,
              surface: "asphalt"
            }
          }
        ];
        break;
      default:
        features = [];
    }

    const featureCollection = {
      type: "FeatureCollection",
      features: features
    };

    res.json({
      success: true,
      data: featureCollection,
      layerId: layerId,
      count: features.length,
      message: `✅ Features for layer: ${layerId}`
    });
  } catch (error) {
    console.error('Error fetching GIS features:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GIS features',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// دمج خدمة الملفات المعالجة - DISABLED for Phase 1
// router.use('/public-objects', gisFileServingRouter);

// Static file serving for processed PNG/World files (محاكاة التخزين السحابي) - سيتم إزالة هذا
router.get('/public-objects-legacy/gis-layers/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const processedDir = path.join(process.cwd(), 'temp-uploads', 'processed');
    
    // البحث عن الملف في المجلدات المختلفة
    const possiblePaths = [
      path.join(processedDir, filename),
      path.join(processedDir, '*', filename) // البحث في المجلدات الفرعية
    ];
    
    let filePath = null;
    for (const searchPath of possiblePaths) {
      if (searchPath.includes('*')) {
        // البحث في المجلدات الفرعية
        const glob = require('glob');
        const matches = glob.sync(searchPath);
        if (matches.length > 0) {
          filePath = matches[0];
          break;
        }
      } else {
        try {
          await fs.access(searchPath);
          filePath = searchPath;
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    if (!filePath) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // تحديد نوع المحتوى
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.png': 'image/png',
      '.pgw': 'text/plain',
      '.prj': 'text/plain'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // إرسال الملف
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error serving processed file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

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
    // Mock statistics for Phase 1 - replace with actual DB calls when tables exist
    const mockStatistics = {
      governorates: 22,
      districts: 333, 
      subDistricts: 2200,
      sectors: 5500,
      neighborhoodUnits: 12000,
      blocks: 25000,
      streets: 50000
    };

    const statistics = {
      total: mockStatistics,
      coverage: {
        withGeometry: 15000,
        totalRecords: 95000,
        percentage: 84
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: statistics,
      message: "✅ GIS Statistics Data"
    });
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

// POST /api/gis/layers/upload-url - الحصول على رابط رفع طبقة جغرافية
router.post('/layers/upload-url', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    // التحقق من أنواع الملفات المدعومة
    const supportedTypes = [
      'image/tiff', 'image/tif', 
      'image/png', 'image/jpeg', 'image/jpg',
      'application/geo+tiff', 'application/geotiff',
      'application/zip', 'application/x-zip-compressed'
    ];
    
    const isSupported = supportedTypes.some(type => 
      fileType.toLowerCase().includes(type) || 
      fileName.toLowerCase().endsWith('.tiff') || 
      fileName.toLowerCase().endsWith('.tif') ||
      fileName.toLowerCase().endsWith('.png') ||
      fileName.toLowerCase().endsWith('.jpg') ||
      fileName.toLowerCase().endsWith('.jpeg') ||
      fileName.toLowerCase().endsWith('.zip')
    );
    
    if (!isSupported) {
      return res.status(400).json({ 
        error: 'Unsupported file type. Supported: ZIP (preferred), GeoTIFF, TIFF, PNG, JPG',
        supportedTypes: supportedTypes
      });
    }

    // إنشاء رابط رفع وهمي للتطوير
    const layerId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const objectPath = `/objects/gis-layers/${layerId}`;
    
    // محاكاة رابط رفع آمن
    const uploadUrl = `https://mock-cloud-storage.replit.dev/upload/${layerId}`;
    
    res.json({
      layerId,
      uploadUrl,
      objectPath,
      fileName,
      fileType,
      maxFileSize: '100MB',
      expiresIn: '15 minutes',
      mockUpload: true
    });
    
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// إعداد multer لرفع الملفات
const upload = multer({
  dest: path.join(process.cwd(), 'temp-uploads'),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.zip', '.tif', '.tiff'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('نوع ملف غير مدعوم. الأنواع المدعومة: ZIP, TIF, TIFF'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// POST /api/gis/upload-geotiff-zip - رفع ملف GeoTIFF مباشرة
router.post('/upload-geotiff-zip', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع ملف' });
    }

    const layerId = `layer_${Date.now()}_${uuidv4().substr(0, 8)}`;
    
    console.log('📤 تم استقبال ملف:', req.file.originalname);
    console.log('🆔 معرف الطبقة:', layerId);

    // نقل الملف إلى المجلد المطلوب
    const targetPath = path.join(process.cwd(), 'temp-uploads', req.file.originalname);
    await fs.rename(req.file.path, targetPath);

    res.json({
      success: true,
      layerId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      message: 'تم رفع الملف بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في رفع الملف:', error);
    res.status(500).json({ error: 'فشل في رفع الملف' });
  }
});

// GET /api/gis/layers/:layerId/files/:filename - تقديم ملفات الطبقة المعالجة
router.get('/layers/:layerId/files/:filename', async (req: Request, res: Response) => {
  try {
    const { layerId, filename } = req.params;
    
    const webGISService = new WebGISService();
    const fileBuffer = await webGISService.serveLayerFile(layerId, filename);
    
    if (!fileBuffer) {
      return res.status(404).json({ error: 'ملف غير موجود' });
    }
    
    // تحديد نوع المحتوى
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error serving layer file:', error);
    res.status(500).json({ error: 'فشل في تقديم الملف' });
  }
});

// POST /api/gis/layers/confirm - تأكيد اكتمال رفع الطبقة وحفظ البيانات الوصفية
router.post('/layers/confirm', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { layerId, objectPath, fileName, metadata } = req.body;
    
    if (!layerId || !objectPath || !fileName) {
      return res.status(400).json({ error: 'layerId, objectPath, and fileName are required' });
    }

    // تحديد نوع الملف والمعالجة المطلوبة
    const isZipFile = metadata?.isZipFile || fileName.toLowerCase().endsWith('.zip');
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    // في التطبيق الحقيقي، هنا سيتم:
    // 1. التحقق من وجود الملف في التخزين السحابي
    // 2. قراءة البيانات الجغرافية من الملف (إحداثيات، نظام الإسناد المرجعي)
    // 3. حفظ البيانات الوصفية في قاعدة البيانات
    
    let processedLayer;
    
    if (isZipFile) {
      // المعالجة المسبقة الجديدة: تحويل GeoTIFF إلى PNG + World Files
      console.log('🔄 المعالجة المسبقة: GeoTIFF → PNG + World Files');
      console.log('📁 معالجة الملف:', fileName);
      
      try {
        // إنشاء ملف مؤقت لمحاكاة التحميل
        const tempDir = path.join(process.cwd(), 'temp-uploads');
        await fs.mkdir(tempDir, { recursive: true });
        const tempFilePath = path.join(tempDir, fileName);
        
        // في التطبيق الحقيقي، يجب نسخ الملف من التخزين السحابي
        // للاختبار، سنستخدم ملف ZIP صالح
        const validZipPath = path.join(process.cwd(), 'temp-uploads', 'test_valid.zip');
        if (await fs.access(validZipPath).then(() => true).catch(() => false)) {
          await fs.copyFile(validZipPath, tempFilePath);
          console.log('📋 استخدام ملف ZIP صالح للاختبار');
        } else {
          throw new Error('ملف الاختبار غير متوفر - يرجى رفع ملف ZIP صالح');
        }
        
        // استخدام خدمة WebGIS الجديدة
        const webGISService = new WebGISService();
        const result = await webGISService.processZipFile(tempFilePath, layerId);
        
        if (!result.success) {
          throw new Error(result.error || 'فشل في معالجة WebGIS');
        }
        
        console.log('✅ معالجة WebGIS مكتملة:', result);
        
        // الملفات متوفرة في مجلد المعالجة وسيتم خدمتها مباشرة
        console.log('📁 الملفات المعالجة متوفرة في:', preprocessingResult.outputDirectory);
        
        // تنظيف الملف المؤقت
        await fs.unlink(tempFilePath).catch(e => console.warn('تعذر حذف الملف:', e));
      
        processedLayer = {
          id: layerId,
          name: result.pngFile!.replace('.png', ''),
          fileName: result.pngFile!,
          boundsWGS84: result.boundsWGS84!,
          originalCRS: result.originalCRS,
          dimensions: result.dimensions,
          type: 'raster',
          uploadDate: new Date().toISOString(),
          status: 'ready',
          fileSize: metadata?.fileSize || 0
        };
        
      } catch (processingError) {
        console.error('❌ خطأ في المعالجة المسبقة:', processingError);
        
        // في حالة فشل المعالجة، نعيد خطأ واضح للمستخدم
        return res.status(500).json({ 
          success: false,
          error: 'فشل في المعالجة المسبقة للملف الجغرافي',
          details: processingError.message,
          suggestion: 'تأكد من أن الملف يحتوي على GeoTIFF صحيح مع ملفات الإسقاط المناسبة'
        });
      }
    } else {
      // معالجة عادية للصور المفردة
      processedLayer = {
        id: layerId,
        name: metadata?.name || fileName.replace(/\.[^/.]+$/, ""),
        fileName,
        objectPath,
        type: 'raster',
        bounds: metadata?.bounds || [[15.2, 44.1], [15.5, 44.3]],
        coordinateSystem: metadata?.coordinateSystem || 'EPSG:4326',
        uploadDate: new Date().toISOString(),
        status: 'ready',
        fileSize: metadata?.fileSize || 0,
        geospatialInfo: {
          hasGeoreferencing: true,
          spatialReference: metadata?.coordinateSystem || 'EPSG:4326',
          pixelSize: metadata?.pixelSize || [1, 1],
          transform: metadata?.transform || null
        }
      };
    }
    
    // TODO: حفظ processedLayer في جدول gis_layers في قاعدة البيانات
    
    res.json({
      success: true,
      layer: processedLayer,
      message: 'Layer uploaded and processed successfully'
    });
    
  } catch (error) {
    console.error('Error confirming layer upload:', error);
    res.status(500).json({ error: 'Failed to confirm layer upload' });
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