-- Phase 1 Database Schema
-- Initialize processing tables

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Processing Jobs table
CREATE TABLE IF NOT EXISTS processing_jobs (
    id VARCHAR(255) PRIMARY KEY,
    layer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_created_at ON processing_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_layer_id ON processing_jobs(layer_id);

-- GIS Layers table (enhanced from Phase 0)
CREATE TABLE IF NOT EXISTS gis_layers (
    id VARCHAR(255) PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    image_url TEXT,
    cog_url TEXT,
    bounds_wgs84 JSONB,
    width INTEGER,
    height INTEGER,
    crs VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for GIS layers
CREATE INDEX IF NOT EXISTS idx_gis_layers_status ON gis_layers(status);
CREATE INDEX IF NOT EXISTS idx_gis_layers_created_at ON gis_layers(created_at);

-- Layer visibility states (Phase 0 compatibility)
CREATE TABLE IF NOT EXISTS layer_visibility (
    layer_id VARCHAR(255) PRIMARY KEY,
    visible BOOLEAN NOT NULL DEFAULT true,
    opacity FLOAT NOT NULL DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
    z_index INTEGER NOT NULL DEFAULT 1000,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (layer_id) REFERENCES gis_layers(id) ON DELETE CASCADE
);

-- Processing statistics for monitoring
CREATE TABLE IF NOT EXISTS processing_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_jobs INTEGER NOT NULL DEFAULT 0,
    completed_jobs INTEGER NOT NULL DEFAULT 0,
    failed_jobs INTEGER NOT NULL DEFAULT 0,
    avg_processing_time_seconds FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_processing_jobs_updated_at ON processing_jobs;
CREATE TRIGGER update_processing_jobs_updated_at
    BEFORE UPDATE ON processing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gis_layers_updated_at ON gis_layers;
CREATE TRIGGER update_gis_layers_updated_at
    BEFORE UPDATE ON gis_layers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_layer_visibility_updated_at ON layer_visibility;
CREATE TRIGGER update_layer_visibility_updated_at
    BEFORE UPDATE ON layer_visibility
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial statistics record
INSERT INTO processing_stats (date) VALUES (CURRENT_DATE) ON CONFLICT DO NOTHING;