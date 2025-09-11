import express from 'express';
import { csrfTokenEndpoint } from '../middleware/csrf';
import { queryRateLimit } from '../middleware/enhanced-rate-limiting';

const router = express.Router();

// GET /api/csrf-token - الحصول على رمز CSRF
router.get('/csrf-token', queryRateLimit, csrfTokenEndpoint);

// POST /api/csrf-token - تجديد رمز CSRF
router.post('/csrf-token', queryRateLimit, csrfTokenEndpoint);

export default router;