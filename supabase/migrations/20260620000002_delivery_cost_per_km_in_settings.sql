ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS fuel_price_per_liter       numeric(8,3),
  ADD COLUMN IF NOT EXISTS km_per_liter               numeric(8,2),
  ADD COLUMN IF NOT EXISTS yearly_maintenance_cost    numeric(12,2),
  ADD COLUMN IF NOT EXISTS yearly_insurance_cost      numeric(12,2),
  ADD COLUMN IF NOT EXISTS vehicle_value              numeric(12,2),
  ADD COLUMN IF NOT EXISTS depreciation_rate_percent  numeric(5,2) DEFAULT 15,
  ADD COLUMN IF NOT EXISTS yearly_kilometers          numeric(10,2),
  ADD COLUMN IF NOT EXISTS cost_per_km               numeric(10,4);
