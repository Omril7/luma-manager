# Tasks for You

Manual tasks that require dashboard access, credentials, or external services.

---

## Supabase

### Connect the project
- [ ] Create a project at https://supabase.com
- [ ] Copy the project URL and keys into `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [ ] Run the DB migration: `npx supabase db push`

### Enable Passkeys
- [ ] Go to **Authentication → Passkeys** in the Supabase Dashboard
- [ ] Set **Relying Party Display Name**: `מנהל כספים` (or your business name)
- [ ] Set **Relying Party ID**: `localhost` (for dev) / your domain (for prod)
- [ ] Set **Relying Party Origins**: `http://localhost:3000` (for dev) / `https://yourdomain.com` (for prod)

---

## Cloudinary
- [x] Keys added to `.env.local` ✓

---

## Gmail (for summary email)
- [x] `GMAIL_USER` added to `.env.local` ✓
- [x] `GMAIL_APP_PASSWORD` added to `.env.local` ✓

---

## Webhook
- [ ] Set `WEBHOOK_SECRET` in `.env.local` to a random secure string (used to verify incoming store webhooks)
