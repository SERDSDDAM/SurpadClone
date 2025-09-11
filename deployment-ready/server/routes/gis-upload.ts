import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

// مخزن حالة الطبقات
const layerStates = new Map<string, any>();

// إعداد multer لرفع الملفات
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'temp-uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.zip', '.tif', '.tiff'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع ملفات ZIP أو GeoTIFF'));
    }
  }
});

// معالجة الطبقة بشكل غير متزامن
async function processLayerAsync(layerId: string, tempFilePath: string, originalName: string, fileSize: number) {
  try {
    console.log(`🔄 بدء معالجة الطبقة: ${layerId}`);
    
    // إنشاء مجلد للطبقة
    const layerDir = path.join(process.cwd(), 'temp-uploads', 'layers', layerId);
    await fs.mkdir(layerDir, { recursive: true });

    let geoTiffFile = tempFilePath;

    if (originalName.toLowerCase().endsWith('.zip')) {
      console.log('📦 فك ضغط ملف ZIP');
      
      const zip = new AdmZip(tempFilePath);
      const zipEntries = zip.getEntries();
      
      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          const entryPath = path.join(layerDir, entry.entryName);
          zip.extractEntryTo(entry, layerDir, false, true);
          console.log(`📄 تم استخراج: ${entry.entryName}`);
          
          if (entry.entryName.toLowerCase().endsWith('.tif') || entry.entryName.toLowerCase().endsWith('.tiff')) {
            geoTiffFile = entryPath;
          }
        }
      }
      
      if (geoTiffFile === tempFilePath) {
        throw new Error('لم يتم العثور على ملف GeoTIFF في الأرشيف');
      }
    } else {
      // نسخ الملف المباشر
      const targetPath = path.join(layerDir, originalName);
      await fs.copyFile(tempFilePath, targetPath);
      geoTiffFile = targetPath;
    }

    // معالجة GeoTIFF باستخدام المعالج المحسن
    console.log(`🐍 معالجة GeoTIFF: ${geoTiffFile}`);
    const processorPath = path.join(process.cwd(), 'server', 'lib', 'enhanced-geotiff-processor.py');
    const outputDir = path.join(process.cwd(), 'temp-uploads', 'processed', layerId);
    
    const { stdout, stderr } = await execAsync(`python3 "${processorPath}" "${geoTiffFile}" "${outputDir}"`);
    
    if (stderr) {
      console.warn('⚠️ تحذيرات Python:', stderr);
    }
    
    const result = JSON.parse(stdout);
    
    if (result.success) {
      console.log('✅ تمت معالجة الطبقة بنجاح:', result);
      
      // تحديث حالة الطبقة
      layerStates.set(layerId, {
        status: 'processed',
        fileName: originalName,
        fileSize: fileSize,
        uploadDate: new Date().toISOString(),
        imageUrl: result.imageUrl,
        bounds: result.bounds,
        width: result.width,
        height: result.height,
        crs: result.crs
      });
    } else {
      throw new Error(result.error || 'فشل في معالجة الطبقة');
    }

    // تنظيف الملف المؤقت
    try {
      await fs.unlink(tempFilePath);
    } catch (cleanupError) {
      console.warn('⚠️ لم يتم حذف الملف المؤقت:', cleanupError);
    }

  } catch (error) {
    console.error(`❌ خطأ في معالجة الطبقة ${layerId}:`, error);
    
    // تحديث حالة الطبقة بالخطأ
    layerStates.set(layerId, {
      status: 'error',
      fileName: originalName,
      fileSize: fileSize,
      uploadDate: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
}

// رفع ملف GeoTIFF
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📁 بدء عملية رفع ملف GIS');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'لم يتم العثور على ملف' 
      });
    }

    const layerId = `layer_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tempFilePath = req.file.path;
    
    console.log(`🔄 معالجة الملف: ${req.file.originalname}`);
    console.log(`📍 مسار مؤقت: ${tempFilePath}`);
    console.log(`🆔 معرف الطبقة: ${layerId}`);

    // حفظ حالة الطبقة
    layerStates.set(layerId, {
      status: 'processing',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadDate: new Date().toISOString()
    });

    // إرسال الرد الفوري
    res.json({
      success: true,
      layerId: layerId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      message: 'تم رفع الملف وبدء المعالجة'
    });

    // بدء المعالجة في الخلفية
    processLayerAsync(layerId, tempFilePath, req.file.originalname, req.file.size);

  } catch (error) {
    console.error('❌ خطأ في رفع الملف:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'خطأ في الخادم' 
    });
  }
});

// الحصول على معلومات طبقة
router.get('/layers/:layerId', async (req, res) => {
  try {
    const { layerId } = req.params;
    
    console.log(`🔍 طلب معلومات الطبقة: ${layerId}`);
    
    const layerState = layerStates.get(layerId);
    
    if (!layerState) {
      return res.status(404).json({
        success: false,
        error: 'الطبقة غير موجودة'
      });
    }
    
    if (layerState.status === 'processed') {
      res.json({
        success: true,
        status: layerState.status,
        imageUrl: layerState.imageUrl,
        bounds: layerState.bounds,
        width: layerState.width,
        height: layerState.height,
        crs: layerState.crs,
        fileName: layerState.fileName,
        fileSize: layerState.fileSize,
        uploadDate: layerState.uploadDate
      });
    } else if (layerState.status === 'error') {
      res.json({
        success: false,
        status: layerState.status,
        error: layerState.error
      });
    } else {
      res.json({
        success: false,
        status: layerState.status,
        message: 'الطبقة قيد المعالجة'
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في الحصول على معلومات الطبقة:', error);
    res.status(500).json({ 
      success: false, 
      error: 'خطأ في الخادم' 
    });
  }
});

// تقديم ملفات PNG المعالجة
router.get('/layers/:layerId/image/:filename', async (req, res) => {
  try {
    const { layerId, filename } = req.params;
    const imagePath = path.join(process.cwd(), 'temp-uploads', 'processed', layerId, filename);
    
    // التحقق من وجود الملف
    await fs.access(imagePath);
    
    // تحديد نوع المحتوى
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const fileContent = await fs.readFile(imagePath);
    res.send(fileContent);
    
  } catch (error) {
    console.error(`❌ خطأ في تقديم الصورة ${req.params.layerId}/${req.params.filename}:`, error);
    res.status(404).json({ error: 'الصورة غير موجودة' });
  }
});

export default router;
export { layerStates };