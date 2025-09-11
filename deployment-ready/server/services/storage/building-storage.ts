/**
 * Building Storage Module - يدير جميع عمليات البناء والتراخيص
 * مسؤول عن: Engineering Offices, Contractors, Building Permits, Occupancy Certificates, 
 *          Violations, Inspections
 */

import { randomUUID } from "crypto";
import {
  type EngineeringOffice, type InsertEngineeringOffice,
  type Contractor, type InsertContractor,
  type BuildingPermit, type InsertBuildingPermit,
  type OccupancyCertificate, type InsertOccupancyCertificate,
  type ViolationReport, type InsertViolationReport,
  type InspectionReport, type InsertInspectionReport,
} from "@shared/schema";

export class BuildingStorageService {
  private engineeringOffices: EngineeringOffice[] = [];
  private contractors: Contractor[] = [];
  private buildingPermits: BuildingPermit[] = [];
  private occupancyCertificates: OccupancyCertificate[] = [];
  private violationReports: ViolationReport[] = [];
  private inspectionReports: InspectionReport[] = [];

  // ================================
  // Engineering Offices Management
  // ================================

  async getEngineeringOffices(): Promise<EngineeringOffice[]> {
    return this.engineeringOffices;
  }

  async getEngineeringOffice(id: string): Promise<EngineeringOffice | undefined> {
    return this.engineeringOffices.find(office => office.id === id);
  }

