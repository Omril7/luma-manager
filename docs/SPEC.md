# Business Financial Manager — Master Spec

> This is the single source of truth for Claude Code.
> Read this file in full before doing anything.
> App UI language: Hebrew (RTL). This spec is in English.

---

## PART 1 — CLAUDE CODE SETUP (DO THIS FIRST)

Before writing a single line of application code, set up the Claude Code
configuration environment exactly as described below.

### Step 1 — Create the file structure

Create the following files and folders at the project root:

```
CLAUDE.md                  ← Auto-loaded every session (keep it short)
docs/
├── SPEC.md                ← This file (the full spec)
├── ROADMAP.md             ← Phase checklist (created in Step 3)
├── DECISIONS.md           ← Architecture decisions log (start empty)
└── PROGRESS.md            ← Session progress log (start empty)
.claude/
└── settings.json          ← Tool permissions
```

### Step 2 — Write CLAUDE.md

Create `CLAUDE.md` at the project root with exactly this content:

```markdown
# Business Financial Manager

## Stack
Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui (RTL),
Supabase (auth + postgres + RLS), Cloudinary, Nodemailer/Gmail, Recharts,
Zustand, React Hook Form + Zod, react-big-calendar

## Dev Commands
- `npm run dev`                        — start dev server
- `npx supabase db push`               — push migrations to Supabase
- `npx supabase gen types typescript --local > src/lib/supabase/types.ts`
- `npm run build`                      — production build check

## Non-Negotiable Rules
- All UI text in Hebrew. dir="rtl" on <html>. No English visible to the user.
- TypeScript strict mode. No `any` anywhere.
- All VAT logic lives exclusively in `src/lib/vat.ts`. Nowhere else.
- Cloudinary uploads are server-side only. Never expose API secret to client.
- Never bypass RLS in client-side code.
- Server Actions are preferred over API routes (except send-summary + webhooks).
- Zod schema required for every form.
- After completing each phase, update docs/ROADMAP.md checkboxes and
  append a summary entry to docs/PROGRESS.md.

## Docs
Full spec:            @docs/SPEC.md
Roadmap & progress:   @docs/ROADMAP.md
Progress log:         @docs/PROGRESS.md
Decisions log:        @docs/DECISIONS.md
```

### Step 3 — Write docs/ROADMAP.md

Create `docs/ROADMAP.md` with exactly this content:

```markdown
# Roadmap

## Phase 1 — Infrastructure
- [ ] Create Next.js 14 project with TypeScript + Tailwind
- [ ] Install and configure shadcn/ui with RTL support
- [ ] Connect Supabase (auth + db)
- [ ] Run all DB migrations (full schema from SPEC.md)
- [ ] Apply RLS policies to all tables
- [ ] Configure Cloudinary environment variables + server utility
- [ ] Base layout: RTL sidebar navigation + auth guard
- [ ] Login and Register pages (Hebrew UI)

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
```

### Step 4 — Write .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx supabase *)",
      "Bash(npx shadcn *)",
      "Bash(npm install *)",
      "Bash(mkdir -p *)",
      "Bash(touch *)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(curl * | bash)"
    ]
  }
}
```

### Step 5 — Start building

After the above files exist, begin Phase 1 from ROADMAP.md.
After each phase is fully complete:
1. Check off all completed items in docs/ROADMAP.md
2. Append a dated entry to docs/PROGRESS.md in this format:

```
## [YYYY-MM-DD] Phase N — Title
- What was built
- Any deviations from spec and why
- Known issues or TODOs carried forward
```

3. Log any non-obvious architecture decision in docs/DECISIONS.md:

```
## [YYYY-MM-DD] Decision: short title
Context: why the decision came up
Decision: what was chosen
Reason: why
```

---

## PART 2 — APPLICATION SPEC

---

## Tech Stack

| Layer             | Technology                                      |
|-------------------|-------------------------------------------------|
| Framework         | Next.js 14, App Router, TypeScript strict       |
| Styling           | Tailwind CSS + shadcn/ui (RTL configured)       |
| State             | Zustand                                         |
| Forms             | React Hook Form + Zod                           |
| Charts            | Recharts                                        |
| Auth              | Supabase Auth (email + password, per-user data) |
| Database          | Supabase Postgres with RLS                      |
| File Storage      | Cloudinary (images + PDFs, server uploads only) |
| Email             | Nodemailer + Gmail SMTP                         |
| Calendar          | react-big-calendar                              |

---

## Project Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← sidebar + RTL wrapper + auth guard
│   │   ├── dashboard/page.tsx      ← cash flow / תזרים
│   │   ├── expenses/page.tsx
│   │   ├── income/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── pricing/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── send-summary/route.ts
│   │   └── webhooks/store/route.ts
│   └── layout.tsx                  ← sets lang="he" dir="rtl" on <html>
├── components/
│   ├── ui/                         ← shadcn components
│   ├── layout/                     ← sidebar, topbar, page wrappers
│   ├── expenses/
│   ├── income/
│   ├── calendar/
│   ├── dashboard/
│   └── pricing/
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← browser client
│   │   ├── server.ts               ← server client (Server Actions)
│   │   └── types.ts                ← generated types (never edit manually)
│   ├── cloudinary.ts               ← server-only upload utility
│   ├── email.ts                    ← nodemailer config + send functions
│   ├── vat.ts                      ← ALL VAT logic here only
│   └── utils.ts                    ← shared helpers (date formatting, ILS, etc.)
├── hooks/
│   ├── useExpenses.ts
│   ├── useIncome.ts
│   ├── useSettings.ts
│   └── useCalendar.ts
└── stores/
    └── settingsStore.ts            ← VAT rate, paycheck %, etc. (Zustand)
```

