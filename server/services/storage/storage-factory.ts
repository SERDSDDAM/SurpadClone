/**
 * Storage Factory - الوحدة الموحدة للتخزين
 * يجمع جميع الوحدات المتخصصة خلف واجهة موحدة
 */

import { IStorageService } from "./IStorageService";
import { SurveyStorageService } from "./survey-storage";
import { CitizenStorageService } from "./citizen-storage";
import { BuildingStorageService } from "./building-storage";
import { PaymentAuditStorageService } from "./payment-audit-storage";
import { StreetSurveyStorage } from "./street-survey-storage";

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

/**
 * UnifiedStorageService - الخدمة الموحدة للتخزين
 * تجمع جميع الوحدات المتخصصة خلف واجهة واحدة
 */
export class UnifiedStorageService implements IStorageService {
  private surveyStorage: SurveyStorageService;
  private citizenStorage: CitizenStorageService;
  private buildingStorage: BuildingStorageService;
  private paymentAuditStorage: PaymentAuditStorageService;
  private streetSurveyStorage: StreetSurveyStorage;

  constructor() {
    this.surveyStorage = new SurveyStorageService();
    this.citizenStorage = new CitizenStorageService();
    this.buildingStorage = new BuildingStorageService();
    this.paymentAuditStorage = new PaymentAuditStorageService();
    this.streetSurveyStorage = new StreetSurveyStorage();
  }

  // ================================
  // Survey Management Domain - تفويض للـ SurveyStorage
  // ================================
  
  // Survey Requests
  async getSurveyRequests(): Promise<SurveyRequest[]> {
    return this.surveyStorage.getSurveyRequests();
  }

  async getSurveyRequest(id: string): Promise<SurveyRequest | undefined> {
    return this.surveyStorage.getSurveyRequest(id);
  }

  async createSurveyRequest(request: InsertSurveyRequest): Promise<SurveyRequest> {
    return this.surveyStorage.createSurveyRequest(request);
  }

  async updateSurveyRequest(id: string, request: Partial<SurveyRequest>): Promise<SurveyRequest | undefined> {
    return this.surveyStorage.updateSurveyRequest(id, request);
  }

  // Surveyors
  async getSurveyors(): Promise<Surveyor[]> {
    return this.surveyStorage.getSurveyors();
  }

  async getSurveyor(id: string): Promise<Surveyor | undefined> {
    return this.surveyStorage.getSurveyor(id);
  }

  async createSurveyor(surveyor: InsertSurveyor): Promise<Surveyor> {
    return this.surveyStorage.createSurveyor(surveyor);
  }

  async updateSurveyor(id: string, surveyor: Partial<Surveyor>): Promise<Surveyor | undefined> {
    return this.surveyStorage.updateSurveyor(id, surveyor);
  }

  // Survey Data (Points, Lines, Polygons)
  async getSurveyPoints(requestId: string): Promise<SurveyPoint[]> {
    return this.surveyStorage.getSurveyPoints(requestId);
  }

  async createSurveyPoint(point: InsertSurveyPoint): Promise<SurveyPoint> {
    return this.surveyStorage.createSurveyPoint(point);
  }

  async deleteSurveyPoint(id: string): Promise<boolean> {
    return this.surveyStorage.deleteSurveyPoint(id);
  }

  async getSurveyLines(requestId: string): Promise<SurveyLine[]> {
    return this.surveyStorage.getSurveyLines(requestId);
  }

  async createSurveyLine(line: InsertSurveyLine): Promise<SurveyLine> {
    return this.surveyStorage.createSurveyLine(line);
  }

  async deleteSurveyLine(id: string): Promise<boolean> {
    return this.surveyStorage.deleteSurveyLine(id);
  }

  async getSurveyPolygons(requestId: string): Promise<SurveyPolygon[]> {
    return this.surveyStorage.getSurveyPolygons(requestId);
  }

  async createSurveyPolygon(polygon: InsertSurveyPolygon): Promise<SurveyPolygon> {
    return this.surveyStorage.createSurveyPolygon(polygon);
  }

  async deleteSurveyPolygon(id: string): Promise<boolean> {
    return this.surveyStorage.deleteSurveyPolygon(id);
  }

