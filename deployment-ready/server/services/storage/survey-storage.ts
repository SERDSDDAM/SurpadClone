/**
 * Survey Storage Module - يدير جميع عمليات المسح والبيانات الجيومكانية
 * مسؤول عن: Survey Requests, Points, Lines, Polygons, Sessions, Reviews
 */

import { randomUUID } from "crypto";
import {
  type SurveyRequest, type InsertSurveyRequest,
  type Surveyor, type InsertSurveyor,
  type SurveyPoint, type InsertSurveyPoint,
  type SurveyLine, type InsertSurveyLine,
  type SurveyPolygon, type InsertSurveyPolygon,
  type SurveySession, type InsertSurveySession,
  type ReviewComment, type InsertReviewComment,
} from "@shared/schema";

export class SurveyStorageService {
  private surveyRequests: SurveyRequest[] = [];
  private surveyors: Surveyor[] = [];
  private surveyPoints: SurveyPoint[] = [];
  private surveyLines: SurveyLine[] = [];
  private surveyPolygons: SurveyPolygon[] = [];
  private surveySessions: SurveySession[] = [];
  private reviewComments: ReviewComment[] = [];

  constructor() {
    this.initializeTestData();
  }

  // ================================
  // Survey Requests Management
  // ================================
  
  async getSurveyRequests(): Promise<SurveyRequest[]> {
    return this.surveyRequests;
  }

  async getSurveyRequest(id: string): Promise<SurveyRequest | undefined> {
    return this.surveyRequests.find(request => request.id === id);
  }

  async createSurveyRequest(requestData: InsertSurveyRequest): Promise<SurveyRequest> {
    const request: SurveyRequest = {
      id: randomUUID(),
      requestNumber: `SR-2025-${String(this.surveyRequests.length + 1).padStart(4, '0')}`,
      status: "submitted",
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
      assignedAt: null,
      completedAt: null,
      reviewedAt: null,
      title: "",
      ownerName: "",
      region: "",
      location: "",
      requestType: "field_survey",
      applicantName: "",
      propertyType: "residential",
      buildingType: null,
      plotArea: null,
      governorate: "",
      directorate: "",
      neighborhood: "",
      coordinates: null,
      assignedSurveyor: null,
      priority: "normal",
      estimatedDuration: null,
      actualDuration: null,
      qcStatus: "pending",
      qcComments: null,
      finalReport: null,
      approvedBy: null,
      notes: null,
      ...requestData,
    };
    this.surveyRequests.push(request);
    return request;
  }

  async updateSurveyRequest(id: string, requestData: Partial<SurveyRequest>): Promise<SurveyRequest | undefined> {
    const index = this.surveyRequests.findIndex(request => request.id === id);
    if (index === -1) return undefined;
    
    this.surveyRequests[index] = {
      ...this.surveyRequests[index],
      ...requestData,
      updatedAt: new Date(),
    };
    
    return this.surveyRequests[index];
  }

  // ================================
  // Surveyors Management  
  // ================================

  async getSurveyors(): Promise<Surveyor[]> {
    return this.surveyors;
  }

  async getSurveyor(id: string): Promise<Surveyor | undefined> {
    return this.surveyors.find(surveyor => surveyor.id === id);
  }

