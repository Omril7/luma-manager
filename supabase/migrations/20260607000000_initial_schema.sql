-- Initial schema for Business Financial Manager

-- settings
CREATE TABLE IF NOT EXISTS settings (
  id                uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid    REFERENCES auth.users NOT NULL UNIQUE,
  vat_rate          numeric(5,2)  DEFAULT 18.00,
  paycheck_percent  numeric(5,2)  DEFAULT 30.00,
  opening_balance   numeric(12,2) DEFAULT 0,
  business_name     text,
  gmail_user        text,
  gmail_app_password text,
  created_at        timestamptz   DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_owner" ON settings FOR ALL USING (auth.uid() = user_id);

-- expense_categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id                uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid    REFERENCES auth.users NOT NULL,
  name              text    NOT NULL,
  is_vat_recognized boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_categories_owner" ON expense_categories FOR ALL USING (auth.uid() = user_id);

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id                uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid    REFERENCES auth.users NOT NULL,
  category_id       uuid    REFERENCES expense_categories,
  description       text    NOT NULL,
  total_amount      numeric(12,2) NOT NULL,
  transaction_date  date    NOT NULL,
  is_recurring      boolean DEFAULT false,
  installments_total int    DEFAULT 1,
  is_personal       boolean DEFAULT false,
  notes             text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_owner" ON expenses FOR ALL USING (auth.uid() = user_id);

-- expense_installments
CREATE TABLE IF NOT EXISTS expense_installments (
  id                  uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id          uuid    REFERENCES expenses ON DELETE CASCADE NOT NULL,
  user_id             uuid    REFERENCES auth.users NOT NULL,
  installment_number  int     NOT NULL,
  due_month           date    NOT NULL,
  amount              numeric(12,2) NOT NULL,
  vat_amount          numeric(12,2) DEFAULT 0
);

ALTER TABLE expense_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_installments_owner" ON expense_installments FOR ALL USING (auth.uid() = user_id);

-- receipts
CREATE TABLE IF NOT EXISTS receipts (
  id                    uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id            uuid  REFERENCES expenses ON DELETE CASCADE NOT NULL,
  user_id               uuid  REFERENCES auth.users NOT NULL,
  cloudinary_public_id  text  NOT NULL,
  cloudinary_url        text  NOT NULL,
  file_type             text,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts_owner" ON receipts FOR ALL USING (auth.uid() = user_id);

-- products
CREATE TABLE IF NOT EXISTS products (
  id          uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid  REFERENCES auth.users NOT NULL,
  external_id text,
  name        text  NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_owner" ON products FOR ALL USING (auth.uid() = user_id);

-- income
CREATE TABLE IF NOT EXISTS income (
  id                    uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid    REFERENCES auth.users NOT NULL,
  source                text    NOT NULL DEFAULT 'manual',
  order_id              text,
  product_id            uuid    REFERENCES products,
  product_name          text    NOT NULL,
  original_price        numeric(12,2) NOT NULL,
  discount_amount       numeric(12,2) DEFAULT 0,
  final_price           numeric(12,2) NOT NULL,
  payment_on_delivery   boolean DEFAULT false,
  income_date           date    NOT NULL,
  notes                 text,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "income_owner" ON income FOR ALL USING (auth.uid() = user_id);

-- calendar_events
CREATE TABLE IF NOT EXISTS calendar_events (
  id               uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid  REFERENCES auth.users NOT NULL,
  title            text  NOT NULL,
  description      text,
  start_time       timestamptz NOT NULL,
  end_time         timestamptz,
  is_all_day       boolean DEFAULT false,
  recurrence_rule  text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_events_owner" ON calendar_events FOR ALL USING (auth.uid() = user_id);

-- product_pricings
CREATE TABLE IF NOT EXISTS product_pricings (
  id               uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid    REFERENCES auth.users NOT NULL,
  name             text    NOT NULL,
  hourly_rate      numeric(10,2) DEFAULT 0,
  time_hours       numeric(10,2) DEFAULT 0,
  overhead_per_hour numeric(10,2) DEFAULT 0,
  profit_type      text    DEFAULT 'percent',
  profit_value     numeric(10,2) DEFAULT 0,
  suggested_price  numeric(12,2),
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE product_pricings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_pricings_owner" ON product_pricings FOR ALL USING (auth.uid() = user_id);

-- pricing_parts
CREATE TABLE IF NOT EXISTS pricing_parts (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  pricing_id  uuid    REFERENCES product_pricings ON DELETE CASCADE NOT NULL,
  user_id     uuid    REFERENCES auth.users NOT NULL,
  name        text    NOT NULL,
  price       numeric(10,2) NOT NULL
);

ALTER TABLE pricing_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_parts_owner" ON pricing_parts FOR ALL USING (auth.uid() = user_id);

-- authority_payments
CREATE TABLE IF NOT EXISTS authority_payments (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid    REFERENCES auth.users NOT NULL,
  type            text    NOT NULL,
  amount          numeric(12,2) NOT NULL,
  payment_month   date    NOT NULL,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE authority_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authority_payments_owner" ON authority_payments FOR ALL USING (auth.uid() = user_id);

-- balance_snapshots
CREATE TABLE IF NOT EXISTS balance_snapshots (
  id               uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid    REFERENCES auth.users NOT NULL,
  snapshot_month   date    NOT NULL,
  opening_balance  numeric(12,2) NOT NULL,
  closing_balance  numeric(12,2) NOT NULL,
  approved_at      timestamptz,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE balance_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "balance_snapshots_owner" ON balance_snapshots FOR ALL USING (auth.uid() = user_id);