---

## Database Schema

> Every table has `user_id uuid REFERENCES auth.users NOT NULL`.
> Every table has RLS enabled with a policy: `auth.uid() = user_id`.

### settings
```sql
CREATE TABLE settings (
  id                uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid    REFERENCES auth.users NOT NULL UNIQUE,
  vat_rate          numeric(5,2)  DEFAULT 18.00,
  paycheck_percent  numeric(5,2)  DEFAULT 30.00,
  opening_balance   numeric(12,2) DEFAULT 0,
  business_name     text,
  gmail_user        text,
  gmail_app_password text,
  created_at        timestamptz   DEFAULT now()
);
```

### expense_categories
```sql
CREATE TABLE expense_categories (
  id                uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid    REFERENCES auth.users NOT NULL,
  name              text    NOT NULL,
  is_vat_recognized boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);
```

### expenses
```sql
CREATE TABLE expenses (
  id                uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid    REFERENCES auth.users NOT NULL,
  category_id       uuid    REFERENCES expense_categories,
  description       text    NOT NULL,
  total_amount      numeric(12,2) NOT NULL,   -- full amount, VAT inclusive
  transaction_date  date    NOT NULL,
  is_recurring      boolean DEFAULT false,    -- auto-copies each month
  installments_total int    DEFAULT 1,
  is_personal       boolean DEFAULT false,    -- excluded from business totals
  notes             text,
  created_at        timestamptz DEFAULT now()
);
```

### expense_installments
```sql
-- One row per installment (including single-payment expenses)
CREATE TABLE expense_installments (
  id                  uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id          uuid    REFERENCES expenses ON DELETE CASCADE NOT NULL,
  user_id             uuid    REFERENCES auth.users NOT NULL,
  installment_number  int     NOT NULL,          -- 1, 2, 3...
  due_month           date    NOT NULL,           -- first day of the payment month
  amount              numeric(12,2) NOT NULL,     -- installment amount
  vat_amount          numeric(12,2) DEFAULT 0     -- only installment #1 gets VAT
);
```

**VAT rule on installments:**
VAT is calculated on installment #1 only, using the full `total_amount`.
All other installments: `vat_amount = 0`.
Formula: `vat_amount = total_amount * vat_rate / (100 + vat_rate)`

**Recurring expenses logic:**
On page load, check if any `is_recurring = true` expense is missing an
installment row for the current month. If missing, create one automatically.

### receipts
```sql
CREATE TABLE receipts (
  id                    uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id            uuid  REFERENCES expenses ON DELETE CASCADE NOT NULL,
  user_id               uuid  REFERENCES auth.users NOT NULL,
  cloudinary_public_id  text  NOT NULL,
  cloudinary_url        text  NOT NULL,
  file_type             text,   -- 'image' | 'pdf'
  created_at            timestamptz DEFAULT now()
);
```

### income
```sql
CREATE TABLE income (
  id                    uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid    REFERENCES auth.users NOT NULL,
  source                text    NOT NULL DEFAULT 'manual',  -- 'manual' | 'store'
  order_id              text,
  product_id            uuid    REFERENCES products,
  product_name          text    NOT NULL,
  original_price        numeric(12,2) NOT NULL,
  discount_amount       numeric(12,2) DEFAULT 0,
  final_price           numeric(12,2) NOT NULL,  -- original_price - discount_amount
  payment_on_delivery   boolean DEFAULT false,
  income_date           date    NOT NULL,
  notes                 text,
  created_at            timestamptz DEFAULT now()
);
```

