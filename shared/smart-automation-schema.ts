import { sql } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// جدول القرارات المؤتمتة
export const automatedDecisions = pgTable("automated_decisions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  decisionType: varchar("decision_type", { length: 100 }).notNull(),
  decisionResult: varchar("decision_result", { length: 50 }).notNull(),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).notNull(),
  reasoning: jsonb("reasoning"),
  inputParameters: jsonb("input_parameters"),
  decisionTimestamp: timestamp("decision_timestamp").defaultNow(),
  humanOverride: boolean("human_override").default(false),
  overrideReason: text("override_reason"),
  finalOutcome: varchar("final_outcome", { length: 50 }),
  userId: varchar("user_id", { length: 255 }),
  executionTimeMs: integer("execution_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول قوانين الأتمتة
export const automationRules = pgTable("automation_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ruleName: varchar("rule_name", { length: 255 }).notNull(),
  ruleCategory: varchar("rule_category", { length: 100 }).notNull(),
  conditions: jsonb("conditions").notNull(),
  actions: jsonb("actions").notNull(),
  priority: integer("priority").default(5),
  successRate: decimal("success_rate", { precision: 3, scale: 2 }),
  lastExecuted: timestamp("last_executed"),
  executionCount: integer("execution_count").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 255 }),
  description: text("description"),
  targetProcesses: jsonb("target_processes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول بيانات التعلم الآلي
export const aiLearningData = pgTable("ai_learning_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelType: varchar("model_type", { length: 100 }).notNull(),
  inputData: jsonb("input_data").notNull(),
  expectedOutput: jsonb("expected_output"),
  actualOutput: jsonb("actual_output"),
  accuracyScore: decimal("accuracy_score", { precision: 3, scale: 2 }),
  feedbackProvided: boolean("feedback_provided").default(false),
  learningSession: varchar("learning_session", { length: 255 }),
  dataSource: varchar("data_source", { length: 100 }),
  trainingPhase: varchar("training_phase", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول تقييم المخاطر
export const riskAssessments = pgTable("risk_assessments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  riskLevel: varchar("risk_level", { length: 50 }).notNull(),
  riskScore: decimal("risk_score", { precision: 3, scale: 2 }).notNull(),
  riskFactors: jsonb("risk_factors"),
  mitigationStrategies: jsonb("mitigation_strategies"),
  requiresHumanApproval: boolean("requires_human_approval").default(false),
  assessmentAlgorithm: varchar("assessment_algorithm", { length: 100 }),
  confidenceLevel: decimal("confidence_level", { precision: 3, scale: 2 }),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول تحسين سير العمل
export const workflowOptimizations = pgTable("workflow_optimizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id", { length: 255 }).notNull(),
  workflowName: varchar("workflow_name", { length: 255 }).notNull(),
  currentSteps: jsonb("current_steps").notNull(),
  optimizedSteps: jsonb("optimized_steps").notNull(),
  eliminatedSteps: jsonb("eliminated_steps"),
  estimatedTimeSaving: integer("estimated_time_saving"), // in minutes
  actualTimeSaving: integer("actual_time_saving"), // in minutes
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  implementationStatus: varchar("implementation_status", { length: 50 }).default('pending'),
  implementedAt: timestamp("implemented_at"),
  optimizationAlgorithm: varchar("optimization_algorithm", { length: 100 }),
  performanceMetrics: jsonb("performance_metrics"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول المساعد الذكي
export const smartAssistantSessions = pgTable("smart_assistant_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 255 }).notNull(),
  sessionType: varchar("session_type", { length: 100 }).notNull(),
  query: text("query").notNull(),
  context: jsonb("context"),
  response: jsonb("response"),
  responseTime: integer("response_time"), // in milliseconds
  satisfactionRating: integer("satisfaction_rating"), // 1-5 scale
  wasHelpful: boolean("was_helpful"),
  followUpNeeded: boolean("follow_up_needed").default(false),
  resolutionStatus: varchar("resolution_status", { length: 50 }).default('pending'),
  assistantModel: varchar("assistant_model", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// أنواع البيانات TypeScript
export type AutomatedDecision = typeof automatedDecisions.$inferSelect;
export type InsertAutomatedDecision = typeof automatedDecisions.$inferInsert;

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

export type AILearningData = typeof aiLearningData.$inferSelect;
export type InsertAILearningData = typeof aiLearningData.$inferInsert;

export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = typeof riskAssessments.$inferInsert;

export type WorkflowOptimization = typeof workflowOptimizations.$inferSelect;
export type InsertWorkflowOptimization = typeof workflowOptimizations.$inferInsert;

export type SmartAssistantSession = typeof smartAssistantSessions.$inferSelect;
export type InsertSmartAssistantSession = typeof smartAssistantSessions.$inferInsert;

// مخططات Zod للتحقق من البيانات
export const insertAutomatedDecisionSchema = createInsertSchema(automatedDecisions);
export const insertAutomationRuleSchema = createInsertSchema(automationRules);
export const insertAILearningDataSchema = createInsertSchema(aiLearningData);
export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments);
export const insertWorkflowOptimizationSchema = createInsertSchema(workflowOptimizations);
export const insertSmartAssistantSessionSchema = createInsertSchema(smartAssistantSessions);

// واجهات للقرارات والتحليلات
export interface DecisionContext {
  requestType: string;
  requestData: any;
  userContext: any;
  historicalData?: any;
  riskFactors?: string[];
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AutomatedDecisionResult {
  decision: 'approve' | 'reject' | 'require_review' | 'escalate';
  confidence: number;
  reasoning: string[];
  alternativeOptions?: string[];
  recommendedActions?: string[];
  riskAssessment?: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    mitigation: string[];
  };
}

export interface RiskAssessmentResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  mitigationStrategies: string[];
  requiresHumanApproval: boolean;
  confidenceLevel: number;
}

export interface WorkflowOptimizationResult {
  optimizedSteps: any[];
  eliminatedSteps: any[];
  estimatedTimeSaving: number;
  confidenceScore: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

export interface SmartAssistantResponse {
  answer: string;
  suggestions: string[];
  relatedDocuments?: string[];
  nextSteps?: string[];
  confidence: number;
  requiresEscalation: boolean;
}