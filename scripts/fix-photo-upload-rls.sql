-- Fix RLS policies for photo uploads
-- This script creates more permissive policies to allow photo uploads

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own photos" ON photos;
DROP POLICY IF EXISTS "Users can create own photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;
DROP POLICY IF EXISTS "Users can view all photos" ON photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON photos;

-- Create more permissive policies that work with service role
CREATE POLICY "Allow authenticated users to view all photos" ON photos
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert photos" ON photos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update their own photos" ON photos
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Allow users to delete their own photos" ON photos
    FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Also create storage policies for photo uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Allow users to delete their own photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
