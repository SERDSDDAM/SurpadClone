-- schema-gis.sql
-- مقتطفات SQL مستخرجة من مستندات المشروع (مرجع: attached_assets)
-- تشتمل على جداول مشاريع/طلبات ومسارات البيانات المكانية بالإضافة لفهرس GIST

-- Projects table (permissions/project registry)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simple survey requests table (permits)
CREATE TABLE IF NOT EXISTS permits_survey_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(128) NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  region TEXT NOT NULL,
  assigned_surveyor TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Survey points table (example simple schema)
CREATE TABLE IF NOT EXISTS survey_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES permits_survey_requests(id),
  point_number VARCHAR(64) NOT NULL,
  feature_code VARCHAR(64),
  feature_type VARCHAR(32),
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  elevation DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  captured_by TEXT
);

-- GIS: generic survey data table (as in docs)
CREATE TABLE IF NOT EXISTS gis_survey_data (
  id SERIAL PRIMARY KEY,
  request_id UUID REFERENCES permits_survey_requests(id),
  geometry GEOMETRY(Geometry,4326),
  feature_code VARCHAR(50),
  attributes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for performance
CREATE INDEX IF NOT EXISTS idx_gis_survey_data_geom ON gis_survey_data USING GIST (geometry);

-- Example: surveyed points table with explicit geometry column
CREATE TABLE IF NOT EXISTS gis_surveyed_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES permits_survey_requests(id),
  point_geometry GEOMETRY(Point,4326),
  feature_code VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accuracy_h DOUBLE PRECISION,
  accuracy_v DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_gis_surveyed_points_geom ON gis_surveyed_points USING GIST (point_geometry);

-- Example: feature geometry (polygons/lines)
CREATE TABLE IF NOT EXISTS gis_feature_geometry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_request_id UUID REFERENCES permits_survey_requests(id),
  geometry GEOMETRY(Geometry,4326),
  area_sqm DOUBLE PRECISION,
  perimeter_m DOUBLE PRECISION,
  attributes JSONB
);
CREATE INDEX IF NOT EXISTS idx_gis_feature_geometry_geom ON gis_feature_geometry USING GIST (geometry);

-- End of SQL snippet
