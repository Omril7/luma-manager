-- Work hours per income entry (for salary calculation)
ALTER TABLE income
  ADD COLUMN IF NOT EXISTS work_hours numeric(10,2) DEFAULT 0;

-- Authorities tax % on salary (replaces paycheck_percent in UI)
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS authorities_pct numeric(5,2) DEFAULT 47;

-- Default work hours per product (pre-fills income form)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS default_work_hours numeric(10,2) DEFAULT 0;
