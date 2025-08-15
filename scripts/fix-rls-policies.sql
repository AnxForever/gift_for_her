-- Fix Row Level Security policies for user_profiles table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create proper RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Also fix policies for photos table
DROP POLICY IF EXISTS "Users can view own photos" ON photos;
DROP POLICY IF EXISTS "Users can create own photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;

CREATE POLICY "Users can view own photos" ON photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own photos" ON photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON photos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON photos
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on photos table
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
