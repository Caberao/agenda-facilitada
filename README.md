# Agenda Facilitada

Agenda Facilitada is a polished MVP for professionals and small businesses that need a fast, elegant way to organize appointments, clients, and daily operations without the weight of a complex enterprise system.

Built as a portfolio-ready full-stack TypeScript project, it combines a premium scheduling experience, responsive interface, seeded backend API, and lightweight PWA support for installability and quick access on mobile and desktop.

## Proposal

The product proposal is simple: reduce friction in appointment management.

Agenda Facilitada was designed to help service-based businesses centralize:

- appointment creation and follow-up
- status tracking for pending, confirmed, completed, cancelled, and overdue items
- lightweight client registration
- business preferences and reminder defaults
- fast routine access from mobile home screen through PWA installation

This repository represents an MVP with strong UX foundations and a clean architecture prepared for future expansion.

## Highlights

- Premium, mobile-friendly interface
- TypeScript across frontend, backend, and shared contracts
- Organized codebase split by responsibility
- Shared domain contracts in `shared/types.ts`
- Seeded demo data for immediate local testing
- Lightweight Express API with local file persistence
- Basic PWA setup with manifest, icons, and service worker
- Supabase variables pre-mapped in `.env` for future implementation

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router DOM
- Zustand
- Day.js
- Lucide React
- Custom CSS architecture prepared for future Tailwind layering

### Backend
- Node.js
- Express
- TypeScript
- CORS
- Day.js
- TSX for local development

### Shared
- Shared TypeScript contracts in `shared/types.ts`

### PWA
- Web App Manifest
- Vanilla service worker
- SVG app icons

## Monorepo Structure

```text
agenda-facilitada/
├─ public/                 # static assets, manifest, service worker, icons
├─ src/                    # React + Vite application (app, pages, store, styles)
├─ backend/                # Express API with provider-based persistence
│  └─ src/                 # server/services/data/repositories/types/utils
├─ shared/                 # source of truth for shared interfaces and contracts
│  └─ types.ts
└─ README.md
```

## Domain Contracts

Shared contracts currently include:

- `User`
- `Client`
- `Appointment`
- `Settings`
- `DashboardSummary`
- `LoginPayload`
- `LoginResponse`
- `AppointmentFilters`
- `UpdateAppointmentStatusPayload`
- `SeedData`

Status and type contracts are also centralized in `shared/types.ts`, making frontend/backend integration safer and easier to maintain.

## Main Routes

### Frontend
- `/login`
- `/dashboard`
- `/appointments`
- `/appointments/new`
- `/appointments/:id/edit`
- `/settings`

### Backend
- `POST /auth/login`
- `GET /appointments`
- `POST /appointments`
- `PUT /appointments/:id`
- `DELETE /appointments/:id`
- `PATCH /appointments/:id/status`
- `GET /clients`
- `POST /clients`
- `GET /settings`
- `PUT /settings`

## Getting Started

### 1) Install dependencies

Frontend (root):
```bash
npm install
```

Backend:
```bash
cd backend
npm install
```

## Running the project

### Backend
```bash
cd backend
npm run dev
```

### Frontend (root)
```bash
npm run dev
```

If both apps follow the expected local defaults, the frontend will usually run on a Vite port such as `http://localhost:5173` and the backend on its configured Express port.

### Frontend environment

Create a `.env` in the project root (you can copy from `.env.example`):

```env
VITE_API_URL=http://localhost:3333
```

Then run backend and frontend together in separate terminals.

### Backend data providers

The backend supports 3 providers:

- `local` (default, JSON file)
- `memory` (ephemeral)
- `supabase` (remote Postgres via Supabase)

### Local temporary database (default for portfolio)

- Backend runs with `DATA_PROVIDER=local` by default
- Data is persisted in `backend/.local-db/agenda-facilitada.json`
- Uploaded profile images are saved in `backend/.local-db/uploads/`
- This is ideal for portfolio development and local demos
- Supabase stays optional and does not block local development

## Example Seed Credentials

The backend includes seeded demo data for immediate testing.

Use the seeded admin credentials exposed by the backend seed/auth implementation:

- **Email:** `demo@example.com`
- **Password:** `admin123`

If the backend seed is adjusted later, keep the README aligned with the values defined in the seed source.

## Seeded Data Notes

