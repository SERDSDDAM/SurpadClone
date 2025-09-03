/**
 * Street Survey Service Routes - خدمة الإسقاط المساحي
 * نموذج "الفرع التنفيذي/المكتب الإشرافي"
 */

import { Router } from "express";
import { storage } from "../storage";
import { 
  insertStreetStatusDecisionSchema,
  insertBranchPeriodicReportSchema,
  type StreetStatusDecision,
  type BranchPeriodicReport 
} from "@shared/schema";
import { toArrayResponse, toObjectResponse, toErrorResponse } from "../adapters/response";

const router = Router();

// ================================
// Street Status Decisions API
// ================================

// Get all street status decisions
router.get("/street-decisions", async (req, res) => {
  try {
    const decisions = await storage.getStreetStatusDecisions();
    res.json(toArrayResponse(decisions));
  } catch (error) {
    console.error("Error fetching street decisions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch street decisions" });
  }
});

// Get street status decision by ID
router.get("/street-decisions/:id", async (req, res) => {
  try {
    const decision = await storage.getStreetStatusDecision(req.params.id);
    if (!decision) {
      return res.status(404).json({ success: false, error: "Street decision not found" });
    }
    res.json(toObjectResponse(decision));
  } catch (error) {
    console.error("Error fetching street decision:", error);
    res.status(500).json({ success: false, error: "Failed to fetch street decision" });
  }
});

// Create new street status decision
router.post("/street-decisions", async (req, res) => {
  try {
    const validatedData = insertStreetStatusDecisionSchema.parse(req.body);
    const decision = await storage.createStreetStatusDecision(validatedData);
    res.status(201).json(toObjectResponse(decision));
  } catch (error) {
    console.error("Error creating street decision:", error);
    res.status(500).json({ success: false, error: "Failed to create street decision" });
  }
});

// Update street status decision
router.put("/street-decisions/:id", async (req, res) => {
  try {
    const decision = await storage.updateStreetStatusDecision(req.params.id, req.body);
    if (!decision) {
      return res.status(404).json({ success: false, error: "Street decision not found" });
    }
    res.json(toObjectResponse(decision));
  } catch (error) {
    console.error("Error updating street decision:", error);
    res.status(500).json({ success: false, error: "Failed to update street decision" });
  }
});

// Get decisions by branch office
router.get("/street-decisions/branch/:branchOffice", async (req, res) => {
  try {
    const decisions = await storage.getStreetStatusDecisionsByBranch(req.params.branchOffice);
    res.json(toArrayResponse(decisions));
  } catch (error) {
    console.error("Error fetching decisions by branch:", error);
    res.status(500).json({ success: false, error: "Failed to fetch decisions by branch" });
  }
});

// Get decisions by status
router.get("/street-decisions/status/:status", async (req, res) => {
  try {
    const decisions = await storage.getStreetStatusDecisionsByStatus(req.params.status);
    res.json(toArrayResponse(decisions));
  } catch (error) {
    console.error("Error fetching decisions by status:", error);
    res.status(500).json({ success: false, error: "Failed to fetch decisions by status" });
  }
});

// Escalate decision to higher level
router.post("/street-decisions/:id/escalate", async (req, res) => {
  try {
    const { escalationReason } = req.body;
    const decision = await storage.escalateStreetStatusDecision(req.params.id, escalationReason);
    if (!decision) {
      return res.status(404).json({ success: false, error: "Street decision not found" });
    }
    res.json(toObjectResponse(decision));
  } catch (error) {
    console.error("Error escalating decision:", error);
    res.status(500).json({ success: false, error: "Failed to escalate decision" });
  }
});

// Submit appeal for decision
router.post("/street-decisions/:id/appeal", async (req, res) => {
  try {
    const { appealNotes } = req.body;
    const decision = await storage.submitStreetDecisionAppeal(req.params.id, appealNotes);
    if (!decision) {
      return res.status(404).json({ success: false, error: "Street decision not found" });
    }
    res.json(toObjectResponse(decision));
  } catch (error) {
    console.error("Error submitting appeal:", error);
    res.status(500).json({ success: false, error: "Failed to submit appeal" });
  }
});

// ================================
// Branch Periodic Reports API
// ================================

// Get all branch reports
router.get("/branch-reports", async (req, res) => {
  try {
    const reports = await storage.getBranchPeriodicReports();
    res.json(toArrayResponse(reports));
  } catch (error) {
    console.error("Error fetching branch reports:", error);
    res.status(500).json({ success: false, error: "Failed to fetch branch reports" });
  }
});

