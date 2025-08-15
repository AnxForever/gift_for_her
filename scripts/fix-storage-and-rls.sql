-- Create comprehensive storage bucket and RLS policies
-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their photos" ON storage.objects;

-- Create storage policies for photos bucket
CREATE POLICY "Users can upload photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'photos'
);

CREATE POLICY "Users can delete their photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure photos table has proper RLS policies
DROP POLICY IF EXISTS "Users can insert their own photos" ON photos;
DROP POLICY IF EXISTS "Users can view all photos" ON photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON photos;

CREATE POLICY "Users can insert their own photos" ON photos
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all photos" ON photos
FOR SELECT USING (true);

CREATE POLICY "Users can update their own photos" ON photos
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" ON photos
FOR DELETE USING (auth.uid() = user_id);
