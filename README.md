# Luma Manager

A business financial management app for freelancers and small businesses. Tracks expenses, income, cash flow, calendar events, and product pricing. UI is in Hebrew (RTL).

## Stack

- **Next.js 14** — App Router, TypeScript strict
- **Supabase** — Auth, Postgres, RLS
- **Tailwind CSS** + shadcn/ui (RTL)
- **Cloudinary** — receipt and document storage
- **Nodemailer** — monthly summary email with receipt attachments
- **Recharts** — charts
- **react-big-calendar** — Hebrew calendar with recurring events

## Getting Started

```bash
npm install
cp .env.example .env.local
# fill in the values in .env.local
npm run dev
```

## Commands

```bash
npm run dev          # dev server
npm run build        # production build check
npx supabase db push # push migrations to Supabase
```

## Features

| Page | Description |
|------|-------------|
| `/expenses` | Expenses — forms, installments, receipts, charts |
| `/income` | Income — manual entry + store webhook |
| `/dashboard` | Cash flow, authority payments, running balance |
| `/calendar` | Calendar with recurring events (RRULE) |
| `/pricing` | 4-step product pricing wizard |
| `/settings` | VAT rate, salary %, Gmail, opening balance |
