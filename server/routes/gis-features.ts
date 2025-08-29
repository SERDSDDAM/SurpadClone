import type { Express } from "express";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { 
  gisFeatures, 
  gisFeatureHistory,
  gisFeatureInsertSchema, 
  gisFeatureUpdateSchema,
  type GisFeature,
  type GeoJSONFeature 
} from "@shared/gis-schema";

// Helper function to convert GeoJSON to PostGIS WKT
function geoJsonToWKT(geoJson: any): string {
  // This is a simplified conversion - in production use a proper library like wellknown
  if (geoJson.type === 'Point') {
    const [lon, lat] = geoJson.coordinates;
    return `POINT(${lon} ${lat})`;
  } else if (geoJson.type === 'LineString') {
    const coords = geoJson.coordinates.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ');
    return `LINESTRING(${coords})`;
  } else if (geoJson.type === 'Polygon') {
    const rings = geoJson.coordinates.map((ring: number[][]) => 
      ring.map((c: number[]) => `${c[0]} ${c[1]}`).join(', ')
    );
    return `POLYGON((${rings.join('), (')}))`;
  }
  
  // Fallback to JSON string for complex geometries
  return JSON.stringify(geoJson);
}

// Helper function to convert WKT to GeoJSON (simplified)
function wktToGeoJSON(wkt: string): any {
  try {
    // This is simplified - in production use a proper WKT parser
    if (wkt.startsWith('POINT(')) {
      const coords = wkt.match(/POINT\(([^)]+)\)/)?.[1].split(' ').map(Number);
      if (coords && coords.length === 2) {
        return { type: 'Point', coordinates: coords };
      }
    } else if (wkt.startsWith('LINESTRING(')) {
      const coordsStr = wkt.match(/LINESTRING\(([^)]+)\)/)?.[1];
      if (coordsStr) {
        const coordinates = coordsStr.split(', ').map(pair => pair.split(' ').map(Number));
        return { type: 'LineString', coordinates };
      }
    } else if (wkt.startsWith('POLYGON((')) {
      const coordsStr = wkt.match(/POLYGON\(\(([^)]+)\)\)/)?.[1];
      if (coordsStr) {
        const coordinates = [coordsStr.split(', ').map(pair => pair.split(' ').map(Number))];
        return { type: 'Polygon', coordinates };
      }
    }
    
    // If parsing fails, try to parse as JSON (fallback)
    return JSON.parse(wkt);
  } catch (error) {
    console.warn('Failed to parse geometry:', error);
    return null;
  }
}

// Helper function to save feature history
async function saveFeatureHistory(
  featureId: string, 
  action: 'create' | 'update' | 'delete',
  geometry?: string,
  properties?: any,
  userId?: string
) {
  try {
    await db.insert(gisFeatureHistory).values({
      featureId,
      action,
      geometry,
      properties: properties || {},
      userId: userId || 'system',
    });
  } catch (error) {
    console.warn('Failed to save feature history:', error);
  }
}

