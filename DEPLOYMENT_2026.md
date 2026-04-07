# 🚀 PoemQuizzer Deployment Guide (2026 Edition)

This guide covers the modern, **fully free** deployment stack using **Prisma 7**, **Neon (PostgreSQL)**, **Render (Backend)**, and **Vercel (Frontend)**.

---

## 🏗️ The 2026 Free Stack

| Component | Provider | Role |
| :--- | :--- | :--- |
| **Database** | [Neon](https://neon.tech) | Serverless PostgreSQL (Scale-to-Zero) |
| **Backend** | [Render](https://render.com) | Node.js / Express API |
| **Frontend** | [Vercel](https://vercel.com) | React / Vite Static Hosting |

---

## 1. 🐘 Database Setup (Neon)

1.  **Create Project:** Go to [Neon.tech](https://neon.tech) and create a new project named `poemquizzer`.
2.  **Get Connection String:** 
    *   In the Neon Dashboard, find your **Connection String**.
    *   Ensure it looks like: `postgres://user:password@ep-cool-darkness-123.us-east-2.aws.neon.tech/neondb?sslmode=require`
3.  **Local Configuration:** Add this string to your `server/.env` file:
    ```env
    DATABASE_URL="your_neon_connection_string"
    ```

---

## 2. ⚙️ Backend Setup (Render)

Render hosts your Express.js API and handles database migrations.

1.  **New Web Service:** In [Render](https://render.com), create a new **Web Service** and connect your GitHub repository.
2.  **Configurations:**
    *   **Name:** `poemquizzer-api`
    *   **Environment:** `Node`
    *   **Region:** Select the region closest to your Neon database (e.g., `Oregon (us-west-2)` or `Ohio (us-east-2)`).
    *   **Branch:** `main`
    *   **Build Command:** `npm install; npm run build:server`
    *   **Start Command:** `cd server; npx prisma generate; npx prisma migrate deploy; npm start`
3.  **Environment Variables:**
    *   `DATABASE_URL`: Your Neon connection string.
    *   `JWT_SECRET`: A long, random string.
    *   `PORT`: `5000`
    *   `NODE_ENV`: `production`
    *   `CLIENT_URL`: Your Vercel URL (add this *after* setting up Vercel).

---

## 3. 🎨 Frontend Setup (Vercel)

Vercel provides high-performance hosting for the React application.

1.  **New Project:** In [Vercel](https://vercel.com), import your GitHub repository.
2.  **Framework Preset:** Select **Vite**.
3.  **Root Directory:** Set this to `client`.
4.  **Environment Variables:**
    *   `VITE_API_URL`: Your Render backend URL + `/api` (e.g., `https://poemquizzer-api.onrender.com/api`).
5.  **Deploy:** Click Deploy. Once finished, copy the provided URL and add it to your Render `CLIENT_URL` environment variable.

---

## 🛠️ Prisma 7 & PostgreSQL Best Practices

### Why we use Prisma 7
We use Prisma 7 with the **Neon Serverless Adapter** for the following benefits:
*   **Zero Cold Starts:** WebSocket-based connections are faster than traditional TCP.
*   **Reduced Bundle Size:** 90% smaller than previous versions.
*   **Programmatic Config:** Uses `prisma.config.ts` for modern environment handling.

### Database Migrations
In this stack, migrations are handled automatically by Render during the **Start Command**:
`npx prisma migrate deploy`
This ensures your database schema is always in sync with your code before the app starts.

---

## 🛑 Common Issues & Troubleshooting

### Render "Sleeping"
The Render free tier puts your API to sleep after 15 minutes of inactivity. 
*   **Symptoms:** The first person to visit the site after a break might wait 30-50 seconds for the "cold start".
*   **Solution:** For a real competition, upgrade to a "Starter" instance ($7/mo) or use a "Keep Alive" ping service.

### Neon SSL Mode
Always ensure your connection string includes `?sslmode=require`. Neon requires encrypted connections.

### CORS Errors
If your frontend cannot talk to your backend, double-check that your Render `CLIENT_URL` variable exactly matches your Vercel domain (including `https://`).

---

## 📊 Monitoring
*   **Logs:** Use `pm2 logs` (if on a VPS) or the **Logs** tab in Render/Vercel.
*   **Database:** Use the Neon **SQL Editor** or `npm run db:studio` locally.

---
*Built with React 19, Node.js, and Prisma 7.*
