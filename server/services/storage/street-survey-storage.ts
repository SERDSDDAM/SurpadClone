/**
 * Street Survey Service Storage Implementation - خدمة الإسقاط المساحي
 * تنفيذ قاعدة البيانات لنموذج "الفرع التنفيذي/المكتب الإشرافي"
 */

import { db } from "../../db";
import { 
  streetStatusDecisions, 
  branchPeriodicReports,
  type StreetStatusDecision,
  type BranchPeriodicReport,
  type InsertStreetStatusDecision,
  type InsertBranchPeriodicReport 
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc, count, gt } from "drizzle-orm";

export class StreetSurveyStorage {
  
  // ================================
  // Street Status Decisions
  // ================================
  
  async getStreetStatusDecisions(): Promise<StreetStatusDecision[]> {
    return await db.select().from(streetStatusDecisions).orderBy(desc(streetStatusDecisions.createdAt));
  }
  
  async getStreetStatusDecision(id: string): Promise<StreetStatusDecision | undefined> {
    const [decision] = await db
      .select()
      .from(streetStatusDecisions)
      .where(eq(streetStatusDecisions.id, id));
    return decision;
  }
  
  async createStreetStatusDecision(decision: InsertStreetStatusDecision): Promise<StreetStatusDecision> {
    const [created] = await db
      .insert(streetStatusDecisions)
      .values(decision)
      .returning();
    return created;
  }
  
  async updateStreetStatusDecision(id: string, updates: Partial<StreetStatusDecision>): Promise<StreetStatusDecision | undefined> {
    const [updated] = await db
      .update(streetStatusDecisions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(streetStatusDecisions.id, id))
      .returning();
    return updated;
  }
  
  async getStreetStatusDecisionsByBranch(branchOffice: string): Promise<StreetStatusDecision[]> {
    return await db
      .select()
      .from(streetStatusDecisions)
      .where(eq(streetStatusDecisions.branchOffice, branchOffice))
      .orderBy(desc(streetStatusDecisions.createdAt));
  }
  
  async getStreetStatusDecisionsByStatus(status: string): Promise<StreetStatusDecision[]> {
    return await db
      .select()
      .from(streetStatusDecisions)
      .where(eq(streetStatusDecisions.status, status))
      .orderBy(desc(streetStatusDecisions.createdAt));
  }
  
