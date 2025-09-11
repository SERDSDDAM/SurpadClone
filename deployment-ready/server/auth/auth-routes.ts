import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { 
  hashPassword, 
  verifyPassword, 
  generateJWT, 
  generate2FASecret,
  verify2FAToken,
  generatePasswordResetToken,
  incrementLoginAttempts,
  clearLoginAttempts,
  isAccountLocked,
  AuthenticatedRequest
} from "./auth-middleware";
import { storage } from "../storage";
import { insertUserSchema, User } from "@shared/schema";
import { z } from "zod";
import qrcode from "qrcode";

const router = Router();

// Rate limiting for authentication endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    message: "Too many login attempts, please try again later",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests, please try again later",
    code: "RATE_LIMIT_EXCEEDED"
  },
});

// Apply rate limiting
router.use("/login", loginLimiter);
router.use("/", generalLimiter);

// Registration Schema
const registerSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login Schema  
const loginSchema = z.object({
  nationalId: z.string().min(1, "National ID is required"),
  password: z.string().min(1, "Password is required"),
  twoFactorToken: z.string().optional(),
  rememberMe: z.boolean().optional().default(false),
});

// Register new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { confirmPassword, ...userData } = validatedData;

    // Check if user already exists
    const existingUser = await storage.getUserByNationalId(userData.nationalId);
    if (existingUser) {
      return res.status(409).json({
        message: "User with this National ID already exists",
        code: "USER_EXISTS"
      });
    }

    // Check if email already exists (if provided)
    if (userData.email) {
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({
          message: "User with this email already exists",
          code: "EMAIL_EXISTS"
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
      isVerified: false, // Will need verification
    });

    // Create audit log
    await storage.createAuditLog({
      userId: newUser.id,
      action: "register",
      resource: "user",
      resourceId: newUser.id,
      details: {
        newValues: {
          nationalId: newUser.nationalId,
          email: newUser.email,
          role: newUser.role
        }
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    // Remove sensitive data from response
    const { password, twoFactorSecret, backupCodes, ...userResponse } = newUser;

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: "Registration failed",
      code: "REGISTRATION_FAILED"
    });
  }
});

// Login user
router.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { nationalId, password, twoFactorToken, rememberMe } = validatedData;

    // Get user by national ID
    const user = await storage.getUserByNationalId(nationalId);
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      return res.status(423).json({
        message: "Account is temporarily locked due to too many failed attempts",
        code: "ACCOUNT_LOCKED",
        lockedUntil: user.lockedUntil
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password || "");
    if (!isValidPassword) {
      await incrementLoginAttempts(user.id);
      
      await storage.createAuditLog({
        userId: user.id,
        action: "login",
        resource: "authentication",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        success: false,
        errorMessage: "Invalid password",
        severity: "warning",
      });

      return res.status(401).json({
        message: "Invalid credentials",
        code: "INVALID_CREDENTIALS"
      });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled && !twoFactorToken) {
      return res.status(206).json({
        message: "Two-factor authentication required",
        code: "2FA_REQUIRED",
        requires2FA: true
      });
    }

    // Verify 2FA token if provided
    if (user.twoFactorEnabled && twoFactorToken) {
      const is2FAValid = await verify2FAToken(user.id, twoFactorToken);
      if (!is2FAValid) {
        await incrementLoginAttempts(user.id);
        
        return res.status(401).json({
          message: "Invalid two-factor authentication code",
          code: "INVALID_2FA"
        });
      }
    }

    // Clear login attempts on successful login
    await clearLoginAttempts(user.id);

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    const session = await storage.createUserSession({
      userId: user.id,
      sessionToken: generatePasswordResetToken(), // Reuse token generation
      deviceInfo: {
        deviceType: req.get("sec-ch-ua-mobile") === "?1" ? "mobile" : "desktop",
        browser: req.get("sec-ch-ua") || "unknown",
        os: req.get("sec-ch-ua-platform") || "unknown",
        ipAddress: req.ip || "unknown",
        userAgent: req.get("User-Agent") || "unknown",
      },
      expiresAt,
    });

    // Generate JWT token
    const token = generateJWT(user.id, session.id);

    // Update last login
    await storage.updateUser(user.id, {
      lastLogin: new Date(),
    });

    // Create audit log
    await storage.createAuditLog({
      userId: user.id,
      action: "login",
      resource: "authentication",
      details: {
        metadata: {
          sessionId: session.id,
          twoFactorUsed: user.twoFactorEnabled,
          rememberMe
        }
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    // Remove sensitive data from response
    const { password: _, twoFactorSecret, backupCodes, ...userResponse } = user;

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      message: "Login failed",
      code: "LOGIN_FAILED"
    });
  }
});

