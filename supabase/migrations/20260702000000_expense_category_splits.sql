CREATE TABLE expense_category_splits (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id  uuid REFERENCES expenses ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES auth.users NOT NULL,
  category_id uuid REFERENCES expense_categories,
  amount      numeric(12,2) NOT NULL
);

ALTER TABLE expense_category_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_category_splits_owner" ON expense_category_splits
  FOR ALL USING (auth.uid() = user_id);
