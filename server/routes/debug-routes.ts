import { Router } from 'express';
import { layerStates } from './enhanced-upload';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// Debug endpoint to show all layer states
router.get('/debug/layers', async (req, res) => {
  const layers = Array.from(layerStates.entries()).map(([id, state]) => ({
    id,
    ...state
  }));
  
  res.json({
    success: true,
    layersCount: layers.length,
    layers: layers
  });
});

// Debug endpoint to show file system state
router.get('/debug/filesystem', async (req, res) => {
  try {
    const processedDir = path.join(process.cwd(), 'temp-uploads', 'processed');
    
    // Check if processed directory exists
    let directories = [];
    try {
      const dirs = await fs.readdir(processedDir);
      for (const dir of dirs) {
        try {
          const files = await fs.readdir(path.join(processedDir, dir));
          directories.push({ name: dir, files });
        } catch (error) {
          directories.push({ name: dir, error: 'Cannot read directory' });
        }
      }
    } catch (error) {
      directories = [{ error: 'Processed directory does not exist' }];
    }
    
    res.json({
      success: true,
      processedDirectory: processedDir,
      directories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint to create a working test layer
router.post('/debug/create-test-layer', async (req, res) => {
  try {
    const layerId = 'test_working_layer';
    const outputDir = path.join(process.cwd(), 'temp-uploads', 'processed', layerId);
    
    // Create directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Copy the Yemen test image
    const sourceImage = path.join(process.cwd(), 'temp-uploads', 'processed', 'test_layer_demo', 'test_geotiff.png');
    const targetImage = path.join(outputDir, 'test_working.png');
    
    try {
      await fs.copyFile(sourceImage, targetImage);
    } catch (copyError) {
      // If test_layer_demo doesn't exist, create a simple placeholder
      await fs.writeFile(targetImage, 'PNG placeholder');
    }
    
    // Set layer state
    layerStates.set(layerId, {
      status: 'processed',
      fileName: 'test_working_layer.png',
      fileSize: 100000,
      uploadDate: new Date().toISOString(),
      imageUrl: `/api/gis/layers/${layerId}/image/test_working.png`,
      bounds: [[15.2, 44.0], [15.6, 44.4]],
      width: 800,
      height: 600,
      crs: 'EPSG:4326'
    });
    
    res.json({
      success: true,
      layerId,
      message: 'Test layer created successfully',
      imageUrl: `/api/gis/layers/${layerId}/image/test_working.png`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear all layer states
router.delete('/debug/clear-layers', async (req, res) => {
  layerStates.clear();
  res.json({
    success: true,
    message: 'All layer states cleared'
  });
});

export default router;