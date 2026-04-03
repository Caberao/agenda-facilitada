# Supabase Setup (Agenda Facilitada)

Use this guide to prepare the Supabase database before enabling the provider.

## 1) Open SQL Editor

- Project: `https://your-project-ref.supabase.co`
- Menu: `SQL Editor` -> `New query`

## 2) Run the base schema

- Open `backend/supabase/schema.sql`
- Copy and run the full script in Supabase SQL Editor

## 3) Get credentials

- Menu: `Project Settings` -> `Data API`
- Copy:
  - `Project URL` (already referenced in `.env.example`)
  - `service_role` key

## 4) Configure backend (Render or local)

```env
DATA_PROVIDER=supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
SUPABASE_SCHEMA=public
```

## 5) Current behavior

The `supabase` provider is already supported at runtime in the backend.
If required env vars are missing (`SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`), the app falls back to local provider.

## 6) Import local JSON data into Supabase

In terminal, inside `backend/`:

```bash
npm run supabase:import-local
```

The script reads `LOCAL_DB_PATH` (default: `.local-db/agenda-facilitada.json`) and writes all data to Supabase.