// Get branch report by ID
router.get("/branch-reports/:id", async (req, res) => {
  try {
    const report = await storage.getBranchPeriodicReport(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: "Branch report not found" });
    }
    res.json(toObjectResponse(report));
  } catch (error) {
    console.error("Error fetching branch report:", error);
    res.status(500).json({ success: false, error: "Failed to fetch branch report" });
  }
});

// Create new branch report
router.post("/branch-reports", async (req, res) => {
  try {
    const validatedData = insertBranchPeriodicReportSchema.parse(req.body);
    const report = await storage.createBranchPeriodicReport(validatedData);
    res.status(201).json(toObjectResponse(report));
  } catch (error) {
    console.error("Error creating branch report:", error);
    res.status(500).json({ success: false, error: "Failed to create branch report" });
  }
});

// Update branch report
router.put("/branch-reports/:id", async (req, res) => {
  try {
    const report = await storage.updateBranchPeriodicReport(req.params.id, req.body);
    if (!report) {
      return res.status(404).json({ success: false, error: "Branch report not found" });
    }
    res.json(toObjectResponse(report));
  } catch (error) {
    console.error("Error updating branch report:", error);
    res.status(500).json({ success: false, error: "Failed to update branch report" });
  }
});

// Get reports by branch office
router.get("/branch-reports/branch/:branchOffice", async (req, res) => {
  try {
    const reports = await storage.getBranchReportsByOffice(req.params.branchOffice);
    res.json(toArrayResponse(reports));
  } catch (error) {
    console.error("Error fetching reports by branch:", error);
    res.status(500).json({ success: false, error: "Failed to fetch reports by branch" });
  }
});

// Get reports by period
router.get("/branch-reports/period/:reportType/:reportPeriod", async (req, res) => {
  try {
    const { reportType, reportPeriod } = req.params;
    const reports = await storage.getBranchReportsByPeriod(reportType, reportPeriod);
    res.json(toArrayResponse(reports));
  } catch (error) {
    console.error("Error fetching reports by period:", error);
    res.status(500).json({ success: false, error: "Failed to fetch reports by period" });
  }
});

// Submit report to supervisory office
router.post("/branch-reports/:id/submit", async (req, res) => {
  try {
    const report = await storage.submitBranchReportToSupervisory(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: "Branch report not found" });
    }
    res.json(toObjectResponse(report));
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ success: false, error: "Failed to submit report" });
  }
});

// Approve report (supervisory office action)
router.post("/branch-reports/:id/approve", async (req, res) => {
  try {
    const { supervisoryFeedback } = req.body;
    const report = await storage.approveBranchReport(req.params.id, supervisoryFeedback);
    if (!report) {
      return res.status(404).json({ success: false, error: "Branch report not found" });
    }
    res.json(toObjectResponse(report));
  } catch (error) {
    console.error("Error approving report:", error);
    res.status(500).json({ success: false, error: "Failed to approve report" });
  }
});

// ================================
// Analytics and Dashboard APIs
// ================================

// Get street decisions dashboard stats
router.get("/dashboard/street-decisions-stats", async (req, res) => {
  try {
    const stats = await storage.getStreetDecisionStats();
    res.json(toObjectResponse(stats));
  } catch (error) {
    console.error("Error fetching street decision stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch street decision stats" });
  }
});

// Get branch performance analytics
router.get("/dashboard/branch-performance/:branchOffice", async (req, res) => {
  try {
    const performance = await storage.getBranchPerformanceAnalytics(req.params.branchOffice);
    res.json(toObjectResponse(performance));
  } catch (error) {
    console.error("Error fetching branch performance:", error);
    res.status(500).json({ success: false, error: "Failed to fetch branch performance" });
  }
});

// Get escalation trends
router.get("/dashboard/escalation-trends", async (req, res) => {
  try {
    const trends = await storage.getEscalationTrends();
    res.json(toObjectResponse(trends));
  } catch (error) {
    console.error("Error fetching escalation trends:", error);
    res.status(500).json({ success: false, error: "Failed to fetch escalation trends" });
  }
});

// Get processing time analytics
router.get("/dashboard/processing-times", async (req, res) => {
  try {
    const times = await storage.getProcessingTimeAnalytics();
    res.json(toObjectResponse(times));
  } catch (error) {
    console.error("Error fetching processing times:", error);
    res.status(500).json({ success: false, error: "Failed to fetch processing times" });
  }
});

export default router;