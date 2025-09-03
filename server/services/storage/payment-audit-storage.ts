/**
 * Payment & Audit Storage Module - يدير المدفوعات والمراجعة والإحصائيات
 * مسؤول عن: Payment Transactions, Audit Logs, System Statistics
 */

import { randomUUID } from "crypto";
import {
  type PaymentTransaction, type InsertPaymentTransaction,
  type AuditLog, type InsertAuditLog,
} from "@shared/schema";

export class PaymentAuditStorageService {
  private paymentTransactions: PaymentTransaction[] = [];
  private auditLogs: AuditLog[] = [];

  // ================================
  // Payment Transactions Management
  // ================================

  async getPaymentTransactions(): Promise<PaymentTransaction[]> {
    return this.paymentTransactions;
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    return this.paymentTransactions.find(transaction => transaction.id === id);
  }

  async getPaymentsByReference(referenceType: string, referenceId: string): Promise<PaymentTransaction[]> {
    return this.paymentTransactions.filter(transaction => 
      transaction.referenceType === referenceType && transaction.referenceId === referenceId
    );
  }

  async createPaymentTransaction(transactionData: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const transaction: PaymentTransaction = {
      id: randomUUID(),
      transactionNumber: `PAY-2025-${String(this.paymentTransactions.length + 1).padStart(6, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      amount: 0,
      currency: "YER",
      paymentMethod: "cash",
      status: "pending",
      referenceType: "",
      referenceId: "",
      payerName: "",
      payerContact: null,
      description: null,
      processedAt: null,
      processedBy: null,
      receiptNumber: null,
      notes: null,
      ...transactionData,
    };
    this.paymentTransactions.push(transaction);
    return transaction;
  }

  async updatePaymentTransaction(id: string, transactionData: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined> {
    const index = this.paymentTransactions.findIndex(transaction => transaction.id === id);
    if (index === -1) return undefined;
    
    this.paymentTransactions[index] = {
      ...this.paymentTransactions[index],
      ...transactionData,
      updatedAt: new Date(),
    };
    
    return this.paymentTransactions[index];
  }

  // ================================
  // Audit Logging
  // ================================

  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: randomUUID(),
      tableName: null,
      action: "",
      userId: "",
      ipAddress: null,
      userAgent: null,
      recordId: null,
      oldValues: null,
      newValues: null,
      sessionId: null,
      timestamp: new Date(),
      success: null,
      errorMessage: null,
      ...logData,
    };
    this.auditLogs.push(auditLog);
    return auditLog;
  }

  async getAuditLogs(userId?: string): Promise<AuditLog[]> {
    if (userId) {
      return this.auditLogs.filter(log => log.userId === userId);
    }
    return this.auditLogs;
  }

  // ================================
  // System Statistics
  // ================================

  async getStats(
    surveyRequests: any[],
    citizens: any[],
    buildingPermits: any[],
    payments: PaymentTransaction[]
  ): Promise<{
    newRequests: number;
    inProgress: number;
    underReview: number;
    completed: number;
    totalCitizens: number;
    activeBuildingPermits: number;
    pendingPermits: number;
    totalRevenue: number;
  }> {
    const newRequests = surveyRequests.filter(r => r.status === "submitted").length;
    const inProgress = surveyRequests.filter(r => r.status === "field_survey_in_progress").length;
    const underReview = surveyRequests.filter(r => r.status === "under_review").length;
    const completed = surveyRequests.filter(r => r.status === "completed").length;
    const totalCitizens = citizens.length;
    const activeBuildingPermits = buildingPermits.filter(p => p.status === "approved").length;
    const pendingPermits = buildingPermits.filter(p => p.status === "submitted").length;
    const totalRevenue = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      newRequests,
      inProgress,
      underReview,
      completed,
      totalCitizens,
      activeBuildingPermits,
      pendingPermits,
      totalRevenue,
    };
  }
}