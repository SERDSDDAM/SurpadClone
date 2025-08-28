import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

/**
 * خدمة الملفات المعالجة للطبقات الجغرافية
 * يخدم PNG، PGW، PRJ files من مجلد المعالجة
 */

// GET /api/gis/public-objects/gis-layers/:fileName - خدمة الملفات المعالجة
router.get('/gis-layers/:fileName', async (req: Request, res: Response) => {
  try {
    const fileName = req.params.fileName;
    
    // البحث في جميع مجلدات المعالجة
    const processedDir = path.join(process.cwd(), 'temp-uploads', 'processed');
    
    try {
      const dirs = await fs.readdir(processedDir);
      
      for (const dir of dirs) {
        const layerDir = path.join(processedDir, dir);
        const stat = await fs.stat(layerDir);
        
        if (stat.isDirectory()) {
          // البحث في مجلدات فرعية
          try {
            const subDirs = await fs.readdir(layerDir);
            
            for (const subDir of subDirs) {
              const subLayerDir = path.join(layerDir, subDir);
              const subStat = await fs.stat(subLayerDir);
              
              if (subStat.isDirectory()) {
                const filePath = path.join(subLayerDir, fileName);
                
                try {
                  await fs.access(filePath);
                  
                  // تحديد Content-Type بناءً على امتداد الملف
                  let contentType = 'application/octet-stream';
                  if (fileName.endsWith('.png')) {
                    contentType = 'image/png';
                  } else if (fileName.endsWith('.pgw')) {
                    contentType = 'text/plain';
                  } else if (fileName.endsWith('.prj')) {
                    contentType = 'text/plain';
                  }
                  
                  // قراءة وإرسال الملف
                  const fileContent = await fs.readFile(filePath);
                  
                  res.set({
                    'Content-Type': contentType,
                    'Content-Length': fileContent.length,
                    'Cache-Control': 'public, max-age=3600'
                  });
                  
                  res.send(fileContent);
                  return;
                  
                } catch {
                  continue;
                }
              }
            }
          } catch {
            continue;
          }
        }
      }
    } catch {
      // مجلد المعالجة غير موجود
    }
    
    // الملف غير موجود
    res.status(404).json({ 
      error: 'File not found',
      fileName: fileName,
      message: 'الملف المطلوب غير موجود في مجلدات المعالجة'
    });
    
  } catch (error) {
    console.error('خطأ في خدمة الملف:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'خطأ في خدمة الملف'
    });
  }
});

export default router;