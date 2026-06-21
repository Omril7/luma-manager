-- VAT report frequency in settings
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS vat_report_frequency text DEFAULT 'bimonthly';

-- Pricing overhead items (replaces monthly_fixed_expenses single value)
CREATE TABLE pricing_overhead_items (
  id         uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid          REFERENCES auth.users NOT NULL,
  name       text          NOT NULL DEFAULT '',
  price      numeric(12,2) NOT NULL DEFAULT 0,
  note       text,
  sort_order int           NOT NULL DEFAULT 0,
  created_at timestamptz   DEFAULT now()
);

ALTER TABLE pricing_overhead_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_overhead_items_owner" ON pricing_overhead_items
  FOR ALL USING (auth.uid() = user_id);
