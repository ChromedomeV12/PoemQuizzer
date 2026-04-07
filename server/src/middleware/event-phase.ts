import { Request, Response, NextFunction } from 'express';

export enum EventPhase {
  PRE_QUALIFIER = 'PRE_QUALIFIER',
  FINALS = 'FINALS',
  CLOSED = 'CLOSED',
}

/**
 * Determines the current event phase based on server time.
 */
export function getCurrentPhase(): EventPhase {
  const now = new Date();

  const preQualifierEnd = new Date(
    process.env.PRE_QUALIFIER_END_DATE || '2026-04-20T23:59:59Z'
  );
  const finalsStart = new Date(
    process.env.FINALS_START_DATE || '2026-04-24T16:45:00Z'
  );
  const finalsEnd = new Date(
    process.env.FINALS_END_DATE || '2026-04-24T18:45:00Z'
  );

  if (now < preQualifierEnd) {
    return EventPhase.PRE_QUALIFIER;
  }

  if (now >= finalsStart && now <= finalsEnd) {
    return EventPhase.FINALS;
  }

  // After finals end or between pre-qualifier end and finals start
  if (now > finalsEnd) {
    return EventPhase.CLOSED;
  }

  // Between pre-qualifier end and finals start - allow pre-qualifier still
  if (now >= preQualifierEnd && now < finalsStart) {
    return EventPhase.PRE_QUALIFIER;
  }

  return EventPhase.CLOSED;
}

/**
 * Middleware to gate access based on event phase.
 *
 * Usage:
 *   // Only allow access during pre-qualifier
 *   router.get('/quiz', requirePhase('PRE_QUALIFIER'), handler);
 *
 *   // Allow access during pre-qualifier OR finals
 *   router.get('/quiz', requirePhase('PRE_QUALIFIER', 'FINALS'), handler);
 */
export const requirePhase = (...allowedPhases: EventPhase[]) => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const currentPhase = getCurrentPhase();

    if (!allowedPhases.includes(currentPhase)) {
      res.status(403).json({
        error: 'This phase is not currently active',
        currentPhase,
        allowedPhases,
      });
      return;
    }

    // Attach current phase to request for use in handlers
    (res.locals as Record<string, unknown>).currentPhase = currentPhase;

    next();
  };
};

/**
 * Get available phases as a human-readable string.
 */
export function getPhaseStatus(): {
  currentPhase: EventPhase;
  isPreQualifierActive: boolean;
  isFinalsActive: boolean;
  isClosed: boolean;
} {
  const currentPhase = getCurrentPhase();

  return {
    currentPhase,
    isPreQualifierActive: currentPhase === EventPhase.PRE_QUALIFIER,
    isFinalsActive: currentPhase === EventPhase.FINALS,
    isClosed: currentPhase === EventPhase.CLOSED,
  };
}
