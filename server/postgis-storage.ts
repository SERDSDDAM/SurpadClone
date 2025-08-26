// server/storage/postgis-storage.ts

import { IStorage } from './storage';
import { pool } from './db';
import {
  SurveyRequest,
  InsertSurveyRequest,
  SurveyPoint,
  InsertSurveyPoint,
  SurveyLine,
  InsertSurveyLine,
  SurveyPolygon,
  InsertSurveyPolygon,
  SurveySession,
  InsertSurveySession,
  ReviewComment,
  InsertReviewComment,
} from '@shared/schema';

export class PostgisStorage implements IStorage {
  // --- Survey Requests ---
  async getSurveyRequests(): Promise<SurveyRequest[]> {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM survey_requests ORDER BY created_at DESC'
      );
      return rows;
    } catch (err) {
      console.error('Error in getSurveyRequests:', err);
      return [];
    }
  }

  async getSurveyRequest(id: string): Promise<SurveyRequest | undefined> {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM survey_requests WHERE id = $1',
        [id]
      );
      return rows[0];
    } catch (err) {
      console.error('Error in getSurveyRequest:', err);
      return undefined;
    }
  }

  async createSurveyRequest(
    request: InsertSurveyRequest
  ): Promise<SurveyRequest> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO survey_requests (request_number, owner_name, region, assigned_surveyor, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          request.requestNumber,
          request.ownerName,
          request.region,
          request.assignedSurveyor,
          request.status,
          request.notes,
        ]
      );
      return rows[0];
    } catch (err) {
      console.error('Error in createSurveyRequest:', err);
      throw err; // Re-throw the error to be handled by the caller
    }
  }

  async updateSurveyRequest(
    id: string,
    updates: Partial<SurveyRequest>
  ): Promise<SurveyRequest | undefined> {
    // Implementation for updating a request
    // This can be complex, let's keep it simple for now
    console.log('updateSurveyRequest not fully implemented yet.');
    return this.getSurveyRequest(id);
  }

  // --- Survey Points ---
  async getSurveyPoints(requestId: string): Promise<SurveyPoint[]> {
    try {
      const { rows } = await pool.query(
        `SELECT id, request_id, point_number, feature_code, feature_type,
                ST_X(geometry) as longitude, ST_Y(geometry) as latitude,
                elevation, accuracy, notes, photos, captured_by, captured_at
         FROM survey_points WHERE request_id = $1 ORDER BY captured_at`,
        [requestId]
      );
      return rows;
    } catch (err) {
      console.error('Error in getSurveyPoints:', err);
      return [];
    }
  }

  async createSurveyPoint(point: InsertSurveyPoint): Promise<SurveyPoint> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO survey_points (request_id, point_number, feature_code, feature_type, geometry, elevation, accuracy, notes, captured_by)
         VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10)
         RETURNING id, request_id, point_number, feature_code, feature_type,
                   ST_X(geometry) as longitude, ST_Y(geometry) as latitude,
                   elevation, accuracy, notes, photos, captured_by, captured_at`,
        [
          point.requestId,
          point.pointNumber,
          point.featureCode,
          point.featureType,
          point.longitude,
          point.latitude,
          point.elevation,
          point.accuracy,
          point.notes,
          point.capturedBy,
        ]
      );
      return rows[0];
    } catch (err) {
      console.error('Error in createSurveyPoint:', err);
      throw err;
    }
  }

  async deleteSurveyPoint(id: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM survey_points WHERE id = $1',
        [id]
      );
  return (result.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('Error in deleteSurveyPoint:', err);
      return false;
    }
  }

  // --- Survey Lines ---
  async getSurveyLines(requestId: string): Promise<SurveyLine[]> {
    try {
      const { rows } = await pool.query(
        `SELECT id, request_id, line_number, feature_code,
                ST_AsGeoJSON(geometry) as geojson, length, notes, created_at
         FROM survey_lines WHERE request_id = $1 ORDER BY created_at`,
        [requestId]
      );

      return rows.map((r: any) => ({
        id: r.id,
        requestId: r.request_id,
        lineNumber: r.line_number,
        featureCode: r.feature_code,
        // GeoJSON coordinates for LineString: [ [lon, lat], ... ]
        points: r.geojson ? JSON.parse(r.geojson).coordinates : [],
        length: r.length,
        notes: r.notes,
        // fields required by shared type but not tracked in this implementation
  startPointId: null,
  endPointId: null,
  createdBy: '',
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error('Error in getSurveyLines:', err);
      return [];
    }
  }
  async createSurveyLine(line: InsertSurveyLine): Promise<SurveyLine> {
    try {
      // Build WKT LINESTRING from provided points (array of [lon, lat])
      if (!Array.isArray(line.points) || line.points.length === 0) {
        throw new Error('line.points must be a non-empty array of [lon, lat]');
      }
      const coords = line.points
        .map((p) => `${Number(p[0])} ${Number(p[1])}`)
        .join(', ');
      const wkt = `LINESTRING(${coords})`;

      const { rows } = await pool.query(
        `INSERT INTO survey_lines (request_id, line_number, feature_code, geometry, length, notes)
         VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromText($4), 4326), $5, $6)
         RETURNING id, request_id, line_number, feature_code, ST_AsGeoJSON(geometry) as geojson, length, notes, created_at`,
        [line.requestId, line.lineNumber, line.featureCode, wkt, line.length || null, line.notes || null]
      );

      const r = rows[0];
      return {
        id: r.id,
        requestId: r.request_id,
        lineNumber: r.line_number,
        featureCode: r.feature_code,
        points: r.geojson ? JSON.parse(r.geojson).coordinates : [],
        length: r.length,
        notes: r.notes,
  startPointId: null,
  endPointId: null,
  createdBy: line.createdBy || '',
        createdAt: r.created_at,
      } as any;
    } catch (err) {
      console.error('Error in createSurveyLine:', err);
      throw err;
    }
  }
  async deleteSurveyLine(id: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM survey_lines WHERE id = $1',
        [id]
      );
  return (result.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('Error in deleteSurveyLine:', err);
      return false;
    }
  }

  // --- Survey Polygons ---
  async getSurveyPolygons(requestId: string): Promise<SurveyPolygon[]> {
    try {
      const { rows } = await pool.query(
        `SELECT id, request_id, polygon_number, feature_code,
                ST_AsGeoJSON(geometry) as geojson, area, perimeter, notes, created_at
         FROM survey_polygons WHERE request_id = $1 ORDER BY created_at`,
        [requestId]
      );

      return rows.map((r: any) => ({
        id: r.id,
        requestId: r.request_id,
        polygonNumber: r.polygon_number,
        featureCode: r.feature_code,
        // provide `points` property expected by shared type (use rings coordinates)
        points: r.geojson ? JSON.parse(r.geojson).coordinates : [],
        area: r.area,
        perimeter: r.perimeter,
        notes: r.notes,
  createdBy: '',
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.error('Error in getSurveyPolygons:', err);
      return [];
    }
  }
  async createSurveyPolygon(polygon: InsertSurveyPolygon): Promise<SurveyPolygon> {
    try {
      // Expect polygon.rings to be array of rings, each ring is array of [lon, lat]
      // Accept either polygon.rings or polygon.points (legacy)
      const ringsSource = (polygon as any).rings || (polygon as any).points;
      if (!Array.isArray(ringsSource) || ringsSource.length === 0) {
        throw new Error('polygon.rings/points must be a non-empty array of rings');
      }

      // Build WKT POLYGON string; ensure first ring is closed
      const ringsWkt = ringsSource
        .map((ring: any[]) => {
          const coords = ring.map((p) => `${Number(p[0])} ${Number(p[1])}`);
          if (coords[0] !== coords[coords.length - 1]) coords.push(coords[0]);
          return `(${coords.join(', ')})`;
        })
        .join(', ');

      const wkt = `POLYGON(${ringsWkt})`;

      const { rows } = await pool.query(
        `INSERT INTO survey_polygons (request_id, polygon_number, feature_code, geometry, area, perimeter, notes)
         VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromText($4), 4326), $5, $6, $7)
         RETURNING id, request_id, polygon_number, feature_code, ST_AsGeoJSON(geometry) as geojson, area, perimeter, notes, created_at`,
        [
          polygon.requestId,
          polygon.polygonNumber,
          polygon.featureCode,
          wkt,
          polygon.area || null,
          polygon.perimeter || null,
          polygon.notes || null,
        ]
      );

      const r = rows[0];
      return {
        id: r.id,
        requestId: r.request_id,
        polygonNumber: r.polygon_number,
        featureCode: r.feature_code,
        // shared type expects `points`; provide geojson coordinates
        points: r.geojson ? JSON.parse(r.geojson).coordinates : [],
        area: r.area,
        perimeter: r.perimeter,
        notes: r.notes,
  createdBy: (polygon as any).createdBy || '',
        createdAt: r.created_at,
      } as any;
    } catch (err) {
      console.error('Error in createSurveyPolygon:', err);
      throw err;
    }
  }
  async deleteSurveyPolygon(id: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM survey_polygons WHERE id = $1',
        [id]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('Error in deleteSurveyPolygon:', err);
      return false;
    }
  }

  // --- Survey Sessions (implement minimal required methods) ---
  async getSurveySession(requestId: string) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM survey_sessions WHERE request_id = $1 AND is_active = true LIMIT 1',
        [requestId]
      );
      return rows[0];
    } catch (err) {
      console.error('Error in getSurveySession:', err);
      return undefined;
    }
  }

  async createSurveySession(session: InsertSurveySession) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO survey_sessions (request_id, surveyor_name, start_time, end_time, gps_accuracy, satellite_count, instrument_used, weather_conditions, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          session.requestId,
          session.surveyorName,
          new Date(),
          session.endTime || null,
          session.gpsAccuracy || null,
          session.satelliteCount || null,
          session.instrumentUsed || null,
          session.weatherConditions || null,
          session.isActive !== undefined ? session.isActive : true,
        ]
      );
      return rows[0];
    } catch (err) {
      console.error('Error in createSurveySession:', err);
      throw err;
    }
  }

  async updateSurveySession(id: string, session: Partial<SurveySession>) {
    try {
      // naive update: set provided fields
      const fields: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      for (const key of Object.keys(session)) {
        fields.push(`${key} = $${idx++}`);
        // @ts-ignore
        vals.push((session as any)[key]);
      }
      if (fields.length === 0) return this.getSurveySession(id);
      const q = `UPDATE survey_sessions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      vals.push(id);
      const { rows } = await pool.query(q, vals);
      return rows[0];
    } catch (err) {
      console.error('Error in updateSurveySession:', err);
      return undefined;
    }
  }

  // --- Review Comments (implement minimal required methods) ---
  async getReviewComments(requestId: string) {
    try {
      const { rows } = await pool.query('SELECT * FROM review_comments WHERE request_id = $1 ORDER BY created_at', [requestId]);
      return rows;
    } catch (err) {
      console.error('Error in getReviewComments:', err);
      return [];
    }
  }

  async createReviewComment(comment: InsertReviewComment) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO review_comments (request_id, reviewer_name, comment, comment_type) VALUES ($1,$2,$3,$4) RETURNING *`,
        [comment.requestId, comment.reviewerName, comment.comment, comment.commentType]
      );
      return rows[0];
    } catch (err) {
      console.error('Error in createReviewComment:', err);
      throw err;
    }
  }

  // --- Stats ---
  async getStats(): Promise<{ newRequests: number; inProgress: number; underReview: number; completed: number }> {
    try {
      const { rows } = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'submitted') AS "newRequests",
          COUNT(*) FILTER (WHERE status = 'surveying') AS "inProgress",
          COUNT(*) FILTER (WHERE status = 'under_review') AS "underReview",
          COUNT(*) FILTER (WHERE status = 'completed' OR status = 'approved') AS "completed"
        FROM survey_requests
      `);
      // Convert counts from string to number
      const stats = {
        newRequests: Number(rows[0].newRequests) || 0,
        inProgress: Number(rows[0].inProgress) || 0,
        underReview: Number(rows[0].underReview) || 0,
        completed: Number(rows[0].completed) || 0,
      };
      return stats;
    } catch (err) {
      console.error('Error in getStats:', err);
      return { newRequests: 0, inProgress: 0, underReview: 0, completed: 0 };
    }
  }
}
