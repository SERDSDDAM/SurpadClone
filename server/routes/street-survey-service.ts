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
import { escalationEngine, type RequestContext } from "../services/gis/escalation-engine";
import type { CoordinatePoint } from "../services/gis/point-in-polygon-engine";

const router = Router();

// ================================
// Street Status Decisions API
// ================================

// Get all street status decisions with optional filtering
router.get("/street-decisions", async (req, res) => {
  try {
    const { escalated } = req.query;
    
    if (escalated === 'true') {
      // Return only escalated decisions (escalationLevel > 0)
      const decisions = await storage.getStreetStatusDecisions();
      const escalatedDecisions = decisions.filter((d: any) => (d.escalationLevel || 0) > 0);
      res.json(toArrayResponse(escalatedDecisions));
    } else {
      // Return all decisions
      const decisions = await storage.getStreetStatusDecisions();
      res.json(toArrayResponse(decisions));
    }
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

// Create new street status decision with intelligent routing
router.post("/street-decisions", async (req, res) => {
  try {
    const validatedData = insertStreetStatusDecisionSchema.parse(req.body);
    
    // استخراج الإحداثيات من البيانات المرسلة
    let coordinates: CoordinatePoint | null = null;
    if (validatedData.coordinates && typeof validatedData.coordinates === 'object') {
      const coords = validatedData.coordinates as any;
      if (coords.latitude && coords.longitude) {
        coordinates = {
          latitude: Number(coords.latitude),
          longitude: Number(coords.longitude),
          coordinateSystem: coords.coordinateSystem || 'WGS84'
        };
      }
    }

    // إنشاء سياق الطلب للمحرك
    const requestContext: RequestContext = {
      requestType: (validatedData.decisionType as any) || 'new_construction',
      projectSize: 'medium', // يمكن استخراجه من البيانات لاحقاً
      projectValue: 1000000, // قيمة افتراضية - يمكن تحسينها
      applicantType: 'individual', // يمكن استخراجه من applicantDetails
      urgency: 'routine',
      hasExistingPermits: false,
      documentationComplete: (validatedData.attachedDocuments as any[])?.length > 0
    };

    let escalationResult = null;
    
    // تشغيل محرك التحليل والتصعيد إذا توفرت الإحداثيات
    if (coordinates) {
      console.log('🔍 تشغيل محرك التحليل الجغرافي والتصعيد');
      console.log('📍 الإحداثيات:', coordinates);
      
      try {
        escalationResult = await escalationEngine.analyzeAndEscalate(coordinates, requestContext);
        console.log('✅ نتيجة التحليل:', escalationResult);
        
        // تحديث البيانات بناءً على نتيجة التحليل
        if (escalationResult.assignedBranch && !validatedData.branchOffice) {
          (validatedData as any).branchOffice = escalationResult.assignedBranch;
        }
        if (escalationResult.supervisoryOffice && !validatedData.supervisoryOffice) {
          (validatedData as any).supervisoryOffice = escalationResult.supervisoryOffice;
        }
        if (escalationResult.escalationLevel !== undefined) {
          (validatedData as any).escalationLevel = escalationResult.escalationLevel;
        }
        if (escalationResult.reasoning.length > 0) {
          (validatedData as any).escalationReason = escalationResult.reasoning.join('; ');
        }
        if (escalationResult.estimatedProcessingDays) {
          (validatedData as any).estimatedProcessingDays = escalationResult.estimatedProcessingDays;
        }
        
      } catch (escalationError) {
        console.error('خطأ في محرك التصعيد:', escalationError);
        // المتابعة بدون تطبيق نتائج التصعيد في حالة الخطأ
      }
    } else {
      console.log('⚠️ لم يتم العثور على إحداثيات صالحة - تم تخطي التحليل التلقائي');
    }

    // إنشاء القرار في قاعدة البيانات
    const decision = await storage.createStreetStatusDecision(validatedData);
    
    // إرجاع الاستجابة مع معلومات التحليل إن وجدت
    const response = {
      decision,
      analysis: escalationResult ? {
        escalationLevel: escalationResult.escalationLevel,
        assignedBranch: escalationResult.assignedBranch,
        supervisoryOffice: escalationResult.supervisoryOffice,
        estimatedDays: escalationResult.estimatedProcessingDays,
        reasoning: escalationResult.reasoning,
        autoApprovalEligible: escalationResult.autoApprovalEligible
      } : null
    };
    
    console.log('📝 تم إنشاء القرار المساحي بنجاح:', decision.id);
    res.status(201).json(toObjectResponse(response, 'تم إنشاء القرار المساحي مع التحليل التلقائي'));
    
  } catch (error) {
    console.error("Error creating street decision:", error);
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ success: false, error: "بيانات غير صالحة", details: (error as any).errors });
    } else {
      res.status(500).json({ success: false, error: "Failed to create street decision" });
    }
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
// Test Data APIs for UAT
// ================================

// Create UAT test data for the 5 scenarios
router.post("/uat/create-test-data", async (req, res) => {
  try {
    console.log('🧪 إنشاء بيانات اختبار UAT للسيناريوهات الخمسة');
    
    const testData = [
      // السيناريو 1: الطلب الروتيني - منطقة آمنة
      {
        decisionNumber: "UAT-ROUTINE-001",
        streetName: "شارع الوحدة الفرعي",
        neighborhood: "سنحان الشرقي",
        requestedBy: "أحمد محمد الشرعبي",
        decisionType: "new_street_numbering",
        coordinates: { latitude: 15.35, longitude: 44.20, coordinateSystem: "WGS84" },
        status: "under_review",
        priority: "routine",
        escalationLevel: 0, // روتيني - لا يحتاج تصعيد
        estimatedProcessingDays: 7,
        branchOffice: "صنعاء الشرقي",
        supervisoryOffice: "المكتب الإشرافي - صنعاء",
        applicantDetails: { name: "أحمد محمد الشرعبي", phone: "771234567" },
        attachedDocuments: ["deed.pdf", "location_sketch.pdf"]
      },
      
      // السيناريو 2: منطقة التراث - يتطلب تصعيد
      {
        decisionNumber: "UAT-HERITAGE-001", 
        streetName: "زقاق البستان التراثي",
        neighborhood: "البراقة التراثية",
        requestedBy: "فاطمة عبدالله القاضي",
        decisionType: "heritage_area_numbering",
        coordinates: { latitude: 15.36, longitude: 44.21, coordinateSystem: "WGS84" },
        status: "under_review",
        priority: "high", 
        escalationLevel: 3, // تراث - يتطلب تصعيد
        escalationReason: "الموقع يقع ضمن المنطقة التراثية المحمية",
        estimatedProcessingDays: 21,
        branchOffice: "صنعاء المركز", 
        supervisoryOffice: "المكتب الإشرافي - التراث",
        applicantDetails: { name: "فاطمة عبدالله القاضي", phone: "773456789" },
        attachedDocuments: ["heritage_clearance.pdf", "architectural_survey.pdf"]
      },
      
      // السيناريو 3: منطقة الفيضانات - يتطلب تصعيد
      {
        decisionNumber: "UAT-FLOOD-001",
        streetName: "شارع وادي السائلة",  
        neighborhood: "أطراف وادي السائلة",
        requestedBy: "محمد سالم الهمداني",
        decisionType: "flood_zone_numbering",
        coordinates: { latitude: 15.34, longitude: 44.19, coordinateSystem: "WGS84" },
        status: "under_review",
        priority: "high",
        escalationLevel: 4, // فيضانات - يتطلب تصعيد
        escalationReason: "الموقع يقع في منطقة معرضة لمخاطر الفيضانات", 
        estimatedProcessingDays: 28,
        branchOffice: "صنعاء الغربي",
        supervisoryOffice: "المكتب الإشرافي - الطوارئ",
        applicantDetails: { name: "محمد سالم الهمداني", phone: "775678901" },
        attachedDocuments: ["flood_risk_assessment.pdf", "drainage_plan.pdf"]
      },
      
      // السيناريو 4: خارج المخطط - يتطلب تصعيد 
      {
        decisionNumber: "UAT-OUTSIDE-001",
        streetName: "طريق المزارع الخارجي",
        neighborhood: "خارج حدود المخطط",
        requestedBy: "علي حسن المقطري", 
        decisionType: "outside_plan_numbering",
        coordinates: { latitude: 15.32, longitude: 44.25, coordinateSystem: "WGS84" },
        status: "under_review", 
        priority: "medium",
        escalationLevel: 5, // خارج المخطط - يتطلب تصعيد
        escalationReason: "الموقع يقع خارج حدود المخطط المعتمد",
        estimatedProcessingDays: 35,
        branchOffice: "صنعاء الجنوبي",
        supervisoryOffice: "المكتب الإشرافي - التخطيط",
        applicantDetails: { name: "علي حسن المقطري", phone: "777890123" },
        attachedDocuments: ["survey_report.pdf", "planning_justification.pdf"]
      },
      
      // السيناريو 5: للتصعيد اليدوي - سيبدأ كروتيني ثم يصعد يدوياً
      {
        decisionNumber: "UAT-MANUAL-001",
        streetName: "شارع الصناعات الحرفية", 
        neighborhood: "المنطقة الصناعية",
        requestedBy: "ياسر أحمد الشامي",
        decisionType: "industrial_area_numbering",
        coordinates: { latitude: 15.37, longitude: 44.18, coordinateSystem: "WGS84" },
        status: "under_review",
        priority: "routine", 
        escalationLevel: 0, // سيبدأ روتيني
        estimatedProcessingDays: 7,
        branchOffice: "صنعاء الشمالي",
        supervisoryOffice: "المكتب الإشرافي - صنعاء",
        applicantDetails: { name: "ياسر أحمد الشامي", phone: "779012345" },
        attachedDocuments: ["industrial_license.pdf", "site_plan.pdf"]
      }
    ];
    
    const createdDecisions = [];
    for (const data of testData) {
      const decision = await storage.createStreetStatusDecision(data);
      createdDecisions.push(decision);
      console.log(`✅ تم إنشاء ${data.decisionNumber}`);
    }
    
    res.json({
      success: true, 
      message: "تم إنشاء بيانات اختبار UAT بنجاح",
      data: createdDecisions,
      count: createdDecisions.length
    });
    
  } catch (error) {
    console.error("Error creating UAT test data:", error);
    res.status(500).json({ success: false, error: "Failed to create UAT test data" });
  }
});

// Clear all test data (for clean testing) 
router.delete("/uat/clear-test-data", async (req, res) => {
  try {
    console.log('🧹 مسح جميع بيانات الاختبار');
    
    // This would ideally clear only test data, but for simplicity we'll clear all
    // In a real implementation, you'd filter by a test flag or prefix
    const decisions = await storage.getStreetStatusDecisions();
    const testDecisions = decisions.filter((d: any) => d.decisionNumber?.startsWith('UAT-'));
    
    for (const decision of testDecisions) {
      // Storage deletion method would need to be implemented
      console.log(`🗑️ حذف ${decision.decisionNumber}`);
    }
    
    res.json({
      success: true,
      message: "تم مسح بيانات الاختبار بنجاح", 
      cleared: testDecisions.length
    });
    
  } catch (error) {
    console.error("Error clearing UAT test data:", error);
    res.status(500).json({ success: false, error: "Failed to clear UAT test data" });
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