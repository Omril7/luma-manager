-- Pricings no longer snapshot rates or the computed price:
-- hourly rate + overhead come live from settings, suggested price is computed in the UI.
ALTER TABLE product_pricings
  DROP COLUMN IF EXISTS hourly_rate,
  DROP COLUMN IF EXISTS overhead_per_hour,
  DROP COLUMN IF EXISTS suggested_price;
