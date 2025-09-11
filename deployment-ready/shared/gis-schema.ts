import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
  text,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// GIS Features table - stores digitized features
export const gisFeatures = pgTable(
  "gis_features",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    layerId: varchar("layer_id", { length: 255 }).notNull(),
    geometry: text("geometry").notNull(), // PostGIS geometry as WKT
    properties: jsonb("properties").default({}),
    featureType: varchar("feature_type", { length: 50 }).notNull(),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_gis_features_layer").on(table.layerId),
    // Note: GIST index for geometry will be created in migration SQL
  ]
);

// Features history table for undo/redo functionality
export const gisFeatureHistory = pgTable(
  "gis_features_history",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    featureId: uuid("feature_id").notNull().references(() => gisFeatures.id, { onDelete: 'cascade' }),
    action: varchar("action", { length: 20 }).notNull(), // create/update/delete
    geometry: text("geometry"),
    properties: jsonb("properties").default({}),
    userId: varchar("user_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_gis_features_history_feature").on(table.featureId),
    index("idx_gis_features_history_created").on(table.createdAt),
  ]
);

// Vectorization jobs table
export const vectorizationJobs = pgTable(
  "vectorization_jobs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    layerId: varchar("layer_id", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).default("pending"), // pending/processing/completed/failed
    inputFile: varchar("input_file", { length: 500 }),
    outputPath: varchar("output_path", { length: 500 }),
    suggestions: jsonb("suggestions").default([]),
    parameters: jsonb("parameters").default({}),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("idx_vectorization_jobs_layer").on(table.layerId),
    index("idx_vectorization_jobs_status").on(table.status),
  ]
);

// Export/Import jobs table
export const dataExchangeJobs = pgTable(
  "data_exchange_jobs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    type: varchar("type", { length: 10 }).notNull(), // export/import
    layerId: varchar("layer_id", { length: 255 }).notNull(),
    format: varchar("format", { length: 20 }).notNull(), // geojson/gpkg/shp
    status: varchar("status", { length: 20 }).default("pending"),
    inputPath: varchar("input_path", { length: 500 }),
    outputPath: varchar("output_path", { length: 500 }),
    parameters: jsonb("parameters").default({}),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("idx_data_exchange_jobs_layer").on(table.layerId),
    index("idx_data_exchange_jobs_type").on(table.type),
  ]
);

// Zod schemas for validation
export const gisFeatureInsertSchema = createInsertSchema(gisFeatures, {
  geometry: z.string().min(1, "Geometry is required"),
  featureType: z.enum(["point", "linestring", "polygon", "multipoint", "multilinestring", "multipolygon"]),
  properties: z.record(z.any()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const gisFeatureUpdateSchema = gisFeatureInsertSchema.partial();

export const vectorizationJobInsertSchema = createInsertSchema(vectorizationJobs, {
  parameters: z.record(z.any()).optional(),
}).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const dataExchangeJobInsertSchema = createInsertSchema(dataExchangeJobs, {
  type: z.enum(["export", "import"]),
  format: z.enum(["geojson", "gpkg", "shp", "kml", "gml"]),
  parameters: z.record(z.any()).optional(),
}).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// TypeScript types
export type GisFeature = typeof gisFeatures.$inferSelect;
export type GisFeatureInsert = z.infer<typeof gisFeatureInsertSchema>;
export type GisFeatureUpdate = z.infer<typeof gisFeatureUpdateSchema>;

export type GisFeatureHistory = typeof gisFeatureHistory.$inferSelect;
export type GisFeatureHistoryInsert = typeof gisFeatureHistory.$inferInsert;

export type VectorizationJob = typeof vectorizationJobs.$inferSelect;
export type VectorizationJobInsert = z.infer<typeof vectorizationJobInsertSchema>;

export type DataExchangeJob = typeof dataExchangeJobs.$inferSelect;
export type DataExchangeJobInsert = z.infer<typeof dataExchangeJobInsertSchema>;

// GeoJSON types
export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Drawing tool configuration
export interface DrawingToolOptions {
  enablePoint: boolean;
  enableLine: boolean;
  enablePolygon: boolean;
  enableRectangle: boolean;
  enableCircle: boolean;
  enableModify: boolean;
  enableDelete: boolean;
  enableSnap: boolean;
  snapTolerance: number; // meters
}

// Snapping configuration
export interface SnapOptions {
  tolerance: number; // meters
  snapToVertices: boolean;
  snapToEdges: boolean;
  snapToCenter: boolean;
  highlightSnap: boolean;
}

// Vectorization parameters
export interface VectorizationParams {
  edgeThreshold: [number, number]; // Canny edge detection thresholds
  minAreaPixels: number; // Minimum polygon area in pixels
  simplifyTolerance: number; // Douglas-Peucker simplification tolerance
  bandSelection: number[]; // Which bands to use for processing
  contourLevels?: number[]; // For elevation contours
}

// Export parameters
export interface ExportParams {
  format: "geojson" | "gpkg" | "shp" | "kml" | "gml";
  coordinateSystem: string; // EPSG code
  includeProperties: boolean;
  featureFilter?: {
    featureType?: string[];
    dateRange?: [string, string];
    spatialFilter?: GeoJSONFeature;
  };
}