### products
```sql
CREATE TABLE products (
  id          uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid  REFERENCES auth.users NOT NULL,
  external_id text,   -- ID from the future e-commerce store
  name        text  NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);
```

### calendar_events
```sql
CREATE TABLE calendar_events (
  id               uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid  REFERENCES auth.users NOT NULL,
  title            text  NOT NULL,
  description      text,
  start_time       timestamptz NOT NULL,
  end_time         timestamptz,
  is_all_day       boolean DEFAULT false,
  recurrence_rule  text,   -- RFC 5545 RRULE string (e.g. "FREQ=MONTHLY")
  created_at       timestamptz DEFAULT now()
);
```

### product_pricings
```sql
CREATE TABLE product_pricings (
  id               uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid    REFERENCES auth.users NOT NULL,
  name             text    NOT NULL,
  hourly_rate      numeric(10,2) DEFAULT 0,
  time_hours       numeric(10,2) DEFAULT 0,
  overhead_per_hour numeric(10,2) DEFAULT 0,
  profit_type      text    DEFAULT 'percent',   -- 'percent' | 'fixed'
  profit_value     numeric(10,2) DEFAULT 0,
  suggested_price  numeric(12,2),
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE pricing_parts (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  pricing_id  uuid    REFERENCES product_pricings ON DELETE CASCADE NOT NULL,
  user_id     uuid    REFERENCES auth.users NOT NULL,
  name        text    NOT NULL,
  price       numeric(10,2) NOT NULL
);
```

### authority_payments
```sql
-- Income tax, social security, VAT remittance — NOT counted as business expenses
CREATE TABLE authority_payments (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid    REFERENCES auth.users NOT NULL,
  type            text    NOT NULL,   -- 'income_tax' | 'social_security' | 'vat'
  amount          numeric(12,2) NOT NULL,
  payment_month   date    NOT NULL,   -- first day of month
  notes           text,
  created_at      timestamptz DEFAULT now()
);
```

### balance_snapshots
```sql
-- Saved after user approves month-close
CREATE TABLE balance_snapshots (
  id               uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid    REFERENCES auth.users NOT NULL,
  snapshot_month   date    NOT NULL,
  opening_balance  numeric(12,2) NOT NULL,
  closing_balance  numeric(12,2) NOT NULL,
  approved_at      timestamptz,    -- null = pending approval
  created_at       timestamptz DEFAULT now()
);
```

### RLS — apply this pattern to every table
```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<table_name>_owner" ON <table_name>
  FOR ALL USING (auth.uid() = user_id);
```

---

## VAT Logic (lib/vat.ts)

This is the only file that may perform VAT calculations.

```typescript
/**
 * Extract VAT from a VAT-inclusive amount.
 * amount  = total amount (VAT included)
 * vatRate = e.g. 18 (not 0.18)
 */
export function extractVat(amount: number, vatRate: number): number {
  return (amount * vatRate) / (100 + vatRate);
}

/**
 * Amount excluding VAT.
 */
export function amountWithoutVat(amount: number, vatRate: number): number {
  return amount - extractVat(amount, vatRate);
}

/**
 * VAT for installment payments.
 * Rule: VAT is charged on the FULL total_amount, but only on installment #1.
 * All other installments: vat_amount = 0.
 *
 * Example: 1,000 ILS in 4 installments, VAT = 18%
 *   Installment 1 (June):  amount=250, vat_amount=extractVat(1000, 18)=152.54
 *   Installment 2 (July):  amount=250, vat_amount=0
 *   Installment 3 (Aug):   amount=250, vat_amount=0
 *   Installment 4 (Sep):   amount=250, vat_amount=0
 */
export function installmentVat(
  totalAmount: number,
  installmentNumber: number,
  vatRate: number
): number {
  return installmentNumber === 1 ? extractVat(totalAmount, vatRate) : 0;
}
```

---

## Page Specifications

---

### /expenses — Expenses Page

#### Layout
Top row: summary cards.
Below: filter bar (month picker + annual report toggle).
Below: charts row.
Below: expenses table.
Floating action button: "הוסף הוצאה" (Add expense).

#### Summary Cards
1. סה"כ הוצאות — Total expenses for the selected month
2. ללא מע"מ — Total excluding VAT
3. מע"מ בלבד — VAT amount only
Cards show only business expenses (is_personal = false).

#### Filters
- Month picker: previous/next arrows + month/year display. Default: current month.
- "דוח שנתי" button: switches to annual view showing all 12 months side by side.

