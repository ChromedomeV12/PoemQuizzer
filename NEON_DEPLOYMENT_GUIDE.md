# 🐘 Neon Database: Step-by-Step "DIY" Guide for Non-Techies

This guide is for setting up the **"Digital Filing Cabinet"** (the Database) where all the student names, poetry questions, and scores will be safely stored. Follow these steps exactly.

---

## 🏗️ Step 1: Create your Neon Account
1.  Go to [Neon.tech](https://neon.tech).
2.  Click the **"Sign Up"** button.
3.  Choose **"Continue with GitHub"**. This connects your database to your code account.
4.  If it asks for a project name, type `PoemQuizzer`.
5.  If it asks for a region, choose the one closest to you (e.g., `Singapore` or `US East`).
6.  Click **"Create Project"**.

---

## 🏗️ Step 2: Get your "Secret Keys" (Connection Strings)
This is the most important part. You need two different "addresses" for your database to work.

### 🔑 Key #1: The "Everyday" Address (Pooled)
*This is what the website uses while students are taking the quiz.*

1.  On your Neon Dashboard, look for the box titled **"Connection Details"**.
2.  Find the small switch that says **"Pooled connection"**.
3.  **Turn that switch ON.** (It should turn green/blue).
4.  Look at the long text that looks like: `postgres://alex:abcd@ep-cool-darkness-123-pooler.us-east-2.aws.neon.tech/neondb`
5.  Click the **Copy** icon next to it.
6.  **Save this somewhere safe.** Label it as `DATABASE_URL`.

### 🔑 Key #2: The "Manager" Address (Direct)
*This is what the system uses to set up the tables and structure.*

1.  Go back to that same **"Pooled connection"** switch.
2.  **Turn that switch OFF.**
3.  The text will change slightly (the word `-pooler` will disappear).
4.  Click the **Copy** icon next to this new text.
5.  **Save this somewhere safe.** Label it as `DIRECT_URL`.

---

## 🏗️ Step 3: Put the Keys into the "Brain" (Render)
Now that you have your two keys, you need to give them to your Backend (Render) so it can talk to the database.

1.  Open your [Render.com](https://render.com) dashboard.
2.  Click on your `PoemQuizzer` service.
3.  Click the **"Environment"** tab on the left.
4.  Click **"Add Environment Variable"**.
5.  In the first box, type `DATABASE_URL`. In the second box, paste your **Key #1 (Pooled)**.
6.  Click **"Add Environment Variable"** again.
7.  In the first box, type `DIRECT_URL`. In the second box, paste your **Key #2 (Direct)**.
8.  Click **"Save Changes"**.

---

## 🏗️ Step 4: Prepare for Competition Day (Anti-Sleep)
Because we are using the **Free Tier**, Neon likes to "go to sleep" if no one uses it for 5 minutes. To prevent students from waiting:

1.  In your Neon Dashboard, go to **"Settings"** on the left menu.
2.  Click **"Autoscaling"**.
3.  Find the setting that says **"Suspend compute after"**.
4.  Change it from `5 minutes` to **`20 minutes`** (or more).
5.  Click **"Save"**.
6.  **On the morning of the event:** Open your website yourself 10 minutes before the students arrive. This "wakes up" the database so it's ready to go!

---

## 🏗️ Step 5: Checking the Scores (The "Live View")
If you want to see the scores manually without using the Admin Dashboard:

1.  In the Neon Dashboard, click **"SQL Editor"** on the left.
2.  Type this exact sentence into the big white box:
    `SELECT * FROM "Score" ORDER BY "totalScore" DESC;`
3.  Click the blue **"Run"** button.
4.  You will see a list of everyone's scores in real-time!

---
*Success! Your database is now connected and ready for the 2026 Poetry Competition.*
