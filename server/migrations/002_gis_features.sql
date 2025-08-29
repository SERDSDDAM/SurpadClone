-- Migration: Create GIS Features tables and spatial indexes
-- Description: Add tables for digitized features, history, vectorization jobs, and data exchange
-- Date: 2025-08-29

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create GIS schema
CREATE SCHEMA IF NOT EXISTS gis;

-- Create gis_features table with PostGIS geometry column
CREATE TABLE IF NOT EXISTS gis_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id varchar(255) NOT NULL,
  geometry geometry(Geometry, 4326) NOT NULL, -- PostGIS geometry column
  properties jsonb DEFAULT '{}',
  feature_type varchar(50) NOT NULL,
  created_by varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone
);

-- Create spatial index on geometry column (GIST)
CREATE INDEX IF NOT EXISTS idx_gis_features_geom 
  ON gis_features USING GIST (geometry);

-- Create regular indexes
CREATE INDEX IF NOT EXISTS idx_gis_features_layer 
  ON gis_features (layer_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_type 
  ON gis_features (feature_type);
CREATE INDEX IF NOT EXISTS idx_gis_features_created 
  ON gis_features (created_at);

-- Create features history table for undo/redo
CREATE TABLE IF NOT EXISTS gis_features_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id uuid NOT NULL,
  action varchar(20) NOT NULL, -- create/update/delete
  geometry geometry(Geometry, 4326),
  properties jsonb DEFAULT '{}',
  user_id varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Foreign key constraint
  FOREIGN KEY (feature_id) REFERENCES gis_features(id) ON DELETE CASCADE
);

-- Create indexes for history table
CREATE INDEX IF NOT EXISTS idx_gis_features_history_feature 
  ON gis_features_history (feature_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_history_created 
  ON gis_features_history (created_at);
CREATE INDEX IF NOT EXISTS idx_gis_features_history_action 
  ON gis_features_history (action);

-- Create vectorization jobs table
CREATE TABLE IF NOT EXISTS vectorization_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id varchar(255) NOT NULL,
  status varchar(20) DEFAULT 'pending', -- pending/processing/completed/failed
  input_file varchar(500),
  output_path varchar(500),
  suggestions jsonb DEFAULT '[]',
  parameters jsonb DEFAULT '{}',
  created_by varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text
);

-- Create indexes for vectorization jobs
CREATE INDEX IF NOT EXISTS idx_vectorization_jobs_layer 
  ON vectorization_jobs (layer_id);
CREATE INDEX IF NOT EXISTS idx_vectorization_jobs_status 
  ON vectorization_jobs (status);
CREATE INDEX IF NOT EXISTS idx_vectorization_jobs_created 
  ON vectorization_jobs (created_at);

-- Create data exchange jobs table (export/import)
CREATE TABLE IF NOT EXISTS data_exchange_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type varchar(10) NOT NULL, -- export/import
  layer_id varchar(255) NOT NULL,
  format varchar(20) NOT NULL, -- geojson/gpkg/shp/kml/gml
  status varchar(20) DEFAULT 'pending',
  input_path varchar(500),
  output_path varchar(500),
  parameters jsonb DEFAULT '{}',
  created_by varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text
);

-- Create indexes for data exchange jobs
CREATE INDEX IF NOT EXISTS idx_data_exchange_jobs_layer 
  ON data_exchange_jobs (layer_id);
CREATE INDEX IF NOT EXISTS idx_data_exchange_jobs_type 
  ON data_exchange_jobs (type);
CREATE INDEX IF NOT EXISTS idx_data_exchange_jobs_status 
  ON data_exchange_jobs (status);
CREATE INDEX IF NOT EXISTS idx_data_exchange_jobs_created 
  ON data_exchange_jobs (created_at);

-- Add constraints
ALTER TABLE gis_features 
  ADD CONSTRAINT chk_feature_type 
  CHECK (feature_type IN ('point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon'));

ALTER TABLE gis_features_history 
  ADD CONSTRAINT chk_history_action 
  CHECK (action IN ('create', 'update', 'delete'));

ALTER TABLE vectorization_jobs 
  ADD CONSTRAINT chk_vectorization_status 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

ALTER TABLE data_exchange_jobs 
  ADD CONSTRAINT chk_exchange_type 
  CHECK (type IN ('export', 'import'));

ALTER TABLE data_exchange_jobs 
  ADD CONSTRAINT chk_exchange_format 
  CHECK (format IN ('geojson', 'gpkg', 'shp', 'kml', 'gml'));

ALTER TABLE data_exchange_jobs 
  ADD CONSTRAINT chk_exchange_status 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Add comments
COMMENT ON TABLE gis_features IS 'Digitized geographic features with PostGIS geometry';
COMMENT ON COLUMN gis_features.geometry IS 'PostGIS geometry in WGS84 (EPSG:4326)';
COMMENT ON COLUMN gis_features.properties IS 'Feature attributes as JSON';

COMMENT ON TABLE gis_features_history IS 'History log for feature changes (undo/redo support)';
COMMENT ON TABLE vectorization_jobs IS 'Automatic vectorization jobs for raster to vector conversion';
COMMENT ON TABLE data_exchange_jobs IS 'Import/Export jobs for various GIS formats';

-- Insert sample data for testing (optional)
-- INSERT INTO gis_features (layer_id, geometry, properties, feature_type, created_by) VALUES 
-- ('test_layer', ST_GeomFromText('POINT(44.2 15.3)', 4326), '{"name": "Test Point", "type": "landmark"}', 'point', 'system');

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gis_features TO gis_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gis_features_history TO gis_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON vectorization_jobs TO gis_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_exchange_jobs TO gis_user;