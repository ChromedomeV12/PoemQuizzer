# PoemQuizzer - Online Quiz Competition Platform

A responsive, high-performance Online Quiz Competition Web App built for university events.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS + React Router + Zustand |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | MySQL 8.0 + Prisma ORM |
| **Deployment** | Docker Compose (MySQL, App, Nginx) / PM2 + Nginx |

## 📁 Project Structure

```
PoemQuizzer/
├── client/                     # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/         # Layout, Timer, QuizCard, FeedbackOverlay
│   │   ├── pages/              # Login, Register, ProfileSetup, Dashboard, Quiz, Results, Admin
│   │   ├── hooks/              # Custom React hooks
│   │   ├── store/              # Zustand auth store
│   │   ├── services/           # API client with JWT management
│   │   └── types/              # TypeScript type definitions
├── server/                     # Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma       # User, Question, Submission, Score, AdminLog
│   │   └── seed.ts             # Admin user + sample questions
│   └── src/
│       ├── routes/             # auth.ts, quiz.ts, admin.ts
│       ├── middleware/          # auth, role, timing-validator, event-phase
│       └── utils/              # keyword-matcher, sanitization
├── docker/
│   ├── docker-compose.yml      # Full stack orchestration
│   ├── Dockerfile.server       # Production server image
│   ├── Dockerfile.client       # Production client image
│   ├── nginx.conf              # Reverse proxy with rate limiting
│   ├── nginx-frontend.conf     # SPA serving config
│   ├── init.sql                # DB initialization
│   └── ssl/                    # SSL certificates (mounted at runtime)
├── ecosystem.config.js         # PM2 production config
├── DEPLOYMENT.md               # Complete deployment guide
└── README.md                   # This file
```

## 🛠️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start MySQL (or use Docker)
npm run docker:up mysql

# 3. Run migrations + seed
npm run db:migrate
npm run db:seed

# 4. Start development
npm run dev
```

**Default Admin:** `admin@poemquizzer.com` / `admin123`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## 📅 Event Phases

| Phase | Dates | Description |
|-------|-------|-------------|
| **Pre-Qualifier** | Now - Apr 20 | Self-paced quiz |
| **Finals** | Apr 24, 16:45-18:45 | Timed competition |

## 🔒 Security Features

- **Server-side scoring** — no client-side score manipulation
- **Timing validation** — detects impossible answer times (<2s rejected)
- **Rate limiting** — Express + Nginx双重 rate limiting on auth endpoints
- **JWT authentication** — secure session management
- **Input sanitization** — HTML stripping, format validators on all inputs
- **Password hashing** — bcrypt with 12 salt rounds
- **Role-based access** — USER/ADMIN separation at middleware level

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server concurrently |
| `npm run dev:client` | Start client only (Vite) |
| `npm run dev:server` | Start server only (Express) |
| `npm run build` | Build both client and server |
| `npm run db:migrate` | Run Prisma database migrations |
| `npm run db:seed` | Seed the database (admin + sample questions) |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

## 🗄️ Database Schema

- **User** — Auth (email/username/password), profile (name, faculty, dept, studentId), role (USER/ADMIN)
- **Question** — Type (MC/TF/Short Answer), phase, options, keywords, time limit, points
- **Submission** — Per-user per-question answers with timing data
- **Score** — Aggregated scores per phase per user
- **AdminLog** — Audit trail for admin actions (edit user, CRUD questions)

## 🏗️ API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login (email or username) |
| POST | `/api/auth/profile` | ✅ | One-time profile setup |
| GET | `/api/auth/me` | ✅ | Get current user |

### Quiz
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/quiz/status` | ❌ | Event phase availability |
| GET | `/api/quiz/questions` | ✅ | Get questions for phase |
| GET | `/api/quiz/question/:id` | ✅ | Get single question |
| POST | `/api/quiz/submit` | ✅ | Submit answer (server-scored) |
| GET | `/api/quiz/score` | ✅ | Get user's score |
| GET | `/api/quiz/leaderboard` | ❌ | Public leaderboard |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | ✅ ADMIN | List/search users |
| PUT | `/api/admin/users/:id` | ✅ ADMIN | Edit user profile |
| DELETE | `/api/admin/users/:id` | ✅ ADMIN | Delete user |
| GET | `/api/admin/questions` | ✅ ADMIN | List questions |
| POST | `/api/admin/questions` | ✅ ADMIN | Create question |
| PUT | `/api/admin/questions/:id` | ✅ ADMIN | Update question |
| DELETE | `/api/admin/questions/:id` | ✅ ADMIN | Delete question |
| GET | `/api/admin/monitor` | ✅ ADMIN | Live participant data |
| GET | `/api/admin/leaderboard` | ✅ ADMIN | Full leaderboard |
| GET | `/api/admin/logs` | ✅ ADMIN | Admin activity logs |

---
*Built with React 19, TypeScript, Express, Prisma, and MySQL*
