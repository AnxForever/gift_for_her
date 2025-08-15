-- 删除现有表（如果存在）
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS user_profiles;

-- 重新创建用户配置表
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 重新创建照片表
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('travel', 'selfie', 'festival', 'daily')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tags TEXT[],
  location TEXT,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 重新创建索引
CREATE INDEX photos_user_id_idx ON photos(user_id);
CREATE INDEX photos_category_idx ON photos(category);
CREATE INDEX photos_created_at_idx ON photos(created_at);

-- 重新设置行级安全策略
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 用户配置表策略
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 照片表策略
CREATE POLICY "Users can view all photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Users can insert own photos" ON photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own photos" ON photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON photos FOR DELETE USING (auth.uid() = user_id);
