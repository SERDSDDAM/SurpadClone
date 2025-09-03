/**
 * IStorageService - الواجهة الموحدة لجميع عمليات التخزين
 * تم تنظيم الدوال حسب المجالات لسهولة الصيانة والتطوير
 */

import {
  type SurveyRequest, type InsertSurveyRequest,
  type Surveyor, type InsertSurveyor,
  type SurveyPoint, type InsertSurveyPoint,
  type SurveyLine, type InsertSurveyLine,
  type SurveyPolygon, type InsertSurveyPolygon,
  type SurveySession, type InsertSurveySession,
  type ReviewComment, type InsertReviewComment,
  type Citizen, type InsertCitizen,
  type EngineeringOffice, type InsertEngineeringOffice,
  type Contractor, type InsertContractor,
  type BuildingPermit, type InsertBuildingPermit,
  type OccupancyCertificate, type InsertOccupancyCertificate,
  type ViolationReport, type InsertViolationReport,
  type PaymentTransaction, type InsertPaymentTransaction,
  type InspectionReport, type InsertInspectionReport,
  type User, type InsertUser,
  type UserSession, type InsertUserSession,
  type AuditLog, type InsertAuditLog,
} from "@shared/schema";

export interface IStorageService {
  // ================================
  // Survey Management Domain
  // ================================
  
  // Survey Requests
  getSurveyRequests(): Promise<SurveyRequest[]>;
  getSurveyRequest(id: string): Promise<SurveyRequest | undefined>;
  createSurveyRequest(request: InsertSurveyRequest): Promise<SurveyRequest>;
  updateSurveyRequest(id: string, request: Partial<SurveyRequest>): Promise<SurveyRequest | undefined>;

  // Surveyors
  getSurveyors(): Promise<Surveyor[]>;
  getSurveyor(id: string): Promise<Surveyor | undefined>;
  createSurveyor(surveyor: InsertSurveyor): Promise<Surveyor>;
  updateSurveyor(id: string, surveyor: Partial<Surveyor>): Promise<Surveyor | undefined>;

  // Survey Data (Points, Lines, Polygons)
  getSurveyPoints(requestId: string): Promise<SurveyPoint[]>;
  createSurveyPoint(point: InsertSurveyPoint): Promise<SurveyPoint>;
  deleteSurveyPoint(id: string): Promise<boolean>;

  getSurveyLines(requestId: string): Promise<SurveyLine[]>;
  createSurveyLine(line: InsertSurveyLine): Promise<SurveyLine>;
  deleteSurveyLine(id: string): Promise<boolean>;

  getSurveyPolygons(requestId: string): Promise<SurveyPolygon[]>;
  createSurveyPolygon(polygon: InsertSurveyPolygon): Promise<SurveyPolygon>;
  deleteSurveyPolygon(id: string): Promise<boolean>;

  // Survey Sessions
  getSurveySession(requestId: string): Promise<SurveySession | undefined>;
  createSurveySession(session: InsertSurveySession): Promise<SurveySession>;
  updateSurveySession(id: string, session: Partial<SurveySession>): Promise<SurveySession | undefined>;

  // Review Comments
  getReviewComments(requestId: string): Promise<ReviewComment[]>;
  createReviewComment(comment: InsertReviewComment): Promise<ReviewComment>;

  // ================================
  // Citizen & User Management Domain
  // ================================
  
  // Citizens
  getCitizens(): Promise<Citizen[]>;
  getCitizen(id: string): Promise<Citizen | undefined>;
  getCitizenByNationalId(nationalId: string): Promise<Citizen | undefined>;
  createCitizen(citizen: InsertCitizen): Promise<Citizen>;
  updateCitizen(id: string, citizen: Partial<Citizen>): Promise<Citizen | undefined>;

  // Users & Authentication
  getUser(userId: string): Promise<User | undefined>;
  getUserByNationalId(nationalId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(userId: string, updateData: Partial<User>): Promise<User | undefined>;

  // Session Management
  createUserSession(sessionData: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionId: string): Promise<UserSession | undefined>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  updateSessionAccess(sessionId: string): Promise<void>;
  deactivateUserSession(sessionId: string): Promise<void>;

  // ================================
  // Building & Construction Domain
  // ================================

  // Engineering Offices
  getEngineeringOffices(): Promise<EngineeringOffice[]>;
  getEngineeringOffice(id: string): Promise<EngineeringOffice | undefined>;
  createEngineeringOffice(office: InsertEngineeringOffice): Promise<EngineeringOffice>;
  updateEngineeringOffice(id: string, office: Partial<EngineeringOffice>): Promise<EngineeringOffice | undefined>;

  // Contractors
  getContractors(): Promise<Contractor[]>;
  getContractor(id: string): Promise<Contractor | undefined>;
  createContractor(contractor: InsertContractor): Promise<Contractor>;
  updateContractor(id: string, contractor: Partial<Contractor>): Promise<Contractor | undefined>;

  // Building Permits
  getBuildingPermits(): Promise<BuildingPermit[]>;
  getBuildingPermit(id: string): Promise<BuildingPermit | undefined>;
  getBuildingPermitsByApplicant(applicantId: string): Promise<BuildingPermit[]>;
  createBuildingPermit(permit: InsertBuildingPermit): Promise<BuildingPermit>;
  updateBuildingPermit(id: string, permit: Partial<BuildingPermit>): Promise<BuildingPermit | undefined>;

  // Occupancy Certificates
  getOccupancyCertificates(): Promise<OccupancyCertificate[]>;
  getOccupancyCertificate(id: string): Promise<OccupancyCertificate | undefined>;
  createOccupancyCertificate(certificate: InsertOccupancyCertificate): Promise<OccupancyCertificate>;
  updateOccupancyCertificate(id: string, certificate: Partial<OccupancyCertificate>): Promise<OccupancyCertificate | undefined>;

  // Violation Reports
  getViolationReports(): Promise<ViolationReport[]>;
  getViolationReport(id: string): Promise<ViolationReport | undefined>;
  createViolationReport(report: InsertViolationReport): Promise<ViolationReport>;
  updateViolationReport(id: string, report: Partial<ViolationReport>): Promise<ViolationReport | undefined>;

  // Inspection Reports
  getInspectionReports(): Promise<InspectionReport[]>;
  getInspectionReport(id: string): Promise<InspectionReport | undefined>;
  createInspectionReport(report: InsertInspectionReport): Promise<InspectionReport>;
  updateInspectionReport(id: string, report: Partial<InspectionReport>): Promise<InspectionReport | undefined>;
  assignInspector(reportId: string, inspectorId: string, inspectorName: string): Promise<InspectionReport | undefined>;

  // ================================
  // Payment & Financial Domain
  // ================================
  
  // Payment Transactions
  getPaymentTransactions(): Promise<PaymentTransaction[]>;
  getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined>;
  getPaymentsByReference(referenceType: string, referenceId: string): Promise<PaymentTransaction[]>;
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  updatePaymentTransaction(id: string, transaction: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined>;

  // ================================
  // Audit & Statistics Domain
  // ================================
  
  // Audit Logging
  createAuditLog(logData: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId?: string): Promise<AuditLog[]>;

  // System Statistics
  getStats(): Promise<{
    newRequests: number;
    inProgress: number;
    underReview: number;
    completed: number;
    totalCitizens: number;
    activeBuildingPermits: number;
    pendingPermits: number;
    totalRevenue: number;
  }>;
}