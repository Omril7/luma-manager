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

### Enable Passkeys - Eden only can do it (Owner Role)
- [ ] Go to **Authentication → Passkeys** in the Supabase Dashboard
- [ ] Set **Relying Party Display Name**: `מנהל כספים` (or your business name)
- [ ] Set **Relying Party ID**: `localhost` (for dev) / `luma-manager.vercel.app` (for prod)
- [ ] Set **Relying Party Origins**: `http://localhost:3000` (for dev) / `https://luma-manager.vercel.app` (for prod)

---

## Cloudinary - Omri's account - move to Eden's account
- [ ] Keys added to `.env.local` ✓

---

## Gmail (for summary email) - Omri's account - move to Eden's account
- [ ] `GMAIL_USER` added to `.env.local` ✓
- [ ] `GMAIL_APP_PASSWORD` added to `.env.local` ✓

---

## Webhook
- [ ] Set `WEBHOOK_SECRET` in `.env.local` to a random secure string (used to verify incoming store webhooks)

---

## Deployment - Omri's account - move to Eden's account
- [ ] Deploy to Vercel under Omri's account at https://luma-manager.vercel.app
