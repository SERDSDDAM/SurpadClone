import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface PreprocessingResult {
  success: boolean;
  layerId: string;
  fileName: string;
  bounds: [[number, number], [number, number]]; // [[minY, minX], [maxY, maxX]]
  coordinateSystem: string;
  geospatialInfo: {
    hasGeoreferencing: boolean;
    dimensions?: { width: number; height: number };
    pixelSize?: [number, number];
    transform?: number[];
    crsWkt?: string;
  };
  outputDirectory?: string;
  processingTime?: string;
  error?: string;
}

/**
 * خدمة المعالجة المسبقة للملفات الجغرافية
 * تحويل GeoTIFF → PNG + World File + Projection File
 */
export class PreprocessingService {
  private outputDir: string;
  
  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp-uploads', 'processed');
  }

  /**
   * معالجة ملف ZIP يحتوي على GeoTIFF
   * @param zipFilePath مسار ملف ZIP
   * @param layerId معرف الطبقة
   */
  async processZipFile(zipFilePath: string, layerId: string): Promise<PreprocessingResult> {
    console.log('🔄 بدء المعالجة المسبقة للملف:', zipFilePath);
    
    // إنشاء مجلد مخصص للطبقة
    const layerOutputDir = path.join(this.outputDir, layerId);
    await fs.mkdir(layerOutputDir, { recursive: true });
    
    const pythonScript = path.join(process.cwd(), 'server/lib/simple-geotiff-processor.py');
    
    return new Promise((resolve, reject) => {
      console.log('🐍 استدعاء معالج Python المحسن...');
      
      const pythonProcess = spawn('python3', [pythonScript, zipFilePath, layerOutputDir], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.log('🐍 Python Log:', data.toString().trim());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // استخراج آخر سطر JSON من المخرجات
            const lines = stdoutData.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const pythonResult = JSON.parse(lastLine);
            
            if (pythonResult.success) {
              // تحويل نتيجة Python إلى تنسيق PreprocessingResult
              const result: PreprocessingResult = {
                success: true,
                layerId: layerId,
                fileName: pythonResult.png_file,
                bounds: pythonResult.bounds,
                coordinateSystem: pythonResult.coordinate_system,
                geospatialInfo: {
                  hasGeoreferencing: true,
                  dimensions: pythonResult.geospatial_info.dimensions,
                  pixelSize: pythonResult.geospatial_info.pixel_size,
                  transform: pythonResult.geospatial_info.transform,
                  crsWkt: pythonResult.geospatial_info.crs_wkt
                },
                outputDirectory: pythonResult.output_directory,
                processingTime: new Date().toISOString()
              };
              
              console.log('✅ المعالجة المسبقة مكتملة مع سجل التدقيق:', result);
              resolve(result);
            } else {
              console.error('❌ فشل في المعالجة:', pythonResult.error);
              reject(new Error(`فشل في المعالجة: ${pythonResult.error}`));
            }
          } catch (error) {
            console.error('❌ خطأ في تحليل نتيجة المعالجة:', error);
            console.error('📄 المخرجات الخام:', stdoutData);
            reject(new Error(`خطأ في تحليل النتيجة: ${error}`));
          }
        } else {
          console.error('❌ فشل في المعالجة المسبقة:', stderrData);
          reject(new Error(`فشل في المعالجة: ${stderrData}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ خطأ في تشغيل معالج Python:', error);
        reject(new Error(`خطأ في تشغيل Python: ${error.message}`));
      });
    });
  }

  /**
   * قراءة معلومات World File من ملف .pgw
   */
  async readWorldFile(pgwPath: string): Promise<{
    pixelSizeX: number;
    pixelSizeY: number;
    upperLeftX: number;
    upperLeftY: number;
    rotation: { x: number; y: number };
  }> {
    const content = await fs.readFile(pgwPath, 'utf-8');
    const lines = content.trim().split('\n');
    
    if (lines.length !== 6) {
      throw new Error('ملف World File غير صالح');
    }
    
    return {
      pixelSizeX: parseFloat(lines[0]),      // X pixel size
      rotation: {
        y: parseFloat(lines[1]),             // Y skew
        x: parseFloat(lines[2])              // X skew
      },
      pixelSizeY: parseFloat(lines[3]),      // Y pixel size (negative)
      upperLeftX: parseFloat(lines[4]),      // X coordinate of upper-left pixel center
      upperLeftY: parseFloat(lines[5])       // Y coordinate of upper-left pixel center
    };
  }

  /**
   * حساب bounds الصورة من World File والأبعاد
   */
  calculateImageBounds(worldFileInfo: any, width: number, height: number) {
    const { pixelSizeX, pixelSizeY, upperLeftX, upperLeftY } = worldFileInfo;
    
    // حساب الحدود
    const minX = upperLeftX - (pixelSizeX / 2);
    const maxY = upperLeftY + (Math.abs(pixelSizeY) / 2);
    const maxX = minX + (width * pixelSizeX);
    const minY = maxY + (height * pixelSizeY);  // pixelSizeY سالب
    
    return {
      minX,
      minY,
      maxX,
      maxY
    };
  }

  /**
   * تنظيف الملفات المؤقتة
   */
  async cleanup(layerId: string) {
    try {
      const layerDir = path.join(this.outputDir, layerId);
      await fs.rm(layerDir, { recursive: true, force: true });
      console.log('🗑️ تم تنظيف الملفات المؤقتة للطبقة:', layerId);
    } catch (error) {
      console.warn('تحذير: تعذر تنظيف الملفات المؤقتة:', error);
    }
  }

  /**
   * نسخ الملفات المعالجة إلى التخزين السحابي (محاكاة)
   */
  async copyToCloudStorage(layerId: string, filePaths: {
    png: string;
    pgw: string;
    prj: string;
  }): Promise<{
    pngUrl: string;
    pgwUrl: string;
    prjUrl: string;
  }> {
    // في التطبيق الحقيقي، سيتم رفع الملفات للتخزين السحابي
    // الآن سنحاكي الروابط
    console.log('☁️ رفع الملفات للتخزين السحابي (محاكاة):', layerId);
    
    return {
      pngUrl: `/public-objects/gis-layers/${layerId}.png`,
      pgwUrl: `/public-objects/gis-layers/${layerId}.pgw`,
      prjUrl: `/public-objects/gis-layers/${layerId}.prj`
    };
  }
}