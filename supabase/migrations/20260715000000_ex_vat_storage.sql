-- ============================================================================
-- Backfill: expense amounts switch from VAT-inclusive to EX-VAT storage.
--
-- Converts: expenses.total_amount, expense_installments.amount,
--           expense_category_splits.amount
-- Unchanged: expense_installments.vat_amount (already the VAT amount),
--            income.final_price (stays VAT-inclusive)
--
-- !! BEFORE RUNNING: take a backup (Supabase point-in-time recovery or
-- !! pg_dump). Run the whole file in one go — it is a single transaction.
-- !! Deploy together with the app code that assumes ex-VAT storage.
--
-- All conversions are derived from the stored vat_amount of each row, never
-- from settings.vat_rate — the rate is mutable and may not match the rate in
-- effect when old rows were created.
--
-- Data-faithful notes:
-- * Recurring expenses historically got VAT only on their first month
--   (months 2+ have vat_amount = 0). Those months keep their stored amount
--   as-is, so every number the app has ever displayed/reported stays
--   identical. Going forward the app computes VAT every month.
-- * Splits: only VAT-recognized splits shed their embedded VAT (that is what
--   the stored vat_amount covers). Non-recognized splits keep their gross
--   amount — non-deductible VAT is part of the cost.
-- ============================================================================

BEGIN;

-- ── 1. Category splits ──────────────────────────────────────────────────────
-- vat1 (installment #1's vat_amount) was computed as extract-VAT over the sum
-- of recognized splits, so each recognized split's ex-VAT amount is
-- amount * (1 - vat1 / recognized_sum). Non-recognized splits are unchanged.
WITH split_factor AS (
  SELECT s.expense_id,
         i.vat_amount AS vat1,
         SUM(s.amount) FILTER (WHERE c.is_vat_recognized) AS rec_sum
  FROM expense_category_splits s
  JOIN expense_installments i
    ON i.expense_id = s.expense_id AND i.installment_number = 1
  LEFT JOIN expense_categories c ON c.id = s.category_id
  GROUP BY s.expense_id, i.vat_amount
)
UPDATE expense_category_splits s
SET amount = round(s.amount * (1 - f.vat1 / f.rec_sum), 2)
FROM split_factor f
WHERE f.expense_id = s.expense_id
  AND f.vat1 > 0
  AND f.rec_sum > 0
  AND s.category_id IN (SELECT id FROM expense_categories WHERE is_vat_recognized);

-- ── 2a. Non-recurring expenses: total = sum of installments' ex-VAT amounts ─
UPDATE expenses e
SET total_amount = agg.new_total
FROM (
  SELECT expense_id, SUM(amount - vat_amount) AS new_total
  FROM expense_installments
  GROUP BY expense_id
) agg
WHERE agg.expense_id = e.id
  AND e.is_recurring = false;

-- ── 2b. Recurring expenses: total_amount is the PER-MONTH amount ────────────
-- (summing installments would multiply it by the number of months).
-- Installment #1's vat/amount ratio recovers the original VAT fraction even
-- if total_amount was edited later, since edits never recomputed vat_amount.
UPDATE expenses e
SET total_amount = round(e.total_amount * (1 - i.vat_amount / i.amount), 2)
FROM expense_installments i
WHERE i.expense_id = e.id
  AND i.installment_number = 1
  AND i.vat_amount > 0
  AND i.amount > 0
  AND e.is_recurring = true;

-- ── 3. Installments (must run AFTER steps 1-2, which read pre-update rows) ──
UPDATE expense_installments
SET amount = amount - vat_amount
WHERE vat_amount <> 0;

COMMIT;

-- ============================================================================
-- Post-run spot checks (read-only):
--
-- a) Non-recurring: total must equal the sum of its installments.
--    SELECT e.id, e.description, e.total_amount, SUM(i.amount) AS inst_sum
--    FROM expenses e JOIN expense_installments i ON i.expense_id = e.id
--    WHERE e.is_recurring = false
--    GROUP BY e.id HAVING abs(e.total_amount - SUM(i.amount)) > 0.02;
--
-- b) Splits: must still sum to the expense total (±rounding).
--    SELECT e.id, e.description, e.total_amount, SUM(s.amount) AS split_sum
--    FROM expenses e JOIN expense_category_splits s ON s.expense_id = e.id
--    GROUP BY e.id HAVING abs(e.total_amount - SUM(s.amount)) > 0.05;
--
-- c) Recurring sanity: installment #1 amount should equal total_amount
--    (mismatches = expenses whose amounts were hand-edited; review manually).
--    SELECT e.id, e.description, e.total_amount, i.amount
--    FROM expenses e JOIN expense_installments i
--      ON i.expense_id = e.id AND i.installment_number = 1
--    WHERE e.is_recurring = true
--      AND abs(e.total_amount - i.amount) > 0.02;
-- ============================================================================
