-- 完全删除有问题的user_profiles表
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 只保留photos表，使用auth.uid()作为用户标识
ALTER TABLE photos 
DROP CONSTRAINT IF EXISTS photos_user_id_fkey;

-- 确保photos表使用正确的用户ID引用
ALTER TABLE photos 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 为photos表创建简单的RLS策略
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own photos" ON photos;
CREATE POLICY "Users can manage their own photos" ON photos
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view photos" ON photos;
CREATE POLICY "Anyone can view photos" ON photos
FOR SELECT USING (true);
