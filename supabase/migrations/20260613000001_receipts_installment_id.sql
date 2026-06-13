-- Link receipts to a specific installment (nullable — null means belongs to the expense regardless of installment)
-- Used for recurring expenses so each month can have its own receipt(s)
ALTER TABLE receipts ADD COLUMN installment_id uuid REFERENCES expense_installments ON DELETE CASCADE;
