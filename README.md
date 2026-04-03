<h1 align="center">Agenda Facilitada</h1>

<p align="center">
  A full-stack scheduling app focused on speed, clarity, and premium user experience.
</p>

<p align="center">
  <a href="https://agenda-facilitada.vercel.app" target="_blank">Live Demo</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-run-locally">Run Locally</a> •
  <a href="#-supabase-setup">Supabase Setup</a> •
  <a href="#-roadmap">Roadmap</a>
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

It is built with a polished UI, modular backend architecture, and provider-based persistence:
- Local JSON (default, ideal for demos)
- Supabase (ready when you want cloud persistence)

## Key Features

- Clean dashboard and tabbed workspace
- Appointment CRUD with status and filters
- Birthday contacts, groups, backgrounds, and batch flow
- Notification preferences per user settings
- Responsive UI (desktop and mobile)
- PWA-ready base setup
- Shared contracts between frontend and backend (`shared/types.ts`)

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
