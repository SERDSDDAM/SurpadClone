import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface PythonGeoTiffMetadata {
  filename: string;
  width: number;
  height: number;
  crs: string;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  transform: number[];
  pixel_size_x: number;
  pixel_size_y: number;
  band_count: number;
  dtype: string;
}

export interface PreviewInfo {
  preview_width: number;
  preview_height: number;
  original_width: number;
  original_height: number;
}

/**
 * استدعاء معالج Python لاستخراج البيانات الوصفية من GeoTIFF
 * يحاكي وظيفة rasterio في النظام القديم
 */
export async function extractGeoTiffMetadataPython(zipPath: string): Promise<PythonGeoTiffMetadata> {
  const pythonScript = path.join(process.cwd(), 'server/lib/python-geotiff-processor.py');
  
  return new Promise((resolve, reject) => {
    console.log('🐍 استدعاء معالج Python لاستخراج البيانات الوصفية...');
    
    const pythonProcess = spawn('python3', [pythonScript, zipPath, 'metadata'], {
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
          const metadata = JSON.parse(stdoutData.trim());
          console.log('✅ تم استخراج البيانات الوصفية بنجاح:', metadata);
          resolve(metadata);
        } catch (error) {
          console.error('❌ خطأ في تحليل JSON:', error);
          console.error('البيانات المستلمة:', stdoutData);
          reject(new Error(`خطأ في تحليل البيانات: ${error}`));
        }
      } else {
        console.error('❌ خطأ في تنفيذ Python Script:', stderrData);
        reject(new Error(`فشل في معالجة الملف: ${stderrData}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('❌ خطأ في تشغيل Python:', error);
      reject(new Error(`خطأ في تشغيل Python: ${error.message}`));
    });
  });
}

/**
 * إنشاء معاينة مصغرة من GeoTIFF
 */
export async function createGeoTiffPreview(zipPath: string, outputPath: string): Promise<PreviewInfo> {
  const pythonScript = path.join(process.cwd(), 'server/lib/python-geotiff-processor.py');
  
  return new Promise((resolve, reject) => {
    console.log('🐍 إنشاء معاينة باستخدام Python...');
    
    const pythonProcess = spawn('python3', [pythonScript, zipPath, 'preview', outputPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.log('🐍 Python Preview Log:', data.toString().trim());
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const previewInfo = JSON.parse(stdoutData.trim());
          console.log('✅ تم إنشاء المعاينة بنجاح:', previewInfo);
          resolve(previewInfo);
        } catch (error) {
          console.error('❌ خطأ في تحليل معلومات المعاينة:', error);
          reject(new Error(`خطأ في إنشاء المعاينة: ${error}`));
        }
      } else {
        console.error('❌ خطأ في إنشاء المعاينة:', stderrData);
        reject(new Error(`فشل في إنشاء المعاينة: ${stderrData}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('❌ خطأ في تشغيل Python للمعاينة:', error);
      reject(new Error(`خطأ في تشغيل Python: ${error.message}`));
    });
  });
}