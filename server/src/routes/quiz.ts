import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Prisma, EventPhase as PrismaEventPhase } from '@prisma/client';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { validateTiming } from '../middleware/timing-validator';
import { requirePhase, EventPhase } from '../middleware/event-phase';
import { matchKeywords } from '../utils/keyword-matcher';
import { sanitizeAnswer } from '../utils/sanitization';

const router = Router();

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// PUBLIC ROUTES (no auth required)
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

// GET /api/quiz/status
router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const preQualifierEnd = new Date(
      process.env.PRE_QUALIFIER_END_DATE || '2026-04-20T23:59:59Z'
    );
    const finalsStart = new Date(
      process.env.FINALS_START_DATE || '2026-04-24T16:45:00Z'
    );
    const finalsEnd = new Date(
      process.env.FINALS_END_DATE || '2026-04-24T18:45:00Z'
    );

    res.json({
      phases: {
        preQualifier: {
          active: new Date() < preQualifierEnd,
          endDate: preQualifierEnd.toISOString(),
        },
        finals: {
          active: new Date() >= finalsStart && new Date() <= finalsEnd,
          startDate: finalsStart.toISOString(),
          endDate: finalsEnd.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Quiz status error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz status' });
  }
});

// GET /api/quiz/leaderboard?phase=PRE_QUALIFIER|FINALS
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phase } = req.query;
    const limit = Math.min(
      parseInt((req.query.limit as string) || '50', 10),
      100
    );

    const phaseFilter =
      phase === 'FINALS'
        ? EventPhase.FINALS
        : EventPhase.PRE_QUALIFIER;

    const scores = await prisma.score.findMany({
      where: {
        phase: phaseFilter as unknown as PrismaEventPhase,
        totalQuestions: { gt: 0 },
      },
      include: {
        user: {
          select: {
            fullName: true,
            grade: true,
            studentId: true,
          },
        },
      },
      orderBy: [
        { totalScore: 'desc' },
        { timeCompleted: 'asc' },
      ],
      take: limit,
    });

    res.json({
      phase: phaseFilter,
      leaderboard: scores.map((s, index) => ({
        rank: index + 1,
        fullName: s.user.fullName || 'Anonymous',
        grade: s.user.grade,
        studentId: s.user.studentId,
        totalScore: s.totalScore,
        correctAnswers: s.correctAnswers,
        totalQuestions: s.totalQuestions,
        timeCompleted: s.timeCompleted,
      })),
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// PROTECTED ROUTES (auth required)
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
router.use(authenticate);

// GET /api/quiz/questions?phase=PRE_QUALIFIER|FINALS
router.get(
  '/questions',
  requirePhase(EventPhase.PRE_QUALIFIER, EventPhase.FINALS),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { phase } = req.query;

      if (
        phase !== EventPhase.PRE_QUALIFIER &&
        phase !== EventPhase.FINALS
      ) {
        res.status(400).json({
          error: 'Invalid phase. Use PRE_QUALIFIER or FINALS',
        });
        return;
      }

      const questions = await prisma.question.findMany({
        where: {
          phase: phase as unknown as PrismaEventPhase,
          isActive: true,
        },
        select: {
          id: true,
          type: true,
          questionText: true,
          imageUrl: true,
          options: true,
          timeLimit: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      });

      const submissions = await prisma.submission.findMany({
        where: {
          userId: req.userId,
          question: { phase: phase as unknown as PrismaEventPhase },
        },
        select: { questionId: true },
      });

      const answeredIds = new Set(submissions.map((s) => s.questionId));

      res.json({
        phase,
        questions: questions.map((q) => ({
          ...q,
          answered: answeredIds.has(q.id),
        })),
      });
    } catch (error) {
      console.error('Get questions error:', error);
      res.status(500).json({ error: 'Failed to fetch questions' });
    }
  }
);

// GET /api/quiz/question/:id
router.get(
  '/question/:id',
  requirePhase(EventPhase.PRE_QUALIFIER, EventPhase.FINALS),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      const question = await prisma.question.findFirst({
        where: {
          id,
          isActive: true,
        },
        select: {
          id: true,
          type: true,
          phase: true,
          questionText: true,
          imageUrl: true,
          options: true,
          timeLimit: true,
          order: true,
        },
      });

      if (!question) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      const existingSubmission = await prisma.submission.findUnique({
        where: {
          userId_questionId: {
            userId: req.userId!,
            questionId: id,
          },
        },
      });

      res.json({
        question,
        alreadyAnswered: !!existingSubmission,
      });
    } catch (error) {
      console.error('Get question error:', error);
      res.status(500).json({ error: 'Failed to fetch question' });
    }
  }
);

