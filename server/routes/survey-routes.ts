import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { 
  surveyRequests, 
  surveyPoints, 
  surveyFeatures,
  surveyReviews,
  surveyDecisions,
  featureCodes,
  insertSurveyRequestSchema,
  insertSurveyPointSchema,
  insertSurveyFeatureSchema,
  type SurveyRequest,
  type SurveyPoint
} from '../../shared/survey-schema';
import { eq, and, desc } from 'drizzle-orm';
// Mock authentication middleware for now
const isAuthenticated = (req: any, res: any, next: any) => {
  // In production, this would validate the JWT token
  req.user = { sub: 'mock-user-id' };
  next();
};

const router = Router();

// Utility function to generate request numbers
const generateRequestNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `SR-${year}-${timestamp}`;
};

// Utility function to generate decision numbers
const generateDecisionNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `QM-${year}-${timestamp}`;
};

// GET /api/survey-requests - List all survey requests (with filtering)
router.get('/survey-requests', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { status, assignedSurveyor, limit = 50, offset = 0 } = req.query;
    
    let query = db.select().from(surveyRequests);
    
    // Add filters
    const conditions = [];
    if (status) conditions.push(eq(surveyRequests.status, status as string));
    if (assignedSurveyor) conditions.push(eq(surveyRequests.assignedSurveyorId, assignedSurveyor as string));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const requests = await query
      .orderBy(desc(surveyRequests.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching survey requests:', error);
    res.status(500).json({ error: 'Failed to fetch survey requests' });
  }
});

// POST /api/survey-requests - Create new survey request
router.post('/survey-requests', async (req: Request, res: Response) => {
  try {
    const validatedData = insertSurveyRequestSchema.parse(req.body);
    
    const requestNumber = generateRequestNumber();
    
    const [newRequest] = await db
      .insert(surveyRequests)
      .values({
        ...validatedData,
        requestNumber,
        status: 'submitted'
      })
      .returning();
    
    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating survey request:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create survey request' });
    }
  }
});

// GET /api/survey-requests/:id - Get specific survey request
router.get('/survey-requests/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [request] = await db
      .select()
      .from(surveyRequests)
      .where(eq(surveyRequests.id, id));
    
    if (!request) {
      return res.status(404).json({ error: 'Survey request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error fetching survey request:', error);
    res.status(500).json({ error: 'Failed to fetch survey request' });
  }
});

// PUT /api/survey-requests/:id - Update survey request
router.put('/survey-requests/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const [updatedRequest] = await db
      .update(surveyRequests)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(surveyRequests.id, id))
      .returning();
    
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Survey request not found' });
    }
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating survey request:', error);
    res.status(500).json({ error: 'Failed to update survey request' });
  }
});

// POST /api/survey-requests/:id/assign - Assign surveyor to request
router.post('/survey-requests/:id/assign', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { surveyorId, appointmentDate } = req.body;
    
    const [updatedRequest] = await db
      .update(surveyRequests)
      .set({
        assignedSurveyorId: surveyorId,
        surveyAppointment: appointmentDate ? new Date(appointmentDate) : null,
        status: 'assigned_to_surveyor',
        updatedAt: new Date()
      })
      .where(eq(surveyRequests.id, id))
      .returning();
    
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Survey request not found' });
    }
    
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error assigning surveyor:', error);
    res.status(500).json({ error: 'Failed to assign surveyor' });
  }
});

// GET /api/survey-requests/:id/points - Get all points for a survey request
router.get('/survey-requests/:id/points', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const points = await db
      .select()
      .from(surveyPoints)
      .where(eq(surveyPoints.surveyRequestId, id))
      .orderBy(surveyPoints.surveyedAt);
    
    res.json(points);
  } catch (error) {
    console.error('Error fetching survey points:', error);
    res.status(500).json({ error: 'Failed to fetch survey points' });
  }
});

// POST /api/survey-requests/:id/points - Add point to survey
router.post('/survey-requests/:id/points', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pointData = insertSurveyPointSchema.parse({
      ...req.body,
      surveyRequestId: id,
      surveyorId: (req as any).user?.sub || 'unknown' // من بيانات المصادقة
    });
    
    const [newPoint] = await db
      .insert(surveyPoints)
      .values(pointData)
      .returning();
    
    // Update request status if this is the first point
    const pointCount = await db
      .select()
      .from(surveyPoints)
      .where(eq(surveyPoints.surveyRequestId, id));
    
    if (pointCount.length === 1) {
      await db
        .update(surveyRequests)
        .set({ 
          status: 'field_survey_in_progress',
          updatedAt: new Date()
        })
        .where(eq(surveyRequests.id, id));
    }
    
    res.status(201).json(newPoint);
  } catch (error) {
    console.error('Error adding survey point:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid point data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to add survey point' });
    }
  }
});