#### Charts (Recharts)
- Monthly view: pie chart — expense breakdown by category.
- Annual view: bar chart — total expenses per month for the selected year.

#### Expenses Table
Columns: תאריך | תיאור | קטגוריה | סכום | מע"מ | תשלומים | סוג | קבלה | פעולות
- "סוג" shows: עסקי / אישי
- "תשלומים" shows: תשלום X מתוך Y (for installment expenses)
- "קבלה" shows: thumbnail or PDF icon if exists
- "פעולות": edit + delete buttons

#### Add/Edit Expense — Modal Form
Fields:
- תיאור (required, text)
- קטגוריה (dropdown; includes "+ הוסף קטגוריה" inline option)
- סכום כולל מע"מ in ILS (required, number)
- תאריך עסקה (date picker, required)
- הוצאה קבועה — checkbox
  - If checked: this expense auto-generates a copy every month.
  - Shown with a "קבוע" badge in the table.
- תשלומים — checkbox
  - If checked: show "מספר תשלומים" number input (min 1).
  - System creates N rows in expense_installments.
  - Each installment amount = total_amount / N.
  - VAT only on installment #1 (on full total_amount).
- הוצאה אישית — checkbox
  - If checked: excluded from business summary cards and charts.
  - Still appears in the expenses table (filterable).
  - Included in summary email under a separate section.
