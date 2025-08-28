import { fromArrayBuffer } from 'geotiff';

// قارئ ملفات GeoTIFF في المتصفح - مكافئ rasterio في Python
export interface GeoTiffMetadata {
  width: number;
  height: number;
  origin: [number, number]; // [x, y] النقطة العلوية اليسرى
  pixelSize: [number, number]; // [x, y] حجم البكسل
  crs: string; // نظام الإحداثيات
  bounds: [[number, number], [number, number]]; // [[minX, minY], [maxX, maxY]]
  noDataValue?: number;
  geoKeys?: any;
  hasGeoTiffTags: boolean;
}

// قراءة البيانات الوصفية من ملف GeoTIFF مباشرة في المتصفح
export async function readGeoTiffMetadata(buffer: ArrayBuffer): Promise<GeoTiffMetadata> {
  console.log('🔍 بدء قراءة البيانات الوصفية لملف GeoTIFF...');
  
  try {
    const tiff = await GeoTIFF.fromArrayBuffer(buffer);
    const image = await tiff.getImage();
    
    // قراءة الأبعاد الأساسية
    const width = image.getWidth();
    const height = image.getHeight();
    
    console.log('📐 أبعاد الصورة:', { width, height });
    
    // قراءة البيانات الجغرافية
    const geoKeys = image.getGeoKeys();
    const hasGeoTiffTags = Object.keys(geoKeys || {}).length > 0;
    
    console.log('🔑 GeoKeys:', geoKeys);
    
    // قراءة مصفوفة التحويل الجغرافي
    const tiePoints = image.getTiePoints();
    const pixelScale = image.getPixelScale();
    const modelTransformation = image.getModelTransformation();
    
    console.log('🗺️ معلومات التحويل الجغرافي:', {
      tiePoints,
      pixelScale,
      modelTransformation: modelTransformation?.slice(0, 6) // أول 6 عناصر فقط للطباعة
    });
    
    // حساب النقطة الأصلية وحجم البكسل
    let origin: [number, number] = [0, 0];
    let pixelSize: [number, number] = [1, 1];
    
    if (modelTransformation) {
      // استخدام مصفوفة التحويل الكاملة
      origin = [modelTransformation[3], modelTransformation[7]];
      pixelSize = [modelTransformation[0], Math.abs(modelTransformation[5])];
      
      console.log('📍 من مصفوفة التحويل - النقطة الأصلية:', origin, 'حجم البكسل:', pixelSize);
    } else if (tiePoints && pixelScale) {
      // استخدام TiePoints + PixelScale (الطريقة التقليدية)
      if (tiePoints.length >= 6) {
        origin = [tiePoints[3], tiePoints[4]]; // X, Y للنقطة الأصلية
      }
      if (pixelScale.length >= 2) {
        pixelSize = [pixelScale[0], pixelScale[1]];
      }
      
      console.log('📍 من TiePoints - النقطة الأصلية:', origin, 'حجم البكسل:', pixelSize);
    }
    
    // تحديد نظام الإحداثيات
    let crs = 'EPSG:4326'; // افتراضي
    
    if (geoKeys && geoKeys.ProjectedCSTypeGeoKey) {
      crs = `EPSG:${geoKeys.ProjectedCSTypeGeoKey}`;
    } else if (geoKeys && geoKeys.GeographicTypeGeoKey) {
      crs = `EPSG:${geoKeys.GeographicTypeGeoKey}`;
    }
    
    // التحقق من UTM Zone 38N (EPSG:32638)
    if (crs === 'EPSG:32638' || (geoKeys && geoKeys.ProjLinearUnitsGeoKey === 9001 && 
        geoKeys.PCSCitationGeoKey && geoKeys.PCSCitationGeoKey.includes('UTM Zone 38N'))) {
      crs = 'EPSG:32638';
      console.log('✅ تم التعرف على نظام UTM Zone 38N');
    }
    
    // حساب الحدود الجغرافية للصورة
    const maxX = origin[0] + (width * pixelSize[0]);
    const minY = origin[1] - (height * pixelSize[1]); // Y ينقص لأن الأصل في الأعلى
    
    const bounds: [[number, number], [number, number]] = [
      [origin[0], minY], // minX, minY
      [maxX, origin[1]]  // maxX, maxY
    ];
    
    console.log('🌍 حدود الصورة المحسوبة:', bounds);
    
    // قراءة قيمة NoData إن وجدت
    let noDataValue: number | undefined;
    try {
      const samples = image.getSamplesPerPixel();
      if (samples > 0) {
        const rasterData = await image.readRasters({ samples: [0], width: 1, height: 1 });
        // فحص القيم الخاصة للبحث عن NoData
        noDataValue = image.getGDALNoData();
      }
    } catch (e) {
      console.log('ℹ️ لا يمكن قراءة قيمة NoData');
    }
    
    const metadata: GeoTiffMetadata = {
      width,
      height,
      origin,
      pixelSize,
      crs,
      bounds,
      noDataValue,
      geoKeys,
      hasGeoTiffTags
    };
    
    console.log('✅ تم قراءة البيانات الوصفية بنجاح:', {
      dimensions: `${width} × ${height}`,
      crs,
      bounds,
      hasGeoTiffTags,
      origin,
      pixelSize
    });
    
    return metadata;
    
  } catch (error) {
    console.error('❌ خطأ في قراءة البيانات الوصفية لملف GeoTIFF:', error);
    throw new Error(`فشل في قراءة ملف GeoTIFF: ${error.message}`);
  }
}

// تحويل ملف صورة إلى Canvas مع الحفاظ على البيانات الأصلية
export async function renderGeoTiffToCanvas(
  buffer: ArrayBuffer, 
  metadata: GeoTiffMetadata
): Promise<HTMLCanvasElement> {
  console.log('🎨 رسم GeoTIFF على Canvas...');
  
  try {
    const tiff = await GeoTIFF.fromArrayBuffer(buffer);
    const image = await tiff.getImage();
    
    // قراءة بيانات الصورة
    const rasterData = await image.readRasters();
    const { width, height } = metadata;
    
    // إنشاء Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(width, height);
    
    // تحويل بيانات الراستر إلى RGBA
    const samplesPerPixel = image.getSamplesPerPixel();
    console.log(`🔢 عدد النطاقات: ${samplesPerPixel}`);
    
    for (let i = 0; i < width * height; i++) {
      const pixelIndex = i * 4;
      
      if (samplesPerPixel === 1) {
        // صورة رمادية
        const value = rasterData[0][i];
        const grayValue = Math.min(255, Math.max(0, value));
        
        imageData.data[pixelIndex] = grayValue;     // R
        imageData.data[pixelIndex + 1] = grayValue; // G
        imageData.data[pixelIndex + 2] = grayValue; // B
        imageData.data[pixelIndex + 3] = 255;       // A
      } else if (samplesPerPixel >= 3) {
        // صورة ملونة RGB
        imageData.data[pixelIndex] = Math.min(255, Math.max(0, rasterData[0][i]));     // R
        imageData.data[pixelIndex + 1] = Math.min(255, Math.max(0, rasterData[1][i])); // G
        imageData.data[pixelIndex + 2] = Math.min(255, Math.max(0, rasterData[2][i])); // B
        imageData.data[pixelIndex + 3] = samplesPerPixel >= 4 ? 
          Math.min(255, Math.max(0, rasterData[3][i])) : 255; // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    console.log('✅ تم رسم الصورة على Canvas بنجاح');
    return canvas;
    
  } catch (error) {
    console.error('❌ خطأ في رسم GeoTIFF:', error);
    throw error;
  }
}