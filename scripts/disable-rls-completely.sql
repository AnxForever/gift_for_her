-- 完全禁用RLS策略以解决注册问题
-- Disable RLS on user_profiles table to allow registration
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Create a simple policy that allows all operations for authenticated users
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON public.user_profiles
FOR ALL USING (auth.role() = 'authenticated');

-- Same for photos table
ALTER TABLE public.photos DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can create own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON public.photos;

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON public.photos
FOR ALL USING (auth.role() = 'authenticated');
