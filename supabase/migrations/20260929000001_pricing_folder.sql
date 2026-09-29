-- Optional folder label per pricing, used to filter the pricing history table.
ALTER TABLE product_pricings ADD COLUMN IF NOT EXISTS folder text;