  // Survey Sessions
  async getSurveySession(requestId: string): Promise<SurveySession | undefined> {
    return this.surveyStorage.getSurveySession(requestId);
  }

  async createSurveySession(session: InsertSurveySession): Promise<SurveySession> {
    return this.surveyStorage.createSurveySession(session);
  }

  async updateSurveySession(id: string, session: Partial<SurveySession>): Promise<SurveySession | undefined> {
    return this.surveyStorage.updateSurveySession(id, session);
  }

  // Review Comments
  async getReviewComments(requestId: string): Promise<ReviewComment[]> {
    return this.surveyStorage.getReviewComments(requestId);
  }

  async createReviewComment(comment: InsertReviewComment): Promise<ReviewComment> {
    return this.surveyStorage.createReviewComment(comment);
  }

  // ================================
  // Citizen & User Management Domain - تفويض للـ CitizenStorage
  // ================================

  // Citizens
  async getCitizens(): Promise<Citizen[]> {
    return this.citizenStorage.getCitizens();
  }

  async getCitizen(id: string): Promise<Citizen | undefined> {
    return this.citizenStorage.getCitizen(id);
  }

  async getCitizenByNationalId(nationalId: string): Promise<Citizen | undefined> {
    return this.citizenStorage.getCitizenByNationalId(nationalId);
  }

  async createCitizen(citizen: InsertCitizen): Promise<Citizen> {
    return this.citizenStorage.createCitizen(citizen);
  }

  async updateCitizen(id: string, citizen: Partial<Citizen>): Promise<Citizen | undefined> {
    return this.citizenStorage.updateCitizen(id, citizen);
  }

  // Users & Authentication
  async getUser(userId: string): Promise<User | undefined> {
    return this.citizenStorage.getUser(userId);
  }

