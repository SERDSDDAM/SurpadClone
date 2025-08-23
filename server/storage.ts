import {
  type SurveyRequest,
  type InsertSurveyRequest,
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
  private surveyRequests: Map<string, SurveyRequest>;
  private surveyPoints: Map<string, SurveyPoint>;
  private surveyLines: Map<string, SurveyLine>;
  private surveyPolygons: Map<string, SurveyPolygon>;
  private surveySessions: Map<string, SurveySession>;
  private reviewComments: Map<string, ReviewComment>;

  constructor() {
    this.surveyRequests = new Map();
    this.surveyPoints = new Map();
    this.surveyLines = new Map();
    this.surveyPolygons = new Map();
    this.surveySessions = new Map();
    this.reviewComments = new Map();

    // Initialize with some data
    this.initializeData();
  }

  private initializeData() {
    // Create sample survey requests
    const request1: SurveyRequest = {
      id: randomUUID(),
      requestNumber: "QMS-2024-001",
      ownerName: "محمد علي أحمد",
      region: "صنعاء - الأزبكي",
      assignedSurveyor: "أحمد المساحي",
      status: "surveying",
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: [],
      notes: null,
    };

    const request2: SurveyRequest = {
      id: randomUUID(),
      requestNumber: "QMS-2024-002",
      ownerName: "فاطمة حسن محمد",
      region: "تعز - الحصب",
      assignedSurveyor: "سالم المهندس",
      status: "under_review",
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: [],
      notes: null,
    };

    // Add sample request for field app testing
    const request3: SurveyRequest = {
      id: "sample-request-001",
      requestNumber: "QMS-2024-003",
      ownerName: "عبدالله محمد الحمادي",
      region: "صنعاء - شارع الستين",
      assignedSurveyor: "المساح محمد الشامي",
      status: "assigned",
      createdAt: new Date(2025, 0, 10),
      updatedAt: new Date(2025, 0, 15),
      documents: [],
      notes: "طلب مسح أرض تجارية في شارع الستين",
    };

    this.surveyRequests.set(request1.id, request1);
    this.surveyRequests.set(request2.id, request2);
    this.surveyRequests.set(request3.id, request3);

    // Add sample review comment
    const sampleComment: ReviewComment = {
      id: "comment-001",
      requestId: "sample-request-001",
      reviewerName: "مراجع فني أحمد الصالحي",
      comment: "يرجى التأكد من دقة قياسات الحدود الشرقية للقطعة",
      status: "pending",
      createdAt: new Date(2025, 0, 18)
    };

    this.reviewComments.set(sampleComment.id, sampleComment);
  }

  // Survey Requests
  async getSurveyRequests(): Promise<SurveyRequest[]> {
    return Array.from(this.surveyRequests.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getSurveyRequest(id: string): Promise<SurveyRequest | undefined> {
    return this.surveyRequests.get(id);
  }

  async createSurveyRequest(insertRequest: InsertSurveyRequest): Promise<SurveyRequest> {
    const id = randomUUID();
    const request: SurveyRequest = {
      ...insertRequest,
      id,
      status: insertRequest.status || "submitted",
      assignedSurveyor: insertRequest.assignedSurveyor || null,
      documents: insertRequest.documents || [],
      notes: insertRequest.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.surveyRequests.set(id, request);
    return request;
  }

  async updateSurveyRequest(id: string, updates: Partial<SurveyRequest>): Promise<SurveyRequest | undefined> {
    const existing = this.surveyRequests.get(id);
    if (!existing) return undefined;

    const updated: SurveyRequest = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.surveyRequests.set(id, updated);
    return updated;
  }

  // Survey Points
  async getSurveyPoints(requestId: string): Promise<SurveyPoint[]> {
    return Array.from(this.surveyPoints.values())
      .filter(point => point.requestId === requestId)
      .sort((a, b) => (a.capturedAt?.getTime() || 0) - (b.capturedAt?.getTime() || 0));
  }

  async createSurveyPoint(insertPoint: InsertSurveyPoint): Promise<SurveyPoint> {
    const id = randomUUID();
    const point: SurveyPoint = {
      ...insertPoint,
      id,
      elevation: insertPoint.elevation || null,
      accuracy: insertPoint.accuracy || null,
      notes: insertPoint.notes || null,
      photos: insertPoint.photos || [],
      capturedAt: new Date(),
    };
    this.surveyPoints.set(id, point);
    return point;
  }

  async deleteSurveyPoint(id: string): Promise<boolean> {
    return this.surveyPoints.delete(id);
  }

  // Survey Lines
  async getSurveyLines(requestId: string): Promise<SurveyLine[]> {
    return Array.from(this.surveyLines.values())
      .filter(line => line.requestId === requestId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createSurveyLine(insertLine: InsertSurveyLine): Promise<SurveyLine> {
    const id = randomUUID();
    const line: SurveyLine = {
      ...insertLine,
      id,
      length: insertLine.length || null,
      notes: insertLine.notes || null,
      startPointId: insertLine.startPointId || null,
      endPointId: insertLine.endPointId || null,
      createdAt: new Date(),
    };
    this.surveyLines.set(id, line);
    return line;
  }

  async deleteSurveyLine(id: string): Promise<boolean> {
    return this.surveyLines.delete(id);
  }

  // Survey Polygons
  async getSurveyPolygons(requestId: string): Promise<SurveyPolygon[]> {
    return Array.from(this.surveyPolygons.values())
      .filter(polygon => polygon.requestId === requestId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createSurveyPolygon(insertPolygon: InsertSurveyPolygon): Promise<SurveyPolygon> {
    const id = randomUUID();
    const polygon: SurveyPolygon = {
      ...insertPolygon,
      id,
      area: insertPolygon.area || null,
      perimeter: insertPolygon.perimeter || null,
      notes: insertPolygon.notes || null,
      createdAt: new Date(),
    };
    this.surveyPolygons.set(id, polygon);
    return polygon;
  }

  async deleteSurveyPolygon(id: string): Promise<boolean> {
    return this.surveyPolygons.delete(id);
  }

  // Survey Sessions
  async getSurveySession(requestId: string): Promise<SurveySession | undefined> {
    return Array.from(this.surveySessions.values())
      .find(session => session.requestId === requestId && session.isActive);
  }

  async createSurveySession(insertSession: InsertSurveySession): Promise<SurveySession> {
    const id = randomUUID();
    const session: SurveySession = {
      ...insertSession,
      id,
      endTime: insertSession.endTime || null,
      gpsAccuracy: insertSession.gpsAccuracy || null,
      satelliteCount: insertSession.satelliteCount || null,
      instrumentUsed: insertSession.instrumentUsed || null,
      weatherConditions: insertSession.weatherConditions || null,
      isActive: insertSession.isActive !== undefined ? insertSession.isActive : true,
      startTime: new Date(),
    };
    this.surveySessions.set(id, session);
    return session;
  }

  async updateSurveySession(id: string, updates: Partial<SurveySession>): Promise<SurveySession | undefined> {
    const existing = this.surveySessions.get(id);
    if (!existing) return undefined;

    const updated: SurveySession = {
      ...existing,
      ...updates,
    };
    this.surveySessions.set(id, updated);
    return updated;
  }

  // Review Comments
  async getReviewComments(requestId: string): Promise<ReviewComment[]> {
    return Array.from(this.reviewComments.values())
      .filter(comment => comment.requestId === requestId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createReviewComment(insertComment: InsertReviewComment): Promise<ReviewComment> {
    const id = randomUUID();
    const comment: ReviewComment = {
      ...insertComment,
      id,
      createdAt: new Date(),
    };
    this.reviewComments.set(id, comment);
    return comment;
  }

  // Statistics
  async getStats(): Promise<{
    newRequests: number;
    inProgress: number;
    underReview: number;
    completed: number;
  }> {
    const requests = Array.from(this.surveyRequests.values());
    
    return {
      newRequests: requests.filter(r => r.status === "submitted").length,
      inProgress: requests.filter(r => r.status === "surveying").length,
      underReview: requests.filter(r => r.status === "under_review").length,
      completed: requests.filter(r => r.status === "completed" || r.status === "approved").length,
    };
  }
}

export const storage = new MemStorage();
