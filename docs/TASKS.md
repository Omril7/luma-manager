# Tasks for You

Manual tasks that require dashboard access, credentials, or external services.

---

## Supabase

### Connect the project - Eden's organization
- [x] Create a project at https://supabase.com
- [x] Copy the project URL and keys into `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [x] Run the DB migration: `npx supabase db push`

---

## Cloudinary - Omri's account - move to Eden's account
- [x] Keys added to `.env.local` ✓

---

## Gmail (for summary email) - Omri's account - move to Eden's account
- [x] `GMAIL_USER` added to `.env.local` ✓
- [x] `GMAIL_APP_PASSWORD` added to `.env.local` ✓

---

## Webhook
- [ ] Set `WEBHOOK_SECRET` in `.env.local` to a random secure string (used to verify incoming store webhooks)

---

## Deployment - Omri's account - move to Eden's account
- [ ] Deploy to Vercel under Omri's account at https://luma-manager.vercel.app

---

## Resolved Investigations

### ✅ Settings — EmailSettingsForm (resolved 2026-06-08)
- Removed `gmail_user` / `gmail_app_password` from the DB and settings form.
- Added `accountant_email` column instead — the address summary emails are sent *to*.
- SMTP credentials remain in env vars only (`GMAIL_USER`, `GMAIL_APP_PASSWORD`).

### ✅ IncomeModal — delivery_amount field (resolved 2026-06-08)
- Replaced `payment_on_delivery boolean` with `delivery_amount numeric(12,2) DEFAULT 0`.
- Form uses a number input; zero means no delivery fee.
