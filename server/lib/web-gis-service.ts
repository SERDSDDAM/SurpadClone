import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface WebGISResult {
  success: boolean;
  layerId: string;
  pngFile?: string;
  boundsWGS84?: {
    southwest: [number, number]; // [lat, lng]
    northeast: [number, number]; // [lat, lng]
  };
  boundsArray?: [[number, number], [number, number]];
  originalCRS?: string;
  dimensions?: { width: number; height: number };
  outputDirectory?: string;
  error?: string;
}

export class WebGISService {
  private readonly outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp-uploads', 'processed');
  }

  /**
   * معالجة ملف ZIP وتحويله لصيغة الويب
   */
  async processZipFile(zipFilePath: string, layerId: string): Promise<WebGISResult> {
    console.log('🌍 بدء معالجة WebGIS للملف:', zipFilePath);
    
    // إنشاء مجلد مخصص للطبقة
    const layerOutputDir = path.join(this.outputDir, layerId);
    await fs.mkdir(layerOutputDir, { recursive: true });
    
    const pythonScript = path.join(process.cwd(), 'server/lib/qgis-web-processor.py');
    
    return new Promise((resolve, reject) => {
      console.log('🐍 تشغيل معالج QGIS Web...');
      
      const pythonProcess = spawn('python3', [pythonScript, zipFilePath, layerOutputDir], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
      });

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.log('🐍 Python:', data.toString().trim());
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // استخراج JSON من المخرجات المختلطة
            const jsonStartIndex = stdoutData.lastIndexOf('{');
            if (jsonStartIndex === -1) {
              throw new Error('لم يتم العثور على JSON في المخرجات');
            }
            
            const jsonStr = stdoutData.substring(jsonStartIndex);
            console.log('📋 JSON المستخرج:', jsonStr.substring(0, 200) + '...');
            
            const pythonResult = JSON.parse(jsonStr);
            
            if (pythonResult.success) {
              const result: WebGISResult = {
                success: true,
                layerId: layerId,
                pngFile: pythonResult.png_file,
                boundsWGS84: pythonResult.bounds_wgs84,
                boundsArray: pythonResult.bounds_array,
                originalCRS: pythonResult.original_crs,
                dimensions: pythonResult.dimensions,
                outputDirectory: pythonResult.output_directory
              };
              
              console.log('✅ WebGIS معالجة مكتملة:', {
                layerId: result.layerId,
                bounds: result.boundsWGS84,
                dimensions: result.dimensions
              });
              
              resolve(result);
            } else {
              console.error('❌ فشل في معالجة WebGIS:', pythonResult.error);
              resolve({
                success: false,
                layerId: layerId,
                error: pythonResult.error
              });
            }
          } catch (error) {
            console.error('❌ خطأ في تحليل نتيجة WebGIS:', error);
            console.error('📄 المخرجات الخام:', stdoutData);
            reject(new Error(`خطأ في تحليل النتيجة: ${error}`));
          }
        } else {
          console.error('❌ فشل في معالجة WebGIS:', stderrData);
          reject(new Error(`فشل في المعالجة: ${stderrData}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ خطأ في تشغيل Python:', error);
        reject(new Error(`خطأ في تشغيل Python: ${error.message}`));
      });
    });
  }

  /**
   * تقديم ملف PNG للطبقة
   */
  async serveLayerFile(layerId: string, filename: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.outputDir, layerId, filename);
      const fileBuffer = await fs.readFile(filePath);
      return fileBuffer;
    } catch (error) {
      console.error('❌ خطأ في تقديم ملف الطبقة:', error);
      return null;
    }
  }
}