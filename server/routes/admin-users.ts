import { Router } from "express";
import { eq, like, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { users, auditLogs, userSessions } from "@shared/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router = Router();

// Get user details by ID
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        phone: users.phone,
        department: users.department,
        position: users.position,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "خطأ في الخادم الداخلي" });
  }
});

// Get user audit logs
router.get("/:id/audit-logs", async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        tableName: auditLogs.tableName,
        timestamp: auditLogs.timestamp,
        ipAddress: auditLogs.ipAddress,
        success: auditLogs.success,
        errorMessage: auditLogs.errorMessage,
      })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(Number(limit))
      .offset(offset);

    res.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "خطأ في الخادم الداخلي" });
  }
});

// Get user sessions
router.get("/:id/sessions", async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const sessions = await db
      .select({
        id: userSessions.id,
        ipAddress: userSessions.ipAddress,
        userAgent: userSessions.userAgent,
        loginAt: userSessions.loginAt,
        lastActivity: userSessions.lastActivity,
        logoutAt: userSessions.logoutAt,
        active: userSessions.active,
      })
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.lastActivity))
      .limit(Number(limit))
      .offset(offset);

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    res.status(500).json({ error: "خطأ في الخادم الداخلي" });
  }
});

// Reset user password
router.post("/:id/reset-password", async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    await db
      .update(users)
      .set({ 
        password: hashedPassword,
        passwordResetRequired: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: req.user?.id || 'system',
      action: 'password_reset',
      tableName: 'users',
      recordId: userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    });

    res.json({ 
      message: "تم إعادة تعيين كلمة المرور بنجاح",
      tempPassword: tempPassword 
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    
    // Log the failed action
    await db.insert(auditLogs).values({
      userId: req.user?.id || 'system',
      action: 'password_reset',
      tableName: 'users',
      recordId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message,
    });
    
    res.status(500).json({ error: "خطأ في الخادم الداخلي" });
  }
});

// Update user status
router.patch("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const updateSchema = z.object({
      status: z.enum(['active', 'inactive', 'suspended']).optional(),
      role: z.string().optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      phone: z.string().optional(),
    });

    const validatedData = updateSchema.parse(req.body);
    
    // Get current user data for audit log
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!currentUser) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // Update user
    await db
      .update(users)
      .set({ 
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: req.user?.id || 'system',
      action: 'user_update',
      tableName: 'users',
      recordId: userId,
      oldValues: currentUser,
      newValues: validatedData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    });

    res.json({ message: "تم تحديث المستخدم بنجاح" });
  } catch (error) {
    console.error("Error updating user:", error);
    
    // Log the failed action
    await db.insert(auditLogs).values({
      userId: req.user?.id || 'system',
      action: 'user_update',
      tableName: 'users',
      recordId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message,
    });
    
    res.status(500).json({ error: "خطأ في الخادم الداخلي" });
  }
});

// Delete user (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get current user data for audit log
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!currentUser) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    // Soft delete - mark as deleted
    await db
      .update(users)
      .set({ 
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Log the action
    await db.insert(auditLogs).values({
      userId: req.user?.id || 'system',
      action: 'user_delete',
      tableName: 'users',
      recordId: userId,
      oldValues: currentUser,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
    });

    res.json({ message: "تم حذف المستخدم بنجاح" });
  } catch (error) {
    console.error("Error deleting user:", error);
    
    // Log the failed action
    await db.insert(auditLogs).values({
      userId: req.user?.id || 'system',
      action: 'user_delete',
      tableName: 'users',
      recordId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message,
    });
    
    res.status(500).json({ error: "خطأ في الخادم الداخلي" });
  }
});

// Get user statistics
router.get("/:id/statistics", async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user activity statistics
    const [activityStats] = await db
      .select({
        totalLogins: sql<number>`count(${userSessions.id})`,
        activeSessionsCount: sql<number>`count(case when ${userSessions.active} = true then 1 end)`,
        lastLoginDate: sql<string>`max(${userSessions.loginAt})`,
      })
      .from(userSessions)
      .where(eq(userSessions.userId, userId));

    // Get audit activity count by day (last 30 days)
    const auditActivity = await db
      .select({
        date: sql<string>`date(${auditLogs.timestamp})`,
        actionCount: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .groupBy(sql`date(${auditLogs.timestamp})`)
      .orderBy(desc(sql`date(${auditLogs.timestamp})`))
      .limit(30);

    res.json({
      activity: activityStats,
      dailyActivity: auditActivity,
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: "خطأ في الخادم الداخلي" });
  }
});

export default router;