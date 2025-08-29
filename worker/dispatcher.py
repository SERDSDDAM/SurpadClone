"""
Processing Dispatcher - FastAPI service for Phase 1
خدمة توزيع المعالجة - FastAPI للمرحلة الأولى
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
import structlog

from celery import Celery
import tasks
from models import JobResponse, JobStatus

# Setup logging
logger = structlog.get_logger()

# Initialize FastAPI
app = FastAPI(
    title="Binaa Yemen Processing Dispatcher",
    description="Phase 1 Processing Pipeline Dispatcher",
    version="1.0.0"
)

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL')

# Celery client
celery_app = Celery('binaa_processing')
celery_app.config_from_object('celeryconfig')

# Models imported from models.py

def init_database():
    """Initialize database tables if they don't exist"""
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS processing_jobs (
                        id VARCHAR(255) PRIMARY KEY,
                        layer_id VARCHAR(255),
                        status VARCHAR(50) NOT NULL DEFAULT 'queued',
                        progress INTEGER NOT NULL DEFAULT 0,
                        metadata JSONB,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        INDEX(status),
                        INDEX(created_at)
                    );
                """)
                
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS gis_layers (
                        id VARCHAR(255) PRIMARY KEY,
                        filename VARCHAR(500),
                        status VARCHAR(50) NOT NULL DEFAULT 'pending',
                        image_url TEXT,
                        cog_url TEXT,
                        bounds_wgs84 JSONB,
                        width INTEGER,
                        height INTEGER,
                        crs VARCHAR(100),
                        metadata JSONB,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        INDEX(status)
                    );
                """)
                
                conn.commit()
                logger.info("Database tables initialized")
                
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_database()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "processing-dispatcher"}

@app.post("/enqueue", response_model=JobResponse)
async def enqueue_processing_job(
    file: UploadFile = File(...),
    layer_id: Optional[str] = None,
    priority: str = "normal"
):
    """
    Enqueue a file processing job
    إدراج مهمة معالجة ملف في الطابور
    """
    try:
        # Generate IDs
        job_id = str(uuid.uuid4())
        if not layer_id:
            layer_id = f"layer_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
        
        # Save uploaded file temporarily
        uploads_dir = Path("/app/uploads")
        uploads_dir.mkdir(exist_ok=True)
        
        file_path = uploads_dir / f"{job_id}_{file.filename}"
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Saved file: {file_path} ({len(content)} bytes)")
        
        # Insert job record
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO processing_jobs (id, layer_id, status, progress, metadata)
                    VALUES (%s, %s, 'queued', 0, %s)
                """, (
                    job_id, 
                    layer_id, 
                    {'original_filename': file.filename, 'file_size': len(content)}
                ))
                
                cur.execute("""
                    INSERT INTO gis_layers (id, filename, status)
                    VALUES (%s, %s, 'processing')
                    ON CONFLICT (id) DO UPDATE SET
                        filename = EXCLUDED.filename,
                        status = 'processing',
                        updated_at = NOW()
                """, (layer_id, file.filename))
                
                conn.commit()
        
        # Determine file type and enqueue appropriate task
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension in ['.tif', '.tiff']:
            # GeoTIFF processing
            task = tasks.process_geotiff.apply_async(
                args=[job_id, str(file_path), layer_id, file.filename],
                task_id=job_id,
                queue='processing' if priority == 'normal' else 'high_priority'
            )
        elif file_extension == '.zip':
            # ZIP archive processing
            task = tasks.process_zip_archive.apply_async(
                args=[job_id, str(file_path), layer_id, file.filename],
                task_id=job_id,
                queue='processing' if priority == 'normal' else 'high_priority'
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file_extension}"
            )
        
        logger.info(f"Enqueued job {job_id} for layer {layer_id}")
        
        return JobResponse(
            job_id=job_id,
            status="queued",
            message="Job successfully queued for processing",
            layer_id=layer_id
        )
        
    except Exception as e:
        logger.error(f"Failed to enqueue job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get job status and progress
    الحصول على حالة وتقدم المهمة
    """
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM processing_jobs WHERE id = %s
                """, (job_id,))
                
                job = cur.fetchone()
                
                if not job:
                    raise HTTPException(status_code=404, detail="Job not found")
                
                return JobStatus(
                    job_id=job['id'],
                    status=job['status'],
                    progress=job['progress'],
                    metadata=job['metadata'],
                    created_at=job['created_at'],
                    updated_at=job['updated_at']
                )
                
    except psycopg2.Error as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """
    Cancel a processing job
    إلغاء مهمة معالجة
    """
    try:
        # Revoke Celery task
        celery_app.control.revoke(job_id, terminate=True)
        
        # Update database
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE processing_jobs 
                    SET status = 'cancelled', updated_at = NOW()
                    WHERE id = %s AND status IN ('queued', 'processing')
                """, (job_id,))
                
                if cur.rowcount == 0:
                    raise HTTPException(
                        status_code=400, 
                        detail="Job cannot be cancelled (not found or already completed)"
                    )
                
                conn.commit()
        
        logger.info(f"Cancelled job {job_id}")
        return {"message": "Job cancelled successfully"}
        
    except Exception as e:
        logger.error(f"Failed to cancel job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/queue/status")
async def get_queue_status():
    """
    Get processing queue status and metrics
    الحصول على حالة ومقاييس طابور المعالجة
    """
    try:
        # Get Celery queue stats
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        active_tasks = inspect.active()
        
        # Get database stats
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        status,
                        COUNT(*) as count
                    FROM processing_jobs 
                    WHERE created_at > NOW() - INTERVAL '24 hours'
                    GROUP BY status
                """)
                
                db_stats = {row['status']: row['count'] for row in cur.fetchall()}
        
        return {
            "queue_stats": {
                "worker_stats": stats,
                "active_tasks": len(active_tasks.get(list(active_tasks.keys())[0], [])) if active_tasks else 0,
                "job_counts_24h": db_stats
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get queue status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)