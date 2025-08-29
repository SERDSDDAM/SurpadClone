"""
Celery Configuration for Phase 1 Processing Pipeline
تكوين Celery لخط معالجة المرحلة الأولى
"""

import os
from kombu import Queue

# Redis connection
broker_url = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
result_backend = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Task settings
task_serializer = 'json'
accept_content = ['json']
result_serializer = 'json'
timezone = 'Asia/Aden'
enable_utc = True

# Task execution settings
task_always_eager = False
task_eager_propagates = False
task_ignore_result = False
task_store_eager_result = True

# Task routing and queues
task_routes = {
    'tasks.process_geotiff': {'queue': 'processing'},
    'tasks.process_zip_archive': {'queue': 'processing'},
    'tasks.validate_layer': {'queue': 'validation'},
    'tasks.cleanup_failed_job': {'queue': 'cleanup'},
    'tasks.send_notification': {'queue': 'notifications'}
}

task_default_queue = 'default'
task_queues = (
    Queue('default', routing_key='default'),
    Queue('processing', routing_key='processing'),
    Queue('validation', routing_key='validation'),
    Queue('cleanup', routing_key='cleanup'),
    Queue('notifications', routing_key='notifications'),
    Queue('high_priority', routing_key='high_priority'),
)

# Worker settings
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 100
worker_disable_rate_limits = False

# Retry settings
task_acks_late = True
task_reject_on_worker_lost = True
task_default_retry_delay = 60  # seconds
task_max_retries = 3

# Result backend settings
result_expires = 3600  # 1 hour
result_backend_max_retries = 3

# Beat schedule for periodic tasks
beat_schedule = {
    'cleanup-failed-jobs': {
        'task': 'tasks.cleanup_old_jobs',
        'schedule': 3600.0,  # Every hour
        'options': {'queue': 'cleanup'}
    },
    'update-processing-stats': {
        'task': 'tasks.update_processing_statistics',
        'schedule': 300.0,  # Every 5 minutes
        'options': {'queue': 'default'}
    },
}

# Monitoring
worker_send_task_events = True
task_send_sent_event = True

# Security
worker_hijack_root_logger = False
worker_log_color = False

# Performance optimization
broker_pool_limit = 10
broker_connection_retry_on_startup = True
broker_connection_retry = True

# Task compression
task_compression = 'gzip'
result_compression = 'gzip'

# Error handling
task_annotations = {
    '*': {'rate_limit': '10/s'},
    'tasks.process_geotiff': {'rate_limit': '5/s', 'time_limit': 1800},  # 30 minutes
    'tasks.process_zip_archive': {'rate_limit': '3/s', 'time_limit': 3600},  # 1 hour
}

# Development settings
if os.getenv('ENVIRONMENT') == 'development':
    task_always_eager = False
    worker_log_level = 'DEBUG'
else:
    worker_log_level = 'INFO'