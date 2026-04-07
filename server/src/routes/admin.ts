import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Prisma, EventPhase as PrismaEventPhase } from '@prisma/client';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';
import { EventPhase } from '../middleware/event-phase';
import { sanitizeInput, isValidStudentId, isValidName } from '../utils/sanitization';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// USER MANAGEMENT
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

// GET /api/admin/users �?List all registered users
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page, limit } = req.query;
    const pageNum = Math.max(parseInt((page as string) || '1', 10), 1);
    const limitNum = Math.min(
      parseInt((limit as string) || '50', 10),
      100
    );
    const skip = (pageNum - 1) * limitNum;

    const whereClause: Prisma.UserWhereInput = {};

    if (search) {
      const searchTerm = sanitizeInput(search as string);
      whereClause.OR = [
        { fullName: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { username: { contains: searchTerm } },
        { studentId: { contains: searchTerm } },
        { grade: { contains: searchTerm } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          fullName: true,
          grade: true,
          
          studentId: true,
          profileComplete: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id �?Edit user profile
router.put(
  '/users/:id',
  [param('id').isUUID().withMessage('Valid user ID is required')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params as { id: string };
      const { fullName, grade, studentId, role } = req.body;

      const user = await prisma.user.findUnique({ where: { id } });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updateData: Prisma.UserUpdateInput = {};

      if (fullName !== undefined) {
        const sanitizedName = sanitizeInput(fullName);
        if (!isValidName(sanitizedName)) {
          res.status(400).json({ error: 'Invalid name format' });
          return;
        }
        updateData.fullName = sanitizedName;
      }

      if (grade !== undefined) {
        updateData.grade = sanitizeInput(grade);
      }

      if (studentId !== undefined) {
        const sanitizedStudentId = sanitizeInput(studentId).toUpperCase();
        if (!isValidStudentId(sanitizedStudentId)) {
          res.status(400).json({ error: 'Invalid student ID format' });
          return;
        }

        // Check for duplicates
        const existingUser = await prisma.user.findUnique({
          where: { studentId: sanitizedStudentId },
        });

        if (existingUser && existingUser.id !== id) {
          res.status(409).json({ error: 'Student ID already in use' });
          return;
        }

        updateData.studentId = sanitizedStudentId;
      }

      if (role !== undefined) {
        if (role !== 'USER' && role !== 'ADMIN') {
          res.status(400).json({ error: 'Invalid role' });
          return;
        }
        updateData.role = role;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          fullName: true,
          grade: true,
          
          studentId: true,
          profileComplete: true,
        },
      });

      // Log the admin action
      await prisma.adminLog.create({
        data: {
          adminId: req.userId!,
          action: 'EDIT_USER',
          details: { userId: id, fields: Object.keys(updateData) },
        },
      });

      res.json({ message: 'User updated', user: updatedUser });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// DELETE /api/admin/users/:id �?Delete a user
router.delete(
  '/users/:id',
  [param('id').isUUID().withMessage('Valid user ID is required')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      // Prevent admin from deleting themselves
      if (id === req.userId) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      await prisma.user.delete({ where: { id } });

      await prisma.adminLog.create({
        data: {
          adminId: req.userId!,
          action: 'DELETE_USER',
          details: { userId: id },
        },
      });

      res.json({ message: 'User deleted' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// QUESTION MANAGEMENT
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

// GET /api/admin/questions �?List all questions
router.get('/questions', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { phase, type } = _req.query;

    const whereClause: Prisma.QuestionWhereInput = {};

    if (phase && (phase === 'PRE_QUALIFIER' || phase === 'FINALS')) {
      whereClause.phase = phase as unknown as PrismaEventPhase;
    }

    if (
      type &&
      ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(type as string)
    ) {
      whereClause.type = type as Prisma.EnumQuestionTypeFilter;
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      orderBy: [{ phase: 'asc' }, { order: 'asc' }],
    });

    res.json({ questions });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// POST /api/admin/questions �?Create a new question
router.post(
  '/questions',
  [
    body('type')
      .isIn(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'])
      .withMessage('Valid question type is required'),
    body('phase')
      .isIn(['PRE_QUALIFIER', 'FINALS'])
      .withMessage('Valid phase is required'),
    body('questionText')
      .isLength({ min: 5, max: 2000 })
      .withMessage('Question text must be 5-2000 characters'),
    body('correctAnswer')
      .notEmpty()
      .withMessage('Correct answer is required'),
    body('timeLimit')
      .isInt({ min: 5, max: 300 })
      .withMessage('Time limit must be 5-300 seconds'),
    body('points')
      .isInt({ min: 1, max: 100 })
      .withMessage('Points must be 1-100'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        type,
        phase,
        questionText,
        imageUrl,
        options,
        correctAnswer,
        keywords,
        explanation,
        points,
        timeLimit,
        order,
      } = req.body;

      // Validate options for MC/TF
      if (
        (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') &&
        (!options || !Array.isArray(options) || options.length < 2)
      ) {
        res.status(400).json({
          error: 'Multiple choice and True/False questions require at least 2 options',
        });
        return;
      }

      // Validate keywords for short answer
      if (type === 'SHORT_ANSWER' && (!keywords || !Array.isArray(keywords) || keywords.length === 0)) {
        res.status(400).json({
          error: 'Short answer questions require at least one keyword',
        });
        return;
      }

      const question = await prisma.question.create({
        data: {
          type,
          phase,
          questionText: sanitizeInput(questionText),
          imageUrl: imageUrl ? sanitizeInput(imageUrl) : null,
          options: options ? (options as Prisma.InputJsonValue) : Prisma.JsonNull,
          correctAnswer: sanitizeInput(correctAnswer),
          keywords: keywords ? (keywords as Prisma.InputJsonValue) : Prisma.JsonNull,
          explanation: explanation ? sanitizeInput(explanation) : null,
          points: points || 1,
          timeLimit: timeLimit || 30,
          order: order || 0,
        },
      });

      await prisma.adminLog.create({
        data: {
          adminId: req.userId!,
          action: 'CREATE_QUESTION',
          details: { questionId: question.id, type, phase },
        },
      });

      res.status(201).json({ message: 'Question created', question });
    } catch (error) {
      console.error('Create question error:', error);
      res.status(500).json({ error: 'Failed to create question' });
    }
  }
);

// PUT /api/admin/questions/:id �?Update a question
router.put(
  '/questions/:id',
  [param('id').isUUID().withMessage('Valid question ID is required')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      const existingQuestion = await prisma.question.findUnique({
        where: { id },
      });

      if (!existingQuestion) {
        res.status(404).json({ error: 'Question not found' });
        return;
      }

      const updateData: Prisma.QuestionUpdateInput = {};

      const {
        questionText,
        imageUrl,
        options,
        correctAnswer,
        keywords,
        explanation,
        points,
        timeLimit,
        order,
        isActive,
      } = req.body;

      if (questionText !== undefined)
        updateData.questionText = sanitizeInput(questionText);
      if (imageUrl !== undefined)
        updateData.imageUrl = imageUrl ? sanitizeInput(imageUrl) : null;
      if (options !== undefined) updateData.options = options as Prisma.InputJsonValue;
      if (correctAnswer !== undefined)
        updateData.correctAnswer = sanitizeInput(correctAnswer);
      if (keywords !== undefined) updateData.keywords = keywords as Prisma.InputJsonValue;
      if (explanation !== undefined)
        updateData.explanation = explanation ? sanitizeInput(explanation) : null;
      if (points !== undefined) updateData.points = points;
      if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
      if (order !== undefined) updateData.order = order;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedQuestion = await prisma.question.update({
        where: { id },
        data: updateData,
      });

      await prisma.adminLog.create({
        data: {
          adminId: req.userId!,
          action: 'UPDATE_QUESTION',
          details: { questionId: id },
        },
      });

      res.json({ message: 'Question updated', question: updatedQuestion });
    } catch (error) {
      console.error('Update question error:', error);
      res.status(500).json({ error: 'Failed to update question' });
    }
  }
);

// DELETE /api/admin/questions/:id �?Delete a question
router.delete(
  '/questions/:id',
  [param('id').isUUID().withMessage('Valid question ID is required')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params as { id: string };

      await prisma.question.delete({ where: { id } });

      await prisma.adminLog.create({
        data: {
          adminId: req.userId!,
          action: 'DELETE_QUESTION',
          details: { questionId: id },
        },
      });

      res.json({ message: 'Question deleted' });
    } catch (error) {
      console.error('Delete question error:', error);
      res.status(500).json({ error: 'Failed to delete question' });
    }
  }
);

// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝
// MONITORING & LEADERBOARD
// ╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝╝

// GET /api/admin/monitor �?Live participant progress
router.get('/monitor', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { phase } = _req.query;
    const phaseFilter =
      phase === 'FINALS' ? EventPhase.FINALS : EventPhase.PRE_QUALIFIER;

    // Get all users with their scores and submission counts
    const participants = await prisma.user.findMany({
      where: {
        profileComplete: true,
        role: 'USER',
      },
      include: {
        scores: {
          where: { phase: phaseFilter },
          select: {
            totalScore: true,
            correctAnswers: true,
            totalQuestions: true,
            timeCompleted: true,
          },
        },
        submissions: {
          where: {
            question: { phase: phaseFilter },
          },
          select: {
            answeredAt: true,
            isCorrect: true,
            timeTaken: true,
          },
        },
      },
    });

    const monitorData = participants.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      grade: p.grade,
      department: "",
      studentId: p.studentId,
      score: p.scores[0] || {
        totalScore: 0,
        correctAnswers: 0,
        totalQuestions: 0,
      },
      submissionCount: p.submissions.length,
      lastActivity: p.submissions.length
        ? p.submissions[p.submissions.length - 1].answeredAt
        : null,
    }));

    res.json({
      phase: phaseFilter,
      participants: monitorData,
      totalParticipants: monitorData.length,
    });
  } catch (error) {
    console.error('Monitor error:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring data' });
  }
});

// GET /api/admin/leaderboard �?Full leaderboard
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phase } = req.query;
    const phaseFilter =
      phase === 'FINALS' ? EventPhase.FINALS : EventPhase.PRE_QUALIFIER;

    const scores = await prisma.score.findMany({
      where: {
        phase: phaseFilter,
        totalQuestions: { gt: 0 },
      },
      include: {
        user: {
          select: {
            fullName: true,
            grade: true,
            
            studentId: true,
            email: true,
          },
        },
      },
      orderBy: [
        { totalScore: 'desc' },
        { correctAnswers: 'desc' },
        { timeCompleted: 'asc' },
      ],
    });

    res.json({
      phase: phaseFilter,
      leaderboard: scores.map((s, index) => ({
        rank: index + 1,
        userId: s.userId,
        fullName: s.user.fullName || 'Anonymous',
        email: s.user.email,
        grade: s.user.grade,
        studentId: s.user.studentId,
        totalScore: s.totalScore,
        correctAnswers: s.correctAnswers,
        totalQuestions: s.totalQuestions,
        timeCompleted: s.timeCompleted,
      })),
    });
  } catch (error) {
    console.error('Admin leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/admin/logs �?Admin activity logs
router.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const pageNum = Math.max(parseInt((page as string) || '1', 10), 1);
    const limitNum = Math.min(
      parseInt((limit as string) || '50', 10),
      100
    );

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        select: {
          id: true,
          adminId: true,
          action: true,
          details: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.adminLog.count(),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;