  async createEngineeringOffice(officeData: InsertEngineeringOffice): Promise<EngineeringOffice> {
    const office: EngineeringOffice = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      name: "",
      licenseNumber: "",
      address: "",
      phone: "",
      email: "",
      ownerName: "",
      specializations: [],
      status: "active",
      establishedDate: new Date(),
      registrationDate: new Date(),
      ...officeData,
    };
    this.engineeringOffices.push(office);
    return office;
  }

  async updateEngineeringOffice(id: string, officeData: Partial<EngineeringOffice>): Promise<EngineeringOffice | undefined> {
    const index = this.engineeringOffices.findIndex(office => office.id === id);
    if (index === -1) return undefined;
    
    this.engineeringOffices[index] = {
      ...this.engineeringOffices[index],
      ...officeData,
      updatedAt: new Date(),
    };
    
    return this.engineeringOffices[index];
  }

  // ================================
  // Contractors Management
  // ================================

  async getContractors(): Promise<Contractor[]> {
    return this.contractors;
  }

  async getContractor(id: string): Promise<Contractor | undefined> {
    return this.contractors.find(contractor => contractor.id === id);
  }

  async createContractor(contractorData: InsertContractor): Promise<Contractor> {
    const contractor: Contractor = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      name: "",
      licenseNumber: "",
      address: "",
      phone: "",
      email: "",
      ownerName: "",
      specializations: [],
      status: "active",
      establishedDate: new Date(),
      rating: null,
      completedProjects: 0,
      activeProjects: 0,
      ...contractorData,
    };
    this.contractors.push(contractor);
    return contractor;
  }

  async updateContractor(id: string, contractorData: Partial<Contractor>): Promise<Contractor | undefined> {
    const index = this.contractors.findIndex(contractor => contractor.id === id);
    if (index === -1) return undefined;
    
    this.contractors[index] = {
      ...this.contractors[index],
      ...contractorData,
      updatedAt: new Date(),
    };
    
    return this.contractors[index];
  }

  // ================================
  // Building Permits Management
  // ================================

  async getBuildingPermits(): Promise<BuildingPermit[]> {
    return this.buildingPermits;
  }

  async getBuildingPermit(id: string): Promise<BuildingPermit | undefined> {
    return this.buildingPermits.find(permit => permit.id === id);
  }

  async getBuildingPermitsByApplicant(applicantId: string): Promise<BuildingPermit[]> {
    return this.buildingPermits.filter(permit => permit.applicantId === applicantId);
  }

  async createBuildingPermit(permitData: InsertBuildingPermit): Promise<BuildingPermit> {
    const permit: BuildingPermit = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      location: "",
      district: "",
      governorate: "",
      applicantId: "",
      projectName: "",
      projectType: "",
      buildingType: "",
      plotArea: 0,
      buildingArea: 0,
      floors: 0,
      status: "submitted",
      priority: "normal",
      coordinates: {},
      documents: {},
      engineeringOfficeId: null,
      contractorId: null,
      basementFloors: 0,
      estimatedCost: null,
      reviewDate: null,
      approvalDate: null,
      expiryDate: null,
      issuedBy: null,
      reviewNotes: null,
      fees: this.calculatePermitFees(permitData.buildingArea || 0, permitData.projectType || ""),
      paidAmount: 0,
      paymentStatus: "pending",
      submitDate: new Date(),
      ...permitData,
    };
    this.buildingPermits.push(permit);
    return permit;
  }

  async updateBuildingPermit(id: string, permitData: Partial<BuildingPermit>): Promise<BuildingPermit | undefined> {
    const index = this.buildingPermits.findIndex(permit => permit.id === id);
    if (index === -1) return undefined;
    
    this.buildingPermits[index] = {
      ...this.buildingPermits[index],
      ...permitData,
      updatedAt: new Date(),
    };
    
    return this.buildingPermits[index];
  }

  // ================================
  // Occupancy Certificates Management
  // ================================

  async getOccupancyCertificates(): Promise<OccupancyCertificate[]> {
    return this.occupancyCertificates;
  }

  async getOccupancyCertificate(id: string): Promise<OccupancyCertificate | undefined> {
    return this.occupancyCertificates.find(cert => cert.id === id);
  }

  async createOccupancyCertificate(certData: InsertOccupancyCertificate): Promise<OccupancyCertificate> {
    const certificate: OccupancyCertificate = {
      id: randomUUID(),
      certificateNumber: `OC-2025-${String(this.occupancyCertificates.length + 1).padStart(4, '0')}`,
      status: "draft",
      priority: "normal",
      engineeringOfficeId: null,
      contractorId: null,
      basementFloors: 0,
      estimatedCost: null,
      coordinates: null,
      reviewDate: null,
      approvalDate: null,
      expiryDate: null,
      issuedBy: null,
      reviewNotes: null,
      documents: [],
      fees: null,
      paidAmount: 0,
      paymentStatus: "pending",
      ...certData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.occupancyCertificates.push(certificate);
    return certificate;
  }

  async updateOccupancyCertificate(id: string, certData: Partial<OccupancyCertificate>): Promise<OccupancyCertificate | undefined> {
    const index = this.occupancyCertificates.findIndex(cert => cert.id === id);
    if (index === -1) return undefined;
    
    this.occupancyCertificates[index] = {
      ...this.occupancyCertificates[index],
      ...certData,
      updatedAt: new Date(),
    };
    
    return this.occupancyCertificates[index];
  }

  // ================================
  // Violation Reports Management
  // ================================

  async getViolationReports(): Promise<ViolationReport[]> {
    return this.violationReports;
  }

  async getViolationReport(id: string): Promise<ViolationReport | undefined> {
    return this.violationReports.find(report => report.id === id);
  }

  async createViolationReport(reportData: InsertViolationReport): Promise<ViolationReport> {
    const report: ViolationReport = {
      id: randomUUID(),
      reportNumber: `VR-2025-${String(this.violationReports.length + 1).padStart(4, '0')}`,
      status: "reported",
      violatorName: null,
      violatorContact: null,
      coordinates: null,
      evidencePhotos: [],
      witnessReports: [],
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      reportDate: new Date(),
      reporterName: "",
      reporterContact: "",
      location: "",
      district: "",
      governorate: "",
      violationType: "",
      description: "",
      severity: "medium",
      inspectorAssigned: null,
      inspectionDate: null,
      inspectionNotes: null,
      resolutionPlan: null,
      completionDeadline: null,
      ...reportData,
    };
    this.violationReports.push(report);
    return report;
  }

  async updateViolationReport(id: string, reportData: Partial<ViolationReport>): Promise<ViolationReport | undefined> {
    const index = this.violationReports.findIndex(report => report.id === id);
    if (index === -1) return undefined;
    
    this.violationReports[index] = {
      ...this.violationReports[index],
      ...reportData,
      updatedAt: new Date(),
    };
    
    return this.violationReports[index];
  }

  // ================================
  // Inspection Reports Management
  // ================================

  async getInspectionReports(): Promise<InspectionReport[]> {
    return this.inspectionReports;
  }

  async getInspectionReport(id: string): Promise<InspectionReport | undefined> {
    return this.inspectionReports.find(report => report.id === id);
  }

  async createInspectionReport(reportData: InsertInspectionReport): Promise<InspectionReport> {
    const report: InspectionReport = {
      id: randomUUID(),
      reportNumber: `IR-2025-${String(this.inspectionReports.length + 1).padStart(4, '0')}`,
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
      requestId: "",
      inspectorId: null,
      inspectorName: null,
      scheduledDate: null,
      completedDate: null,
      buildingPermitId: null,
      location: "",
      inspectionType: "",
      structuralCompliance: null,
      safetyCompliance: null,
      fireCompliance: null,
      electricalCompliance: null,
      plumbingCompliance: null,
      overallCompliance: null,
      findings: [],
      recommendations: [],
      photos: [],
      documents: [],
      notes: null,
      approvalStatus: "pending",
      nextSteps: null,
      ...reportData,
    };
    this.inspectionReports.push(report);
    return report;
  }

  async updateInspectionReport(id: string, reportData: Partial<InspectionReport>): Promise<InspectionReport | undefined> {
    const index = this.inspectionReports.findIndex(report => report.id === id);
    if (index === -1) return undefined;
    
    this.inspectionReports[index] = {
      ...this.inspectionReports[index],
      ...reportData,
      updatedAt: new Date(),
    };
    
    return this.inspectionReports[index];
  }

  async assignInspector(reportId: string, inspectorId: string, inspectorName: string): Promise<InspectionReport | undefined> {
    const report = await this.getInspectionReport(reportId);
    if (!report) return undefined;

    return this.updateInspectionReport(reportId, {
      inspectorId,
      inspectorName,
      status: "assigned",
    });
  }

  // ================================
  // Helper Methods
  // ================================

  private calculatePermitFees(buildingArea: number, projectType: string): number {
    // Fee calculation based on Yemeni building regulations
    const baseRatePerSqm = projectType === "commercial" ? 150 : 100; // YER per square meter
    const baseFee = buildingArea * baseRatePerSqm;
    
    // Additional fees
    const administrativeFee = 25000; // Fixed administrative fee
    const inspectionFee = 15000; // Fixed inspection fee
    
    return baseFee + administrativeFee + inspectionFee;
  }
}