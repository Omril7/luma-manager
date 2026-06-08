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

---

## To Investigate

### Settings — EmailSettingsForm
- Gmail app password is already in `.env.local` as `GMAIL_APP_PASSWORD` (server-side env var).
- The settings form currently asks the user to enter it again and stores it in the DB.
- **Question:** Is the DB field needed at all? Could simplify the form to only ask for the **recipient email** (the accountant's address) instead of managing SMTP credentials per-user.
- If yes — remove `gmail_user` / `gmail_app_password` from the settings table form and use only the env vars for sending; add a single "recipient email" field instead.

### IncomeModal — payment_on_delivery field
- Currently a checkbox (boolean). Doesn't capture how much of the price is paid on delivery.
- **Question:** Should this be a number input instead — the amount of the original price that is collected on delivery (partial or full)?
- If yes — change the DB column / field from `boolean` to `numeric`, update the form, table display, and any summary logic that references it.
