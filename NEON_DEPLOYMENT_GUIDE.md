# 🐘 Neon PostgreSQL: The Ultimate Deployment Guide (2026)

This guide explains how to master the **Neon Serverless Postgres** platform for your PoemQuizzer project using **Prisma 7**.

## 1. 🏗️ Neon Project Architecture
Neon separates **Storage** from **Compute**. 
- **Storage:** Durable and reliable.
- **Compute:** "Serverless" endpoints that automatically scale to zero when not in use.

---

## 2. 🔑 The Two-URL Strategy
For Prisma 7 to work perfectly with Neon, you need **two** different connection strings in your environment.

| Variable | URL Type | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Pooled** | Used by your **App** at runtime (Node.js). Handles many simultaneous users. |
| `DIRECT_URL` | **Direct** | Used by **Prisma CLI** for migrations (`npx prisma migrate deploy`). |

### How to get them:
1.  Go to the **Neon Dashboard** → **Connection Details**.
2.  Toggle the **"Connection Pooling"** switch **ON**.
3.  Copy the URL (it will have `-pooler` in the hostname). This is your `DATABASE_URL`.
4.  Toggle the switch **OFF**.
5.  Copy the URL. This is your `DIRECT_URL`.

---

## 🛠️ Prisma 7 Configuration
The project is already configured to use the **Neon Serverless Adapter** in `server/src/index.ts`. This ensures low-latency database access over WebSockets.

### Environment Variables
Ensure these are set in your **Render** dashboard and your local `server/.env`:
```env
DATABASE_URL="postgresql://user:password@endpoint-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@endpoint.region.aws.neon.tech/neondb?sslmode=require"
```

---

## 🚀 Deployment Workflow

### Step 1: Initialize the Production DB
Push your local schema to the Neon production project.
```bash
cd server
npx prisma migrate deploy
```

### Step 2: Seed the Data
Populate your competition questions and admin user.
```bash
npm run db:seed
```

### Step 3: Neon "Scale-to-Zero" Tuning
Neon computes turn off after 5 minutes of idle time by default.
- **For the competition:** Go to **Autoscaling** settings in Neon and set "Suspend compute after" to a higher value (e.g., 20 minutes) so users don't experience "Cold Starts" during the event.

---

## 🌿 Advanced: Database Branching
Before making a big change to your quiz questions:
1.  **Create a Branch:** Create a "test" branch of your database in the Neon UI.
2.  **Test:** Point your local `DATABASE_URL` to this branch.
3.  **Deploy:** Once verified, apply the changes to the `main` branch.

---

### ✅ Deployment Checklist for Neon
- [ ] Connection Pooling toggled **ON** for `DATABASE_URL`.
- [ ] `DIRECT_URL` set for migrations.
- [ ] `?sslmode=require` added to all connection strings.
- [ ] Neon Project region matches your Render/Vercel region.

---
*Built with React 19, Node.js, and Prisma 7.*
