## [2026-07-15] Decision: expense storage switched to ex-VAT (Option B implemented)
Context: Resolves the 2026-07-02 open question below. Plan lived in docs/VAT.md.
Decision: `expenses.total_amount`, `expense_installments.amount`, and `expense_category_splits.amount` are now stored EX-VAT; `vat_amount` is unchanged in meaning; `income.final_price` stays VAT-inclusive. Backfill migration `20260715000000_ex_vat_storage.sql` derives ex-VAT values from each row's stored `vat_amount` (rate-independent), handles recurring expenses per-month (not sum-of-installments), and converts only VAT-recognized splits (non-deductible VAT stays embedded as cost).
Sub-decisions made with the user:
- Dashboard cash flow counts expenses GROSS (`amount + vat_amount`) — VAT paid to suppliers is real cash out; `authority_payments` type 'vat' is only the net remittance, so no double counting.
- Expenses-page charts show EX-VAT (true cost; also the only accurate option per-category for split expenses, since VAT isn't stored per split).
- Recurring expenses now get `vat_amount` EVERY auto-created month (each month has its own invoice); previously only month #1 got VAT. Historical rows untouched so past VAT reports don't change. `updateInstallment` recomputes `vat_amount` when a recurring month's amount is corrected (only for rows that already carried VAT).
Reason: Ex-VAT is what appears on invoice lines and what the accountant works with; installment/recurring VAT math becomes add-on-top instead of extraction.

## [2026-07-02] Open question: expense amount input — VAT-inclusive vs. VAT-exclusive
Context: The expense modal currently asks for "סכום כולל מע"מ" (VAT-inclusive). The question is whether to let users enter the ex-VAT amount instead, since that's often what appears on the invoice line before tax.

### Option A — Convert at input only (recommended)
User enters ex-VAT amount. Server multiplies by `(1 + vatRate/100)` before storing, so `total_amount` in the DB stays VAT-inclusive as today.
- Touch points: modal label, optional live "= ₪X כולל מע"מ" preview, one line in `createExpense`/`updateExpense`.
- Zero changes to installments, summary cards, dashboard, charts, email, or splits.
- Difficulty: trivial (~20 min).

### Option B — Change storage to ex-VAT
`total_amount`, `expense_installments.amount`, and `expense_category_splits.amount` all become ex-VAT in the DB.
- Ripples across: summary cards formula, dashboard cash flow, charts, email, `lib/vat.ts` (need add-VAT variants), and a data migration on existing rows.
- Splits become conceptually awkward for non-recognized categories (VAT is embedded in the receipt price even when non-deductible).
- Difficulty: significant (~8 files + migration).

Decision: Option B — implemented 2026-07-15, see the entry above.

## [2026-06-08] Decision: income.delivery_amount replaces payment_on_delivery boolean
Context: The income form had a boolean "תשלום במסירה" checkbox that didn't capture how much of the price is a delivery fee vs. product revenue.
Decision: Replace `payment_on_delivery boolean` with `delivery_amount numeric(12,2) DEFAULT 0`. Zero means no delivery; any positive value is the delivery portion of `final_price`.
Reason: Enables accurate product-revenue reporting (final_price − delivery_amount) and is more useful for invoicing without breaking any existing query logic.

## [2026-06-08] Decision: settings stores accountant_email instead of Gmail SMTP credentials
Context: The settings form was asking users to store their Gmail address and App Password in the database, even though the SMTP credentials already live in env vars (GMAIL_USER, GMAIL_APP_PASSWORD) and are shared across all users.
Decision: Removed `gmail_user` and `gmail_app_password` from the settings table. Added `accountant_email` (the address summary emails are *sent to*, i.e., the accountant's inbox).
Reason: Credentials belong in env vars, not user-editable DB rows. The only per-user setting needed is the recipient address.

## [2026-06-07] Decision: Webhook requires user_id in payload
Context: POST /api/webhooks/store is called by an external store with no session. The spec doesn't define how to resolve which user the order belongs to.
Decision: Require a user_id UUID field in the webhook payload alongside the shared secret.
Reason: Simplest correct solution for a personal tool. A future multi-tenant version would use per-user webhook URLs or API keys instead.

## [2026-06-07] Decision: Radix UI instead of @base-ui/react for shadcn components
Context: shadcn@latest (v4.10) generates components that use @base-ui/react primitives and Tailwind v4 CSS classes (e.g. ring-3, oklch colors). Next.js 14 ships with Tailwind CSS v3.
Decision: Manually wrote all shadcn UI components using @radix-ui/* primitives with Tailwind v3-compatible class names.
Reason: Avoids a major Tailwind v3→v4 upgrade which would require replacing postcss config, tailwind config, and globals.css, and is untested with Next.js 14.
