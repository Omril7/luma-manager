# VAT storage change — plan (total_amount → ex-VAT)

> Scope: switching `total_amount` (and amounts derived from it) from
> **VAT-inclusive** (today) to **ex-VAT** storage — Option B in
> `docs/DECISIONS.md`, *not* the "convert at input, keep storage inclusive"
> Option A.
>
> Status: DONE. Code implemented 2026-07-15; backfill migration
> (`supabase/migrations/20260715000000_ex_vat_storage.sql`) applied
> successfully 2026-07-18.
>
> Decisions taken (with user, 2026-07-15):
> - Dashboard cash flow: GROSS (amount + vat_amount) — no double counting,
>   since authority_payments 'vat' is only the net remittance.
> - Expenses charts: EX-VAT (per-split VAT isn't stored, so gross-per-category
>   is impossible anyway).
> - Recurring expenses: VAT every auto-created month going forward (was
>   first-month-only). History untouched.
>
> Plan deviations found during implementation:
> - `extractVat` NOT removed — the VAT report still needs it for income
>   (income stays VAT-inclusive). `amountWithoutVat` was removed instead.
> - The Phase 0 backfill formula (sum installments) was wrong for RECURRING
>   expenses (total_amount is per-month, not the sum) — migration derives
>   recurring totals from installment #1's vat/amount ratio instead.
> - Splits are converted per-category (recognized splits shed VAT,
>   non-recognized keep gross = cost incl. non-deductible VAT), not blanket
>   proportional — this keeps future VAT recomputation exact.

---

## Phase 0 — Protect existing data (do this before any code change) — ⚠️ backup/dry-run still pending (user-side)

- [ ] Take a DB snapshot/backup (Supabase point-in-time recovery or
      `pg_dump`) immediately before starting — this whole change must be
      reversible if something goes wrong.
- [ ] Confirm the backfill formula does **not** use the naive
      `total_amount / (1 + vat_rate/100)`. `settings.vat_rate` is mutable
      and today's rate may not match the rate in effect when an old row was
      created — using it would silently corrupt historical totals.
- [ ] Use the correct, rate-independent backfill instead: each
      `expense_installments` row already stores the correct `vat_amount`
      for the rate in effect at creation time (only installment #1 has
      `vat_amount > 0`). Derive:
      ```sql
      ex_vat_amount = amount - vat_amount   -- per installment
      ```
      then re-derive `expenses.total_amount` by summing each expense's
      installments' `ex_vat_amount`.
- [ ] Convert `expense_category_splits.amount` proportionally in the same
      migration/transaction (splits must keep summing to the new
      `total_amount`).
- [ ] Run the backfill in a **single transaction** across all three tables
      (`expenses`, `expense_installments`, `expense_category_splits`) —
      never partially migrate one table and leave the others inclusive.
- [ ] Dry-run on a copy of production data first. Spot-check: pick 5-10
      real expenses (including installment and split cases) and manually
      verify `sum(installments.ex_vat_amount) == new total_amount` and
      `sum(splits.amount) == new total_amount`.
- [ ] Decide with the user, before Phase 3, whether dashboard/chart totals
      should add `vat_amount` back in — VAT is already settled separately
      via `authority_payments` (type `'vat'`), so blindly re-adding it
      risks double-counting VAT in cash-flow numbers. This is a product
      call, not a mechanical one.

## Phase 1 — Core VAT math (`src/lib/vat.ts`) — ✅ done 2026-07-15

