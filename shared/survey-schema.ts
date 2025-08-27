import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
  serial
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Survey Requests - الطلبات الأساسية للقرار المساحي
export const surveyRequests = pgTable("survey_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: varchar("request_number", { length: 50 }).unique().notNull(),
  
  // بيانات المالك
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  ownerNationalId: varchar("owner_national_id", { length: 20 }).notNull(),
  ownerPhone: varchar("owner_phone", { length: 20 }),
  ownerEmail: varchar("owner_email", { length: 255 }),
  ownerAddress: text("owner_address"),
  
  // بيانات العقار
  governorate: varchar("governorate", { length: 100 }).notNull(),
  directorate: varchar("directorate", { length: 100 }).notNull(),
  area: varchar("area", { length: 100 }).notNull(),
  plotNumber: varchar("plot_number", { length: 50 }),
  blockNumber: varchar("block_number", { length: 50 }),
  
  // تفاصيل الطلب
  purpose: varchar("purpose", { length: 255 }).notNull(), // الغرض من القرار المساحي
  ownershipType: varchar("ownership_type", { length: 100 }).notNull(), // نوع الملكية
  
  // حالة الطلب
  status: varchar("status", { length: 50 }).default("submitted").notNull(),
  // submitted, under_review, assigned_to_surveyor, field_survey_in_progress, 
  // survey_completed, under_technical_review, approved, rejected, issued
  
  priority: varchar("priority", { length: 20 }).default("normal").notNull(), // normal, high, urgent
  
  // التعيين والمواعيد
  assignedSurveyorId: varchar("assigned_surveyor_id", { length: 255 }),
  surveyAppointment: timestamp("survey_appointment"),
  
  // البيانات المكانية الأولية (للموقع التقريبي)
  approximateLatitude: decimal("approximate_latitude", { precision: 10, scale: 8 }),
  approximateLongitude: decimal("approximate_longitude", { precision: 11, scale: 8 }),
  
  // المستندات
  documents: jsonb("documents").$type<{
    ownershipDocument?: string;
    nationalIdCopy?: string;
    additionalDocuments?: string[];
  }>(),
  
  // التوقيتات
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  issuedAt: timestamp("issued_at"),
  
  // الملاحظات والتعليقات
  notes: text("notes"),
  internalNotes: text("internal_notes"), // ملاحظات داخلية للموظفين
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("survey_requests_status_idx").on(table.status),
  index("survey_requests_surveyor_idx").on(table.assignedSurveyorId),
  index("survey_requests_created_idx").on(table.createdAt),
]);

// Survey Points - النقاط المساحية المرفوعة
export const surveyPoints = pgTable("survey_points", {
  id: serial("id").primaryKey(),
  surveyRequestId: varchar("survey_request_id").references(() => surveyRequests.id).notNull(),
  
  // الإحداثيات الدقيقة من GNSS
  latitude: decimal("latitude", { precision: 12, scale: 10 }).notNull(),
  longitude: decimal("longitude", { precision: 13, scale: 10 }).notNull(),
  elevation: decimal("elevation", { precision: 8, scale: 3 }), // الارتفاع
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // دقة القياس بالأمتار
  
  // التكويد الذكي
  featureType: varchar("feature_type", { length: 50 }).notNull(), // point, line_point, polygon_point
  featureCode: varchar("feature_code", { length: 100 }).notNull(), // كود المعلم
  featureDescription: varchar("feature_description", { length: 255 }), // وصف المعلم
  
  // ترقيم النقاط
  pointNumber: varchar("point_number", { length: 20 }).notNull(),
  sequenceOrder: integer("sequence_order"), // ترتيب النقطة في الخط أو المضلع
  
  // معلومات الرفع
  surveyorId: varchar("surveyor_id", { length: 255 }).notNull(),
  surveyedAt: timestamp("surveyed_at").defaultNow().notNull(),
  
  // البيانات الإضافية
  notes: text("notes"),
  photos: jsonb("photos").$type<string[]>(), // مسارات الصور المرتبطة
  
  // معلومات الجهاز
  deviceInfo: jsonb("device_info").$type<{
    deviceModel?: string;
    gnssModel?: string;
    satelliteCount?: number;
    pdop?: number; // Position Dilution of Precision
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("survey_points_request_idx").on(table.surveyRequestId),
  index("survey_points_feature_idx").on(table.featureType, table.featureCode),
  index("survey_points_surveyor_idx").on(table.surveyorId),
]);

// Survey Features - المعالم المساحية (خطوط ومضلعات)
export const surveyFeatures = pgTable("survey_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyRequestId: varchar("survey_request_id").references(() => surveyRequests.id).notNull(),
  
  // نوع المعلم
  featureType: varchar("feature_type", { length: 50 }).notNull(), // line, polygon
  featureCode: varchar("feature_code", { length: 100 }).notNull(),
  featureDescription: varchar("feature_description", { length: 255 }),
  
  // النقاط المكونة للمعلم (مرجعية للنقاط)
  pointIds: jsonb("point_ids").$type<number[]>().notNull(),
  
  // الحسابات التلقائية
  length: decimal("length", { precision: 10, scale: 3 }), // للخطوط - الطول بالأمتار
  area: decimal("area", { precision: 12, scale: 3 }), // للمضلعات - المساحة بالمتر المربع
  perimeter: decimal("perimeter", { precision: 10, scale: 3 }), // للمضلعات - المحيط
  
  // حالة المعلم
  isCompleted: boolean("is_completed").default(false).notNull(),
  
  // معلومات الرفع
  surveyorId: varchar("surveyor_id", { length: 255 }).notNull(),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("survey_features_request_idx").on(table.surveyRequestId),
  index("survey_features_type_idx").on(table.featureType),
]);

