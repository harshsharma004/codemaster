import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/security';
import { prisma } from '../db';

export const authRateLimiter = rateLimit({
  windowMs: env.CodeMaster_AUTH_RATE_LIMIT_WINDOW_SECONDS * 1000,
  max: env.CodeMaster_AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  message: { detail: 'Too many login attempts. Please wait and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const friendLookupLimiter = rateLimit({
  windowMs: 60 * 1000, // Hardcoded 60s window matching Go's FriendLookupLimiter defaults or env.
  max: 20, // max 20 attempts
  message: { detail: 'Too many search requests. Please wait and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request, res: Response) => {
    return `${(req as any).user?.id || 'anon'}:${ipKeyGenerator(req, res)}`;
  }
});

export interface AuthRequest extends Request {
  user?: any; // We will type this properly later, using Prisma User model
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
  }

  const token = authHeader.split(' ')[1].trim();
  const userIdStr = verifyAccessToken(token);

  if (!userIdStr) {
    return res.status(401).json({ detail: 'Invalid or expired authentication token.' });
  }

  try {
    const userId = BigInt(userIdStr);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ detail: 'Authenticated user no longer exists.' });
    }
    
    // Convert BigInt IDs to string for easier JSON serialization downstream
    const serializedUser = {
      ...user,
      id: user.id.toString(),
    };
    
    req.user = serializedUser;
    next();
  } catch (error) {
    return res.status(500).json({ detail: 'Failed to load the authenticated user.' });
  }
};
