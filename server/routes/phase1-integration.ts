/**
 * Phase 1 Integration - Node.js API Integration with Celery Dispatcher
 * تكامل المرحلة الأولى - ربط API مع موزع Celery
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import { z } from 'zod';

const router = Router();

// Configuration
const DISPATCHER_URL = process.env.DISPATCHER_URL || 'http://localhost:8001';
const UPLOAD_DIR = path.join(process.cwd(), 'temp-uploads', 'phase1');

// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.tif', '.tiff', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}`));
    }
  }
});

// Validation schemas
const UploadRequestSchema = z.object({
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  layer_id: z.string().optional(),
});

// Types
interface ProcessingJob {
  job_id: string;
  layer_id: string;
  status: string;
  progress: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Enhanced upload endpoint with Phase 1 processing pipeline
 * نقطة رفع محسنة مع خط معالجة المرحلة الأولى
 */
router.post('/upload-phase1', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file provided' 
      });
    }

    // Validate request
    const validatedData = UploadRequestSchema.parse(req.body);
    
    console.log(`📤 Phase 1 Upload: ${req.file.originalname} (${req.file.size} bytes)`);

    // Prepare form data for dispatcher
    const formData = new FormData();
    const fileBuffer = await fs.readFile(req.file.path);
    const fileBlob = new Blob([fileBuffer], { type: 'application/octet-stream' });
    
    formData.append('file', fileBlob, req.file.originalname);
    if (validatedData.layer_id) {
      formData.append('layer_id', validatedData.layer_id);
    }
    formData.append('priority', validatedData.priority);

    // Send to dispatcher
    const dispatcherResponse = await axios.post(
      `${DISPATCHER_URL}/enqueue`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    // Clean up uploaded file
    await fs.unlink(req.file.path).catch(console.error);

    const jobData = dispatcherResponse.data;

    console.log(`✅ Job enqueued: ${jobData.job_id} for layer ${jobData.layer_id}`);

    return res.json({
      success: true,
      job_id: jobData.job_id,
      layer_id: jobData.layer_id,
      status: jobData.status,
      message: 'File uploaded and queued for processing',
      processing_url: `/api/gis/jobs/${jobData.job_id}`,
    });

  } catch (error) {
    console.error('Phase 1 upload error:', error);

    // Clean up file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    if (axios.isAxiosError(error)) {
      return res.status(503).json({
        success: false,
        error: 'Processing service unavailable',
        details: error.message,
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * Get job status and progress
 * الحصول على حالة وتقدم المهمة
 */
router.get('/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const response = await axios.get(
      `${DISPATCHER_URL}/jobs/${jobId}`,
      { timeout: 10000 }
    );

    const jobData: ProcessingJob = response.data;

    // If job is completed, check if layer is available
    if (jobData.status === 'completed' && jobData.metadata) {
      // Update our layer registry with the processed layer
      const layerInfo = {
        id: jobData.layer_id,
        status: 'processed',
        image_url: jobData.metadata.png_url,
        cog_url: jobData.metadata.cog_url,
        bounds_wgs84: jobData.metadata.bounds_wgs84,
        width: jobData.metadata.width,
        height: jobData.metadata.height,
        crs: jobData.metadata.crs,
        metadata: jobData.metadata,
      };

      // Here you would typically update your database/layer registry
      console.log(`✅ Job ${jobId} completed, layer ${jobData.layer_id} processed`);
    }

    return res.json({
      success: true,
      job: jobData,
    });

  } catch (error: unknown) {
    console.error('Job status error:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Job not found',
        });
      }
      
      return res.status(503).json({
        success: false,
        error: 'Processing service unavailable',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Cancel a processing job
 * إلغاء مهمة معالجة
 */
router.post('/jobs/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const response = await axios.post(
      `${DISPATCHER_URL}/jobs/${jobId}/cancel`,
      {},
      { timeout: 10000 }
    );

    console.log(`🛑 Job ${jobId} cancelled`);

    return res.json({
      success: true,
      message: response.data.message,
    });

  } catch (error: unknown) {
    console.error('Job cancellation error:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        return res.status(400).json({
          success: false,
          error: error.response.data.detail || 'Cannot cancel job',
        });
      }
      
      return res.status(503).json({
        success: false,
        error: 'Processing service unavailable',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get processing queue status and metrics
 * الحصول على حالة ومقاييس طابور المعالجة
 */
router.get('/queue/status', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      `${DISPATCHER_URL}/queue/status`,
      { timeout: 10000 }
    );

    return res.json({
      success: true,
      queue_status: response.data.queue_stats,
      timestamp: response.data.timestamp,
    });

  } catch (error: unknown) {
    console.error('Queue status error:', error);

    return res.status(503).json({
      success: false,
      error: 'Processing service unavailable',
    });
  }
});

/**
 * Health check for Phase 1 integration
 * فحص صحة تكامل المرحلة الأولى
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check dispatcher health
    const dispatcherResponse = await axios.get(
      `${DISPATCHER_URL}/health`,
      { timeout: 5000 }
    );

    return res.json({
      success: true,
      phase1_integration: 'healthy',
      dispatcher_status: dispatcherResponse.data.status,
      upload_dir: UPLOAD_DIR,
    });

  } catch (error: unknown) {
    console.error('Phase 1 health check failed:', error);

    return res.status(503).json({
      success: false,
      phase1_integration: 'unhealthy',
      error: 'Dispatcher unavailable',
    });
  }
});

export default router;