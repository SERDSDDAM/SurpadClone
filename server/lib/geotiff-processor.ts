import AdmZip from 'adm-zip';
import proj4 from 'proj4';

// تحليل ملف الإسقاط PRJ
export function parsePrjFile(prjContent: string): {
  epsgCode: string | null;
  projectionName: string;
  isUtmZone38N: boolean;
} {
  const prjText = prjContent.toUpperCase();
  
  // البحث عن رمز EPSG
  let epsgCode = null;
  const epsgMatch = prjText.match(/AUTHORITY\["EPSG","(\d+)"\]/);
  if (epsgMatch) {
    epsgCode = `EPSG:${epsgMatch[1]}`;
  }
  
  // تحديد نظام الإسقاط
  let projectionName = 'Unknown';
  let isUtmZone38N = false;
  
  if (prjText.includes('UTM_ZONE_38N') || prjText.includes('UTM ZONE 38N') || epsgCode === 'EPSG:32638') {
    projectionName = 'UTM Zone 38N';
    isUtmZone38N = true;
    epsgCode = epsgCode || 'EPSG:32638';
  } else if (prjText.includes('WGS_1984') || prjText.includes('WGS84')) {
    projectionName = 'WGS 84';
    epsgCode = epsgCode || 'EPSG:4326';
  }
  
  console.log('🔍 تحليل ملف الإسقاط:', {
    projectionName,
    epsgCode,
    isUtmZone38N,
    prjContent: prjContent.substring(0, 100) + '...'
  });
  
  return { epsgCode, projectionName, isUtmZone38N };
}

// تحليل ملف العالم TFW/TWF
export function parseWorldFile(worldContent: string): {
  pixelSizeX: number;
  pixelSizeY: number;
  rotationX: number;
  rotationY: number;
  upperLeftX: number;
  upperLeftY: number;
} {
  const lines = worldContent.trim().split('\n').map(line => parseFloat(line.trim()));
  
  if (lines.length < 6) {
    throw new Error('ملف العالم غير صحيح - يجب أن يحتوي على 6 أسطر');
  }
  
  const [pixelSizeX, rotationX, rotationY, pixelSizeY, upperLeftX, upperLeftY] = lines;
  
  console.log('🌍 تحليل ملف العالم:', {
    pixelSizeX,
    pixelSizeY,
    upperLeftX,
    upperLeftY,
    rotationX,
    rotationY
  });
  
  return {
    pixelSizeX,
    pixelSizeY,
    rotationX,
    rotationY,
    upperLeftX,
    upperLeftY
  };
}

// حساب حدود الصورة من ملف العالم
export function calculateImageBounds(
  worldFile: ReturnType<typeof parseWorldFile>,
  imageWidth: number,
  imageHeight: number
): [[number, number], [number, number]] {
  const { pixelSizeX, pixelSizeY, upperLeftX, upperLeftY } = worldFile;
  
  // حساب النقطة اليمنى السفلى
  const lowerRightX = upperLeftX + (imageWidth * pixelSizeX);
  const lowerRightY = upperLeftY + (imageHeight * pixelSizeY);
  
  // إرجاع الحدود بصيغة [[minX, minY], [maxX, maxY]]
  const bounds: [[number, number], [number, number]] = [
    [Math.min(upperLeftX, lowerRightX), Math.min(upperLeftY, lowerRightY)],
    [Math.max(upperLeftX, lowerRightX), Math.max(upperLeftY, lowerRightY)]
  ];
  
  console.log('📐 حساب حدود الصورة:', { bounds });
  return bounds;
}

// معالج ملف ZIP متعدد الطبقات
export interface ProcessedGeoTiff {
  id: string;
  name: string;
  imageBuffer: Buffer;
  imageName: string;
  projectionInfo: ReturnType<typeof parsePrjFile>;
  worldFile: ReturnType<typeof parseWorldFile> | null;
  bounds: [[number, number], [number, number]] | null;
  coordinateSystem: string;
  hasGeoreferencing: boolean;
}

