import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

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
