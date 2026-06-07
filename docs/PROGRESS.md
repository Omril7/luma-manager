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
