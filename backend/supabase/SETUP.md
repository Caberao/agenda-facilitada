# Supabase Setup (Agenda Facilitada)

Use este guia para preparar o banco no Supabase antes de ligar o provider.

## 1) Abra o SQL Editor

- Projeto: `https://wyxtjkvhiwedkftfairg.supabase.co`
- Menu: `SQL Editor` -> `New query`

## 2) Rode o schema base

- Abra o arquivo `backend/supabase/schema.sql`
- Copie e execute o conteúdo completo no SQL Editor

## 3) Pegue as credenciais

- Menu: `Project Settings` -> `Data API`
- Copie:
  - `Project URL` (já preenchida no `.env.example`)
  - `service_role` key

## 4) Configure no backend (Render ou local)

```env
DATA_PROVIDER=supabase
SUPABASE_URL=https://wyxtjkvhiwedkftfairg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<SUA_SERVICE_ROLE_KEY>
SUPABASE_SCHEMA=public
```

## 5) Observação atual

O provider `supabase` já está ativo em runtime no backend.
Se faltar alguma variável (`SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY`), o sistema volta para fallback local.