  async getUserByNationalId(nationalId: string): Promise<User | undefined> {
    return this.citizenStorage.getUserByNationalId(nationalId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.citizenStorage.getUserByEmail(email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    return this.citizenStorage.createUser(userData);
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User | undefined> {
    return this.citizenStorage.updateUser(userId, updateData);
  }

  // Session Management
  async createUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    return this.citizenStorage.createUserSession(sessionData);
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    return this.citizenStorage.getUserSession(sessionId);
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return this.citizenStorage.getUserSessions(userId);
  }

  async updateSessionAccess(sessionId: string): Promise<void> {
    return this.citizenStorage.updateSessionAccess(sessionId);
  }

  async deactivateUserSession(sessionId: string): Promise<void> {
    return this.citizenStorage.deactivateUserSession(sessionId);
  }

  // ================================
  // Building & Construction Domain - تفويض للـ BuildingStorage
  // ================================

  // Engineering Offices
  async getEngineeringOffices(): Promise<EngineeringOffice[]> {
    return this.buildingStorage.getEngineeringOffices();
  }

  async getEngineeringOffice(id: string): Promise<EngineeringOffice | undefined> {
    return this.buildingStorage.getEngineeringOffice(id);
  }

  async createEngineeringOffice(office: InsertEngineeringOffice): Promise<EngineeringOffice> {
    return this.buildingStorage.createEngineeringOffice(office);
  }

  async updateEngineeringOffice(id: string, office: Partial<EngineeringOffice>): Promise<EngineeringOffice | undefined> {
    return this.buildingStorage.updateEngineeringOffice(id, office);
  }

  // Contractors
  async getContractors(): Promise<Contractor[]> {
    return this.buildingStorage.getContractors();
  }

  async getContractor(id: string): Promise<Contractor | undefined> {
    return this.buildingStorage.getContractor(id);
  }

  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    return this.buildingStorage.createContractor(contractor);
  }

  async updateContractor(id: string, contractor: Partial<Contractor>): Promise<Contractor | undefined> {
    return this.buildingStorage.updateContractor(id, contractor);
  }

  // Building Permits
  async getBuildingPermits(): Promise<BuildingPermit[]> {
    return this.buildingStorage.getBuildingPermits();
  }

  async getBuildingPermit(id: string): Promise<BuildingPermit | undefined> {
    return this.buildingStorage.getBuildingPermit(id);
  }

  async getBuildingPermitsByApplicant(applicantId: string): Promise<BuildingPermit[]> {
    return this.buildingStorage.getBuildingPermitsByApplicant(applicantId);
  }

  async createBuildingPermit(permit: InsertBuildingPermit): Promise<BuildingPermit> {
    return this.buildingStorage.createBuildingPermit(permit);
  }

  async updateBuildingPermit(id: string, permit: Partial<BuildingPermit>): Promise<BuildingPermit | undefined> {
    return this.buildingStorage.updateBuildingPermit(id, permit);
  }

  // Occupancy Certificates
  async getOccupancyCertificates(): Promise<OccupancyCertificate[]> {
    return this.buildingStorage.getOccupancyCertificates();
  }

  async getOccupancyCertificate(id: string): Promise<OccupancyCertificate | undefined> {
    return this.buildingStorage.getOccupancyCertificate(id);
  }

  async createOccupancyCertificate(certificate: InsertOccupancyCertificate): Promise<OccupancyCertificate> {
    return this.buildingStorage.createOccupancyCertificate(certificate);
  }

  async updateOccupancyCertificate(id: string, certificate: Partial<OccupancyCertificate>): Promise<OccupancyCertificate | undefined> {
    return this.buildingStorage.updateOccupancyCertificate(id, certificate);
  }

  // Violation Reports
  async getViolationReports(): Promise<ViolationReport[]> {
    return this.buildingStorage.getViolationReports();
  }

  async getViolationReport(id: string): Promise<ViolationReport | undefined> {
    return this.buildingStorage.getViolationReport(id);
  }

  async createViolationReport(report: InsertViolationReport): Promise<ViolationReport> {
    return this.buildingStorage.createViolationReport(report);
  }

  async updateViolationReport(id: string, report: Partial<ViolationReport>): Promise<ViolationReport | undefined> {
    return this.buildingStorage.updateViolationReport(id, report);
  }

  // Inspection Reports
  async getInspectionReports(): Promise<InspectionReport[]> {
    return this.buildingStorage.getInspectionReports();
  }

  async getInspectionReport(id: string): Promise<InspectionReport | undefined> {
    return this.buildingStorage.getInspectionReport(id);
  }

  async createInspectionReport(report: InsertInspectionReport): Promise<InspectionReport> {
    return this.buildingStorage.createInspectionReport(report);
  }

  async updateInspectionReport(id: string, report: Partial<InspectionReport>): Promise<InspectionReport | undefined> {
    return this.buildingStorage.updateInspectionReport(id, report);
  }

  async assignInspector(reportId: string, inspectorId: string, inspectorName: string): Promise<InspectionReport | undefined> {
    return this.buildingStorage.assignInspector(reportId, inspectorId, inspectorName);
  }

  // ================================
  // Payment & Financial Domain - تفويض للـ PaymentAuditStorage
  // ================================

  // Payment Transactions
  async getPaymentTransactions(): Promise<PaymentTransaction[]> {
    return this.paymentAuditStorage.getPaymentTransactions();
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    return this.paymentAuditStorage.getPaymentTransaction(id);
  }

  async getPaymentsByReference(referenceType: string, referenceId: string): Promise<PaymentTransaction[]> {
    return this.paymentAuditStorage.getPaymentsByReference(referenceType, referenceId);
  }

  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    return this.paymentAuditStorage.createPaymentTransaction(transaction);
  }

  async updatePaymentTransaction(id: string, transaction: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined> {
    return this.paymentAuditStorage.updatePaymentTransaction(id, transaction);
  }

  // ================================
  // Audit & Statistics Domain - تفويض للـ PaymentAuditStorage
  // ================================

  // Audit Logging
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    return this.paymentAuditStorage.createAuditLog(logData);
  }

  async getAuditLogs(userId?: string): Promise<AuditLog[]> {
    return this.paymentAuditStorage.getAuditLogs(userId);
  }

