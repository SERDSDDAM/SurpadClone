/**
 * Citizen Storage Module - يدير المواطنين والمستخدمين والجلسات
 * مسؤول عن: Citizens, Users, Authentication, Sessions
 */

import { randomUUID } from "crypto";
import {
  type Citizen, type InsertCitizen,
  type User, type InsertUser,
  type UserSession, type InsertUserSession,
} from "@shared/schema";

export class CitizenStorageService {
  private citizens: Citizen[] = [];
  private users: User[] = [];
  private userSessions: UserSession[] = [];

  // ================================
  // Citizens Management
  // ================================

  async getCitizens(): Promise<Citizen[]> {
    return this.citizens;
  }

  async getCitizen(id: string): Promise<Citizen | undefined> {
    return this.citizens.find(citizen => citizen.id === id);
  }

  async getCitizenByNationalId(nationalId: string): Promise<Citizen | undefined> {
    return this.citizens.find(citizen => citizen.nationalId === nationalId);
  }

  async createCitizen(citizenData: InsertCitizen): Promise<Citizen> {
    const citizen: Citizen = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      phone: "",
      nationalId: "",
      firstName: "",
      lastName: "",
      address: "",
      district: "",
      governorate: "",
      email: null,
      dateOfBirth: null,
      status: "active",
      registrationDate: new Date(),
      totalRequests: null,
      ...citizenData,
    };
    this.citizens.push(citizen);
    return citizen;
  }

  async updateCitizen(id: string, citizenData: Partial<Citizen>): Promise<Citizen | undefined> {
    const index = this.citizens.findIndex(citizen => citizen.id === id);
    if (index === -1) return undefined;
    
    this.citizens[index] = {
      ...this.citizens[index],
      ...citizenData,
      updatedAt: new Date(),
    };
    
    return this.citizens[index];
  }

  // ================================
  // Users & Authentication
  // ================================

  async getUser(userId: string): Promise<User | undefined> {
    return this.users.find(user => user.id === userId);
  }

  async getUserByNationalId(nationalId: string): Promise<User | undefined> {
    return this.users.find(user => user.nationalId === nationalId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      username: "",
      password: "",
      email: null,
      isActive: null,
      firstName: null,
      lastName: null,
      nationalId: "",
      role: "user",
      profileImageUrl: null,
      phoneNumber: null,
      dateOfBirth: null,
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      ...userData,
    };
    this.users.push(user);
    return user;
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === userId);
    if (index === -1) return undefined;
    
    this.users[index] = {
      ...this.users[index],
      ...updateData,
      updatedAt: new Date(),
    };
    
    return this.users[index];
  }

  // ================================
  // Session Management
  // ================================

  async createUserSession(sessionData: InsertUserSession): Promise<UserSession> {
    const session: UserSession = {
      id: randomUUID(),
      active: true,
      userId: "",
      sessionToken: "",
      ipAddress: null,
      userAgent: null,
      loginAt: new Date(),
      lastActivity: new Date(),
      logoutAt: null,
      ...sessionData,
    };
    this.userSessions.push(session);
    return session;
  }

  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    return this.userSessions.find(session => session.id === sessionId);
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return this.userSessions.filter(session => session.userId === userId);
  }

  async updateSessionAccess(sessionId: string): Promise<void> {
    const session = this.userSessions.find(s => s.id === sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  async deactivateUserSession(sessionId: string): Promise<void> {
    const session = this.userSessions.find(s => s.id === sessionId);
    if (session) {
      session.active = false;
      session.logoutAt = new Date();
    }
  }
}