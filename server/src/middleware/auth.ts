import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { Role } from '@prisma/client';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: Role;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

/**
 * Authenticate requests using JWT tokens.
 * Expects Authorization: Bearer <token> header.
 * Attaches userId and userRole to req.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // Verify user still exists in DB and check for ban
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        role: true,
        isBanned: true,
        banReason: true
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ 
        error: 'Your account has been banned from taking the quiz.',
        reason: user.banReason || 'Excessive tab switching detected.'
      });
      return;
    }

    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Optional authentication - attaches user info if token is valid,
 * but doesn't block if no token is present.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ') && process.env.JWT_SECRET) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { 
          id: true, 
          role: true,
          isBanned: true 
        },
      });

      if (user && !user.isBanned) {
        req.userId = user.id;
        req.userRole = user.role;
      }
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};

/**
 * Middleware to check if the authenticated user has the required role.
 * Must be used after `authenticate` middleware.
 *
 * Usage:
 *   router.get('/admin', requireRole('ADMIN'), handler);
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Generate a JWT token for a user.
 */
export function generateToken(
  userId: string,
  email: string,
  role: Role
): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );
}
