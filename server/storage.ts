import {
  type SurveyRequest,
  type InsertSurveyRequest,
  type Surveyor,
  type InsertSurveyor,
  type SurveyPoint,
  type InsertSurveyPoint,
  type SurveyLine,
  type InsertSurveyLine,
  type SurveyPolygon,
  type InsertSurveyPolygon,
  type SurveySession,
  type InsertSurveySession,
  type ReviewComment,
  type InsertReviewComment,
  type Citizen,
  type InsertCitizen,
  type EngineeringOffice,
  type InsertEngineeringOffice,
  type Contractor,
  type InsertContractor,
  type BuildingPermit,
  type InsertBuildingPermit,
  type OccupancyCertificate,
  type InsertOccupancyCertificate,
  type ViolationReport,
  type InsertViolationReport,
  type PaymentTransaction,
  type InsertPaymentTransaction,
  type InspectionReport,
  type InsertInspectionReport,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Surveyors
  getSurveyors(): Promise<Surveyor[]>;
  getSurveyor(id: string): Promise<Surveyor | undefined>;
  createSurveyor(surveyor: InsertSurveyor): Promise<Surveyor>;
  updateSurveyor(id: string, surveyor: Partial<Surveyor>): Promise<Surveyor | undefined>;

  // Survey Requests
  getSurveyRequests(): Promise<SurveyRequest[]>;
  getSurveyRequest(id: string): Promise<SurveyRequest | undefined>;
  createSurveyRequest(request: InsertSurveyRequest): Promise<SurveyRequest>;
  updateSurveyRequest(id: string, request: Partial<SurveyRequest>): Promise<SurveyRequest | undefined>;

  // Survey Points
  getSurveyPoints(requestId: string): Promise<SurveyPoint[]>;
  createSurveyPoint(point: InsertSurveyPoint): Promise<SurveyPoint>;
  deleteSurveyPoint(id: string): Promise<boolean>;

  // Survey Lines
  getSurveyLines(requestId: string): Promise<SurveyLine[]>;
  createSurveyLine(line: InsertSurveyLine): Promise<SurveyLine>;
  deleteSurveyLine(id: string): Promise<boolean>;

  // Survey Polygons
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

  // Citizens
  getCitizens(): Promise<Citizen[]>;
  getCitizen(id: string): Promise<Citizen | undefined>;
  getCitizenByNationalId(nationalId: string): Promise<Citizen | undefined>;
  createCitizen(citizen: InsertCitizen): Promise<Citizen>;
  updateCitizen(id: string, citizen: Partial<Citizen>): Promise<Citizen | undefined>;

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

  // Payment Transactions
  getPaymentTransactions(): Promise<PaymentTransaction[]>;
  getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined>;
  getPaymentsByReference(referenceType: string, referenceId: string): Promise<PaymentTransaction[]>;
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  updatePaymentTransaction(id: string, transaction: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined>;

  // Inspection Reports
  getInspectionReports(): Promise<InspectionReport[]>;
  getInspectionReport(id: string): Promise<InspectionReport | undefined>;
  createInspectionReport(report: InsertInspectionReport): Promise<InspectionReport>;
  updateInspectionReport(id: string, report: Partial<InspectionReport>): Promise<InspectionReport | undefined>;
  assignInspector(reportId: string, inspectorId: string, inspectorName: string): Promise<InspectionReport | undefined>;

  // Enhanced Statistics
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

  // Authentication and User management - Phase 4
  getUser(userId: string): Promise<User | undefined>;
  getUserByNationalId(nationalId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(userId: string, updateData: Partial<User>): Promise<User | undefined>;

  // Session management
  createUserSession(sessionData: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionId: string): Promise<UserSession | undefined>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  updateSessionAccess(sessionId: string): Promise<void>;
  deactivateUserSession(sessionId: string): Promise<void>;

  // Audit logging
  createAuditLog(logData: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(userId?: string): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private surveyors: Surveyor[] = [];
  private surveyRequests: SurveyRequest[] = [];
  private surveyPoints: SurveyPoint[] = [];
  private surveyLines: SurveyLine[] = [];
  private surveyPolygons: SurveyPolygon[] = [];
  private surveySessions: SurveySession[] = [];
  private reviewComments: ReviewComment[] = [];
  private citizens: Citizen[] = [];
  private engineeringOffices: EngineeringOffice[] = [];
  private contractors: Contractor[] = [];
  private buildingPermits: BuildingPermit[] = [];
  private occupancyCertificates: OccupancyCertificate[] = [];
  private violationReports: ViolationReport[] = [];
  private paymentTransactions: PaymentTransaction[] = [];
  private inspectionReports: InspectionReport[] = [];
  
  // Phase 4: Authentication and Security data
  private users: User[] = [];
  private userSessions: UserSession[] = [];
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.initializeSampleData();
  }

  // Initialize with sample Yemen surveying data
  private initializeSampleData() {
    // Sample Surveyors
    const surveyor1: Surveyor = {
      id: "surveyor-1",
      employeeNumber: "ENG-001",
      name: "محمد أحمد الشامي",
      title: "مهندس مساحة أول",
      department: "قسم المساحة والطوبوغرافيا",
      specialization: "مساحة الأراضي والمباني",
      experience: 15,
      phone: "+967-777-123456",
      email: "m.shami@survey.gov.ye",
      status: "active",
      currentLoad: 3,
      maxLoad: 5,
      rating: 4.8,
      totalProjects: 142,
      totalPoints: 15840,
      activeDays: 1250,
      joinedAt: new Date("2020-03-15"),
      lastActive: new Date(),
      createdAt: new Date("2020-03-15"),
      updatedAt: new Date(),
    };

    const surveyor2: Surveyor = {
      id: "surveyor-2", 
      employeeNumber: "TECH-003",
      name: "فاطمة حسن القاضي",
      title: "تقني مساحة",
      department: "قسم المساحة والطوبوغرافيا",
      specialization: "مساحة المباني السكنية",
      experience: 8,
      phone: "+967-777-654321",
      email: "f.qadi@survey.gov.ye",
      status: "active",
      currentLoad: 2,
      maxLoad: 4,
      rating: 4.6,
      totalProjects: 87,
      totalPoints: 8950,
      activeDays: 820,
      joinedAt: new Date("2021-08-20"),
      lastActive: new Date(),
      createdAt: new Date("2021-08-20"),
      updatedAt: new Date(),
    };

    this.surveyors = [surveyor1, surveyor2];

    // Enhanced Sample Survey Requests
    const sampleRequests: SurveyRequest[] = [
      {
        id: "5355f615-5c4c-4a1c-9f66-94216ea42c3d",
        requestNumber: "REQ-2025-001",
        title: "مسح قطعة أرض سكنية - حي الحصبة",
        ownerName: "عبد الرحمن محمد الزبيري",
        region: "أمانة العاصمة - منطقة الحصبة",
        location: "شارع الزبيري - حي الحصبة الشمالي",
        requestType: "building_permit",
        assignedSurveyor: "محمد أحمد الشامي",
        assignedSurveyorId: "surveyor-1",
        status: "in_progress",
        priority: "high",
        dueDate: new Date("2025-09-15"),
        estimatedHours: 16,
        actualHours: 8.5,
        completionPercentage: 45,
        coordinates: { lat: 15.3694, lng: 44.1910 },
        area: 450.5,
        documents: [
          { name: "صورة صك الملكية.pdf", type: "ownership_document" },
          { name: "خريطة الموقع التفصيلية.jpg", type: "site_map" }
        ],
        notes: "قطعة أرض مربعة الشكل، تحتاج لتحديد دقيق للحدود الشمالية",
        createdAt: new Date("2025-01-20"),
        updatedAt: new Date(),
        submittedAt: new Date("2025-01-20"),
        assignedAt: new Date("2025-01-21"),
        completedAt: null,
        reviewedAt: null,
      },
      {
        id: "8a9b7c6d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
        requestNumber: "REQ-2025-002", 
        title: "مسح مبنى تجاري - شارع الستين",
        ownerName: "شركة اليمن للتجارة العامة",
        region: "أمانة العاصمة - منطقة التحرير",
        location: "شارع الستين - بجانب البنك الأهلي",
        requestType: "commercial_permit",
        assignedSurveyor: "فاطمة حسن القاضي",
        assignedSurveyorId: "surveyor-2",
        status: "under_review",
        priority: "medium",
        dueDate: new Date("2025-09-25"),
        estimatedHours: 24,
        actualHours: 24,
        completionPercentage: 100,
        coordinates: { lat: 15.3642, lng: 44.2065 },
        area: 850.2,
        documents: [
          { name: "رخصة تجارية.pdf", type: "business_license" },
          { name: "مخططات البناء.dwg", type: "building_plans" },
          { name: "صور المبنى.jpg", type: "site_photos" }
        ],
        notes: "مبنى من أربعة طوابق، تم إنجاز المسح ومراجعة النتائج",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date(),
        submittedAt: new Date("2025-01-15"),
        assignedAt: new Date("2025-01-16"),
        completedAt: new Date("2025-01-25"),
        reviewedAt: null,
      },
      {
        id: "3f4e5d6c-7b8a-9c0d-1e2f-3a4b5c6d7e8f",
        requestNumber: "REQ-2025-003",
        title: "مسح أراضي زراعية - منطقة صنعاء القديمة",
        ownerName: "أحمد علي المؤيد",
        region: "أمانة العاصمة - صنعاء القديمة",
        location: "منطقة بير العزب - شرق صنعاء القديمة",
        requestType: "agricultural_survey",
        assignedSurveyor: null,
        assignedSurveyorId: null,
        status: "submitted",
        priority: "low",
        dueDate: new Date("2025-10-10"),
        estimatedHours: 32,
        actualHours: null,
        completionPercentage: 0,
        coordinates: { lat: 15.3547, lng: 44.2157 },
        area: 1250.8,
        documents: [
          { name: "عقد الأرض الزراعية.pdf", type: "agricultural_contract" }
        ],
        notes: "أرض زراعية واسعة تحتاج مسح شامل لتحديد الحدود والمساحات",
        createdAt: new Date("2025-01-18"),
        updatedAt: new Date(),
        submittedAt: new Date("2025-01-18"),
        assignedAt: null,
        completedAt: null,
        reviewedAt: null,
      }
    ];

    this.surveyRequests = sampleRequests;

    // Sample Review Comments  
    this.reviewComments = [
      {
        id: "comment-001",
        requestId: "5355f615-5c4c-4a1c-9f66-94216ea42c3d",
        reviewerName: "أحمد صالح المراجع",
        comment: "يرجى التأكد من دقة القياسات في الزاوية الشمالية الشرقية",
        commentType: "revision_request",
        createdAt: new Date("2025-01-22"),
      },
      {
        id: "comment-002",
        requestId: "8a9b7c6d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
        reviewerName: "فيصل عبدالله المشرف",
        comment: "المسح مطابق للمعايير المطلوبة، يمكن اعتماده",
        commentType: "approval",
        createdAt: new Date("2025-01-26"),
      }
    ];

    // Sample Citizens Data
    this.citizens = [
      {
        id: "citizen-001",
        nationalId: "01234567891",
        firstName: "أحمد",
        lastName: "محمد الزبيري",
        phone: "+967-777-111111",
        email: "ahmed.zuberi@gmail.com",
        address: "شارع الزبيري - حي الحصبة الشمالي",
        district: "الحصبة",
        governorate: "أمانة العاصمة",
        dateOfBirth: new Date("1985-05-15"),
        gender: "male",
        status: "active",
        totalRequests: 3,
        createdAt: new Date("2024-11-01"),
        updatedAt: new Date(),
      },
      {
        id: "citizen-002",
        nationalId: "01234567892",
        firstName: "فاطمة",
        lastName: "علي السباعي",
        phone: "+967-777-222222",
        email: "fatima.sabai@yahoo.com",
        address: "شارع الستين - منطقة التحرير",
        district: "التحرير",
        governorate: "أمانة العاصمة",
        dateOfBirth: new Date("1990-08-20"),
        gender: "female",
        status: "active",
        totalRequests: 1,
        createdAt: new Date("2024-12-15"),
        updatedAt: new Date(),
      }
    ];

    // Sample Engineering Offices
    this.engineeringOffices = [
      {
        id: "office-001",
        officeName: "مكتب الهندسة المعمارية المتقدمة",
        licenseNumber: "ENG-AAE-2020-001",
        ownerName: "م. خالد أحمد الشامي",
        ownerNationalId: "01234567893",
        phone: "+967-1-234567",
        email: "info@aae-yemen.com",
        address: "شارع الجمهورية - مجمع الخليج التجاري",
        district: "التحرير",
        governorate: "أمانة العاصمة",
        specializations: ["architectural", "structural", "interior_design"],
        classification: "grade_a",
        status: "approved",
        establishedDate: new Date("2020-03-15"),
        approvedDate: new Date("2020-04-01"),
        rating: 4.7,
        totalProjects: 85,
        activeProjects: 12,
        createdAt: new Date("2020-03-15"),
        updatedAt: new Date(),
      }
    ];

    // Sample Contractors
    this.contractors = [
      {
        id: "contractor-001",
        contractorName: "شركة البناء الحديث المحدودة",
        licenseNumber: "CON-MBC-2019-001",
        ownerName: "محمد عبدالله الحداد",
        ownerNationalId: "01234567894",
        phone: "+967-1-345678",
        email: "contracts@mbc-yemen.com",
        address: "شارع الثورة - المجمع التجاري الجديد",
        district: "الصافية",
        governorate: "أمانة العاصمة",
        specializations: ["residential", "commercial", "infrastructure"],
        classification: "grade_2",
        maxProjectValue: 50000000, // 50 million YER
        status: "approved",
        establishedDate: new Date("2019-06-10"),
        approvedDate: new Date("2019-07-15"),
        rating: 4.4,
        totalProjects: 67,
        activeProjects: 8,
        createdAt: new Date("2019-06-10"),
        updatedAt: new Date(),
      }
    ];

    // Sample Building Permits
    this.buildingPermits = [
      {
        id: "permit-001",
        permitNumber: "BP-2025-0001",
        applicantId: "citizen-001",
        engineeringOfficeId: "office-001",
        contractorId: "contractor-001",
        projectName: "منزل سكني - عائلة الزبيري",
        projectType: "residential",
        buildingType: "house",
        plotArea: 450.5,
        buildingArea: 320.2,
        totalFloors: 2,
        basementFloors: 0,
        estimatedCost: 15000000, // 15 million YER
        location: "شارع الزبيري - حي الحصبة الشمالي",
        coordinates: { lat: 15.3694, lng: 44.1910 },
        district: "الحصبة",
        governorate: "أمانة العاصمة",
        status: "approved",
        priority: "normal",
        submitDate: new Date("2025-01-10"),
        reviewDate: new Date("2025-01-18"),
        approvalDate: new Date("2025-01-20"),
        expiryDate: new Date("2027-01-20"),
        issuedBy: "م. سعد الدين المهندس",
        reviewNotes: "تمت الموافقة بعد استيفاء جميع المتطلبات",
        documents: [
          { name: "صك الملكية.pdf", type: "ownership_document" },
          { name: "المخططات المعمارية.dwg", type: "architectural_plans" },
          { name: "تقرير دراسة التربة.pdf", type: "soil_study" }
        ],
        fees: 75000, // 75k YER
        paidAmount: 75000,
        paymentStatus: "paid",
        createdAt: new Date("2025-01-10"),
        updatedAt: new Date("2025-01-20"),
      }
    ];

    // Sample Payment Transactions
    this.paymentTransactions = [
      {
        id: "payment-001",
        transactionId: "TXN-2025-0001",
        referenceType: "building_permit",
        referenceId: "permit-001",
        payerName: "أحمد محمد الزبيري",
        payerContact: "+967-777-111111",
        amount: 75000,
        currency: "YER",
        paymentMethod: "bank_transfer",
        paymentGateway: null,
        gatewayTransactionId: null,
        status: "completed",
        paidAt: new Date("2025-01-15"),
        description: "رسوم رخصة البناء رقم BP-2025-0001",
        receiptNumber: "REC-2025-0001",
        processedBy: "موظف الخزينة - أحمد محمد",
        notes: "تم الدفع عبر التحويل البنكي",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      }
    ];

    // Sample Occupancy Certificates  
    this.occupancyCertificates = [
      {
        id: "cert-001",
        certificateNumber: "OC-2025-0001",
        buildingPermitId: "permit-001",
        applicantName: "أحمد محمد الزبيري",
        applicantNationalId: "01234567891",
        projectName: "منزل سكني - عائلة الزبيري",
        location: "شارع الزبيري - حي الحصبة الشمالي",
        coordinates: { lat: 15.3694, lng: 44.1910 },
        district: "الحصبة",
        governorate: "أمانة العاصمة",
        buildingType: "residential",
        totalFloors: 2,
        basementFloors: 0,
        totalUnits: 1,
        buildingArea: 320.2,
        plotArea: 450.5,
        completionDate: "2025-01-20",
        inspectionDate: "2025-01-22",
        inspectorId: "inspector-001",
        inspectorName: "م. سالم أحمد المفتش",
        inspectionNotes: "تم فحص المبنى ووجد مطابقاً للمواصفات والشروط",
        complianceStatus: "compliant",
        violationsFound: [],
        correctiveActions: null,
        status: "approved",
        priority: "normal",
        issuedDate: new Date("2025-01-25"),
        expiryDate: new Date("2027-01-25"),
        issuedBy: "م. عبدالله الصالح",
        sentToUtilities: true,
        utilitiesNotificationDate: new Date("2025-01-25"),
        documents: [
          { name: "شهادة إتمام البناء.pdf", type: "completion_certificate" },
          { name: "تقرير التفتيش النهائي.pdf", type: "final_inspection_report" }
        ],
        fees: 25000,
        paidAmount: 25000,
        paymentStatus: "paid",
        createdAt: new Date("2025-01-22"),
        updatedAt: new Date("2025-01-25"),
      }
    ];

    // Sample Inspection Reports
    this.inspectionReports = [
      {
        id: "report-001",
        reportNumber: "REP-2025-0001",
        buildingPermitId: "permit-001",
        occupancyCertificateId: "cert-001",
        inspectionType: "final",
        inspectorId: "inspector-001",
        inspectorName: "م. سالم أحمد المفتش",
        inspectionDate: "2025-01-22",
        location: "شارع الزبيري - حي الحصبة الشمالي",
        coordinates: { lat: 15.3694, lng: 44.1910 },
        district: "الحصبة",
        governorate: "أمانة العاصمة",
        projectName: "منزل سكني - عائلة الزبيري",
        ownerName: "أحمد محمد الزبيري",
        contractorName: "شركة البناء المتقدم",
        engineeringOfficeName: "مكتب الهندسة المعمارية المتطورة",
        buildingType: "residential",
        totalFloors: 2,
        inspectedFloors: 2,
        buildingArea: 320.2,
        constructionProgress: 100,
        overallCompliance: "compliant",
        structuralSafety: "safe",
        fireSafety: "compliant",
        electricalSafety: "safe",
        plumbingSafety: "compliant",
        accessibilitySafety: "compliant",
        violationsFound: [],
        correctiveActions: [],
        inspectionFindings: "تم فحص المبنى بالكامل ووجد مطابقاً لجميع المواصفات والمعايير المطلوبة. البناء تم حسب المخططات المعتمدة والمواد المستخدمة ذات جودة عالية.",
        recommendations: "المبنى جاهز لإصدار شهادة الإشغال",
        nextInspectionDate: null,
        status: "approved",
        priority: "normal",
        attachments: [],
        assignedDate: "2025-01-20",
        completedDate: "2025-01-22",
        reviewedDate: "2025-01-24",
        reviewedBy: "م. عبدالله الصالح",
        reviewNotes: "تقرير التفتيش شامل ومعتمد",
        digitalSignature: null,
        certificateGenerated: true,
        notificationsSent: ["owner", "utilities"],
        createdAt: new Date("2025-01-22"),
        updatedAt: new Date("2025-01-24"),
      }
    ];
  }

  // Surveyor methods
  async getSurveyors(): Promise<Surveyor[]> {
    return this.surveyors;
  }

  async getSurveyor(id: string): Promise<Surveyor | undefined> {
    return this.surveyors.find(surveyor => surveyor.id === id);
  }

  async createSurveyor(surveyorData: InsertSurveyor): Promise<Surveyor> {
    const surveyor: Surveyor = {
      id: randomUUID(),
      status: "active",
      currentLoad: 0,
      maxLoad: 5,
      rating: 0,
      totalProjects: 0,
      totalPoints: 0,
      activeDays: 0,
      ...surveyorData,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActive: new Date(),
    };
    this.surveyors.push(surveyor);
    return surveyor;
  }

  async updateSurveyor(id: string, surveyorData: Partial<Surveyor>): Promise<Surveyor | undefined> {
    const index = this.surveyors.findIndex(surveyor => surveyor.id === id);
    if (index === -1) return undefined;
    
    this.surveyors[index] = {
      ...this.surveyors[index],
      ...surveyorData,
      updatedAt: new Date(),
    };
    
    return this.surveyors[index];
  }

  // Survey Request methods  
  async getSurveyRequests(): Promise<SurveyRequest[]> {
    return this.surveyRequests;
  }

  async getSurveyRequest(id: string): Promise<SurveyRequest | undefined> {
    return this.surveyRequests.find(req => req.id === id);
  }

  async createSurveyRequest(requestData: InsertSurveyRequest): Promise<SurveyRequest> {
    const request: SurveyRequest = {
      id: randomUUID(),
      requestNumber: `REQ-2025-${String(this.surveyRequests.length + 1).padStart(3, '0')}`,
      status: "submitted",
      priority: "medium",
      requestType: "building_permit",
      completionPercentage: 0,
      ...requestData,
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
      assignedAt: null,
      completedAt: null,
      reviewedAt: null,
    };
    this.surveyRequests.push(request);
    return request;
  }

  async updateSurveyRequest(id: string, requestData: Partial<SurveyRequest>): Promise<SurveyRequest | undefined> {
    const index = this.surveyRequests.findIndex(req => req.id === id);
    if (index === -1) return undefined;

    this.surveyRequests[index] = {
      ...this.surveyRequests[index],
      ...requestData,
      updatedAt: new Date(),
    };

    return this.surveyRequests[index];
  }

  // Survey Points methods
  async getSurveyPoints(requestId: string): Promise<SurveyPoint[]> {
    return this.surveyPoints.filter(point => point.requestId === requestId);
  }

  async createSurveyPoint(pointData: InsertSurveyPoint): Promise<SurveyPoint> {
    const point: SurveyPoint = {
      id: randomUUID(),
      elevation: null,
      accuracy: 0.02,
      notes: null,
      photos: [],
      ...pointData,
      capturedAt: new Date(),
    };
    this.surveyPoints.push(point);
    return point;
  }

  async deleteSurveyPoint(id: string): Promise<boolean> {
    const index = this.surveyPoints.findIndex(point => point.id === id);
    if (index === -1) return false;
    this.surveyPoints.splice(index, 1);
    return true;
  }

  // Survey Lines methods
  async getSurveyLines(requestId: string): Promise<SurveyLine[]> {
    return this.surveyLines.filter(line => line.requestId === requestId);
  }

  async createSurveyLine(lineData: InsertSurveyLine): Promise<SurveyLine> {
    const line: SurveyLine = {
      id: randomUUID(),
      startPointId: null,
      endPointId: null,
      length: null,
      notes: null,
      ...lineData,
      createdAt: new Date(),
    };
    this.surveyLines.push(line);
    return line;
  }

  async deleteSurveyLine(id: string): Promise<boolean> {
    const index = this.surveyLines.findIndex(line => line.id === id);
    if (index === -1) return false;
    this.surveyLines.splice(index, 1);
    return true;
  }

  // Survey Polygons methods
  async getSurveyPolygons(requestId: string): Promise<SurveyPolygon[]> {
    return this.surveyPolygons.filter(polygon => polygon.requestId === requestId);
  }

  async createSurveyPolygon(polygonData: InsertSurveyPolygon): Promise<SurveyPolygon> {
    const polygon: SurveyPolygon = {
      id: randomUUID(),
      area: null,
      perimeter: null,
      notes: null,
      ...polygonData,
      createdAt: new Date(),
    };
    this.surveyPolygons.push(polygon);
    return polygon;
  }

  async deleteSurveyPolygon(id: string): Promise<boolean> {
    const index = this.surveyPolygons.findIndex(polygon => polygon.id === id);
    if (index === -1) return false;
    this.surveyPolygons.splice(index, 1);
    return true;
  }

  // Survey Sessions methods
  async getSurveySession(requestId: string): Promise<SurveySession | undefined> {
    return this.surveySessions.find(session => session.requestId === requestId);
  }

  async createSurveySession(sessionData: InsertSurveySession): Promise<SurveySession> {
    const session: SurveySession = {
      id: randomUUID(),
      endTime: null,
      gpsAccuracy: null,
      satelliteCount: null,
      instrumentUsed: null,
      weatherConditions: null,
      isActive: true,
      ...sessionData,
      startTime: new Date(),
    };
    this.surveySessions.push(session);
    return session;
  }

  async updateSurveySession(id: string, sessionData: Partial<SurveySession>): Promise<SurveySession | undefined> {
    const index = this.surveySessions.findIndex(session => session.id === id);
    if (index === -1) return undefined;

    this.surveySessions[index] = {
      ...this.surveySessions[index],
      ...sessionData,
    };

    return this.surveySessions[index];
  }

  // Review Comments methods
  async getReviewComments(requestId: string): Promise<ReviewComment[]> {
    return this.reviewComments.filter(comment => comment.requestId === requestId);
  }

  async createReviewComment(commentData: InsertReviewComment): Promise<ReviewComment> {
    const comment: ReviewComment = {
      id: randomUUID(),
      ...commentData,
      createdAt: new Date(),
    };
    this.reviewComments.push(comment);
    return comment;
  }

  // Citizens methods
  async getCitizens(): Promise<Citizen[]> {
    return this.citizens;
  }

  async getCitizen(id: string): Promise<Citizen | undefined> {
    return this.citizens.find(citizen => citizen.id === id);
  }

  async getCitizenByNationalId(nationalId: string): Promise<Citizen | undefined> {
    return this.citizens.find(citizen => citizen.nationalId === nationalId);
  }

  async createCitizen(citizenData: InsertCitizen): Promise<Citizen> {
    const citizen: Citizen = {
      id: randomUUID(),
      status: "active",
      totalRequests: 0,
      ...citizenData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.citizens.push(citizen);
    return citizen;
  }

  async updateCitizen(id: string, citizenData: Partial<Citizen>): Promise<Citizen | undefined> {
    const index = this.citizens.findIndex(citizen => citizen.id === id);
    if (index === -1) return undefined;
    
    this.citizens[index] = {
      ...this.citizens[index],
      ...citizenData,
      updatedAt: new Date(),
    };
    
    return this.citizens[index];
  }

  // Engineering Offices methods
  async getEngineeringOffices(): Promise<EngineeringOffice[]> {
    return this.engineeringOffices;
  }

  async getEngineeringOffice(id: string): Promise<EngineeringOffice | undefined> {
    return this.engineeringOffices.find(office => office.id === id);
  }

  async createEngineeringOffice(officeData: InsertEngineeringOffice): Promise<EngineeringOffice> {
    const office: EngineeringOffice = {
      id: randomUUID(),
      status: "pending",
      rating: 0,
      totalProjects: 0,
      activeProjects: 0,
      establishedDate: null,
      approvedDate: null,
      email: null,
      specializations: [],
      ...officeData,
      createdAt: new Date(),
      updatedAt: new Date(),
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

  // Contractors methods
  async getContractors(): Promise<Contractor[]> {
    return this.contractors;
  }

  async getContractor(id: string): Promise<Contractor | undefined> {
    return this.contractors.find(contractor => contractor.id === id);
  }

  async createContractor(contractorData: InsertContractor): Promise<Contractor> {
    const contractor: Contractor = {
      id: randomUUID(),
      status: "pending",
      rating: 0,
      totalProjects: 0,
      activeProjects: 0,
      maxProjectValue: null,
      establishedDate: null,
      approvedDate: null,
      email: null,
      specializations: [],
      ...contractorData,
      createdAt: new Date(),
      updatedAt: new Date(),
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

  // Building Permits methods
  async getBuildingPermits(): Promise<BuildingPermit[]> {
    return this.buildingPermits;
  }

  async getBuildingPermit(id: string): Promise<BuildingPermit | undefined> {
    return this.buildingPermits.find(permit => permit.id === id);
  }

  async createBuildingPermit(permitData: InsertBuildingPermit): Promise<BuildingPermit> {
    const permitNumber = `BP-${new Date().getFullYear()}-${String(this.buildingPermits.length + 1).padStart(4, '0')}`;
    
    const permit: BuildingPermit = {
      id: randomUUID(),
      permitNumber,
      status: "submitted",
      priority: "normal",
      submitDate: new Date(),
      fees: this.calculatePermitFees(permitData.buildingArea, permitData.projectType),
      paidAmount: 0,
      paymentStatus: "pending",
      documents: [],
      ...permitData,
      createdAt: new Date(),
      updatedAt: new Date(),
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

  private calculatePermitFees(buildingArea: number, projectType: string): number {
    // Fee calculation based on Yemeni building regulations
    const baseRatePerSqm = projectType === "commercial" ? 150 : 100; // YER per square meter
    const baseFee = buildingArea * baseRatePerSqm;
    
    // Additional fees
    const administrativeFee = 25000; // Fixed administrative fee
    const inspectionFee = 15000; // Fixed inspection fee
    
    return baseFee + administrativeFee + inspectionFee;
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
      permitNumber: `BP-2025-${String(this.buildingPermits.length + 1).padStart(4, '0')}`,
      status: "submitted",
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
      ...permitData,
      submitDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
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

  // Occupancy Certificates methods
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
      status: "submitted",
      buildingPermitId: null,
      coordinates: null,
      inspectionDate: null,
      inspectorName: null,
      safetyCompliance: false,
      structuralCompliance: false,
      fireCompliante: false,
      electricalCompliance: false,
      plumbingCompliance: false,
      issueDate: null,
      expiryDate: null,
      issuedBy: null,
      inspectionNotes: null,
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

  // Violation Reports methods
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
      inspectorName: null,
      inspectionDate: null,
      resolution: null,
      fineAmount: null,
      paidAmount: 0,
      paymentStatus: "pending",
      resolvedDate: null,
      ...reportData,
      reportDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
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

  // Payment Transactions methods
  async getPaymentTransactions(): Promise<PaymentTransaction[]> {
    return this.paymentTransactions;
  }

  // Authentication and user management methods - Phase 4
  async getUser(userId: string): Promise<User | undefined> {
    return this.users.find(user => user.id === userId);
  }

  async getUserByNationalId(nationalId: string): Promise<User | undefined> {
    return this.users.find(user => user.nationalId === nationalId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateData,
      updatedAt: new Date(),
    };
    return this.users[userIndex];
  }

  async createUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const newSession: UserSession = {
      id: `session-${Date.now()}`,
      ...sessionData,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };
    this.userSessions.push(newSession);
    return newSession;
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    return this.userSessions.find(session => session.id === sessionId);
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return this.userSessions.filter(session => session.userId === userId);
  }

  async updateSessionAccess(sessionId: string): Promise<void> {
    const sessionIndex = this.userSessions.findIndex(session => session.id === sessionId);
    if (sessionIndex !== -1) {
      this.userSessions[sessionIndex].lastAccessedAt = new Date();
    }
  }

  async deactivateUserSession(sessionId: string): Promise<void> {
    const sessionIndex = this.userSessions.findIndex(session => session.id === sessionId);
    if (sessionIndex !== -1) {
      this.userSessions[sessionIndex].isActive = false;
    }
  }

  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      ...logData,
      createdAt: new Date(),
    };
    this.auditLogs.push(newLog);
    return newLog;
  }

  async getAuditLogs(userId?: string): Promise<AuditLog[]> {
    if (userId) {
      return this.auditLogs.filter(log => log.userId === userId);
    }
    return this.auditLogs;
  }

  // Occupancy Certificates methods
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
      buildingPermitId: null,
      applicantNationalId: null,
      coordinates: null,
      basementFloors: 0,
      plotArea: null,
      completionDate: null,
      inspectionDate: null,
      inspectorId: null,
      inspectorName: null,
      inspectionNotes: null,
      violationsFound: [],
      correctiveActions: null,
      issuedDate: null,
      expiryDate: null,
      issuedBy: null,
      sentToUtilities: false,
      utilitiesNotificationDate: null,
      documents: [],
      fees: 0,
      paidAmount: 0,
      paymentStatus: "unpaid",
      ...certData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.occupancyCertificates.push(certificate);
    return certificate;
  }

  async updateOccupancyCertificate(id: string, updateData: Partial<OccupancyCertificate>): Promise<OccupancyCertificate | undefined> {
    const index = this.occupancyCertificates.findIndex(cert => cert.id === id);
    if (index === -1) return undefined;
    
    this.occupancyCertificates[index] = {
      ...this.occupancyCertificates[index],
      ...updateData,
      updatedAt: new Date(),
    };
    return this.occupancyCertificates[index];
  }

  // Inspection Reports methods
  async getInspectionReports(): Promise<InspectionReport[]> {
    return this.inspectionReports;
  }

  async getInspectionReport(id: string): Promise<InspectionReport | undefined> {
    return this.inspectionReports.find(report => report.id === id);
  }

  async createInspectionReport(reportData: InsertInspectionReport): Promise<InspectionReport> {
    const report: InspectionReport = {
      id: randomUUID(),
      reportNumber: `REP-2025-${String(this.inspectionReports.length + 1).padStart(4, '0')}`,
      status: "draft",
      priority: "normal",
      buildingPermitId: null,
      occupancyCertificateId: null,
      contractorName: null,
      engineeringOfficeName: null,
      totalFloors: null,
      inspectedFloors: null,
      buildingArea: null,
      constructionProgress: null,
      coordinates: null,
      violationsFound: [],
      correctiveActions: [],
      recommendations: null,
      nextInspectionDate: null,
      attachments: [],
      assignedDate: null,
      completedDate: null,
      reviewedDate: null,
      reviewedBy: null,
      reviewNotes: null,
      digitalSignature: null,
      certificateGenerated: false,
      notificationsSent: [],
      ...reportData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inspectionReports.push(report);
    return report;
  }

  async updateInspectionReport(id: string, updateData: Partial<InspectionReport>): Promise<InspectionReport | undefined> {
    const index = this.inspectionReports.findIndex(report => report.id === id);
    if (index === -1) return undefined;
    
    this.inspectionReports[index] = {
      ...this.inspectionReports[index],
      ...updateData,
      updatedAt: new Date(),
    };
    return this.inspectionReports[index];
  }

  async assignInspector(reportId: string, inspectorId: string, inspectorName: string): Promise<InspectionReport | undefined> {
    const index = this.inspectionReports.findIndex(report => report.id === reportId);
    if (index === -1) return undefined;
    
    this.inspectionReports[index] = {
      ...this.inspectionReports[index],
      inspectorId,
      inspectorName,
      assignedDate: new Date().toISOString(),
      updatedAt: new Date(),
    };
    return this.inspectionReports[index];
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    return this.paymentTransactions.find(transaction => transaction.id === id);
  }

  async getPaymentsByReference(referenceType: string, referenceId: string): Promise<PaymentTransaction[]> {
    return this.paymentTransactions.filter(
      transaction => transaction.referenceType === referenceType && transaction.referenceId === referenceId
    );
  }

  async createPaymentTransaction(transactionData: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const transaction: PaymentTransaction = {
      id: randomUUID(),
      transactionId: `TXN-2025-${String(this.paymentTransactions.length + 1).padStart(4, '0')}`,
      status: "pending",
      currency: "YER",
      paymentGateway: null,
      gatewayTransactionId: null,
      paidAt: null,
      description: null,
      receiptNumber: null,
      processedBy: null,
      notes: null,
      payerContact: null,
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentTransactions.push(transaction);
    return transaction;
  }

  async updatePaymentTransaction(id: string, transactionData: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined> {
    const index = this.paymentTransactions.findIndex(transaction => transaction.id === id);
    if (index === -1) return undefined;
    
    this.paymentTransactions[index] = {
      ...this.paymentTransactions[index],
      ...transactionData,
      updatedAt: new Date(),
    };
    
    return this.paymentTransactions[index];
  }

  // Enhanced Statistics methods
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
    const newRequests = this.surveyRequests.filter(req => req.status === "submitted").length;
    const inProgress = this.surveyRequests.filter(req => req.status === "in_progress").length;
    const underReview = this.surveyRequests.filter(req => req.status === "under_review").length;
    const completed = this.surveyRequests.filter(req => req.status === "completed").length;
    
    const totalCitizens = this.citizens.length;
    const activeBuildingPermits = this.buildingPermits.filter(permit => permit.status === "approved").length;
    const pendingPermits = this.buildingPermits.filter(permit => permit.status === "submitted").length;
    const totalRevenue = this.paymentTransactions
      .filter(payment => payment.status === "completed")
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      newRequests,
      inProgress,
      underReview,
      completed,
      totalCitizens,
      activeBuildingPermits,
      pendingPermits,
      totalRevenue,
    };
  }
}

export const storage = new MemStorage();