export function registerGISFeatureRoutes(app: Express) {
  
  // GET /api/gis/features - Get features for a layer
  app.get("/api/gis/features", async (req, res) => {
    try {
      const { layerId, featureType } = req.query;
      
      if (!layerId) {
        return res.status(400).json({ error: "layerId parameter is required" });
      }

      let whereConditions = [eq(gisFeatures.layerId, layerId as string)];
      
      if (featureType) {
        whereConditions.push(eq(gisFeatures.featureType, featureType as string));
      }

      const query = db.select().from(gisFeatures).where(and(...whereConditions));

      const features = await query.orderBy(desc(gisFeatures.createdAt));
      
      // Convert to GeoJSON features
      const geoJsonFeatures = features.map(feature => ({
        type: "Feature" as const,
        id: feature.id,
        geometry: wktToGeoJSON(feature.geometry),
        properties: {
          ...(feature.properties as Record<string, any>),
          featureType: feature.featureType,
          createdBy: feature.createdBy,
          createdAt: feature.createdAt,
          updatedAt: feature.updatedAt,
        }
      }));

      res.json({
        type: "FeatureCollection",
        features: geoJsonFeatures.filter(f => f.geometry !== null), // Filter out failed conversions
      });
    } catch (error) {
      console.error("Error fetching features:", error);
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  // POST /api/gis/features - Create a new feature
  app.post("/api/gis/features", async (req, res) => {
    try {
      const parseResult = gisFeatureInsertSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid feature data",
          details: parseResult.error.errors 
        });
      }

      const { layerId, geometry, properties, featureType, createdBy } = parseResult.data;

      // Convert GeoJSON geometry to WKT if it's an object
      let wktGeometry: string;
      if (typeof geometry === 'object') {
        wktGeometry = geoJsonToWKT(geometry);
      } else {
        wktGeometry = geometry; // Assume it's already WKT
      }

      const [newFeature] = await db.insert(gisFeatures).values({
        layerId,
        geometry: wktGeometry,
        properties: properties || {},
        featureType,
        createdBy: createdBy || 'anonymous',
      }).returning();

      // Save to history
      await saveFeatureHistory(
        newFeature.id, 
        'create', 
        wktGeometry, 
        properties,
        createdBy || 'anonymous'
      );

      // Return as GeoJSON
      const geoJsonFeature = {
        type: "Feature" as const,
        id: newFeature.id,
        geometry: wktToGeoJSON(newFeature.geometry),
        properties: {
          ...(newFeature.properties as Record<string, any>),
          featureType: newFeature.featureType,
          createdBy: newFeature.createdBy,
          createdAt: newFeature.createdAt,
          updatedAt: newFeature.updatedAt,
        }
      };

      res.status(201).json(geoJsonFeature);
    } catch (error) {
      console.error("Error creating feature:", error);
      res.status(500).json({ error: "Failed to create feature" });
    }
  });

  // PATCH /api/gis/features/:id - Update a feature
  app.patch("/api/gis/features/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const parseResult = gisFeatureUpdateSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid feature data",
          details: parseResult.error.errors 
        });
      }

      const updateData = parseResult.data;

      // Convert GeoJSON geometry to WKT if provided
      if (updateData.geometry && typeof updateData.geometry === 'object') {
        updateData.geometry = geoJsonToWKT(updateData.geometry);
      }

      // Get existing feature for history
      const [existingFeature] = await db.select().from(gisFeatures).where(eq(gisFeatures.id, id));
      
      if (!existingFeature) {
        return res.status(404).json({ error: "Feature not found" });
      }

      const [updatedFeature] = await db.update(gisFeatures)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(gisFeatures.id, id))
        .returning();

      // Save to history
      await saveFeatureHistory(
        id, 
        'update', 
        updateData.geometry || existingFeature.geometry,
        updateData.properties || existingFeature.properties,
        (updateData.createdBy || existingFeature.createdBy) ?? 'anonymous'
      );

      // Return as GeoJSON
      const geoJsonFeature = {
        type: "Feature" as const,
        id: updatedFeature.id,
        geometry: wktToGeoJSON(updatedFeature.geometry),
        properties: {
          ...(updatedFeature.properties as Record<string, any>),
          featureType: updatedFeature.featureType,
          createdBy: updatedFeature.createdBy,
          createdAt: updatedFeature.createdAt,
          updatedAt: updatedFeature.updatedAt,
        }
      };

      res.json(geoJsonFeature);
    } catch (error) {
      console.error("Error updating feature:", error);
      res.status(500).json({ error: "Failed to update feature" });
    }
  });

  // DELETE /api/gis/features/:id - Delete a feature
  app.delete("/api/gis/features/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get existing feature for history
      const [existingFeature] = await db.select().from(gisFeatures).where(eq(gisFeatures.id, id));
      
      if (!existingFeature) {
        return res.status(404).json({ error: "Feature not found" });
      }

      // Save to history before deleting
      await saveFeatureHistory(
        id, 
        'delete', 
        existingFeature.geometry,
        existingFeature.properties,
        existingFeature.createdBy ?? 'anonymous'
      );

      await db.delete(gisFeatures).where(eq(gisFeatures.id, id));

      res.json({ message: "Feature deleted successfully", id });
    } catch (error) {
      console.error("Error deleting feature:", error);
      res.status(500).json({ error: "Failed to delete feature" });
    }
  });

  // GET /api/gis/features/:id/history - Get feature history
  app.get("/api/gis/features/:id/history", async (req, res) => {
    try {
      const { id } = req.params;
      
      const history = await db.select()
        .from(gisFeatureHistory)
        .where(eq(gisFeatureHistory.featureId, id))
        .orderBy(desc(gisFeatureHistory.createdAt));

      const historyWithGeoJSON = history.map(record => ({
        ...record,
        geometry: record.geometry ? wktToGeoJSON(record.geometry) : null,
      }));

      res.json(historyWithGeoJSON);
    } catch (error) {
      console.error("Error fetching feature history:", error);
      res.status(500).json({ error: "Failed to fetch feature history" });
    }
  });

  // POST /api/gis/features/:id/rollback - Rollback to previous version
  app.post("/api/gis/features/:id/rollback", async (req, res) => {
    try {
      const { id } = req.params;
      const { historyId } = req.body;
      
      if (!historyId) {
        return res.status(400).json({ error: "historyId is required" });
      }

      // Get the history record
      const [historyRecord] = await db.select()
        .from(gisFeatureHistory)
        .where(eq(gisFeatureHistory.id, historyId));

      if (!historyRecord || historyRecord.featureId !== id) {
        return res.status(404).json({ error: "History record not found" });
      }

      // Update the feature with historical data
      const [rolledBackFeature] = await db.update(gisFeatures)
        .set({
          geometry: historyRecord.geometry!,
          properties: historyRecord.properties || {},
          updatedAt: new Date(),
        })
        .where(eq(gisFeatures.id, id))
        .returning();

      // Save rollback action to history
      await saveFeatureHistory(
        id, 
        'update', 
        historyRecord.geometry || '',
        historyRecord.properties,
        historyRecord.userId ?? 'system'
      );

      // Return as GeoJSON
      const geoJsonFeature = {
        type: "Feature" as const,
        id: rolledBackFeature.id,
        geometry: wktToGeoJSON(rolledBackFeature.geometry),
        properties: {
          ...(rolledBackFeature.properties as Record<string, any>),
          featureType: rolledBackFeature.featureType,
          createdBy: rolledBackFeature.createdBy,
          createdAt: rolledBackFeature.createdAt,
          updatedAt: rolledBackFeature.updatedAt,
        }
      };

      res.json(geoJsonFeature);
    } catch (error) {
      console.error("Error rolling back feature:", error);
      res.status(500).json({ error: "Failed to rollback feature" });
    }
  });

  // GET /api/gis/features/stats - Get feature statistics
  app.get("/api/gis/features/stats", async (req, res) => {
    try {
      const { layerId } = req.query;
      
      let whereClause = layerId ? eq(gisFeatures.layerId, layerId as string) : undefined;
      
      // Get total count and count by type
      const countQuery = db.select({
        featureType: gisFeatures.featureType,
      }).from(gisFeatures);
      
      if (whereClause) {
        countQuery.where(whereClause);
      }
      
      const features = await countQuery.groupBy(gisFeatures.featureType);

      const totalCount = features.length; // Simple count of feature types
      
      res.json({
        totalFeatures: totalCount,
        featuresByType: features.reduce((acc, f) => {
          acc[f.featureType] = 1; // Simplified count
          return acc;
        }, {} as Record<string, number>)
      });
    } catch (error) {
      console.error("Error fetching feature stats:", error);
      res.status(500).json({ error: "Failed to fetch feature statistics" });
    }
  });
}