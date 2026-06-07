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
- [ ] Settings page: VAT rate, paycheck %, opening balance, Gmail config
- [ ] Save and read from settings table

## Phase 3 — Expenses
- [ ] Category management (CRUD + VAT recognized toggle)
- [ ] Add expense form: installments, recurring, personal flags
- [ ] VAT logic for installments via lib/vat.ts
- [ ] Receipt upload to Cloudinary (server-side)
- [ ] Expenses view: table + month filter
- [ ] Summary cards: total, net of VAT, VAT only
- [ ] Recharts: bar chart (monthly) + pie chart (by category)
- [ ] Annual report toggle

## Phase 4 — Summary Email
- [ ] Configure Nodemailer with Gmail SMTP
- [ ] API route POST /api/send-summary
- [ ] Attach receipts as files in the email
- [ ] UI: month picker modal + send button

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