// Logout user
router.post("/logout", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.session) {
      return res.status(401).json({
        message: "Not authenticated",
        code: "NOT_AUTHENTICATED"
      });
    }

    // Deactivate session
    await storage.deactivateUserSession(req.session.id);

    // Create audit log
    await storage.createAuditLog({
      userId: req.user.id,
      action: "logout",
      resource: "authentication",
      details: {
        metadata: { sessionId: req.session.id }
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      success: true,
    });

    res.json({
      message: "Logged out successfully"
    });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Logout failed"
    });
  }
});

// Get current user profile
router.get("/me", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authenticated",
        code: "NOT_AUTHENTICATED"
      });
    }

    // Remove sensitive data
    const { password, twoFactorSecret, backupCodes, ...userResponse } = req.user;

    res.json({
      user: userResponse
    });

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      message: "Failed to get profile"
    });
  }
});

// Setup 2FA
router.post("/setup-2fa", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { password } = req.body;

    // Verify current password
    const isValidPassword = await verifyPassword(password, req.user.password || "");
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid password",
        code: "INVALID_PASSWORD"
      });
    }

    // Generate 2FA secret
    const { secret, qrCode } = generate2FASecret();

    // Generate QR code for easier setup
    const qrCodeImage = await qrcode.toDataURL(qrCode);

    // Save secret (temporarily - will be confirmed on verification)
    await storage.updateUser(req.user.id, {
      twoFactorSecret: secret,
    });

    res.json({
      message: "2FA setup initiated",
      secret,
      qrCode: qrCodeImage,
      manualEntryKey: secret,
    });

  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({
      message: "Failed to setup 2FA"
    });
  }
});

// Confirm 2FA setup
router.post("/confirm-2fa", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "2FA token is required",
        code: "TOKEN_REQUIRED"
      });
    }

    // Verify 2FA token
    const isValid = await verify2FAToken(req.user.id, token);
    if (!isValid) {
      return res.status(401).json({
        message: "Invalid 2FA token",
        code: "INVALID_TOKEN"
      });
    }

    // Enable 2FA
    await storage.updateUser(req.user.id, {
      twoFactorEnabled: true,
    });

    // Create audit log
    await storage.createAuditLog({
      userId: req.user.id,
      action: "enable_2fa",
      resource: "security",
      success: true,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      message: "2FA enabled successfully"
    });

  } catch (error) {
    console.error("2FA confirmation error:", error);
    res.status(500).json({
      message: "Failed to confirm 2FA"
    });
  }
});

// Disable 2FA
router.post("/disable-2fa", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { password, token } = req.body;

    // Verify current password
    const isValidPassword = await verifyPassword(password, req.user.password || "");
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid password",
        code: "INVALID_PASSWORD"
      });
    }

    // Verify current 2FA token
    if (req.user.twoFactorEnabled) {
      const isValid = await verify2FAToken(req.user.id, token);
      if (!isValid) {
        return res.status(401).json({
          message: "Invalid 2FA token",
          code: "INVALID_TOKEN"
        });
      }
    }

    // Disable 2FA
    await storage.updateUser(req.user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    // Create audit log
    await storage.createAuditLog({
      userId: req.user.id,
      action: "disable_2fa",
      resource: "security",
      success: true,
      severity: "warning",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      message: "2FA disabled successfully"
    });

  } catch (error) {
    console.error("2FA disable error:", error);
    res.status(500).json({
      message: "Failed to disable 2FA"
    });
  }
});

// Get user sessions
router.get("/sessions", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const sessions = await storage.getUserSessions(req.user.id);

    res.json({
      sessions: sessions.map(session => ({
        id: session.id,
        deviceInfo: session.deviceInfo,
        location: session.location,
        isActive: session.isActive,
        isCurrent: session.id === req.session?.id,
        createdAt: session.createdAt,
        lastAccessedAt: session.lastAccessedAt,
        expiresAt: session.expiresAt,
      }))
    });

  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      message: "Failed to get sessions"
    });
  }
});

// Revoke session
router.delete("/sessions/:sessionId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { sessionId } = req.params;

    // Verify session belongs to user
    const session = await storage.getUserSession(sessionId);
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({
        message: "Session not found",
        code: "SESSION_NOT_FOUND"
      });
    }

    // Deactivate session
    await storage.deactivateUserSession(sessionId);

    // Create audit log
    await storage.createAuditLog({
      userId: req.user.id,
      action: "revoke_session",
      resource: "security",
      resourceId: sessionId,
      success: true,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      message: "Session revoked successfully"
    });

  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({
      message: "Failed to revoke session"
    });
  }
});

export default router;