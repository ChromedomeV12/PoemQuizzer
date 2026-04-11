# 🌐 Cloudflare Pages: Step-by-Step Guide for China-Friendly Hosting

Vercel is often blocked in mainland China. This guide explains how to move your website to **Cloudflare Pages**, which is much more stable for Chinese students.

---

## 🏗️ Step 1: Create your Cloudflare Account
1.  Go to [Cloudflare.com](https://www.cloudflare.com) and **Sign Up**.
2.  Once logged in, click **"Workers & Pages"** on the left sidebar.

---

## 🏗️ Step 2: Connect your Code
1.  Click **"Create application"** -> **"Pages"** -> **"Connect to Git"**.
2.  Select your **GitHub** account and find the `PoemQuizzer` repository.
3.  Click **"Begin setup"**.

---

## 🏗️ Step 3: Configure the Build (Monorepo Fix!)
Because our project has both a `client` and `server` folder, we must use these **exact** settings to avoid errors:

1.  **Project Name:** `poemquizzer`
2.  **Production Branch:** `main`
3.  **Framework Preset:** Choose **"Vite"**.
4.  **Root Directory:** ⚠️ **Leave this EMPTY (the / root).** 
    *   *Do NOT put "/client" here, otherwise the installation will fail.*
5.  **Build Command:** Change this to:
    `npm install && npm run build:client`
6.  **Build Output Directory:** Change this to:
    `client/dist`

---

## 🏗️ Step 4: Environment Variables (Critical!)
You must add **two** variables here, or the site will be blank or crash.

1.  Click **"Environment variables (advanced)"** -> **"Add variable"**.
2.  **Variable 1 (The Brain Link):**
    *   **Name:** `VITE_API_URL`
    *   **Value:** `https://poem-guizzer.onrender.com/api`
3.  **Variable 2 (The Node Fix):**
    *   **Name:** `NODE_VERSION`
    *   **Value:** `20` 
    *   *(This ensures Cloudflare uses modern tools required for React 19).*

Click **"Save and Deploy"**.

---

## 🏗️ Step 5: Update the Backend (Render)
1.  Once Cloudflare finishes (green checkmark), copy your new link (e.g., `https://poemquizzer.pages.dev`).
2.  Go to your **Render.com** dashboard -> **Poem API** -> **Environment**.
3.  Update **`CLIENT_URL`** to your new Cloudflare link.
4.  **Save Changes.**

---

## 🛑 Common "Gotchas" (Caution!)

### 1. The "npm ci" Error
If you see an error about `npm ci`, it means you accidentally put `/client` in the **Root Directory** box. Go back to **Settings -> Builds & Deployments** and make sure Root Directory is empty.

### 2. Blank Screen after Login
If you can see the login page but the screen goes white after clicking "Login", double-check that your Render `CLIENT_URL` matches your Cloudflare link **exactly** (no extra slash at the end).

### 3. "Failed to Fetch"
This means the **VITE_API_URL** is wrong. Ensure it starts with `https://` and ends with `/api`.

---
*Success! Your project is now optimized for students in mainland China.*