- העלאת קבלות: file input accepting image/* and application/pdf.
  - Allow multiple files. Show "הוסף קבלה נוספת" button.
  - Upload via server action to Cloudinary.
- הערות (optional, textarea)

#### Category Management — Separate Modal
Opened via "נהל קטגוריות" button.
- List all categories for this user.
- Each row: category name + "הוצאה מוכרת מע"מ" toggle + delete button.
- Delete is disabled (with tooltip) if any expense uses that category.
- "הוסף קטגוריה" button at bottom: text input + save.

#### Summary Email Button
"שלח סיכום חודשי" button opens a modal:
- Month/year picker (default: current month).
- Preview of what will be sent (counts of expenses + receipts).
- "שלח" button → POST /api/send-summary.

Email content:
```
Subject: סיכום הוצאות [Month Year] — [Business Name]

Section 1: הוצאות עסקיות מוכרות מע"מ
Table: תאריך | תיאור | קטגוריה | סכום | מע"מ
Only expenses in categories where is_vat_recognized = true.
Footer row: סה"כ: X ₪  |  מע"מ מוכר: X ₪

Section 2: הוצאות אישיות (לידיעה בלבד)
Table: תאריך | תיאור | סכום
is_personal = true expenses.

Attachments: all receipt files for the month.
```

---

### /income — Income Page

#### Summary Cards
1. סה"כ הכנסות — Total income for the month (sum of final_price)
2. מספר הזמנות — Number of income records
3. סה"כ הנחות — Total discount_amount given
4. הכנסה נטו — After discounts

#### Charts
- Monthly view: bar chart of daily income for the selected month.
- Annual view: bar chart of monthly totals.
- Product breakdown table: product name | units sold | total revenue | discount loss.
  Discount loss = sum of discount_amount per product.

#### Add Income — Modal Form
Fields:
- שם מוצר: free text OR select from products table (combobox).
- מספר הזמנה: optional text.
- מחיר מקורי: number (required).
- הנחה: checkbox → if checked, show "סכום הנחה" number input.
- מחיר סופי: auto-calculated (original - discount), displayed read-only.
- תשלום במסירה: checkbox.
- תאריך: date picker (required).
- הערות: optional textarea.

#### Future Store Integration
`POST /api/webhooks/store` accepts JSON:
```json
{
  "order_id": "string",
  "product_name": "string",
  "product_external_id": "string",
  "original_price": 0,
  "discount_amount": 0,
  "final_price": 0,
  "payment_on_delivery": false,
  "income_date": "YYYY-MM-DD"
}
```
Sets `source = 'store'` and inserts into income table.
This endpoint must verify a shared secret header for security.

---

### /calendar — Calendar Page

- Component: react-big-calendar with Hebrew locale (he) and RTL layout.
- Default view: month.
- Available views: month, week, day.

#### Add Event — Modal (triggered by button or clicking empty date slot)
Fields:
- כותרת (required, text)
- תיאור (optional, textarea)
- תאריך ושעת התחלה (datetime picker)
- תאריך ושעת סיום (datetime picker)
- כל היום — checkbox (hides time fields)
- חזרה:
  - ללא חזרה
  - יומי
  - שבועי
  - חודשי
  - מותאם אישית (shows RRULE input for advanced users)

#### Edit/Delete
Clicking an existing event opens a popup with:
- Event details (read-only summary)
- "ערוך" button → opens full edit modal pre-filled
- "מחק" button → confirm dialog → delete

---

### /dashboard — Cash Flow (תזרים)

#### Summary Cards (top row)
1. הכנסות החודש
2. הוצאות החודש (business only)
3. רווח גולמי
4. משכורת לעצמי
5. יתרה לעסק (after salary + authority payments)

#### Cash Flow Formula
```
gross_profit       = monthly_income - monthly_business_expenses
salary             = gross_profit × (paycheck_percent / 100)
authority_total    = SUM(authority_payments WHERE payment_month = current_month)
monthly_balance    = gross_profit - salary - authority_total
running_balance    = previous_snapshot.closing_balance + monthly_balance
```

#### Authority Payments Panel
Section on the dashboard with a table of this month's authority payments.
"הוסף תשלום" button → inline form:
- סוג: מס הכנסה / ביטוח לאומי / מע"מ (select)
- סכום (number)
- חודש (month picker)
- הערות (optional)

These do NOT appear in expense summaries. They are tracked separately.

#### Salary Control
- Slider or number input: % of gross profit.
- Displays: "משכורת חודשית: X ₪" (live-calculated).
- Saves to settings table on blur.

#### Running Balance — עובר ושב
- Displays a table: month | opening balance | income | expenses | authority | salary | closing balance.
- Current month row shows live (unconfirmed) numbers.
- Past month rows show approved snapshot values.
- At the end of each month (or manually): show confirm dialog:
  "סגור את חודש [Month]? היתרה הסופית תהיה X ₪"
  On confirm → insert row into balance_snapshots with approved_at = now().

---

### /pricing — Product Pricing

#### Pricing History List
Default view: list of saved pricings with name, suggested price, date.
"תמחור חדש" button → opens wizard.

#### Pricing Wizard (4 steps, accordion or stepper)

**Step 1 — חומרי גלם (Raw Materials)**
Dynamic list of rows: [material name] [price in ILS] [delete button]
"+ הוסף חומר גלם" button adds a new row.
Running subtotal displayed: סה"כ חומרי גלם: X ₪

**Step 2 — עבודה (Labor)**
- שעות עבודה (number input)
- ערך שעה in ILS (number input, pre-filled from settings if saved)
- Subtotal: hours × hourly_rate

**Step 3 — הוצאות נלוות (Overhead)**
- הוצאות נלוות לשעה in ILS (equipment wear, rent share, etc.)
- Subtotal: hours × overhead_per_hour

**Step 4 — רווח (Profit)**
- Toggle: % מהעלות / סכום קבוע (ILS)
- Value input
- Live preview of profit amount

#### Pricing Result
```
Suggested Price =
    sum(pricing_parts.price)
  + (time_hours × hourly_rate)
  + (time_hours × overhead_per_hour)
  + profit_amount
```
Profit amount:
- If profit_type = 'percent': profit_value / 100 × (materials + labor + overhead)
- If profit_type = 'fixed': profit_value

Displayed in a large card with breakdown.
"שמור תמחור" button → saves to product_pricings + pricing_parts tables.

---

### /settings — Settings Page

Sections:
1. **כללי**: business name, VAT rate (%), paycheck % of profit
2. **עובר ושב**: opening balance (used as starting value for running balance)
3. **מייל**: Gmail address, Gmail App Password (stored in settings table)
4. **חשבון**: email, change password button

All saved via Server Action to the settings table.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Gmail SMTP (Nodemailer)
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Webhook security
WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://luma-manager.vercel.app
```

---

## Coding Rules (enforced, not suggestions)

1. `dir="rtl"` and `lang="he"` on the root `<html>` element in app/layout.tsx.
2. Every string visible to the user is in Hebrew. No English in the UI.
3. TypeScript strict mode. `"strict": true` in tsconfig. Zero `any`.
4. All VAT math goes through `src/lib/vat.ts` functions. No inline VAT math.
5. Cloudinary: upload only in Server Actions or API routes. Never in client components.
6. Supabase RLS: never use `service_role` key in client-side code.
7. Every form has a Zod schema. Validation runs both client-side and server-side.
8. Server Actions are the default for data mutations. Only use API routes for
   send-summary (needs file attachments) and webhooks (external callers).
9. Recurring expenses: checked and auto-created on expenses page load via a
   lightweight server function. Keep it simple — no background jobs needed.
10. After every phase, update docs/ROADMAP.md and docs/PROGRESS.md.

---

*End of spec. Claude Code: read this once, then begin Part 1 Step 1.*