"""
Data Models for Phase 1 Processing Pipeline
نماذج البيانات لخط معالجة المرحلة الأولى
"""

from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class JobStatus(str, Enum):
    """Job processing status enumeration"""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class LayerStatus(str, Enum):
    """Layer processing status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing" 
    PROCESSED = "processed"
    ERROR = "error"

class ProcessingJob(BaseModel):
    """Processing job model"""
    id: str
    layer_id: str
    status: JobStatus = JobStatus.QUEUED
    progress: int = Field(ge=0, le=100, default=0)
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

class GISLayer(BaseModel):
    """GIS layer model"""
    id: str
    filename: str
    status: LayerStatus = LayerStatus.PENDING
    image_url: Optional[str] = None
    cog_url: Optional[str] = None
    bounds_wgs84: Optional[list] = None  # [[lat, lng], [lat, lng]]
    width: Optional[int] = None
    height: Optional[int] = None
    crs: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

class FileUpload(BaseModel):
    """File upload request model"""
    filename: str
    file_size: int
    layer_id: Optional[str] = None
    priority: str = "normal"

class JobEnqueueResponse(BaseModel):
    """Job enqueue response model"""
    job_id: str
    layer_id: str
    status: str
    message: str

class QueueStats(BaseModel):
    """Processing queue statistics"""
    active_workers: int
    active_tasks: int
    pending_jobs: int
    completed_jobs_24h: int
    failed_jobs_24h: int
    avg_processing_time: Optional[float] = None