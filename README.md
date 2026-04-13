<h1 align="center">Agenda Facilitada</h1>

<p align="center">
  A full-stack scheduling app focused on speed, clarity, and premium user experience.
</p>

<p align="center">
  <a href="https://agenda-facilitada.vercel.app" target="_blank">Live Demo</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-run-locally">Run Locally</a> •
  <a href="#-supabase-setup">Supabase Setup</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-in%20development-0f766e" />
  <img src="https://img.shields.io/badge/frontend-React%20%2B%20Vite-111827" />
  <img src="https://img.shields.io/badge/backend-Node%20%2B%20Express-1f2937" />
  <img src="https://img.shields.io/badge/database-Local%20JSON%20%7C%20Supabase-334155" />
  <img src="https://img.shields.io/badge/license-MIT-16a34a" />
</p>

## Overview

Agenda Facilitada is a portfolio-ready full-stack TypeScript project for appointment management, client tracking, reminders, and birthday workflows.

It supports two data providers:
- `local` (default, JSON file)
- `supabase` (cloud-ready provider)

## Key Features

- Clean dashboard and tabbed workspace
- Appointment CRUD with status and filters
- Birthday contacts, groups, backgrounds, and batch flow
- Notification preferences per user settings
- Responsive UI (desktop and mobile)
- PWA-ready base setup
- Shared contracts between frontend and backend (`shared/types.ts`)

## Demo Access

The login screen is pre-filled with a **read-only test user** for safe demos.

- **Test User (read-only, default):**
  - Email: `tester@example.com`
  - Password: `test123`
  - Can navigate and test flows, but write requests are blocked by backend middleware.

- **Admin User (full write):**
  - Email: `demo@example.com`
  - Password: `admin123`

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- Zustand
- Day.js
- Lucide React

### Backend
- Node.js
- Express
- TypeScript
- TSX

### Data
- Local JSON file persistence
- Supabase-ready repository and SQL schema

## Repository Structure

```text
agenda-facilitada/
├─ public/
├─ src/
├─ backend/
│  ├─ src/
│  └─ supabase/
│     ├─ schema.sql
│     └─ SETUP.md
├─ shared/
└─ README.md
```

## Run Locally

### 1) Install dependencies

```bash
npm install
cd backend
npm install
```

### 2) Start backend

```bash
cd backend
npm run dev
```

### 3) Start frontend

```bash
npm run dev
```

### 4) Frontend environment

Create a root `.env` (from `.env.example`) with:

```env
VITE_API_URL=http://localhost:3333
```

## Backend Environment

Create `backend/.env` (from `backend/.env.example`) and set:

```env
PORT=3333
DATA_PROVIDER=local
LOCAL_DB_PATH=.local-db/agenda-facilitada.json
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_SCHEMA=public
```

## Supabase Setup

If you want cloud persistence:

1. Create a Supabase project.
2. Open SQL Editor.
3. Execute `backend/supabase/schema.sql`.
4. Set in `backend/.env`:
   - `DATA_PROVIDER=supabase`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_SCHEMA=public`

## License

MIT.
