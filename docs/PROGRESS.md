## [2026-06-07] Phase 7 — Dashboard / Cash Flow
- 5 summary cards: הכנסות, הוצאות, רווח גולמי, משכורת, יתרה לעסק — all live-calculated
- Salary control: number input for paycheck % saved to settings on blur via server action
- Authority payments panel: add/delete payments for current month (income_tax, social_security, vat); persisted in authority_payments table; excluded from expense summaries
- Running balance table (עובר ושב): all months with data shown; opening balance chains from settings.opening_balance or last approved snapshot; closing = opening + gross_profit - salary - authority
- Month-close confirmation: "סגור חודש" button on current live row → confirm dialog → upsert to balance_snapshots with approved_at; approved rows use snapshot values thereafter
- Build passes cleanly

## [2026-06-07] Phase 6 — Calendar
- react-big-calendar with dateFnsLocalizer + date-fns he locale; Hebrew messages (today, previous, next, month, week, day, showMore)
- Month / week / day views; clicking an empty slot pre-fills the start time in the form
- EventModal: title, description, all-day toggle (switches date inputs to date-only), start/end datetime pickers, recurrence select (none/daily/weekly/monthly/custom RRULE input)
- EventPopup: read-only summary with formatted dates, edit + delete buttons; confirm before delete
- Server actions: createEvent, updateEvent, deleteEvent with Zod validation + RLS via user_id
- @types/react-big-calendar installed; dir="ltr" wrapper needed since rbc is not RTL-aware internally
- Recurring events: RRULE stored in recurrence_rule column; expansion for display is left to future phase (calendar shows base event only)

## [2026-06-07] Phase 5 — Income
- Product management modal: CRUD (create, delete), used in income modal combobox
- Add/edit income form: product name (free text or select from products), order ID, original price, optional discount, read-only final price, payment on delivery flag, date, notes
- Income page: 4 summary cards (total, count, total discounts, net), monthly daily bar chart, annual monthly bar chart, product breakdown table, income table with month filter
- POST /api/webhooks/store: fully implemented with x-webhook-secret validation, Zod schema, auto product creation by external_id, source='store'
- Webhook requires user_id in payload — noted in DECISIONS.md as the spec doesn't define user resolution
- Build passes cleanly

## [2026-06-07] Phase 4 — Summary Email
- POST /api/send-summary: loads installments for the requested month, builds Hebrew HTML email with two sections (VAT-recognized business expenses + personal expenses), downloads receipt files from Cloudinary and attaches them
- SendSummaryModal: month/year picker, preview of what will be sent, warning when Gmail not configured, success state with stats (expense counts, attachment count)
- "שלח סיכום חודשי" button added to expenses page header
- Email sent to the gmail_user address configured in settings
- hasGmailConfig flag passed from server page to client to show warning inline

## [2026-06-07] Phase 3 — Expenses
- Category management modal: CRUD, VAT-recognized toggle, delete guard (disabled if category in use)
- Add/edit expense modal: description, category, amount (VAT-inclusive), date, recurring, installments (N payments), personal flag, multi-file receipt upload
- Server actions: createExpense, updateExpense, deleteExpense, createCategory, updateCategoryVat, deleteCategory, ensureRecurringInstallments
- VAT logic exclusively via lib/vat.ts — installmentVat() applied on installment #1 only
- Receipt upload via Cloudinary server action (uploadFile utility)
- Expenses table with month filter — shows installment number (X of Y) per row
- Summary cards: total, net of VAT, VAT only (business expenses only)
- Recharts: pie chart (monthly, by category) + bar chart (annual, by month)
- Annual report toggle with year picker
- Recurring expense auto-creation: ensureRecurringInstallments() runs on page load
- Build passes cleanly (npm run build)
- Deviations: Supabase join types required `as unknown as` cast since generated types.ts doesn't include relation shapes

## [2026-06-07] Phase 2 — Settings & User
- Settings page with 4 sections: כללי, עובר ושב, מייל, חשבון
- Server Actions for each section with Zod validation
- Zustand settingsStore + useSettings hook
- Fixed Database types to match @supabase/supabase-js v2 format (added Relationships, CompositeTypes, correct empty View/Function/Enum types)
- Deviations: used useFormState (react-dom) instead of useActionState (React 19 only)

## [2026-06-07] Phase 1 — Infrastructure
- Scaffolded Next.js 14 (App Router, TypeScript strict, Tailwind CSS)
- Rewrote all shadcn/ui components from v4 format to Tailwind v3 / Radix UI compatible (shadcn@latest generates v4-style components incompatible with Next.js 14's Tailwind v3)
- Created Supabase browser + server clients with SSR cookie handling
- Wrote full DB migration SQL with RLS policies for all 11 tables
- Created lib/vat.ts, lib/cloudinary.ts, lib/email.ts
- RTL sidebar navigation with auth guard middleware
- Hebrew login and register pages with Zod validation
- Stub pages for all dashboard routes
- Stub API routes for /api/send-summary and /api/webhooks/store
- Build passes cleanly (npm run build)
- Deviations: used Radix UI primitives instead of @base-ui/react due to Tailwind v3 compatibility
- Known: Supabase and Cloudinary env vars are empty stubs — user must fill .env.local
