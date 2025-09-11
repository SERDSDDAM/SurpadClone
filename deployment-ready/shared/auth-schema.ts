import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with enhanced role-based access control
export const authUsers = pgTable("auth_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(), // password hash
  email: varchar("email").unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  role: varchar("role").notNull().default("staff"), // admin, deputy_admin_technical, manager, section_head, staff
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Sessions for tracking active sessions
export const authSessions = pgTable("auth_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => authUsers.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

// Insert schemas
export const insertAuthUserSchema = createInsertSchema(authUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  loginAttempts: true,
  lockedUntil: true,
});

export const insertAuthSessionSchema = createInsertSchema(authSessions).omit({
  id: true,
  createdAt: true,
  lastAccessedAt: true,
});

// Types
export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;

// Default users for development
export const DEFAULT_USERS: Omit<AuthUser, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    username: 'admin',
    password: '$2b$10$abc123def456ghi789jkl012mno345pqr', // Admin@2025!
    email: 'admin@banna-yemen.gov.ye',
    firstName: 'مدير',
    lastName: 'النظام',
    role: 'admin',
    profileImageUrl: null,
    isActive: true,
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
  },
  {
    username: 'surveyor1',
    password: '$2b$10$xyz987uvw654stu321pqr098lmn765opq', // Employee@2025!
    email: 'surveyor1@banna-yemen.gov.ye',
    firstName: 'أحمد',
    lastName: 'المساح',
    role: 'staff',
    profileImageUrl: null,
    isActive: true,
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
  },
  {
    username: 'deputy_technical',
    password: '$2b$10$def456ghi789jkl012mno345pqr678stu', // Deputy@2025!
    email: 'deputy.technical@banna-yemen.gov.ye',
    firstName: 'محمد',
    lastName: 'الهندسي',
    role: 'deputy_admin_technical',
    profileImageUrl: null,
    isActive: true,
    loginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
  },
];

// Role hierarchy and permissions
export const ROLE_HIERARCHY = {
  admin: 5,
  deputy_admin_first: 4,
  deputy_admin_planning: 3,
  deputy_admin_technical: 3,
  deputy_admin_inspection: 3,
  deputy_admin_projects: 3,
  deputy_admin_finance: 3,
  manager: 2,
  section_head: 1,
  staff: 0,
} as const;

export const ROLE_NAMES_AR = {
  admin: 'المدير العام',
  deputy_admin_first: 'النائب الأول',
  deputy_admin_planning: 'نائب المدير العام للتخطيط والمتابعة',
  deputy_admin_technical: 'نائب المدير العام للشؤون الفنية',
  deputy_admin_inspection: 'نائب المدير العام للتفتيش الفني',
  deputy_admin_projects: 'نائب المدير العام للمشاريع',
  deputy_admin_finance: 'نائب المدير العام للشؤون المالية',
  manager: 'مدير إدارة',
  section_head: 'رئيس قسم',
  staff: 'موظف',
} as const;

export type RoleCode = keyof typeof ROLE_HIERARCHY;