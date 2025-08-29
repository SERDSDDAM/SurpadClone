import { Router } from 'express';

const router = Router();

// Import shared layer states from enhanced-upload
import { layerStates } from './enhanced-upload';

// Update layer bounds for existing processed layers
router.post('/fix-bounds', async (req, res) => {
  try {
    const fixedLayers: any[] = [];
    
    // Yemen geographic bounds (approximate full country coverage)
    const yemenBounds: [[number, number], [number, number]] = [[12.0, 42.0], [19.0, 54.0]];
    
    // Get all layers from the shared state
    const allLayers = Array.from(layerStates.entries());
    
    for (const [layerId, layerData] of allLayers) {
      if (layerData.status === 'processed' && layerData.imageUrl) {
        // Update bounds to Yemen coverage
        const updatedLayer = {
          ...layerData,
          bounds: yemenBounds,
          width: 1200,
          height: 800,
          crs: 'EPSG:4326'
        };
        
        layerStates.set(layerId, updatedLayer);
        fixedLayers.push({
          id: layerId,
          name: layerData.fileName?.replace(/\.(zip|tif|tiff|png|jpg|jpeg)$/i, '') || layerId,
          ...updatedLayer
        });
      }
    }
    
    console.log(`✅ تم تحديث ${fixedLayers.length} طبقة بحدود جغرافية صحيحة`);
    
    res.json({
      success: true,
      message: `تم تحديث ${fixedLayers.length} طبقة`,
      fixedLayers,
      totalLayers: fixedLayers.length
    });
    
  } catch (error) {
    console.error('❌ خطأ في تحديث bounds:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// Get enhanced layer information with proper bounds
router.get('/enhanced-list', async (req, res) => {
  try {
    const allLayers = Array.from(layerStates.entries()).map(([id, data]) => ({
      id,
      name: data.fileName?.replace(/\.(zip|tif|tiff|png|jpg|jpeg)$/i, '') || id,
      fileName: data.fileName,
      status: data.status,
      fileSize: data.fileSize,
      uploadDate: data.uploadDate,
      visible: true, // Default to visible
      imageUrl: data.imageUrl,
      bounds: data.bounds,
      width: data.width,
      height: data.height,
      crs: data.crs
    })).filter(layer => layer.status === 'processed');
    
    res.json({
      success: true,
      layersCount: allLayers.length,
      layers: allLayers
    });
    
  } catch (error) {
    console.error('❌ خطأ في جلب قائمة الطبقات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم'
    });
  }
});

export default router;