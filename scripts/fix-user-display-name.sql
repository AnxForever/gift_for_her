-- 修复用户的display_name数据
-- 将邮箱为3475872056@qq.com的用户的display_name更新为anxforever

UPDATE user_profiles 
SET display_name = 'anxforever'
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = '3475872056@qq.com'
);

-- 验证更新结果
SELECT up.username, up.display_name, au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = '3475872056@qq.com';
