import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertSurveyRequestSchema, insertSurveyPointSchema, insertSurveyLineSchema, insertSurveyPolygonSchema, insertSurveySessionSchema, insertReviewCommentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
