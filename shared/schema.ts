import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Survey Requests
export const surveyRequests = pgTable("survey_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: varchar("request_number").notNull().unique(),
  ownerName: text("owner_name").notNull(),
  region: text("region").notNull(),
  assignedSurveyor: text("assigned_surveyor"),
  status: text("status").notNull().default("submitted"), // submitted, under_review, surveying, completed, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  documents: jsonb("documents").default('[]'),
  notes: text("notes"),
});

// Survey Points
export const surveyPoints = pgTable("survey_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  pointNumber: varchar("point_number").notNull(),
  featureCode: text("feature_code").notNull(),
  featureType: text("feature_type").notNull(), // point, line, polygon
  longitude: real("longitude").notNull(),
  latitude: real("latitude").notNull(),
  elevation: real("elevation"),
  accuracy: real("accuracy").default(0.02), // in meters
  capturedAt: timestamp("captured_at").defaultNow(),
  capturedBy: text("captured_by").notNull(),
  notes: text("notes"),
  photos: jsonb("photos").default('[]'),
});

// Survey Lines
export const surveyLines = pgTable("survey_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  lineNumber: varchar("line_number").notNull(),
  featureCode: text("feature_code").notNull(),
  startPointId: varchar("start_point_id"),
  endPointId: varchar("end_point_id"),
  points: jsonb("points").notNull(), // array of point coordinates
  length: real("length"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by").notNull(),
  notes: text("notes"),
});

// Survey Polygons
export const surveyPolygons = pgTable("survey_polygons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  polygonNumber: varchar("polygon_number").notNull(),
  featureCode: text("feature_code").notNull(),
  points: jsonb("points").notNull(), // array of point coordinates
  area: real("area"),
  perimeter: real("perimeter"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by").notNull(),
  notes: text("notes"),
});

// Survey Sessions
export const surveySessions = pgTable("survey_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  surveyorName: text("surveyor_name").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  gpsAccuracy: real("gps_accuracy"),
  satelliteCount: integer("satellite_count"),
  instrumentUsed: text("instrument_used"),
  weatherConditions: text("weather_conditions"),
  isActive: boolean("is_active").default(true),
});

// Review Comments
export const reviewComments = pgTable("review_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  comment: text("comment").notNull(),
  commentType: text("comment_type").notNull(), // approval, revision_request, rejection
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertSurveyRequestSchema = createInsertSchema(surveyRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSurveyPointSchema = createInsertSchema(surveyPoints).omit({
  id: true,
  capturedAt: true,
});

export const insertSurveyLineSchema = createInsertSchema(surveyLines).omit({
  id: true,
  createdAt: true,
});

export const insertSurveyPolygonSchema = createInsertSchema(surveyPolygons).omit({
  id: true,
  createdAt: true,
});

export const insertSurveySessionSchema = createInsertSchema(surveySessions).omit({
  id: true,
  startTime: true,
});

export const insertReviewCommentSchema = createInsertSchema(reviewComments).omit({
  id: true,
  createdAt: true,
});

// Types
export type SurveyRequest = typeof surveyRequests.$inferSelect;
export type InsertSurveyRequest = z.infer<typeof insertSurveyRequestSchema>;

export type SurveyPoint = typeof surveyPoints.$inferSelect;
export type InsertSurveyPoint = z.infer<typeof insertSurveyPointSchema>;

export type SurveyLine = typeof surveyLines.$inferSelect;
export type InsertSurveyLine = z.infer<typeof insertSurveyLineSchema>;

export type SurveyPolygon = typeof surveyPolygons.$inferSelect;
export type InsertSurveyPolygon = z.infer<typeof insertSurveyPolygonSchema>;

export type SurveySession = typeof surveySessions.$inferSelect;
export type InsertSurveySession = z.infer<typeof insertSurveySessionSchema>;

export type ReviewComment = typeof reviewComments.$inferSelect;
export type InsertReviewComment = z.infer<typeof insertReviewCommentSchema>;
