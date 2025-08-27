import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Survey Requests - Enhanced for Yemen construction permits
export const surveyRequests = pgTable("survey_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: varchar("request_number").notNull().unique(),
  title: varchar("title").notNull(),
  ownerName: text("owner_name").notNull(),
  region: text("region").notNull(),
  location: text("location").notNull(),
  requestType: varchar("request_type").notNull().default("building_permit"),
  assignedSurveyor: text("assigned_surveyor"),
  assignedSurveyorId: varchar("assigned_surveyor_id"),
  status: text("status").notNull().default("submitted"), // submitted, assigned, in_progress, completed, under_review, approved, rejected
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  estimatedHours: integer("estimated_hours"),
  actualHours: real("actual_hours"),
  completionPercentage: integer("completion_percentage").default(0),
  coordinates: jsonb("coordinates"), // Center point of survey area
  area: real("area"), // Total area in square meters
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  assignedAt: timestamp("assigned_at"),
  completedAt: timestamp("completed_at"),
  reviewedAt: timestamp("reviewed_at"),
  documents: jsonb("documents").default('[]'),
  notes: text("notes"),
});

// Surveyors table - Yemen construction surveyors
export const surveyors = pgTable("surveyors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeNumber: varchar("employee_number").notNull().unique(),
  name: varchar("name").notNull(),
  title: varchar("title").notNull(), // e.g., "Eng", "Technician"
  department: varchar("department").default("Survey Department"),
  specialization: varchar("specialization").default("Land Surveying"),
  experience: integer("experience_years").default(0),
  phone: varchar("phone"),
  email: varchar("email"),
  status: varchar("status").notNull().default("active"), // active, inactive, on_leave
  currentLoad: integer("current_load").default(0), // Number of assigned requests
  maxLoad: integer("max_load").default(5), // Maximum concurrent assignments
  rating: real("rating").default(0), // Performance rating
  totalProjects: integer("total_projects").default(0),
  totalPoints: integer("total_points").default(0),
  activeDays: integer("active_days").default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Citizens - المواطنين
export const citizens = pgTable("citizens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nationalId: varchar("national_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  address: text("address").notNull(),
  district: text("district").notNull(),
  governorate: text("governorate").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender"), // male, female
  status: varchar("status").notNull().default("active"), // active, inactive, suspended
  totalRequests: integer("total_requests").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Engineering Offices - المكاتب الهندسية
export const engineeringOffices = pgTable("engineering_offices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  officeName: text("office_name").notNull(),
  licenseNumber: varchar("license_number").notNull().unique(),
  ownerName: text("owner_name").notNull(),
  ownerNationalId: varchar("owner_national_id").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  address: text("address").notNull(),
  district: text("district").notNull(),
  governorate: text("governorate").notNull(),
  specializations: jsonb("specializations").default('[]'), // architectural, structural, electrical, etc.
  classification: varchar("classification").notNull(), // grade_a, grade_b, grade_c
  status: varchar("status").notNull().default("pending"), // pending, approved, suspended, rejected
  establishedDate: timestamp("established_date"),
  approvedDate: timestamp("approved_date"),
  rating: real("rating").default(0),
  totalProjects: integer("total_projects").default(0),
  activeProjects: integer("active_projects").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contractors - المقاولين
export const contractors = pgTable("contractors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorName: text("contractor_name").notNull(),
  licenseNumber: varchar("license_number").notNull().unique(),
  ownerName: text("owner_name").notNull(),
  ownerNationalId: varchar("owner_national_id").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  address: text("address").notNull(),
  district: text("district").notNull(),
  governorate: text("governorate").notNull(),
  specializations: jsonb("specializations").default('[]'), // residential, commercial, infrastructure
  classification: varchar("classification").notNull(), // grade_1, grade_2, grade_3, grade_4, grade_5
  maxProjectValue: real("max_project_value"), // Maximum allowed project value based on classification
  status: varchar("status").notNull().default("pending"),
  establishedDate: timestamp("established_date"),
  approvedDate: timestamp("approved_date"),
  rating: real("rating").default(0),
  totalProjects: integer("total_projects").default(0),
  activeProjects: integer("active_projects").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Building Permits - رخص البناء
export const buildingPermits = pgTable("building_permits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  permitNumber: varchar("permit_number").notNull().unique(),
  applicantId: varchar("applicant_id").notNull(), // citizen ID
  engineeringOfficeId: varchar("engineering_office_id"),
  contractorId: varchar("contractor_id"),
  projectName: text("project_name").notNull(),
  projectType: varchar("project_type").notNull(), // residential, commercial, industrial, mixed
  buildingType: varchar("building_type").notNull(), // house, villa, apartment_building, office, shop, warehouse
  plotArea: real("plot_area").notNull(), // Plot area in square meters
  buildingArea: real("building_area").notNull(), // Building area in square meters
  totalFloors: integer("total_floors").notNull(),
  basementFloors: integer("basement_floors").default(0),
  estimatedCost: real("estimated_cost"),
  location: text("location").notNull(),
  coordinates: jsonb("coordinates"),
  district: text("district").notNull(),
  governorate: text("governorate").notNull(),
  status: varchar("status").notNull().default("submitted"), // submitted, under_review, approved, rejected, expired
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  submitDate: timestamp("submit_date").defaultNow(),
  reviewDate: timestamp("review_date"),
  approvalDate: timestamp("approval_date"),
  expiryDate: timestamp("expiry_date"),
  issuedBy: text("issued_by"),
  reviewNotes: text("review_notes"),
  documents: jsonb("documents").default('[]'),
  fees: real("fees"),
  paidAmount: real("paid_amount").default(0),
  paymentStatus: varchar("payment_status").default("pending"), // pending, partial, paid, refunded
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Violation Reports - تقارير المخالفات
export const violationReports = pgTable("violation_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: varchar("report_number").notNull().unique(),
  violationType: varchar("violation_type").notNull(), // unauthorized_construction, safety_violation, zoning_violation
  severity: varchar("severity").notNull(), // minor, major, critical
  reportedBy: text("reported_by").notNull(),
  violatorName: text("violator_name"),
  violatorContact: text("violator_contact"),
  location: text("location").notNull(),
  coordinates: jsonb("coordinates"),
  district: text("district").notNull(),
  governorate: text("governorate").notNull(),
  description: text("description").notNull(),
  evidencePhotos: jsonb("evidence_photos").default('[]'),
  inspectorName: text("inspector_name"),
  inspectionDate: timestamp("inspection_date"),
  status: varchar("status").notNull().default("reported"), // reported, investigating, confirmed, resolved, dismissed
  resolution: text("resolution"),
  fineAmount: real("fine_amount"),
  paidAmount: real("paid_amount").default(0),
  paymentStatus: varchar("payment_status").default("pending"),
  reportDate: timestamp("report_date").defaultNow(),
  resolvedDate: timestamp("resolved_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Transactions - معاملات الدفع
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().unique(),
  referenceType: varchar("reference_type").notNull(), // building_permit, occupancy_certificate, survey_request, violation_fine
  referenceId: varchar("reference_id").notNull(), // ID of the related record
  payerName: text("payer_name").notNull(),
  payerContact: text("payer_contact"),
  amount: real("amount").notNull(),
  currency: varchar("currency").default("YER"),
  paymentMethod: varchar("payment_method").notNull(), // cash, bank_transfer, online_payment, check
  paymentGateway: varchar("payment_gateway"), // for online payments
  gatewayTransactionId: varchar("gateway_transaction_id"),
  status: varchar("status").notNull().default("pending"), // pending, completed, failed, cancelled, refunded
  paidAt: timestamp("paid_at"),
  description: text("description"),
  receiptNumber: varchar("receipt_number"),
  processedBy: text("processed_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertSurveyorSchema = createInsertSchema(surveyors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActive: true,
});

export const insertSurveyRequestSchema = createInsertSchema(surveyRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
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

// New schema validations for expanded services
export const insertCitizenSchema = createInsertSchema(citizens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEngineeringOfficeSchema = createInsertSchema(engineeringOffices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractorSchema = createInsertSchema(contractors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBuildingPermitSchema = createInsertSchema(buildingPermits).omit({
  id: true,
  permitNumber: true,
  submitDate: true,
  createdAt: true,
  updatedAt: true,
});



export const insertViolationReportSchema = createInsertSchema(violationReports).omit({
  id: true,
  reportNumber: true,
  reportDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  transactionId: true,
  createdAt: true,
  updatedAt: true,
});

// Original Types
export type Surveyor = typeof surveyors.$inferSelect;
export type InsertSurveyor = z.infer<typeof insertSurveyorSchema>;

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

// New Types for expanded services
export type Citizen = typeof citizens.$inferSelect;
export type InsertCitizen = z.infer<typeof insertCitizenSchema>;

export type EngineeringOffice = typeof engineeringOffices.$inferSelect;
export type InsertEngineeringOffice = z.infer<typeof insertEngineeringOfficeSchema>;

export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = z.infer<typeof insertContractorSchema>;

export type BuildingPermit = typeof buildingPermits.$inferSelect;
export type InsertBuildingPermit = z.infer<typeof insertBuildingPermitSchema>;



export type ViolationReport = typeof violationReports.$inferSelect;
export type InsertViolationReport = z.infer<typeof insertViolationReportSchema>;

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

// Occupancy Certificates Table - Phase 3
export const occupancyCertificates = pgTable("occupancy_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  certificateNumber: varchar("certificate_number").notNull().unique(),
  buildingPermitId: varchar("building_permit_id").references(() => buildingPermits.id),
  applicantName: varchar("applicant_name").notNull(),
  applicantNationalId: varchar("applicant_national_id"),
  projectName: varchar("project_name").notNull(),
  location: varchar("location").notNull(),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
  district: varchar("district").notNull(),
  governorate: varchar("governorate").notNull(),
  buildingType: varchar("building_type").notNull(),
  totalFloors: integer("total_floors").notNull(),
  basementFloors: integer("basement_floors").default(0),
  totalUnits: integer("total_units").notNull(),
  buildingArea: real("building_area").notNull(),
  plotArea: real("plot_area"),
  completionDate: varchar("completion_date"),
  inspectionDate: varchar("inspection_date"),
  inspectorId: varchar("inspector_id"),
  inspectorName: varchar("inspector_name"),
  inspectionNotes: text("inspection_notes"),
  complianceStatus: varchar("compliance_status").notNull(),
  violationsFound: jsonb("violations_found").$type<string[]>(),
  correctiveActions: text("corrective_actions"),
  status: varchar("status").notNull(),
  priority: varchar("priority").notNull().default("normal"),
  issuedDate: timestamp("issued_date"),
  expiryDate: timestamp("expiry_date"),
  issuedBy: varchar("issued_by"),
  sentToUtilities: boolean("sent_to_utilities").default(false),
  utilitiesNotificationDate: timestamp("utilities_notification_date"),
  documents: jsonb("documents").$type<{ name: string; type: string; url?: string }[]>().default([]),
  fees: real("fees").default(0),
  paidAmount: real("paid_amount").default(0),
  paymentStatus: varchar("payment_status").default("unpaid"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOccupancyCertificateSchema = createInsertSchema(occupancyCertificates).omit({
  id: true,
  certificateNumber: true,
  createdAt: true,
  updatedAt: true,
  issuedDate: true,
  expiryDate: true,
  issuedBy: true,
  sentToUtilities: true,
  utilitiesNotificationDate: true,
});

export type InsertOccupancyCertificate = z.infer<typeof insertOccupancyCertificateSchema>;
export type OccupancyCertificate = typeof occupancyCertificates.$inferSelect;

// Inspection Reports Table - Phase 3
export const inspectionReports = pgTable("inspection_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: varchar("report_number").notNull().unique(),
  buildingPermitId: varchar("building_permit_id").references(() => buildingPermits.id),
  occupancyCertificateId: varchar("occupancy_certificate_id").references(() => occupancyCertificates.id),
  inspectionType: varchar("inspection_type").notNull(), // initial, periodic, complaint_based, final
  inspectorId: varchar("inspector_id").notNull(),
  inspectorName: varchar("inspector_name").notNull(),
  inspectionDate: varchar("inspection_date").notNull(),
  location: varchar("location").notNull(),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
  district: varchar("district").notNull(),
  governorate: varchar("governorate").notNull(),
  projectName: varchar("project_name").notNull(),
  ownerName: varchar("owner_name").notNull(),
  contractorName: varchar("contractor_name"),
  engineeringOfficeName: varchar("engineering_office_name"),
  buildingType: varchar("building_type").notNull(),
  totalFloors: integer("total_floors"),
  inspectedFloors: integer("inspected_floors"),
  buildingArea: real("building_area"),
  constructionProgress: integer("construction_progress"), // percentage 0-100
  overallCompliance: varchar("overall_compliance").notNull(), // compliant, minor_violations, major_violations, critical_violations
  structuralSafety: varchar("structural_safety").notNull(), // safe, concerns, unsafe
  fireSafety: varchar("fire_safety").notNull(), // compliant, non_compliant
  electricalSafety: varchar("electrical_safety").notNull(), // safe, unsafe
  plumbingSafety: varchar("plumbing_safety").notNull(), // compliant, non_compliant
  accessibilitySafety: varchar("accessibility_safety").notNull(), // compliant, non_compliant
  violationsFound: jsonb("violations_found").$type<{
    type: string;
    severity: string;
    description: string;
    location: string;
    recommendedAction: string;
  }[]>().default([]),
  correctiveActions: jsonb("corrective_actions").$type<{
    action: string;
    deadline: string;
    responsible: string;
    status: string;
  }[]>().default([]),
  inspectionFindings: text("inspection_findings").notNull(),
  recommendations: text("recommendations"),
  nextInspectionDate: varchar("next_inspection_date"),
  status: varchar("status").notNull(), // draft, submitted, approved, rejected
  priority: varchar("priority").notNull().default("normal"), // urgent, high, normal, low
  attachments: jsonb("attachments").$type<{ name: string; type: string; url?: string }[]>().default([]),
  approvedBy: varchar("approved_by"),
  approvalDate: timestamp("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInspectionReportSchema = createInsertSchema(inspectionReports).omit({
  id: true,
  reportNumber: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvalDate: true,
});

export type InsertInspectionReport = z.infer<typeof insertInspectionReportSchema>;
export type InspectionReport = typeof inspectionReports.$inferSelect;
