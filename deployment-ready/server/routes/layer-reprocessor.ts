import express from 'express';
import { layerStates } from './enhanced-upload';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// إعادة معالجة الطبقات الموجودة
router.post('/reprocess-existing-layer/:layerId', async (req, res) => {
  try {
    const { layerId } = req.params;
    console.log(`🔄 إعادة معالجة الطبقة: ${layerId}`);
    
    const layerDir = path.join(process.cwd(), 'temp-uploads', 'processed', layerId);
    
    // التحقق من وجود metadata.json
    const metadataPath = path.join(layerDir, 'metadata.json');
    
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      
      if (metadata.success && metadata.imageFile) {
        // إعداد الطبقة بناءً على metadata.json الموجود
        const imageUrl = `/api/gis/layers/${layerId}/image/${metadata.imageFile}`;
        
        layerStates.set(layerId, {
          status: 'processed',
          fileName: metadata.original_name || '2a1.zip',
          fileSize: 30746789,
          uploadDate: new Date().toISOString(),
          imageUrl,
          bounds: metadata.leaflet_bounds,
          width: metadata.width,
          height: metadata.height,
          crs: metadata.crs || 'EPSG:4326'
        });
        
        console.log(`✅ تم إعادة تحميل الطبقة: ${layerId}`);
        
        res.json({
          success: true,
          message: `تم إعادة تحميل الطبقة بنجاح`,
          layer: layerStates.get(layerId)
        });
        
      } else {
        throw new Error('Metadata غير صحيح');
      }
      
    } catch (metaError) {
      console.error(`❌ خطأ في metadata للطبقة ${layerId}:`, metaError);
      res.status(404).json({
        success: false,
        error: 'metadata.json غير موجود أو تالف'
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في إعادة المعالجة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة المعالجة'
    });
  }
});

// تحديث البيانات المباشر للطبقة المعالجة
router.post('/update-layer-manually', async (req, res) => {
  try {
    console.log('🔧 تحديث الطبقة يدوياً...');
    
    // تحديث الطبقة الأولى مع البيانات الصحيحة
    layerStates.set('layer_1756429692013_m86tij', {
      status: 'processed',
      fileName: '2a1.zip',
      fileSize: 30746789,
      uploadDate: '2025-08-29T01:08:14.020Z',
      imageUrl: '/api/gis/layers/layer_1756429692013_m86tij/image/processed.png',
      bounds: [[15.257872558444266, 44.250912507311455], [15.265464410927567, 44.26027519012907]],
      width: 6048,
      height: 4904,
      crs: 'EPSG:4326'
    });
    
    // حذف الطبقة التالفة
    layerStates.delete('layer_1756470615226_vnq85m');
    
    console.log('✅ تم تحديث الطبقات يدوياً');
    
    const layers = Array.from(layerStates.entries()).map(([id, state]) => ({
      id,
      name: state.fileName.replace(/\.[^/.]+$/, ""),
      visible: true,
      ...state
    }));
    
    res.json({
      success: true,
      message: 'تم تحديث الطبقات بنجاح',
      layersCount: layers.length,
      layers
    });
    
  } catch (error) {
    console.error('❌ خطأ في التحديث اليدوي:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في التحديث'
    });
  }
});

export default router;