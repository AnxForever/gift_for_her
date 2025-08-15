-- Fix storage_path column to allow null values temporarily
-- This provides flexibility for different photo sources (uploaded vs base64)

ALTER TABLE photos ALTER COLUMN storage_path DROP NOT NULL;

-- Update existing records that might have null storage_path
UPDATE photos 
SET storage_path = COALESCE(storage_path, image_url, 'legacy/' || id::text)
WHERE storage_path IS NULL OR storage_path = '';

-- Add a check constraint to ensure storage_path is not empty string
ALTER TABLE photos ADD CONSTRAINT storage_path_not_empty 
CHECK (storage_path IS NULL OR length(trim(storage_path)) > 0);
