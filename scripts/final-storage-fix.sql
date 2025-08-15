-- 创建最终的存储和RLS策略修复
-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Users can upload photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'photos' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR bucket_id = 'photos')
);

CREATE POLICY "Users can delete photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure photos table RLS policies are correct
DROP POLICY IF EXISTS "Users can manage their photos" ON photos;
DROP POLICY IF EXISTS "Users can view their photos" ON photos;
DROP POLICY IF EXISTS "Users can insert their photos" ON photos;

CREATE POLICY "Users can manage their photos" ON photos
FOR ALL USING (auth.uid() = user_id);

-- Make sure storage_path can be null for flexibility
ALTER TABLE photos ALTER COLUMN storage_path DROP NOT NULL;
