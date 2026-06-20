ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS monthly_salary_target    numeric(12,2),
  ADD COLUMN IF NOT EXISTS monthly_fixed_expenses   numeric(12,2),
  ADD COLUMN IF NOT EXISTS working_days_per_month   numeric(5,2) DEFAULT 22,
  ADD COLUMN IF NOT EXISTS hours_per_day            numeric(5,2) DEFAULT 8,
  ADD COLUMN IF NOT EXISTS default_hourly_rate      numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_overhead_per_hour numeric(10,2) DEFAULT 0;
