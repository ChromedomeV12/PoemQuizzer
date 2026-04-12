/**
 * TypeScript types for the application.
 */

export type UserRole = 'USER' | 'ADMIN';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
export type EventPhase = 'PRE_QUALIFIER' | 'FINALS';

export interface User {
  id: string;
  email?: string | null;
  username: string;
  role: UserRole;
  fullName: string | null;
  grade: string | null;
  studentId: string | null;
  profileComplete: boolean;
  isBanned?: boolean;
  banReason?: string | null;
  bannedAt?: string | null;
  createdAt: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  phase: EventPhase;
  questionText: string;
  imageUrl: string | null;
  options: string[] | null;
  timeLimit: number;
  order: number;
  answered?: boolean;
}

export interface QuestionWithAnswer extends Question {
  correctAnswer: string;
}

export interface Submission {
  id: string;
  isCorrect: boolean;
  userAnswer: string;
  tabSwitches: number;
  autoPenalized: boolean;
}

export interface SubmitResult {
  submission: Submission;
  correctAnswer: string;
  points: number;
  explanation: string | null;
  antiCheatWarning: string | null;
}

export interface Score {
  totalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeCompleted: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  fullName: string;
  faculty: string | null;
  department: string | null;
  studentId: string | null;
  totalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeCompleted: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}
