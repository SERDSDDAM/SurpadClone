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
  Stats,
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
      return result.rowCount > 0;
    } catch (err) {
      console.error('Error in deleteSurveyPoint:', err);
      return false;
    }
  }

  // --- Survey Lines ---
  async getSurveyLines(requestId: string): Promise<SurveyLine[]> {
    // Implementation will be similar to points and polygons
    return [];
  }
  async createSurveyLine(line: InsertSurveyLine): Promise<SurveyLine> {
    // Implementation will be similar to points and polygons
    throw new Error('createSurveyLine not implemented');
  }
  async deleteSurveyLine(id: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM survey_lines WHERE id = $1',
        [id]
      );
      return result.rowCount > 0;
    } catch (err) {
      console.error('Error in deleteSurveyLine:', err);
      return false;
    }
  }

  // --- Survey Polygons ---
  async getSurveyPolygons(requestId: string): Promise<SurveyPolygon[]> {
    // Implementation will be similar to points and polygons
    return [];
  }
  async createSurveyPolygon(
    polygon: InsertSurveyPolygon
  ): Promise<SurveyPolygon> {
    // Implementation will be similar to points and polygons
    throw new Error('createSurveyPolygon not implemented');
  }
  async deleteSurveyPolygon(id: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM survey_polygons WHERE id = $1',
        [id]
      );
      return result.rowCount > 0;
    } catch (err) {
      console.error('Error in deleteSurveyPolygon:', err);
      return false;
    }
  }

  // --- Stats ---
  async getStats(): Promise<Stats> {
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
