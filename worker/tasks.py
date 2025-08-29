"""
Celery Tasks for Phase 1 Processing Pipeline
مهام Celery لخط معالجة المرحلة الأولى
"""

import os
import json
import tempfile
import shutil
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import rasterio
import numpy as np
from rasterio.warp import transform_bounds, calculate_default_transform
from rasterio.enums import Resampling
from PIL import Image
import pyproj
from minio import Minio
from minio.error import S3Error
import psycopg2
from psycopg2.extras import RealDictCursor
import structlog

from celery import Celery
from celery.exceptions import Retry
import celeryconfig

# Initialize Celery
app = Celery('binaa_processing')
app.config_from_object(celeryconfig)

# Setup structured logging
logger = structlog.get_logger()

# Configuration from environment
DATABASE_URL = os.getenv('DATABASE_URL')
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'localhost:9000')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'minioadmin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minioadmin123')
BUCKET_NAME = os.getenv('MINIO_BUCKET', 'binaa-layers')

# Initialize MinIO client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False  # Development only
)

def ensure_bucket_exists():
    """Ensure the MinIO bucket exists"""
    try:
        if not minio_client.bucket_exists(BUCKET_NAME):
            minio_client.make_bucket(BUCKET_NAME)
            logger.info(f"Created bucket: {BUCKET_NAME}")
    except S3Error as e:
        logger.error(f"Error creating bucket: {e}")
        raise