  async escalateStreetStatusDecision(id: string, escalationReason: string): Promise<StreetStatusDecision | undefined> {
    const [escalated] = await db
      .update(streetStatusDecisions)
      .set({ 
        escalationLevel: 1,
        escalationReason: escalationReason,
        lastEscalatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(streetStatusDecisions.id, id))
      .returning();
    return escalated;
  }
  
  async submitStreetDecisionAppeal(id: string, appealNotes: string): Promise<StreetStatusDecision | undefined> {
    const [appealed] = await db
      .update(streetStatusDecisions)
      .set({ 
        appealStatus: "submitted",
        appealNotes: appealNotes,
        updatedAt: new Date()
      })
      .where(eq(streetStatusDecisions.id, id))
      .returning();
    return appealed;
  }
  
  // ================================
  // Branch Periodic Reports
  // ================================
  
  async getBranchPeriodicReports(): Promise<BranchPeriodicReport[]> {
    return await db.select().from(branchPeriodicReports).orderBy(desc(branchPeriodicReports.createdAt));
  }
  
  async getBranchPeriodicReport(id: string): Promise<BranchPeriodicReport | undefined> {
    const [report] = await db
      .select()
      .from(branchPeriodicReports)
      .where(eq(branchPeriodicReports.id, id));
    return report;
  }
  
  async createBranchPeriodicReport(report: InsertBranchPeriodicReport): Promise<BranchPeriodicReport> {
    const [created] = await db
      .insert(branchPeriodicReports)
      .values(report)
      .returning();
    return created;
  }
  
  async updateBranchPeriodicReport(id: string, updates: Partial<BranchPeriodicReport>): Promise<BranchPeriodicReport | undefined> {
    const [updated] = await db
      .update(branchPeriodicReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(branchPeriodicReports.id, id))
      .returning();
    return updated;
  }
  
  async getBranchReportsByOffice(branchOffice: string): Promise<BranchPeriodicReport[]> {
    return await db
      .select()
      .from(branchPeriodicReports)
      .where(eq(branchPeriodicReports.branchOffice, branchOffice))
      .orderBy(desc(branchPeriodicReports.createdAt));
  }
  
  async getBranchReportsByPeriod(reportType: string, reportPeriod: string): Promise<BranchPeriodicReport[]> {
    return await db
      .select()
      .from(branchPeriodicReports)
      .where(
        and(
          eq(branchPeriodicReports.reportType, reportType),
          eq(branchPeriodicReports.reportPeriod, reportPeriod)
        )
      )
      .orderBy(desc(branchPeriodicReports.createdAt));
  }
  
  async submitBranchReportToSupervisory(id: string): Promise<BranchPeriodicReport | undefined> {
    const [submitted] = await db
      .update(branchPeriodicReports)
      .set({ 
        submittedToSupervisory: true,
        submittedAt: new Date(),
        reportStatus: "submitted",
        updatedAt: new Date()
      })
      .where(eq(branchPeriodicReports.id, id))
      .returning();
    return submitted;
  }
  
  async approveBranchReport(id: string, supervisoryFeedback?: string): Promise<BranchPeriodicReport | undefined> {
    const [approved] = await db
      .update(branchPeriodicReports)
      .set({ 
        approvedBySupervisory: true,
        supervisoryFeedback: supervisoryFeedback,
        approvedAt: new Date(),
        reportStatus: "approved",
        updatedAt: new Date()
      })
      .where(eq(branchPeriodicReports.id, id))
      .returning();
    return approved;
  }
  
  // ================================
  // Analytics and Dashboard
  // ================================
  
  async getStreetDecisionStats(): Promise<any> {
    // إحصائيات القرارات المساحية
    const [totalDecisions] = await db
      .select({ count: count() })
      .from(streetStatusDecisions);
    
    const [pendingDecisions] = await db
      .select({ count: count() })
      .from(streetStatusDecisions)
      .where(eq(streetStatusDecisions.status, "under_review"));
    
    const [approvedDecisions] = await db
      .select({ count: count() })
      .from(streetStatusDecisions)
      .where(eq(streetStatusDecisions.status, "approved"));
    
    const [escalatedDecisions] = await db
      .select({ count: count() })
      .from(streetStatusDecisions)
      .where(gt(streetStatusDecisions.escalationLevel, 0));
    
    return {
      total: totalDecisions.count,
      pending: pendingDecisions.count,
      approved: approvedDecisions.count,
      escalated: escalatedDecisions.count,
      completionRate: totalDecisions.count > 0 ? 
        ((approvedDecisions.count / totalDecisions.count) * 100).toFixed(1) : 0
    };
  }
  
  async getBranchPerformanceAnalytics(branchOffice: string): Promise<any> {
    // تحليل أداء الفرع
    const [totalReports] = await db
      .select({ count: count() })
      .from(branchPeriodicReports)
      .where(eq(branchPeriodicReports.branchOffice, branchOffice));
    
    const [submittedReports] = await db
      .select({ count: count() })
      .from(branchPeriodicReports)
      .where(
        and(
          eq(branchPeriodicReports.branchOffice, branchOffice),
          eq(branchPeriodicReports.submittedToSupervisory, true)
        )
      );
    
    const [approvedReports] = await db
      .select({ count: count() })
      .from(branchPeriodicReports)
      .where(
        and(
          eq(branchPeriodicReports.branchOffice, branchOffice),
          eq(branchPeriodicReports.approvedBySupervisory, true)
        )
      );
    
    return {
      branchOffice,
      totalReports: totalReports.count,
      submittedReports: submittedReports.count,
      approvedReports: approvedReports.count,
      submissionRate: totalReports.count > 0 ? 
        ((submittedReports.count / totalReports.count) * 100).toFixed(1) : 0,
      approvalRate: submittedReports.count > 0 ? 
        ((approvedReports.count / submittedReports.count) * 100).toFixed(1) : 0
    };
  }
  
  async getEscalationTrends(): Promise<any> {
    // اتجاهات التصعيد
    const [totalEscalations] = await db
      .select({ count: count() })
      .from(streetStatusDecisions)
      .where(gt(streetStatusDecisions.escalationLevel, 0));
    
    const [resolvedEscalations] = await db
      .select({ count: count() })
      .from(streetStatusDecisions)
      .where(eq(streetStatusDecisions.status, "approved"));
    
    return {
      totalEscalations: totalEscalations.count,
      resolvedEscalations: resolvedEscalations.count,
      resolutionRate: totalEscalations.count > 0 ? 
        ((resolvedEscalations.count / totalEscalations.count) * 100).toFixed(1) : 0
    };
  }
  
  async getProcessingTimeAnalytics(): Promise<any> {
    // تحليل أوقات المعالجة
    const recentDecisions = await db
      .select({
        id: streetStatusDecisions.id,
        createdAt: streetStatusDecisions.createdAt,
        updatedAt: streetStatusDecisions.updatedAt,
        status: streetStatusDecisions.status
      })
      .from(streetStatusDecisions)
      .where(eq(streetStatusDecisions.status, "approved"))
      .limit(100);
    
    if (recentDecisions.length === 0) {
      return {
        averageProcessingTime: 0,
        minProcessingTime: 0,
        maxProcessingTime: 0,
        totalProcessed: 0
      };
    }
    
    const processingTimes = recentDecisions.map(decision => {
      const created = decision.createdAt ? new Date(decision.createdAt) : new Date();
      const updated = decision.updatedAt ? new Date(decision.updatedAt) : new Date();
      return Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60)); // hours
    });
    
    const avgTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    const minTime = Math.min(...processingTimes);
    const maxTime = Math.max(...processingTimes);
    
    return {
      averageProcessingTime: Math.round(avgTime),
      minProcessingTime: minTime,
      maxProcessingTime: maxTime,
      totalProcessed: recentDecisions.length
    };
  }
}