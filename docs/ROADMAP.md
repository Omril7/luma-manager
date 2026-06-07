# Roadmap

## Phase 1 — Infrastructure
- [x] Create Next.js 14 project with TypeScript + Tailwind
- [x] Install and configure shadcn/ui with RTL support
- [x] Connect Supabase (auth + db)
- [x] Run all DB migrations (full schema from SPEC.md)
- [x] Apply RLS policies to all tables
- [x] Configure Cloudinary environment variables + server utility
- [x] Base layout: RTL sidebar navigation + auth guard
- [x] Login and Register pages (Hebrew UI)

## Phase 2 — Settings & User
- [x] Settings page: VAT rate, paycheck %, opening balance, Gmail config
- [x] Save and read from settings table

## Phase 3 — Expenses
- [x] Category management (CRUD + VAT recognized toggle)
- [x] Add expense form: installments, recurring, personal flags
- [x] VAT logic for installments via lib/vat.ts
- [x] Receipt upload to Cloudinary (server-side)
- [x] Expenses view: table + month filter
- [x] Summary cards: total, net of VAT, VAT only
- [x] Recharts: bar chart (monthly) + pie chart (by category)
- [x] Annual report toggle

## Phase 4 — Summary Email
- [x] Configure Nodemailer with Gmail SMTP
- [x] API route POST /api/send-summary
- [x] Attach receipts as files in the email
- [x] UI: month picker modal + send button

## Phase 5 — Income
- [ ] Basic product management (CRUD)
- [ ] Manual income entry form (discount, payment on delivery)
- [ ] Income view: summary cards + charts + product breakdown table
- [ ] Webhook stub at POST /api/webhooks/store

## Phase 6 — Calendar
- [ ] Install react-big-calendar with Hebrew locale + RTL
- [ ] CRUD for events
- [ ] Recurring events via RRULE

## Phase 7 — Dashboard / Cash Flow
- [ ] Monthly cash flow calculation
- [ ] Authority payments panel (income tax, social security, VAT)
- [ ] Salary percentage control
- [ ] Running balance tracker + month-close confirmation flow

## Phase 8 — Product Pricing
- [ ] 4-step pricing wizard (materials, labor, overhead, profit)
- [ ] Save pricing + view pricing history

## Phase 9 — Polish
- [ ] Loading states + skeleton loaders
- [ ] Error boundaries
- [ ] Toast notifications (Hebrew messages)
- [ ] Mobile responsiveness
