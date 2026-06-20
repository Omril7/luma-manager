-- Remove dev data so we can safely alter the table
TRUNCATE pricing_parts;
TRUNCATE product_pricings;

-- Add material link + quantity; make price nullable (null = use material.price * quantity)
ALTER TABLE pricing_parts
  ADD COLUMN material_id uuid REFERENCES materials ON DELETE SET NULL,
  ADD COLUMN quantity    numeric(10,2) NOT NULL DEFAULT 1;

ALTER TABLE pricing_parts ALTER COLUMN price DROP NOT NULL;

-- RLS already covers new columns (policy is FOR ALL on the table)
