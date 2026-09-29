-- Advance payment (מקדמה) received before the sale date
ALTER TABLE income
  ADD COLUMN advance_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN advance_date   date;
