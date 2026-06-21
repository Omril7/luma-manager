CREATE TABLE personal_provisions (
  id             uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid         REFERENCES auth.users NOT NULL,
  type           text         NOT NULL,   -- 'pension' | 'study_fund' | 'other'
  amount         numeric(12,2) NOT NULL,
  payment_month  date         NOT NULL,   -- first day of the month
  notes          text,
  created_at     timestamptz  DEFAULT now()
);

ALTER TABLE personal_provisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personal_provisions_owner" ON personal_provisions
  FOR ALL USING (auth.uid() = user_id);
