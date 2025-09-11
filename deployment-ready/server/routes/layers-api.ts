import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Serve layer images with proper CORS and caching
router.get('/:layerId/image/:filename', async (req, res) => {
  try {
    const { layerId, filename } = req.params;
    
    console.log(`📸 طلب صورة للطبقة: ${layerId}/${filename}`);
    
    // مسار ملف الصورة
    const imagePath = path.join(process.cwd(), 'temp-uploads', 'processed', layerId, filename);
    
    // التحقق من وجود الملف
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ الصورة غير موجودة: ${imagePath}`);
      return res.status(404).json({ 
        success: false, 
        error: 'الصورة غير موجودة' 
      });
    }

    // تعيين headers مناسبة للصور
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/png'; // افتراضي
    
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.tif' || ext === '.tiff') {
      contentType = 'image/tiff';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // إرسال الصورة
    console.log(`✅ إرسال الصورة: ${imagePath}`);
    res.sendFile(path.resolve(imagePath));
    
  } catch (error) {
    console.error('❌ خطأ في إرسال الصورة:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'خطأ في الخادم' 
    });
  }
});

export default router;