- Current default persistence is **local file database** (`backend/.local-db/agenda-facilitada.json`)
- Seed data is applied automatically on the first run
- Data is persisted between backend restarts in local mode
- Provider switching is available via environment variables:
  - `DATA_PROVIDER=local` (default)
  - `DATA_PROVIDER=memory` (ephemeral)
  - `DATA_PROVIDER=supabase` (Supabase runtime provider)

The shared contracts already include a `PrismaPlannedModels` hint to guide a future database layer.

## Backend Environment Setup

Create your backend environment file from `backend/.env.example` and adjust as needed:

```env
PORT=3333
DATA_PROVIDER=local
LOCAL_DB_PATH=.local-db/agenda-facilitada.json
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_SCHEMA=public
```

Notes:

- `local` mode is ready and recommended for portfolio preparation
- Supabase URL and schema are placeholders and must be replaced with your own project values
- `SUPABASE_SERVICE_ROLE_KEY` is required for runtime access
- Base SQL schema is available in `backend/supabase/schema.sql`

## Supabase setup (ready SQL structure)

If you want to run with Supabase, the project is already prepared.

### 1) Create your Supabase project

- Create a new project in Supabase
- Open **SQL Editor**

### 2) Create all backend tables in one step

- Open file: `backend/supabase/schema.sql`
- Copy and execute the full SQL script in Supabase SQL Editor

This script creates the required tables, indexes, and default seed rows for the backend.

### 3) Configure backend `.env`

Set:

```env
DATA_PROVIDER=supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_SCHEMA=public
```

### 4) Start backend normally

```bash
cd backend
npm run dev
```

If `DATA_PROVIDER=local`, backend keeps running with JSON (`.local-db/agenda-facilitada.json`).

## PWA Support

Agenda Facilitada includes a lightweight PWA foundation:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/*`

Current setup provides:

- installable app metadata
- branded app icons in SVG
- standalone display mode
- simple caching for static shell assets
- service worker registration in frontend bootstrap (`src/main.tsx`)

## Suggested Development Flow

1. Start the backend
2. Start the frontend
3. Open the app in the browser
4. Log in with the demo admin credentials
5. Explore dashboard, appointments, clients, and settings flows
6. Test installability using browser PWA tools or “Add to Home Screen”

## Portfolio Positioning

This project is ideal for demonstrating:

- product thinking
- UI/UX care
- full-stack TypeScript architecture
- REST API organization
- contract-driven development
- PWA fundamentals
- scalability planning from MVP to production

## Roadmap

Planned next steps for the product:

- WhatsApp reminder and confirmation flows
- Birthday notifications in-app + email/WhatsApp with direct quick-access link
- shared calendar integrations
- complete client management module
- persistent database migration
- Prisma schema and repository layer
- SQLite for local persistence
- optional Supabase backend for hosted environments
- analytics and business performance insights
- richer notification preferences
- mobile-first notification UX tuning (compact banner, tap actions, and channel setup)
- multi-user roles and team scheduling

## Recommended Screenshots for GitHub

To make the repository more portfolio-ready, add screenshots such as:

1. Login screen
2. Dashboard with summary cards and upcoming appointments
3. Appointment listing with filters, badges, and empty states
4. New/edit appointment form
5. Settings page
6. Mobile view navigation
7. PWA install prompt or installed app window

Recommended path convention:

```text
docs/screenshots/
├─ login.png
├─ dashboard.png
├─ appointments.png
├─ appointment-form.png
├─ settings.png
├─ mobile.png
└─ pwa-install.png
```

## Suggested GitHub Topics

Use topics like:

- `react`
- `typescript`
- `vite`
- `express`
- `pwa`
- `scheduling`
- `appointment-manager`
- `dashboard`
- `zustand`
- `portfolio-project`
- `mvp`
- `fullstack`

## Product Tone and Branding

Agenda Facilitada is positioned as:

- modern
- premium
- fast
- approachable
- practical for real business use

That makes it a strong MVP both for demonstration and for future evolution into a commercial scheduling product.

## Implementation Notes

- Shared types in `shared/types.ts` are the source of truth
- Backend currently uses seeded local-file persistence by default
- Architecture is intentionally modular for maintainability
- Migration to Prisma/SQLite or Supabase can be introduced without redesigning the domain model
- PWA assets were kept dependency-free and simple on purpose

## License

You can adapt the license section to your preferred model, for example MIT for open portfolio use.