export function processGeoTiffZip(zipBuffer: Buffer): ProcessedGeoTiff[] {
  console.log('📦 بدء معالجة ملف ZIP للخرائط الجغرافية...');
  
  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    
    console.log(`📁 تم العثور على ${entries.length} ملف داخل ZIP`);
    
    // تصنيف الملفات حسب النوع
    const imageFiles = entries.filter(entry => 
      ['.tif', '.tiff', '.png', '.jpg', '.jpeg'].some(ext => 
        entry.entryName.toLowerCase().endsWith(ext)
      )
    );
    
    const prjFiles = entries.filter(entry => entry.entryName.toLowerCase().endsWith('.prj'));
    const worldFiles = entries.filter(entry => 
      ['.tfw', '.twf', '.pgw', '.pgwx', '.pnw', '.jpgw', '.jpegw'].some(ext =>
        entry.entryName.toLowerCase().endsWith(ext)
      )
    );
    
    console.log('📊 تصنيف الملفات:', {
      imageFiles: imageFiles.length,
      prjFiles: prjFiles.length, 
      worldFiles: worldFiles.length
    });
    
    const processedLayers: ProcessedGeoTiff[] = [];
    
    // معالجة كل صورة
    for (const imageEntry of imageFiles) {
      const baseName = imageEntry.entryName.replace(/\.[^/.]+$/, '');
      const imageBuffer = imageEntry.getData();
      
      // البحث عن ملف الإسقاط المطابق
      const prjEntry = prjFiles.find(entry => 
        entry.entryName.replace(/\.[^/.]+$/, '') === baseName
      );
      
      // البحث عن ملف العالم المطابق
      const worldEntry = worldFiles.find(entry => 
        entry.entryName.replace(/\.[^/.]+$/, '') === baseName
      );
      
      // تحليل معلومات الإسقاط
      let projectionInfo = {
        epsgCode: 'EPSG:32638', // افتراضي لليمن
        projectionName: 'UTM Zone 38N',
        isUtmZone38N: true
      };
      
      if (prjEntry) {
        const prjContent = prjEntry.getData().toString('utf8');
        projectionInfo = parsePrjFile(prjContent);
      }
      
      // تحليل ملف العالم
      let worldFile = null;
      let bounds = null;
      
      if (worldEntry) {
        try {
          const worldContent = worldEntry.getData().toString('utf8');
          worldFile = parseWorldFile(worldContent);
          
          // افتراض أبعاد الصورة (يجب قراءتها من الصورة في التطبيق الحقيقي)
          const assumedWidth = 1000;
          const assumedHeight = 1000;
          bounds = calculateImageBounds(worldFile, assumedWidth, assumedHeight);
        } catch (error) {
          console.warn('⚠️ خطأ في تحليل ملف العالم:', error);
        }
      }
      
      // إنشاء معرف فريد للطبقة
      const layerId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const processedLayer: ProcessedGeoTiff = {
        id: layerId,
        name: baseName,
        imageBuffer,
        imageName: imageEntry.entryName,
        projectionInfo,
        worldFile,
        bounds,
        coordinateSystem: projectionInfo.epsgCode || 'EPSG:32638',
        hasGeoreferencing: !!prjEntry || !!worldEntry
      };
      
      processedLayers.push(processedLayer);
      
      console.log(`✅ تمت معالجة الطبقة: ${baseName}`, {
        hasProjection: !!prjEntry,
        hasWorldFile: !!worldEntry,
        coordinateSystem: processedLayer.coordinateSystem
      });
    }
    
    console.log(`🎯 تم معالجة ${processedLayers.length} طبقة بنجاح`);
    return processedLayers;
    
  } catch (error) {
    console.error('❌ خطأ في معالجة ملف ZIP:', error);
    throw new Error(`فشل في معالجة ملف ZIP: ${error.message}`);
  }
}

// تحويل الإحداثيات باستخدام proj4
export function transformBounds(
  bounds: [[number, number], [number, number]],
  sourceEpsg: string,
  targetEpsg: string = 'EPSG:4326'
): [[number, number], [number, number]] {
  
  // تعريف أنظمة الإحداثيات
  if (!proj4.defs(sourceEpsg)) {
    if (sourceEpsg === 'EPSG:32638') {
      proj4.defs(sourceEpsg, '+proj=utm +zone=38 +datum=WGS84 +units=m +no_defs');
    }
  }
  
  if (!proj4.defs(targetEpsg)) {
    if (targetEpsg === 'EPSG:4326') {
      proj4.defs(targetEpsg, '+proj=longlat +datum=WGS84 +no_defs');
    }
  }
  
  try {
    const [[minX, minY], [maxX, maxY]] = bounds;
    
    // تحويل النقاط الأربع للمستطيل
    const [swLng, swLat] = proj4(sourceEpsg, targetEpsg, [minX, minY]);
    const [neLng, neLat] = proj4(sourceEpsg, targetEpsg, [maxX, maxY]);
    const [nwLng, nwLat] = proj4(sourceEpsg, targetEpsg, [minX, maxY]);
    const [seLng, seLat] = proj4(sourceEpsg, targetEpsg, [maxX, minY]);
    
    // العثور على أقصى وأدنى قيم
    const minLng = Math.min(swLng, neLng, nwLng, seLng);
    const maxLng = Math.max(swLng, neLng, nwLng, seLng);
    const minLat = Math.min(swLat, neLat, nwLat, seLat);
    const maxLat = Math.max(swLat, neLat, nwLat, seLat);
    
    console.log(`🔄 تحويل الإحداثيات من ${sourceEpsg} إلى ${targetEpsg}:`, {
      source: bounds,
      target: [[minLat, minLng], [maxLat, maxLng]]
    });
    
    return [[minLat, minLng], [maxLat, maxLng]];
    
  } catch (error) {
    console.error('❌ خطأ في تحويل الإحداثيات:', error);
    throw new Error(`فشل في تحويل الإحداثيات: ${error.message}`);
  }
}