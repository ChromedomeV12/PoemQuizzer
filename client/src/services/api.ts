/**
 * API Service
 * All backend API calls with JWT token management.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  errors?: Array<{ msg: string; path: string }>;
}

/**
 * Get the stored JWT token.
 */
function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Build request headers with auth token.
 */
function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Generic request handler.
 */
async function request<T = unknown>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_URL}${endpoint}`;
    const config: RequestInit = {
      method,
      headers: getHeaders(),
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Express-validator returns { errors: [{ msg, path, ... }] }
      // Express generic errors return { error: "message" }
      let errorMsg = data.error;
      if (!errorMsg && data.errors && Array.isArray(data.errors)) {
        errorMsg = data.errors.map((e: { msg: string }) => e.msg).join(', ');
      }
      return {
        error: errorMsg || `HTTP ${response.status}`,
        errors: data.errors,
      };
    }

    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ──────────────────────────────────────────────
// Auth API
// ──────────────────────────────────────────────
export const authApi = {
  register: (email: string, username: string, password: string) =>
    request('POST', '/auth/register', { email, username, password }),

  login: (identifier: string, password: string) =>
    request('POST', '/auth/login', { identifier, password }),

  setupProfile: (fullName: string, grade: string, studentId: string) =>
    request('POST', '/auth/profile', { fullName, grade, studentId }),

  getMe: () => request('GET', '/auth/me'),
};

// ──────────────────────────────────────────────
// Quiz API
// ──────────────────────────────────────────────
export const quizApi = {
  getStatus: () => request('GET', '/quiz/status'),

  getQuestions: (phase: string) =>
    request('GET', `/quiz/questions?phase=${phase}`),

  getQuestion: (id: string) =>
    request('GET', `/quiz/question/${id}`),

  submitAnswer: (questionId: string, answer: string, timeTaken: number, tabSwitches = 0) =>
    request('POST', '/quiz/submit', { questionId, answer, timeTaken, tabSwitches }),

  getScore: (phase: string) =>
    request('GET', `/quiz/score?phase=${phase}`),

  getLeaderboard: (phase: string, limit = 50) =>
    request('GET', `/quiz/leaderboard?phase=${phase}&limit=${limit}`),
};

// ──────────────────────────────────────────────
// Admin API
// ──────────────────────────────────────────────
export const adminApi = {
  getUsers: (params?: { search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request('GET', `/admin/users?${qs.toString()}`);
  },

  updateUser: (userId: string, data: Record<string, unknown>) =>
    request('PUT', `/admin/users/${userId}`, data),

  deleteUser: (userId: string) =>
    request('DELETE', `/admin/users/${userId}`),

  getQuestions: (params?: { phase?: string; type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.phase) qs.set('phase', params.phase);
    if (params?.type) qs.set('type', params.type);
    return request('GET', `/admin/questions?${qs.toString()}`);
  },

  createQuestion: (data: Record<string, unknown>) =>
    request('POST', '/admin/questions', data),

  updateQuestion: (questionId: string, data: Record<string, unknown>) =>
    request('PUT', `/admin/questions/${questionId}`, data),

  deleteQuestion: (questionId: string) =>
    request('DELETE', `/admin/questions/${questionId}`),

  getMonitor: (phase?: string) =>
    request('GET', `/admin/monitor${phase ? `?phase=${phase}` : ''}`),

  getLeaderboard: (phase?: string) =>
    request('GET', `/admin/leaderboard${phase ? `?phase=${phase}` : ''}`),

  getLogs: (page = 1, limit = 50) =>
    request('GET', `/admin/logs?page=${page}&limit=${limit}`),
};

export { getToken };