// Survey Review - مراجعة البيانات المساحية
export const surveyReviews = pgTable("survey_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyRequestId: varchar("survey_request_id").references(() => surveyRequests.id).notNull(),
  
  // المراجع
  reviewerId: varchar("reviewer_id", { length: 255 }).notNull(),
  reviewerRole: varchar("reviewer_role", { length: 50 }).notNull(), // technical_reviewer, manager, director
  
  // نتيجة المراجعة
  reviewStatus: varchar("review_status", { length: 50 }).notNull(), // approved, rejected, requires_modification
  reviewComments: text("review_comments"),
  
  // التفاصيل الفنية
  technicalNotes: text("technical_notes"),
  qualityAssessment: jsonb("quality_assessment").$type<{
    accuracyGrade?: string; // A, B, C
    completeness?: number; // نسبة مئوية
    dataQuality?: string;
    recommendations?: string[];
  }>(),
  
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
}, (table) => [
  index("survey_reviews_request_idx").on(table.surveyRequestId),
  index("survey_reviews_status_idx").on(table.reviewStatus),
]);

// Survey Decisions - القرارات المساحية النهائية
export const surveyDecisions = pgTable("survey_decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyRequestId: varchar("survey_request_id").references(() => surveyRequests.id).notNull(),
  
  // رقم القرار الرسمي
  decisionNumber: varchar("decision_number", { length: 50 }).unique().notNull(),
  
  // البيانات النهائية المحسوبة
  totalArea: decimal("total_area", { precision: 12, scale: 3 }).notNull(),
  boundaryLength: decimal("boundary_length", { precision: 10, scale: 3 }),
  
  // الحدود والاتجاهات
  boundaries: jsonb("boundaries").$type<{
    north?: string;
    south?: string;
    east?: string;
    west?: string;
  }>(),
  
  // الإحداثيات النهائية
  coordinates: jsonb("coordinates").$type<{
    corners: Array<{
      point: string;
      latitude: number;
      longitude: number;
      description: string;
    }>;
    centroid?: {
      latitude: number;
      longitude: number;
    };
  }>().notNull(),
  
  // معلومات الإصدار
  issuedBy: varchar("issued_by", { length: 255 }).notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  validUntil: timestamp("valid_until"), // صالح حتى
  
  // ملف القرار المولد
  pdfPath: varchar("pdf_path", { length: 500 }),
  qrCode: varchar("qr_code", { length: 255 }), // للتحقق من صحة الوثيقة
  
  // الشروط والملاحظات
  conditions: text("conditions"), // الشروط والاشتراطات
  legalNotes: text("legal_notes"), // الملاحظات القانونية
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("survey_decisions_number_idx").on(table.decisionNumber),
  index("survey_decisions_request_idx").on(table.surveyRequestId),
]);

// Feature Codes Library - مكتبة أكواد المعالم
export const featureCodes = pgTable("feature_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  category: varchar("category", { length: 100 }).notNull(), // point, line, polygon
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("feature_codes_category_idx").on(table.category),
]);

// Zod Schemas
export const insertSurveyRequestSchema = createInsertSchema(surveyRequests).extend({
  ownerName: z.string().min(1, "اسم المالك مطلوب"),
  ownerNationalId: z.string().min(1, "رقم الهوية مطلوب"),
  governorate: z.string().min(1, "المحافظة مطلوبة"),
  directorate: z.string().min(1, "المديرية مطلوبة"),
  area: z.string().min(1, "المنطقة مطلوبة"),
  purpose: z.string().min(1, "الغرض من القرار مطلوب"),
  ownershipType: z.string().min(1, "نوع الملكية مطلوب"),
});

export const insertSurveyPointSchema = createInsertSchema(surveyPoints).extend({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  featureCode: z.string().min(1, "كود المعلم مطلوب"),
  pointNumber: z.string().min(1, "رقم النقطة مطلوب"),
});

export const insertSurveyFeatureSchema = createInsertSchema(surveyFeatures).extend({
  featureType: z.enum(["line", "polygon"]),
  featureCode: z.string().min(1, "كود المعلم مطلوب"),
  pointIds: z.array(z.number()).min(2, "المعلم يحتاج على الأقل نقطتين"),
});

// Types
export type SurveyRequest = typeof surveyRequests.$inferSelect;
export type InsertSurveyRequest = z.infer<typeof insertSurveyRequestSchema>;
export type SurveyPoint = typeof surveyPoints.$inferSelect;
export type InsertSurveyPoint = z.infer<typeof insertSurveyPointSchema>;
export type SurveyFeature = typeof surveyFeatures.$inferSelect;
export type InsertSurveyFeature = z.infer<typeof insertSurveyFeatureSchema>;
export type SurveyReview = typeof surveyReviews.$inferSelect;
export type SurveyDecision = typeof surveyDecisions.$inferSelect;
export type FeatureCode = typeof featureCodes.$inferSelect;