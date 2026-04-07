import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import { generateToken, authenticate } from '../middleware/auth';
import {
  sanitizeInput,
  isValidEmail,
  isValidUsername,
  isValidStudentId,
  isValidName,
  isValidLength,
} from '../utils/sanitization';

const router = Router();

// ──────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, username, password } = req.body;

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedUsername = sanitizeInput(username).toLowerCase();

      // Validate formats
      if (!isValidEmail(sanitizedEmail)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      if (!isValidUsername(sanitizedUsername)) {
        res.status(400).json({
          error: 'Username must be 3-30 alphanumeric characters or underscores',
        });
        return;
      }

      if (!isValidLength(password, 8, 128)) {
        res.status(400).json({ error: 'Password must be 8-128 characters' });
        return;
      }

      // Check for existing user
      const existingEmail = await prisma.user.findUnique({
        where: { email: sanitizedEmail },
      });

      if (existingEmail) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      const existingUsername = await prisma.user.findUnique({
        where: { username: sanitizedUsername },
      });

      if (existingUsername) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: sanitizedEmail,
          username: sanitizedUsername,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          profileComplete: true,
          createdAt: true,
        },
      });

      // Generate JWT
      const token = generateToken(user.id, user.email, user.role);

      res.status(201).json({
        message: 'Registration successful',
        user,
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// ──────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────
router.post(
  '/login',
  [
    body('identifier')
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { identifier, password } = req.body;
      const sanitizedIdentifier = sanitizeInput(identifier).toLowerCase();

      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: sanitizedIdentifier },
            { username: sanitizedIdentifier },
          ],
        },
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT
      const token = generateToken(user.id, user.email, user.role);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profileComplete: user.profileComplete,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// ──────────────────────────────────────────────
// POST /api/auth/profile
// Set profile info (one-time only, after first login)
// ──────────────────────────────────────────────
router.post(
  '/profile',
  authenticate,
  [
    body('fullName')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name is required (2-100 chars)'),
    body('grade')
      .isLength({ min: 1, max: 20 })
      .withMessage('Grade is required (e.g., 高一, 高二, 高三)'),
    body('studentId')
      .isLength({ min: 3, max: 20 })
      .withMessage('Student ID is required (3-20 chars)'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Users can only set profile once
      const existingUser = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { profileComplete: true },
      });

      if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (existingUser.profileComplete) {
        res.status(403).json({
          error: 'Profile already completed. Contact admin to make changes.',
        });
        return;
      }

      const { fullName, grade, studentId } = req.body;

      // Sanitize and validate
      const sanitizedName = sanitizeInput(fullName);
      const sanitizedGrade = sanitizeInput(grade);
      const sanitizedStudentId = sanitizeInput(studentId).toUpperCase();

      if (!isValidName(sanitizedName)) {
        res.status(400).json({
          error: 'Name must be 2-100 letters, spaces, hyphens, or apostrophes',
        });
        return;
      }

      if (sanitizedGrade.length < 1 || sanitizedGrade.length > 20) {
        res.status(400).json({ error: 'Invalid grade' });
        return;
      }

      if (!isValidStudentId(sanitizedStudentId)) {
        res.status(400).json({
          error: 'Student ID must be 3-20 alphanumeric characters or hyphens',
        });
        return;
      }

      // Check for duplicate student ID
      const existingStudentId = await prisma.user.findUnique({
        where: { studentId: sanitizedStudentId },
      });

      if (existingStudentId && existingStudentId.id !== req.userId) {
        res.status(409).json({ error: 'Student ID already registered' });
        return;
      }

      // Update profile
      const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: {
          fullName: sanitizedName,
          grade: sanitizedGrade,
          studentId: sanitizedStudentId,
          profileComplete: true,
        },
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

      res.json({
        message: 'Profile setup complete',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Profile setup error:', error);
      res.status(500).json({ error: 'Profile setup failed' });
    }
  }
);

// ──────────────────────────────────────────────
// GET /api/auth/me
// Get current user info
// ──────────────────────────────────────────────
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
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
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;