// POST /api/survey-requests/:id/features - Create feature (line or polygon)
router.post('/survey-requests/:id/features', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const featureData = insertSurveyFeatureSchema.parse({
      ...req.body,
      surveyRequestId: id,
      surveyorId: (req as any).user?.sub || 'unknown'
    });
    
    // Calculate length/area based on points
    // This is a simplified calculation - in production you'd use proper GIS functions
    if (featureData.featureType === 'line' && featureData.pointIds.length >= 2) {
      // Get points data
      const points = await db
        .select()
        .from(surveyPoints)
        .where(eq(surveyPoints.surveyRequestId, id));
      
      const featurePoints = points.filter(p => featureData.pointIds.includes(p.id));
      
      // Simple distance calculation (should use proper GIS calculation in production)
      let totalLength = 0;
      for (let i = 1; i < featurePoints.length; i++) {
        const p1 = featurePoints[i - 1];
        const p2 = featurePoints[i];
        const distance = Math.sqrt(
          Math.pow(Number(p2.latitude) - Number(p1.latitude), 2) +
          Math.pow(Number(p2.longitude) - Number(p1.longitude), 2)
        ) * 111320; // Rough conversion to meters
        totalLength += distance;
      }
      
      featureData.length = totalLength;
    }
    
    const [newFeature] = await db
      .insert(surveyFeatures)
      .values({
        ...featureData,
        isCompleted: true
      })
      .returning();
    
    res.status(201).json(newFeature);
  } catch (error) {
    console.error('Error creating survey feature:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid feature data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create survey feature' });
    }
  }
});

// GET /api/survey-requests/:id/features - Get all features for a survey
router.get('/survey-requests/:id/features', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const features = await db
      .select()
      .from(surveyFeatures)
      .where(eq(surveyFeatures.surveyRequestId, id))
      .orderBy(surveyFeatures.createdAt);
    
    res.json(features);
  } catch (error) {
    console.error('Error fetching survey features:', error);
    res.status(500).json({ error: 'Failed to fetch survey features' });
  }
});

// POST /api/survey-requests/:id/complete - Mark survey as completed
router.post('/survey-requests/:id/complete', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Update request status
    const [updatedRequest] = await db
      .update(surveyRequests)
      .set({
        status: 'survey_completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(surveyRequests.id, id))
      .returning();
    
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Survey request not found' });
    }
    
    res.json({ message: 'Survey marked as completed', request: updatedRequest });
  } catch (error) {
    console.error('Error completing survey:', error);
    res.status(500).json({ error: 'Failed to complete survey' });
  }
});

// GET /api/feature-codes - Get all available feature codes
router.get('/feature-codes', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    let query = db.select().from(featureCodes).where(eq(featureCodes.isActive, true));
    
    if (category) {
      query = query.where(eq(featureCodes.category, category as string));
    }
    
    const codes = await query.orderBy(featureCodes.nameAr);
    
    res.json(codes);
  } catch (error) {
    console.error('Error fetching feature codes:', error);
    res.status(500).json({ error: 'Failed to fetch feature codes' });
  }
});

// POST /api/survey-requests/:id/reviews - Add review
router.post('/survey-requests/:id/reviews', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewStatus, reviewComments, technicalNotes, qualityAssessment } = req.body;
    
    const [newReview] = await db
      .insert(surveyReviews)
      .values({
        surveyRequestId: id,
        reviewerId: (req as any).user?.sub || 'unknown',
        reviewerRole: 'technical_reviewer', // Should come from user role
        reviewStatus,
        reviewComments,
        technicalNotes,
        qualityAssessment
      })
      .returning();
    
    // Update request status based on review
    const newStatus = reviewStatus === 'approved' ? 'approved' : 
                     reviewStatus === 'rejected' ? 'rejected' : 'under_technical_review';
    
    await db
      .update(surveyRequests)
      .set({
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(surveyRequests.id, id));
    
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// POST /api/survey-requests/:id/decision - Issue final decision
router.post('/survey-requests/:id/decision', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      totalArea, 
      boundaryLength, 
      boundaries, 
      coordinates, 
      conditions, 
      legalNotes 
    } = req.body;
    
    const decisionNumber = generateDecisionNumber();
    
    // Generate QR code for verification (simplified)
    const qrCode = Buffer.from(`${decisionNumber}-${id}`).toString('base64');
    
    const [newDecision] = await db
      .insert(surveyDecisions)
      .values({
        surveyRequestId: id,
        decisionNumber,
        totalArea,
        boundaryLength,
        boundaries,
        coordinates,
        conditions,
        legalNotes,
        qrCode,
        issuedBy: (req as any).user?.sub || 'unknown',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Valid for 1 year
      })
      .returning();
    
    // Update request status
    await db
      .update(surveyRequests)
      .set({
        status: 'issued',
        issuedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(surveyRequests.id, id));
    
    res.status(201).json(newDecision);
  } catch (error) {
    console.error('Error issuing decision:', error);
    res.status(500).json({ error: 'Failed to issue decision' });
  }
});

// GET /api/survey-decisions/:decisionNumber - Get decision by number
router.get('/survey-decisions/:decisionNumber', async (req: Request, res: Response) => {
  try {
    const { decisionNumber } = req.params;
    
    const [decision] = await db
      .select()
      .from(surveyDecisions)
      .where(eq(surveyDecisions.decisionNumber, decisionNumber));
    
    if (!decision) {
      return res.status(404).json({ error: 'Survey decision not found' });
    }
    
    // Also get the original request data
    const [request] = await db
      .select()
      .from(surveyRequests)
      .where(eq(surveyRequests.id, decision.surveyRequestId));
    
    res.json({
      decision,
      request
    });
  } catch (error) {
    console.error('Error fetching survey decision:', error);
    res.status(500).json({ error: 'Failed to fetch survey decision' });
  }
});

export default router;