-- Settings: replace per-user gmail credentials with a single accountant recipient email.
-- SMTP credentials are now stored only in env vars (GMAIL_USER, GMAIL_APP_PASSWORD).
ALTER TABLE settings ADD COLUMN IF NOT EXISTS accountant_email text;
ALTER TABLE settings DROP COLUMN IF EXISTS gmail_user;
ALTER TABLE settings DROP COLUMN IF EXISTS gmail_app_password;

-- Income: replace boolean payment_on_delivery with a numeric delivery_amount.
-- delivery_amount = the portion of final_price that is a delivery fee (0 = no delivery).
-- product income = final_price - delivery_amount.
ALTER TABLE income ADD COLUMN IF NOT EXISTS delivery_amount numeric(12,2) DEFAULT 0;
ALTER TABLE income DROP COLUMN IF EXISTS payment_on_delivery;
