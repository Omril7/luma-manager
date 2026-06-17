CREATE TABLE material_categories (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid    REFERENCES auth.users NOT NULL,
  name       text    NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "material_categories_owner" ON material_categories
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE materials (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid    REFERENCES auth.users NOT NULL,
  category_id uuid    REFERENCES material_categories ON DELETE CASCADE NOT NULL,
  name        text    NOT NULL,
  unit        text    NOT NULL,
  price       numeric(12,2) NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_owner" ON materials
  FOR ALL USING (auth.uid() = user_id);
