import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import cors from 'cors';

const router = express.Router();

// Enable CORS for this router
router.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));

// Configure multer with increased limits
const upload = multer({
  dest: 'temp-uploads/raw/',
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
    fieldSize: 10 * 1024 * 1024   // 10MB field size
  }
});

// In-memory store for layer states with better typing
interface LayerState {
  status: 'uploading' | 'processing' | 'processed' | 'error';
  fileName: string;
  fileSize: number;
  uploadDate: string;
  imageUrl?: string;
  bounds?: [[number, number], [number, number]];
  width?: number;
  height?: number;
  crs?: string;
  error?: string;
}

export const layerStates = new Map<string, LayerState>();

// Enhanced file processing with better error handling
async function processLayerEnhanced(layerId: string, tempFilePath: string, originalName: string, fileSize: number) {
  try {
    console.log(`🔄 بدء معالجة محسنة للطبقة: ${layerId}`);
    
    // Update status to processing
    layerStates.set(layerId, {
      status: 'processing',
      fileName: originalName,
      fileSize: fileSize,
      uploadDate: new Date().toISOString()
    });

    // Create output directory
    const outputDir = path.join(process.cwd(), 'temp-uploads', 'processed', layerId);
    await fs.mkdir(outputDir, { recursive: true });

    // Call enhanced python processor
    const processorPath = path.join(process.cwd(), 'server', 'lib', 'enhanced-geotiff-processor.py');
    
    return new Promise<void>((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        processorPath,
        tempFilePath,
        outputDir,
        originalName
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('🐍 Python stdout:', data.toString().trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('🐍 Python stderr:', data.toString().trim());
      });

      pythonProcess.on('close', async (code) => {
        try {
          if (code === 0) {
            // Parse result from stdout
            const lines = stdout.trim().split('\n');
            const resultLine = lines.find(line => line.startsWith('SUCCESS:'));
            
            if (resultLine) {
              const result = JSON.parse(resultLine.replace('SUCCESS:', ''));
              
              // Update layer state with processing results
              layerStates.set(layerId, {
                status: 'processed',
                fileName: originalName,
                fileSize: fileSize,
                uploadDate: new Date().toISOString(),
                imageUrl: `/api/gis/layers/${layerId}/image/${result.output_file}`,
                bounds: result.bounds_wgs84,
                width: result.width,
                height: result.height,
                crs: result.crs || 'EPSG:4326'
              });
              
              console.log(`✅ معالجة ناجحة للطبقة: ${layerId}`);
              resolve();
            } else {
              throw new Error('لم يتم العثور على نتيجة المعالجة');
            }
          } else {
            throw new Error(`خطأ في المعالج Python: ${stderr}`);
          }
        } catch (error) {
          layerStates.set(layerId, {
            status: 'error',
            fileName: originalName,
            fileSize: fileSize,
            uploadDate: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'خطأ غير معروف'
          });
          reject(error);
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ خطأ في تشغيل Python:', error);
        layerStates.set(layerId, {
          status: 'error',
          fileName: originalName,
          fileSize: fileSize,
          uploadDate: new Date().toISOString(),
          error: `خطأ في تشغيل المعالج: ${error.message}`
        });
        reject(error);
      });
    });

  } catch (error) {
    console.error(`❌ خطأ في معالجة الطبقة ${layerId}:`, error);
    layerStates.set(layerId, {
      status: 'error',
      fileName: originalName,
      fileSize: fileSize,
      uploadDate: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
    throw error;
  } finally {
    // Clean up temporary file
    try {
      await fs.unlink(tempFilePath);
    } catch (cleanupError) {
      console.warn('⚠️ لم يتم حذف الملف المؤقت:', cleanupError);
    }
  }
}

// Enhanced upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📁 بدء عملية رفع محسنة');
    
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

    // Set initial state
    layerStates.set(layerId, {
      status: 'uploading',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadDate: new Date().toISOString()
    });

    // Send immediate response
    res.json({
      success: true,
      layerId: layerId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      message: 'تم رفع الملف وبدء المعالجة'
    });

    // Start processing in background
    processLayerEnhanced(layerId, tempFilePath, req.file.originalname, req.file.size)
      .catch(error => {
        console.error('❌ خطأ في المعالجة الخلفية:', error);
      });

  } catch (error) {
    console.error('❌ خطأ في رفع الملف:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'خطأ في الخادم' 
    });
  }
});

// Get layer status
router.get('/layers/:layerId/status', async (req, res) => {
  try {
    const { layerId } = req.params;
    const layerState = layerStates.get(layerId);
    
    if (!layerState) {
      return res.status(404).json({
        success: false,
        error: 'الطبقة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      status: layerState.status,
      ...layerState
    });
    
  } catch (error) {
    console.error('❌ خطأ في الحصول على حالة الطبقة:', error);
    res.status(500).json({ 
      success: false, 
      error: 'خطأ في الخادم' 
    });
  }
});

export default router;