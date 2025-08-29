import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import cors from 'cors';
import { 
  insertSurveyorSchema,
  insertSurveyRequestSchema, 
  insertSurveyPointSchema, 
  insertSurveyLineSchema, 
  insertSurveyPolygonSchema, 
  insertSurveySessionSchema, 
  insertReviewCommentSchema 
} from "@shared/schema";

import authRoutes from "./auth/auth-routes";
import { authenticateToken, requireRole, requirePermission } from "./auth/auth-middleware";
import surveyRoutes from "./routes/survey-routes";
import gisRoutes from "./routes/gis-routes";
import phase1Routes from "./routes/phase1-integration";
import { registerGISFeatureRoutes } from "./routes/gis-features";
import helmet from "helmet";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS middleware FIRST (before any other middleware)
  app.use(cors({
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  }));

  // Handle preflight requests
  app.options('*', cors());

  // Increase payload limits
  app.use('/api/gis/upload', (req, res, next) => {
    // Set specific limits for upload endpoints
    req.setTimeout(300000); // 5 minutes timeout
    res.setTimeout(300000);
    next();
  });

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "ws://localhost:*", "wss://localhost:*"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // Auth routes
  app.use("/api/auth", authRoutes);
  
  // Survey routes
  app.use("/api", surveyRoutes);
  
  // Basic GIS routes (without upload conflicts)  
  // COMPLETELY DISABLE old gis routes to ensure enhanced upload works
  // app.use("/api/gis", gisRoutes);
  
  // Enhanced GIS upload routes (FIRST priority)
  const enhancedUploadRoutes = await import('./routes/enhanced-upload');
  app.use('/api/gis', enhancedUploadRoutes.default);
  
  // Debug routes for testing  
  const debugRoutes = await import('./routes/debug-routes');
  app.use('/api/gis', debugRoutes.default);
  
  // Layer API routes
  const layerApiRoutes = await import('./routes/layers-api');
  app.use('/api/gis/layers', layerApiRoutes.default);
  
  // Layer bounds fix routes
  const layersFixRoutes = await import('./routes/layers-fix');
  app.use('/api/gis/layers', layersFixRoutes.default);
  
  // Phase 1 Processing Pipeline Integration
  app.use('/api/gis', phase1Routes);
  
  // Phase 2 GIS Features API (Digitization)
  registerGISFeatureRoutes(app);
  
  // Legacy GIS upload routes (for backward compatibility)
  const gisUploadRoutes = await import('./routes/gis-upload');
  app.use('/api/gis/legacy', gisUploadRoutes.default);
  
  // Request logging for debugging
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${req.method} ${req.originalUrl} Origin: ${req.headers.origin || 'none'}`);
    next();
  });

  // Serve processed layers as static files
  app.use('/layers', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'temp-uploads', 'processed', req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  // APIs خاصة لطبقات الخرائط
  app.get('/api/gis/layers/:layerId', async (req, res) => {
    try {
      const { layerId } = req.params;
      console.log('🔍 طلب معلومات الطبقة:', layerId);
      
      // Handle test layer specifically
      if (layerId === 'test_layer_demo') {
        return res.json({
          success: true,
          id: 'test_layer_demo',
          name: 'طبقة تجريبية - خريطة اليمن',
          fileName: 'yemen_test.png',
          status: 'processed',
          fileSize: 1024000,
          uploadDate: new Date().toISOString(),
          visible: true,
          imageUrl: '/api/gis/layers/test_layer_demo/image/test_geotiff.png',
          bounds: [[15.2, 44.0], [15.6, 44.4]],
          width: 800,
          height: 600,
          crs: 'EPSG:4326'
        });
      }
      
      // التحقق من وجود الطبقة في مجلد المعالجة
      const layerDir = path.join(process.cwd(), 'temp-uploads', 'processed', layerId);
      
      if (!fs.existsSync(layerDir)) {
        return res.status(404).json({
          success: false,
          error: 'الطبقة غير موجودة'
        });
      }
      
      // البحث عن ملف PNG
      let files, pngFile;
      try {
        files = fs.readdirSync(layerDir);
        pngFile = files.find(file => file.endsWith('.png'));
      } catch (readError) {
        console.error('❌ خطأ في قراءة مجلد الطبقة:', readError);
        return res.status(500).json({
          success: false,
          error: 'خطأ في قراءة مجلد الطبقة'
        });
      }
      
      if (!pngFile) {
        return res.status(404).json({
          success: false,
          error: 'ملف الصورة غير موجود'
        });
      }
      
      // إنشاء URL للصورة وإحداثيات افتراضية
      const imageUrl = `/api/gis/layers/${layerId}/image/${pngFile}`;
      
      // إحداثيات افتراضية لصنعاء (يمكن تحسينها لاحقاً)
      const bounds: [[number, number], [number, number]] = [
        [15.2, 44.0], // الزاوية الجنوبية الغربية
        [15.6, 44.4]  // الزاوية الشمالية الشرقية
      ];
      
      res.json({
        success: true,
        layerId,
        imageUrl,
        bounds,
        pngFile
      });
      
    } catch (error) {
      console.error('❌ خطأ في الحصول على معلومات الطبقة:', error);
      res.status(500).json({
        success: false,
        error: 'خطأ في الخادم'
      });
    }
  });

  // GET /api/gis/layers/:layerId/image/:filename - تقديم ملف الصورة
  app.get('/api/gis/layers/:layerId/image/:filename', (req, res) => {
    try {
      const { layerId, filename } = req.params;
      const imagePath = path.join(process.cwd(), 'temp-uploads', 'processed', layerId, filename);
      
      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ error: 'الصورة غير موجودة' });
      }
      
      // تعيين headers مناسبة للصورة
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // إرسال الملف
      res.sendFile(imagePath);
      
    } catch (error) {
      console.error('❌ خطأ في تقديم الصورة:', error);
      res.status(500).json({ error: 'خطأ في الخادم' });
    }
  });
  // Surveyors Management
  app.get("/api/surveyors", async (req, res) => {
    try {
      const surveyors = await storage.getSurveyors();
      res.json(surveyors);
    } catch (error) {
      console.error("Error fetching surveyors:", error);
      res.status(500).json({ message: "Failed to fetch surveyors" });
    }
  });

  app.get("/api/surveyors/:id", async (req, res) => {
    try {
      const surveyor = await storage.getSurveyor(req.params.id);
      if (!surveyor) {
        return res.status(404).json({ message: "Surveyor not found" });
      }
      res.json(surveyor);
    } catch (error) {
      console.error("Error fetching surveyor:", error);
      res.status(500).json({ message: "Failed to fetch surveyor" });
    }
  });

  app.post("/api/surveyors", async (req, res) => {
    try {
      const validatedData = insertSurveyorSchema.parse(req.body);
      const surveyor = await storage.createSurveyor(validatedData);
      res.status(201).json(surveyor);
    } catch (error) {
      console.error("Error creating surveyor:", error);
      res.status(400).json({ message: "Invalid surveyor data" });
    }
  });

  app.patch("/api/surveyors/:id", async (req, res) => {
    try {
      const surveyor = await storage.updateSurveyor(req.params.id, req.body);
      if (!surveyor) {
        return res.status(404).json({ message: "Surveyor not found" });
      }
      res.json(surveyor);
    } catch (error) {
      console.error("Error updating surveyor:", error);
      res.status(500).json({ message: "Failed to update surveyor" });
    }
  });

  // Survey Requests
  app.get("/api/survey-requests", async (req, res) => {
    try {
      const requests = await storage.getSurveyRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching survey requests:", error);
      res.status(500).json({ message: "Failed to fetch survey requests" });
    }
  });

  app.get("/api/survey-requests/:id", async (req, res) => {
    try {
      const request = await storage.getSurveyRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Survey request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching survey request:", error);
      res.status(500).json({ message: "Failed to fetch survey request" });
    }
  });

  app.post("/api/survey-requests", async (req, res) => {
    try {
      const validatedData = insertSurveyRequestSchema.parse(req.body);
      const request = await storage.createSurveyRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating survey request:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.patch("/api/survey-requests/:id", async (req, res) => {
    try {
      const request = await storage.updateSurveyRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ message: "Survey request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error updating survey request:", error);
      res.status(500).json({ message: "Failed to update survey request" });
    }
  });

  // Survey Points
  app.get("/api/survey-requests/:requestId/points", async (req, res) => {
    try {
      const points = await storage.getSurveyPoints(req.params.requestId);
      res.json(points);
    } catch (error) {
      console.error("Error fetching survey points:", error);
      res.status(500).json({ message: "Failed to fetch survey points" });
    }
  });

  app.post("/api/survey-requests/:requestId/points", async (req, res) => {
    try {
      const validatedData = insertSurveyPointSchema.parse({
        ...req.body,
        requestId: req.params.requestId,
      });
      const point = await storage.createSurveyPoint(validatedData);
      
      // Broadcast to WebSocket clients
      broadcastToClients({
        type: "POINT_ADDED",
        data: point,
      });
      
      res.status(201).json(point);
    } catch (error) {
      console.error("Error creating survey point:", error);
      res.status(400).json({ message: "Invalid point data" });
    }
  });

  app.delete("/api/survey-points/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSurveyPoint(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Survey point not found" });
      }
      
      broadcastToClients({
        type: "POINT_DELETED",
        data: { id: req.params.id },
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting survey point:", error);
      res.status(500).json({ message: "Failed to delete survey point" });
    }
  });

  // Survey Lines
  app.get("/api/survey-requests/:requestId/lines", async (req, res) => {
    try {
      const lines = await storage.getSurveyLines(req.params.requestId);
      res.json(lines);
    } catch (error) {
      console.error("Error fetching survey lines:", error);
      res.status(500).json({ message: "Failed to fetch survey lines" });
    }
  });

  app.post("/api/survey-requests/:requestId/lines", async (req, res) => {
    try {
      const validatedData = insertSurveyLineSchema.parse({
        ...req.body,
        requestId: req.params.requestId,
      });
      const line = await storage.createSurveyLine(validatedData);
      
      broadcastToClients({
        type: "LINE_ADDED",
        data: line,
      });
      
      res.status(201).json(line);
    } catch (error) {
      console.error("Error creating survey line:", error);
      res.status(400).json({ message: "Invalid line data" });
    }
  });

  // Survey Polygons
  app.get("/api/survey-requests/:requestId/polygons", async (req, res) => {
    try {
      const polygons = await storage.getSurveyPolygons(req.params.requestId);
      res.json(polygons);
    } catch (error) {
      console.error("Error fetching survey polygons:", error);
      res.status(500).json({ message: "Failed to fetch survey polygons" });
    }
  });

  app.post("/api/survey-requests/:requestId/polygons", async (req, res) => {
    try {
      const validatedData = insertSurveyPolygonSchema.parse({
        ...req.body,
        requestId: req.params.requestId,
      });
      const polygon = await storage.createSurveyPolygon(validatedData);
      
      broadcastToClients({
        type: "POLYGON_ADDED",
        data: polygon,
      });
      
      res.status(201).json(polygon);
    } catch (error) {
      console.error("Error creating survey polygon:", error);
      res.status(400).json({ message: "Invalid polygon data" });
    }
  });

  // Survey Sessions
  app.get("/api/survey-requests/:requestId/session", async (req, res) => {
    try {
      const session = await storage.getSurveySession(req.params.requestId);
      res.json(session);
    } catch (error) {
      console.error("Error fetching survey session:", error);
      res.status(500).json({ message: "Failed to fetch survey session" });
    }
  });

  app.post("/api/survey-requests/:requestId/session", async (req, res) => {
    try {
      const validatedData = insertSurveySessionSchema.parse({
        ...req.body,
        requestId: req.params.requestId,
      });
      const session = await storage.createSurveySession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating survey session:", error);
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  // Review Comments
  app.get("/api/survey-requests/:requestId/comments", async (req, res) => {
    try {
      const comments = await storage.getReviewComments(req.params.requestId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching review comments:", error);
      res.status(500).json({ message: "Failed to fetch review comments" });
    }
  });

  app.post("/api/survey-requests/:requestId/comments", async (req, res) => {
    try {
      const validatedData = insertReviewCommentSchema.parse({
        ...req.body,
        requestId: req.params.requestId,
      });
      const comment = await storage.createReviewComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating review comment:", error);
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  // Statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Citizens API routes
  app.get("/api/citizens", async (req, res) => {
    try {
      const citizens = await storage.getCitizens();
      res.json(citizens);
    } catch (error) {
      console.error("Error fetching citizens:", error);
      res.status(500).json({ message: "Failed to fetch citizens" });
    }
  });

  app.get("/api/citizens/:id", async (req, res) => {
    try {
      const citizen = await storage.getCitizen(req.params.id);
      if (!citizen) {
        return res.status(404).json({ message: "Citizen not found" });
      }
      res.json(citizen);
    } catch (error) {
      console.error("Error fetching citizen:", error);
      res.status(500).json({ message: "Failed to fetch citizen" });
    }
  });

  // Engineering Offices API routes
  app.get("/api/engineering-offices", async (req, res) => {
    try {
      const offices = await storage.getEngineeringOffices();
      res.json(offices);
    } catch (error) {
      console.error("Error fetching engineering offices:", error);
      res.status(500).json({ message: "Failed to fetch engineering offices" });
    }
  });

  app.get("/api/engineering-offices/:id", async (req, res) => {
    try {
      const office = await storage.getEngineeringOffice(req.params.id);
      if (!office) {
        return res.status(404).json({ message: "Engineering office not found" });
      }
      res.json(office);
    } catch (error) {
      console.error("Error fetching engineering office:", error);
      res.status(500).json({ message: "Failed to fetch engineering office" });
    }
  });

  // Contractors API routes
  app.get("/api/contractors", async (req, res) => {
    try {
      const contractors = await storage.getContractors();
      res.json(contractors);
    } catch (error) {
      console.error("Error fetching contractors:", error);
      res.status(500).json({ message: "Failed to fetch contractors" });
    }
  });

  app.get("/api/contractors/:id", async (req, res) => {
    try {
      const contractor = await storage.getContractor(req.params.id);
      if (!contractor) {
        return res.status(404).json({ message: "Contractor not found" });
      }
      res.json(contractor);
    } catch (error) {
      console.error("Error fetching contractor:", error);
      res.status(500).json({ message: "Failed to fetch contractor" });
    }
  });

  // Building Permits API routes
  app.get("/api/building-permits", async (req, res) => {
    try {
      const permits = await storage.getBuildingPermits();
      res.json(permits);
    } catch (error) {
      console.error("Error fetching building permits:", error);
      res.status(500).json({ message: "Failed to fetch building permits" });
    }
  });

  app.get("/api/building-permits/:id", async (req, res) => {
    try {
      const permit = await storage.getBuildingPermit(req.params.id);
      if (!permit) {
        return res.status(404).json({ message: "Building permit not found" });
      }
      res.json(permit);
    } catch (error) {
      console.error("Error fetching building permit:", error);
      res.status(500).json({ message: "Failed to fetch building permit" });
    }
  });

  app.post("/api/building-permits", async (req, res) => {
    try {
      const permit = await storage.createBuildingPermit(req.body);
      res.status(201).json(permit);
    } catch (error) {
      console.error("Error creating building permit:", error);
      res.status(500).json({ message: "Failed to create building permit" });
    }
  });

  app.put("/api/building-permits/:id", async (req, res) => {
    try {
      const permit = await storage.updateBuildingPermit(req.params.id, req.body);
      if (!permit) {
        return res.status(404).json({ message: "Building permit not found" });
      }
      res.json(permit);
    } catch (error) {
      console.error("Error updating building permit:", error);
      res.status(500).json({ message: "Failed to update building permit" });
    }
  });

  // Occupancy Certificates API routes
  app.get("/api/occupancy-certificates", async (req, res) => {
    try {
      const certificates = await storage.getOccupancyCertificates();
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching occupancy certificates:", error);
      res.status(500).json({ message: "Failed to fetch occupancy certificates" });
    }
  });

  app.get("/api/occupancy-certificates/:id", async (req, res) => {
    try {
      const certificate = await storage.getOccupancyCertificate(req.params.id);
      if (!certificate) {
        return res.status(404).json({ message: "Occupancy certificate not found" });
      }
      res.json(certificate);
    } catch (error) {
      console.error("Error fetching occupancy certificate:", error);
      res.status(500).json({ message: "Failed to fetch occupancy certificate" });
    }
  });

  app.post("/api/occupancy-certificates", async (req, res) => {
    try {
      const certificate = await storage.createOccupancyCertificate(req.body);
      res.status(201).json(certificate);
    } catch (error) {
      console.error("Error creating occupancy certificate:", error);
      res.status(500).json({ message: "Failed to create occupancy certificate" });
    }
  });

  app.put("/api/occupancy-certificates/:id", async (req, res) => {
    try {
      const certificate = await storage.updateOccupancyCertificate(req.params.id, req.body);
      if (!certificate) {
        return res.status(404).json({ message: "Occupancy certificate not found" });
      }
      res.json(certificate);
    } catch (error) {
      console.error("Error updating occupancy certificate:", error);
      res.status(500).json({ message: "Failed to update occupancy certificate" });
    }
  });

  // Inspection Reports API routes
  app.get("/api/inspection-reports", async (req, res) => {
    try {
      const reports = await storage.getInspectionReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching inspection reports:", error);
      res.status(500).json({ message: "Failed to fetch inspection reports" });
    }
  });

  app.get("/api/inspection-reports/:id", async (req, res) => {
    try {
      const report = await storage.getInspectionReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Inspection report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching inspection report:", error);
      res.status(500).json({ message: "Failed to fetch inspection report" });
    }
  });

  app.post("/api/inspection-reports", async (req, res) => {
    try {
      const report = await storage.createInspectionReport(req.body);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating inspection report:", error);
      res.status(500).json({ message: "Failed to create inspection report" });
    }
  });

  app.put("/api/inspection-reports/:id", async (req, res) => {
    try {
      const report = await storage.updateInspectionReport(req.params.id, req.body);
      if (!report) {
        return res.status(404).json({ message: "Inspection report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error updating inspection report:", error);
      res.status(500).json({ message: "Failed to update inspection report" });
    }
  });

  app.put("/api/inspection-reports/:id/assign", async (req, res) => {
    try {
      const { inspectorId, inspectorName } = req.body;
      const report = await storage.assignInspector(req.params.id, inspectorId, inspectorName);
      if (!report) {
        return res.status(404).json({ message: "Inspection report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error assigning inspector:", error);
      res.status(500).json({ message: "Failed to assign inspector" });
    }
  });

  // Digital Certificate and Notification routes
  app.post("/api/occupancy-certificates/:id/sign", async (req, res) => {
    try {
      const certificate = await storage.updateOccupancyCertificate(req.params.id, {
        status: "signed",
        issuedBy: req.body.signedBy,
        issuedDate: new Date()
      });
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.json(certificate);
    } catch (error) {
      console.error("Error signing certificate:", error);
      res.status(500).json({ message: "Failed to sign certificate" });
    }
  });

  app.post("/api/occupancy-certificates/:id/notify", async (req, res) => {
    try {
      const { type, settings } = req.body;
      // Mock notification sending
      res.json({ success: true, message: "Notification sent successfully" });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  app.post("/api/notifications/send", async (req, res) => {
    try {
      // Mock notification sending
      res.json({ success: true, message: "Notification sent successfully" });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Violation Reports API routes
  app.get("/api/violation-reports", async (req, res) => {
    try {
      const reports = await storage.getViolationReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching violation reports:", error);
      res.status(500).json({ message: "Failed to fetch violation reports" });
    }
  });

  // Payment Transactions API routes
  app.get("/api/payment-transactions", async (req, res) => {
    try {
      const transactions = await storage.getPaymentTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching payment transactions:", error);
      res.status(500).json({ message: "Failed to fetch payment transactions" });
    }
  });

  // Export endpoints
  app.get("/api/survey-requests/:requestId/export/:format", async (req, res) => {
    try {
      const { requestId, format } = req.params;
      const request = await storage.getSurveyRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Survey request not found" });
      }

      const points = await storage.getSurveyPoints(requestId);
      const lines = await storage.getSurveyLines(requestId);
      const polygons = await storage.getSurveyPolygons(requestId);

      let data: string;
      let contentType: string;
      let filename: string;

      switch (format.toLowerCase()) {
        case 'csv':
          data = generateCSV({ points, lines, polygons });
          contentType = 'text/csv';
          filename = `survey_${requestId}.csv`;
          break;
        case 'geojson':
          data = generateGeoJSON({ points, lines, polygons });
          contentType = 'application/geo+json';
          filename = `survey_${requestId}.geojson`;
          break;
        case 'kml':
          data = generateKML({ points, lines, polygons, request });
          contentType = 'application/vnd.google-earth.kml+xml';
          filename = `survey_${requestId}.kml`;
          break;
        default:
          return res.status(400).json({ message: "Unsupported export format" });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(data);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  function broadcastToClients(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  return httpServer;
}

// Export utility functions
function generateCSV(data: any): string {
  const { points, lines, polygons } = data;
  let csv = "Type,ID,Feature_Code,Longitude,Latitude,Elevation,Notes\n";
  
  points.forEach((point: any) => {
    csv += `Point,${point.id},${point.featureCode},${point.longitude},${point.latitude},${point.elevation || ''},${point.notes || ''}\n`;
  });
  
  return csv;
}

function generateGeoJSON(data: any): string {
  const { points, lines, polygons } = data;
  const features: any[] = [];
  
  points.forEach((point: any) => {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude, point.elevation || 0]
      },
      properties: {
        id: point.id,
        featureCode: point.featureCode,
        pointNumber: point.pointNumber,
        notes: point.notes
      }
    });
  });
  
  lines.forEach((line: any) => {
    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: line.points
      },
      properties: {
        id: line.id,
        featureCode: line.featureCode,
        lineNumber: line.lineNumber,
        length: line.length,
        notes: line.notes
      }
    });
  });
  
  polygons.forEach((polygon: any) => {
    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [polygon.points]
      },
      properties: {
        id: polygon.id,
        featureCode: polygon.featureCode,
        polygonNumber: polygon.polygonNumber,
        area: polygon.area,
        perimeter: polygon.perimeter,
        notes: polygon.notes
      }
    });
  });
  
  return JSON.stringify({
    type: "FeatureCollection",
    features
  }, null, 2);
}

function generateKML(data: any): string {
  const { points, lines, polygons, request } = data;
  
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Survey ${request.requestNumber}</name>
    <description>Survey data for ${request.ownerName} in ${request.region}</description>
`;

  points.forEach((point: any) => {
    kml += `
    <Placemark>
      <name>${point.pointNumber}</name>
      <description>Feature: ${point.featureCode}${point.notes ? '\nNotes: ' + point.notes : ''}</description>
      <Point>
        <coordinates>${point.longitude},${point.latitude},${point.elevation || 0}</coordinates>
      </Point>
    </Placemark>`;
  });

  kml += `
  </Document>
</kml>`;
  
  return kml;
}