def update_job_status(job_id: str, status: str, progress: int = 0, metadata: Optional[Dict] = None):
    """Update job status in database"""
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO processing_jobs (id, status, progress, metadata, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        progress = EXCLUDED.progress,
                        metadata = EXCLUDED.metadata,
                        updated_at = EXCLUDED.updated_at
                """, (job_id, status, progress, json.dumps(metadata or {}), datetime.now(timezone.utc)))
                conn.commit()
    except Exception as e:
        logger.error(f"Failed to update job status: {e}")

def upload_to_minio(local_path: str, object_name: str) -> str:
    """Upload file to MinIO and return URL"""
    try:
        ensure_bucket_exists()
        minio_client.fput_object(BUCKET_NAME, object_name, local_path)
        # Generate public URL (development)
        url = f"http://{MINIO_ENDPOINT}/{BUCKET_NAME}/{object_name}"
        logger.info(f"Uploaded {local_path} to {url}")
        return url
    except S3Error as e:
        logger.error(f"MinIO upload failed: {e}")
        raise

@app.task(bind=True, name='tasks.process_geotiff')
def process_geotiff(self, job_id: str, input_file_path: str, layer_id: str, original_filename: str):
    """
    Process GeoTIFF file to COG format with PNG preview
    معالجة ملف GeoTIFF إلى تنسيق COG مع معاينة PNG
    """
    try:
        logger.info(f"Starting GeoTIFF processing for job {job_id}")
        update_job_status(job_id, 'processing', 10)
        
        # Create temporary working directory
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Step 1: Validate input file
            with rasterio.open(input_file_path) as src:
                logger.info(f"Input raster: {src.profile}")
                bounds = src.bounds
                crs = src.crs
                width = src.width
                height = src.height
                
            update_job_status(job_id, 'processing', 25)
            
            # Step 2: Convert to COG format
            cog_path = temp_path / f"{layer_id}.tif"
            self.create_cog(input_file_path, str(cog_path))
            
            update_job_status(job_id, 'processing', 50)
            
            # Step 3: Create PNG preview
            png_path = temp_path / f"{layer_id}.png"
            self.create_png_preview(input_file_path, str(png_path))
            
            update_job_status(job_id, 'processing', 75)
            
            # Step 4: Calculate WGS84 bounds
            if crs != 'EPSG:4326':
                transformer = pyproj.Transformer.from_crs(crs, 'EPSG:4326', always_xy=True)
                west, south = transformer.transform(bounds.left, bounds.bottom)
                east, north = transformer.transform(bounds.right, bounds.top)
                wgs84_bounds = [[south, west], [north, east]]  # Leaflet format
            else:
                wgs84_bounds = [[bounds.bottom, bounds.left], [bounds.top, bounds.right]]
            
            # Step 5: Upload to MinIO
            cog_url = upload_to_minio(str(cog_path), f"layers/{layer_id}/{layer_id}.tif")
            png_url = upload_to_minio(str(png_path), f"layers/{layer_id}/{layer_id}.png")
            
            # Step 6: Create metadata
            metadata = {
                'success': True,
                'layer_id': layer_id,
                'original_filename': original_filename,
                'cog_url': cog_url,
                'png_url': png_url,
                'bounds_wgs84': wgs84_bounds,
                'width': width,
                'height': height,
                'crs': str(crs),
                'processed_at': datetime.now(timezone.utc).isoformat(),
                'job_id': job_id
            }
            
            # Step 7: Upload metadata
            metadata_path = temp_path / 'metadata.json'
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            metadata_url = upload_to_minio(str(metadata_path), f"layers/{layer_id}/metadata.json")
            metadata['metadata_url'] = metadata_url
            
            update_job_status(job_id, 'completed', 100, metadata)
            
            logger.info(f"GeoTIFF processing completed for job {job_id}")
            return metadata
            
    except Exception as e:
        logger.error(f"GeoTIFF processing failed for job {job_id}: {e}")
        update_job_status(job_id, 'failed', 0, {'error': str(e)})
        raise

    def create_cog(self, input_path: str, output_path: str):
        """Create Cloud Optimized GeoTIFF"""
        with rasterio.open(input_path) as src:
            profile = src.profile.copy()
            
            # COG optimization settings
            profile.update({
                'driver': 'GTiff',
                'compress': 'deflate',
                'tiled': True,
                'blockxsize': 512,
                'blockysize': 512,
                'BIGTIFF': 'IF_SAFER'
            })
            
            with rasterio.open(output_path, 'w', **profile) as dst:
                for i in range(1, src.count + 1):
                    dst.write(src.read(i), i)
                    
                # Add overviews
                factors = [2, 4, 8, 16]
                dst.build_overviews(factors, Resampling.average)
                dst.update_tags(ns='rio_overview', resampling='average')

    def create_png_preview(self, input_path: str, output_path: str):
        """Create PNG preview image"""
        with rasterio.open(input_path) as src:
            # Read and scale data
            data = src.read()
            
            # Handle different band configurations
            if data.shape[0] == 1:  # Single band
                img_data = data[0]
                # Normalize to 0-255
                img_data = ((img_data - img_data.min()) / (img_data.max() - img_data.min()) * 255).astype(np.uint8)
                img = Image.fromarray(img_data, mode='L')
            elif data.shape[0] >= 3:  # RGB or more
                # Take first 3 bands as RGB
                rgb_data = data[:3].transpose(1, 2, 0)
                # Normalize each band
                for i in range(3):
                    band = rgb_data[:, :, i]
                    rgb_data[:, :, i] = ((band - band.min()) / (band.max() - band.min()) * 255).astype(np.uint8)
                img = Image.fromarray(rgb_data.astype(np.uint8), mode='RGB')
            
            # Resize if too large (max 2048px)
            if max(img.size) > 2048:
                img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
            
            img.save(output_path, 'PNG', optimize=True)

@app.task(bind=True, name='tasks.process_zip_archive')
def process_zip_archive(self, job_id: str, input_file_path: str, layer_id: str, original_filename: str):
    """
    Process ZIP archive containing geospatial files
    معالجة أرشيف ZIP يحتوي على ملفات جغرافية مكانية
    """
    try:
        logger.info(f"Starting ZIP processing for job {job_id}")
        update_job_status(job_id, 'processing', 10)
        
        # Extract and find GeoTIFF files
        import zipfile
        with tempfile.TemporaryDirectory() as extract_dir:
            with zipfile.ZipFile(input_file_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # Find the main GeoTIFF file
            geotiff_files = list(Path(extract_dir).rglob('*.tif')) + list(Path(extract_dir).rglob('*.tiff'))
            
            if not geotiff_files:
                raise ValueError("No GeoTIFF files found in archive")
            
            # Process the first (or largest) GeoTIFF
            main_tiff = max(geotiff_files, key=lambda x: x.stat().st_size)
            
            update_job_status(job_id, 'processing', 30)
            
            # Delegate to GeoTIFF processor
            return process_geotiff.apply_async(
                args=[job_id, str(main_tiff), layer_id, original_filename],
                task_id=f"{job_id}_geotiff"
            ).get()
            
    except Exception as e:
        logger.error(f"ZIP processing failed for job {job_id}: {e}")
        update_job_status(job_id, 'failed', 0, {'error': str(e)})
        raise

@app.task(name='tasks.cleanup_old_jobs')
def cleanup_old_jobs():
    """Clean up old completed jobs"""
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                # Delete jobs older than 7 days
                cur.execute("""
                    DELETE FROM processing_jobs 
                    WHERE status IN ('completed', 'failed') 
                    AND updated_at < NOW() - INTERVAL '7 days'
                """)
                deleted_count = cur.rowcount
                conn.commit()
                
        logger.info(f"Cleaned up {deleted_count} old jobs")
        return {"deleted_jobs": deleted_count}
        
    except Exception as e:
        logger.error(f"Job cleanup failed: {e}")
        raise

@app.task(name='tasks.update_processing_statistics')
def update_processing_statistics():
    """Update processing statistics for monitoring"""
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        status,
                        COUNT(*) as count,
                        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration
                    FROM processing_jobs 
                    WHERE created_at > NOW() - INTERVAL '24 hours'
                    GROUP BY status
                """)
                stats = cur.fetchall()
                
        result = {row['status']: {'count': row['count'], 'avg_duration': row['avg_duration']} for row in stats}
        logger.info(f"Processing stats: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Stats update failed: {e}")
        raise

if __name__ == '__main__':
    app.start()