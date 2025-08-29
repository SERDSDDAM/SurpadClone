import express from 'express';
import { layerStates } from './enhanced-upload';

const router = express.Router();

// إصلاح الطبقات المعطلة
router.post('/fix-broken-layers', async (req, res) => {
  try {
    console.log('🔧 إصلاح الطبقات المعطلة...');
    
    // إصلاح الطبقة الأولى التي تم معالجتها بنجاح
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
    
    // حذف الطبقة الثانية التي لا تحتوي على GeoTIFF
    layerStates.delete('layer_1756429742454_ww1lct');
    
    console.log('✅ تم إصلاح الطبقات بنجاح');
    
    // إرجاع الطبقات المحدثة
    const layers = Array.from(layerStates.entries()).map(([id, state]) => ({
      id,
      name: state.fileName.replace(/\.[^/.]+$/, ""),
      ...state
    }));
    
    res.json({
      success: true,
      message: 'تم إصلاح الطبقات بنجاح',
      layersCount: layers.length,
      layers
    });
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح الطبقات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إصلاح الطبقات'
    });
  }
});

export default router;