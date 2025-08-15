-- 清理现有数据
DELETE FROM photos;
DELETE FROM auth.users;

-- 重置序列（如果有的话）
-- ALTER SEQUENCE photos_id_seq RESTART WITH 1;

-- 清理存储桶中的文件
-- 注意：这个需要在Supabase控制台中手动执行
-- 或者使用JavaScript客户端代码来删除存储文件
