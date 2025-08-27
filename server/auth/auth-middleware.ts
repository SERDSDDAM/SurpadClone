import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { storage } from "../storage";
import { User } from "@shared/schema";

// Environment variables for JWT
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: {
    id: string;
    sessionToken: string;
  };
}

// Authentication Middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: "Access token required",
        code: "NO_TOKEN" 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const sessionId = decoded.sessionId;

    // Get user from storage
    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: "User not found or inactive",
        code: "USER_NOT_FOUND" 
      });
    }

    // Validate session
    const session = await storage.getUserSession(sessionId);
    if (!session || !session.isActive || new Date() > new Date(session.expiresAt)) {
      return res.status(401).json({ 
        message: "Session expired or invalid",
        code: "INVALID_SESSION" 
      });
    }

    // Update last accessed time
    await storage.updateSessionAccess(sessionId);

    // Attach user and session to request
    req.user = user;
    req.session = {
      id: sessionId,
      sessionToken: session.sessionToken
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ 
      message: "Invalid or expired token",
      code: "INVALID_TOKEN" 
    });
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRoles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: "Authentication required",
        code: "NO_AUTH" 
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        required: roles,
        current: userRole
      });
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (requiredPermissions: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: "Authentication required",
        code: "NO_AUTH" 
      });
    }

    const userPermissions = req.user.permissions || [];
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

    const hasPermission = permissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes("*")
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: "Required permissions not granted",
        code: "MISSING_PERMISSIONS",
        required: permissions,
        current: userPermissions
      });
    }

    next();
  };
};

// Two-Factor Authentication verification
export const require2FA = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user has 2FA enabled
    if (!req.user.twoFactorEnabled) {
      return next(); // Skip 2FA if not enabled
    }

    const { twoFactorToken } = req.body;
    
    if (!twoFactorToken) {
      return res.status(401).json({ 
        message: "Two-factor authentication token required",
        code: "2FA_REQUIRED" 
      });
    }

    // Verify 2FA token
    const isValid = await verify2FAToken(req.user.id, twoFactorToken);
    
    if (!isValid) {
      return res.status(401).json({ 
        message: "Invalid two-factor authentication token",
        code: "INVALID_2FA" 
      });
    }

    next();
  } catch (error) {
    console.error("2FA verification error:", error);
    return res.status(500).json({ message: "2FA verification failed" });
  }
};

// Utility Functions

export const generateJWT = (userId: string, sessionId: string): string => {
  return jwt.sign(
    { userId, sessionId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generate2FASecret = (): { secret: string; qrCode: string } => {
  const secret = speakeasy.generateSecret({
    name: "بنّاء اليمن",
    issuer: "Yemen Construction Platform",
    length: 32,
  });

  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url || "",
  };
};

export const verify2FAToken = async (userId: string, token: string): Promise<boolean> => {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.twoFactorSecret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps (60 seconds) tolerance
    });

    // Log the verification attempt
    await storage.createAuditLog({
      userId,
      action: "2fa_verification",
      resource: "authentication",
      success: verified,
      details: { tokenProvided: !!token },
    });

    return verified;
  } catch (error) {
    console.error("2FA verification error:", error);
    return false;
  }
};

export const generatePasswordResetToken = (): string => {
  return Math.random().toString(36).substr(2, 20) + Date.now().toString(36);
};

export const generateApiKey = (): string => {
  const prefix = "byk_"; // بنّاء اليمن key prefix
  const randomPart = Math.random().toString(36).substr(2, 32);
  const timestamp = Date.now().toString(36);
  return `${prefix}${randomPart}${timestamp}`;
};

// Account lockout functions
export const isAccountLocked = (user: User): boolean => {
  if (!user.lockedUntil) return false;
  return new Date() < new Date(user.lockedUntil);
};

export const incrementLoginAttempts = async (userId: string): Promise<void> => {
  const user = await storage.getUser(userId);
  if (!user) return;

  const attempts = (user.loginAttempts || 0) + 1;
  const maxAttempts = 5;
  const lockoutDuration = 30 * 60 * 1000; // 30 minutes

  let updateData: any = { loginAttempts: attempts };

  if (attempts >= maxAttempts) {
    updateData.lockedUntil = new Date(Date.now() + lockoutDuration);
  }

  await storage.updateUser(userId, updateData);
};

export const clearLoginAttempts = async (userId: string): Promise<void> => {
  await storage.updateUser(userId, {
    loginAttempts: 0,
    lockedUntil: null,
  });
};