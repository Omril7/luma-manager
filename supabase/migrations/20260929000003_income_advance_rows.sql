-- An advance payment is now its own income row (so it lands in the month it was received).
-- Replaces income.advance_amount / advance_date from 20260929000002.
BEGIN;

ALTER TABLE income ADD COLUMN is_advance boolean NOT NULL DEFAULT false;

-- Convert rows already saved with an advance into advance row + remainder row
INSERT INTO income (user_id, source, order_id, product_id, product_name,
                    original_price, discount_amount, final_price, delivery_amount,
                    work_hours, income_date, notes, is_advance)
SELECT user_id, source, order_id, product_id, product_name,
       advance_amount, 0, advance_amount, 0,
       0, COALESCE(advance_date, income_date), notes, true
FROM income
WHERE advance_amount > 0;

UPDATE income
SET original_price = original_price - advance_amount,
    final_price    = final_price - advance_amount
WHERE advance_amount > 0;

ALTER TABLE income
  DROP COLUMN advance_amount,
  DROP COLUMN advance_date;

COMMIT;
