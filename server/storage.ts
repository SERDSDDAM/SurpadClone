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

  // Statistics
  getStats(): Promise<{
    newRequests: number;
    inProgress: number;
    underReview: number;
    completed: number;
  }>;
}

export class MemStorage implements IStorage {
  private surveyors: Surveyor[] = [];
  private surveyRequests: SurveyRequest[] = [];
  private surveyPoints: SurveyPoint[] = [];
  private surveyLines: SurveyLine[] = [];
  private surveyPolygons: SurveyPolygon[] = [];
  private surveySessions: SurveySession[] = [];
  private reviewComments: ReviewComment[] = [];

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

  // Statistics methods
  async getStats(): Promise<{
    newRequests: number;
    inProgress: number;
    underReview: number;
    completed: number;
  }> {
    const newRequests = this.surveyRequests.filter(req => req.status === "submitted").length;
    const inProgress = this.surveyRequests.filter(req => req.status === "in_progress").length;
    const underReview = this.surveyRequests.filter(req => req.status === "under_review").length;
    const completed = this.surveyRequests.filter(req => req.status === "completed").length;

    return {
      newRequests,
      inProgress,
      underReview,
      completed,
    };
  }
}

export const storage = new MemStorage();