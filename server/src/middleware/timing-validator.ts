import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

// Minimum reasonable time per question (milliseconds)
const MIN_REASONABLE_TIME = 2000; // 2 seconds

/**
 * Validates that the time taken to answer a question is realistic.
 * Prevents cheating by submitting answers impossibly fast.
 *
 * Expects:
 *   - req.body.timeTaken (ms) - client-reported time
 *   - req.body.questionId - the question being answered
 *
 * Cross-references with server-side tracking if available.
 */
export const validateTiming = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { timeTaken, questionId } = req.body;

    if (timeTaken === undefined || timeTaken === null) {
      res.status(400).json({ error: 'Time taken is required' });
      return;
    }

    const timeMs = parseInt(timeTaken, 10);

    if (isNaN(timeMs) || timeMs < 0) {
      res.status(400).json({ error: 'Invalid time value' });
      return;
    }

    // Reject impossibly fast answers
    if (timeMs < MIN_REASONABLE_TIME) {
      res.status(400).json({
        error: 'Answer submitted too quickly',
        suspicious: true,
      });
      return;
    }

    // Check against the question's time limit
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { timeLimit: true },
    });

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const maxTimeMs = question.timeLimit * 1000;

    // Allow some tolerance for network latency (2 seconds)
    if (timeMs > maxTimeMs + 2000) {
      res.status(400).json({
        error: 'Time exceeded question limit',
        maxTime: maxTimeMs,
        submittedTime: timeMs,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Timing validation error:', error);
    res.status(500).json({ error: 'Timing validation failed' });
  }
};