- [ ] Add `vatOnExAmount(exAmount, vatRate) = exAmount * vatRate/100`
      (replaces `extractVat` everywhere it's currently called)
- [ ] Add `amountWithVat(exAmount, vatRate) = exAmount * (1 + vatRate/100)`
      (for anywhere a VAT-inclusive display total is still needed)
- [ ] Update `installmentVat()` to compute VAT via `vatOnExAmount` instead
      of `extractVat`, keeping the "installment #1 only" rule unchanged
- [ ] Remove `amountWithoutVat()` (dead code — the stored amount already
      is ex-VAT) or repurpose it if still referenced anywhere

## Phase 2 — Server actions (`src/app/(dashboard)/expenses/actions.ts`) — ✅ done 2026-07-15

- [ ] `createExpense`: swap `extractVat` → `vatOnExAmount` for the
      installment-#1 VAT calc
- [ ] `updateExpense`: same swap
- [ ] `ensureRecurringInstallments`: same swap
- [ ] Category-split VAT calc (3 call sites: create/update/recurring):
      swap `extractVat(split.amount, vatRate)` → `vatOnExAmount(...)`
- [ ] No change needed to `installmentAmount = total_amount / numInstallments`
      — dividing an ex-VAT total by N still yields correct ex-VAT
      installments

## Phase 3 — Display & aggregation — ✅ done 2026-07-15

- [ ] `ExpenseSummaryCards.tsx`: flip the formula —
      `netOfVat` becomes just `sum(amount)`; the VAT-inclusive total
      becomes `sum(amount) + sum(vat_amount)` (currently it's the reverse)
- [ ] `dashboard/page.tsx` cash-flow expense sum: apply the Phase 0
      double-counting decision (add `vat_amount` back in, or not)
- [ ] `ExpensesCharts.tsx` (annual bar chart + monthly pie chart): apply
      the same decision consistently so charts and dashboard agree
- [ ] `api/send-summary/route.ts`: no formula changes required, but the
      "סכום" column now means net-of-VAT instead of gross — confirm the
      accountant-facing email still makes sense with that relabeled column

## Phase 4 — UI copy (Hebrew) — ✅ done 2026-07-15

- [ ] `ExpenseModal.tsx` amount field label: change from
      `"סכום כולל מע"מ"` ("amount including VAT") to ex-VAT wording, e.g.
      `"סכום ללא מע"מ"`
- [ ] Search for any other Hebrew strings assuming VAT-inclusive input
      (tooltips, summary email subject/section text, etc.)

## Phase 5 — Migration & deploy — ✅ migration applied 2026-07-18

- [ ] Write the SQL backfill migration per Phase 0's formula
- [ ] Deploy the migration and the code changes **together, atomically** —
      never let VAT-inclusive data sit behind ex-VAT-assuming code (or
      vice versa) even briefly, since this is money data
- [ ] Post-deploy: spot-check the same sample expenses from Phase 0 in the
      live UI (summary cards, dashboard, email preview) to confirm numbers
      match expectations

## Phase 6 — Docs — ✅ done 2026-07-15

- [ ] Update `docs/DECISIONS.md`: mark Option B as implemented, dated
- [ ] Update `docs/SPEC.md` wherever it describes `total_amount` as
      VAT-inclusive
- [ ] Append an entry to `docs/PROGRESS.md`

---

## Reference — per-file detail

| # | File | What changes |
|---|------|--------------|
| 1 | `src/lib/vat.ts` | New `vatOnExAmount`/`amountWithVat`; `installmentVat` internals change; `amountWithoutVat` removed |
| 2 | `src/app/(dashboard)/expenses/actions.ts` | Swap `extractVat` → `vatOnExAmount` at 5 call sites (installment VAT ×3, split VAT ×3 minus overlap); installment split math (`total/N`) unaffected |
| 3 | `expense_category_splits` (logic in actions.ts) | Per-split VAT formula flips from extract to add-on-top |
| 4 | `ExpenseSummaryCards.tsx` | `netOfVat`/`total` formulas flip (subtraction → addition) |
| 5 | `dashboard/page.tsx` | Cash-flow expense sum: decide + apply `+vat_amount` (watch for double-counting with `authority_payments`) |
| 6 | `ExpensesCharts.tsx` | Bar + pie chart sums: same decision as #5, applied consistently |
| 7 | `api/send-summary/route.ts` | No formula change; column semantics shift net vs. gross |
| 8 | `ExpenseModal.tsx` | Label text `סכום כולל מע"מ` must change |
| 9 | Migrations | New backfill migration required, derived from `vat_amount` (not from current `vat_rate`) across `expenses`, `expense_installments`, `expense_category_splits` |
| 10 | `src/lib/supabase/types.ts` | No change — field types stay `number`, only semantics shift |

**Net scope:** ~8 files with real logic/copy changes, one new backfill
migration touching 3 tables, deployed atomically with the code.