  // System Statistics
  async getStats(): Promise<{
    newRequests: number;
    inProgress: number;
    underReview: number;
    completed: number;
    totalCitizens: number;
    activeBuildingPermits: number;
    pendingPermits: number;
    totalRevenue: number;
  }> {
    // جمع البيانات من جميع الوحدات للحصول على الإحصائيات
    const surveyRequests = await this.surveyStorage.getSurveyRequests();
    const citizens = await this.citizenStorage.getCitizens();
    const buildingPermits = await this.buildingStorage.getBuildingPermits();
    const payments = await this.paymentAuditStorage.getPaymentTransactions();

    return this.paymentAuditStorage.getStats(surveyRequests, citizens, buildingPermits, payments);
  }

  // ================================
  // Street Survey Service Domain - تفويض للـ StreetSurveyStorage
  // ================================
  
  // Street Status Decisions
  async getStreetStatusDecisions(): Promise<any[]> {
    return this.streetSurveyStorage.getStreetStatusDecisions();
  }

  async getStreetStatusDecision(id: string): Promise<any | undefined> {
    return this.streetSurveyStorage.getStreetStatusDecision(id);
  }

  async createStreetStatusDecision(decision: any): Promise<any> {
    return this.streetSurveyStorage.createStreetStatusDecision(decision);
  }

  async updateStreetStatusDecision(id: string, decision: Partial<any>): Promise<any | undefined> {
    return this.streetSurveyStorage.updateStreetStatusDecision(id, decision);
  }

  async getStreetStatusDecisionsByBranch(branchOffice: string): Promise<any[]> {
    return this.streetSurveyStorage.getStreetStatusDecisionsByBranch(branchOffice);
  }

  async getStreetStatusDecisionsByStatus(status: string): Promise<any[]> {
    return this.streetSurveyStorage.getStreetStatusDecisionsByStatus(status);
  }

  async escalateStreetStatusDecision(id: string, escalationReason: string): Promise<any | undefined> {
    return this.streetSurveyStorage.escalateStreetStatusDecision(id, escalationReason);
  }

  async submitStreetDecisionAppeal(id: string, appealNotes: string): Promise<any | undefined> {
    return this.streetSurveyStorage.submitStreetDecisionAppeal(id, appealNotes);
  }

  // Branch Periodic Reports
  async getBranchPeriodicReports(): Promise<any[]> {
    return this.streetSurveyStorage.getBranchPeriodicReports();
  }

  async getBranchPeriodicReport(id: string): Promise<any | undefined> {
    return this.streetSurveyStorage.getBranchPeriodicReport(id);
  }

  async createBranchPeriodicReport(report: any): Promise<any> {
    return this.streetSurveyStorage.createBranchPeriodicReport(report);
  }

  async updateBranchPeriodicReport(id: string, report: Partial<any>): Promise<any | undefined> {
    return this.streetSurveyStorage.updateBranchPeriodicReport(id, report);
  }

  async getBranchReportsByOffice(branchOffice: string): Promise<any[]> {
    return this.streetSurveyStorage.getBranchReportsByOffice(branchOffice);
  }

  async getBranchReportsByPeriod(reportType: string, reportPeriod: string): Promise<any[]> {
    return this.streetSurveyStorage.getBranchReportsByPeriod(reportType, reportPeriod);
  }

  async submitBranchReportToSupervisory(id: string): Promise<any | undefined> {
    return this.streetSurveyStorage.submitBranchReportToSupervisory(id);
  }

  async approveBranchReport(id: string, supervisoryFeedback?: string): Promise<any | undefined> {
    return this.streetSurveyStorage.approveBranchReport(id, supervisoryFeedback);
  }

  // Analytics and Dashboard
  async getStreetDecisionStats(): Promise<any> {
    return this.streetSurveyStorage.getStreetDecisionStats();
  }

  async getBranchPerformanceAnalytics(branchOffice: string): Promise<any> {
    return this.streetSurveyStorage.getBranchPerformanceAnalytics(branchOffice);
  }

  async getEscalationTrends(): Promise<any> {
    return this.streetSurveyStorage.getEscalationTrends();
  }

  async getProcessingTimeAnalytics(): Promise<any> {
    return this.streetSurveyStorage.getProcessingTimeAnalytics();
  }
}

/**
 * createStorageService - Factory function لإنشاء خدمة التخزين
 */
export function createStorageService(): IStorageService {
  return new UnifiedStorageService();
}