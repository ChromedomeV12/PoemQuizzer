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
5. **Build Command:** Change this to:
    `npm run build:client`

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

### 🛑 Common "Gotchas" (Caution!)

### 1. The "npm ci" or "Sync" Error
If you see an error saying `package.json and package-lock.json are out of sync`:
*   **The Fix:** Go to **Settings -> Environment variables**.
*   Add a new variable:
    *   **Name:** `NPM_FLAGS`
    *   **Value:** `--no-package-lock`
*   This tells Cloudflare to ignore the sync issue and just install the latest versions.

### 2. The Node.js Version Error
If the build fails immediately, ensure you have set `NODE_VERSION` to `20` in the environment variables.

### 3. "Failed to Fetch"
This means the **VITE_API_URL** is wrong. Ensure it starts with `https://` and ends with `/api`.

---
*Success! Your project is now optimized for students in mainland China.*