// POST /api/quiz/submit
router.post(
  '/submit',
  requirePhase(EventPhase.PRE_QUALIFIER, EventPhase.FINALS),
  validateTiming,
  [
    body('questionId').notEmpty().withMessage('Question ID is required'),
    body('answer').notEmpty().withMessage('Answer is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { questionId, answer, timeTaken, tabSwitches } = req.body;
      const userId = req.userId!;

      // Anti-cheat: penalty for tab switching
      // Each tab switch removes 1 point (min 0), auto-wrong if >= 5 switches
      const switchCount = Math.max(0, parseInt(tabSwitches || '0', 10));

      const existingSubmission = await prisma.submission.findUnique({
        where: {
          userId_questionId: {
            userId,
            questionId,
          },
        },
      });

      if (existingSubmission) {
        res.status(409).json({
          error: 'Question already answered',
          submission: {
            isCorrect: existingSubmission.isCorrect,
          },
        });
        return;
      }

      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question || !question.isActive) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      const sanitizedAnswer = sanitizeAnswer(answer);

      let isCorrect = false;

      switch (question.type) {
        case 'MULTIPLE_CHOICE':
        case 'TRUE_FALSE': {
          const correctAnswer = (
            question.correctAnswer as string
          ).toLowerCase();
          isCorrect = sanitizedAnswer.toLowerCase() === correctAnswer;
          break;
        }

        case 'SHORT_ANSWER': {
          const keywords = question.keywords as string[] | null;
          if (keywords && keywords.length > 0) {
            const matchResult = matchKeywords(sanitizedAnswer, keywords);
            isCorrect = matchResult.isCorrect;
          } else {
            isCorrect =
              sanitizedAnswer.toLowerCase() ===
              (question.correctAnswer as string).toLowerCase();
          }
          break;
        }

        default:
          res.status(400).json({ error: 'Unknown question type' });
          return;
      }

      // Anti-cheat: >= 5 tab switches = auto-wrong AND permanent ban
      const isAutoWrong = switchCount >= 5;
      const finalIsCorrect = isAutoWrong ? false : isCorrect;

      if (isAutoWrong) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            isBanned: true,
            banReason: `Excessive tab switching detected (${switchCount} switches) on question ${questionId}.`,
            bannedAt: new Date(),
          },
        });
      }

      const submission = await prisma.submission.create({
        data: {
          userId,
          questionId,
          userAnswer: sanitizedAnswer,
          isCorrect: finalIsCorrect,
          timeTaken: parseInt(timeTaken, 10),
          tabSwitches: switchCount,
        },
      });

      const points = finalIsCorrect ? question.points : 0;

      await prisma.score.upsert({
        where: {
          userId_phase: {
            userId,
            phase: question.phase as unknown as PrismaEventPhase,
          },
        },
        update: {
          totalScore: { increment: points },
          correctAnswers: { increment: isCorrect ? 1 : 0 },
          totalQuestions: { increment: 1 },
        },
        create: {
          userId,
          phase: question.phase as unknown as PrismaEventPhase,
          totalScore: points,
          correctAnswers: isCorrect ? 1 : 0,
          totalQuestions: 1,
        },
      });

      let correctAnswerDisplay = question.correctAnswer as string;
      if (question.type === 'SHORT_ANSWER' && question.keywords) {
        correctAnswerDisplay = (question.keywords as string[]).join(' / ');
      }

      res.json({
        submission: {
          id: submission.id,
          isCorrect: finalIsCorrect,
          userAnswer: sanitizedAnswer,
          tabSwitches: switchCount,
          autoPenalized: isAutoWrong,
        },
        correctAnswer: correctAnswerDisplay,
        points: finalIsCorrect ? question.points : 0,
        explanation: question.explanation || null,
        antiCheatWarning: switchCount > 0 && switchCount < 5
          ? `⚠️ 已检测到${switchCount}次切屏，再切${5 - switchCount}次将自动判错`
          : switchCount >= 5
            ? '❌ 切屏次数过多，本题自动判错'
            : null,
      });
    } catch (error) {
      console.error('Submit answer error:', error);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        res.status(409).json({ error: 'Question already answered' });
        return;
      }

      res.status(500).json({ error: 'Failed to submit answer' });
    }
  }
);

// GET /api/quiz/score?phase=PRE_QUALIFIER|FINALS
router.get('/score', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phase } = req.query;

    if (
      phase !== EventPhase.PRE_QUALIFIER &&
      phase !== EventPhase.FINALS
    ) {
      res.status(400).json({
        error: 'Invalid phase. Use PRE_QUALIFIER or FINALS',
      });
      return;
    }

    const score = await prisma.score.findUnique({
      where: {
        userId_phase: {
          userId: req.userId!,
          phase: phase as unknown as PrismaEventPhase,
        },
      },
    });

    const totalQuestions = await prisma.question.count({
      where: {
        phase: phase as unknown as PrismaEventPhase,
        isActive: true,
      },
    });

    res.json({
      score: score
        ? {
            totalScore: score.totalScore,
            correctAnswers: score.correctAnswers,
            totalQuestions: score.totalQuestions,
            timeCompleted: score.timeCompleted,
          }
        : {
            totalScore: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            timeCompleted: null,
          },
      totalAvailable: totalQuestions,
    });
  } catch (error) {
    console.error('Get score error:', error);
    res.status(500).json({ error: 'Failed to fetch score' });
  }
});

export default router;


