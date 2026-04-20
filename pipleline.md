## Table of Contents

### Phase 0: Learn the Missing Skills First (Start Here – 7–10 Days)
1. [Docker Basics (Must Learn First)](#1-docker-basics-must-learn-first)  
2. [Environment Variables Mastery for Production](#2-environment-variables-mastery-for-production)  
3. [Neon.tech – Cloud PostgreSQL](#3-neontech-cloud-postgresql)  
4. [Render.com – Cloud Backend Hosting](#4-rendercom-cloud-backend-hosting)  
5. [Vercel for Dynamic React Apps (Beyond Static)](#5-vercel-for-dynamic-react-apps-beyond-static)  
6. [CI/CD Concepts + GitHub Actions](#6-cicd-concepts--github-actions)

### Phase 1: Prepare Your Existing Project (1 Day)
7. [Project Structure & Separate Repos](#7-project-structure--separate-repos)  
8. [Add Dockerfile to Backend](#8-add-dockerfile-to-backend)  
9. [Create .env.example & Clean Code](#9-create-envexample--clean-code)

### Phase 2: Deploy to Cloud Step-by-Step (3–4 Days)
10. [Move Database to Neon.tech](#10-move-database-to-neontech)  
11. [Deploy Backend to Render (with Docker)](#11-deploy-backend-to-render-with-docker)  
12. [Deploy Frontend to Vercel (Dynamic)](#12-deploy-frontend-to-vercel-dynamic)

### Phase 3: Build the Full CI/CD Pipeline (3 Days)
13. [GitHub Actions for Backend (Auto-Deploy on Push)](#13-github-actions-for-backend-auto-deploy-on-push)  
14. [GitHub Actions for Frontend (Extra Tests)](#14-github-actions-for-frontend-extra-tests)  
15. [Full Pipeline Testing](#15-full-pipeline-testing)

### Phase 4: Final Polish & Maintenance (2 Days)
16. [Production Checklist & Security](#16-production-checklist--security)  
17. [Monitoring & Keeping Render Awake](#17-monitoring--keeping-render-awake)  
18. [Next Steps & Portfolio Boost](#18-next-steps--portfolio-boost)

---

## Phase 0: Learn the Missing Skills First  
**How to start**: Open this file in VS Code → bookmark it → spend 2–3 hours/day.  
Do **exactly in this order**. Every topic has **best free resources (updated 2026)** + exact what to learn.

### 1. Docker Basics (Must Learn First – 2–3 days)
**Why?** Render (and modern platforms) love Docker. It makes your Node app run **exactly the same** on your laptop and on the cloud.  
**What to learn (focus only on these)**:  
- What is a container vs VM  
- Dockerfile (FROM, WORKDIR, COPY, RUN, CMD)  
- .dockerignore  
- Build & run a Node.js app with Docker  
- Multi-stage build (optional for now)

**Where to start learning (free & best in 2026)**:  
1. Watch **"Learn Docker in 2026 - Complete Roadmap Beginner to Pro"** (YouTube) → https://www.youtube.com/watch?v=zFa9_K8BS8I (start here – 30 mins roadmap)  
2. Then **"Docker in 10 Minutes – Complete Beginner's Guide (2026)"** → https://www.youtube.com/watch?v=ZyWBs0CU2wk (perfect Node.js example)  
3. Practice: Follow along and dockerize your existing Node backend (you’ll use this exact Dockerfile later).  
**Time**: Finish in 2 evenings.

### 2. Environment Variables Mastery for Production (1 day)
**Why?** Never hardcode URLs or passwords.  
**What to learn**:  
- .env vs .env.production  
- process.env in Node & React  
- How Vercel + Render inject env vars  
- REACT_APP_ prefix for frontend

**Where to start**:  
- Vercel Docs (2026): https://vercel.com/docs/environment-variables  
- YouTube: "Environment Variables in Node & React – Web Dev Simplified" (search this title – 15 mins)  
**Do it**: Update your local app today using .env.

### 3. Neon.tech – Cloud PostgreSQL (1 day)
**Why?** Your local DB cannot be used in production.  
**What to learn**:  
- Connection string format  
- Using `pg` or `postgres.js` with Neon  
- Running migrations on cloud DB

**Where to start**:  
- Official Neon Guide (updated Feb 2026): https://neon.com/docs/guides/node  
- Video: "How To Install Setup and Connect To Neon PostgreSQL Using NodeJS" → https://www.youtube.com/watch?v=XKwOsn37KCc  
**Action**: Sign up at neon.tech (free, no card) and connect your existing DB.

### 4. Render.com – Cloud Backend Hosting (2 days)
**Why?** Best free tier for Node.js + Docker in 2026.  
**What to learn**:  
- Web Service creation  
- Environment variables dashboard  
- Deploy Hook (for CI/CD)  
- Auto-deploy vs manual

**Where to start**:  
- Render Docs: https://render.com/docs/deploy-hooks (read the GitHub Actions example)  
- Official Render "Deploying on Render": https://render.com/docs/deploys  
**Action**: Create free account at render.com.

### 5. Vercel for Dynamic React Apps (Beyond Static) (1 day)
**Why?** You already deployed static sites. Now we add API URL.  
**What to learn**:  
- Adding environment variables in Vercel dashboard  
- REACT_APP_API_URL in production build  
- Preview deployments still work

**Where to start**:  
- Vercel Environment Variables Docs (2026): https://vercel.com/docs/environment-variables  
**Action**: You already know Vercel dashboard – just add one env var later.

### 6. CI/CD Concepts + GitHub Actions (3 days)
**Why?** This is the automation you asked for (push code → auto test & deploy).  
**What to learn**:  
- What is CI/CD (Continuous Integration & Deployment)  
- Workflow YAML file (.github/workflows/)  
- Jobs, steps, secrets  
- Trigger on push to main  
- Deploy hooks (for Render)

**Where to start learning (best 2026 resources)**:  
1. **"GitHub Actions Tutorial for Beginners – CI/CD Pipeline from Scratch (2026)"** → https://www.youtube.com/watch?v=0PbxpIao_EU (perfect, follow along)  
2. Official GitHub Docs: https://docs.github.com/en/actions  
3. Extra: "CI/CD Explained in 7 Minutes (2026)" → search this on YouTube for quick theory.  
**Practice**: Create a dummy repo and make your first workflow.

---

## Phase 1: Prepare Your Existing Project (1 Day)

### 7. Project Structure & Separate Repos
hostel-management/
├── frontend/          ← your existing React app
├── backend/           ← your existing Node app
├── .gitignore
└── README.md
text- Create **two separate GitHub repos** (recommended):  
  - `hostel-frontend`  
  - `hostel-backend`  
- Push your current code to both.

### 8. Add Dockerfile to Backend
Create `backend/Dockerfile` (copy-paste this):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
Add .dockerignore:
textnode_modules
.git
.env
9. Create .env.example & Clean Code

Rename .env → .env.example (never commit real secrets)
In backend server.js: use process.env.PORT || 5000 and process.env.DATABASE_URL
In frontend: use process.env.REACT_APP_API_URL


Phase 2: Deploy to Cloud Step-by-Step
10. Move Database to Neon.tech

Sign up neon.tech → Create project → Copy connection string
Update backend/.env: DATABASE_URL=postgresql://...
Run your SQL migrations/seed on Neon (use pgAdmin or psql)
Test with Postman → change localhost to Neon URL.

11. Deploy Backend to Render (with Docker)

Push backend repo to GitHub
render.com → New → Web Service → Connect your hostel-backend repo
Runtime: Docker (it will auto-detect Dockerfile)
Add Environment Variable: DATABASE_URL (paste from Neon)
Deploy → Get live URL like https://hostel-api.onrender.com

12. Deploy Frontend to Vercel (Dynamic)

Push frontend repo
vercel.com → Import GitHub repo
Settings → Environment Variables → Add:
Key: REACT_APP_API_URL
Value: your Render URL

Deploy → Your app is now live and talking to backend!


Phase 3: Build the Full CI/CD Pipeline
13. GitHub Actions for Backend (Auto-Deploy on Push)
Create file: backend/.github/workflows/deploy.yml
YAMLname: Backend CI/CD

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Render Deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"

In Render dashboard → get Deploy Hook URL
In GitHub repo → Settings → Secrets → Add RENDER_DEPLOY_HOOK = paste the URL

14. GitHub Actions for Frontend
Vercel auto-deploys on push (no extra file needed).
Optional extra test file: frontend/.github/workflows/test.yml (copy from the 2026 tutorial above).
15. Full Pipeline Testing

Push any change to main in either repo
Watch GitHub → Actions tab → green check = auto-deployed!


Phase 4: Final Polish & Maintenance
16. Production Checklist & Security

Add CORS in backend
Use HTTPS (automatic)
Add /health endpoint
Never expose secrets in frontend

17. Monitoring & Keeping Render Awake

Free UptimeRobot.com → ping your Render URL every 10 minutes (prevents sleep)
Check Neon + Render dashboards weekly

18. Next Steps & Portfolio Boost

Add JWT auth (free)
Share live link with college
Resume line: “Built & deployed full-stack Hostel Management System with Docker, CI/CD using GitHub Actions, hosted on Vercel + Render + Neon”