  async createSurveyor(surveyorData: InsertSurveyor): Promise<Surveyor> {
    const surveyor: Surveyor = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActive: new Date(),
      name: "",
      employeeNumber: "",
      title: "",
      department: null,
      specialization: null,
      experience: null,
      phone: null,
      email: null,
      status: "active",
      workload: 0,
      assignedRequests: 0,
      completedRequests: 0,
      rating: null,
      certifications: [],
      availability: true,
      ...surveyorData,
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

  // ================================
  // Survey Data (Points, Lines, Polygons)
  // ================================

  async getSurveyPoints(requestId: string): Promise<SurveyPoint[]> {
    return this.surveyPoints.filter(point => point.requestId === requestId);
  }

  async createSurveyPoint(pointData: InsertSurveyPoint): Promise<SurveyPoint> {
    const point: SurveyPoint = {
      id: randomUUID(),
      createdAt: new Date(),
      ...pointData,
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

  async getSurveyLines(requestId: string): Promise<SurveyLine[]> {
    return this.surveyLines.filter(line => line.requestId === requestId);
  }

  async createSurveyLine(lineData: InsertSurveyLine): Promise<SurveyLine> {
    const line: SurveyLine = {
      id: randomUUID(),
      createdAt: new Date(),
      ...lineData,
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

  async getSurveyPolygons(requestId: string): Promise<SurveyPolygon[]> {
    return this.surveyPolygons.filter(polygon => polygon.requestId === requestId);
  }

  async createSurveyPolygon(polygonData: InsertSurveyPolygon): Promise<SurveyPolygon> {
    const polygon: SurveyPolygon = {
      id: randomUUID(),
      createdAt: new Date(),
      ...polygonData,
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

  // ================================
  // Survey Sessions & Review Comments
  // ================================

  async getSurveySession(requestId: string): Promise<SurveySession | undefined> {
    return this.surveySessions.find(session => session.requestId === requestId);
  }

  async createSurveySession(sessionData: InsertSurveySession): Promise<SurveySession> {
    const session: SurveySession = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      startTime: new Date(),
      endTime: null,
      status: "active",
      surveyorId: "",
      requestId: "",
      deviceInfo: null,
      gpsAccuracy: null,
      conditions: null,
      notes: null,
      ...sessionData,
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
      updatedAt: new Date(),
    };
    
    return this.surveySessions[index];
  }

  async getReviewComments(requestId: string): Promise<ReviewComment[]> {
    return this.reviewComments.filter(comment => comment.requestId === requestId);
  }

  async createReviewComment(commentData: InsertReviewComment): Promise<ReviewComment> {
    const comment: ReviewComment = {
      id: randomUUID(),
      createdAt: new Date(),
      ...commentData,
    };
    this.reviewComments.push(comment);
    return comment;
  }

  // ================================
  // Test Data Initialization
  // ================================

  private initializeTestData() {
    // إضافة بيانات العينة للاختبار
    this.surveyRequests.push({
      id: "sample-request-001",
      requestNumber: "SR-2025-001",
      title: "مسح ميداني تجريبي",
      location: "صنعاء - معين",
      status: "field_survey_in_progress",
      applicantName: "أحمد محمد علي",
      propertyType: "residential",
      governorate: "صنعاء",
      directorate: "معين",
      neighborhood: "السبعين",
      createdAt: new Date(),
      updatedAt: new Date(),
      submittedAt: new Date(),
      assignedAt: null,
      completedAt: null,
      reviewedAt: null,
      ownerName: "أحمد محمد علي",
      region: "صنعاء",
      requestType: "field_survey",
      buildingType: null,
      plotArea: null,
      coordinates: null,
      assignedSurveyor: null,
      priority: "normal",
      estimatedDuration: null,
      actualDuration: null,
      qcStatus: "pending",
      qcComments: null,
      finalReport: null,
      approvedBy: null,
      notes: null,
    });

    // إضافة بيانات تجريبية للخطوط والمضلعات
    this.surveyLines.push({
      id: "test-line-1",
      requestId: "sample-request-001",
      featureCode: "survey-line",
      points: [
        { id: "l1", latitude: 15.37, longitude: 44.18, featureCode: "test" },
        { id: "l2", latitude: 15.38, longitude: 44.19, featureCode: "test" }
      ],
      createdAt: new Date("2025-09-03T22:42:27.105Z")
    });

    this.surveyPolygons.push({
      id: "test-polygon-1",
      requestId: "sample-request-001",
      featureCode: "survey-polygon",
      points: [
        { id: "p1", latitude: 15.36, longitude: 44.17, featureCode: "test" },
        { id: "p2", latitude: 15.37, longitude: 44.18, featureCode: "test" },
        { id: "p3", latitude: 15.38, longitude: 44.17, featureCode: "test" }
      ],
      area: 100,
      createdAt: new Date("2025-09-03T22:42:27.122Z")
    });
  }
}