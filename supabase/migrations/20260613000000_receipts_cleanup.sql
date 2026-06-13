-- Allow cloudinary fields to be nulled out when a receipt is archived
ALTER TABLE receipts ALTER COLUMN cloudinary_public_id DROP NOT NULL;
ALTER TABLE receipts ALTER COLUMN cloudinary_url DROP NOT NULL;

-- Track when (and if) a receipt was cleaned up from Cloudinary
ALTER TABLE receipts ADD COLUMN cleaned_up_at timestamptz;
